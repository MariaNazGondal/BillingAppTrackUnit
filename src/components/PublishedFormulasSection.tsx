import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Calendar, 
  Sliders, 
  Sparkles, 
  Coins, 
  Scale, 
  TrendingDown,
  Info,
  HelpCircle
} from 'lucide-react';
import { CalculationResult, FormulaConfig, FormulaPresetId, SubscriptionRecord } from '../types';
import { FORMULA_PRESETS, calculateSubscriptionWithFormula } from '../utils/formulaEngine';
import { PublishedFormulaCard } from './PublishedFormulaCard';
import { calculateSubscriptionSettlement } from '../utils/calculator';

interface PublishedFormulasSectionProps {
  currentFormulaConfig?: FormulaConfig;
  onSelectFormulaPreset?: (preset: FormulaPresetId) => void;
  subscriptions: SubscriptionRecord[];
  results: CalculationResult[];
  noticeDate?: string;
  currency?: string;
  onProceedToVisuals?: () => void;
  onOpenUpload?: () => void;
}

export const PublishedFormulasSection: React.FC<PublishedFormulasSectionProps> = ({
  currentFormulaConfig,
  onSelectFormulaPreset,
  subscriptions,
  results,
  noticeDate = '',
  currency = 'EUR',
  onProceedToVisuals,
  onOpenUpload
}) => {
  const [selectedPreset, setSelectedPreset] = useState<FormulaPresetId>('strict-tc-section-2');
  const [activeFormulaSub, setActiveFormulaSub] = useState<string>(results[0]?.subscription.assetId || subscriptions[0]?.assetId || '');

  // Simulator state
  const [simStartDate, setSimStartDate] = useState('2022-09-01');
  const [simNoticeDate, setSimNoticeDate] = useState(noticeDate || '2025-07-31');
  const [simBilledToDate, setSimBilledToDate] = useState('2025-06-30');
  const [simMonthlyFee, setSimMonthlyFee] = useState(19.50);

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  // Compute live simulator outcome
  const mockSub: SubscriptionRecord = {
    id: 'SIM-999',
    assetId: 'SIM-001',
    assetName: 'Simulation Telematics Machine',
    serialNumber: 'SIM-SN-12345',
    category: 'Heavy Machinery',
    startDate: simStartDate,
    billedToDate: simBilledToDate,
    monthlyFee: simMonthlyFee,
    billingFrequency: 'Monthly',
    deviceType: 'Raw',
    planType: 'Explore'
  };

  const simResult = calculateSubscriptionSettlement(mockSub, simNoticeDate);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8A212B] text-white flex items-center justify-center shadow-xs shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Step 3: Published Billing Formulas &amp; Arithmetic Proofs
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  Trackunit Website Clauses
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Algebraic Precision
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                These mathematical formulas are published directly in Trackunit Denmark&apos;s Master Subscription Agreement and pricing schedules. They govern exact initial term expiration, the 3-month notice cutoff, involuntary 12-month renewal roll-overs, and non-refundable prepaid retainage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onProceedToVisuals && (
              <button
                onClick={onProceedToVisuals}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Proceed to Step 4: Visual Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Initial Term</span>
            <span className="font-bold text-slate-900 text-sm">36 Calendar Months</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Notice Cutoff</span>
            <span className="font-bold text-slate-900 text-sm">&ge; 3 Months Before Expiry</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Late Notice Consequence</span>
            <span className="font-bold text-amber-700 text-sm">+12 Month Extension</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Prepaid Periods</span>
            <span className="font-bold text-[#8A212B] text-sm">Strictly Non-Refundable</span>
          </div>
        </div>
      </div>

      {/* 2. Official Published Formulas Card & Interactive Inspector */}
      {results.length > 0 ? (
        <PublishedFormulaCard 
          results={results} 
          currency={currency} 
          noticeDate={noticeDate} 
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#8A212B]" />
              <h3 className="text-sm font-bold text-slate-900">
                Published Trackunit Billing Algebraic Equations
              </h3>
            </div>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="text-xs font-bold text-[#8A212B] hover:underline"
              >
                Upload fleet spreadsheet to inspect live machine proofs &rarr;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px] block">
                Formula 1: Term Expiration &amp; Cutoff
              </span>
              <div className="font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>Expiry</strong> = StartDate + 36 Months - 1 Day</div>
                <div className="mt-1"><strong>Notice Cutoff</strong> = Expiry - 3 Months</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Trackunit master agreements establish an involuntary 36-month baseline from unit activation.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px] block">
                Formula 2: Involuntary Auto-Renewal
              </span>
              <div className="font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>IF</strong> NoticeDate &le; Cutoff: Term End</div>
                <div className="mt-1 text-amber-700"><strong>ELSE</strong>: Term End + 12 Months</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Notice received less than 3 months prior to term expiration automatically renews for 12 months.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px] block">
                Formula 3: Settlement Due Calculation
              </span>
              <div className="font-mono text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>Unbilled Months</strong> = MAX(0, Cancellation - BilledTo)</div>
                <div className="mt-1"><strong>Due</strong> = Unbilled Months &times; Monthly Fee</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Remaining monthly fees accelerate immediately. Advance invoiced periods are strictly non-refundable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Interactive Formula Sandbox / Single Machine Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>Interactive Formula Sandbox &bull; Single Asset Simulation</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                Test Any Date Scenario
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter test activation dates, notice dates, and billing periods to observe how Trackunit formulas execute.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Contract Start Date:</label>
            <input
              type="date"
              value={simStartDate}
              onChange={(e) => setSimStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-1 focus:ring-[#8A212B] outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Notice Submitted Date:</label>
            <input
              type="date"
              value={simNoticeDate}
              onChange={(e) => setSimNoticeDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-1 focus:ring-[#8A212B] outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Last Invoiced Billed-To Date:</label>
            <input
              type="date"
              value={simBilledToDate}
              onChange={(e) => setSimBilledToDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-1 focus:ring-[#8A212B] outline-none"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Monthly Fee ({sym}):</label>
            <input
              type="number"
              step="0.5"
              value={simMonthlyFee}
              onChange={(e) => setSimMonthlyFee(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 text-xs focus:ring-1 focus:ring-[#8A212B] outline-none"
            />
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="p-4 rounded-xl bg-slate-900 text-white font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">36-Mo Term Expiry</span>
              <span className="text-white font-bold text-sm">{simResult.initialTermEndDate}</span>
              <div className="text-[10px] text-amber-400 mt-1">
                Notice Cutoff: <strong>{simResult.noticeDeadlineDate}</strong>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Notice Compliance</span>
              <span className={`font-bold text-sm flex items-center gap-1 ${simResult.isNoticeTimely ? 'text-emerald-400' : 'text-amber-400'}`}>
                {simResult.isNoticeTimely ? 'TIMELY (Term Ends Expiry)' : 'LATE (+12 Months Auto-Renew)'}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                Effective End: <strong className="text-white">{simResult.effectiveCancellationDate}</strong>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Unbilled Exposure</span>
              <span className="text-white font-bold text-sm">
                {simResult.unbilledMonths} Months
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                From {simBilledToDate} to {simResult.effectiveCancellationDate}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Settlement Charge Due</span>
              <span className="text-emerald-400 font-bold text-base">
                {sym}{simResult.remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <div className="text-[10px] text-slate-400 mt-1">
                {simResult.unbilledMonths} mo &times; {sym}{simMonthlyFee.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
