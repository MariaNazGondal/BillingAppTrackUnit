import React, { useState } from 'react';
import Papa from 'papaparse';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  Sliders, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Copy, 
  Check, 
  AlertTriangle, 
  Info, 
  Layers, 
  Wand2, 
  ChevronDown, 
  ChevronUp, 
  TrendingDown, 
  Scale 
} from 'lucide-react';
import { 
  SubscriptionRecord, 
  DataSanitizationReport, 
  DataCleaningNotice, 
  SanitizationConfig 
} from '../types';
import { 
  sanitizeUploadedDataset, 
  DEFAULT_SANITIZATION_CONFIG 
} from '../utils/dataSanitizer';
import { parseAndSanitizeSpreadsheetFile } from '../utils/fileParser';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (records: SubscriptionRecord[], report?: DataSanitizationReport, fileName?: string) => void;
  onResetBenchmark: () => void;
  caseNoticeDate?: string;
}

// Sample messy/dirty dataset demonstrating date format issues, duplicates, and missing values
const SAMPLE_INACCURATE_DATA = [
  {
    "Asset ID": "BI-1001",
    "Asset Name": "Caterpillar 320 GC Excavator",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-89211",
    "Plan Type": "Core",
    "Monthly Fee": "39,00 €",
    "Contract Start Date": "44866", // Excel serial date for 2022-11-01
    "Billed To Date": "31/07/2025", // European slash format DD/MM/YYYY
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1002",
    "Asset Name": "Komatsu PC210LC Crawler",
    "Device Type": "tu-spot-battery", // non-standard device string
    "Serial Number": "TU-SN-89212",
    "Plan Type": "advanced fleet", // non-standard plan name
    "Monthly Fee": "", // missing fee
    "Contract Start Date": "01-11-2022",
    "Billed To Date": "2025/07/31", // slashed YYYY/MM/DD
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1002", // DUPLICATE Asset ID with older billing date
    "Asset Name": "Komatsu PC210LC Crawler (Duplicate Row)",
    "Device Type": "Spot",
    "Serial Number": "TU-SN-89212",
    "Plan Type": "Advanced",
    "Monthly Fee": "49.00",
    "Contract Start Date": "2022-11-01",
    "Billed To Date": "2025-05-31", // older date
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "", // MISSING Asset ID
    "Asset Name": "Volvo L120H Wheel Loader",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-89213",
    "Plan Type": "Core",
    "Monthly Fee": "39.00",
    "Contract Start Date": "1-Nov-2022", // Text month date
    "Billed To Date": "2025-07-31",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1004",
    "Asset Name": "Liebherr R926 G8 Excavator",
    "Device Type": "Beam",
    "Serial Number": "TU-SN-89214",
    "Plan Type": "Basic",
    "Monthly Fee": "-29.00", // Negative fee accidentally entered
    "Contract Start Date": "2025-07-31", // Inverted chronology (start and billed swapped)
    "Billed To Date": "2022-11-01",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1005",
    "Asset Name": "Bomag BW 213 DH-5 Roller",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-89211", // Serial collision with BI-1001
    "Plan Type": "Core",
    "Monthly Fee": "39.00",
    "Contract Start Date": "2022.11.01", // Dotted format
    "Billed To Date": "2025.07.31",
    "Category": "Compaction"
  }
];

// Sample dataset reproducing the user's specific problem: Excel file where dates are interpreted as January
const SAMPLE_JANUARY_INVERSION_DATA = [
  {
    "Asset ID": "BI-1010",
    "Asset Name": "Hitachi ZX210LC-6 Medium Excavator",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-99001",
    "Plan Type": "Core",
    "Monthly Fee": "39.00",
    "Contract Start Date": "2022-01-11", // In reality: November 1, 2022 (Day 01, Month 11 inversed by Excel parser)
    "Billed To Date": "2025-07-31",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1011",
    "Asset Name": "Doosan DX300LC-7 Crawler Excavator",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-99002",
    "Plan Type": "Advanced",
    "Monthly Fee": "49.00",
    "Contract Start Date": "2022-01-09", // In reality: September 1, 2022 (Day 01, Month 09)
    "Billed To Date": "2025-07-31",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1012",
    "Asset Name": "JCB 3CX Eco Backhoe Loader",
    "Device Type": "Spot",
    "Serial Number": "TU-SN-99003",
    "Plan Type": "Basic",
    "Monthly Fee": "29.00",
    "Contract Start Date": "2022-01-12", // In reality: December 1, 2022 (Day 01, Month 12)
    "Billed To Date": "2025-07-31",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1013",
    "Asset Name": "Bobcat E50 Compact Mini Excavator",
    "Device Type": "Spot",
    "Serial Number": "TU-SN-99004",
    "Plan Type": "Core",
    "Monthly Fee": "39.00",
    "Contract Start Date": "2022-01-08", // In reality: August 1, 2022 (Day 01, Month 08)
    "Billed To Date": "2025-07-31",
    "Category": "Earthmoving"
  },
  {
    "Asset ID": "BI-1014",
    "Asset Name": "Manitou MT 1840 Easy Telehandler",
    "Device Type": "Beam",
    "Serial Number": "TU-SN-99005",
    "Plan Type": "Core",
    "Monthly Fee": "39.00",
    "Contract Start Date": "2022-01-05", // In reality: May 1, 2022 (Day 01, Month 05)
    "Billed To Date": "2025-07-31",
    "Category": "Lifting"
  },
  {
    "Asset ID": "BI-1015",
    "Asset Name": "Hamm HD 12 VV Tandem Roller",
    "Device Type": "Raw",
    "Serial Number": "TU-SN-99006",
    "Plan Type": "Light",
    "Monthly Fee": "19.00",
    "Contract Start Date": "2022-01-06", // In reality: June 1, 2022 (Day 01, Month 06)
    "Billed To Date": "2025-07-31",
    "Category": "Compaction"
  },
  {
    "Asset ID": "BI-1016",
    "Asset Name": "Atlas Copco XAS 88 Air Compressor",
    "Device Type": "Beam",
    "Serial Number": "TU-SN-99007",
    "Plan Type": "Basic",
    "Monthly Fee": "29.00",
    "Contract Start Date": "2022-01-10", // In reality: October 1, 2022 (Day 01, Month 10)
    "Billed To Date": "2025-07-31",
    "Category": "Power"
  }
];

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  onResetBenchmark,
  caseNoticeDate = '2025-07-31'
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'google-sheet' | 'paste' | 'sample'>('upload');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  
  // Sanitization Config Levers
  const [sanitizationConfig, setSanitizationConfig] = useState<SanitizationConfig>(DEFAULT_SANITIZATION_CONFIG);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [rawRows, setRawRows] = useState<any[] | null>(null);
  const [showDateComparison, setShowDateComparison] = useState<boolean>(true);

  // Result of cleaning & sanitization
  const [sanitizationReport, setSanitizationReport] = useState<DataSanitizationReport | null>(null);
  const [noticeFilter, setNoticeFilter] = useState<'all' | 'date-format-corrected' | 'date-inversion-fixed' | 'duplicate-merged' | 'duplicate-removed' | 'missing-field-imputed' | 'critical'>('all');

  if (!isOpen) return null;

  // Process raw rows through the sanitization engine and automatically update parent ledger
  const runSanitization = (rows: any[], overrideConfig?: SanitizationConfig, fileName?: string) => {
    try {
      setRawRows(rows);
      const config = overrideConfig || sanitizationConfig;
      const report = sanitizeUploadedDataset(rows, config, caseNoticeDate);
      if (report.cleanedRecords.length === 0) {
        setError('No valid subscription rows could be parsed or extracted.');
        setSanitizationReport(null);
        setSyncSuccessMsg(null);
      } else {
        setSanitizationReport(report);
        setError(null);
        
        // Critical: Update the Settlement Ledger in App.tsx immediately!
        onImportSuccess(report.cleanedRecords, report, fileName);
        
        setSyncSuccessMsg(
          `Settlement ledger updated! ${report.cleanedRecords.length} assets synced from ${fileName || 'input'}. Verified ${report.datesCorrectedCount} dates and resolved ${report.duplicatesCount} duplicate rows.`
        );
      }
    } catch (err: any) {
      setError(err?.message || 'Data sanitization failed.');
      setSanitizationReport(null);
      setSyncSuccessMsg(null);
    }
  };

  const handleConfigChange = (newConfig: SanitizationConfig) => {
    setSanitizationConfig(newConfig);
    if (rawRows && rawRows.length > 0) {
      runSanitization(rawRows, newConfig);
    }
  };

  // Handle native Excel (.xlsx, .xls) and CSV file uploads using fileParser
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSyncSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const { records, report, rawRows: extractedRows } = await parseAndSanitizeSpreadsheetFile(
        file, 
        sanitizationConfig, 
        caseNoticeDate
      );
      
      setRawRows(extractedRows);
      setSanitizationReport(report);
      setIsProcessing(false);

      // Immediately update the settlement ledger so the user sees the new data
      onImportSuccess(records, report, file.name);

      setSyncSuccessMsg(
        `Settlement ledger updated! ${records.length} assets loaded from '${file.name}'. All start dates, terms, and billing cutoff dates verified.`
      );
    } catch (err: any) {
      setIsProcessing(false);
      setError(`File processing error: ${err?.message || 'Could not parse Excel spreadsheet'}`);
    }
  };

  // Handle Google Sheet URL
  const handleGoogleSheetFetch = async () => {
    setError(null);
    setSyncSuccessMsg(null);
    if (!sheetUrl) {
      setError('Please provide a Google Sheets URL or CSV export link.');
      return;
    }

    setIsProcessing(true);
    try {
      let exportUrl = sheetUrl.trim();
      if (exportUrl.includes('docs.google.com/spreadsheets/d/')) {
        const idMatch = exportUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (idMatch && idMatch[1]) {
          const sheetId = idMatch[1];
          const gidMatch = exportUrl.match(/gid=([0-9]+)/);
          const gid = gidMatch ? gidMatch[1] : '0';
          exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        }
      }

      const res = await fetch(exportUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch Google Sheet. Please ensure link permissions are set to "Anyone with the link can view", or download as Excel/CSV to upload.`);
      }

      const text = await res.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setIsProcessing(false);
          runSanitization(results.data, undefined, 'Google Sheet');
        },
        error: (err) => {
          setIsProcessing(false);
          setError(`Google Sheet CSV parse error: ${err.message}`);
        }
      });
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Error fetching Google Sheet.');
    }
  };

  // Handle Pasted Text
  const handlePastedTextParse = () => {
    setError(null);
    setSyncSuccessMsg(null);
    if (!pastedText.trim()) {
      setError('Please paste spreadsheet data first.');
      return;
    }

    try {
      Papa.parse(pastedText.trim(), {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          runSanitization(results.data, undefined, 'Pasted Table');
        }
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to parse pasted text.');
    }
  };

  // Load Inaccurate Test Datasets
  const handleLoadSampleInaccurateData = () => {
    runSanitization(SAMPLE_INACCURATE_DATA, undefined, 'Mixed Dirty Sample');
  };

  const handleLoadSampleJanuaryData = () => {
    runSanitization(SAMPLE_JANUARY_INVERSION_DATA, undefined, 'January Anomaly Sample');
  };

  const handleApplyImport = () => {
    if (sanitizationReport && sanitizationReport.cleanedRecords.length > 0) {
      onImportSuccess(sanitizationReport.cleanedRecords, sanitizationReport);
      onClose();
    }
  };

  const filteredNotices = (sanitizationReport?.notices || []).filter(n => {
    if (noticeFilter === 'all') return true;
    if (noticeFilter === 'critical') return n.severity === 'critical';
    return n.actionType === noticeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF2F3] border border-[#FCA5A5] text-[#8A212B] flex items-center justify-center shadow-xs">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base tracking-tight">
                  Import & Data Cleaning Sanitization Engine
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  Trackunit Certified
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fixes date format errors, resolves duplicate rows, imputes missing fields, and updates settlement ledger.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Immediate Auto-Sync Success Banner */}
        {syncSuccessMsg && (
          <div className="mx-5 mt-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3 text-emerald-950 text-xs shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block text-sm text-emerald-900">Settlement Ledger Updated Automatically</span>
                <span>{syncSuccessMsg}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-lg font-bold text-xs shrink-0 shadow-xs transition-colors"
            >
              View Settlement Ledger
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-4 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('upload'); setError(null); }}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-[#8A212B] text-[#8A212B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel / CSV File</span>
          </button>
          <button
            onClick={() => { setActiveTab('google-sheet'); setError(null); }}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'google-sheet'
                ? 'border-[#8A212B] text-[#8A212B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheet Link</span>
          </button>
          <button
            onClick={() => { setActiveTab('paste'); setError(null); }}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'paste'
                ? 'border-[#8A212B] text-[#8A212B] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Paste Table</span>
          </button>
          <button
            onClick={() => { 
              setActiveTab('sample'); 
              setError(null);
              handleLoadSampleInaccurateData();
            }}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sample'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-amber-600 hover:text-amber-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Test Inaccurate Sample Data</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Upload Native Excel Workbook (.xlsx, .xls) or CSV:
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-[#8A212B] transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-1 font-medium">Drag & drop your Excel spreadsheet (.xlsx, .xls) or CSV</p>
                <p className="text-[11px] text-slate-400 mb-3">Our cleaning engine will normalize serial dates, European commas, deduplicate assets, and update the ledger immediately.</p>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv, .tsv, .txt"
                  onChange={handleFileUpload}
                  className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#FDF2F3] file:text-[#8A212B] hover:file:bg-[#FCA5A5]/40 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Google Sheet Tab */}
          {activeTab === 'google-sheet' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Google Sheets Public Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8A212B] font-mono shadow-xs"
                />
                <button
                  onClick={handleGoogleSheetFetch}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-[#8A212B] hover:bg-[#6B1922] text-white font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 shadow-xs"
                >
                  {isProcessing ? 'Cleaning...' : 'Fetch & Clean'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Ensure sharing is set to &ldquo;Anyone with the link can view&rdquo;.
              </p>
            </div>
          )}

          {/* Paste Tab */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Paste Spreadsheet Rows (CSV or TSV format):
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="AssetId, AssetName, MonthlyFee, StartDate, BilledToDate, PlanType&#10;BI-1001, Cat 320 Excavator, 39,00 €, 44866, 31/07/2025, Core"
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8A212B] shadow-xs"
              />
              <button
                onClick={handlePastedTextParse}
                className="px-4 py-2 bg-[#8A212B] hover:bg-[#6B1922] text-white font-semibold text-xs rounded-xl transition-colors shadow-xs"
              >
                Clean & Ingest Pasted Rows
              </button>
            </div>
          )}

          {/* Sample Tab Explanation & Controls */}
          {activeTab === 'sample' && (
            <div className="space-y-3">
              <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Interactive Test Scenarios for Data Cleaning & Date Normalization</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Select a targeted dirty dataset to test how our ingestion engine inspects, identifies, and resolves specific data discrepancies in real-time.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleLoadSampleJanuaryData}
                    className="p-3 bg-white hover:bg-amber-100/50 border border-amber-300 rounded-xl text-left transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>The January Date Inversion Test</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Reproduces contracts with inverted month/day starting in January (e.g. <code>2022-01-11</code> instead of Nov 1). Runs statistical scan and recalculates the final bill.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadSampleInaccurateData}
                    className="p-3 bg-white hover:bg-amber-100/50 border border-amber-300 rounded-xl text-left transition-colors shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-600" />
                        <span>Mixed Dirty Dataset</span>
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Contains raw Excel date serials (<code>44866</code>), missing monthly fees, duplicate Asset IDs, inverted chronology, and serial collisions.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cleaning Rules Drawer Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-[#8A212B]" />
              <span>{showConfigDrawer ? 'Hide Cleaning Rules' : 'Configure Cleaning Rules & Sanitization Levers'}</span>
            </button>

            {showConfigDrawer && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.detectMonthDayInversion}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, detectMonthDayInversion: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Detect & Fix Month/Day Inversions (January Anomaly)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.enforceFirstOfMonthStarts}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, enforceFirstOfMonthStarts: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Enforce 1st-of-Month Activations</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.autoFixDates}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, autoFixDates: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Auto-Correct Date Formats</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.deduplicateByAssetId}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, deduplicateByAssetId: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Deduplicate by Asset ID</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.imputeMissingFees}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, imputeMissingFees: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Impute Missing Fees from Plan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.fixChronologyReversals}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, fixChronologyReversals: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Swap Inverted Start/Billed Dates</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={sanitizationConfig.deduplicateBySerial}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, deduplicateBySerial: e.target.checked })}
                      className="rounded text-[#8A212B] focus:ring-[#8A212B]"
                    />
                    <span>Flag Hardware Serial Collisions</span>
                  </label>
                </div>

                <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-700">Date Format Convention:</span>
                    <select
                      value={sanitizationConfig.dateFormatConvention}
                      onChange={(e) => handleConfigChange({ ...sanitizationConfig, dateFormatConvention: e.target.value as any })}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
                    >
                      <option value="auto">Auto-Detect (Statistical Distribution)</option>
                      <option value="EUR">European Standard (DD/MM/YYYY)</option>
                      <option value="US">US Standard (MM/DD/YYYY)</option>
                    </select>
                  </div>
                  <span className="text-slate-400">Settings update results immediately upon changing.</span>
                </div>
              </div>
            )}
          </div>

          {/* Sanitization Report & Notification Ledger */}
          {sanitizationReport && (
            <div className="space-y-4 pt-2">
              {/* Scorecard Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="p-2.5 bg-[#FDF2F3] border border-[#FCA5A5] rounded-xl">
                  <span className="text-[10px] font-bold text-[#8A212B] uppercase tracking-wider block">Cleaned Units</span>
                  <span className="text-xl font-bold font-mono text-[#8A212B]">{sanitizationReport.cleanedRowsCount}</span>
                  <span className="text-[10px] text-slate-500 block">from {sanitizationReport.totalRawRows} raw rows</span>
                </div>

                <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Dates Corrected</span>
                  <span className="text-xl font-bold font-mono text-amber-900">{sanitizationReport.datesCorrectedCount}</span>
                  <span className="text-[10px] text-amber-700 block">normalized to ISO</span>
                </div>

                <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Duplicates Merged</span>
                  <span className="text-xl font-bold font-mono text-purple-900">{sanitizationReport.duplicatesCount}</span>
                  <span className="text-[10px] text-purple-700 block">consolidated</span>
                </div>

                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Imputed Values</span>
                  <span className="text-xl font-bold font-mono text-emerald-900">{sanitizationReport.missingValuesImputedCount}</span>
                  <span className="text-[10px] text-emerald-700 block">fees & IDs auto-filled</span>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Data Clean Score</span>
                  <span className="text-xl font-bold font-mono text-slate-900">{sanitizationReport.cleaningScore}%</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">Audit Ready</span>
                </div>
              </div>

              {/* Month/Day Inversion Analysis & Recalculation Impact Card */}
              {sanitizationReport.dateAnalysis && (sanitizationReport.dateAnalysis.detectedJanuaryAnomaly || sanitizationReport.dateAnalysis.inversedDatesCount > 0) && (
                <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
                        !
                      </div>
                      <div>
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <span>Month/Day Inversion Detected & Resolved</span>
                          <span className="bg-amber-200 text-amber-900 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold">
                            {sanitizationReport.dateAnalysis.januaryClusterPercentage}% Jan Dates
                          </span>
                        </span>
                        <p className="text-[11px] text-amber-800">
                          The statistical scan caught contract dates parsed with month and day flipped (e.g. <code>01/11/2022</code> as Jan 11 instead of Nov 1). These were auto-corrected to legitimate 1st-of-month activations before running calculations.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowDateComparison(!showDateComparison)}
                      className="text-xs font-semibold text-amber-900 hover:text-amber-950 flex items-center gap-1 shrink-0 self-start sm:self-auto bg-amber-200/60 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <span>{showDateComparison ? 'Hide Breakdown' : 'Show Breakdown'}</span>
                      {showDateComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Financial Impact Before vs After */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Dates Corrected</span>
                      <span className="text-base font-bold font-mono text-amber-900">
                        {sanitizationReport.dateAnalysis.inversedDatesCount}
                      </span>
                      <span className="text-[10px] text-amber-700 block">units adjusted</span>
                    </div>

                    <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Naive January Bill</span>
                      <span className="text-base font-bold font-mono text-slate-700 line-through">
                        €{sanitizationReport.dateAnalysis.beforeRecalculationTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">without date fix</span>
                    </div>

                    <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Corrected Final Bill</span>
                      <span className="text-base font-bold font-mono text-emerald-800">
                        €{sanitizationReport.dateAnalysis.afterRecalculationTotal.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold block">verified accurate</span>
                    </div>

                    <div className="bg-white/80 border border-amber-200 rounded-lg p-2">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Late Penalties Saved</span>
                      <span className="text-base font-bold font-mono text-[#8A212B]">
                        {sanitizationReport.dateAnalysis.contractsSavedFromLatePenalty}
                      </span>
                      <span className="text-[10px] text-[#8A212B] block">contracts protected</span>
                    </div>
                  </div>

                  {/* Detailed Table of Inversions */}
                  {showDateComparison && sanitizationReport.dateAnalysis.itemizedComparisons.length > 0 && (
                    <div className="border border-amber-200 rounded-lg overflow-x-auto bg-white">
                      <table className="w-full text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-amber-100 bg-amber-50/50 text-amber-900 font-bold">
                            <th className="py-2 px-2.5">Asset ID</th>
                            <th className="py-2 px-2.5">Raw Input</th>
                            <th className="py-2 px-2.5">Naive (Jan) Date</th>
                            <th className="py-2 px-2.5">Corrected Real Date</th>
                            <th className="py-2 px-2.5">Term Expiry Shift</th>
                            <th className="py-2 px-2.5">Notice Timeliness</th>
                            <th className="py-2 px-2.5">Unbilled Mths</th>
                            <th className="py-2 px-2.5 text-right">Recalculated Bill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sanitizationReport.dateAnalysis.itemizedComparisons.map((c) => (
                            <tr key={c.assetId} className="hover:bg-amber-50/30 font-mono">
                              <td className="py-2 px-2.5 font-bold text-slate-800">{c.assetId}</td>
                              <td className="py-2 px-2.5 text-slate-500">{c.rawStartDate}</td>
                              <td className="py-2 px-2.5 text-rose-600 line-through">{c.naiveStartDate}</td>
                              <td className="py-2 px-2.5 text-emerald-700 font-bold">{c.correctedStartDate}</td>
                              <td className="py-2 px-2.5 text-slate-700">{c.correctedEndDate}</td>
                              <td className="py-2 px-2.5">
                                {c.naiveTimely !== c.correctedTimely ? (
                                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-1 py-0.5 rounded text-[10px]">
                                    Late ➔ Timely
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">
                                    {c.correctedTimely ? 'Timely' : 'Auto-Renewed'}
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="text-rose-500 line-through mr-1">{c.naiveUnbilledMonths}m</span>
                                <span className="text-emerald-700 font-bold">{c.correctedUnbilledMonths}m</span>
                              </td>
                              <td className="py-2 px-2.5 text-right">
                                <span className="text-rose-500 line-through mr-1">€{c.naiveAmount.toFixed(2)}</span>
                                <span className="text-emerald-800 font-bold">€{c.correctedAmount.toFixed(2)}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Ledger */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Ingestion Notification Ledger ({sanitizationReport.notices.length} Actions Logged)
                    </span>
                  </div>

                  {/* Filter Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Filter Action:</span>
                    <select
                      value={noticeFilter}
                      onChange={(e) => setNoticeFilter(e.target.value as any)}
                      className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
                    >
                      <option value="all">All Notices ({sanitizationReport.notices.length})</option>
                      <option value="critical">Critical Only</option>
                      <option value="date-inversion-fixed">Date Inversions Fixed</option>
                      <option value="date-format-corrected">Date Formats Corrected</option>
                      <option value="duplicate-merged">Duplicates Merged</option>
                      <option value="missing-field-imputed">Missing Fields Imputed</option>
                    </select>
                  </div>
                </div>

                {/* Notice Rows */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {filteredNotices.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No notices match the selected category.
                    </div>
                  ) : (
                    filteredNotices.map((notice) => (
                      <div key={notice.id} className="p-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                              notice.severity === 'critical' ? 'bg-rose-100 text-rose-800' :
                              notice.severity === 'warning' ? 'bg-amber-100 text-amber-800' :
                              'bg-[#FDF2F3] text-[#8A212B]'
                            }`}>
                              Row {notice.rowNumber} • {notice.field}
                            </span>
                            <span className="font-mono text-xs font-bold text-slate-900">{notice.assetId}</span>
                          </div>
                          <p className="text-[11px] text-slate-700 font-medium">
                            {notice.description}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-rose-600 line-through bg-rose-50 px-1 py-0.5 rounded">
                              {notice.originalValue}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded">
                              {notice.cleanedValue}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Auto-Corrected</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/70 text-xs">
          <button
            onClick={() => {
              onResetBenchmark();
              onClose();
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Beta Industries Benchmark</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 font-medium transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleApplyImport}
              disabled={!sanitizationReport || sanitizationReport.cleanedRecords.length === 0}
              className="px-4 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl font-bold transition-colors disabled:opacity-40 shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply to Settlement Ledger ({sanitizationReport?.cleanedRecords.length || 0})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
