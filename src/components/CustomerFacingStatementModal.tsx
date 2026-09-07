import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  ShieldCheck, 
  Calendar, 
  FileCheck2, 
  CreditCard 
} from 'lucide-react';
import { CalculationResult, SettlementSummary } from '../types';
import { TrackunitLogo } from './TrackunitLogo';

interface CustomerFacingStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: CalculationResult[];
  summary: SettlementSummary;
  noticeDate: string;
  currency: string;
  customerName?: string;
}

export const CustomerFacingStatementModal: React.FC<CustomerFacingStatementModalProps> = ({
  isOpen,
  onClose,
  results,
  summary,
  noticeDate,
  currency,
  customerName = 'Beta Industries Inc.'
}) => {
  if (!isOpen) return null;

  const sym = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : 'kr ';
  const caseCode = `TU-SETTLE-${customerName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() || 'FLEET'}-2025`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-8 print:border-0 print:shadow-none print:my-0">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileCheck2 className="w-4 h-4 text-[#8A212B]" />
            <span className="tracking-tight font-bold">Official Final Settlement Statement — {customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#8A212B] hover:bg-[#6B1922] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 space-y-8 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-slate-900 pb-6">
            <div>
              <div className="flex items-center gap-3">
                <TrackunitLogo variant="red" size="lg" subtitle="Official Settlement Notice" />
              </div>
              <div className="text-xs text-slate-500 mt-4 space-y-0.5 font-mono">
                <p>Trackunit ApS — Gasvaerksvej 24, 9000 Aalborg, Denmark</p>
                <p>Tax / VAT Reg: DK 26 54 81 12 • billing@trackunit.com</p>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="px-3 py-1 bg-[#8A212B] text-white text-[10px] font-mono uppercase tracking-widest rounded-full font-bold">
                Final Settlement Statement
              </span>
              <p className="text-xs font-mono text-slate-600 pt-2">
                Statement Ref: <strong className="text-slate-900">{caseCode}</strong>
              </p>
              <p className="text-xs font-mono text-slate-600">
                Notice Receipt Date: <strong className="text-slate-900">{noticeDate || '—'}</strong>
              </p>
              <p className="text-xs font-mono text-slate-600">
                Issue Date: <strong className="text-slate-900">{noticeDate ? new Date(noticeDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Case Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Customer Details</span>
              <p className="font-bold text-sm text-slate-900 tracking-tight">{customerName || 'Awaiting Customer Ingestion'}</p>
              <p className="text-slate-600 mt-0.5">Attn: Finance, Procurement & Fleet Operations</p>
              <p className="text-slate-600">Customer Account: <span className="font-mono">CUST-{(customerName || 'FLEET').replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()}-01</span></p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block mb-1">Governing Terms</span>
              <p className="font-semibold text-slate-900">Trackunit Master Subscription Agreement</p>
              <p className="text-slate-600">Section 2: Fleet Plan and Asset Configuration</p>
              <p className="text-slate-600">Payment Terms: <span className="font-semibold text-slate-900">Net 30 Days</span></p>
            </div>
          </div>

          {/* Legal Notice Description */}
          <div className="text-xs text-slate-700 leading-relaxed border-l-4 border-[#8A212B] pl-4 space-y-1">
            <p className="font-bold text-slate-900">Contractual Settlement Notice Pursuant to Section 2:</p>
            <p className="text-slate-600">
              Trackunit acknowledges receipt of {customerName || 'Customer'}&apos;s formal written notice of collaboration termination{noticeDate ? <> dated <strong>{noticeDate}</strong></> : ''}. In accordance with Section 2 of Trackunit&apos;s Terms & Conditions, all subscriptions are subject to an initial 36-month term and automatic 12-month renewal terms with a required 3-month prior written cancellation notice. Non-issued invoices through the effective cancellation dates are accelerated and presented below.
            </p>
          </div>

          {/* Itemized Schedule Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                  <th className="py-2.5 px-3">Asset ID</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Start Date</th>
                  <th className="py-2.5 px-3">Notice Status</th>
                  <th className="py-2.5 px-3">Contractual Cancellation</th>
                  <th className="py-2.5 px-3 text-right">Fee/Mo</th>
                  <th className="py-2.5 px-3 text-right">Unbilled Mo</th>
                  <th className="py-2.5 px-3 text-right">Settlement Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row) => (
                  <tr key={row.subscription.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-mono font-semibold text-slate-900">{row.subscription.assetId}</td>
                    <td className="py-2 px-3 text-slate-700">{row.subscription.assetName}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{row.subscription.startDate}</td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${row.isNoticeTimely ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {row.isNoticeTimely ? 'Timely' : 'Auto-Renewed'}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{row.effectiveCancellationDate}</td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600">{sym}{row.subscription.monthlyFee.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono">{row.unbilledMonths}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{sym}{row.remainingObligation.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                  <td colSpan={6} className="py-3 px-3 text-right text-slate-700">Total Unbilled Period:</td>
                  <td className="py-3 px-3 text-right font-mono">{summary.totalUnbilledMonths} mo</td>
                  <td className="py-3 px-3 text-right font-mono text-base font-extrabold text-slate-900 bg-[#FDF2F3]">
                    {sym}{summary.totalSettlementAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Instructions & Wire Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <CreditCard className="w-4 h-4 text-[#8A212B]" />
                <span>Bank Wire Remittance Details</span>
              </span>
              <p>Bank: <strong className="text-slate-800">Danske Bank A/S</strong></p>
              <p>IBAN: <strong className="font-mono text-slate-800">DK55 3000 0001 2938 4910</strong></p>
              <p>SWIFT/BIC: <strong className="font-mono text-slate-800">DABADKKK</strong></p>
              <p>Remittance Ref: <strong className="font-mono text-[#8A212B]">{caseCode}</strong></p>
            </div>

            <div className="space-y-4">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Full payment of this settlement statement discharges {customerName} from future subscription invoicing obligations for the assets enumerated above. Subscriptions remain active until their respective contractual cancellation dates.
              </p>
              <div className="pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <div>
                  <p className="font-semibold text-slate-900">Authorized Trackunit Signatory</p>
                  <p className="italic text-[11px] text-slate-400 mt-6">Billing & Credit Control Director</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Customer Acknowledgment</p>
                  <p className="italic text-[11px] text-slate-400 mt-6">{customerName} Representative</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
