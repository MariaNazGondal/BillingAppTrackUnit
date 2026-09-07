import React, { useState } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight,
  ExternalLink,
  BookOpen,
  Sparkles,
  Layers
} from 'lucide-react';
import { CalculationResult } from '../types';

interface PublishedFormulaCardProps {
  results: CalculationResult[];
  currency: string;
  noticeDate: string;
}

export const PublishedFormulaCard: React.FC<PublishedFormulaCardProps> = ({
  results,
  currency,
  noticeDate
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedAssetId, setSelectedAssetId] = useState<string>(results[0]?.subscription.assetId || '');

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  const selectedResult = results.find(r => r.subscription.assetId === selectedAssetId) || results[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header Bar */}
      <div 
        className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#8A212B] text-white flex items-center justify-center shadow-2xs">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Published Contractual Billing Formulas & Mathematical Rules
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                Trackunit T&C Section 2
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact algebraic formulas published on Trackunit website governing telematics subscription terminations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://trackunit.com/pricing/"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-[#8A212B] hover:text-[#6B1922] transition-colors"
          >
            <span>Trackunit.com Terms</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button 
            type="button" 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Published Formulas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Rule 1: Contract Term & Cutoff */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px]">
                  Formula 1: Term & Notice Window
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-mono font-bold">
                  36 Mo + 3 Mo Cutoff
                </span>
              </div>
              <div className="font-mono text-slate-800 bg-white p-2 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>Expiry</strong> = StartDate + 36 Calendar Months - 1 Day</div>
                <div className="mt-1"><strong>Notice Cutoff</strong> = (Expiry + 1 Day) - 3 Calendar Months - 1 Day</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Per Trackunit terms, standard telematics subscriptions run for a 36-month initial term. Cancellation requires written notice to Trackunit at least 3 calendar months prior to expiry.
              </p>
            </div>

            {/* Rule 2: Timely vs Late Renewal */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px]">
                  Formula 2: Automatic Renewal
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
                  +12 Mo Extension
                </span>
              </div>
              <div className="font-mono text-slate-800 bg-white p-2 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>IF</strong> NoticeDate &le; NoticeCutoff:</div>
                <div className="pl-2 text-emerald-700 font-semibold">&rarr; CancellationDate = Expiry</div>
                <div><strong>ELSE</strong> (NoticeDate &gt; NoticeCutoff):</div>
                <div className="pl-2 text-amber-700 font-semibold">&rarr; CancellationDate = Expiry + 12 Months</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                If notice arrives with less than 3 months remaining, the subscription automatically renews for 12 months under Trackunit Terms &amp; Conditions §2.
              </p>
            </div>

            {/* Rule 3: Balance Calculation & Zero-Refund */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#8A212B] uppercase tracking-wider text-[11px]">
                  Formula 3: Amount Due & Advance Clause
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 font-mono font-bold">
                  Zero Cash Refund
                </span>
              </div>
              <div className="font-mono text-slate-800 bg-white p-2 rounded-lg border border-slate-200 text-[11px] leading-relaxed">
                <div><strong>Unbilled Months</strong> = MAX(0, MonthDiff(BilledToDate, CancellationDate))</div>
                <div className="mt-1"><strong>Settlement Due</strong> = Unbilled Months &times; MonthlyFee</div>
                <div className="mt-1 text-slate-500"><strong>Advance Billed Refund</strong> = €0.00 (Non-refundable)</div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Non-issued invoices through the effective cancellation date are accelerated into final settlement. Periods already invoiced are strictly non-refundable per Trackunit T&amp;C §2.
              </p>
            </div>
          </div>

          {/* Interactive Live Formula Calculator & Inspector */}
          {selectedResult && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Formula Proof Inspector &bull; Select Asset:
                  </h4>
                </div>
                
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-xs font-mono rounded-lg px-3 py-1.5 text-white focus:ring-1 focus:ring-amber-400 outline-none"
                >
                  {results.map(r => (
                    <option key={r.subscription.assetId} value={r.subscription.assetId}>
                      {r.subscription.assetId} - {r.subscription.assetName.slice(0, 24)} ({r.wasAutoRenewed ? 'LATE / 12-MO' : 'TIMELY'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step-by-Step Numerical Walkthrough */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs font-mono">
                {/* Step 1 */}
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Step 1: Term Dates
                  </span>
                  <div className="text-slate-300">Start: <span className="text-white font-bold">{selectedResult.subscription.startDate}</span></div>
                  <div className="text-slate-300 mt-1">Expiry: <span className="text-white font-bold">{selectedResult.currentTermEndDate}</span></div>
                  <div className="text-amber-400 text-[11px] mt-1">Cutoff: <strong>{selectedResult.noticeDeadlineDate}</strong></div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Step 2: Notice Compliance
                  </span>
                  <div className="text-slate-300">Notice: <span className="text-white font-bold">{noticeDate}</span></div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {selectedResult.isNoticeTimely ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Timely ({Math.abs(selectedResult.daysLateOrEarly)}d early)
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Late ({selectedResult.daysLateOrEarly}d late)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {selectedResult.wasAutoRenewed ? 'Rolled over +12 Mo' : 'Terminates at Term End'}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Step 3: Unbilled Horizon
                  </span>
                  <div className="text-slate-300">Billed To: <span className="text-white font-bold">{selectedResult.subscription.billedToDate}</span></div>
                  <div className="text-slate-300 mt-1">Cancellation: <span className="text-white font-bold">{selectedResult.effectiveCancellationDate}</span></div>
                  <div className="text-white font-bold mt-1 text-sm text-emerald-400">
                    &Delta; = {selectedResult.unbilledMonths} Unbilled Months
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-800/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    Step 4: Final Settlement Due
                  </span>
                  <div className="text-slate-300">Rate: {sym}{selectedResult.subscription.monthlyFee.toFixed(2)}/mo</div>
                  <div className="text-slate-300 mt-0.5">{selectedResult.unbilledMonths} mo &times; {sym}{selectedResult.subscription.monthlyFee.toFixed(2)}</div>
                  <div className="text-xl font-bold font-mono text-white mt-1 text-emerald-300">
                    = {sym}{selectedResult.remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
