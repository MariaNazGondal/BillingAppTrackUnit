import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Receipt, 
  Building2, 
  Calendar, 
  Download, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Layers,
  Check,
  Info
} from 'lucide-react';
import { CalculationResult, SettlementSummary } from '../types';
import { TrackunitLogo } from './TrackunitLogo';

interface PlanSummary {
  count: number;
  totalAmount: number;
  totalMonths: number;
  rates: number[];
}

interface SimplifiedInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculationResult[];
  summary: SettlementSummary;
  currency: string;
  noticeDate: string;
  customerName: string;
}

export const SimplifiedInvoiceModal: React.FC<SimplifiedInvoiceModalProps> = ({
  isOpen,
  onClose,
  results,
  summary,
  currency,
  noticeDate,
  customerName
}) => {
  const [showItemizedSchedule, setShowItemizedSchedule] = useState<boolean>(true);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);

  if (!isOpen) return null;

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';
  const invoiceNumber = `INV-SETTLE-${customerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'FLEET'}-${new Date().getFullYear()}`;
  
  // Format dates
  const todayStr = new Date().toISOString().split('T')[0];
  const dueDateStr = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Groupings
  const timelyUnits = results.filter(r => r.isNoticeTimely && r.remainingObligation > 0);
  const timelyTotal = timelyUnits.reduce((acc, r) => acc + r.remainingObligation, 0);

  const autoRenewUnits = results.filter(r => r.wasAutoRenewed);
  const autoRenewTotal = autoRenewUnits.reduce((acc, r) => acc + r.remainingObligation, 0);

  const prepaidUnits = results.filter(r => r.overbilledAmount > 0);
  const prepaidTotal = prepaidUnits.reduce((acc, r) => acc + r.overbilledAmount, 0);

  // Group by plan type
  const planBreakdown: Record<string, PlanSummary> = {};
  results.forEach(r => {
    const plan = r.subscription.planType || 'Standard';
    if (!planBreakdown[plan]) {
      planBreakdown[plan] = { count: 0, totalAmount: 0, totalMonths: 0, rates: [] };
    }
    planBreakdown[plan].count += 1;
    planBreakdown[plan].totalAmount += r.remainingObligation;
    planBreakdown[plan].totalMonths += r.unbilledMonths;
    planBreakdown[plan].rates.push(r.subscription.monthlyFee);
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyPaymentRef = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      {/* Container Dialog */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[96vh]">
        
        {/* Modal Top Control Bar (Hidden when printed) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8A212B] flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight text-white">
                  Simplified Payment Invoice & Final Settlement Receipt
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready for Print / PDF
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official billing statement for {customerName} • Governed by Trackunit Terms & Conditions §2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 mr-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showItemizedSchedule} 
                onChange={(e) => setShowItemizedSchedule(e.target.checked)}
                className="rounded border-slate-700 text-[#8A212B] focus:ring-[#8A212B]" 
              />
              <span className="hidden sm:inline">Include Itemized Fleet Schedule</span>
            </label>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              title="Print to PDF or physical printer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 print:p-0 print:overflow-visible print:text-black">
          <div className="max-w-3xl mx-auto space-y-6 text-slate-800" id="simplified-payment-invoice-document">
            
            {/* Header: Trackunit Letterhead & Formal Invoice Metadata */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-slate-200">
              <div className="space-y-3">
                <TrackunitLogo variant="red" size="md" />
                <div className="text-xs text-slate-500 space-y-0.5 font-sans">
                  <p className="font-bold text-slate-800">Trackunit ApS</p>
                  <p>Gasværksvej 24, 4. sal</p>
                  <p>DK-9000 Aalborg, Denmark</p>
                  <p>CVR / VAT: <strong className="font-mono text-slate-700">DK 26 97 36 78</strong></p>
                  <p>Email: <span className="text-[#8A212B]">billing@trackunit.com</span> | Web: trackunit.com</p>
                </div>
              </div>

              <div className="sm:text-right space-y-2">
                <div className="inline-block bg-[#FDF2F3] text-[#8A212B] border border-[#FCA5A5] px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
                  Final Settlement Invoice
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  PAYMENT RECEIPT
                </h1>
                <div className="text-xs text-slate-600 space-y-1 font-mono">
                  <p><span className="text-slate-400 font-sans">Invoice Ref:</span> <strong className="text-slate-900">{invoiceNumber}</strong></p>
                  <p><span className="text-slate-400 font-sans">Issue Date:</span> <strong className="text-slate-900">{todayStr}</strong></p>
                  <p><span className="text-slate-400 font-sans">Notice Date:</span> <strong className="text-slate-900">{noticeDate || '—'}</strong></p>
                  <p><span className="text-slate-400 font-sans">Payment Due:</span> <strong className="text-[#8A212B] font-bold">{dueDateStr} (Net 14)</strong></p>
                </div>
              </div>
            </div>

            {/* Bill-To & Contract Mandate Callout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Billed To & Customer Account:
                </span>
                <h4 className="text-base font-bold text-slate-900">{customerName}</h4>
                <p className="text-slate-600 mt-1">Fleet Operations & Accounts Payable</p>
                <p className="text-slate-600">Contract Reference: <span className="font-mono font-semibold text-slate-800">TU-AGR-{customerName.slice(0, 4).toUpperCase()}-FLEET</span></p>
                <p className="text-slate-600">Enrolled Fleet Units: <strong className="text-slate-900">{summary.totalAssets} Trackunit Telematics Devices</strong></p>
              </div>

              <div className="sm:border-l sm:border-slate-200 sm:pl-6 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A212B] block mb-1">
                  Governing Contractual Authority:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  <strong>Trackunit Terms & Conditions Section 2 ("Fleet Plan and Asset Configuration")</strong>: Subscriptions cancelled prior to term expiration or late notice cutoff accelerate all non-issued invoices through the effective cancellation date.
                </p>
                <p className="text-slate-500 italic text-[11px]">
                  *Prepaid advance periods are non-refundable in accordance with Section 2.
                </p>
              </div>
            </div>

            {/* Executive Settlement Summary Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <span>Settlement Fee Structure & Line-Item Breakdown</span>
                </h4>
                <span className="text-xs text-slate-500 font-mono">Currency: {currency}</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Line Item / Contractual Description</th>
                      <th className="py-3 px-3 text-center">Unit Count</th>
                      <th className="py-3 px-3 text-center">Billing Basis</th>
                      <th className="py-3 px-4 text-right">Subtotal Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {/* Item 1 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          Fleet Plan Base Subscriptions (Timely Notice)
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Units cancelled with ≥ 3 months notice; non-issued invoices accelerated through initial term expiration date.
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                        {timelyUnits.length}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        Contract Term End
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {sym}{timelyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Item 2 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>12-Month Involuntary Auto-Renewal Acceleration</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            T&C §2 Cutoff Rule
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Units where cancellation notice of {noticeDate} failed the mandatory 3-month window; binding 12-month extension applied.
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-amber-700">
                        {autoRenewUnits.length}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        +12 Months Renewal
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {sym}{autoRenewTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>

                    {/* Item 3 */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          Prepaid / Advance Invoiced Units Offset
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Quarterly / advance billed units. Governed by Section 2: <em>"No repayment is made for the subscriptions invoiced"</em>.
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-700">
                        {prepaidUnits.length}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        Zero Credit Applied
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-500">
                        {sym}0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Plan Tier Distribution Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Fleet Plan Tier Summary Schedule
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.entries(planBreakdown) as [string, PlanSummary][]).map(([plan, data]) => {
                  const avgRate = data.rates.length > 0 ? (data.rates.reduce((a, b) => a + b, 0) / data.rates.length) : 0;
                  return (
                    <div key={plan} className="bg-white p-3 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800">{plan} Tier</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {data.count} units ({data.totalMonths} billable mos)
                      </div>
                      <div className="text-[#8A212B] font-mono font-bold mt-1 text-sm">
                        {sym}{data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Plain English Customer Guide: How Terms & Conditions are Applied */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
                <ShieldCheck className="w-4 h-4 text-[#8A212B]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  How Terms & Conditions Are Applied (Plain English Guide for Customers)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center font-bold">1</span>
                    <span>Standard 36-Month Initial Term</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Trackunit telematics subscriptions are entered for an initial commitment of 36 months from the hardware activation date. Early termination accelerates remaining unbilled calendar months.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center font-bold">2</span>
                    <span>3-Month Advance Notice Requirement</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Written termination notice must reach Trackunit at least 3 calendar months prior to term expiration to allow cellular carrier de-provisioning without emergency disconnect fees.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-800 text-[10px] flex items-center justify-center font-bold">3</span>
                    <span>Automatic 12-Month Renewal on Late Notice</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    If notice is received inside the 3-month cutoff window, the contract automatically extends for 12 months under Trackunit T&amp;C §2. Telematics data tracking remains fully active for your machines throughout this renewal.
                  </p>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[10px] flex items-center justify-center font-bold">4</span>
                    <span>Prepaid Advance Invoices Non-Refundable</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Periods already invoiced before cancellation are strictly non-refundable under Section 2. Units billed in advance incur zero extra settlement charges, and retain full software access.
                  </p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-[#8A212B] shrink-0 mt-0.5" />
                <span>
                  <strong>Hardware Notice:</strong> Physical Trackunit IoT devices remain installed on your equipment. Cellular data transmission and Trackunit Manager access cease automatically on the effective cancellation date shown below.
                </span>
              </div>
            </div>

            {/* Final Amount Due Banner */}
            <div className="bg-gradient-to-br from-[#8A212B] to-[#59141B] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-widest text-white/80 font-bold block">
                  Total Final Settlement Balance Due
                </span>
                <p className="text-white/80 text-xs mt-1">
                  Full and final release upon wire settlement receipt • Net 14 Days
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  Reverse charge mechanism applies for B2B telematics under EU VAT Directive 2006/112/EC art. 196 (0% VAT).
                </p>
              </div>

              <div className="text-right">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                  {sym}{summary.totalSettlementAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="block text-xs text-white/80 font-mono mt-0.5">
                  Total Payable Balance ({currency})
                </span>
              </div>
            </div>

            {/* Optional Itemized Fleet Schedule */}
            {showItemizedSchedule && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A212B]" />
                    <span>Itemized Fleet Asset Settlement Schedule ({results.length} Units)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    All dates formatted ISO YYYY-MM-DD
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Asset ID</th>
                        <th className="py-2 px-3">Machine / Unit</th>
                        <th className="py-2 px-2">Plan</th>
                        <th className="py-2 px-2">Last Billed</th>
                        <th className="py-2 px-2">Contract End</th>
                        <th className="py-2 px-2 text-center">Unbilled</th>
                        <th className="py-2 px-3 text-right">Settlement Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {results.map((r) => (
                        <tr key={r.subscription.assetId} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-800">{r.subscription.assetId}</td>
                          <td className="py-2 px-3 font-sans text-slate-700 truncate max-w-[150px]">{r.subscription.assetName}</td>
                          <td className="py-2 px-2 font-sans text-slate-600">{r.subscription.planType}</td>
                          <td className="py-2 px-2 text-slate-600">{r.subscription.billedToDate}</td>
                          <td className={`py-2 px-2 ${r.wasAutoRenewed ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                            {r.effectiveCancellationDate}
                          </td>
                          <td className="py-2 px-2 text-center text-slate-700">{r.unbilledMonths} mo</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {sym}{r.remainingObligation.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Remittance & Bank Transfer Slip */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#8A212B]" />
                  <span>Bank Wire Remittance Information</span>
                </span>
                <button
                  onClick={handleCopyPaymentRef}
                  className="flex items-center gap-1 text-[11px] font-bold text-[#8A212B] hover:text-[#6B1922] bg-white border border-slate-200 rounded-lg px-2 py-0.5"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                  <span>{copiedRef ? 'Copied Ref!' : 'Copy Payment Ref'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-mono text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Beneficiary:</span>
                  <strong className="text-slate-900">Trackunit ApS</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Bank Name:</span>
                  <strong>Danske Bank A/S</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">IBAN:</span>
                  <strong className="text-slate-900 font-semibold">DK55 3000 0001 2938 4910</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">BIC / SWIFT:</span>
                  <strong>DABADKKK</strong>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-slate-500 font-sans">
                <strong>Remittance Instructions:</strong> Please quote invoice reference <strong className="font-mono text-slate-800">{invoiceNumber}</strong> with wire transfer. Direct all remittance confirmations to <span className="text-[#8A212B]">billing@trackunit.com</span>.
              </div>
            </div>

            {/* Signature & Mutual Release Section */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-xs">
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Issued on behalf of Trackunit ApS:
                  </span>
                  <div className="font-bold text-slate-800 mt-1">Trackunit Finance & Credit Control</div>
                  <div className="text-slate-500 text-[11px]">Commercial Operations Group</div>
                </div>
                <div className="border-b border-slate-300 w-48 pb-1 text-[11px] font-mono text-slate-400">
                  Authorized Electronic Signature
                </div>
              </div>

              <div className="space-y-6 text-right">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Customer Acceptance & Settlement Acknowledged:
                  </span>
                  <div className="font-bold text-slate-800 mt-1">{customerName}</div>
                  <div className="text-slate-500 text-[11px]">Authorized Accounts Payable Signatory</div>
                </div>
                <div className="border-b border-slate-300 w-48 ml-auto pb-1 text-[11px] font-mono text-slate-400">
                  Date & Representative Signature
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographically Verified Calculation Engine • Trackunit Master Terms §2</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
