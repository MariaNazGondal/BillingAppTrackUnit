import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  FileCheck,
  Edit2,
  Check
} from 'lucide-react';
import { parseAndSanitizeSpreadsheetFile } from '../utils/fileParser';
import { SubscriptionRecord, DataSanitizationReport, SanitizationConfig } from '../types';
import { DEFAULT_SANITIZATION_CONFIG } from '../utils/dataSanitizer';

interface DataIngestionUploadBannerProps {
  customerName: string;
  onCustomerNameChange: (newName: string) => void;
  noticeDate: string;
  onNoticeDateChange: (newDate: string) => void;
  onImportSuccess: (records: SubscriptionRecord[], report?: DataSanitizationReport, fileName?: string) => void;
  onResetBenchmark: () => void;
  activeRecordCount: number;
  loadedFileName: string | null;
  sanitizationReport: DataSanitizationReport | null;
  onInspectAudit: () => void;
}

export const DataIngestionUploadBanner: React.FC<DataIngestionUploadBannerProps> = ({
  customerName,
  onCustomerNameChange,
  noticeDate,
  onNoticeDateChange,
  onImportSuccess,
  onResetBenchmark,
  activeRecordCount,
  loadedFileName,
  sanitizationReport,
  onInspectAudit
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(customerName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-extract readable customer name from file name
  const deriveCustomerName = (filename: string): string => {
    const clean = filename
      .replace(/\.(xlsx|xls|csv|tsv)$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b(fleet|dataset|telematics|data|export|billing|settlement|final|invoices)\b/gi, '')
      .trim();
    if (!clean) return 'Customer Fleet';
    // Capitalize words
    return clean.replace(/\b\w/g, c => c.toUpperCase());
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    setIsProcessing(true);
    try {
      const config: SanitizationConfig = {
        ...DEFAULT_SANITIZATION_CONFIG,
        autoFixDates: true,
        detectMonthDayInversion: true,
        enforceFirstOfMonthStarts: true,
        dateFormatConvention: 'auto',
        deduplicateByAssetId: true,
        deduplicateBySerial: true,
        imputeMissingFees: true,
        imputeMissingDates: true
      };

      const result = await parseAndSanitizeSpreadsheetFile(file, config, noticeDate);
      
      // Auto-update customer name if file has a meaningful name
      const derived = deriveCustomerName(file.name);
      if (derived && derived !== 'Customer Fleet') {
        onCustomerNameChange(derived);
      } else if (!customerName) {
        onCustomerNameChange(derived || 'Customer Fleet');
      }

      // Auto-populate notice date if currently blank
      if (result.detectedNoticeDate) {
        onNoticeDateChange(result.detectedNoticeDate);
      } else if (!noticeDate) {
        const maxBilled = result.records.map(r => r.billedToDate).filter(Boolean).sort().pop();
        onNoticeDateChange(maxBilled || '2025-07-31');
      }

      onImportSuccess(result.records, result.report, file.name);
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setUploadError(err?.message || 'Failed to parse telematics spreadsheet. Please check format.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveCustomerName = () => {
    if (tempName.trim()) {
      onCustomerNameChange(tempName.trim());
    }
    setIsEditingName(false);
  };

  const isSampleBenchmark = customerName.toLowerCase().includes('beta industries') && !loadedFileName;

  return (
    <div className="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Top Bar with Customer Case Context */}
      <div className="bg-slate-50/80 px-4 sm:px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Building2 className="w-4 h-4 text-[#8A212B]" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Customer Settlement Case:
          </span>
          
          {isEditingName ? (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomerName()}
                className="px-2 py-0.5 text-xs font-bold text-slate-900 bg-white border border-[#8A212B] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
                autoFocus
              />
              <button
                onClick={handleSaveCustomerName}
                className="p-1 bg-[#8A212B] text-white rounded-md hover:bg-[#701a23] transition-colors"
                title="Save Customer Name"
              >
                <Check className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <span className={`text-xs font-bold tracking-tight ${customerName ? 'text-slate-900' : 'text-slate-400 italic'}`}>
                {customerName || 'Awaiting File Ingestion...'}
              </span>
              <button
                onClick={() => {
                  setTempName(customerName || '');
                  setIsEditingName(true);
                }}
                className="text-slate-400 hover:text-[#8A212B] transition-colors p-0.5 rounded"
                title="Edit Customer Name"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeRecordCount === 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
              Blank • Ready for Upload
            </span>
          ) : isSampleBenchmark ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Sample Case (Demo)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Active Uploaded Dataset
            </span>
          )}

          {loadedFileName && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200/80 text-slate-700">
              {loadedFileName}
            </span>
          )}
        </div>

        {/* Action: Quick Benchmark Reset if testing */}
        <div className="flex items-center gap-2">
          {!isSampleBenchmark && (
            <button
              onClick={onResetBenchmark}
              className="text-[11px] text-slate-500 hover:text-[#8A212B] font-medium flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
              title="Reset to sample benchmark dataset for comparison"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Load Sample Case (Beta Industries Demo)</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1 bg-[#8A212B] hover:bg-[#701a23] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New File</span>
          </button>
        </div>
      </div>

      {/* Main Upload Dropzone & Precision Notice Section */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Dropzone Column (7 cols) */}
        <div className="lg:col-span-7">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-7 text-center cursor-pointer transition-all duration-200 ${
              isDragging 
                ? 'border-[#8A212B] bg-[#FDF2F3]' 
                : 'border-slate-300 hover:border-[#8A212B] hover:bg-slate-50/70 bg-white'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center shadow-xs">
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-[#8A212B] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {isProcessing ? 'Processing & Auditing Dataset...' : 'Upload Customer Telematics Dataset'}
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Drag and drop any customer spreadsheet file here, or click to browse from your computer.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Excel (.xlsx, .xls)
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                CSV / TSV
              </span>
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                Auto-Normalizes Dates & Duplicates
              </span>
            </div>

            {uploadError && (
              <div className="mt-3 p-2 rounded-xl bg-red-50 text-red-700 text-xs flex items-center justify-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Date Accuracy & Terms Guarantee Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Absolute Date Accuracy & Quality Guarantee
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                100% Verified
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Charging customers with zero errors is paramount. Every date, month, and year undergoes strict calendar validation (including leap years and European 1st-of-month alignment).
            </p>

            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active Assets in Ledger:
                </span>
                <span className="font-mono font-bold text-slate-900">{activeRecordCount} units</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${noticeDate ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                  Termination Notice Date:
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={noticeDate}
                    onChange={(e) => onNoticeDateChange(e.target.value)}
                    className="px-2 py-0.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                  />
                  {!noticeDate && (
                    <span className="text-[11px] font-mono text-slate-400 italic">Blank</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Governing Standard:
                </span>
                <span className="font-semibold text-[#8A212B]">Trackunit T&C Section 2</span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Official Pricing Engine:
                </span>
                <span className="font-medium text-slate-800">Explore (€29), Evolve (€49), Expand (€69)</span>
              </div>
            </div>

            {sanitizationReport && (
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Duplicates Removed: <strong className="text-slate-800">{sanitizationReport.duplicatesCount}</strong> | Dates Checked: <strong className="text-slate-800">{sanitizationReport.datesCorrectedCount}</strong>
                </span>
                <button
                  onClick={onInspectAudit}
                  className="text-[#8A212B] hover:underline font-bold flex items-center gap-0.5"
                >
                  <span>Audit Logs</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
