export type DeviceType = 'Raw' | 'Spot' | 'Beam' | 'Kin' | 'M7' | 'Third-Party IoT';

export type PlanType = 
  | 'Explore' 
  | 'Evolve' 
  | 'Expand' 
  | 'Core' 
  | 'Advanced' 
  | 'Basic' 
  | 'Light' 
  | 'Specialty' 
  | 'Premium SLA Add-on';

export type BillingFrequency = 'Monthly' | 'Quarterly' | 'Annually';

export type InconsistencySeverity = 'info' | 'warning' | 'critical';

export interface ClarifyingQuestionOption {
  id: string;
  label: string;
  actionValue: any;
  financialEffect?: string;
}

export interface ClarifyingQuestion {
  id: string;
  category: 'Duplicate Resolution' | 'Date Chronology' | 'Contract Term Duration' | 'SLA & Credit Memo' | 'Fee Discrepancy';
  question: string;
  context: string;
  impactOnBilling: string;
  recommendedAction: string;
  status: 'pending' | 'resolved';
  resolvedAction?: string;
  options?: ClarifyingQuestionOption[];
}

export interface DataInconsistency {
  id: string;
  field: string;
  description: string;
  severity: InconsistencySeverity;
  recommendation: string;
}

export interface SubscriptionRecord {
  id: string;
  assetId: string;
  assetName: string;
  deviceType: DeviceType;
  serialNumber: string;
  planType: PlanType;
  billingFrequency: BillingFrequency;
  monthlyFee: number;
  startDate: string; // YYYY-MM-DD
  billedToDate: string; // YYYY-MM-DD
  notes?: string;
  category?: 'Heavy Machinery' | 'Earthmoving' | 'Access Equipment' | 'Vehicles' | 'Tools & Attachments';
  inconsistencies?: DataInconsistency[];
}

export interface CalculationResult {
  subscription: SubscriptionRecord;
  initialTermMonths: number;
  renewalTermMonths: number;
  noticeGivenDate: string;
  initialTermEndDate: string;
  currentTermNumber: number; // 1 = Initial, 2 = Renewal 1, etc.
  currentTermName: string;
  currentTermStartDate: string;
  currentTermEndDate: string;
  noticeDeadlineDate: string; // 3 months before currentTermEndDate
  isNoticeTimely: boolean;
  daysLateOrEarly: number; // negative = early/timely, positive = late
  effectiveCancellationDate: string;
  wasAutoRenewed: boolean;
  unbilledMonths: number;
  remainingObligation: number;
  overbilledAmount: number; // if billedToDate > cancellationDate, this was prepaid and non-refundable
  formulaApplied: string;
  formulaProof: string;
  status: 'Timely Termination' | 'Auto-Renewed (Late Notice)' | 'Pre-billed / No Refund' | 'Arrears Settled';
}

export interface SettlementSummary {
  totalAssets: number;
  totalSettlementAmount: number;
  timelyTerminationsCount: number;
  timelyTerminationsAmount: number;
  autoRenewedCount: number;
  autoRenewedAmount: number;
  autoRenewalRevenueGain: number; // Revenue secured specifically due to the 3-month notice clause
  totalUnbilledMonths: number;
  totalPrepaidNonRefundableAmount: number;
  flaggedInconsistenciesCount: number;
  averageSettlementPerAsset: number;
}

export type SettlementResult = CalculationResult;
export type ExecutiveSummary = SettlementSummary;

export type FormulaPresetId = 
  | 'strict-tc-section-2' 
  | 'commercial-compromise-50' 
  | 'pro-rata-days' 
  | 'short-renewal-6mo'
  | 'accelerated-npv-cash' 
  | 'trackunit-42mo-oem'
  | 'trackunit-premium-sla-credit'
  | 'custom-sandbox';

export interface FormulaConfig {
  id: FormulaPresetId;
  name: string;
  badge: string;
  description: string;
  initialTermMonths: number;
  renewalTermMonths: number;
  noticeWindowMonths: number;
  autoRenewalDiscountPercent: number; // 0 = 100% full charge, 50 = 50% discount on renewal months
  allowPrepaidCredit: boolean; // false = strict T&C Section 2 no refund, true = refund overbilled amount
  cashAccelerationDiscountPercent: number; // e.g. 5% discount for immediate 10-day settlement
  prorationMethod: 'whole-calendar-month' | 'exact-days-prorated';
  slaTier?: 'Standard' | 'Premium';
  slaCreditMemoPercent?: number; // 5% credit under Trackunit Premium SLA
}

export interface ValidationStandard {
  id: string;
  code: string;
  name: string;
  category: 'Term Calculation' | 'Notice Cutoff' | 'Arithmetic Precision' | 'Prepaid Clause' | 'Ledger Consistency' | 'Source Cross-Reference';
  description: string;
  accuracyThreshold: string;
  governingClause: string;
}

export interface DiscrepancyRecord {
  id: string;
  assetId: string;
  assetName: string;
  standardCode: string;
  standardName: string;
  severity: 'critical' | 'warning' | 'info';
  field: string;
  sourceSheetValue: string;
  calculatedValue: string;
  expectedValue: string;
  variance: string;
  explanation: string;
  reconciliationAction: string;
  resolved: boolean;
}

export interface ValidationReport {
  totalAssetsAudited: number;
  totalChecksPerformed: number;
  passedChecksCount: number;
  discrepancyCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  accuracyScore: number;
  discrepancies: DiscrepancyRecord[];
  standards: ValidationStandard[];
  sourceReconciliationPassed: boolean;
}

export type DataCleaningActionType = 
  | 'date-format-corrected'
  | 'date-inversion-fixed'
  | 'duplicate-merged'
  | 'duplicate-removed'
  | 'missing-field-imputed'
  | 'invalid-value-fixed'
  | 'currency-parsed'
  | 'text-normalized'
  | 'chronology-corrected'
  | 'anomaly-flagged';

export interface DataCleaningNotice {
  id: string;
  rowNumber: number;
  assetId: string;
  field: string;
  actionType: DataCleaningActionType;
  severity: 'correction' | 'warning' | 'info' | 'critical';
  originalValue: string;
  cleanedValue: string;
  description: string;
  autoApplied: boolean;
  timestamp?: string;
}

export interface DateComparisonItem {
  rowNumber: number;
  assetId: string;
  assetName: string;
  rawInputDate: string;
  naiveParsedDate: string;
  correctedDate: string;
  reason: string;
  beforeExpiryDate: string;
  afterExpiryDate: string;
  beforeTimely: boolean;
  afterTimely: boolean;
  beforeUnbilledMonths: number;
  afterUnbilledMonths: number;
  beforeSettlement: number;
  afterSettlement: number;
  variance: number;
}

export interface DateInversionAnalysisReport {
  detectedJanuaryAnomaly: boolean;
  januaryClusterPercentage: number;
  totalDatesAnalyzed: number;
  inversedDatesCount: number;
  beforeRecalculationTotal: number;
  afterRecalculationTotal: number;
  netFinancialImpact: number;
  contractsSavedFromLatePenalty: number;
  itemizedComparisons: DateComparisonItem[];
}

export interface SanitizationConfig {
  autoFixDates: boolean;
  detectMonthDayInversion: boolean;
  enforceFirstOfMonthStarts: boolean;
  dateFormatConvention: 'auto' | 'eur-dd-mm' | 'us-mm-dd';
  deduplicateByAssetId: boolean;
  deduplicateBySerial: boolean;
  imputeMissingFees: boolean;
  imputeMissingDates: boolean;
  fixChronologyReversals: boolean;
}

export interface DataSanitizationReport {
  totalRawRows: number;
  cleanedRowsCount: number;
  duplicatesCount: number;
  datesCorrectedCount: number;
  monthDayInversionsCount: number;
  missingValuesImputedCount: number;
  formatNormalizationsCount: number;
  criticalErrorsCount: number;
  cleaningScore: number;
  notices: DataCleaningNotice[];
  cleanedRecords: SubscriptionRecord[];
  dateAnalysis?: DateInversionAnalysisReport;
  clarifyingQuestions?: ClarifyingQuestion[];
}
