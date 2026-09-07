import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  SubscriptionRecord, 
  SettlementResult, 
  ExecutiveSummary,
  FormulaPresetId,
  DataSanitizationReport,
  ClarifyingQuestion
} from './types';
import { BETA_INDUSTRIES_BENCHMARK_DATA } from './data/betaIndustriesData';
import { calculateSettlementSummary } from './utils/calculator';
import { calculateSubscriptionWithFormula, FORMULA_PRESETS } from './utils/formulaEngine';
import { runValidationAudit } from './utils/validationEngine';

import { Header, AppTab } from './components/Header';
import { KpiSummaryCards } from './components/KpiSummaryCards';
import { SettlementTable } from './components/SettlementTable';
import { TermsAndConditionsSection } from './components/TermsAndConditionsSection';
import { PublishedFormulasSection } from './components/PublishedFormulasSection';
import { AuditorNotes } from './components/AuditorNotes';
import { Visualizations } from './components/Visualizations';
import { ValidationModule } from './components/ValidationModule';
import { ImportModal } from './components/ImportModal';
import { CustomerFacingStatementModal } from './components/CustomerFacingStatementModal';
import { SimplifiedInvoiceModal } from './components/SimplifiedInvoiceModal';
import { DataIngestionUploadBanner } from './components/DataIngestionUploadBanner';
import { DataCleaningCenter } from './components/DataCleaningCenter';
import { Wand2, X, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';

const DEFAULT_CLARIFYING_QUESTIONS: ClarifyingQuestion[] = [
  {
    id: 'cq-date-inversion',
    category: 'Date Chronology',
    question: `Authoritative Contract Dates: Month/Day Inversion ('January Anomaly') Analysis`,
    context: `In Beta Industries' original telematics records, contract commencement dates appeared formatted with month and day reversed (e.g. 09/01/2022 parsed as Jan 9 instead of Sep 1). European telematics agreements activate on the 1st of the month.`,
    impactOnBilling: `Treating dates as January activations would impose €8,710.00 in unwarranted 12-month auto-renewal late penalties for July 2025 termination notices.`,
    recommendedAction: `Enforce European DD/MM format with 1st-of-month alignment to reflect true activation dates.`,
    status: 'resolved',
    resolvedAction: 'European DD/MM & 1st-of-Month Alignment (Accurate & Recommended)',
    options: [
      {
        id: 'opt-date-eur-clean',
        label: 'European DD/MM & 1st-of-Month Alignment (Accurate & Recommended)',
        actionValue: 'eur-dd-mm',
        financialEffect: 'Prevents €8,710.00 in unwarranted late renewal charges'
      },
      {
        id: 'opt-date-naive-us',
        label: 'Literal US MM/DD Format (Treat all as January starts)',
        actionValue: 'us-mm-dd',
        financialEffect: 'Forces all contracts into January, triggering automatic renewal'
      }
    ]
  },
  {
    id: 'cq-sla-tier',
    category: 'SLA & Credit Memo',
    question: `Does Beta Industries hold an active Trackunit Premium SLA (with 99.8% uptime commitment & 5% credit memo remedy)?`,
    context: `Pursuant to Trackunit's published Service Level Agreement (https://trackunit.com/service-level-agreement/), Standard SLA provides high platform availability without credit remedies. Premium SLA provides a 99.8% monthly uptime guarantee and a 5% credit memo against monthly license fees for qualifying claims filed within 30 days.`,
    impactOnBilling: `Standard SLA assesses 100% of unissued fee obligations (€47,385.00); Premium SLA deducts a 5% SLA credit memo (-€2,369.25).`,
    recommendedAction: `Verify whether customer Beta Industries submitted a valid 30-day availability incident claim before applying credit memo.`,
    status: 'pending',
    options: [
      {
        id: 'opt-sla-standard',
        label: 'Standard SLA — Full Section 2 Obligation (No Credit Memo)',
        actionValue: 'standard',
        financialEffect: 'Full 100% contractual settlement under Section 2 master terms'
      },
      {
        id: 'opt-sla-premium',
        label: 'Premium SLA — Apply 5% Credit Memo Offset (99.8% Uptime Remedy)',
        actionValue: 'premium-5',
        financialEffect: '5% credit memo offset applied across unbilled balance'
      }
    ]
  },
  {
    id: 'cq-contract-term',
    category: 'Contract Term Duration',
    question: `Are Beta Industries' equipment units governed by Trackunit's standard 36-month initial term or 42-month OEM extended term?`,
    context: `Trackunit standard fleet agreements specify a 36-month initial term. Select OEM-embedded machinery contracts specify an extended 42-month initial term, altering the 3-month notice cutoff deadline accordingly.`,
    impactOnBilling: `A 42-month term shifts the notice cutoff window forward by 6 months, altering timely vs late auto-renewal classifications.`,
    recommendedAction: `Use governing 36-month Initial Term pursuant to Trackunit T&C Section 2 unless OEM rider is present.`,
    status: 'pending',
    options: [
      {
        id: 'opt-term-36',
        label: 'Standard 36-Month Initial Term (Governing T&C Section 2 Standard)',
        actionValue: 36,
        financialEffect: 'Standard baseline contractual calculation'
      },
      {
        id: 'opt-term-42',
        label: '42-Month OEM Heavy Equipment Extended Term',
        actionValue: 42,
        financialEffect: 'Extends initial commitment period by 6 months'
      }
    ]
  },
  {
    id: 'cq-duplicates',
    category: 'Duplicate Resolution',
    question: `Duplicate & Serial Integrity Verification`,
    context: `Customer telematics spreadsheets sometimes contain duplicate rows for the same physical unit or reassigned hardware serial numbers.`,
    impactOnBilling: `Deduplicating rows ensures Beta Industries is never double-billed for the same physical unit.`,
    recommendedAction: `Consolidate duplicate records and retain latest invoiced date.`,
    status: 'resolved',
    resolvedAction: 'Consolidate & Keep Latest Invoiced Date (Recommended)',
    options: [
      {
        id: 'opt-consolidate-latest',
        label: 'Consolidate & Keep Latest Invoiced Date (Recommended)',
        actionValue: 'consolidate',
        financialEffect: 'Prevents double-charging, ensures maximum invoiced credit accuracy'
      },
      {
        id: 'opt-keep-all',
        label: 'Keep All Rows as Independent Units (May Double Charge)',
        actionValue: 'keep-all',
        financialEffect: 'Charges for every row in sheet regardless of ID duplication'
      }
    ]
  }
];

export default function App() {
  // Start completely blank - ready for user file upload
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [noticeDate, setNoticeDate] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [activeTab, setActiveTab] = useState<AppTab>('cleaning');
  const [selectedFormulaPreset, setSelectedFormulaPreset] = useState<FormulaPresetId>('strict-tc-section-2');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [auditRunCount, setAuditRunCount] = useState(0);

  // Ingestion and data cleaning state
  const [sanitizationReport, setSanitizationReport] = useState<DataSanitizationReport | null>(null);
  const [showSanitizationBanner, setShowSanitizationBanner] = useState<boolean>(false);
  const [clarifyingQuestions, setClarifyingQuestions] = useState<ClarifyingQuestion[]>(DEFAULT_CLARIFYING_QUESTIONS);

  const activeFormulaConfig = useMemo(() => {
    return FORMULA_PRESETS[selectedFormulaPreset] || FORMULA_PRESETS['strict-tc-section-2'];
  }, [selectedFormulaPreset]);

  // Calculate settlement results dynamically for every asset using active formula model
  const results = useMemo(() => {
    if (subscriptions.length === 0 || !noticeDate) {
      return [];
    }
    return subscriptions.map(sub => calculateSubscriptionWithFormula(sub, noticeDate, activeFormulaConfig));
  }, [subscriptions, noticeDate, activeFormulaConfig]);

  // Aggregate executive summary
  const summary = useMemo(() => {
    return calculateSettlementSummary(results);
  }, [results]);

  // Run comprehensive validation and verification audit against predefined accuracy standards
  const validationReport = useMemo(() => {
    // Audit runs against both calculated results and raw benchmark source
    return runValidationAudit(results, subscriptions, noticeDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, subscriptions, noticeDate, auditRunCount]);

  // Export to Excel CSV
  const handleExportCsv = () => {
    const exportRows = results.map(r => ({
      'Asset ID': r.subscription.assetId,
      'Description': r.subscription.assetName,
      'Device Type': r.subscription.deviceType,
      'Serial Number': r.subscription.serialNumber,
      'Plan Tier': r.subscription.planType,
      'Billing Frequency': r.subscription.billingFrequency,
      'Monthly Rate': r.subscription.monthlyFee.toFixed(2),
      'Contract Activation Date': r.subscription.startDate,
      'Current Term Expiry': r.currentTermEndDate,
      '3-Month Notice Cutoff': r.noticeDeadlineDate,
      'Notice Submission Date': r.noticeGivenDate,
      'Notice Timely?': r.isNoticeTimely ? 'YES (Timely)' : 'NO (Late - Auto Renewed)',
      'Contractual Cancellation Date': r.effectiveCancellationDate,
      'Last Invoiced Billed-To Date': r.subscription.billedToDate,
      'Unbilled Months Remaining': r.unbilledMonths,
      'Total Settlement Charge': r.remainingObligation.toFixed(2),
      'Prepaid Non-Refundable': r.overbilledAmount.toFixed(2),
      'Formula Applied': r.formulaApplied,
      'Audit Flags': r.subscription.inconsistencies?.map(i => `[${i.field}] ${i.description}`).join(' | ') || 'None'
    }));

    const csvString = Papa.unparse(exportRows);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCustomer = (customerName || 'Fleet').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `Trackunit_Final_Settlement_${safeCustomer}_${noticeDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetData = () => {
    setSubscriptions([]);
    setCustomerName('');
    setLoadedFileName(null);
    setNoticeDate('');
    setSanitizationReport(null);
    setShowSanitizationBanner(false);
    setSelectedFormulaPreset('strict-tc-section-2');
    setActiveTab('cleaning');
  };

  const handleLoadDemoData = () => {
    setSubscriptions(BETA_INDUSTRIES_BENCHMARK_DATA);
    setCustomerName('Beta Industries ApS');
    setLoadedFileName('Beta_Industries_Telematics_Fleet.xlsx');
    setNoticeDate('2025-07-31');
    setActiveTab('cleaning');
  };

  const handleResolveClarifyingQuestion = (questionId: string, optionId: string, actionValue: any) => {
    setClarifyingQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;
      const selectedOpt = q.options?.find(o => o.id === optionId);
      return {
        ...q,
        status: 'resolved',
        resolvedAction: selectedOpt ? selectedOpt.label : String(actionValue)
      };
    }));

    // Authoritative real-time action handler
    if (actionValue === 'premium-5') {
      setSelectedFormulaPreset('trackunit-premium-sla-credit');
    } else if (actionValue === 'standard') {
      setSelectedFormulaPreset('strict-tc-section-2');
    } else if (actionValue === 42) {
      setSelectedFormulaPreset('trackunit-42mo-oem');
    } else if (actionValue === 36) {
      setSelectedFormulaPreset('strict-tc-section-2');
    } else if (actionValue === 'eur-dd-mm') {
      // European day/month preserved
    } else if (actionValue === 'us-mm-dd') {
      // If user specifically requests US naive dates
    }
  };

  const handleImportSuccess = (
    newRecords: SubscriptionRecord[], 
    report?: DataSanitizationReport, 
    fileName?: string,
    detectedNoticeDate?: string
  ) => {
    setSubscriptions(newRecords);
    if (fileName) {
      setLoadedFileName(fileName);
      const cleanName = fileName
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/benchmark|sample|template|data|export|fleet|trackunit/gi, '')
        .trim();
      if (cleanName.length > 2) {
        setCustomerName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      } else {
        setCustomerName('Customer Fleet');
      }
    } else if (!customerName) {
      setCustomerName('Customer Fleet');
    }

    // Fill up notice date if currently blank
    if (detectedNoticeDate) {
      setNoticeDate(detectedNoticeDate);
    } else if (!noticeDate) {
      const maxBilled = newRecords
        .map(r => r.billedToDate)
        .filter(Boolean)
        .sort()
        .pop();
      setNoticeDate(maxBilled || '2025-07-31');
    }

    if (report && report.notices.length > 0) {
      setSanitizationReport(report);
      setShowSanitizationBanner(true);
      if (report.clarifyingQuestions && report.clarifyingQuestions.length > 0) {
        setClarifyingQuestions(report.clarifyingQuestions);
      }
    } else {
      setSanitizationReport(null);
      setShowSanitizationBanner(false);
    }
    setActiveTab('cleaning');
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    setTimeout(() => {
      const el = document.getElementById('active-tab-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 40);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-[#FDF2F3] selection:text-[#8A212B]">
      {/* Header & Controls */}
      <Header
        customerName={customerName}
        onCustomerNameChange={setCustomerName}
        loadedFileName={loadedFileName}
        noticeDate={noticeDate}
        onNoticeDateChange={setNoticeDate}
        currency={currency}
        onCurrencyChange={setCurrency}
        onExportCsv={handleExportCsv}
        onOpenStatement={() => setIsStatementModalOpen(true)}
        onOpenInvoice={() => setIsInvoiceModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onResetData={handleResetData}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        flaggedCount={summary.flaggedInconsistenciesCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Prominent File Ingestion & Customer Case Controller */}
        <DataIngestionUploadBanner
          customerName={customerName}
          onCustomerNameChange={setCustomerName}
          noticeDate={noticeDate}
          onNoticeDateChange={setNoticeDate}
          onImportSuccess={handleImportSuccess}
          onResetBenchmark={handleResetData}
          activeRecordCount={subscriptions.length}
          loadedFileName={loadedFileName}
          sanitizationReport={sanitizationReport}
          onInspectAudit={() => handleTabChange('cleaning')}
        />

        {/* Data Sanitization Alert Banner */}
        {showSanitizationBanner && sanitizationReport && (
          <div className="mb-4 bg-gradient-to-r from-[#8A212B] to-[#59141B] text-white rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Wand2 className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="text-xs">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <span>Data Ingestion & Cleaning Engine Applied</span>
                  <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.2 rounded-full text-[10px]">
                    Clean Score: {sanitizationReport.cleaningScore}%
                  </span>
                  {sanitizationReport.dateAnalysis && (sanitizationReport.dateAnalysis.detectedJanuaryAnomaly || sanitizationReport.dateAnalysis.inversedDatesCount > 0) && (
                    <span className="bg-amber-400/25 text-amber-100 border border-amber-300/40 px-2 py-0.2 rounded-full text-[10px] font-semibold">
                      ⚠️ {sanitizationReport.dateAnalysis.inversedDatesCount} January Date Inversions Resolved
                    </span>
                  )}
                </div>
                <p className="text-white/80 text-[11px] mt-0.5">
                  Processed {sanitizationReport.cleanedRowsCount} units: normalized {sanitizationReport.datesCorrectedCount} dates, resolved {sanitizationReport.duplicatesCount} duplicates, and auto-imputed {sanitizationReport.missingValuesImputedCount} missing values.
                  {sanitizationReport.dateAnalysis && sanitizationReport.dateAnalysis.inversedDatesCount > 0 && (
                    <span className="text-amber-200 font-medium ml-1">
                      (Recalculated bill impact: €{sanitizationReport.dateAnalysis.netFinancialImpact >= 0 ? '+' : ''}{sanitizationReport.dateAnalysis.netFinancialImpact.toFixed(2)} across fleet).
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => {
                  handleTabChange('cleaning');
                }}
                className="px-3 py-1.5 bg-white text-[#8A212B] hover:bg-[#FDF2F3] rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Inspect Data Cleaning & Dates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowSanitizationBanner(false)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg transition-colors"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Executive KPI Bar */}
        <KpiSummaryCards 
          summary={summary} 
          currency={currency} 
          noticeDate={noticeDate}
          onOpenInvoice={() => setIsInvoiceModalOpen(true)}
        />

        {/* Active Section Anchor & In-Page Navigator */}
        <div id="active-tab-section" className="scroll-mt-20 my-5">
          <div className="mb-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pl-2">Section:</span>
              {(
                [
                  { id: 'cleaning' as const, label: '1. Data Cleaning & Changes', count: sanitizationReport?.duplicatesCount ? sanitizationReport.duplicatesCount : undefined, badge: 'Zero-Dupes' },
                  { id: 'terms' as const, label: '2. Terms & Conditions', count: undefined, badge: 'trackunit.com' },
                  { id: 'formulas' as const, label: '3. Published Formulas', count: undefined, badge: 'Formula Matrix' },
                  { id: 'visuals' as const, label: '4. Visual Dashboard', count: undefined, badge: undefined },
                  { id: 'ledger' as const, label: '5. Settlement Ledger & PDF', count: results.length > 0 ? results.length : undefined, badge: undefined },
                  { id: 'notes' as const, label: 'Auditor Review', count: summary.flaggedInconsistenciesCount > 0 ? summary.flaggedInconsistenciesCount : undefined, badge: undefined }
                ]
              ).map(t => {
                const isActive = activeTab === t.id || 
                  (t.id === 'terms' && activeTab === 'tc-engine') ||
                  (t.id === 'ledger' && activeTab === 'table');
                return (
                  <button
                    key={t.id}
                    onClick={() => handleTabChange(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? 'bg-[#8A212B] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{t.label}</span>
                    {t.count !== undefined && t.count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
                        {t.count}
                      </span>
                    )}
                    {t.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-emerald-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'}`}>
                        {t.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="hidden lg:flex items-center gap-2 pr-2 text-xs font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Trackunit Telematics Live</span>
            </div>
          </div>

          {/* Step 1: Data Cleaning, Deduplication & Date Precision Center */}
          {activeTab === 'cleaning' && (
            <DataCleaningCenter
              subscriptions={subscriptions}
              sanitizationReport={sanitizationReport}
              onUpdateSubscriptions={(newSubs, newReport) => {
                setSubscriptions(newSubs);
                if (newReport) setSanitizationReport(newReport);
              }}
              currency={currency}
              noticeDate={noticeDate}
              customerName={customerName}
              onNoticeDateChange={(d) => setNoticeDate(d)}
              onCustomerNameChange={(c) => setCustomerName(c)}
              onOpenImport={() => setIsImportModalOpen(true)}
              onProceedToSettlement={() => handleTabChange('terms')}
              onProceedToTerms={() => handleTabChange('terms')}
              onLoadDemoData={handleLoadDemoData}
            />
          )}

          {/* Step 2: Terms & Conditions Engine */}
          {(activeTab === 'terms' || activeTab === 'tc-engine') && (
            <TermsAndConditionsSection 
              currentFormulaConfig={activeFormulaConfig}
              onSelectFormulaPreset={(preset) => setSelectedFormulaPreset(preset)}
              subscriptions={subscriptions}
              results={results}
              customerName={customerName}
              noticeDate={noticeDate}
              currency={currency}
              onProceedToSettlement={() => handleTabChange('formulas')}
              onProceedToFormulas={() => handleTabChange('formulas')}
            />
          )}

          {/* Step 3: Published Formulas */}
          {activeTab === 'formulas' && (
            <PublishedFormulasSection
              currentFormulaConfig={activeFormulaConfig}
              onSelectFormulaPreset={(preset) => setSelectedFormulaPreset(preset)}
              subscriptions={subscriptions}
              results={results}
              customerName={customerName}
              noticeDate={noticeDate}
              currency={currency}
              onProceedToVisuals={() => handleTabChange('visuals')}
              onOpenUpload={() => setIsImportModalOpen(true)}
            />
          )}

          {/* Step 4: Interactive Billing & Trend Visualizations */}
          {activeTab === 'visuals' && (
            <div className="space-y-4">
              <Visualizations 
                results={results} 
                summary={summary} 
                currency={currency} 
                sanitizationReport={sanitizationReport}
              />
              {results.length > 0 && (
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => handleTabChange('ledger')}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
                  >
                    <span>Proceed to Step 5: Settlement Ledger &amp; PDF Receipt</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: High-Level Settlement Ledger & PDF Receipt */}
          {(activeTab === 'ledger' || activeTab === 'table') && (
            <SettlementTable
              results={results}
              currency={currency}
              onImportNewDataset={handleImportSuccess}
              sanitizationReport={sanitizationReport}
              noticeDate={noticeDate}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              customerName={customerName}
              onUpdateRecord={(assetId, updatedFields) => {
                setSubscriptions(prev => prev.map(s => s.assetId === assetId ? { ...s, ...updatedFields } : s));
              }}
            />
          )}

          {/* Step 6: Audit & Legal Review Notes */}
          {activeTab === 'notes' && (
            <AuditorNotes 
              summary={summary} 
              currency={currency}
              customerName={customerName}
              noticeDate={noticeDate}
              results={results}
            />
          )}
        </div>
      </main>

      {/* Upload/Import Spreadsheet Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
        onResetBenchmark={handleResetData}
        caseNoticeDate={noticeDate}
      />

      {/* Customer-Facing Formal Settlement Statement Modal */}
      <CustomerFacingStatementModal
        isOpen={isStatementModalOpen}
        onClose={() => setIsStatementModalOpen(false)}
        results={results}
        summary={summary}
        currency={currency}
        noticeDate={noticeDate}
        customerName={customerName}
      />

      {/* Simplified Payment Invoice & Final PDF Receipt Modal */}
      <SimplifiedInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        results={results}
        summary={summary}
        currency={currency}
        noticeDate={noticeDate}
        customerName={customerName}
      />
    </div>
  );
}
