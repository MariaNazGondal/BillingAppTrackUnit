import React from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  RotateCcw, 
  Calendar, 
  HelpCircle, 
  ShieldAlert, 
  ExternalLink, 
  Receipt, 
  Wand2 
} from 'lucide-react';
import { TrackunitLogo } from './TrackunitLogo';

export type AppTab = 'cleaning' | 'terms' | 'formulas' | 'visuals' | 'ledger' | 'notes' | 'table' | 'tc-engine';

interface HeaderProps {
  customerName: string;
  onCustomerNameChange?: (name: string) => void;
  loadedFileName?: string | null;
  noticeDate: string;
  onNoticeDateChange: (date: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  onExportCsv: () => void;
  onOpenStatement: () => void;
  onOpenInvoice?: () => void;
  onOpenImport: () => void;
  onResetData: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  flaggedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  customerName,
  onCustomerNameChange,
  loadedFileName,
  noticeDate,
  onNoticeDateChange,
  currency,
  onCurrencyChange,
  onExportCsv,
  onOpenStatement,
  onOpenInvoice,
  onOpenImport,
  onResetData,
  activeTab,
  onTabChange,
  flaggedCount
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs flex-shrink-0">
      {/* Top Brand & Utility Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Trackunit Official Brand Identity (Clean - No customer/file data) */}
        <div className="flex items-center gap-4">
          <TrackunitLogo 
            variant="red" 
            size="md" 
            subtitle="Denmark HQ • Fleet Billing & Data Cleaning Engine"
          />

          <div className="h-7 w-px bg-slate-200 hidden sm:block"></div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-sans">
            <button
              onClick={() => onTabChange('tc-engine')}
              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#FDF2F3] text-[#8A212B] hover:bg-[#FCE7E9] border border-[#FCA5A5] font-bold transition-colors cursor-pointer"
              title="Click to view full embedded Trackunit Master T&C clauses"
            >
              Embedded T&amp;C §2
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => onTabChange('tc-engine')}
              className="text-slate-600 hover:text-[#8A212B] flex items-center gap-1 transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to view official embedded Trackunit price catalog"
            >
              <span>Embedded Price Catalog</span>
            </button>
            <span className="text-slate-300">•</span>
            <button 
              onClick={() => onTabChange('tc-engine')}
              className="text-slate-600 hover:text-[#8A212B] flex items-center gap-1 transition-colors font-medium text-[11px] cursor-pointer"
              title="Click to view embedded Trackunit SLA specifications"
            >
              <span>99.8% SLA</span>
            </button>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* System Telematics Status */}
          <button
            onClick={() => onTabChange('tc-engine')}
            className="hidden xl:flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs transition-colors cursor-pointer"
            title="All Trackunit T&Cs, clauses, and price catalogs are statically stored locally in application memory (0ms execution, zero web requests). Click to inspect."
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-800 font-bold text-[11px]">Embedded T&amp;C &amp; Prices (100% Offline)</span>
          </button>

          {/* Notice Date Control */}
          <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Notice Date:</span>
            <input 
              type="date" 
              value={noticeDate}
              onChange={(e) => onNoticeDateChange(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
              title="Formal written notice date submitted to Trackunit"
            />
            {!noticeDate && (
              <span className="text-[10px] font-mono text-slate-400 italic">Blank</span>
            )}
          </div>

          {/* Currency Toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs font-semibold">
            {['EUR', 'USD', 'GBP', 'DKK'].map((curr) => (
              <button
                key={curr}
                onClick={() => onCurrencyChange(curr)}
                className={`px-2 py-0.5 rounded-lg transition-all text-xs ${
                  currency === curr 
                    ? 'bg-white text-slate-900 shadow-xs font-bold' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {curr === 'EUR' ? '€' : curr === 'USD' ? '$' : curr === 'GBP' ? '£' : 'kr'}
              </button>
            ))}
          </div>

          {/* Upload & Clean Action */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
            title="Upload customer Excel (.xlsx, .xls) or CSV file with deduplication & date cleaning"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload &amp; Clean Excel</span>
          </button>

          {/* PDF Receipt Action */}
          {onOpenInvoice && (
            <button
              onClick={onOpenInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              title="Generate official Trackunit PDF receipt & simplified customer statement"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Official PDF Receipt</span>
            </button>
          )}

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors"
            title="Export full settlement table in Excel compatible CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onResetData}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs transition-colors"
            title="Reset dataset or reload test data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Workflow Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between border-t border-slate-100 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-2 py-2">
          {/* Step 1: Data Cleaning */}
          <button
            onClick={() => onTabChange('cleaning')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'cleaning'
                ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Wand2 className={`w-3.5 h-3.5 ${activeTab === 'cleaning' ? 'text-[#8A212B]' : 'text-slate-500'}`} />
            <span>1. Data Cleaning &amp; Dates</span>
            <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-emerald-600 text-white">
              Zero-Dupes
            </span>
          </button>

          {/* Step 2: Terms & Conditions */}
          <button
            onClick={() => onTabChange('terms')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'terms' || activeTab === 'tc-engine'
                ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className={`w-3.5 h-3.5 ${activeTab === 'terms' || activeTab === 'tc-engine' ? 'text-[#8A212B]' : 'text-slate-500'}`} />
            <span>2. Terms &amp; Conditions</span>
          </button>

          {/* Step 3: Published Formulas */}
          <button
            onClick={() => onTabChange('formulas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'formulas'
                ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className={`w-3.5 h-3.5 ${activeTab === 'formulas' ? 'text-[#8A212B]' : 'text-slate-500'}`} />
            <span>3. Published Formulas</span>
          </button>

          {/* Step 4: Visual Dashboard */}
          <button
            onClick={() => onTabChange('visuals')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'visuals'
                ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${activeTab === 'visuals' ? 'bg-[#8A212B]' : 'bg-slate-400'}`}></span>
            <span>4. Visual Dashboard</span>
          </button>

          {/* Step 5: Settlement Ledger & PDF Receipt */}
          <button
            onClick={() => onTabChange('ledger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'ledger' || activeTab === 'table'
                ? 'bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'ledger' || activeTab === 'table' ? 'text-[#8A212B]' : 'text-slate-500'}`} />
            <span>5. Settlement Ledger &amp; PDF</span>
          </button>

          {/* Auditor Review */}
          <button
            onClick={() => onTabChange('notes')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'notes'
                ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Auditor Review</span>
            {flaggedCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                {flaggedCount}
              </span>
            )}
          </button>
        </nav>

        <div className="hidden lg:flex items-center text-xs text-slate-500 font-medium gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-slate-100 text-slate-700 font-bold border border-slate-200">
            Trackunit Denmark • T&amp;C §2 Verified
          </span>
        </div>
      </div>
    </header>
  );
};
