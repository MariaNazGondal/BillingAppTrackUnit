import React, { useState } from 'react';
import { 
  FileText, 
  HelpCircle, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Calculator, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Clock, 
  FileCheck2,
  Sliders,
  Sparkles,
  Coins,
  Scale,
  TrendingDown
} from 'lucide-react';
import { calculateSubscriptionSettlement, formatDate } from '../utils/calculator';
import { FORMULA_PRESETS, calculateSubscriptionWithFormula } from '../utils/formulaEngine';
import { SubscriptionRecord, FormulaPresetId, FormulaConfig, CalculationResult } from '../types';
import { TrackunitPricingCatalogCard } from './TrackunitPricingCatalogCard';

interface TermsAndConditionsSectionProps {
  currentFormulaConfig?: FormulaConfig;
  onSelectFormulaPreset?: (preset: FormulaPresetId) => void;
  subscriptions?: SubscriptionRecord[];
  results?: CalculationResult[];
  customerName?: string;
  noticeDate?: string;
  currency?: string;
  onProceedToFormulas?: () => void;
}

export const TermsAndConditionsSection: React.FC<TermsAndConditionsSectionProps> = ({
  currentFormulaConfig,
  onSelectFormulaPreset,
  subscriptions = [],
  results,
  customerName = '',
  noticeDate = '',
  currency = 'EUR',
  onProceedToFormulas
}) => {
  const [selectedPreset, setSelectedPreset] = useState<FormulaPresetId>('strict-tc-section-2');
  const [activeFormulaSub, setActiveFormulaSub] = useState<string>(subscriptions[0]?.assetId || '');
  
  // Custom sandbox controls
  const [customInitialMonths, setCustomInitialMonths] = useState<number>(36);
  const [customRenewalMonths, setCustomRenewalMonths] = useState<number>(12);
  const [customNoticeMonths, setCustomNoticeMonths] = useState<number>(3);
  const [customDiscountPercent, setCustomDiscountPercent] = useState<number>(0);
  const [customAllowPrepaidCredit, setCustomAllowPrepaidCredit] = useState<boolean>(false);
  const [customCashDiscount, setCustomCashDiscount] = useState<number>(0);

  // Single Asset Simulator State
  const [simStartDate, setSimStartDate] = useState('2022-09-01');
  const [simNoticeDate, setSimNoticeDate] = useState(noticeDate || '2025-07-31');
  const [simBilledToDate, setSimBilledToDate] = useState('2025-06-30');
  const [simMonthlyFee, setSimMonthlyFee] = useState(49.00);

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  const activeConfig: FormulaConfig = selectedPreset === 'custom-sandbox' ? {
    id: 'custom-sandbox',
    name: 'Custom Parameter Sandbox',
    badge: 'Custom Configured',
    description: 'User-configured parameters for contract duration, notice window, and settlement discounts.',
    initialTermMonths: customInitialMonths,
    renewalTermMonths: customRenewalMonths,
    noticeWindowMonths: customNoticeMonths,
    autoRenewalDiscountPercent: customDiscountPercent,
    allowPrepaidCredit: customAllowPrepaidCredit,
    cashAccelerationDiscountPercent: customCashDiscount,
    prorationMethod: 'whole-calendar-month'
  } : FORMULA_PRESETS[selectedPreset];

  const mockSub: SubscriptionRecord = {
    id: 'SIM-001',
    assetId: 'SIM-ASSET-101',
    assetName: 'Interactive Simulation Machine',
    deviceType: 'Raw',
    serialNumber: 'SIM-SERIAL-999',
    planType: 'Advanced',
    billingFrequency: 'Monthly',
    monthlyFee: simMonthlyFee,
    startDate: simStartDate,
    billedToDate: simBilledToDate,
  };

  const simResult = calculateSubscriptionWithFormula(mockSub, simNoticeDate, activeConfig);

  // Calculate fleet-wide impact across current fleet records under each formula preset
  const fleetFormulaComparisons = React.useMemo(() => {
    const presets = Object.values(FORMULA_PRESETS);
    // Baseline strict total
    let strictBaselineTotal = 0;
    for (const rec of subscriptions) {
      const res = calculateSubscriptionWithFormula(rec, noticeDate, FORMULA_PRESETS['strict-tc-section-2']);
      strictBaselineTotal += res.remainingObligation;
    }

    return presets.map(p => {
      let totalAmount = 0;
      let autoRenewCount = 0;
      let timelyCount = 0;

      for (const rec of subscriptions) {
        const res = calculateSubscriptionWithFormula(rec, noticeDate, p);
        totalAmount += res.remainingObligation;
        if (res.wasAutoRenewed) autoRenewCount++;
        else timelyCount++;
      }

      return {
        preset: p,
        totalFleetSettlement: Math.round(totalAmount * 100) / 100,
        autoRenewCount,
        timelyCount,
        varianceFromStrict: Math.round((totalAmount - strictBaselineTotal) * 100) / 100
      };
    });
  }, [subscriptions, noticeDate]);

  const benchmarkAsset = subscriptions.find(a => a.assetId === activeFormulaSub) || subscriptions[0];
  const benchmarkAssetResult = benchmarkAsset ? calculateSubscriptionWithFormula(benchmarkAsset, noticeDate, activeConfig) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step 2 Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#8A212B] text-white flex items-center justify-center shadow-xs shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Step 2: Terms &amp; Conditions &amp; Official Pricing Catalog
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  Trackunit Master Agreement
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  100% Embedded Offline
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                Review Trackunit Denmark&apos;s contractual terms, clauses §1 through §8, hardware/software pricing schedules (Explore, Evolve, Expand, Spot, Kin, Raw), and 99.8% uptime SLA terms.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onProceedToFormulas && (
              <button
                onClick={onProceedToFormulas}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Proceed to Step 3: Published Formulas</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Contractual Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Governing Law</span>
            <span className="font-bold text-slate-900 text-sm">Aalborg, Denmark</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Agreement Basis</span>
            <span className="font-bold text-slate-900 text-sm">Master Subscription</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Service Level SLA</span>
            <span className="font-bold text-emerald-800 text-sm">99.8% Core Uptime</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Clauses Covered</span>
            <span className="font-bold text-[#8A212B] text-sm">§1 to §8 Complete</span>
          </div>
        </div>
      </div>

      {/* Embedded Trackunit Master Terms & Price Catalog (100% In-Memory / Offline) */}
      <TrackunitPricingCatalogCard 
        currency={currency}
      />

      {/* Contract Section 2 Exact Verbatim Citation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#8A212B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Trackunit Terms & Conditions — Section 2: Fleet Plan and Asset Configuration
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] font-semibold">
                Official Contract Standard
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span>Governing Master Terms: <a href="https://www.trackunit.com/company/terms-and-conditions/" target="_blank" rel="noreferrer" className="text-[#8A212B] hover:underline font-medium">trackunit.com/company/terms-and-conditions/</a></span>
              <span>•</span>
              <span>Pricing Guide: <a href="https://trackunit.com/pricing/" target="_blank" rel="noreferrer" className="text-[#8A212B] hover:underline font-medium">trackunit.com/pricing/</a></span>
              <span>•</span>
              <span>SLA Terms: <a href="https://trackunit.com/service-level-agreement/" target="_blank" rel="noreferrer" className="text-[#8A212B] hover:underline font-medium">trackunit.com/service-level-agreement/</a></span>
            </div>

            <blockquote className="mt-4 p-4 rounded-xl bg-slate-50 border-l-4 border-[#8A212B] text-slate-700 text-xs sm:text-sm italic font-serif leading-relaxed">
              &ldquo;Fleet Plan and Asset Configuration are made for an initial term of thirty-six (36) months (Initial Term) and are thereafter renewed automatically for a 12-month period (Renewal Term), unless terminated by either party on terms mentioned in this Section 2. Fleet Plan and Asset Configuration can be cancelled by either party with a notice of three (3) months before the end of the respective Initial- or Renewal Term. No repayment is made for the subscriptions invoiced, even if cancelled earlier than the end of the Initial Term. If subscriptions are cancelled within an Initial- or Renewal Term, non-issued invoice(s) for Fleet Plan or Asset Configuration will be invoiced.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>

      {/* Trackunit Official SLA & Pricing Structure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trackunit SLA Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center font-bold text-xs">
                SLA
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Trackunit Service Level Agreement (SLA)</h3>
                <p className="text-[11px] text-slate-500">Official commitments from trackunit.com/service-level-agreement/</p>
              </div>
            </div>
            <a 
              href="https://trackunit.com/service-level-agreement/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-[#8A212B] hover:underline font-semibold"
            >
              Read SLA ↗
            </a>
          </div>

          <div className="mt-3 space-y-2.5 text-xs text-slate-600">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span>Standard SLA (Included)</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700">Default</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard technical support & high platform availability. Does not guarantee financial credit memos for outages.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-50/50 border border-[#FCA5A5]/60">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span className="text-[#8A212B] font-bold">Premium SLA (Paid Add-on)</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#8A212B] text-white font-bold">99.8% Uptime</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Guaranteed 99.8% monthly service availability across Trackunit Manager and APIs. If availability falls below 99.8%, customer may claim a <strong>5% Credit Memo</strong> towards their monthly license fee (written claim within 30 days).
              </p>
            </div>
          </div>
        </div>

        {/* Trackunit Pricing Structure Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center font-bold text-xs">
                EUR
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Trackunit Fleet Pricing Structure</h3>
                <p className="text-[11px] text-slate-500">Tier architecture from trackunit.com/pricing/</p>
              </div>
            </div>
            <a 
              href="https://trackunit.com/pricing/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs text-[#8A212B] hover:underline font-semibold"
            >
              View Pricing ↗
            </a>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Explore</span>
              <strong className="text-slate-900 text-sm block mt-0.5">€29.00</strong>
              <span className="text-[10px] text-slate-500">GPS & Run Hours</span>
            </div>
            <div className="p-2 rounded-xl bg-[#FDF2F3] border border-[#FCA5A5]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A212B] block">Evolve</span>
              <strong className="text-[#8A212B] text-sm block mt-0.5">€49.00</strong>
              <span className="text-[10px] text-slate-600">CAN Telematics</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Expand</span>
              <strong className="text-slate-900 text-sm block mt-0.5">€69.00</strong>
              <span className="text-[10px] text-slate-500">Enterprise ERP API</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5">
            Also supports <strong>Kin</strong> Bluetooth tags (€5.00/mo), <strong>Spot</strong> battery trackers, and <strong>M7 / Raw</strong> telematics units billed monthly/quarterly in advance.
          </p>
        </div>
      </div>

      {/* 4 Pillars of Section 2 Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center mb-3">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">1. Initial Term: 36 Months</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Every device subscription starts with a binding 36-month commitment. The customer cannot terminate mid-term without settling all remaining non-issued invoices through month 36.
          </p>
          <div className="mt-3 text-[11px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-100 font-medium">
            InitialEnd = StartDate + 36 Mo
          </div>
        </div>

        {/* Pillar 2 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center mb-3">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">2. Automatic 12-Month Renewal</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Upon expiry of the Initial Term, subscriptions automatically renew for consecutive 12-month periods unless explicitly terminated within the strict contractual notice window.
          </p>
          <div className="mt-3 text-[11px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-100 font-medium">
            RenewalEnd = PriorEnd + 12 Mo
          </div>
        </div>

        {/* Pillar 3 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">3. Three (3) Months Notice Rule</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Cancellation notice MUST be submitted at least 3 months prior to the term expiry. Missing the cutoff by even 1 day triggers an automatic 12-month extension commitment.
          </p>
          <div className="mt-3 text-[11px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-100 font-medium">
            NoticeCutoff = TermEnd − 3 Mo
          </div>
        </div>

        {/* Pillar 4 */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">4. No Repayments & Full Invoicing</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Non-issued invoices up to the effective cancellation date are accelerated and invoiced immediately. Any prepaid invoices are non-refundable (no credit memos).
          </p>
          <div className="mt-3 text-[11px] font-mono bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-100 font-medium">
            Settlement = UnbilledMonths × Fee
          </div>
        </div>
      </div>

      {/* Multi-Model Formula Engine & Conditions Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <Calculator className="w-5 h-5 text-[#8A212B]" />
              <h3 className="text-base font-bold text-slate-900">
                Formula Calculation Engine: Multiple Conditions & Policy Models
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select or configure different legal formulas to evaluate {customerName} charges under varying contract terms and commercial dispute strategies.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] self-start sm:self-auto">
            Active: {activeConfig.badge}
          </span>
        </div>

        {/* Formula Preset Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-5">
          {fleetFormulaComparisons.map(f => {
            const isSelected = selectedPreset === f.preset.id;
            return (
              <div
                key={f.preset.id}
                onClick={() => {
                  setSelectedPreset(f.preset.id);
                  if (onSelectFormulaPreset) onSelectFormulaPreset(f.preset.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-[#8A212B] bg-[#FDF2F3]/50 shadow-xs ring-2 ring-[#8A212B]/20' 
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-[#8A212B] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {f.preset.badge}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900">
                    €{f.totalFleetSettlement.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 mt-2">
                  {f.preset.name}
                </h4>

                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {f.preset.description}
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium">
                    Auto-Renewed: <strong className="text-amber-600">{f.autoRenewCount}</strong> / Timely: <strong className="text-emerald-600">{f.timelyCount}</strong>
                  </span>
                  {f.varianceFromStrict !== 0 && (
                    <span className="font-mono font-bold text-emerald-600 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      {f.varianceFromStrict < 0 ? `-€${Math.abs(f.varianceFromStrict).toLocaleString()}` : `+€${f.varianceFromStrict.toLocaleString()}`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Sandbox Controls (When custom preset is active) */}
        {selectedPreset === 'custom-sandbox' && (
          <div className="mt-5 p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-[#8A212B]" />
              <span>Custom Sandbox Levers & Formula Parameters</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Initial Term (Mo)</label>
                <input
                  type="number"
                  min="12"
                  max="60"
                  step="12"
                  value={customInitialMonths}
                  onChange={(e) => setCustomInitialMonths(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Renewal Term (Mo)</label>
                <input
                  type="number"
                  min="3"
                  max="24"
                  step="3"
                  value={customRenewalMonths}
                  onChange={(e) => setCustomRenewalMonths(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Notice Cutoff (Mo)</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  step="1"
                  value={customNoticeMonths}
                  onChange={(e) => setCustomNoticeMonths(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Rollover Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="5"
                  value={customDiscountPercent}
                  onChange={(e) => setCustomDiscountPercent(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cash Wire Discount %</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={customCashDiscount}
                  onChange={(e) => setCustomCashDiscount(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 font-semibold focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Prepaid Credit Memo</label>
                <button
                  type="button"
                  onClick={() => setCustomAllowPrepaidCredit(!customAllowPrepaidCredit)}
                  className={`w-full py-1.5 px-2 rounded-lg font-semibold text-xs border transition-colors ${
                    customAllowPrepaidCredit 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {customAllowPrepaidCredit ? 'Credit Allowed' : 'Strict (No Credit)'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Asset-Specific Formula Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileCheck2 className="w-5 h-5 text-[#8A212B]" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Single-Asset Step-by-Step Formula Derivation Inspector
              </h3>
              <p className="text-xs text-slate-500">
                Inspect raw source fields, parsed contractual variables, and intermediate math proofs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Select Asset:</span>
            <select
              value={activeFormulaSub}
              onChange={(e) => setActiveFormulaSub(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
            >
              {subscriptions.map(sub => (
                <option key={sub.assetId} value={sub.assetId}>
                  {sub.assetId} — {sub.assetName.slice(0, 24)}... ({sym}{sub.monthlyFee}/mo)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Asset Step-by-Step Proof Cards */}
        {benchmarkAsset && benchmarkAssetResult ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-5">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stage 1: Parsed Terms</span>
              <div className="space-y-1 font-mono text-xs text-slate-700">
                <p>Start Date: <strong className="text-slate-900">{benchmarkAsset.startDate}</strong></p>
                <p>Initial End: <strong className="text-slate-900">{benchmarkAssetResult.initialTermEndDate}</strong></p>
                <p>Current Cycle: <strong className="text-[#8A212B]">{benchmarkAssetResult.currentTermName}</strong></p>
                <p>Cycle Expiry: <strong className="text-slate-900">{benchmarkAssetResult.currentTermEndDate}</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stage 2: Cutoff & Timeliness</span>
              <div className="space-y-1 font-mono text-xs text-slate-700">
                <p>Notice Given: <strong className="text-slate-900">{benchmarkAssetResult.noticeGivenDate}</strong></p>
                <p>Cutoff Deadline: <strong className="text-slate-900">{benchmarkAssetResult.noticeDeadlineDate}</strong></p>
                <p>Timely Status: <strong className={benchmarkAssetResult.isNoticeTimely ? 'text-emerald-600' : 'text-amber-600'}>
                  {benchmarkAssetResult.isNoticeTimely ? 'YES (Timely)' : 'NO (Late Auto-Renew)'}
                </strong></p>
                <p>Days Delta: <strong className="text-slate-900">{benchmarkAssetResult.daysLateOrEarly > 0 ? `+${benchmarkAssetResult.daysLateOrEarly}d Late` : `${benchmarkAssetResult.daysLateOrEarly}d Ahead`}</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stage 3: Billing & Unbilled Span</span>
              <div className="space-y-1 font-mono text-xs text-slate-700">
                <p>Last Invoiced: <strong className="text-slate-900">{benchmarkAsset.billedToDate}</strong></p>
                <p>Effective End: <strong className="text-[#8A212B]">{benchmarkAssetResult.effectiveCancellationDate}</strong></p>
                <p>Unbilled Months: <strong className="text-slate-900">{benchmarkAssetResult.unbilledMonths} Months</strong></p>
                <p>Monthly Rate: <strong className="text-slate-900">€{benchmarkAsset.monthlyFee.toFixed(2)}/mo</strong></p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FDF2F3] border border-[#FCA5A5] space-y-2">
              <span className="text-[10px] font-bold text-[#8A212B] uppercase tracking-wider block">Stage 4: Final Settlement Charge</span>
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono text-[#59141B]">
                  €{benchmarkAssetResult.remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-[#8A212B] font-medium">
                  {benchmarkAssetResult.formulaApplied}
                </p>
                <p className="text-[10px] text-slate-600 mt-1 italic leading-tight">
                  {benchmarkAssetResult.formulaProof}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-200 mt-4">
            <p className="text-xs text-slate-500 font-medium">
              No fleet assets currently loaded. Upload your spreadsheet in Step 1 to inspect step-by-step single-asset derivations.
            </p>
          </div>
        )}
      </div>

      {/* Interactive T&C Simulator Sandbox (Dark Mode Container) */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold tracking-tight">
                Interactive T&C Sandbox Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Change dates freely to test how Section 2 evaluates timely notice vs. the mandatory 12-month auto-renewal penalty under the active formula model.
            </p>
          </div>
          <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-mono tracking-widest uppercase border border-white/10 self-start sm:self-auto text-amber-300">
            Active: {activeConfig.name}
          </span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Contract Start Date</label>
            <input 
              type="date"
              value={simStartDate}
              onChange={(e) => setSimStartDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Determines 36-month initial term</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notice Submitted Date</label>
            <input 
              type="date"
              value={simNoticeDate}
              onChange={(e) => setSimNoticeDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
            <span className="text-[10px] text-amber-300 mt-1 block">Case Date: 2025-07-31</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Current Billed-To Date</label>
            <input 
              type="date"
              value={simBilledToDate}
              onChange={(e) => setSimBilledToDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Last date invoiced & settled</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Monthly Subscription Fee (€)</label>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">€</span>
              <input 
                type="number"
                min="0"
                step="1"
                value={simMonthlyFee}
                onChange={(e) => setSimMonthlyFee(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white font-mono focus:ring-1 focus:ring-amber-400 focus:outline-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Unit price per month</span>
          </div>
        </div>

        {/* Live Simulation Output Box */}
        <div className="mt-5 bg-slate-950/80 rounded-xl p-5 border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  simResult.isNoticeTimely 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {simResult.isNoticeTimely ? '✓ Timely Notice' : '⚠ Late Notice — 12-Month Auto-Renewal Triggered'}
                </span>
                <span className="text-xs text-slate-400">
                  Cycle: <strong className="text-white">{simResult.currentTermName}</strong>
                </span>
              </div>
              <div className="text-xs text-slate-300 mt-1.5">
                Notice Cutoff was <strong className="text-white font-mono">{simResult.noticeDeadlineDate}</strong> ({activeConfig.noticeWindowMonths} months before {simResult.currentTermEndDate}).
                {simResult.isNoticeTimely ? (
                  <span className="text-emerald-300 ml-1.5">Notice satisfied contractual deadline.</span>
                ) : (
                  <span className="text-amber-300 ml-1.5">Notice submitted after cutoff; contract extended by {activeConfig.renewalTermMonths} months.</span>
                )}
              </div>
            </div>

            <div className="text-right bg-white/5 px-4 py-2 rounded-xl border border-white/10">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Calculated Obligation</span>
              <span className="text-2xl font-extrabold text-amber-400 tabular-nums font-mono">
                €{simResult.remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Current Term Expiry:</span>
              <span className="text-white font-semibold">{simResult.currentTermEndDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Effective Cancellation:</span>
              <span className={`font-semibold ${simResult.wasAutoRenewed ? 'text-amber-400' : 'text-emerald-400'}`}>
                {simResult.effectiveCancellationDate}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Billable Unbilled Months:</span>
              <span className="text-white font-semibold">{simResult.unbilledMonths} Months</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Math Proof:</span>
              <span className="text-slate-300">{simResult.unbilledMonths} mo × €{simMonthlyFee} = €{simResult.remainingObligation.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
