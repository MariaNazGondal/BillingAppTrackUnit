import { SubscriptionRecord, CalculationResult, ValidationStandard, DiscrepancyRecord, ValidationReport } from '../types';
import { parseDate, formatDate, addMonths, getTermEndDate, getNoticeCutoffDate, getBillableMonths } from './calculator';

export const PREDEFINED_VALIDATION_STANDARDS: ValidationStandard[] = [
  {
    id: 'STD-TERM-01',
    code: 'STD-TERM-01',
    name: '36-Month Initial Term Integrity',
    category: 'Term Calculation',
    description: 'Fleet Plan contracts must strictly anchor to a 36-month initial term from Start Date before becoming eligible for annual renewals.',
    accuracyThreshold: 'Zero Tolerance (Exact Date Match)',
    governingClause: 'Trackunit Terms & Conditions §2: "The Fleet Plan or Asset Configuration is entered for an initial term of 36 months."'
  },
  {
    id: 'STD-NOTICE-02',
    code: 'STD-NOTICE-02',
    name: '3-Month Advance Notice Deadline Compliance',
    category: 'Notice Cutoff',
    description: 'Cancellation notice must be served at least three (3) full calendar months prior to the expiration of the active term.',
    accuracyThreshold: 'Exact Calendar Day Calculation',
    governingClause: 'Trackunit Terms & Conditions §2: "...cancelled by giving at least three (3) months prior written notice to the other Party."'
  },
  {
    id: 'STD-TIMELY-03',
    code: 'STD-TIMELY-03',
    name: 'Timeliness & Involuntary Extension Classification',
    category: 'Notice Cutoff',
    description: 'Notice served after the 3-month cutoff must automatically trigger a binding 12-month extension without exception.',
    accuracyThreshold: '100% Binary Classification Accuracy',
    governingClause: 'Trackunit Terms & Conditions §2: "...automatically renewed for an additional period of twelve (12) months."'
  },
  {
    id: 'STD-ARITH-04',
    code: 'STD-ARITH-04',
    name: 'Mathematical Charge & Billing Period Precision',
    category: 'Arithmetic Precision',
    description: 'Remaining financial liability must exactly equal Unbilled Calendar Months multiplied by Monthly Unit Rate.',
    accuracyThreshold: '±€0.00 Decimal Precision',
    governingClause: 'Trackunit Terms & Conditions §2: "...non-issued invoice(s) for Fleet Plan or Asset Configuration will be invoiced."'
  },
  {
    id: 'STD-PREPAID-05',
    code: 'STD-PREPAID-05',
    name: 'Strict Non-Refund of Pre-Billed Charges',
    category: 'Prepaid Clause',
    description: 'If an asset is billed beyond the effective cancellation date, no refund or credit memo is permitted under standard terms.',
    accuracyThreshold: 'Zero Credit Memo Issued (€0.00 Refund)',
    governingClause: 'Trackunit Terms & Conditions §2: "No repayment is made for the subscriptions invoiced, even if cancelled earlier than the end of the Initial Term."'
  },
  {
    id: 'STD-ARREARS-06',
    code: 'STD-ARREARS-06',
    name: 'Historical Arrears & Billing Blackout Reconciliation',
    category: 'Ledger Consistency',
    description: 'Flags any asset where Billed-To date lags the notice submission date by more than 60 days, requiring arrears recovery.',
    accuracyThreshold: 'Max 60-Day Billing Latency',
    governingClause: 'Master Agreement Billing Protocols: Telematics service transmitted must be fully invoiced up to active termination.'
  },
  {
    id: 'STD-SOURCE-07',
    code: 'STD-SOURCE-07',
    name: 'Source Google Sheet Field Consistency',
    category: 'Source Cross-Reference',
    description: 'Cross-checks asset serial numbers, valid monthly subscription fees (> 0), chronological start dates, and equipment categories against the source spreadsheet.',
    accuracyThreshold: '100% Required Field Validation',
    governingClause: 'Beta Industries Fleet Master Telematics Schedule (Google Sheet Import Reference)'
  },
  {
    id: 'STD-LEGAL-08',
    code: 'STD-LEGAL-08',
    name: 'Decommissioning vs Formal Written Notice Standard',
    category: 'Source Cross-Reference',
    description: 'Flags customer notes indicating informal portal deactivation or machine scrapping that lack formal written contract notice.',
    accuracyThreshold: 'Strict Written Legal Notice Subordination',
    governingClause: 'Trackunit Terms & Conditions §2: Deactivation in portal does not discharge contractual subscription obligations.'
  }
];

/**
 * Cross-references all calculation results, parsed terms, and raw source records
 * against the predefined accuracy standards.
 */
export function runValidationAudit(
  results: CalculationResult[],
  sourceRecords: SubscriptionRecord[],
  noticeDateStr: string = ''
): ValidationReport {
  if (results.length === 0 || !noticeDateStr) {
    return {
      totalAssetsAudited: 0,
      totalChecksPerformed: 0,
      passedChecksCount: 0,
      discrepancyCount: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      accuracyScore: 100,
      discrepancies: [],
      standards: PREDEFINED_VALIDATION_STANDARDS,
      sourceReconciliationPassed: true
    };
  }

  const discrepancies: DiscrepancyRecord[] = [];
  let totalChecks = 0;
  let passedChecks = 0;

  const noticeDate = parseDate(noticeDateStr);

  // Map source records for quick O(1) cross-referencing
  const sourceMap = new Map<string, SubscriptionRecord>();
  for (const src of sourceRecords) {
    sourceMap.set(src.assetId, src);
  }

  for (const r of results) {
    const assetId = r.subscription.assetId;
    const assetName = r.subscription.assetName;
    const src = sourceMap.get(assetId) || r.subscription;

    // --- CHECK 1: STD-TERM-01 (36-Month Initial Term Integrity) ---
    totalChecks++;
    const expectedInitialEnd = getTermEndDate(parseDate(r.subscription.startDate), 36);
    const actualInitialEnd = parseDate(r.initialTermEndDate);
    if (expectedInitialEnd.getTime() !== actualInitialEnd.getTime()) {
      discrepancies.push({
        id: `DISC-${assetId}-01`,
        assetId,
        assetName,
        standardCode: 'STD-TERM-01',
        standardName: '36-Month Initial Term Integrity',
        severity: 'critical',
        field: 'initialTermEndDate',
        sourceSheetValue: src.startDate,
        calculatedValue: r.initialTermEndDate,
        expectedValue: formatDate(expectedInitialEnd),
        variance: 'Date Mismatch',
        explanation: `Initial term for asset ${assetId} was calculated as ${r.initialTermEndDate} instead of exact 36-month mark ${formatDate(expectedInitialEnd)}.`,
        reconciliationAction: 'Re-align calculation to exact 36-month anniversary.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 2: STD-NOTICE-02 (3-Month Advance Notice Deadline Compliance) ---
    totalChecks++;
    const expectedNoticeDeadline = getNoticeCutoffDate(parseDate(r.currentTermEndDate), 3);
    const actualNoticeDeadline = parseDate(r.noticeDeadlineDate);
    if (expectedNoticeDeadline.getTime() !== actualNoticeDeadline.getTime()) {
      discrepancies.push({
        id: `DISC-${assetId}-02`,
        assetId,
        assetName,
        standardCode: 'STD-NOTICE-02',
        standardName: '3-Month Advance Notice Deadline Compliance',
        severity: 'critical',
        field: 'noticeDeadlineDate',
        sourceSheetValue: r.currentTermEndDate,
        calculatedValue: r.noticeDeadlineDate,
        expectedValue: formatDate(expectedNoticeDeadline),
        variance: 'Cutoff Date Discrepancy',
        explanation: `Notice cutoff deadline must fall exactly 3 calendar months before term expiration (${r.currentTermEndDate}).`,
        reconciliationAction: 'Adjust notice cutoff formula to 3 calendar months prior.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 3: STD-TIMELY-03 (Timeliness Classification Standard) ---
    totalChecks++;
    const isActuallyTimely = noticeDate.getTime() <= actualNoticeDeadline.getTime();
    if (r.isNoticeTimely !== isActuallyTimely) {
      discrepancies.push({
        id: `DISC-${assetId}-03`,
        assetId,
        assetName,
        standardCode: 'STD-TIMELY-03',
        standardName: 'Timeliness & Involuntary Extension Classification',
        severity: 'critical',
        field: 'isNoticeTimely',
        sourceSheetValue: noticeDateStr,
        calculatedValue: String(r.isNoticeTimely),
        expectedValue: String(isActuallyTimely),
        variance: 'Misclassification',
        explanation: `Notice timeliness binary flag does not match comparison between notice date (${noticeDateStr}) and cutoff (${r.noticeDeadlineDate}).`,
        reconciliationAction: 'Correct binary timeliness flag.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 4: STD-ARITH-04 (Mathematical Precision Standard) ---
    totalChecks++;
    const expectedCharge = Math.round(r.unbilledMonths * r.subscription.monthlyFee * 100) / 100;
    const diff = Math.abs(r.remainingObligation - expectedCharge);
    if (diff > 0.01) {
      discrepancies.push({
        id: `DISC-${assetId}-04`,
        assetId,
        assetName,
        standardCode: 'STD-ARITH-04',
        standardName: 'Mathematical Charge & Billing Period Precision',
        severity: 'critical',
        field: 'remainingObligation',
        sourceSheetValue: `€${src.monthlyFee.toFixed(2)}/mo`,
        calculatedValue: `€${r.remainingObligation.toFixed(2)}`,
        expectedValue: `€${expectedCharge.toFixed(2)}`,
        variance: `€${diff.toFixed(2)}`,
        explanation: `Calculated remaining obligation (€${r.remainingObligation.toFixed(2)}) deviates from unbilled months (${r.unbilledMonths}) × fee (€${r.subscription.monthlyFee.toFixed(2)}).`,
        reconciliationAction: 'Enforce strict 2-decimal rounded multiplication.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 5: STD-PREPAID-05 (Prepaid / Advance Invoicing Non-Refundable Check) ---
    totalChecks++;
    const billedToTime = parseDate(r.subscription.billedToDate).getTime();
    const cancTime = parseDate(r.effectiveCancellationDate).getTime();
    if (billedToTime > cancTime) {
      // Overbilled asset (e.g. BI-1008)
      if (r.remainingObligation > 0) {
        discrepancies.push({
          id: `DISC-${assetId}-05-ERR`,
          assetId,
          assetName,
          standardCode: 'STD-PREPAID-05',
          standardName: 'Strict Non-Refund of Pre-Billed Charges',
          severity: 'critical',
          field: 'remainingObligation',
          sourceSheetValue: `Billed to ${r.subscription.billedToDate}`,
          calculatedValue: `€${r.remainingObligation.toFixed(2)}`,
          expectedValue: '€0.00',
          variance: `Overcharge of €${r.remainingObligation.toFixed(2)}`,
          explanation: `Customer was pre-billed through ${r.subscription.billedToDate} past cancellation date ${r.effectiveCancellationDate}. Unbilled obligation must be €0.00.`,
          reconciliationAction: 'Set remaining obligation to €0.00 and flag prepaid non-refundable sum.',
          resolved: false
        });
      } else {
        // Flag as warning for billing review (auditor must confirm no credit memo is issued)
        discrepancies.push({
          id: `DISC-${assetId}-05-WARN`,
          assetId,
          assetName,
          standardCode: 'STD-PREPAID-05',
          standardName: 'Strict Non-Refund of Pre-Billed Charges',
          severity: 'warning',
          field: 'billedToDate',
          sourceSheetValue: `Billed To: ${r.subscription.billedToDate} (Quarterly Advance)`,
          calculatedValue: `Cancellation: ${r.effectiveCancellationDate}`,
          expectedValue: '€0.00 Refund (Section 2 Clause)',
          variance: `€${r.overbilledAmount.toFixed(2)} Prepaid Retained`,
          explanation: `Asset ${assetId} was advance billed 2 months beyond effective cancellation. Under T&C §2 strict terms, zero refund is owed to Beta Industries.`,
          reconciliationAction: 'Confirm with credit control that no credit note is issued to customer.',
          resolved: false
        });
      }
    } else {
      passedChecks++;
    }

    // --- CHECK 6: STD-ARREARS-06 (Historical Arrears & Billing Blackout Check) ---
    totalChecks++;
    const monthsBehindNotice = getBillableMonths(parseDate(r.subscription.billedToDate), noticeDate);
    if (monthsBehindNotice >= 2) {
      discrepancies.push({
        id: `DISC-${assetId}-06`,
        assetId,
        assetName,
        standardCode: 'STD-ARREARS-06',
        standardName: 'Historical Arrears & Billing Blackout Reconciliation',
        severity: monthsBehindNotice >= 6 ? 'critical' : 'warning',
        field: 'billedToDate',
        sourceSheetValue: `Last Billed: ${r.subscription.billedToDate}`,
        calculatedValue: `${monthsBehindNotice} Months in Arrears Prior to Notice`,
        expectedValue: `Up-to-date Billed-To (2025-07-31)`,
        variance: `${monthsBehindNotice} mo arrears (€${(monthsBehindNotice * r.subscription.monthlyFee).toFixed(2)})`,
        explanation: `Severe billing blackout detected. Asset was not invoiced since ${r.subscription.billedToDate} despite telematics remaining active. Total arrears must be collected in final settlement.`,
        reconciliationAction: 'Issue invoice acceleration for past unpaid telematics service months.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 7: STD-SOURCE-07 (Source Google Sheet Field Consistency) ---
    totalChecks++;
    const hasValidSerial = src.serialNumber && src.serialNumber.trim().length > 3;
    const hasValidFee = src.monthlyFee && src.monthlyFee > 0;
    const hasValidDates = parseDate(src.startDate).getTime() <= parseDate(src.billedToDate).getTime() + (60 * 86400000);

    if (!hasValidSerial || !hasValidFee || !hasValidDates) {
      discrepancies.push({
        id: `DISC-${assetId}-07`,
        assetId,
        assetName,
        standardCode: 'STD-SOURCE-07',
        standardName: 'Source Google Sheet Field Consistency',
        severity: 'warning',
        field: 'sourceDataIntegrity',
        sourceSheetValue: `Fee: ${src.monthlyFee}, SN: ${src.serialNumber}`,
        calculatedValue: 'Invalid Data Record',
        expectedValue: 'Valid Fee & Serial Number',
        variance: 'Data Format Issue',
        explanation: `Source spreadsheet row contains incomplete or anomalous telematics metadata.`,
        reconciliationAction: 'Update device registration records in Iris Manager.',
        resolved: false
      });
    } else {
      passedChecks++;
    }

    // --- CHECK 8: STD-LEGAL-08 (Decommissioning vs Written Notice Check) ---
    totalChecks++;
    const notesLower = (src.notes || '').toLowerCase();
    if (notesLower.includes('scrapped') || notesLower.includes('deactivated') || notesLower.includes('sold') || notesLower.includes('damaged')) {
      discrepancies.push({
        id: `DISC-${assetId}-08`,
        assetId,
        assetName,
        standardCode: 'STD-LEGAL-08',
        standardName: 'Decommissioning vs Formal Written Notice Standard',
        severity: 'warning',
        field: 'notes',
        sourceSheetValue: src.notes || '',
        calculatedValue: `Billed through ${r.effectiveCancellationDate}`,
        expectedValue: 'Formal Notice Required (31/07/2025)',
        variance: 'Informal Deactivation Claim',
        explanation: `Customer internal notes cite machine decommissioning or portal deactivation. Under T&C §2, portal deactivation does not terminate subscription billing until written notice is received.`,
        reconciliationAction: 'Enforce contract continuation through official written notice cancellation date.',
        resolved: false
      });
    } else {
      passedChecks++;
    }
  }

  const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
  const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
  const infoCount = discrepancies.filter(d => d.severity === 'info').length;

  const discrepancyCount = discrepancies.length;
  const accuracyScore = Math.max(0, Math.round(((totalChecks - criticalCount) / totalChecks) * 1000) / 10);

  return {
    totalAssetsAudited: results.length,
    totalChecksPerformed: totalChecks,
    passedChecksCount: totalChecks - discrepancyCount,
    discrepancyCount,
    criticalCount,
    warningCount,
    infoCount,
    accuracyScore,
    discrepancies,
    standards: PREDEFINED_VALIDATION_STANDARDS,
    sourceReconciliationPassed: criticalCount === 0
  };
}
