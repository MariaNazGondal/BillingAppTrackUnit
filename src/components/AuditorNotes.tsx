import React from 'react';
import { 
  FileText, 
  ShieldAlert, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Scale, 
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { SettlementSummary, CalculationResult } from '../types';

interface AuditorNotesProps {
  summary: SettlementSummary;
  currency: string;
  customerName?: string;
  noticeDate?: string;
  results?: CalculationResult[];
}

export const AuditorNotes: React.FC<AuditorNotesProps> = ({ 
  summary, 
  currency, 
  customerName = 'Beta Industries',
  noticeDate = '2025-07-31',
  results = []
}) => {
  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  // Dynamically analyze flagged categories from current dataset
  const lateRenewedUnits = results.filter(r => r.wasAutoRenewed);
  const prepaidUnits = results.filter(r => r.overbilledAmount > 0);
  const arrearsUnits = results.filter(r => r.unbilledMonths > 12);
  const timelyUnits = results.filter(r => r.isNoticeTimely && r.unbilledMonths > 0);

  return (
    <div className="space-y-6 my-6 text-slate-800">
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Auditor & Legal Explanatory Notes: Final Settlement — {customerName}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-amber-50 text-amber-700 border border-amber-200">
                Audit Memorandum
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive contractual analysis, mathematical formulation, questions documented, and flagged data inconsistencies for Trackunit Billing Collection across {summary.totalAssets} fleet units.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Approach & Methodological Framework */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-blue-600" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            1. Methodological Approach & Contractual Interpretation
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {customerName} served written notice of collaboration discontinuation on <strong className="text-slate-900">{noticeDate}</strong>. To calculate the remaining financial obligation with absolute accuracy, our analysis applied <strong className="text-slate-900">Trackunit Terms & Conditions Section 2 ("Fleet Plan and Asset Configuration")</strong> as the governing standard.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              The 36-Month Initial Term Benchmark
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Section 2 stipulates that Fleet Plans and Asset Configurations are entered for an initial term of 36 months. Subscriptions cannot be terminated prior to month 36 without full payment of all remaining non-issued invoices.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              The 3-Month Notice & Automatic 12-Month Renewal
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Notice must be submitted at least three (3) calendar months prior to the end of the respective term. Any notice received after this cutoff automatically triggers a binding 12-month Renewal Term.
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Mathematical Formulas Applied */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            2. Exact Mathematical Formulas Applied pr. Subscription
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          For every individual asset in {customerName}'s fleet dataset, the calculation engine systematically applies the following algorithmic sequence:
        </p>

        <div className="space-y-3 mt-2 text-xs font-mono">
          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-bold font-sans text-xs">Step 1: Term Expiration Date Determination</div>
            <div className="text-slate-300">InitialTermEndDate = StartDate + 36 Calendar Months (Day prior to anniversary)</div>
            <div className="text-slate-400 text-[11px] font-sans">
              If NoticeDate &gt; InitialTermEndDate, CurrentTermEndDate = InitialTermEndDate + (k × 12 Months), where k is the active renewal cycle.
            </div>
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-bold font-sans text-xs">Step 2: Three-Month Notice Deadline Check</div>
            <div className="text-slate-300">NoticeCutoff = CurrentTermEndDate - 3 Calendar Months</div>
            <div className="text-slate-300">IsNoticeTimely = (NoticeDate ≤ NoticeCutoff)</div>
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-bold font-sans text-xs">Step 3: Effective Cancellation Date Rule</div>
            <div className="text-emerald-400">IF IsNoticeTimely = TRUE  → EffectiveCancellationDate = CurrentTermEndDate</div>
            <div className="text-amber-400">IF IsNoticeTimely = FALSE → EffectiveCancellationDate = CurrentTermEndDate + 12 Months</div>
          </div>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <div className="text-amber-400 font-bold font-sans text-xs">Step 4: Unbilled Period & Financial Obligation</div>
            <div className="text-slate-300">UnbilledMonths = MAX(0, MonthDiff(BilledToDate, EffectiveCancellationDate))</div>
            <div className="text-blue-300 font-bold text-sm">RemainingFinancialObligation = UnbilledMonths × MonthlyFee</div>
            <div className="text-slate-400 text-[11px] font-sans">
              *T&C Section 2 Strict Clause: If BilledToDate &gt; EffectiveCancellationDate, NonRefundablePrepaid = (BilledToDate - EffectiveCancellationDate) × MonthlyFee. Refund = {sym}0.00.
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Critical Data Inconsistencies Flagged */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              3. Critical Data Inconsistencies & Anomalies Flagged ({summary.flaggedInconsistenciesCount} Identified in {customerName})
            </h3>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200 self-start sm:self-auto font-mono">
            Action Required Before Settlement
          </span>
        </div>

        <p className="text-xs text-slate-600">
          Our line-by-line audit revealed the following operational and contractual findings across the current fleet:
        </p>

        <div className="space-y-3 mt-2">
          {/* Late Notice Rollover */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-amber-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-[11px]">1</span>
                <span>Late Notice Involuntary 12-Month Extensions ({lateRenewedUnits.length} Units Affected)</span>
              </div>
              <span className="text-amber-800 font-mono font-bold">+{sym}{summary.autoRenewalRevenueGain.toLocaleString()} Revenue Impact</span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-7">
              <strong>Contractual Mandate:</strong> Section 2 triggers an automatic 12-month renewal term whenever notice is served &lt; 3 months prior to term expiration.
              {lateRenewedUnits.length > 0 && (
                <span className="block mt-1 text-amber-900 font-medium">
                  Affected units in fleet: {lateRenewedUnits.map(u => `${u.subscription.assetId} (${u.subscription.assetName.slice(0, 16)}...)`).slice(0, 6).join(', ')}{lateRenewedUnits.length > 6 ? ` and ${lateRenewedUnits.length - 6} more` : ''}.
                </span>
              )}
              <strong>Auditor Recommendation:</strong> Expect substantial customer friction if this was unintentional. Prepare an executive escalation dossier showing the verbatim clause and time-stamped notice receipt of {noticeDate}.
            </p>
          </div>

          {/* Prepaid Advance Billing */}
          <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-rose-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-[11px]">2</span>
                <span>Prepaid Advance Billing vs. Cancellation Date ({prepaidUnits.length} Units Affected)</span>
              </div>
              <span className="text-rose-700 font-mono font-bold">
                {sym}{prepaidUnits.reduce((acc, u) => acc + u.overbilledAmount, 0).toFixed(2)} at stake
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-7">
              <strong>Inconsistency:</strong> Customer was billed ahead of the contractual effective cancellation date.
              {prepaidUnits.length > 0 && (
                <span className="block mt-1 text-rose-900 font-medium">
                  Identified assets: {prepaidUnits.map(u => `${u.subscription.assetId} (billed to ${u.subscription.billedToDate}, cancelled ${u.effectiveCancellationDate})`).join(', ')}.
                </span>
              )}
              <strong>Contractual Mandate:</strong> Section 2 explicitly states: <em>&ldquo;No repayment is made for the subscriptions invoiced, even if cancelled earlier than the end of the Initial Term.&rdquo;</em>
              <br />
              <strong>Auditor Recommendation:</strong> Trackunit must NOT issue a credit memo or refund. The settlement amount for pre-billed periods is {sym}0.00, and the pre-collected funds are retained.
            </p>
          </div>

          {/* Arrears / Historic Blackout */}
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="font-bold text-blue-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center font-bold text-[11px]">3</span>
                <span>Historic Billing Gaps / Extended Unbilled Horizons ({arrearsUnits.length} Units &gt;12 Months)</span>
              </div>
              <span className="text-blue-800 font-mono font-bold">
                {sym}{arrearsUnits.reduce((acc, u) => acc + u.remainingObligation, 0).toLocaleString()} Total Balance
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed pl-7">
              <strong>Inconsistency:</strong> Subscriptions where last billed-to date is significantly in arrears or spans extensive unbilled time during which telematics services were continuously provisioned.
              {arrearsUnits.length > 0 && (
                <span className="block mt-1 text-blue-900 font-medium">
                  Identified assets: {arrearsUnits.map(u => `${u.subscription.assetId} (${u.unbilledMonths} unbilled mos)`).slice(0, 4).join(', ')}.
                </span>
              )}
              <strong>Auditor Recommendation:</strong> Enforce the clause <em>&ldquo;non-issued invoice(s) for Fleet Plan or Asset Configuration will be invoiced&rdquo;</em> immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Section 4: Documented Questions for Trackunit Management */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          <h3 className="text-base font-bold text-slate-800 tracking-tight">
            4. Documented Questions for Trackunit Legal, Commercial & Billing Stakeholders
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Q1: Commercial Settlement vs. Strict Enforcement?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              If {customerName} contests the involuntary 12-month renewal on late-notice units ({sym}{summary.autoRenewalRevenueGain.toLocaleString()}), does Trackunit have a mandated policy allowing a compromise early-exit buyout (e.g. 50% lump-sum discount in exchange for immediate 10-day bank wire settlement)?
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Q2: Hardware Device Disposition & Physical Return?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Were the Raw, Spot, and Beam IoT hardware units across {summary.totalAssets} units sold outright (CapEx) or leased as part of the Fleet Plan? If leased, must physical return of hardware be mandated, or should replacement fees be added?
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Q3: API Access Cutoff Date & Data Archival?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              For subscriptions ending timely vs those auto-renewed, will Trackunit keep the Iris/Manager portal active for the whole fleet, or deactivate units sequentially as their respective effective cancellation dates are reached?
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-purple-600" />
              Q4: Invoice Payment Terms for the Settlement Overview?
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Will the final balance of {sym}{summary.totalSettlementAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} be billed as a single consolidated accelerated invoice with standard Net 30 terms, or billed monthly through each unit's contractual cancellation date?
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Step-by-Step Billing Collection Playbook */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-base font-bold flex items-center gap-2 mb-2 tracking-tight">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>Trackunit Billing Collection Action Playbook</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          Recommended sequence for the Trackunit credit control and collection team to ensure maximum cash realization and minimum dispute overhead with {customerName}:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
            <span className="text-amber-400 font-bold block text-[10px] font-mono uppercase tracking-wider">Phase 1: Issuance</span>
            <div className="font-semibold text-white">Send High-Level Statement</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Issue the high-level settlement schedule along with an official copy of Section 2 highlighting the exact notice submission timestamp of {noticeDate}.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
            <span className="text-amber-400 font-bold block text-[10px] font-mono uppercase tracking-wider">Phase 2: Pre-Empt Objections</span>
            <div className="font-semibold text-white">Address Inconsistency Hotspots</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Proactively explain the non-refundable nature of prepaid units, the legal rationale behind the 12-month rollover, and the recovery of past arrears.
            </p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-1.5">
            <span className="text-amber-400 font-bold block text-[10px] font-mono uppercase tracking-wider">Phase 3: Cash Settlement</span>
            <div className="font-semibold text-white">Execute Final Mutual Release</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Upon receipt of {sym}{summary.totalSettlementAmount.toLocaleString()}, execute a formal mutual release agreement discharging both parties from future obligations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
