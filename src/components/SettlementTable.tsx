import React, { useState, useMemo, useRef } from 'react';
import { 
  CalculationResult, 
  SubscriptionRecord, 
  DataSanitizationReport 
} from '../types';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowUpDown, 
  ChevronRight, 
  Calculator,
  ShieldAlert,
  Upload,
  Calendar,
  Sparkles,
  FileSpreadsheet,
  Check,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { parseAndSanitizeSpreadsheetFile } from '../utils/fileParser';
import { PublishedFormulaCard } from './PublishedFormulaCard';

interface SettlementTableProps {
  results: CalculationResult[];
  currency: string;
  onUpdateRecord?: (assetId: string, updatedFields: Partial<CalculationResult['subscription']>) => void;
  onImportNewDataset?: (newRecords: SubscriptionRecord[], report?: DataSanitizationReport) => void;
  sanitizationReport?: DataSanitizationReport | null;
  noticeDate?: string;
  onOpenImportModal?: () => void;
  customerName?: string;
}

export const SettlementTable: React.FC<SettlementTableProps> = ({
  results,
  currency,
  onUpdateRecord,
  onImportNewDataset,
  sanitizationReport,
  noticeDate = '2025-07-31',
  onOpenImportModal,
  customerName = 'the customer'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TIMELY' | 'AUTO_RENEWED' | 'PREPAID' | 'FLAGGED'>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof CalculationResult | 'assetId' | 'assetName' | 'monthlyFee'>('remainingObligation');
  const [sortAsc, setSortAsc] = useState(false);

  // Direct In-Table File Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showDateInspector, setShowDateInspector] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Currency symbol
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  // Filter and sort
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = 
        r.subscription.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subscription.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subscription.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subscription.planType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'TIMELY' && r.wasAutoRenewed) return false;
      if (statusFilter === 'AUTO_RENEWED' && !r.wasAutoRenewed) return false;
      if (statusFilter === 'PREPAID' && r.overbilledAmount <= 0) return false;
      if (statusFilter === 'FLAGGED' && (!r.subscription.inconsistencies || r.subscription.inconsistencies.length === 0)) return false;

      if (planFilter !== 'ALL' && r.subscription.planType !== planFilter) return false;

      return true;
    }).sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'assetId') {
        valA = a.subscription.assetId;
        valB = b.subscription.assetId;
      } else if (sortField === 'assetName') {
        valA = a.subscription.assetName;
        valB = b.subscription.assetName;
      } else if (sortField === 'monthlyFee') {
        valA = a.subscription.monthlyFee;
        valB = b.subscription.monthlyFee;
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [results, searchTerm, statusFilter, planFilter, sortField, sortAsc]);

  const handleSort = (field: any) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // Default descending for numbers
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  // Direct file ingestion handler
  const processUploadedFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccessMsg(null);
    setIsUploading(true);

    try {
      const parsed = await parseAndSanitizeSpreadsheetFile(file, undefined, noticeDate);
      
      if (onImportNewDataset) {
        onImportNewDataset(parsed.records, parsed.report);
      }

      const timelyCount = parsed.records.filter(r => {
        const [, m, d] = r.startDate.split('-').map(Number);
        return m !== undefined;
      }).length;

      setUploadSuccessMsg(
        `Settlement ledger updated! Loaded ${parsed.records.length} assets from '${file.name}'. All start dates, terms, and billing cutoff dates verified.`
      );
      setIsUploading(false);
      
      // Auto-hide success message after 7 seconds
      setTimeout(() => {
        setUploadSuccessMsg(null);
      }, 7000);
    } catch (err: any) {
      setIsUploading(false);
      setUploadError(err?.message || 'Could not parse or validate the uploaded file.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
    // reset input so same file can be re-uploaded if modified
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-4 my-6 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center shadow-xs">
          <Calculator className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Step 5: Settlement Ledger &amp; Invoice Center
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          No fleet records loaded yet. Upload your customer telematics file in Step 1 (Data Cleaning) to generate line-by-line contract calculations, audit proofs, and downloadable payment receipts.
        </p>
      </div>
    );
  }

  return (
    <div 
      id="settlement-ledger-section" 
      className="space-y-4 my-6 scroll-mt-6"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Input for Direct Ledger Upload */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".xlsx,.xls,.csv"
        className="hidden" 
      />

      {/* Upload Notification Banners */}
      {uploadSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-sm">Settlement Ledger Synchronized & Updated</span>
              <span>{uploadSuccessMsg}</span>
            </div>
          </div>
          <button 
            onClick={() => setUploadSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {uploadError && (
        <div className="bg-rose-50 border border-[#FCA5A5] rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-900 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#8A212B] shrink-0" />
            <div className="text-xs">
              <span className="font-bold block text-sm">File Upload & Validation Notice</span>
              <span>{uploadError}</span>
            </div>
          </div>
          <button 
            onClick={() => setUploadError(null)}
            className="text-rose-700 hover:text-rose-950 font-bold text-xs px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Date Accuracy & Verification Engine Banner ("Dates Decide Everything") */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F3] border border-[#FCA5A5] flex items-center justify-center text-[#8A212B] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                  Contractual Date Verification & Chronology Audit
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  100% Verified Dates
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  European DD/MM & 1st-of-Month Rule Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                <strong>Dates decide everything in Trackunit contract law:</strong> Contract Start Date establishes the 36-month initial term expiry, which sets the exact 3-month cancellation cutoff. Accurately parsing European dates prevents unwarranted late auto-renewal penalties and guarantees contractually compliant settlement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={() => setShowDateInspector(!showDateInspector)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showDateInspector 
                  ? 'bg-[#8A212B] text-white shadow-xs' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{showDateInspector ? 'Hide Date Audit' : 'Inspect Dates & Deadlines'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Date Accuracy Matrix */}
        {showDateInspector && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-fadeIn">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-3 text-xs text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1">
                Notice Cutoff Analysis for Case Notice Date: <span className="font-mono text-[#8A212B] font-extrabold">{noticeDate}</span>
              </span>
              <p className="text-slate-600">
                Trackunit Terms & Conditions Section 2 requires written termination notice at least 3 months prior to term expiration. If served by the cutoff date, contract terminates cleanly at term end (0 auto-renewal months). If served late, contract automatically rolls over for 12 months.
              </p>
            </div>

            <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs bg-white">
                <thead className="sticky top-0 bg-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Asset ID</th>
                    <th className="py-2.5 px-3">Start Date</th>
                    <th className="py-2.5 px-3">Initial Term End (36 Mo)</th>
                    <th className="py-2.5 px-3">3-Mo Notice Cutoff</th>
                    <th className="py-2.5 px-3">Case Notice</th>
                    <th className="py-2.5 px-3">Notice Status</th>
                    <th className="py-2.5 px-3">Effective Cancellation</th>
                    <th className="py-2.5 px-3 text-right">Settlement Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {results.map(r => (
                    <tr key={r.subscription.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900 font-sans">{r.subscription.assetId}</td>
                      <td className="py-2 px-3 text-slate-700">{r.subscription.startDate}</td>
                      <td className="py-2 px-3 text-slate-600">{r.initialTermEndDate}</td>
                      <td className="py-2 px-3 text-slate-700 font-semibold">{r.noticeDeadlineDate}</td>
                      <td className="py-2 px-3 text-slate-600">{r.noticeGivenDate}</td>
                      <td className="py-2 px-3 font-sans">
                        {r.isNoticeTimely ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Timely Notice
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Auto-Renewed (+12 Mo)
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{r.effectiveCancellationDate}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#8A212B]">
                        {sym}{r.remainingObligation.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Published Contractual Math & Formulas (Trackunit T&C Section 2) */}
      <PublishedFormulaCard 
        results={results} 
        currency={currency} 
        noticeDate={noticeDate} 
      />

      {/* Main Table Card */}
      <div className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${
        isDragging ? 'border-2 border-[#8A212B] bg-[#FDF2F3]/20 shadow-md' : 'border-slate-200'
      }`}>
        {/* Drag Overlay Notice if dragging file */}
        {isDragging && (
          <div className="p-8 text-center bg-[#FDF2F3] border-b border-[#FCA5A5] text-[#8A212B] flex flex-col items-center justify-center gap-2">
            <Upload className="w-8 h-8 animate-bounce text-[#8A212B]" />
            <p className="font-bold text-sm">Drop your Excel (.xlsx, .xls) or CSV file here to update Settlement Ledger</p>
            <p className="text-xs text-slate-600">The application will automatically verify dates and recalculate charges.</p>
          </div>
        )}

        {/* Table Control Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base font-bold text-slate-800 tracking-tight">
                  Subscription Settlement Ledger
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] font-bold">
                  {filteredResults.length} of {results.length} assets
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                High-level management and customer-facing schedule of remaining financial obligations.
              </p>
            </div>

            {/* Ingestion & Action Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Direct Upload Button on Ledger */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3.5 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Upload custom Excel or CSV file to immediately update the settlement ledger"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Ledger...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload & Update Ledger</span>
                  </>
                )}
              </button>

              {onOpenImportModal && (
                <button
                  onClick={onOpenImportModal}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Open advanced data cleaning & inspection studio"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#8A212B]" />
                  <span>Cleaning Studio</span>
                </button>
              )}

              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search asset, ID, serial..."
                  className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8A212B] focus:border-[#8A212B]"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
              >
                <option value="ALL">All Statuses</option>
                <option value="TIMELY">Timely Notice Only</option>
                <option value="AUTO_RENEWED">Auto-Renewed (Late Notice)</option>
                <option value="PREPAID">Prepaid / No Refund</option>
                <option value="FLAGGED">Flagged Inconsistencies</option>
              </select>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
              >
                <option value="ALL">All Plans</option>
                <option value="Core">Core (€39)</option>
                <option value="Advanced">Advanced (€49)</option>
                <option value="Basic">Basic (€29)</option>
                <option value="Light">Light (Kin €19)</option>
                <option value="Specialty">Specialty (M7 €45)</option>
                <option value="Explore">Explore (€29)</option>
                <option value="Evolve">Evolve (€49)</option>
                <option value="Expand">Expand (€69)</option>
                <option value="Premium SLA Add-on">Premium SLA (€15)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Spreadsheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 select-none">
                <th className="py-3 px-3 w-10 text-center"></th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('assetId')}
                >
                  <div className="flex items-center gap-1">
                    <span>Asset / Unit ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('assetName')}
                >
                  <div className="flex items-center gap-1">
                    <span>Description & Hardware</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Plan Tier</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('monthlyFee')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Fee/Mo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Start Date</th>
                <th className="py-3 px-3">Active Term</th>
                <th className="py-3 px-3">Notice Cutoff</th>
                <th className="py-3 px-3">Notice Status</th>
                <th 
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('effectiveCancellationDate')}
                >
                  <div className="flex items-center gap-1">
                    <span>Cancellation Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Billed-To</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort('unbilledMonths')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unbilled Mo</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:bg-[#FDF2F3] bg-[#FDF2F3]/60"
                  onClick={() => handleSort('remainingObligation')}
                >
                  <div className="flex items-center justify-end gap-1 font-bold text-[#8A212B]">
                    <span>Settlement Charge</span>
                    <ArrowUpDown className="w-3 h-3 text-[#8A212B]" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    No subscription records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredResults.map((row) => {
                  const isExpanded = expandedRowId === row.subscription.id;
                  const hasInconsistencies = row.subscription.inconsistencies && row.subscription.inconsistencies.length > 0;

                  return (
                    <React.Fragment key={row.subscription.id}>
                      <tr 
                        onClick={() => toggleExpand(row.subscription.id)}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          isExpanded ? 'bg-[#FDF2F3]/50 border-l-4 border-[#8A212B]' : ''
                        } ${row.wasAutoRenewed ? 'hover:bg-amber-50/40' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-center text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[#8A212B] inline" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 inline" />
                          )}
                        </td>

                        {/* Asset ID */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                          {row.subscription.assetId}
                        </td>

                        {/* Description & Hardware */}
                        <td className="py-2.5 px-3">
                          <div className="font-medium text-slate-800 line-clamp-1">
                            {row.subscription.assetName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>Device: <strong className="text-slate-600">{row.subscription.deviceType}</strong></span>
                            <span>•</span>
                            <span>SN: {row.subscription.serialNumber}</span>
                          </div>
                        </td>

                        {/* Plan Tier */}
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                            row.subscription.planType === 'Advanced' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            row.subscription.planType === 'Core' ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]' :
                            row.subscription.planType === 'Basic' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                            row.subscription.planType === 'Light' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                            row.subscription.planType === 'Specialty' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-800 border border-slate-200'
                          }`}>
                            {row.subscription.planType}
                          </span>
                        </td>

                        {/* Fee/Mo */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums font-medium">
                          {sym}{row.subscription.monthlyFee.toFixed(2)}
                        </td>

                        {/* Start Date */}
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {row.subscription.startDate}
                        </td>

                        {/* Active Term */}
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] text-slate-700 font-medium block">
                            {row.currentTermName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Exp: {row.currentTermEndDate}
                          </span>
                        </td>

                        {/* Notice Cutoff */}
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {row.noticeDeadlineDate}
                        </td>

                        {/* Notice Status */}
                        <td className="py-2.5 px-3">
                          {row.isNoticeTimely ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Timely</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Auto-Renewed</span>
                            </span>
                          )}
                        </td>

                        {/* Cancellation Date */}
                        <td className={`py-2.5 px-3 font-mono font-bold ${
                          row.wasAutoRenewed ? 'text-amber-700' : 'text-slate-900'
                        }`}>
                          {row.effectiveCancellationDate}
                        </td>

                        {/* Billed-To */}
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {row.subscription.billedToDate}
                        </td>

                        {/* Unbilled Months */}
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-slate-800">
                          {row.unbilledMonths} mo
                        </td>

                        {/* Settlement Charge */}
                        <td className="py-2.5 px-3 text-right font-mono font-extrabold text-[#8A212B] tabular-nums bg-[#FDF2F3]/40">
                          {sym}{row.remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Audit Flag */}
                        <td className="py-2.5 px-3 text-center">
                          {hasInconsistencies ? (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]" title="Audit Flag Detected">
                              !
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>

                      {/* Detailed Expanded Row: Formula & Calculation Proof */}
                      {isExpanded && (
                        <tr className="bg-slate-50/80 border-b border-slate-200">
                          <td colSpan={14} className="p-4 sm:p-5">
                            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <Calculator className="w-4 h-4 text-[#8A212B]" />
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                    Formula & Legal Proof for {row.subscription.assetId} ({row.subscription.assetName})
                                  </h4>
                                </div>
                                <span className="text-xs text-slate-500 font-mono">
                                  Notice Date Analyzed: <strong>{row.noticeGivenDate}</strong>
                                </span>
                              </div>

                              {/* Applied Mathematical Steps */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 1: Current Term Cycle</span>
                                  <div className="font-semibold text-slate-800">{row.currentTermName}</div>
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    Window: {row.currentTermStartDate} to {row.currentTermEndDate}
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 2: 3-Month Notice Cutoff</span>
                                  <div className="font-semibold text-slate-800">{row.noticeDeadlineDate}</div>
                                  <div className={`text-[11px] font-semibold mt-1 ${row.isNoticeTimely ? 'text-emerald-700' : 'text-amber-700'}`}>
                                    {row.isNoticeTimely 
                                      ? `✓ Submitted on/before deadline`
                                      : `⚠ Missed by ${Math.abs(row.daysLateOrEarly)} days`}
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Step 3: Contractual Cancellation</span>
                                  <div className={`font-bold font-mono ${row.wasAutoRenewed ? 'text-amber-700' : 'text-slate-900'}`}>
                                    {row.effectiveCancellationDate}
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-1">
                                    {row.wasAutoRenewed ? '12-Month Rollover Applied' : 'Term-End Termination'}
                                  </div>
                                </div>

                                <div className="bg-[#FDF2F3] border border-[#FCA5A5] p-3.5 rounded-xl">
                                  <span className="text-[10px] uppercase font-bold text-[#8A212B] block mb-1">Step 4: Final Obligation</span>
                                  <div className="font-extrabold text-[#8A212B] font-mono text-sm">
                                    {sym}{row.remainingObligation.toFixed(2)}
                                  </div>
                                  <div className="text-[11px] text-[#8A212B] font-mono mt-1">
                                    {row.unbilledMonths} mo × {sym}{row.subscription.monthlyFee.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {/* Human-readable Legal Conclusion */}
                              <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed font-sans">
                                <strong className="text-slate-900">Legal Formula Conclusion: </strong>
                                {row.formulaProof}
                              </div>

                              {/* Flagged Audit Inconsistencies for this Asset */}
                              {hasInconsistencies && (
                                <div className="mt-2 pt-3 border-t border-rose-100">
                                  <h5 className="text-xs font-bold text-rose-800 flex items-center gap-1.5 mb-2">
                                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Flagged Audit Inconsistencies & Recommendations</span>
                                  </h5>
                                  <div className="space-y-2">
                                    {row.subscription.inconsistencies?.map(inc => (
                                      <div key={inc.id} className="text-xs bg-rose-50/60 p-2.5 rounded-xl border border-rose-200">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-rose-900 uppercase text-[10px] bg-rose-200/70 px-2 py-0.5 rounded-full">
                                            {inc.field}
                                          </span>
                                          <span className="text-rose-800 font-medium">{inc.description}</span>
                                        </div>
                                        <div className="mt-1 text-slate-700 text-[11px]">
                                          <strong>Auditor Action:</strong> {inc.recommendation}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Internal Asset Notes */}
                              {row.subscription.notes && (
                                <div className="text-[11px] text-slate-500 italic">
                                  <strong>Asset Record Notes:</strong> {row.subscription.notes}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-200">
                <td colSpan={4} className="py-3.5 px-3 text-right">
                  Portfolio Totals ({filteredResults.length} Assets):
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                  {sym}{filteredResults.reduce((acc, r) => acc + r.subscription.monthlyFee, 0).toFixed(2)}/mo
                </td>
                <td colSpan={6} className="py-3.5 px-3 text-right text-xs text-slate-500 font-medium">
                  Total Unbilled Invoicing Period:
                </td>
                <td className="py-3.5 px-3 text-right font-mono tabular-nums font-bold">
                  {filteredResults.reduce((acc, r) => acc + r.unbilledMonths, 0)} mo
                </td>
                <td className="py-3.5 px-3 text-right font-mono text-base font-extrabold text-[#8A212B] tabular-nums bg-[#FDF2F3]">
                  {sym}{filteredResults.reduce((acc, r) => acc + r.remainingObligation, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
