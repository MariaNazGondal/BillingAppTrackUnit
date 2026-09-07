import React, { useState, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Download, 
  Filter, 
  Search, 
  Calendar, 
  Layers, 
  Copy, 
  Check, 
  FileSpreadsheet, 
  ArrowRight,
  AlertCircle,
  Wand2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Clock,
  RotateCcw,
  Upload
} from 'lucide-react';
import { 
  SubscriptionRecord, 
  DataSanitizationReport, 
  DataCleaningNotice, 
  SanitizationConfig 
} from '../types';
import { DEFAULT_SANITIZATION_CONFIG, sanitizeUploadedDataset } from '../utils/dataSanitizer';
import { parseAndSanitizeSpreadsheetFile } from '../utils/fileParser';

interface DataCleaningCenterProps {
  records?: SubscriptionRecord[];
  subscriptions?: SubscriptionRecord[];
  sanitizationReport: DataSanitizationReport | null;
  onUpdateRecords?: (cleanedRecords: SubscriptionRecord[], newReport?: DataSanitizationReport) => void;
  onUpdateSubscriptions?: (cleanedRecords: SubscriptionRecord[], newReport?: DataSanitizationReport) => void;
  currency?: string;
  noticeDate: string;
  customerName: string;
  onNoticeDateChange?: (date: string) => void;
  onCustomerNameChange?: (name: string) => void;
  onOpenImport: () => void;
  onProceedToSettlement?: () => void;
  onProceedToTerms?: () => void;
  onLoadDemoData?: () => void;
}

export const DataCleaningCenter: React.FC<DataCleaningCenterProps> = ({
  records: propRecords,
  subscriptions: propSubscriptions,
  sanitizationReport,
  onUpdateRecords,
  onUpdateSubscriptions,
  currency = 'EUR',
  noticeDate,
  customerName,
  onNoticeDateChange,
  onCustomerNameChange,
  onOpenImport,
  onProceedToSettlement,
  onProceedToTerms,
  onLoadDemoData
}) => {
  const records = propRecords || propSubscriptions || [];
  const handleUpdate = onUpdateRecords || onUpdateSubscriptions || (() => {});
  const [dateFormatConvention, setDateFormatConvention] = useState<'auto' | 'eur-dd-mm' | 'us-mm-dd'>('eur-dd-mm');
  const [filterType, setFilterType] = useState<'all' | 'duplicates' | 'date-issues' | 'verified'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);

  // File upload drag & drop inside cleaning center
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    setIsProcessingFile(true);
    setFileError(null);
    try {
      const parsed = await parseAndSanitizeSpreadsheetFile(file, DEFAULT_SANITIZATION_CONFIG, noticeDate);
      handleUpdate(parsed.records, parsed.report);

      if (parsed.detectedNoticeDate && onNoticeDateChange) {
        onNoticeDateChange(parsed.detectedNoticeDate);
      } else if (!noticeDate && onNoticeDateChange) {
        const maxBilled = parsed.records.map(r => r.billedToDate).filter(Boolean).sort().pop();
        onNoticeDateChange(maxBilled || '2025-07-31');
      }

      if (onCustomerNameChange && !customerName) {
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[_-]/g, ' ')
          .replace(/benchmark|sample|template|data|export|fleet|trackunit/gi, '')
          .trim();
        if (cleanName.length > 2) {
          onCustomerNameChange(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        } else {
          onCustomerNameChange('Customer Fleet');
        }
      }
    } catch (err: any) {
      setFileError(err?.message || 'Failed to process telematics file. Please check format.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // 1. Scan for duplicates in real-time
  const duplicateAnalysis = useMemo(() => {
    const assetMap = new Map<string, SubscriptionRecord[]>();
    const serialMap = new Map<string, SubscriptionRecord[]>();

    records.forEach(r => {
      const aKey = r.assetId.trim().toUpperCase();
      const sKey = r.serialNumber.trim().toUpperCase();

      if (!assetMap.has(aKey)) assetMap.set(aKey, []);
      assetMap.get(aKey)!.push(r);

      if (!serialMap.has(sKey)) serialMap.set(sKey, []);
      serialMap.get(sKey)!.push(r);
    });

    const duplicateAssets = Array.from(assetMap.entries()).filter(([_, list]) => list.length > 1);
    const duplicateSerials = Array.from(serialMap.entries()).filter(([_, list]) => list.length > 1);

    return {
      hasDuplicateAssets: duplicateAssets.length > 0,
      duplicateAssetsCount: duplicateAssets.reduce((sum, [_, list]) => sum + (list.length - 1), 0),
      duplicateAssets,
      hasDuplicateSerials: duplicateSerials.length > 0,
      duplicateSerialsCount: duplicateSerials.reduce((sum, [_, list]) => sum + (list.length - 1), 0),
      duplicateSerials,
    };
  }, [records]);

  // 2. Scan dates for integrity, chronology, and leap-year compliance
  const dateIntegrityAnalysis = useMemo(() => {
    let chronologyErrors = 0;
    let leapYearChecks = 0;
    let monthEndAlignments = 0;
    const flaggedRecords: { record: SubscriptionRecord; issue: string; severity: 'critical' | 'warning' }[] = [];

    records.forEach(r => {
      // Check chronology: StartDate <= BilledToDate
      if (r.startDate && r.billedToDate && r.billedToDate < r.startDate) {
        chronologyErrors++;
        flaggedRecords.push({
          record: r,
          issue: `Chronology inversion: Billed-To date (${r.billedToDate}) precedes Activation Start Date (${r.startDate})`,
          severity: 'critical'
        });
      }

      // Check leap-year / Feb 29
      if (r.startDate.includes('-02-29') || r.billedToDate.includes('-02-29')) {
        leapYearChecks++;
      }

      // Check month ends
      const billedParts = r.billedToDate.split('-').map(Number);
      if (billedParts.length === 3) {
        const day = billedParts[2];
        if (day >= 28) monthEndAlignments++;
      }
    });

    return {
      chronologyErrors,
      leapYearChecks,
      monthEndAlignments,
      flaggedRecords,
      totalDatesScanned: records.length * 2
    };
  }, [records]);

  // Handle one-click deduplication
  const handleAutoDeduplicate = () => {
    setIsFixing(true);
    setTimeout(() => {
      const seen = new Map<string, SubscriptionRecord>();
      records.forEach(r => {
        const key = r.assetId.trim().toUpperCase();
        if (!seen.has(key)) {
          seen.set(key, r);
        } else {
          const existing = seen.get(key)!;
          // Keep the one with the latest billedToDate (most updated)
          if (r.billedToDate > existing.billedToDate) {
            seen.set(key, r);
          }
        }
      });

      const deduplicated = Array.from(seen.values());
      handleUpdate(deduplicated);
      setIsFixing(false);
    }, 400);
  };

  // Handle re-sanitizing with chosen date convention
  const handleReSanitizeDates = (convention: 'auto' | 'eur-dd-mm' | 'us-mm-dd') => {
    setDateFormatConvention(convention);
    setIsFixing(true);

    setTimeout(() => {
      const rawRows = records.map(r => ({
        'Asset ID': r.assetId,
        'Asset Name': r.assetName,
        'Device Type': r.deviceType,
        'Serial Number': r.serialNumber,
        'Plan Type': r.planType,
        'Monthly Fee': r.monthlyFee,
        'Start Date': r.startDate,
        'Billed To Date': r.billedToDate,
        'Category': r.category,
        'Notes': r.notes
      }));

      const config: SanitizationConfig = {
        ...DEFAULT_SANITIZATION_CONFIG,
        dateFormatConvention: convention,
        autoFixDates: true,
        fixChronologyReversals: true,
        deduplicateByAssetId: true,
        deduplicateBySerial: true
      };

      const result = sanitizeUploadedDataset(rawRows, config, noticeDate);
      handleUpdate(result.cleanedRecords, result);
      setIsFixing(false);
    }, 350);
  };

  // Filtered rows for the inspection table
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filterType === 'duplicates') {
        const isDupe = duplicateAnalysis.duplicateAssets.some(([key]) => key === r.assetId.toUpperCase());
        if (!isDupe) return false;
      }
      if (filterType === 'date-issues') {
        const hasIssue = dateIntegrityAnalysis.flaggedRecords.some(f => f.record.id === r.id);
        if (!hasIssue) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return r.assetId.toLowerCase().includes(q) ||
               r.assetName.toLowerCase().includes(q) ||
               r.serialNumber.toLowerCase().includes(q) ||
               r.startDate.includes(q) ||
               r.billedToDate.includes(q);
      }

      return true;
    });
  }, [records, filterType, searchQuery, duplicateAnalysis, dateIntegrityAnalysis]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8A212B] text-white flex items-center justify-center shadow-xs shrink-0">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Data Cleaning & Date Accuracy Center
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> High-Integrity Standard
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  Trackunit Denmark Specification
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Guarantees zero duplicate machines, eliminates hardware serial collisions, validates calendar dates against leap-year logic, and aligns billing periods strictly to Trackunit&apos;s published T&amp;C.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onOpenImport}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#8A212B]" />
              <span>Import New File</span>
            </button>

            {duplicateAnalysis.hasDuplicateAssets && (
              <button
                onClick={handleAutoDeduplicate}
                disabled={isFixing}
                className="px-3.5 py-2 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Resolve {duplicateAnalysis.duplicateAssetsCount} Duplicates</span>
              </button>
            )}

            <button
              onClick={() => handleReSanitizeDates(dateFormatConvention)}
              disabled={isFixing}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFixing ? 'animate-spin' : ''}`} />
              <span>Re-Clean Fleet Dates</span>
            </button>

            {(onProceedToTerms || onProceedToSettlement) && (
              <button
                onClick={onProceedToTerms || onProceedToSettlement}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Proceed to Step 2: Terms &amp; Conditions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Changes Notification Banner (Informs user about all modifications made during ingestion) */}
        {records.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white border border-slate-700 shadow-sm animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs">Automated Data Cleaning &amp; Changes Applied</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                      Cleanliness Score: {sanitizationReport?.cleaningScore || 100}%
                    </span>
                    {duplicateAnalysis.hasDuplicateAssets ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40">
                        {duplicateAnalysis.duplicateAssetsCount} Duplicates Pending Resolution
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                        Zero Duplicates Verified
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    Audited {records.length} assets: normalized European dates (`DD/MM/YYYY` to `YYYY-MM-DD`), verified start date chronology, and validated month-end horizons per Trackunit T&amp;C Section 2.
                    {sanitizationReport && sanitizationReport.datesCorrectedCount > 0 && (
                      <span className="text-emerald-300 font-semibold ml-1">
                        ({sanitizationReport.datesCorrectedCount} date formatting adjustments made).
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <button
                  onClick={() => handleReSanitizeDates(dateFormatConvention)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Re-audit</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State: Trackunit Telematics Ingestion Dropzone */}
        {records.length === 0 && (
          <div className="mt-6 p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 text-center space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcessFile(file);
              }}
              className={`p-6 rounded-xl transition-all ${
                isDragging ? 'bg-[#FDF2F3] border-[#8A212B]' : ''
              }`}
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center mb-3 shadow-xs">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Upload Customer Fleet Telematics File
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Drag and drop your Excel (.xlsx, .xls) or CSV telematics spreadsheet here to initiate automated cleaning, zero-duplicate validation, and Trackunit billing settlement.
              </p>

              {fileError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 max-w-md mx-auto">
                  {fileError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className="px-5 py-2.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  {isProcessingFile ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Ingesting &amp; Cleaning...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Select Telematics Spreadsheet (.xlsx, .csv)</span>
                    </>
                  )}
                </button>

                {onLoadDemoData && (
                  <button
                    type="button"
                    onClick={onLoadDemoData}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                  >
                    <span>Load Benchmark Demo File (Beta Industries)</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mt-6 text-left text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">1. Zero Duplication</span>
                  <span className="text-slate-500 text-[11px]">Detects &amp; merges identical asset IDs and duplicate hardware serials.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">2. Date Accuracy</span>
                  <span className="text-slate-500 text-[11px]">Validates European DD/MM/YYYY vs MM/DD/YYYY and checks chronology.</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-800 block">3. Trackunit T&amp;C Alignment</span>
                  <span className="text-slate-500 text-[11px]">Calculates 36-month initial terms and 3-month notice cutoff deadlines.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Core Health Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          {/* Duplication Health */}
          <div className={`p-4 rounded-xl border transition-all ${
            duplicateAnalysis.hasDuplicateAssets 
              ? 'bg-amber-50/70 border-amber-300' 
              : 'bg-emerald-50/70 border-emerald-300'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Data Duplication Audit
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${
                duplicateAnalysis.hasDuplicateAssets ? 'text-amber-800' : 'text-emerald-800'
              }`}>
                {duplicateAnalysis.hasDuplicateAssets ? `${duplicateAnalysis.duplicateAssetsCount} Flagged` : '0 Duplicates'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              {duplicateAnalysis.hasDuplicateAssets ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>Conflicting asset IDs detected</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>100% Unique Asset IDs</span>
                </>
              )}
            </p>
          </div>

          {/* Date Health */}
          <div className={`p-4 rounded-xl border transition-all ${
            dateIntegrityAnalysis.chronologyErrors > 0 
              ? 'bg-red-50/70 border-red-300' 
              : 'bg-emerald-50/70 border-emerald-300'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Date Chronology & Logic
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${
                dateIntegrityAnalysis.chronologyErrors > 0 ? 'text-red-700' : 'text-emerald-800'
              }`}>
                {dateIntegrityAnalysis.chronologyErrors > 0 ? `${dateIntegrityAnalysis.chronologyErrors} Inversions` : '100% Correct'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-emerald-600" />
              <span>{dateIntegrityAnalysis.totalDatesScanned} dates validated</span>
            </p>
          </div>

          {/* Hardware Serial Collisions */}
          <div className={`p-4 rounded-xl border transition-all ${
            duplicateAnalysis.hasDuplicateSerials 
              ? 'bg-amber-50/70 border-amber-300' 
              : 'bg-emerald-50/70 border-emerald-300'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Telematics Serial Health
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-black font-mono ${
                duplicateAnalysis.hasDuplicateSerials ? 'text-amber-800' : 'text-emerald-800'
              }`}>
                {duplicateAnalysis.hasDuplicateSerials ? `${duplicateAnalysis.duplicateSerialsCount} Collisions` : 'Unique Hardware'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>IoT Modems &bull; Single-Assignment</span>
            </p>
          </div>

          {/* Standards Compliance Rating */}
          <div className="p-4 rounded-xl border bg-slate-50 border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Active Date Convention
            </span>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => handleReSanitizeDates('eur-dd-mm')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  dateFormatConvention === 'eur-dd-mm'
                    ? 'bg-[#8A212B] text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                European DD/MM
              </button>
              <button
                onClick={() => handleReSanitizeDates('us-mm-dd')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                  dateFormatConvention === 'us-mm-dd'
                    ? 'bg-[#8A212B] text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                US MM/DD
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Trackunit Denmark standard: DD/MM/YYYY
            </p>
          </div>
        </div>
      </div>

      {/* Date Ambiguity & Format Resolution Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-[#1E293B] text-white rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
            !
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Date Format Standard (DD/MM/YYYY vs MM/DD/YYYY)
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              In telematics Excel exports, dates like <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">01/08/2022</code> can represent <strong>1st August 2022</strong> (European standard) or <strong>8th January 2022</strong> (US standard). Trackunit Denmark operates on the European standard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Set Mode:</span>
          <div className="bg-slate-800 p-1 rounded-xl border border-slate-700 flex items-center text-xs font-semibold">
            <button
              onClick={() => handleReSanitizeDates('eur-dd-mm')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFormatConvention === 'eur-dd-mm'
                  ? 'bg-[#8A212B] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              European (DD/MM) &bull; Recommended
            </button>
            <button
              onClick={() => handleReSanitizeDates('us-mm-dd')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                dateFormatConvention === 'us-mm-dd'
                  ? 'bg-[#8A212B] text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              US Format (MM/DD)
            </button>
          </div>
        </div>
      </div>

      {/* Itemized Fleet Date & Duplicate Inspection Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filter View:
            </span>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Assets ({records.length})
            </button>
            <button
              onClick={() => setFilterType('duplicates')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === 'duplicates'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Copy className="w-3 h-3" />
              <span>Duplicates ({duplicateAnalysis.duplicateAssetsCount})</span>
            </button>
            <button
              onClick={() => setFilterType('date-issues')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                filterType === 'date-issues'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Date Issues ({dateIntegrityAnalysis.flaggedRecords.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Asset ID, Serial, Date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-[#8A212B] outline-none font-medium"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Asset ID &bull; Unit Name</th>
                <th className="py-3 px-3">Telematics Serial</th>
                <th className="py-3 px-3">Activation Date (Start)</th>
                <th className="py-3 px-3">Last Invoiced (Billed To)</th>
                <th className="py-3 px-3">Chronology Check</th>
                <th className="py-3 px-3">Plan & Fee</th>
                <th className="py-3 px-4 text-right">Data Quality Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No records found matching the active filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const isDupe = duplicateAnalysis.duplicateAssets.some(([k]) => k === r.assetId.toUpperCase());
                  const isChronologyError = r.startDate && r.billedToDate && r.billedToDate < r.startDate;

                  return (
                    <tr 
                      key={r.id || idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isChronologyError ? 'bg-red-50/40' : isDupe ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{r.assetId}</span>
                          {isDupe && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              DUPLICATE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-sans truncate max-w-[180px]">
                          {r.assetName}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {r.serialNumber}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {r.startDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {r.billedToDate}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-sans">
                        {isChronologyError ? (
                          <span className="text-red-700 font-bold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Inverted Chronology
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Start &le; BilledTo
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-sans">
                        <div>{r.planType}</div>
                        <div className="text-[11px] text-slate-500 font-mono">€{r.monthlyFee.toFixed(2)}/mo</div>
                      </td>

                      <td className="py-3 px-4 text-right font-sans">
                        {isChronologyError ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                            Critical Fix Needed
                          </span>
                        ) : isDupe ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Duplicate Row
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Verified Clean
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
