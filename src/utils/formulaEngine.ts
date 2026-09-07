import { SubscriptionRecord, CalculationResult, FormulaConfig, FormulaPresetId } from '../types';
import { 
  parseDate, 
  formatDate, 
  addMonths, 
  getTermEndDate,
  getNextTermStartDate,
  getNoticeCutoffDate,
  getBillableMonths, 
  getMonthDifference 
} from './calculator';

export const FORMULA_PRESETS: Record<FormulaPresetId, FormulaConfig> = {
  'strict-tc-section-2': {
    id: 'strict-tc-section-2',
    name: 'Strict T&C Section 2 (Governing Standard)',
    badge: 'Legal Benchmark',
    description: 'Trackunit standard master agreement: 36-month initial term, 12-month auto-renewal, 3-month written notice cutoff, zero repayment for advance billed periods.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month'
  },
  'commercial-compromise-50': {
    id: 'commercial-compromise-50',
    name: 'Commercial Settlement Compromise (50% Rollover Discount)',
    badge: 'Dispute Resolution',
    description: 'Applies full charge on base term but extends a 50% discount on the involuntary 12-month rollover period to expedite amicable net-10 cash closing.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 50,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month'
  },
  'pro-rata-days': {
    id: 'pro-rata-days',
    name: 'Exact Day Pro-Rata Formula',
    badge: 'Actuarial Precision',
    description: 'Calculates unbilled service based on exact fractional days rather than whole monthly billing periods.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'exact-days-prorated'
  },
  'short-renewal-6mo': {
    id: 'short-renewal-6mo',
    name: 'Equitable 6-Month Renewal Extension',
    badge: 'Commercial Leeway',
    description: 'Caps involuntary renewals to 6 calendar months instead of a full 12-month rollover for missed deadlines.',
    initialTermMonths: 36,
    renewalTermMonths: 6,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month'
  },
  'accelerated-npv-cash': {
    id: 'accelerated-npv-cash',
    name: 'Immediate Cash Acceleration Discount (5% Off)',
    badge: 'Cash Incentive',
    description: 'Offers a 5% net deduction across the entire accelerated balance if Beta Industries wires full payment within 10 business days.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 5,
    prorationMethod: 'whole-calendar-month'
  },
  'trackunit-42mo-oem': {
    id: 'trackunit-42mo-oem',
    name: 'Trackunit 42-Month OEM Equipment Term',
    badge: 'OEM Extended Term',
    description: 'Trackunit 42-month initial term for OEM-embedded and heavy rental machinery configurations (as referenced in Trackunit equipment contracts), with 12-month auto-renewal and 3-month notice cutoff.',
    initialTermMonths: 42,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month'
  },
  'trackunit-premium-sla-credit': {
    id: 'trackunit-premium-sla-credit',
    name: 'Trackunit Premium SLA (5% Credit Memo Offset)',
    badge: '99.8% SLA Remedy',
    description: 'Applies official Trackunit Premium SLA remedy (https://trackunit.com/service-level-agreement/): 99.8% uptime commitment with a 5% credit memo compensation against monthly license fees for qualifying service availability claims.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month',
    slaTier: 'Premium',
    slaCreditMemoPercent: 5
  },
  'custom-sandbox': {
    id: 'custom-sandbox',
    name: 'Custom Parameter Sandbox',
    badge: 'User Configured',
    description: 'Interactive scenario where contractual term lengths, notice windows, and settlement discounts can be adjusted freely.',
    initialTermMonths: 36,
    renewalTermMonths: 12,
    noticeWindowMonths: 3,
    autoRenewalDiscountPercent: 0,
    allowPrepaidCredit: false,
    cashAccelerationDiscountPercent: 0,
    prorationMethod: 'whole-calendar-month'
  }
};

/**
 * Calculates settlement charges for a subscription using a dynamic FormulaConfig
 */
export function calculateSubscriptionWithFormula(
  sub: SubscriptionRecord,
  noticeDateStr: string,
  config: FormulaConfig
): CalculationResult {
  const safeNoticeDateStr = noticeDateStr || '2025-07-31';
  const startDate = parseDate(sub.startDate);
  const noticeDate = parseDate(safeNoticeDateStr);
  const billedToDate = parseDate(sub.billedToDate);

  // Initial Term under Trackunit §2
  const initialEndDate = getTermEndDate(startDate, config.initialTermMonths);

  let currentTermNum = 1;
  let termStart = new Date(startDate.getTime());
  let termEnd = new Date(initialEndDate.getTime());

  // Advance through renewal terms if notice given after initial term
  while (noticeDate.getTime() > termEnd.getTime()) {
    currentTermNum++;
    termStart = getNextTermStartDate(termEnd);
    termEnd = getTermEndDate(termStart, config.renewalTermMonths);
  }

  const currentTermName = currentTermNum === 1 
    ? `Initial Term (${config.initialTermMonths} Mo)` 
    : `Renewal Term ${currentTermNum - 1} (${config.renewalTermMonths} Mo)`;

  // Notice cutoff deadline
  const noticeDeadline = getNoticeCutoffDate(termEnd, config.noticeWindowMonths);
  const isNoticeTimely = noticeDate.getTime() <= noticeDeadline.getTime();
  const daysDiff = Math.round((noticeDate.getTime() - noticeDeadline.getTime()) / (1000 * 60 * 60 * 24));

  let effectiveCancellationDate: Date;
  let wasAutoRenewed = false;
  let autoRenewedMonths = 0;

  if (isNoticeTimely) {
    effectiveCancellationDate = new Date(termEnd.getTime());
  } else {
    const nextStart = getNextTermStartDate(termEnd);
    effectiveCancellationDate = getTermEndDate(nextStart, config.renewalTermMonths);
    wasAutoRenewed = true;
    autoRenewedMonths = config.renewalTermMonths;
  }

  // Calculate billable unbilled months
  let unbilledMonths = 0;
  if (config.prorationMethod === 'exact-days-prorated') {
    unbilledMonths = getMonthDifference(billedToDate, effectiveCancellationDate);
  } else {
    unbilledMonths = getBillableMonths(billedToDate, effectiveCancellationDate);
  }

  // Calculate base obligation vs rollover penalty portion
  let baseUnbilledMonths = unbilledMonths;
  let rolloverUnbilledMonths = 0;

  if (wasAutoRenewed) {
    // Portion of unbilled months that belong to the renewal extension
    rolloverUnbilledMonths = Math.min(unbilledMonths, autoRenewedMonths);
    baseUnbilledMonths = Math.max(0, unbilledMonths - rolloverUnbilledMonths);
  }

  // Apply auto-renewal discount if configured
  const rolloverMultiplier = (100 - config.autoRenewalDiscountPercent) / 100;
  let rawCharge = (baseUnbilledMonths * sub.monthlyFee) + (rolloverUnbilledMonths * sub.monthlyFee * rolloverMultiplier);

  // Check prepaid advance billing
  let overbilledAmount = 0;
  if (billedToDate.getTime() > effectiveCancellationDate.getTime()) {
    const overMonths = getBillableMonths(effectiveCancellationDate, billedToDate);
    overbilledAmount = Math.round(overMonths * sub.monthlyFee * 100) / 100;
    
    // If credit is allowed in non-strict scenario
    if (config.allowPrepaidCredit) {
      rawCharge = Math.max(0, rawCharge - overbilledAmount);
    }
  }

  // Apply cash acceleration discount if applicable
  if (config.cashAccelerationDiscountPercent > 0) {
    rawCharge = rawCharge * ((100 - config.cashAccelerationDiscountPercent) / 100);
  }

  // Apply Trackunit Premium SLA 5% Credit Memo remedy if applicable (https://trackunit.com/service-level-agreement/)
  if (config.slaCreditMemoPercent && config.slaCreditMemoPercent > 0) {
    rawCharge = rawCharge * ((100 - config.slaCreditMemoPercent) / 100);
  }

  const remainingObligation = Math.round(rawCharge * 100) / 100;

  // Status
  let status: CalculationResult['status'] = 'Timely Termination';
  if (wasAutoRenewed) {
    status = 'Auto-Renewed (Late Notice)';
  } else if (overbilledAmount > 0) {
    status = 'Pre-billed / No Refund';
  } else if (unbilledMonths > 12) {
    status = 'Arrears Settled';
  }

  // Formula descriptions
  let formulaApplied = '';
  if (wasAutoRenewed) {
    formulaApplied = `Formula Type B (Late Notice): Current Term End (${formatDate(termEnd)}) + ${config.renewalTermMonths}mo Extension`;
    if (config.autoRenewalDiscountPercent > 0) {
      formulaApplied += ` [${config.autoRenewalDiscountPercent}% Rollover Discount]`;
    }
  } else {
    formulaApplied = `Formula Type A (Timely Notice): Expiration at Current Term End (${formatDate(effectiveCancellationDate)})`;
  }

  if (config.prorationMethod === 'exact-days-prorated') {
    formulaApplied += ' (Exact Days Prorated)';
  }

  const formulaProof = wasAutoRenewed
    ? `Notice on ${formatDate(noticeDate)} missed ${config.noticeWindowMonths}-month cutoff (${formatDate(noticeDeadline)}) by ${Math.abs(daysDiff)} days. Effective cancellation: ${formatDate(effectiveCancellationDate)}. Unbilled: ${unbilledMonths} mo (${baseUnbilledMonths} base + ${rolloverUnbilledMonths} renewal @ ${config.autoRenewalDiscountPercent}% off) × €${sub.monthlyFee.toFixed(2)}/mo = €${remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
    : `Notice on ${formatDate(noticeDate)} met cutoff (${formatDate(noticeDeadline)}). Effective cancellation: ${formatDate(effectiveCancellationDate)}. Unbilled: ${unbilledMonths} mo × €${sub.monthlyFee.toFixed(2)}/mo = €${remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;

  return {
    subscription: sub,
    initialTermMonths: config.initialTermMonths,
    renewalTermMonths: config.renewalTermMonths,
    noticeGivenDate: formatDate(noticeDate),
    initialTermEndDate: formatDate(initialEndDate),
    currentTermNumber: currentTermNum,
    currentTermName,
    currentTermStartDate: formatDate(termStart),
    currentTermEndDate: formatDate(termEnd),
    noticeDeadlineDate: formatDate(noticeDeadline),
    isNoticeTimely,
    daysLateOrEarly: daysDiff,
    effectiveCancellationDate: formatDate(effectiveCancellationDate),
    wasAutoRenewed,
    unbilledMonths,
    remainingObligation,
    overbilledAmount,
    formulaApplied,
    formulaProof,
    status,
  };
}
