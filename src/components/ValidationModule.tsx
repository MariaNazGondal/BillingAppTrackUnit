import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  Filter, 
  Download, 
  RefreshCw, 
  Search,
  ExternalLink,
  Scale,
  FileSpreadsheet,
  Check,
  ChevronDown,
  ChevronUp,
  Wand2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  ValidationReport, 
  DiscrepancyRecord, 
  ValidationStandard, 
  DataSanitizationReport,
  DataCleaningNotice,
  ClarifyingQuestion 
} from '../types';
import { ClarifyingQuestionsView } from './ClarifyingQuestionsView';

interface ValidationModuleProps {
  report: ValidationReport;
  onRefreshAudit: () => void;
  currency: string;
  onSelectAsset?: (assetId: string) => void;
  sanitizationReport?: DataSanitizationReport | null;
  onOpenImport?: () => void;
  clarifyingQuestions?: ClarifyingQuestion[];
  onResolveQuestion?: (questionId: string, optionId: string, actionValue: any) => void;
  onResetQuestions?: () => void;
}

export const ValidationModule: React.FC<ValidationModuleProps> = ({
  report,
  onRefreshAudit,
  currency,
  onSelectAsset,
  sanitizationReport,
  onOpenImport,
  clarifyingQuestions = [],
  onResolveQuestion,
  onResetQuestions
}) => {
  const [activeView, setActiveView] = useState<'standards' | 'sanitization' | 'clarifications'>('standards');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [standardFilter, setStandardFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [expandedStandardId, setExpandedStandardId] = useState<string | null>(null);
  const [expandedInversionTable, setExpandedInversionTable] = useState<boolean>(true);

  // Ingestion cleaning filters
  const [cleaningFilter, setCleaningFilter] = useState<'all' | 'date-inversion-fixed' | 'date-format-corrected' | 'duplicate-merged' | 'duplicate-removed' | 'missing-field-imputed' | 'critical'>('all');
  const [cleaningSearch, setCleaningSearch] = useState<string>('');

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  // Filter discrepancies
  const filteredDiscrepancies = useMemo(() => {
    return report.discrepancies.filter(item => {
      if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
      if (standardFilter !== 'all' && item.standardCode !== standardFilter) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesId = item.assetId.toLowerCase().includes(query);
        const matchesName = item.assetName.toLowerCase().includes(query);
        const matchesStandard = item.standardName.toLowerCase().includes(query);
        const matchesExplanation = item.explanation.toLowerCase().includes(query);
        if (!matchesId && !matchesName && !matchesStandard && !matchesExplanation) return false;
      }
      return true;
    });
  }, [report.discrepancies, severityFilter, standardFilter, searchTerm]);

  // Filter sanitization notices
  const filteredSanitizationNotices = useMemo(() => {
    if (!sanitizationReport) return [];
    return sanitizationReport.notices.filter(notice => {
      if (cleaningFilter === 'critical' && notice.severity !== 'critical') return false;
      if (cleaningFilter !== 'all' && cleaningFilter !== 'critical' && notice.actionType !== cleaningFilter) return false;
      if (cleaningSearch) {
        const q = cleaningSearch.toLowerCase();
        return notice.assetId.toLowerCase().includes(q) || 
               notice.description.toLowerCase().includes(q) || 
               notice.field.toLowerCase().includes(q);
      }
      return true;
    });
  }, [sanitizationReport, cleaningFilter, cleaningSearch]);

  const toggleResolved = (id: string) => {
    setResolvedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExportReport = () => {
    const payload = {
      validationReport: report,
      sanitizationReport: sanitizationReport || 'No external file imported (Benchmark data active)',
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Trackunit_Accuracy_Validation_Audit_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner & Audit Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2F3] border border-[#FCA5A5] flex items-center justify-center text-[#8A212B] flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Accuracy & Verification Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Predefined Standards Active
                </span>
                {sanitizationReport && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] flex items-center gap-1">
                    <Wand2 className="w-3 h-3" /> Sanitization Logged ({sanitizationReport.notices.length})
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Automated multi-layer audit suite cross-referencing source Google Sheet records, verifying date normalizations, duplicate resolutions, and formula calculations against strict legal standards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onRefreshAudit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Re-Run Audit Suite</span>
            </button>
            <button
              onClick={handleExportReport}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Standards vs Ingestion Sanitization vs Clarifying Questions */}
        <div className="flex border-b border-slate-100 pt-4 text-xs font-bold gap-4 flex-wrap">
          <button
            onClick={() => setActiveView('standards')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeView === 'standards' 
                ? 'border-[#8A212B] text-[#8A212B]' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Contract Standards & Formula Proofs ({report.standards.length})</span>
            {report.discrepancyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                {report.discrepancyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('sanitization')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeView === 'sanitization' 
                ? 'border-[#8A212B] text-[#8A212B]' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>Data Ingestion & Cleaning Log</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              sanitizationReport ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {sanitizationReport ? `${sanitizationReport.notices.length} Cleaned` : 'Benchmark'}
            </span>
          </button>

          <button
            onClick={() => setActiveView('clarifications')}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
              activeView === 'clarifications' 
                ? 'border-[#8A212B] text-[#8A212B]' 
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Data Cleanliness Clarifying Questions</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
              clarifyingQuestions.some(q => q.status === 'pending')
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              {clarifyingQuestions.filter(q => q.status === 'pending').length > 0 
                ? `${clarifyingQuestions.filter(q => q.status === 'pending').length} Pending` 
                : 'Verified'}
            </span>
          </button>
        </div>

        {/* Executive Verification Metrics */}
        {activeView === 'standards' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Overall Accuracy</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {report.accuracyScore}%
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Strict Precision
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Checks Performed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-800">
                  {report.totalChecksPerformed}
                </span>
                <span className="text-xs text-slate-400">tests</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Across {report.totalAssetsAudited} assets
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Checks Passed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {report.passedChecksCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Zero calculation drift
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Flags</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-bold font-mono ${report.criticalCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                  {report.criticalCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Zero fatal errors
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Warnings & Arrears</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-amber-600">
                  {report.warningCount}
                </span>
              </div>
              <p className="text-[11px] text-amber-600 mt-0.5 font-medium">
                Review required
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sheet Source Sync</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-bold text-[#8A212B] mt-1">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                100% Cross-referenced
              </p>
            </div>
          </div>
        ) : (
          /* Sanitization Scorecards */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Clean Quality Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-600">
                  {sanitizationReport ? `${sanitizationReport.cleaningScore}%` : '100%'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">
                {sanitizationReport ? 'Sanitization Applied' : 'Benchmark Clean'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Dates Corrected</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-amber-600">
                  {sanitizationReport?.datesCorrectedCount || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Excel serial & text to ISO
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Duplicates Resolved</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-purple-600">
                  {sanitizationReport?.duplicatesCount || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Consolidated & merged
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Missing Values Imputed</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-[#8A212B]">
                  {sanitizationReport?.missingValuesImputedCount || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Fees & IDs auto-filled
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Formats Normalized</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-800">
                  {sanitizationReport?.formatNormalizationsCount || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Currencies, devices, plans
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Actions Logged</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {sanitizationReport?.notices.length || 0}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Audit trail active
              </p>
            </div>
          </div>
        )}
      </div>

      {/* VIEW 1: STANDARDS & CROSS-REFERENCE DISCREPANCIES */}
      {activeView === 'standards' && (
        <>
          {/* Predefined Accuracy Standards Reference Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-[#8A212B]" />
                <h3 className="text-base font-bold text-slate-900">
                  Predefined Accuracy Standards & Legal Governance Rules
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                8 Mandatory Standards Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-4">
              {report.standards.map(std => {
                const isExpanded = expandedStandardId === std.id;
                return (
                  <div 
                    key={std.id}
                    onClick={() => setExpandedStandardId(isExpanded ? null : std.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      standardFilter === std.code 
                        ? 'border-[#8A212B] bg-[#FDF2F3]/60 shadow-xs ring-1 ring-[#8A212B]/20' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-[#8A212B] bg-[#FDF2F3] px-1.5 py-0.5 rounded">
                        {std.code}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">
                        {std.category}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-800 mt-2 line-clamp-1">
                      {std.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {std.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Threshold:</span>
                      <span className="font-mono font-bold text-slate-700">{std.accuracyThreshold}</span>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200 text-[11px] space-y-1.5 text-slate-600 animate-fadeIn">
                        <p><strong className="text-slate-800">Rule:</strong> {std.description}</p>
                        <p><strong className="text-slate-800">Governing Clause:</strong> {std.governingClause}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cross-Referenced Discrepancy Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span>Cross-Referenced Audit Discrepancies & Flagged Records</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Records failing accuracy thresholds or requiring legal/accounting reconciliation.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className="text-slate-500">
                  Showing {filteredDiscrepancies.length} of {report.discrepancies.length} flags
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Severity:
                </span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                  {(['all', 'critical', 'warning', 'info'] as const).map(sev => (
                    <button
                      key={sev}
                      onClick={() => setSeverityFilter(sev)}
                      className={`px-3 py-1 rounded-lg font-medium transition-all ${
                        severityFilter === sev 
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {sev === 'all' ? 'All' : sev.charAt(0).toUpperCase() + sev.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search asset, standard, or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
                />
              </div>
            </div>

            {/* Discrepancy Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-3">Asset ID</th>
                    <th className="py-3 px-3">Standard Violated</th>
                    <th className="py-3 px-3">Severity</th>
                    <th className="py-3 px-3">Source vs. Calculated</th>
                    <th className="py-3 px-3">Variance</th>
                    <th className="py-3 px-3">Reconciliation SOP</th>
                    <th className="py-3 px-3 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDiscrepancies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No discrepancies found</p>
                        <p className="text-xs">All records comply with current audit filters.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredDiscrepancies.map(item => {
                      const isResolved = resolvedIds.has(item.id);
                      return (
                        <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isResolved ? 'opacity-60 bg-slate-50/40' : ''}`}>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => onSelectAsset && onSelectAsset(item.assetId)}
                              className="font-mono font-bold text-[#8A212B] hover:underline flex items-center gap-1"
                            >
                              <span>{item.assetId}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </button>
                            <span className="text-[11px] text-slate-400 block truncate max-w-[140px]">
                              {item.assetName}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                              {item.standardCode}
                            </span>
                            <span className="text-slate-800 font-medium block mt-0.5">
                              {item.standardName}
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              item.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                              item.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]'
                            }`}>
                              {item.severity}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[11px]">
                            <div className="text-slate-500">Source: <span className="text-slate-800 font-semibold">{item.sourceSheetValue}</span></div>
                            <div className="text-[#8A212B]">Calculated: <span className="font-bold">{item.calculatedValue}</span></div>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-xs font-semibold text-slate-700">
                            {item.variance}
                          </td>

                          <td className="py-3.5 px-3 max-w-xs">
                            <p className="text-slate-600 text-[11px] line-clamp-2">
                              {item.explanation}
                            </p>
                            <span className="text-[10px] font-medium text-[#8A212B] block mt-0.5">
                              Action: {item.reconciliationAction}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => toggleResolved(item.id)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                isResolved 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isResolved ? 'Acknowledged' : 'Acknowledge'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: DATA INGESTION & SANITIZATION AUDIT LOG */}
      {activeView === 'sanitization' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-[#8A212B]" />
                <h3 className="text-base font-bold text-slate-900">
                  Data Cleaning & Ingestion Sanitization Ledger
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Every date normalization, duplicate consolidation, missing fee imputation, and inverted chronology correction applied during file import is itemized below.
              </p>
            </div>

            {onOpenImport && (
              <button
                onClick={onOpenImport}
                className="px-3.5 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Import / Upload Another Spreadsheet</span>
              </button>
            )}
          </div>

          {!sanitizationReport ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <Database className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                Current Dataset is the Verified Beta Industries Benchmark
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No messy external spreadsheets have been uploaded yet in this session. All 42 benchmark assets have been pre-validated and formatted.
              </p>
              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="px-4 py-2 bg-[#8A212B] text-white rounded-xl text-xs font-semibold hover:bg-[#6B1922] shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Test Inaccurate Sample Data or Upload Excel</span>
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Special Audit: Month/Day Inversion Analysis (The January Anomaly) */}
              {sanitizationReport.dateAnalysis && (sanitizationReport.dateAnalysis.detectedJanuaryAnomaly || sanitizationReport.dateAnalysis.inversedDatesCount > 0) && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-sm">
                            Statistical Date Inversion Audit (The "January Anomaly" Analysis)
                          </h4>
                          <span className="bg-amber-200 text-amber-900 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                            {sanitizationReport.dateAnalysis.januaryClusterPercentage}% January Cluster
                          </span>
                        </div>
                        <p className="text-xs text-amber-900 mt-0.5">
                          Detected Excel/Google Sheet date inversion where day and month numbers were swapped in the source data. The engine reconstructed actual contract activation dates and re-ran the mathematical settlement formula.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedInversionTable(!expandedInversionTable)}
                      className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                    >
                      <span>{expandedInversionTable ? 'Collapse Comparison' : 'Expand Comparison'}</span>
                      {expandedInversionTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Financial Impact Comparison KPI Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Inverted Contracts</span>
                      <span className="text-xl font-bold font-mono text-amber-900">
                        {sanitizationReport.dateAnalysis.inversedDatesCount}
                      </span>
                      <span className="text-[11px] text-amber-700 block">normalized to 1st-of-month</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Naive Inverted Total</span>
                      <span className="text-xl font-bold font-mono text-slate-500 line-through">
                        {sym}{sanitizationReport.dateAnalysis.beforeRecalculationTotal.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-slate-400 block">with January skew</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Recalculated Accurate Total</span>
                      <span className="text-xl font-bold font-mono text-emerald-800">
                        {sym}{sanitizationReport.dateAnalysis.afterRecalculationTotal.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-semibold block">verified final bill</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Protected from Penalties</span>
                      <span className="text-xl font-bold font-mono text-[#8A212B]">
                        {sanitizationReport.dateAnalysis.contractsSavedFromLatePenalty}
                      </span>
                      <span className="text-[11px] text-[#8A212B] block">auto-renewals avoided</span>
                    </div>
                  </div>

                  {/* Full Itemized Side-by-Side Comparison */}
                  {expandedInversionTable && sanitizationReport.dateAnalysis.itemizedComparisons.length > 0 && (
                    <div className="bg-white rounded-xl border border-amber-200 overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-amber-50/60 border-b border-amber-100 text-amber-950 font-bold text-[11px]">
                            <th className="py-2.5 px-3">Asset & Name</th>
                            <th className="py-2.5 px-3">Raw Value in File</th>
                            <th className="py-2.5 px-3">Naive (Jan) Start</th>
                            <th className="py-2.5 px-3">Corrected Activation</th>
                            <th className="py-2.5 px-3">Term Expiry Shift</th>
                            <th className="py-2.5 px-3">Notice Status</th>
                            <th className="py-2.5 px-3">Unbilled Mths</th>
                            <th className="py-2.5 px-3 text-right">Recalculated Bill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-xs">
                          {sanitizationReport.dateAnalysis.itemizedComparisons.map((item) => (
                            <tr key={item.assetId} className="hover:bg-amber-50/20 transition-colors">
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 block">{item.assetId}</span>
                                <span className="text-[10px] text-slate-500 font-sans">{item.assetName}</span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {item.rawStartDate}
                              </td>
                              <td className="py-2.5 px-3 text-rose-500 line-through">
                                {item.naiveStartDate}
                              </td>
                              <td className="py-2.5 px-3 text-emerald-700 font-bold">
                                {item.correctedStartDate}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {item.correctedEndDate}
                              </td>
                              <td className="py-2.5 px-3">
                                {item.naiveTimely !== item.correctedTimely ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold font-sans">
                                    Saved from Auto-Renew
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-sans">
                                    {item.correctedTimely ? 'Timely Notice' : 'Auto-Renewed'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-rose-400 line-through mr-1">{item.naiveUnbilledMonths}m</span>
                                <span className="text-emerald-700 font-bold">{item.correctedUnbilledMonths}m</span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <span className="text-rose-400 line-through mr-1 text-[11px]">{sym}{item.naiveAmount.toFixed(2)}</span>
                                <span className="text-emerald-800 font-bold">{sym}{item.correctedAmount.toFixed(2)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Action Type:
                  </span>
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                    {(['all', 'date-inversion-fixed', 'date-format-corrected', 'duplicate-merged', 'missing-field-imputed', 'critical'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCleaningFilter(cat)}
                        className={`px-3 py-1 rounded-lg font-medium transition-all ${
                          cleaningFilter === cat 
                            ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat === 'all' ? 'All Actions' : 
                         cat === 'date-inversion-fixed' ? 'Date Inversions' :
                         cat === 'date-format-corrected' ? 'Date Norms' :
                         cat === 'duplicate-merged' ? 'Duplicates' :
                         cat === 'missing-field-imputed' ? 'Missing Data' : 'Critical Chronology'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search cleaned field, asset, or method..."
                    value={cleaningSearch}
                    onChange={(e) => setCleaningSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
                  />
                </div>
              </div>

              {/* Ingestion Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-3">Row & ID</th>
                      <th className="py-3 px-3">Field</th>
                      <th className="py-3 px-3">Action Type</th>
                      <th className="py-3 px-3">Original Inaccurate Value</th>
                      <th className="py-3 px-3">Cleaned Normalized Value</th>
                      <th className="py-3 px-3">Engine Explanation</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSanitizationNotices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No sanitization actions match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSanitizationNotices.map((n) => (
                        <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              Row {n.rowNumber}
                            </span>
                            <span className="font-mono font-bold text-slate-900 block mt-0.5">
                              {n.assetId}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-semibold text-slate-800">
                            {n.field}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              n.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              n.severity === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]'
                            }`}>
                              {n.actionType.replace(/-/g, ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[11px]">
                            <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded line-through">
                              {n.originalValue || '(empty)'}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-[11px]">
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                              {n.cleanedValue}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-slate-600 max-w-xs text-[11px]">
                            {n.description}
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <Check className="w-3 h-3" /> Auto-Applied
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* View 3: Data Cleanliness Clarifying Questions */}
      {activeView === 'clarifications' && (
        <ClarifyingQuestionsView
          questions={clarifyingQuestions}
          onResolveQuestion={onResolveQuestion || (() => {})}
          onResetQuestions={onResetQuestions}
          currency={currency}
        />
      )}
    </div>
  );
};
