import { SubscriptionRecord, CalculationResult, SettlementSummary } from '../types';

/**
 * Parses YYYY-MM-DD string into a safe Date object (UTC noon to prevent timezone shifts)
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day || 1, 12, 0, 0));
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Adds exact months to a date, preserving day or capping at month end
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const expectedMonth = result.getUTCMonth() + months;
  result.setUTCMonth(expectedMonth);
  // Handle overflow (e.g. adding 1 month to Jan 31 gives Feb 28/29, not Mar 2)
  if (result.getUTCMonth() !== ((expectedMonth % 12) + 12) % 12) {
    result.setUTCDate(0); // set to last day of previous month
  }
  return result;
}

/**
 * Calculates the exact contractual expiration date of a term of N months starting on startDate.
 * Under Trackunit Master Terms (§2), subscription terms run for full calendar months.
 * A 36-month initial term starting on 2022-11-01 expires on 2025-10-31 (the day prior to the anniversary).
 */
export function getTermEndDate(startDate: Date, termMonths: number): Date {
  const nextStart = addMonths(startDate, termMonths);
  const termEnd = new Date(nextStart.getTime());
  termEnd.setUTCDate(termEnd.getUTCDate() - 1);
  return termEnd;
}

/**
 * Returns the next term's start date (day following active term expiration)
 */
export function getNextTermStartDate(termEndDate: Date): Date {
  const next = new Date(termEndDate.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

/**
 * Calculates the 3-month prior notice cutoff deadline under Trackunit §2.
 * Notice must be given at least three (3) calendar months before the end of the term.
 * For a term ending on 2025-10-31, the 3-month cutoff is 2025-07-31.
 */
export function getNoticeCutoffDate(termEndDate: Date, noticeWindowMonths: number = 3): Date {
  const nextStart = getNextTermStartDate(termEndDate);
  const cutoffStart = addMonths(nextStart, -noticeWindowMonths);
  const cutoffDate = new Date(cutoffStart.getTime());
  cutoffDate.setUTCDate(cutoffDate.getUTCDate() - 1);
  return cutoffDate;
}

/**
 * Calculates month difference between two dates (decimal or whole months)
 */
export function getMonthDifference(fromDate: Date, toDate: Date): number {
  const yearDiff = toDate.getUTCFullYear() - fromDate.getUTCFullYear();
  const monthDiff = toDate.getUTCMonth() - fromDate.getUTCMonth();
  const dayDiff = (toDate.getUTCDate() - fromDate.getUTCDate()) / 30; // fractional days
  const total = yearDiff * 12 + monthDiff + dayDiff;
  return Math.max(0, Math.round(total * 100) / 100);
}

/**
 * Calculates whole billable calendar months between billed-to date and cancellation date.
 * Strictly adheres to Trackunit calendar billing cycles:
 * - If billed to 2025-07-31 and cancellation is 2025-10-31, unbilled months = 3 (Aug, Sep, Oct).
 * - If billed to 2025-06-30 and cancellation is 2026-08-31, unbilled months = 14.
 */
export function getBillableMonths(billedToDate: Date, cancellationDate: Date): number {
  if (cancellationDate.getTime() <= billedToDate.getTime()) {
    return 0;
  }
  
  const yearDiff = cancellationDate.getUTCFullYear() - billedToDate.getUTCFullYear();
  const monthDiff = cancellationDate.getUTCMonth() - billedToDate.getUTCMonth();
  let months = yearDiff * 12 + monthDiff;

  // If billedToDate is on day 1 (start of month, meaning that month has not yet been invoiced), include it
  if (billedToDate.getUTCDate() <= 5 && cancellationDate.getUTCDate() >= 25) {
    months += 1;
  }

  return Math.max(0, months);
}

/**
 * Evaluates Trackunit Terms & Conditions Section 2 for a single subscription
 */
export function calculateSubscriptionSettlement(
  sub: SubscriptionRecord,
  noticeDateStr: string = '2025-07-31'
): CalculationResult {
  const safeNoticeDateStr = noticeDateStr || '2025-07-31';
  const startDate = parseDate(sub.startDate);
  const noticeDate = parseDate(safeNoticeDateStr);
  const billedToDate = parseDate(sub.billedToDate);

  // Initial Term: 36 months pursuant to Trackunit §2
  const initialEndDate = getTermEndDate(startDate, 36);

  let currentTermNum = 1;
  let termStart = new Date(startDate.getTime());
  let termEnd = new Date(initialEndDate.getTime());

  // Advance through 12-month renewal terms if notice was given after the initial term
  while (noticeDate.getTime() > termEnd.getTime()) {
    currentTermNum++;
    termStart = getNextTermStartDate(termEnd);
    termEnd = getTermEndDate(termStart, 12);
  }

  const currentTermName = currentTermNum === 1 ? 'Initial Term (36 Mo)' : `Renewal Term ${currentTermNum - 1} (12 Mo)`;
  
  // 3-Month Notice Rule: Notice must be served >= 3 calendar months BEFORE termEnd
  const noticeDeadline = getNoticeCutoffDate(termEnd, 3);

  // Is notice timely?
  const isNoticeTimely = noticeDate.getTime() <= noticeDeadline.getTime();

  // Days difference to cutoff deadline (positive = days late, negative = days early)
  const daysDiff = Math.round((noticeDate.getTime() - noticeDeadline.getTime()) / (1000 * 60 * 60 * 24));

  let effectiveCancellationDate: Date;
  let wasAutoRenewed = false;

  if (isNoticeTimely) {
    // Timely notice: subscription terminates at the end of the current term
    effectiveCancellationDate = new Date(termEnd.getTime());
  } else {
    // Late notice (< 3 months before term end): automatically renews for 12 months under Section 2
    const nextStart = getNextTermStartDate(termEnd);
    effectiveCancellationDate = getTermEndDate(nextStart, 12);
    wasAutoRenewed = true;
  }

  // Calculate billable unbilled months between billedToDate and effectiveCancellationDate
  const unbilledMonths = getBillableMonths(billedToDate, effectiveCancellationDate);
  const remainingObligation = Math.round(unbilledMonths * sub.monthlyFee * 100) / 100;

  // Check if prepaid / overbilled past cancellation
  let overbilledAmount = 0;
  if (billedToDate.getTime() > effectiveCancellationDate.getTime()) {
    const overMonths = getBillableMonths(effectiveCancellationDate, billedToDate);
    overbilledAmount = Math.round(overMonths * sub.monthlyFee * 100) / 100;
  }

  // Determine status label
  let status: CalculationResult['status'] = 'Timely Termination';
  if (wasAutoRenewed) {
    status = 'Auto-Renewed (Late Notice)';
  } else if (overbilledAmount > 0) {
    status = 'Pre-billed / No Refund';
  } else if (unbilledMonths > 12) {
    status = 'Arrears Settled';
  }

  // Detailed mathematical and legal formula proof text
  const formulaApplied = wasAutoRenewed
    ? `T&C §2 Late Notice Rule: Term End (${formatDate(termEnd)}) + 12 Months Renewal = ${formatDate(effectiveCancellationDate)}`
    : `T&C §2 Timely Notice Rule: Notice served ≥ 3 months before Term End (${formatDate(termEnd)}) = ${formatDate(effectiveCancellationDate)}`;

  const formulaProof = wasAutoRenewed
    ? `Notice submitted on ${formatDate(noticeDate)}, missing the 3-month deadline of ${formatDate(noticeDeadline)} by ${Math.abs(daysDiff)} days. Per Trackunit Section 2, the subscription automatically renews for 12 months through ${formatDate(effectiveCancellationDate)}. Billed-to date is ${formatDate(billedToDate)}, leaving ${unbilledMonths} unbilled months @ €${sub.monthlyFee.toFixed(2)}/mo = €${remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
    : `Notice submitted on ${formatDate(noticeDate)} met the 3-month deadline of ${formatDate(noticeDeadline)} (${Math.abs(daysDiff)} days before cutoff). Subscription contractually terminates at current term end (${formatDate(effectiveCancellationDate)}). Billed-to date is ${formatDate(billedToDate)}, leaving ${unbilledMonths} unbilled months @ €${sub.monthlyFee.toFixed(2)}/mo = €${remainingObligation.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`;

  return {
    subscription: sub,
    initialTermMonths: 36,
    renewalTermMonths: 12,
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

/**
 * Summarizes the entire dataset
 */
export function calculateSettlementSummary(results: CalculationResult[]): SettlementSummary {
  let totalSettlementAmount = 0;
  let timelyTerminationsCount = 0;
  let timelyTerminationsAmount = 0;
  let autoRenewedCount = 0;
  let autoRenewedAmount = 0;
  let autoRenewalRevenueGain = 0;
  let totalUnbilledMonths = 0;
  let totalPrepaidNonRefundableAmount = 0;
  let flaggedInconsistenciesCount = 0;

  for (const r of results) {
    totalSettlementAmount += r.remainingObligation;
    totalUnbilledMonths += r.unbilledMonths;
    totalPrepaidNonRefundableAmount += r.overbilledAmount;

    if (r.subscription.inconsistencies && r.subscription.inconsistencies.length > 0) {
      flaggedInconsistenciesCount += r.subscription.inconsistencies.length;
    }

    if (r.wasAutoRenewed) {
      autoRenewedCount++;
      autoRenewedAmount += r.remainingObligation;
      // Revenue gained specifically because of the 12-month auto-renewal penalty
      autoRenewalRevenueGain += 12 * r.subscription.monthlyFee;
    } else {
      timelyTerminationsCount++;
      timelyTerminationsAmount += r.remainingObligation;
    }
  }

  const totalAssets = results.length;
  const averageSettlementPerAsset = totalAssets > 0 ? totalSettlementAmount / totalAssets : 0;

  return {
    totalAssets,
    totalSettlementAmount: Math.round(totalSettlementAmount * 100) / 100,
    timelyTerminationsCount,
    timelyTerminationsAmount: Math.round(timelyTerminationsAmount * 100) / 100,
    autoRenewedCount,
    autoRenewedAmount: Math.round(autoRenewedAmount * 100) / 100,
    autoRenewalRevenueGain: Math.round(autoRenewalRevenueGain * 100) / 100,
    totalUnbilledMonths,
    totalPrepaidNonRefundableAmount: Math.round(totalPrepaidNonRefundableAmount * 100) / 100,
    flaggedInconsistenciesCount,
    averageSettlementPerAsset: Math.round(averageSettlementPerAsset * 100) / 100,
  };
}
