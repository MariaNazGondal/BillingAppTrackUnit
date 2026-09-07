import React, { useState } from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Zap, 
  Layers, 
  HardDrive, 
  CheckCircle2, 
  Search, 
  Scale, 
  Info,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  DollarSign
} from 'lucide-react';
import { 
  TRACKUNIT_MASTER_TERMS, 
  TRACKUNIT_PRICING_CATALOG, 
  TRACKUNIT_SLA_SPECIFICATION,
  TrackunitProductTier,
  TrackunitLegalClause 
} from '../data/trackunitTermsAndPricing';

interface TrackunitPricingCatalogCardProps {
  currency?: string;
  onApplyCatalogRate?: (tier: TrackunitProductTier) => void;
}

export const TrackunitPricingCatalogCard: React.FC<TrackunitPricingCatalogCardProps> = ({
  currency = 'EUR',
  onApplyCatalogRate
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'clauses' | 'sla'>('pricing');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Software Tier' | 'Hardware Gateway' | 'Autonomous Tag' | 'Operator Access'>('All');
  const [clauseSearch, setClauseSearch] = useState('');
  const [expandedClauseId, setExpandedClauseId] = useState<string | null>('tc-sec-2'); // Default open Section 2

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  const filteredProducts = TRACKUNIT_PRICING_CATALOG.filter(p => {
    if (categoryFilter === 'All') return true;
    return p.category === categoryFilter;
  });

  const filteredClauses = TRACKUNIT_MASTER_TERMS.filter(c => {
    if (!clauseSearch) return true;
    const q = clauseSearch.toLowerCase();
    return c.title.toLowerCase().includes(q) || 
           c.sectionNumber.toLowerCase().includes(q) || 
           c.summary.toLowerCase().includes(q) ||
           c.verbatimText.toLowerCase().includes(q);
  });

  const getTierPrice = (tier: TrackunitProductTier) => {
    if (currency === 'USD') return tier.standardMonthlyFeeUSD;
    if (currency === 'DKK') return tier.standardMonthlyFeeDKK;
    return tier.standardMonthlyFeeEUR;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="trackunit-static-catalog">
      {/* 1. Header Banner: Highlighting Local Embedded Status */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold tracking-wide flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Embedded In-Memory Engine</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[11px] font-medium border border-white/10 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Trackunit A/S (Aalborg, Denmark) Catalog</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#8A212B]/40 text-rose-200 text-[11px] font-medium border border-rose-500/30">
                Zero Web Latency • Fully Offline
              </span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>Trackunit Official Terms & Pricing Catalog</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              All terms, clauses, SLAs, hardware device prices, and software subscription tiers from Trackunit Denmark have been <strong>permanently copied and stored directly in application memory</strong>. The system does not perform slow runtime web scraping or external HTTP calls to trackunit.com, ensuring instantaneous, 100% reliable, and tamper-proof settlement calculations.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs border border-white/10 rounded-xl p-4 self-start lg:self-auto text-left sm:text-right min-w-[220px]">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Execution Performance</span>
            <div className="text-xl font-bold text-emerald-400 font-mono flex items-center lg:justify-end gap-1.5 mt-0.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>&lt; 1 ms (Instant)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Zero network roundtrips. Statically loaded.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-700/60 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'pricing'
                ? 'bg-[#8A212B] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Hardware & Software Pricing Matrix ({TRACKUNIT_PRICING_CATALOG.length} Items)</span>
          </button>

          <button
            onClick={() => setActiveTab('clauses')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'clauses'
                ? 'bg-[#8A212B] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Master Agreement Clauses (§1 to §8)</span>
          </button>

          <button
            onClick={() => setActiveTab('sla')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'sla'
                ? 'bg-[#8A212B] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Official SLA (99.8% Guarantee)</span>
          </button>
        </div>
      </div>

      {/* 2. TAB CONTENT: PRICING MATRIX */}
      {activeTab === 'pricing' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Trackunit Denmark Official Price Catalog (Embedded)
              </h3>
              <p className="text-xs text-slate-500">
                Standard recurring monthly subscription fees and hardware prices stored in application code.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['All', 'Software Tier', 'Hardware Gateway', 'Autonomous Tag', 'Operator Access'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    categoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map(tier => {
              const unitPrice = getTierPrice(tier);
              const isSoftware = tier.category === 'Software Tier';

              return (
                <div 
                  key={tier.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-shadow hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isSoftware ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {tier.category}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-semibold">
                        {tier.minimumCommitmentMonths} Mo. Term
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{tier.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tier.description}
                    </p>

                    {/* Pricing Display */}
                    <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-500 font-medium">Standard Monthly Fee:</span>
                        <span className="text-lg font-bold font-mono text-slate-900">
                          {sym}{unitPrice.toFixed(2)}
                          <span className="text-xs text-slate-400 font-normal"> / mo</span>
                        </span>
                      </div>

                      {tier.hardwareUpfrontEUR && (
                        <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Hardware Purchase:</span>
                          <span className="font-mono font-semibold text-slate-700">
                            {sym}{tier.hardwareUpfrontEUR.toFixed(2)} once
                          </span>
                        </div>
                      )}

                      {tier.bundledMonthlyFeeEUR && (
                        <div className="flex items-baseline justify-between text-xs pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Bundled (H/W + S/W):</span>
                          <span className="font-mono font-bold text-[#8A212B]">
                            {sym}{tier.bundledMonthlyFeeEUR.toFixed(2)} / mo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Features Checklist */}
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Included Features
                      </span>
                      {tier.features.slice(0, 3).map((f, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typical Assets */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block mb-1">Common Machine Classes:</span>
                    <div className="flex flex-wrap gap-1">
                      {tier.typicalAssetTypes.map((asset, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                          {asset}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT: MASTER AGREEMENT CLAUSES */}
      {activeTab === 'clauses' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Trackunit Master Subscription Agreement — Full Verbatim Clauses
              </h3>
              <p className="text-xs text-slate-500">
                Governing contractual terms and legal conditions stored locally.
              </p>
            </div>

            {/* Clause Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={clauseSearch}
                onChange={(e) => setClauseSearch(e.target.value)}
                placeholder="Search clauses (e.g. renewal, notice, Danish)..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#8A212B]"
              />
            </div>
          </div>

          {/* Clauses Accordion */}
          <div className="space-y-3">
            {filteredClauses.map((clause) => {
              const isExpanded = expandedClauseId === clause.id;
              const isSection2 = clause.id === 'tc-sec-2';

              return (
                <div 
                  key={clause.id}
                  className={`rounded-xl border transition-all ${
                    isSection2 
                      ? 'border-[#8A212B]/40 bg-[#FDF2F3]/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setExpandedClauseId(isExpanded ? null : clause.id)}
                    className="w-full p-4 flex items-start sm:items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold shrink-0 ${
                        isSection2 ? 'bg-[#8A212B] text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {clause.sectionNumber}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          <span>{clause.title}</span>
                          {isSection2 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                              Core Settlement Engine Basis
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{clause.summary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider hidden sm:inline-block ${
                        clause.contractualEnforcement === 'Strict' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {clause.contractualEnforcement}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-100 space-y-4">
                      {/* Verbatim Box */}
                      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed whitespace-pre-line border border-slate-800">
                        {clause.verbatimText}
                      </div>

                      {/* Key Takeaways & Impact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                            Key Contractual Rules
                          </span>
                          <ul className="space-y-1.5">
                            {clause.keyTakeaways.map((takeaway, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-700">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#8A212B] shrink-0 mt-0.5" />
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block mb-1">
                            Direct Impact on Customer Settlement
                          </span>
                          <p className="leading-relaxed font-medium">
                            {clause.impactOnBilling}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB CONTENT: OFFICIAL SLA SPECIFICATION */}
      {activeTab === 'sla' && (
        <div className="p-6 space-y-6">
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Official Specification
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Trackunit Cloud Platform Availability Guarantee (99.8%)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Embedded directly from Trackunit's published Service Level Agreement for Trackunit Manager, Iris API, and IoT telemetry pipelines.
              </p>
            </div>

            <div className="text-right bg-white p-3 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">SLA Availability Target</span>
              <span className="text-2xl font-bold font-mono text-emerald-600">
                {TRACKUNIT_SLA_SPECIFICATION.targetUptimePercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Service Uptime</span>
              <p className="text-base font-bold text-slate-900">
                {TRACKUNIT_SLA_SPECIFICATION.targetUptimePercent}% Monthly Availability
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies to machine data ingestion, GPS positioning feeds, user logins, and core API query availability over each 30-day billing window.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contractual Remedy</span>
              <p className="text-base font-bold text-[#8A212B]">
                {TRACKUNIT_SLA_SPECIFICATION.remedyCreditMemoPercent}% Credit Memo Offset
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                If verified monthly downtime exceeds the 0.2% allowance, customers receive a 5% credit applied against that month's subscription fee.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Claim Notice Window</span>
              <p className="text-base font-bold text-slate-900">
                Within {TRACKUNIT_SLA_SPECIFICATION.claimWindowDays} Days
              </p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Written incident notification must be submitted to Trackunit Support within 30 days of the affected calendar month to validate credit adjustments.
              </p>
            </div>
          </div>

          {/* Excluded Outage Events */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-900 block mb-2">
              Excluded Events (Do Not Count Against 99.8% Uptime Target):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRACKUNIT_SLA_SPECIFICATION.excludedEvents.map((event, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
