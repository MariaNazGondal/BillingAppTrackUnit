import React, { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  CartesianGrid, 
  Legend 
} from 'recharts';
import { CalculationResult, SettlementSummary, DataSanitizationReport } from '../types';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Filter, 
  Layers, 
  Cpu, 
  Award,
  ArrowUpRight,
  Calendar,
  Sparkles,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

interface VisualizationsProps {
  results: CalculationResult[];
  summary?: SettlementSummary;
  currency: string;
  sanitizationReport?: DataSanitizationReport | null;
}

export const Visualizations: React.FC<VisualizationsProps> = ({ results, summary, currency, sanitizationReport }) => {
  const [filterCompliance, setFilterCompliance] = useState<'all' | 'timely' | 'autorenewed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';

  // Filtered dataset for visualizations
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (filterCompliance === 'timely' && r.wasAutoRenewed) return false;
      if (filterCompliance === 'autorenewed' && !r.wasAutoRenewed) return false;
      if (filterCategory !== 'all' && (r.subscription.category || 'Other') !== filterCategory) return false;
      return true;
    });
  }, [results, filterCompliance, filterCategory]);

  // Categories list for filter
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const r of results) {
      if (r.subscription.category) set.add(r.subscription.category);
    }
    return Array.from(set);
  }, [results]);

  // 1. Data by Category
  const categoryData = useMemo(() => {
    const map = new Map<string, { category: string; amount: number; count: number; unbilledMonths: number }>();

    for (const r of filteredResults) {
      const cat = r.subscription.category || 'Other Equipment';
      const curr = map.get(cat) || { category: cat, amount: 0, count: 0, unbilledMonths: 0 };
      curr.amount += r.remainingObligation;
      curr.count += 1;
      curr.unbilledMonths += r.unbilledMonths;
      map.set(cat, curr);
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredResults]);

  // 2. Data by Plan Tier
  const planData = useMemo(() => {
    const map = new Map<string, { plan: string; amount: number; count: number; avgFee: number }>();

    for (const r of filteredResults) {
      const plan = r.subscription.planType;
      const curr = map.get(plan) || { plan, amount: 0, count: 0, avgFee: 0 };
      curr.amount += r.remainingObligation;
      curr.count += 1;
      curr.avgFee += r.subscription.monthlyFee;
      map.set(plan, curr);
    }

    return Array.from(map.values()).map(p => ({
      ...p,
      avgFee: Math.round((p.avgFee / p.count) * 10) / 10
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredResults]);

  // 3. Data by Device Hardware Type
  const deviceData = useMemo(() => {
    const map = new Map<string, { device: string; amount: number; count: number }>();

    for (const r of filteredResults) {
      const dev = r.subscription.deviceType;
      const curr = map.get(dev) || { device: dev, amount: 0, count: 0 };
      curr.amount += r.remainingObligation;
      curr.count += 1;
      map.set(dev, curr);
    }

    return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
  }, [filteredResults]);

  // 4. Notice Compliance Split (Timely vs Late Auto-Renewed)
  const complianceData = useMemo(() => {
    let timelyCount = 0;
    let timelyAmount = 0;
    let autoRenewCount = 0;
    let autoRenewAmount = 0;

    for (const r of filteredResults) {
      if (r.wasAutoRenewed) {
        autoRenewCount++;
        autoRenewAmount += r.remainingObligation;
      } else {
        timelyCount++;
        timelyAmount += r.remainingObligation;
      }
    }

    return [
      { 
        name: 'Timely Termination', 
        value: timelyCount, 
        amount: Math.round(timelyAmount * 100) / 100,
        color: '#10b981' // emerald-500
      },
      { 
        name: 'Auto-Renewed (Late Notice)', 
        value: autoRenewCount, 
        amount: Math.round(autoRenewAmount * 100) / 100,
        color: '#f59e0b' // amber-500
      }
    ];
  }, [filteredResults]);

  // 5. Invoicing Timeline Distribution (Monthly Cash Inflow across 2025-2026)
  const timelineData = useMemo(() => {
    const months = [
      '2025-08', '2025-09', '2025-10', '2025-11', '2025-12',
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05',
      '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'
    ];

    let cumulative = 0;

    return months.map(m => {
      let activeFeeInMonth = 0;
      let unitsActive = 0;

      for (const r of filteredResults) {
        const billTo = r.subscription.billedToDate.slice(0, 7);
        const cancel = r.effectiveCancellationDate.slice(0, 7);

        if (m > billTo && m <= cancel) {
          activeFeeInMonth += r.subscription.monthlyFee;
          unitsActive += 1;
        }
      }

      cumulative += activeFeeInMonth;

      return {
        month: m,
        monthlyCharge: Math.round(activeFeeInMonth * 100) / 100,
        cumulativeCharge: Math.round(cumulative * 100) / 100,
        unitsActive
      };
    });
  }, [filteredResults]);

  // 6. Top 10 High-Value Liability Assets
  const topAssetsData = useMemo(() => {
    return [...filteredResults]
      .sort((a, b) => b.remainingObligation - a.remainingObligation)
      .slice(0, 10)
      .map(r => ({
        assetId: r.subscription.assetId,
        assetName: r.subscription.assetName.slice(0, 18),
        amount: r.remainingObligation,
        months: r.unbilledMonths,
        plan: r.subscription.planType,
        wasAutoRenewed: r.wasAutoRenewed
      }));
  }, [filteredResults]);

  const COLORS = ['#8A212B', '#6B1922', '#10b981', '#f59e0b', '#06b6d4', '#475569'];

  const filteredTotalSettlement = useMemo(() => {
    return filteredResults.reduce((acc, r) => acc + r.remainingObligation, 0);
  }, [filteredResults]);

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FDF2F3] text-[#8A212B] flex items-center justify-center shadow-xs">
          <BarChart3 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Step 4: Billing Analytics &amp; Visualizations Dashboard
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          No telematics data loaded yet. Please upload your spreadsheet file in Step 1 (Data Cleaning) to generate real-time fleet charts, plan breakdown visualizers, cash run-off trajectories, and T&amp;C liability distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner with Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#8A212B] text-white flex items-center justify-center shrink-0 shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Billing Analytics & Data Visualization Module
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                  Google Sheet Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Visualizing total charges, service tiers, equipment categories, payment run-off curves, and top billing exposures.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Total Filtered Charges:</span>
            <span className="text-xl font-bold font-mono text-[#8A212B]">
              {sym}{Math.round(filteredTotalSettlement).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter Compliance:
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
              {(['all', 'timely', 'autorenewed'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setFilterCompliance(mode)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    filterCompliance === mode 
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {mode === 'all' ? 'All Units' : mode === 'timely' ? 'Timely Termination' : 'Late Auto-Renewed'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-[#8A212B] focus:outline-none"
            >
              <option value="all">All Fleet Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Primary Section: How Much is Charged and WHY It Is Charged */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                How Much Is Charged & WHY It Is Being Charged
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5]">
                Contractual Breakdown
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Clear, transparent categorization of every fee component in strict accordance with Trackunit&apos;s published Terms &amp; Conditions
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium block">Total Calculated Balance Due:</span>
            <span className="text-2xl font-black font-mono text-[#8A212B]">
              {sym}{Math.round(filteredTotalSettlement).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 4 Transparent Charge Rationale Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Reason 1: Timely Base Term */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                1. Base Initial Term
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                {complianceData[0].value} Units
              </span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-slate-900 block">
                {sym}{complianceData[0].amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {filteredTotalSettlement > 0 ? Math.round((complianceData[0].amount / filteredTotalSettlement) * 100) : 0}% of Total Due
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
              <strong>WHY CHARGED:</strong> To fulfill the remaining unbilled months of the initial 36-month subscription term. Customer provided timely &ge; 3 months notice.
            </p>
          </div>

          {/* Reason 2: Auto-Renewal Extension */}
          <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                2. 12-Month Extension
              </span>
              <span className="text-xs font-mono font-bold text-amber-800">
                {complianceData[1].value} Units
              </span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-amber-900 block">
                {sym}{complianceData[1].amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-amber-600 font-mono">
                {filteredTotalSettlement > 0 ? Math.round((complianceData[1].amount / filteredTotalSettlement) * 100) : 0}% of Total Due
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-amber-200">
              <strong>WHY CHARGED:</strong> Notice arrived less than 3 months before expiry. Under Trackunit T&amp;C &sect;2, subscription automatically renewed for 12 months with full telemetry access.
            </p>
          </div>

          {/* Reason 3: Unbilled Historical Arrears */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                3. Service Arrears
              </span>
              <span className="text-xs font-mono font-bold text-slate-700">
                Active Months
              </span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-slate-900 block">
                Included in Ledger
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Historical Gap
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
              <strong>WHY CHARGED:</strong> Covers active telematics cellular data and cloud services delivered between the last invoice date and the termination date.
            </p>
          </div>

          {/* Reason 4: Retained Advance Payments */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                4. Advance Billings
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                €0.00 Extra Fee
              </span>
            </div>
            <div>
              <span className="text-xl font-bold font-mono text-slate-900 block">
                {sym}0.00 Due
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Non-Refundable
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200">
              <strong>WHY RETAINED:</strong> Units already invoiced in advance are non-refundable under Trackunit T&amp;C &sect;2. No additional payment is due for these units.
            </p>
          </div>
        </div>
      </div>

      {/* Date Inversion & Precision Recalculation Impact Card */}
      {sanitizationReport?.dateAnalysis && (sanitizationReport.dateAnalysis.detectedJanuaryAnomaly || sanitizationReport.dateAnalysis.inversedDatesCount > 0) && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-300 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-amber-950 tracking-tight">
                    Date Inversion Recalculation & Accuracy Impact (January Anomaly)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-200 text-amber-900 font-bold border border-amber-300">
                    {sanitizationReport.dateAnalysis.januaryClusterPercentage}% January Cluster Resolved
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1">
                  Source Excel dates had month and day reversed, falsely registering contracts in January. Recalculating with verified 1st-of-month dates protected units from unmerited 12-month auto-renewal penalties and re-benchmarked true liability.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-amber-800">Recalculation Variance:</span>
              <span className="text-xl font-bold font-mono text-emerald-800 bg-white/80 px-3 py-1 rounded-xl border border-amber-200">
                {sym}{sanitizationReport.dateAnalysis.netFinancialImpact >= 0 ? '+' : ''}{sanitizationReport.dateAnalysis.netFinancialImpact.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/80 p-4 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pre-Cleaning Naive Bill</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-slate-500 line-through">
                  {sym}{sanitizationReport.dateAnalysis.beforeRecalculationTotal.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Calculated using raw un-inverted dates</span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Post-Cleaning Verified Bill</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-emerald-800">
                  {sym}{sanitizationReport.dateAnalysis.afterRecalculationTotal.toFixed(2)}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs text-emerald-600 font-medium mt-1 block">
                {sanitizationReport.dateAnalysis.inversedDatesCount} contract chronologies corrected
              </span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-[#8A212B] uppercase tracking-wider block">Late Penalties Averted</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-mono text-[#8A212B]">
                  {sanitizationReport.dateAnalysis.contractsSavedFromLatePenalty} Units
                </span>
              </div>
              <span className="text-xs text-[#8A212B] font-medium mt-1 block">
                Shifted from Late Auto-Renewed to Timely Terminated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Category Breakdown & Notice Compliance Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Obligations by Equipment Category */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Settlement pr. Equipment Category</h3>
              <p className="text-[11px] text-slate-400">Total billable obligation grouped by fleet equipment classification</p>
            </div>
            <span className="text-xs font-mono font-bold text-[#8A212B] bg-[#FDF2F3] px-2.5 py-1 rounded-full border border-[#FCA5A5]">
              {sym}{Math.round(filteredTotalSettlement).toLocaleString()}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `${sym}${val}`}
                />
                <Tooltip 
                  formatter={(val: any) => [`${sym}${Number(val).toLocaleString()}`, 'Settlement Obligation']}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
                />
                <Bar dataKey="amount" fill="#8A212B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Notice Compliance Donut */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Notice Compliance Breakdown</h3>
            <p className="text-[11px] text-slate-400">Timely cancellation vs. 12-month automatic renewal</p>
          </div>

          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `${val} assets (${sym}${item.payload.amount.toLocaleString()})`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tabular-nums">{filteredResults.length}</span>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtered Units</span>
            </div>
          </div>

          <div className="mt-3 space-y-2 text-xs pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600">Timely Notice:</span>
              </div>
              <span className="font-bold text-slate-800">{complianceData[0].value} units ({sym}{complianceData[0].amount.toLocaleString()})</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-600">Auto-Renewed (Late):</span>
              </div>
              <span className="font-bold text-amber-700">{complianceData[1].value} units ({sym}{complianceData[1].amount.toLocaleString()})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Projected Monthly Payment Trends & Cumulative Run-off */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 tracking-tight">
              <TrendingUp className="w-4 h-4 text-[#8A212B]" />
              <span>Projected Payment Trends & Cash Realization Timeline (2025 – 2026)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Monthly unbilled subscription obligations maturing over time vs accelerated lump-sum settlement.
            </p>
          </div>
          <span className="text-xs bg-[#FDF2F3] text-[#8A212B] font-semibold px-3 py-1 rounded-full border border-[#FCA5A5] self-start sm:self-auto font-mono">
            August 2025 → October 2026
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMonthly" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8A212B" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8A212B" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${sym}${val}`}
              />
              <Tooltip 
                formatter={(val: any, name: any, item: any) => [
                  `${sym}${Number(val).toLocaleString()} (${item.payload.unitsActive} active units)`,
                  'Monthly Scheduled Charge'
                ]}
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
              />
              <Area 
                type="monotone" 
                dataKey="monthlyCharge" 
                stroke="#8A212B" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#colorMonthly)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Breakdown by Service / Plan & Hardware Device Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Breakdown by Plan */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Settlement by Subscription Service Tier</h3>
              <p className="text-[11px] text-slate-400">Core, Advanced, Basic, Light, and Specialty</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(val) => `${sym}${val}`} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="plan" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `${sym}${Number(val).toLocaleString()} (${item.payload.count} units @ avg ${sym}${item.payload.avgFee}/mo)`,
                    'Total Obligation'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
                />
                <Bar dataKey="amount" fill="#8A212B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown by Hardware Device */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Settlement by Telematics Hardware</h3>
              <p className="text-[11px] text-slate-400">Raw telematics vs Spot battery vs Beam beacons</p>
            </div>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(val) => `${sym}${val}`} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis dataKey="device" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip 
                  formatter={(val: any, name: any, item: any) => [
                    `${sym}${Number(val).toLocaleString()} across ${item.payload.count} units`,
                    'Total Device Obligation'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}
                />
                <Bar dataKey="amount" fill="#06b6d4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Top 10 High-Value Liability Assets Table / Bars */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Top 10 High-Exposure Billing Assets</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Key individual machines representing the largest share of Beta Industries' outstanding settlement balance
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Sorted by Financial Liability
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {topAssetsData.map((asset, idx) => (
            <div key={asset.assetId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-900">{asset.assetId}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  asset.wasAutoRenewed ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  #{idx + 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate font-medium">{asset.assetName}</p>
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">{asset.months} mo unbilled</span>
                <span className="font-mono text-xs font-bold text-[#8A212B]">
                  {sym}{asset.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
