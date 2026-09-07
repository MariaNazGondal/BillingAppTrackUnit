import React from 'react';
import { SettlementSummary } from '../types';
import { 
  TrendingUp, 
  AlertCircle, 
  CalendarClock, 
  Clock, 
  ShieldCheck, 
  Coins,
  Receipt
} from 'lucide-react';

interface KpiSummaryCardsProps {
  summary: SettlementSummary;
  currency: string;
  noticeDate?: string;
  onOpenInvoice?: () => void;
}

export const KpiSummaryCards: React.FC<KpiSummaryCardsProps> = ({ 
  summary, 
  currency, 
  noticeDate = '',
  onOpenInvoice 
}) => {
  const getSymbol = (c: string) => {
    switch (c) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'GBP': return '£';
      case 'DKK': return 'kr ';
      default: return '€';
    }
  };

  const sym = getSymbol(currency);

  return (
    <div className="space-y-4 my-6">
      {/* Sleek Interface: Active Billing Formula Hero Container */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Active Billing Formula Engine</h2>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Automated Calculation Logic strictly enforcing Trackunit Terms & Conditions Section 2
            </p>
          </div>
          <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono tracking-widest uppercase border border-white/10 self-start sm:self-auto">
            Contract Model v2.4 • 36mo Initial + 12mo Auto-Renewal
          </div>
        </div>

        {/* Live Mathematical Formula Visualizer */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5 mb-5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-mono text-xs sm:text-sm md:text-base text-blue-300 text-center">
            <span className="font-bold text-white">Total Charge</span>
            <span className="text-slate-500 font-sans">=</span>
            <span className="bg-blue-900/60 px-3 py-1 rounded-lg border border-blue-600/60 text-blue-200">
              Unbilled Months × Monthly Fee
            </span>
            <span className="text-slate-500 font-sans">+</span>
            <span className="bg-amber-900/40 px-3 py-1 rounded-lg border border-amber-500/50 text-amber-200">
              Late Notice Extension (12 Mo)
            </span>
            <span className="text-slate-500 font-sans">−</span>
            <span className="bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-slate-300">
              Prepaid Retained (€0 Refund)
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-[10px] text-slate-400 uppercase tracking-wider text-center pt-3 border-t border-white/5">
            <div>Section 2 Rule 1: 36-Mo Initial</div>
            <div>Section 2 Rule 2: 12-Mo Auto-Renewal</div>
            <div>Section 2 Rule 3: 3-Mo Notice Cutoff</div>
            <div>Section 2 Rule 4: No Repayment Clause</div>
          </div>
        </div>

        {/* Bottom Formula Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Contract Cutoff Date</span>
            <span className="text-sm sm:text-base font-bold text-white font-mono">Term End − 3 Months</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Notice Evaluation</span>
            <span className="text-sm sm:text-base font-bold text-amber-400 font-mono">{noticeDate || 'Pending Upload'}</span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Total Assets Assessed</span>
            <span className="text-sm sm:text-base font-bold text-emerald-400 font-mono">
              {summary.totalAssets > 0 ? `${summary.totalAssets} Active Units` : 'Awaiting File'}
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">Audit Verification</span>
            <span className="text-sm sm:text-base font-bold text-blue-400 font-mono">
              {summary.totalAssets > 0 ? '100% Math Verified' : 'T&C §2 Rules Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Sleek Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Final Settlement Obligation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Final Settlement
            </span>
            <div className="flex items-center gap-1.5">
              {onOpenInvoice && summary.totalAssets > 0 && (
                <button
                  onClick={onOpenInvoice}
                  className="px-2 py-0.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                  title="Generate simplified payment invoice & PDF receipt"
                >
                  <Receipt className="w-3 h-3" />
                  <span>PDF Invoice</span>
                </button>
              )}
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
              {summary.totalAssets > 0 ? `${sym}${summary.totalSettlementAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            {summary.totalAssets > 0 ? (
              <>
                <span className="font-semibold text-slate-700">{summary.totalAssets} Active Subscriptions</span>
                <span>•</span>
                <span>{summary.totalUnbilledMonths} Unbilled Months</span>
              </>
            ) : (
              <span className="text-slate-400 italic">Upload fleet spreadsheet in Step 1</span>
            )}
          </p>
        </div>

        {/* Timely Terminations vs Auto-Renewals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Notice Timing Breakdown
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xl sm:text-2xl font-bold text-amber-600 tabular-nums">
                {summary.totalAssets > 0 ? summary.autoRenewedCount : '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">Auto-Renewed</span>
            </div>
            <div className="text-right">
              <span className="text-xl sm:text-2xl font-bold text-emerald-600 tabular-nums">
                {summary.totalAssets > 0 ? summary.timelyTerminationsCount : '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">Timely Notice</span>
            </div>
          </div>
          <div className="mt-2.5 text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100 font-medium">
            {summary.totalAssets > 0 ? (
              <>
                <span>Late Rollovers: <strong className="text-amber-700">{sym}{summary.autoRenewedAmount.toLocaleString('en-US')}</strong></span>
                <span>Timely: <strong className="text-emerald-700">{sym}{summary.timelyTerminationsAmount.toLocaleString('en-US')}</strong></span>
              </>
            ) : (
              <span className="text-slate-400 italic">Notice cutoff: 3 months prior to expiry</span>
            )}
          </div>
        </div>

        {/* Revenue Secured via T&C Section 2 Clause */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              T&C Revenue Protection
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 tabular-nums">
              {summary.totalAssets > 0 ? `${sym}${(summary.autoRenewalRevenueGain + summary.totalPrepaidNonRefundableAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 font-medium">
            {summary.totalAssets > 0 ? (
              <>
                <span>12-Mo Rollover: <strong className="text-slate-800">{sym}{summary.autoRenewalRevenueGain.toLocaleString()}</strong></span>
                <span className="mx-1">•</span>
                <span>Prepaid Retained: <strong className="text-slate-800">{sym}{summary.totalPrepaidNonRefundableAmount.toLocaleString()}</strong></span>
              </>
            ) : (
              <span className="text-slate-400 italic">Governed by Trackunit T&C §2</span>
            )}
          </p>
        </div>

        {/* Flagged Audit Inconsistencies */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Audit Flags & Inconsistencies
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              summary.flaggedInconsistenciesCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${
              summary.flaggedInconsistenciesCount > 0 ? 'text-rose-600' : 'text-slate-700'
            }`}>
              {summary.flaggedInconsistenciesCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">Flagged Items</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Billing lag arrears, decommission disputes & non-refundable pre-bills.
          </p>
        </div>
      </div>
    </div>
  );
};
