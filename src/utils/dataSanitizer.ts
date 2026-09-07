/**
 * Trackunit Data Cleaning & Ingestion Sanitization Engine
 * 
 * Specifically addresses real-world Excel/Google Sheet data quality issues:
 * - Incorrect date formats (Excel serial dates, DD/MM/YYYY vs MM/DD/YYYY, text dates, slashed/dotted delimiters)
 * - Chronological errors (BilledTo prior to StartDate)
 * - Row and asset duplicates (exact duplicates, conflicting asset duplicates, duplicate hardware serials)
 * - Missing or malformed fees (European decimal commas, currency symbols, missing rates auto-imputed)
 * - Missing asset identifiers, plan types, and hardware classifications
 * - Detailed audit notification ledger logging every correction made
 */

import { 
  SubscriptionRecord, 
  DeviceType, 
  PlanType, 
  BillingFrequency, 
  DataCleaningNotice, 
  DataSanitizationReport,
  SanitizationConfig,
  DateComparisonItem,
  DateInversionAnalysisReport,
  ClarifyingQuestion
} from '../types';
import { calculateSubscriptionSettlement } from './calculator';

export const DEFAULT_SANITIZATION_CONFIG: SanitizationConfig = {
  autoFixDates: true,
  detectMonthDayInversion: true,
  enforceFirstOfMonthStarts: true,
  dateFormatConvention: 'auto',
  deduplicateByAssetId: true,
  deduplicateBySerial: true,
  imputeMissingFees: true,
  imputeMissingDates: true,
  fixChronologyReversals: true,
};

const MONTH_NAMES: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

const STANDARD_PLAN_RATES: Record<PlanType, number> = {
  'Core': 39.00,
  'Advanced': 49.00,
  'Basic': 29.00,
  'Light': 19.00,
  'Specialty': 45.00,
  'Explore': 29.00,
  'Evolve': 49.00,
  'Expand': 69.00,
  'Premium SLA Add-on': 15.00,
};

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) return 0;
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if ([4, 6, 9, 11].includes(month)) return 30;
  return 31;
}

export function validateAndClampDate(
  year: number, 
  month: number, 
  day: number
): { year: number; month: number; day: number; wasClamped: boolean; reason: string } {
  let y = year;
  let m = month;
  let d = day;
  let wasClamped = false;
  let reason = '';

  if (y < 1990 || y > 2060) {
    if (y >= 0 && y <= 50) y += 2000;
    else if (y > 50 && y < 100) y += 1900;
    else {
      y = 2022;
      wasClamped = true;
      reason = `Year out of telematics bounds; normalized to ${y}.`;
    }
  }

  if (m < 1) { m = 1; wasClamped = true; reason = 'Month < 1 clamped to 01.'; }
  else if (m > 12) { m = 12; wasClamped = true; reason = 'Month > 12 clamped to 12.'; }

  const maxDays = getDaysInMonth(y, m);
  if (d < 1) { d = 1; wasClamped = true; reason = 'Day < 1 clamped to 01.'; }
  else if (d > maxDays) {
    d = maxDays;
    wasClamped = true;
    reason = `Day exceeded ${maxDays} for month ${m}/${y} (checked leap-year bounds); adjusted to ${maxDays}.`;
  }

  return { year: y, month: m, day: d, wasClamped, reason };
}

/**
 * Converts Excel serial date number (e.g., 44866 -> 2022-11-01) to ISO YYYY-MM-DD
 */
export function parseExcelSerialDate(serial: number): string | null {
  if (isNaN(serial) || serial < 30000 || serial > 65000) return null;
  // Excel base date: Dec 30, 1899
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const date = new Date(utcValue);
  
  if (isNaN(date.getTime())) return null;
  
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const validated = validateAndClampDate(y, m, d);
  return `${validated.year}-${String(validated.month).padStart(2, '0')}-${String(validated.day).padStart(2, '0')}`;
}

export interface DateParseResult {
  date: string | null;
  wasCorrected: boolean;
  original: string;
  method: string;
  naiveDate: string | null;
  isInversed: boolean;
}

/**
 * Robust date parser and normalizer with intelligent Month/Day Inversion detection.
 * Resolves the real-world bug where Excel or US locale imports parse European dates
 * into January (e.g. 01/11/2022 -> 2022-01-11 instead of 2022-11-01).
 */
export function cleanAndNormalizeDate(
  rawInput: any, 
  preferredFormat: 'EUR' | 'US' | 'auto' = 'auto',
  forceInversionSwap: boolean = false,
  enforceFirstOfMonth: boolean = true
): DateParseResult {
  if (rawInput === undefined || rawInput === null) {
    return { date: null, wasCorrected: false, original: '', method: 'empty', naiveDate: null, isInversed: false };
  }

  // Handle JS Date object from sheetjs cellDates
  if (rawInput instanceof Date && !isNaN(rawInput.getTime())) {
    const y = rawInput.getFullYear();
    const m = rawInput.getMonth() + 1;
    const d = rawInput.getDate();
    const naiveDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const origIso = rawInput.toISOString().slice(0, 10);

    // If month is 01 (January) and day is 2..12, and inversion is flagged or auto-inversion is active
    if ((forceInversionSwap || (enforceFirstOfMonth && preferredFormat !== 'US')) && m === 1 && d >= 2 && d <= 12) {
      const corrected = `${y}-${String(d).padStart(2, '0')}-01`;
      return {
        date: corrected,
        wasCorrected: true,
        original: origIso,
        method: `Inversed Month/Day Anomaly: Date object in January (${naiveDate}) corrected to 1st of month (${corrected})`,
        naiveDate,
        isInversed: true
      };
    }

    return { 
      date: naiveDate, 
      wasCorrected: false, 
      original: origIso, 
      method: 'native-date',
      naiveDate,
      isInversed: false
    };
  }

  const rawStr = String(rawInput).trim();
  if (!rawStr) {
    return { date: null, wasCorrected: false, original: rawStr, method: 'empty-string', naiveDate: null, isInversed: false };
  }

  // 1. Check if it's an Excel numeric serial date (e.g. "44866" or 44866)
  if (/^\d{5}(\.\d+)?$/.test(rawStr)) {
    const serial = parseFloat(rawStr);
    const converted = parseExcelSerialDate(serial);
    if (converted) {
      const [y, m, d] = converted.split('-').map(Number);
      const naiveDate = converted;

      if ((forceInversionSwap || (enforceFirstOfMonth && preferredFormat !== 'US')) && m === 1 && d >= 2 && d <= 12) {
        const corrected = `${y}-${String(d).padStart(2, '0')}-01`;
        return {
          date: corrected,
          wasCorrected: true,
          original: rawStr,
          method: `Inversed Month/Day Anomaly: Excel serial (${rawStr} -> ${converted}) corrected to ${corrected}`,
          naiveDate,
          isInversed: true
        };
      }

      return { 
        date: converted, 
        wasCorrected: true, 
        original: rawStr, 
        method: `Excel numeric serial date (${rawStr}) converted to ISO ${converted}`,
        naiveDate,
        isInversed: false
      };
    }
  }

  // Strip trailing time strings if present (e.g. "2022-11-01 00:00:00" or "T00:00:00")
  const datePart = rawStr.split(/[ T]/)[0].trim();

  // 2. Already clean ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-').map(Number);
    if (y >= 2000 && y <= 2040 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const naiveDate = datePart;
      if ((forceInversionSwap || (enforceFirstOfMonth && preferredFormat !== 'US')) && m === 1 && d >= 2 && d <= 12) {
        const corrected = `${y}-${String(d).padStart(2, '0')}-01`;
        return {
          date: corrected,
          wasCorrected: true,
          original: rawStr,
          method: `Inversed Month/Day Anomaly: ISO string starting in January (${datePart}) corrected to 1st of month (${corrected})`,
          naiveDate,
          isInversed: true
        };
      }
      return { date: datePart, wasCorrected: false, original: rawStr, method: 'iso-standard', naiveDate, isInversed: false };
    }
  }

  // 3. YYYY/MM/DD or YYYY.MM.DD
  if (/^\d{4}[\/.]\d{1,2}[\/.]\d{1,2}$/.test(datePart)) {
    const parts = datePart.split(/[\/.]/).map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    const naiveDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    if ((forceInversionSwap || (enforceFirstOfMonth && preferredFormat !== 'US')) && m === 1 && d >= 2 && d <= 12) {
      const corrected = `${y}-${String(d).padStart(2, '0')}-01`;
      return {
        date: corrected,
        wasCorrected: true,
        original: rawStr,
        method: `Inversed Month/Day Anomaly: Delimited YYYY/MM/DD (${datePart}) corrected to ${corrected}`,
        naiveDate,
        isInversed: true
      };
    }

    const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return { 
      date: formatted, 
      wasCorrected: true, 
      original: rawStr, 
      method: `Delimited YYYY/MM/DD normalized to ${formatted}`,
      naiveDate,
      isInversed: false
    };
  }

  // 4. DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmMatch = datePart.match(/^(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})$/);
  if (dmMatch) {
    let part1 = parseInt(dmMatch[1], 10);
    let part2 = parseInt(dmMatch[2], 10);
    let year = parseInt(dmMatch[3], 10);

    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    let day = part1;
    let month = part2;

    // Disambiguation
    if (part1 > 12 && part2 <= 12) {
      // Must be DD/MM/YYYY
      day = part1;
      month = part2;
    } else if (part2 > 12 && part1 <= 12) {
      // Must be MM/DD/YYYY
      day = part2;
      month = part1;
    } else if (preferredFormat === 'US') {
      month = part1;
      day = part2;
    } else if (preferredFormat === 'EUR') {
      day = part1;
      month = part2;
    } else {
      // Auto: B2B telematics contract activations start on the 1st of the month!
      if (part1 === 1 && part2 >= 2 && part2 <= 12) {
        // e.g. 01/11/2022 -> Day 1, Month 11
        day = 1;
        month = part2;
      } else if (part2 === 1 && part1 >= 2 && part1 <= 12) {
        // e.g. 11/01/2022 -> Month 11, Day 1
        month = part1;
        day = 1;
      } else {
        // Default European
        day = part1;
        month = part2;
      }
    }

    const naiveDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Apply inversion swap if month ended up as January and day is 2..12
    if ((forceInversionSwap || (enforceFirstOfMonth && preferredFormat !== 'US')) && month === 1 && day >= 2 && day <= 12) {
      const corrected = `${year}-${String(day).padStart(2, '0')}-01`;
      return {
        date: corrected,
        wasCorrected: true,
        original: rawStr,
        method: `Inversed Month/Day Anomaly: Numeric date (${rawStr}) corrected to ${corrected}`,
        naiveDate,
        isInversed: true
      };
    }

    const formatted = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { 
      date: formatted, 
      wasCorrected: true, 
      original: rawStr, 
      method: `Numeric date (${rawStr}) normalized to ISO ${formatted}`,
      naiveDate,
      isInversed: false
    };
  }

  // 5. Named Month dates: e.g. "01 Nov 2022", "1-November-2022", "Nov 1, 2022"
  const textMonthMatch1 = rawStr.match(/^(\d{1,2})[\/\-. ]+([a-zA-Z]{3,9})[\/\-. ]+(\d{2,4})/);
  if (textMonthMatch1) {
    const day = String(textMonthMatch1[1]).padStart(2, '0');
    const monthKey = textMonthMatch1[2].toLowerCase();
    const month = MONTH_NAMES[monthKey] || MONTH_NAMES[monthKey.slice(0, 3)];
    let year = parseInt(textMonthMatch1[3], 10);
    if (year < 100) year += 2000;

    if (month) {
      const formatted = `${year}-${month}-${day}`;
      return { 
        date: formatted, 
        wasCorrected: true, 
        original: rawStr, 
        method: `Textual date (${rawStr}) parsed to ${formatted}`,
        naiveDate: formatted,
        isInversed: false
      };
    }
  }

  const textMonthMatch2 = rawStr.match(/^([a-zA-Z]{3,9})[\/\-. ]+(\d{1,2})[,\/\-. ]+(\d{2,4})/);
  if (textMonthMatch2) {
    const monthKey = textMonthMatch2[1].toLowerCase();
    const month = MONTH_NAMES[monthKey] || MONTH_NAMES[monthKey.slice(0, 3)];
    const day = String(textMonthMatch2[2]).padStart(2, '0');
    let year = parseInt(textMonthMatch2[3], 10);
    if (year < 100) year += 2000;

    if (month) {
      const formatted = `${year}-${month}-${day}`;
      return { 
        date: formatted, 
        wasCorrected: true, 
        original: rawStr, 
        method: `US text date (${rawStr}) parsed to ${formatted}`,
        naiveDate: formatted,
        isInversed: false
      };
    }
  }

  // 6. Native Date parsing fallback
  const parsed = new Date(rawStr);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y >= 2000 && y <= 2040) {
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      const formatted = `${y}-${m}-${d}`;
      return { 
        date: formatted, 
        wasCorrected: true, 
        original: rawStr, 
        method: `Standard JS Date fallback parsed ${rawStr} to ${formatted}`,
        naiveDate: formatted,
        isInversed: false
      };
    }
  }

  return { date: null, wasCorrected: false, original: rawStr, method: 'unparseable', naiveDate: null, isInversed: false };
}

/**
 * Cleans string fees, handles commas, currency symbols, and negatives
 */
export function cleanMonthlyFee(
  rawFee: any, 
  plan: PlanType
): { fee: number; wasCorrected: boolean; original: string; method: string } {
  if (rawFee === undefined || rawFee === null || rawFee === '') {
    const defaultFee = STANDARD_PLAN_RATES[plan] || 39.00;
    return { 
      fee: defaultFee, 
      wasCorrected: true, 
      original: '(empty)', 
      method: `Missing fee imputed from ${plan} plan default rate (€${defaultFee.toFixed(2)})` 
    };
  }

  const originalStr = String(rawFee).trim();
  // Strip currency symbols and letters: € $ £ EUR USD DKK
  let cleanedStr = originalStr
    .replace(/[€$£]/g, '')
    .replace(/\b(EUR|USD|DKK|GBP)\b/gi, '')
    .trim();

  // Handle European comma decimal: "49,00" -> "49.00"
  if (/^\d+,\d{2}$/.test(cleanedStr)) {
    cleanedStr = cleanedStr.replace(',', '.');
  } else if (cleanedStr.includes(',') && !cleanedStr.includes('.')) {
    cleanedStr = cleanedStr.replace(',', '.');
  }

  let num = parseFloat(cleanedStr);

  if (isNaN(num)) {
    const defaultFee = STANDARD_PLAN_RATES[plan] || 39.00;
    return { 
      fee: defaultFee, 
      wasCorrected: true, 
      original: originalStr, 
      method: `Unparseable fee '${originalStr}' replaced with standard ${plan} plan fee (€${defaultFee.toFixed(2)})` 
    };
  }

  // Handle negative fees accidentally entered
  if (num < 0) {
    num = Math.abs(num);
    return { 
      fee: num, 
      wasCorrected: true, 
      original: originalStr, 
      method: `Negative sign removed from fee '${originalStr}' -> €${num.toFixed(2)}` 
    };
  }

  // Zero fee check
  if (num === 0) {
    const defaultFee = STANDARD_PLAN_RATES[plan] || 39.00;
    return { 
      fee: defaultFee, 
      wasCorrected: true, 
      original: originalStr, 
      method: `Zero fee flagged; imputed standard ${plan} tier rate (€${defaultFee.toFixed(2)})` 
    };
  }

  const wasCorrected = cleanedStr !== originalStr || originalStr.includes(',') || originalStr.includes('€');
  return { 
    fee: Math.round(num * 100) / 100, 
    wasCorrected, 
    original: originalStr, 
    method: wasCorrected ? `Sanitized currency/delimiter in '${originalStr}' to €${num.toFixed(2)}` : 'clean' 
  };
}

/**
 * Normalizes Plan Types to valid enum values
 */
export function normalizePlanType(raw: any): { plan: PlanType; wasCorrected: boolean; original: string } {
  const original = String(raw || '').trim();
  const lower = original.toLowerCase();

  if (lower.includes('adv')) return { plan: 'Advanced', wasCorrected: original !== 'Advanced', original };
  if (lower.includes('spec') || lower.includes('custom') || lower.includes('heavy')) {
    return { plan: 'Specialty', wasCorrected: original !== 'Specialty', original };
  }
  if (lower.includes('light') || lower.includes('lite') || lower.includes('mini')) {
    return { plan: 'Light', wasCorrected: original !== 'Light', original };
  }
  if (lower.includes('bas') || lower.includes('starter') || lower.includes('sla')) {
    return { plan: 'Basic', wasCorrected: original !== 'Basic', original };
  }
  // Default to Core
  return { plan: 'Core', wasCorrected: original !== 'Core', original };
}

/**
 * Normalizes Device Types to valid enum values
 */
export function normalizeDeviceType(raw: any): { device: DeviceType; wasCorrected: boolean; original: string } {
  const original = String(raw || '').trim();
  const lower = original.toLowerCase();

  if (lower.includes('spot') || lower.includes('battery')) {
    return { device: 'Spot', wasCorrected: original !== 'Spot', original };
  }
  if (lower.includes('beam') || lower.includes('beacon') || lower.includes('ble')) {
    return { device: 'Beam', wasCorrected: original !== 'Beam', original };
  }
  return { device: 'Raw', wasCorrected: original !== 'Raw', original };
}

/**
 * Primary Data Sanitizer Function
 * Takes raw parsed spreadsheet rows and returns thoroughly cleaned records plus a full audit report.
 */
export function sanitizeUploadedDataset(
  rawRows: any[], 
  config: SanitizationConfig = DEFAULT_SANITIZATION_CONFIG,
  caseNoticeDate: string = '2025-07-31'
): DataSanitizationReport {
  const notices: DataCleaningNotice[] = [];
  let noticeCounter = 1;

  const addNotice = (
    rowNumber: number,
    assetId: string,
    field: string,
    actionType: DataCleaningNotice['actionType'],
    severity: DataCleaningNotice['severity'],
    originalValue: string,
    cleanedValue: string,
    description: string
  ) => {
    notices.push({
      id: `CLN-${String(noticeCounter++).padStart(4, '0')}`,
      rowNumber,
      assetId,
      field,
      actionType,
      severity,
      originalValue,
      cleanedValue,
      description,
      autoApplied: true,
      timestamp: new Date().toISOString()
    });
  };

  const intermediateRecords: SubscriptionRecord[] = [];
  let datesCorrectedCount = 0;
  let monthDayInversionsCount = 0;
  let missingValuesImputedCount = 0;
  let formatNormalizationsCount = 0;
  let criticalErrorsCount = 0;

  // Track raw original and naive dates for financial recalculation
  const rawOriginalMap = new Map<string, string>();
  const rawNaiveMap = new Map<string, string>();

  // Map config format convention to parser preference
  const prefFormat: 'EUR' | 'US' | 'auto' = 
    config.dateFormatConvention === 'eur-dd-mm' ? 'EUR' : 
    config.dateFormatConvention === 'us-mm-dd' ? 'US' : 'auto';

  // PASS 1: Statistical Dataset-Wide Scan for Month/Day Inversion (The "January Anomaly")
  let totalValidDatesFound = 0;
  let januaryCount = 0;
  let januaryCandidateInversionCount = 0; // dates with month === 1 and day between 2 and 12

  for (const rawRow of rawRows) {
    if (!rawRow || typeof rawRow !== 'object') continue;
    const normalized: Record<string, any> = {};
    for (const k of Object.keys(rawRow)) {
      const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      normalized[cleanKey] = rawRow[k];
    }
    const rawStartDate = normalized['startdate'] || normalized['start'] || normalized['contractstart'] || normalized['activationdate'];
    if (rawStartDate) {
      // Test naive parse (without forced inversion swap)
      const naive = cleanAndNormalizeDate(rawStartDate, prefFormat, false, false);
      if (naive.date) {
        totalValidDatesFound++;
        const [, m, d] = naive.date.split('-').map(Number);
        if (m === 1) {
          januaryCount++;
          if (d >= 2 && d <= 12) {
            januaryCandidateInversionCount++;
          }
        }
      }
    }
  }

  const januaryClusterPercentage = totalValidDatesFound > 0 
    ? Math.round((januaryCount / totalValidDatesFound) * 100) 
    : 0;

  // Detect Month/Day inversion if:
  // - High January percentage (>= 30%) with day 2-12 dates, OR
  // - Multiple candidate inversions (>= 2), OR
  // - All dates in January with day 2-12, OR
  // - detectMonthDayInversion is explicitly active and candidate exists
  const detectedJanuaryAnomaly = Boolean(
    config.detectMonthDayInversion && (
      (januaryClusterPercentage >= 30 && januaryCandidateInversionCount >= 1) ||
      (januaryCandidateInversionCount >= 2) ||
      (totalValidDatesFound > 0 && januaryCount === totalValidDatesFound && januaryCandidateInversionCount > 0)
    )
  );

  // STEP 1: Row-by-row field extraction, normalization, date inversion resolution, and missing data imputation
  for (let i = 0; i < rawRows.length; i++) {
    const rawRow = rawRows[i];
    const rowNum = i + 2; // Accounting for Excel 1-based header row

    // Normalize keys
    const normalized: Record<string, any> = {};
    for (const k of Object.keys(rawRow)) {
      const cleanKey = k.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      normalized[cleanKey] = rawRow[k];
    }

    // Skip entirely empty row
    const nonNullValues = Object.values(rawRow).filter(v => v !== undefined && v !== null && String(v).trim() !== '');
    if (nonNullValues.length === 0) continue;

    // Asset ID
    let rawAssetId = normalized['assetid'] || normalized['asset'] || normalized['unitid'] || normalized['id'] || '';
    let assetId = String(rawAssetId).trim();
    if (!assetId) {
      assetId = `BI-AUTO-${1000 + intermediateRecords.length + 1}`;
      missingValuesImputedCount++;
      addNotice(
        rowNum,
        assetId,
        'Asset ID',
        'missing-field-imputed',
        'warning',
        '(empty)',
        assetId,
        `Missing Asset Identifier. Automatically assigned tracking key ${assetId}.`
      );
    }

    // Asset Name / Description
    let rawAssetName = normalized['assetname'] || normalized['description'] || normalized['name'] || normalized['equipment'] || '';
    let assetName = String(rawAssetName).trim();
    if (!assetName) {
      assetName = `Beta Fleet Asset ${intermediateRecords.length + 1}`;
      missingValuesImputedCount++;
      addNotice(
        rowNum,
        assetId,
        'Description',
        'missing-field-imputed',
        'info',
        '(empty)',
        assetName,
        `Asset name was missing. Imputed placeholder description.`
      );
    }

    // Serial Number
    let rawSerial = normalized['serialnumber'] || normalized['serial'] || normalized['sn'] || '';
    let serialNumber = String(rawSerial).trim();
    if (!serialNumber) {
      serialNumber = `TU-GEN-${100000 + intermediateRecords.length + 1}`;
      missingValuesImputedCount++;
      addNotice(
        rowNum,
        assetId,
        'Serial Number',
        'missing-field-imputed',
        'warning',
        '(empty)',
        serialNumber,
        `Missing physical telematics hardware serial. Generated placeholder hardware ID ${serialNumber}.`
      );
    }

    // Plan Type & Device Type
    const { plan, wasCorrected: planFixed, original: originalPlan } = normalizePlanType(
      normalized['plantype'] || normalized['plan']
    );
    if (planFixed && originalPlan) {
      formatNormalizationsCount++;
      addNotice(
        rowNum,
        assetId,
        'Plan Type',
        'text-normalized',
        'info',
        originalPlan,
        plan,
        `Standardized non-standard plan name '${originalPlan}' to Trackunit tier '${plan}'.`
      );
    }

    const { device, wasCorrected: devFixed, original: originalDev } = normalizeDeviceType(
      normalized['devicetype'] || normalized['device']
    );
    if (devFixed && originalDev) {
      formatNormalizationsCount++;
      addNotice(
        rowNum,
        assetId,
        'Device Type',
        'text-normalized',
        'info',
        originalDev,
        device,
        `Normalized hardware type string '${originalDev}' to '${device}'.`
      );
    }

    // Monthly Fee
    const rawFee = normalized['monthlyfee'] || normalized['fee'] || normalized['price'] || normalized['rate'];
    const { fee, wasCorrected: feeFixed, original: originalFee, method: feeMethod } = cleanMonthlyFee(rawFee, plan);
    if (feeFixed) {
      if (originalFee === '(empty)' || originalFee === '0') {
        missingValuesImputedCount++;
      } else {
        formatNormalizationsCount++;
      }
      addNotice(
        rowNum,
        assetId,
        'Monthly Fee',
        originalFee === '(empty)' ? 'missing-field-imputed' : 'currency-parsed',
        'correction',
        originalFee,
        `€${fee.toFixed(2)}`,
        feeMethod
      );
    }

    // Dates Cleaning
    // Start Date with Inversion Disambiguation
    const rawStartDate = normalized['startdate'] || normalized['start'] || normalized['contractstart'] || normalized['activationdate'];
    const cleanStart = cleanAndNormalizeDate(
      rawStartDate, 
      prefFormat,
      detectedJanuaryAnomaly || config.detectMonthDayInversion,
      config.enforceFirstOfMonthStarts
    );
    let startDate = cleanStart.date;
    const naiveStartDate = cleanStart.naiveDate || startDate || '2022-09-01';

    // Store for comparative before/after analysis
    rawOriginalMap.set(assetId, String(rawStartDate || ''));
    rawNaiveMap.set(assetId, naiveStartDate);

    if (!startDate) {
      // Missing start date: auto-impute benchmark baseline
      startDate = '2022-09-01';
      missingValuesImputedCount++;
      criticalErrorsCount++;
      addNotice(
        rowNum,
        assetId,
        'Start Date',
        'missing-field-imputed',
        'critical',
        String(rawStartDate || '(empty)'),
        startDate,
        `Missing or unparseable Contract Start Date. Imputed baseline anchor date ${startDate}. Requires manual verification.`
      );
    } else if (cleanStart.isInversed) {
      monthDayInversionsCount++;
      datesCorrectedCount++;
      addNotice(
        rowNum,
        assetId,
        'Start Date',
        'date-inversion-fixed',
        'correction',
        cleanStart.naiveDate || cleanStart.original,
        startDate,
        cleanStart.method
      );
    } else if (cleanStart.wasCorrected) {
      datesCorrectedCount++;
      addNotice(
        rowNum,
        assetId,
        'Start Date',
        'date-format-corrected',
        'correction',
        cleanStart.original,
        startDate,
        cleanStart.method
      );
    }

    // Billed-To Date
    const rawBilledTo = normalized['billedtodate'] || normalized['billedto'] || normalized['lastbilled'] || normalized['paidto'];
    let cleanBilled = cleanAndNormalizeDate(rawBilledTo, 'EUR', false, false);
    let billedToDate = cleanBilled.date;

    if (!billedToDate) {
      // Missing billed to date: impute case notice date
      billedToDate = caseNoticeDate;
      missingValuesImputedCount++;
      addNotice(
        rowNum,
        assetId,
        'Billed-To Date',
        'missing-field-imputed',
        'warning',
        String(rawBilledTo || '(empty)'),
        billedToDate,
        `Missing Last Invoiced Date. Imputed case notice date ${billedToDate}.`
      );
    } else if (cleanBilled.wasCorrected) {
      datesCorrectedCount++;
      addNotice(
        rowNum,
        assetId,
        'Billed-To Date',
        'date-format-corrected',
        'correction',
        cleanBilled.original,
        billedToDate,
        cleanBilled.method
      );
    }

    // Chronology Validation: Billed-To cannot precede StartDate
    if (config.fixChronologyReversals && startDate && billedToDate && billedToDate < startDate) {
      criticalErrorsCount++;
      // Check if dates were accidentally swapped in the upload
      const temp = startDate;
      startDate = billedToDate;
      billedToDate = temp;
      addNotice(
        rowNum,
        assetId,
        'Date Chronology',
        'chronology-corrected',
        'critical',
        `Start: ${temp}, BilledTo: ${startDate}`,
        `Start: ${startDate}, BilledTo: ${temp}`,
        `Impossible chronology: Billed-to date preceded start date. Inverted dates were swapped to maintain contractual validity.`
      );
    }

    const billingFrequency: BillingFrequency = 'Monthly';
    const notes = normalized['notes'] || normalized['comment'] || '';
    const category = normalized['category'] || normalized['classification'] || 'Fleet Equipment';

    intermediateRecords.push({
      id: `SUB-${1000 + intermediateRecords.length + 1}`,
      assetId,
      assetName,
      deviceType: device,
      serialNumber,
      planType: plan,
      billingFrequency,
      monthlyFee: fee,
      startDate,
      billedToDate,
      notes: String(notes).trim(),
      category: (category as any) || 'Heavy Machinery'
    });
  }

  // STEP 2: Deduplication Engine (by Asset ID and Serial Number)
  let duplicatesCount = 0;
  const deduplicatedRecords: SubscriptionRecord[] = [];
  const seenAssetIds = new Map<string, { record: SubscriptionRecord; index: number }>();
  const seenSerials = new Map<string, { record: SubscriptionRecord; index: number }>();

  for (let i = 0; i < intermediateRecords.length; i++) {
    const current = intermediateRecords[i];
    const assetKey = current.assetId.toUpperCase();
    const serialKey = current.serialNumber.toUpperCase();

    // Check Duplicate Asset ID
    if (config.deduplicateByAssetId && seenAssetIds.has(assetKey)) {
      duplicatesCount++;
      const existing = seenAssetIds.get(assetKey)!;

      // Consolidate: if current has later billedToDate or more complete data, keep the latest
      if (current.billedToDate > existing.record.billedToDate) {
        addNotice(
          i + 2,
          current.assetId,
          'Duplicate Asset ID',
          'duplicate-merged',
          'warning',
          `BilledTo: ${existing.record.billedToDate}`,
          `BilledTo: ${current.billedToDate}`,
          `Duplicate entry detected for Asset ${current.assetId}. Consolidated records and retained row with latest invoiced date (${current.billedToDate}).`
        );
        // Replace in array
        const idx = deduplicatedRecords.findIndex(r => r.assetId.toUpperCase() === assetKey);
        if (idx !== -1) {
          deduplicatedRecords[idx] = current;
          seenAssetIds.set(assetKey, { record: current, index: idx });
        }
      } else {
        addNotice(
          i + 2,
          current.assetId,
          'Duplicate Asset ID',
          'duplicate-removed',
          'warning',
          `Row ${i + 2} duplicated Row ${existing.index + 2}`,
          '(removed duplicate)',
          `Duplicate record for Asset ID ${current.assetId} discarded in favor of existing primary record.`
        );
      }
      continue;
    }

    // Check Duplicate Serial Number
    if (config.deduplicateBySerial && seenSerials.has(serialKey)) {
      const existing = seenSerials.get(serialKey)!;
      addNotice(
        i + 2,
        current.assetId,
        'Serial Collision',
        'anomaly-flagged',
        'warning',
        `Serial ${current.serialNumber}`,
        `Existing on Asset ${existing.record.assetId}`,
        `Hardware Collision: Serial number ${current.serialNumber} is already associated with Asset ${existing.record.assetId}. Retained both but flagged hardware ambiguity.`
      );
    }

    seenAssetIds.set(assetKey, { record: current, index: deduplicatedRecords.length });
    seenSerials.set(serialKey, { record: current, index: deduplicatedRecords.length });
    deduplicatedRecords.push(current);
  }

  // STEP 3: Before vs. After Financial Recalculation Engine
  const itemizedComparisons: DateComparisonItem[] = [];
  let beforeRecalculationTotal = 0;
  let afterRecalculationTotal = 0;
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < deduplicatedRecords.length; i++) {
    const record = deduplicatedRecords[i];
    const naiveDate = rawNaiveMap.get(record.assetId) || record.startDate;

    // Evaluate settlement assuming naive uncorrected date (e.g. 2022-01-11)
    const naiveSub: SubscriptionRecord = {
      ...record,
      startDate: naiveDate
    };

    const beforeCalc = calculateSubscriptionSettlement(naiveSub, caseNoticeDate);
    const afterCalc = calculateSubscriptionSettlement(record, caseNoticeDate);

    beforeRecalculationTotal += beforeCalc.remainingObligation;
    afterRecalculationTotal += afterCalc.remainingObligation;

    if (naiveDate !== record.startDate) {
      const [, m] = record.startDate.split('-').map(Number);
      const naiveParts = naiveDate.split('-');
      const naiveD = naiveParts[2];

      itemizedComparisons.push({
        rowNumber: i + 1,
        assetId: record.assetId,
        assetName: record.assetName,
        rawInputDate: rawOriginalMap.get(record.assetId) || naiveDate,
        naiveParsedDate: naiveDate,
        correctedDate: record.startDate,
        reason: `Inversed Month/Day Anomaly: Date was registered as January ${naiveD}th (${naiveDate}), but telematics contract cycle begins on 1st of month. Corrected to ${monthNames[m - 1]} 1st (${record.startDate}).`,
        beforeExpiryDate: beforeCalc.currentTermEndDate,
        afterExpiryDate: afterCalc.currentTermEndDate,
        beforeTimely: beforeCalc.isNoticeTimely,
        afterTimely: afterCalc.isNoticeTimely,
        beforeUnbilledMonths: beforeCalc.unbilledMonths,
        afterUnbilledMonths: afterCalc.unbilledMonths,
        beforeSettlement: Math.round(beforeCalc.remainingObligation * 100) / 100,
        afterSettlement: Math.round(afterCalc.remainingObligation * 100) / 100,
        variance: Math.round((afterCalc.remainingObligation - beforeCalc.remainingObligation) * 100) / 100
      });
    }
  }

  const netFinancialImpact = Math.round((afterRecalculationTotal - beforeRecalculationTotal) * 100) / 100;
  const contractsSavedFromLatePenalty = itemizedComparisons.filter(c => !c.beforeTimely && c.afterTimely).length;

  const dateAnalysis: DateInversionAnalysisReport = {
    detectedJanuaryAnomaly,
    januaryClusterPercentage,
    totalDatesAnalyzed: totalValidDatesFound,
    inversedDatesCount: monthDayInversionsCount,
    beforeRecalculationTotal: Math.round(beforeRecalculationTotal * 100) / 100,
    afterRecalculationTotal: Math.round(afterRecalculationTotal * 100) / 100,
    netFinancialImpact,
    contractsSavedFromLatePenalty,
    itemizedComparisons
  };

  // STEP 4: Build Clarifying Questions Engine for User Guidance & Accuracy
  const clarifyingQuestions: ClarifyingQuestion[] = [];

  // Question 1: Duplicate Entries (if any duplicates or serial collisions detected, or proactively for cleanliness)
  if (duplicatesCount > 0) {
    clarifyingQuestions.push({
      id: 'cq-duplicates',
      category: 'Duplicate Resolution',
      question: `Detected ${duplicatesCount} duplicate asset records in the uploaded spreadsheet. How should duplicate rows be treated?`,
      context: `Multiple entries with identical Asset IDs were found in the uploaded file. Charging a customer twice for the same physical telematics unit will result in an erroneous settlement invoice.`,
      impactOnBilling: `Consolidating duplicates prevents accidental double-billing of unissued renewal invoices.`,
      recommendedAction: `Consolidate duplicates and retain the row with the latest invoiced Billed-To date.`,
      status: 'pending',
      options: [
        {
          id: 'opt-consolidate-latest',
          label: 'Consolidate & Keep Latest Invoiced Date (Recommended)',
          actionValue: 'consolidate',
          financialEffect: 'Prevents double-charging, ensures maximum invoiced credit accuracy'
        },
        {
          id: 'opt-keep-all',
          label: 'Keep All Rows as Independent Units (May Double Charge)',
          actionValue: 'keep-all',
          financialEffect: 'Charges for every row in sheet regardless of ID duplication'
        },
        {
          id: 'opt-discard-duplicates',
          label: 'Discard Subsequent Duplicates Completely',
          actionValue: 'discard',
          financialEffect: 'Only first row per asset ID is counted'
        }
      ]
    });
  }

  // Question 2: Date Inversion (The January Anomaly)
  if (monthDayInversionsCount > 0 || detectedJanuaryAnomaly) {
    clarifyingQuestions.push({
      id: 'cq-date-inversion',
      category: 'Date Chronology',
      question: `Detected month/day inversion ('January Anomaly') on ${monthDayInversionsCount} asset contract dates. Which date format convention is authoritative?`,
      context: `Contract start dates were formatted with day and month reversed (e.g. 09/01/2022 entered for September 1, 2022). Naive US parsing forces all contracts into January, which prematurely triggers false auto-renewal penalties for July 2025 notices.`,
      impactOnBilling: `Financial variance of €${Math.abs(netFinancialImpact).toLocaleString('en-US', { minimumFractionDigits: 2 })} across ${monthDayInversionsCount} affected machinery units.`,
      recommendedAction: `Apply European DD/MM format with 1st-of-month alignment to match Trackunit subscription lifecycle standards.`,
      status: 'pending',
      options: [
        {
          id: 'opt-date-eur-clean',
          label: 'European DD/MM & 1st-of-Month Alignment (Accurate & Recommended)',
          actionValue: 'eur-dd-mm',
          financialEffect: `Saves Beta Industries €${Math.abs(netFinancialImpact).toLocaleString('en-US', { minimumFractionDigits: 2 })} in unwarranted late renewal charges`
        },
        {
          id: 'opt-date-naive-us',
          label: 'Literal US MM/DD Format (Treat all as January starts)',
          actionValue: 'us-mm-dd',
          financialEffect: 'Imposes severe 12-month rollover penalties due to perceived late notice'
        }
      ]
    });
  }

  // Question 3: Trackunit Service Level Agreement (SLA) & Credit Memo
  clarifyingQuestions.push({
    id: 'cq-sla-tier',
    category: 'SLA & Credit Memo',
    question: `Does Beta Industries have an active Trackunit Premium SLA (with 99.8% uptime guarantee & 5% credit memo remedy) or Standard SLA?`,
    context: `According to the official Trackunit SLA (https://trackunit.com/service-level-agreement/), Standard SLA provides high platform availability without credit remedies. Premium SLA includes a 99.8% uptime commitment and a 5% credit memo against monthly license fees for qualifying service availability claims filed within 30 days.`,
    impactOnBilling: `Applying a 5% SLA credit memo reduces total unissued settlement obligations by 5% on eligible recurring fees.`,
    recommendedAction: `Verify whether customer has submitted a valid 30-day availability incident claim before applying credit memo.`,
    status: 'pending',
    options: [
      {
        id: 'opt-sla-standard',
        label: 'Standard SLA — Full Section 2 Obligation (No Credit Memo)',
        actionValue: 'standard',
        financialEffect: 'Full 100% contractual settlement under Section 2 master terms'
      },
      {
        id: 'opt-sla-premium',
        label: 'Premium SLA — Apply 5% Credit Memo Offset (99.8% Uptime Remedy)',
        actionValue: 'premium-5',
        financialEffect: '5% credit memo offset applied across unbilled balance'
      }
    ]
  });

  // Question 4: Contract Term Duration (36 vs 42 Months)
  clarifyingQuestions.push({
    id: 'cq-contract-term',
    category: 'Contract Term Duration',
    question: `Are any equipment units under a 42-month OEM / heavy machinery agreement rather than the standard 36-month initial term?`,
    context: `Trackunit standard fleet terms specify a 36-month initial term. Select OEM-embedded machinery contracts specify an extended 42-month initial term, altering the 3-month notice cutoff deadline accordingly.`,
    impactOnBilling: `Shifting initial term from 36 to 42 months moves contract expiration dates forward by 6 months.`,
    recommendedAction: `Use governing 36-month Initial Term pursuant to Trackunit T&C Section 2 unless OEM rider is uploaded.`,
    status: 'pending',
    options: [
      {
        id: 'opt-term-36',
        label: 'Standard 36-Month Initial Term (Governing T&C Section 2 Standard)',
        actionValue: 36,
        financialEffect: 'Standard baseline contractual calculation'
      },
      {
        id: 'opt-term-42',
        label: '42-Month OEM Heavy Equipment Extended Term',
        actionValue: 42,
        financialEffect: 'Extends initial commitment period by 6 months'
      }
    ]
  });

  // Question 5: Missing Billed-To Invoices (if any)
  if (missingValuesImputedCount > 0) {
    clarifyingQuestions.push({
      id: 'cq-missing-billed',
      category: 'Fee Discrepancy',
      question: `Some uploaded rows lacked a specified 'Billed-To' invoice date. How should unbilled periods be determined?`,
      context: `Missing last-billed dates create ambiguity regarding whether past invoices were paid or remain in arrears.`,
      impactOnBilling: `Imputing the notice date ensures Beta Industries is not erroneously charged for historical months already billed.`,
      recommendedAction: `Impute notice date (${caseNoticeDate}) as conservative last-invoiced milestone.`,
      status: 'pending',
      options: [
        {
          id: 'opt-billed-notice',
          label: 'Assume Billed Up to Cancellation Notice Date (Conservative & Safe)',
          actionValue: 'notice-date',
          financialEffect: 'Charges only for future accelerated unbilled months'
        },
        {
          id: 'opt-billed-start',
          label: 'Assume Unbilled Since Start Date (Full Historical Arrears)',
          actionValue: 'start-date',
          financialEffect: 'Charges for full lifetime of subscription'
        }
      ]
    });
  }

  // Calculate overall data cleaning quality score
  const totalIssues = datesCorrectedCount + duplicatesCount + missingValuesImputedCount + formatNormalizationsCount;
  const cleanScore = rawRows.length > 0 
    ? Math.max(0, Math.round(100 - (criticalErrorsCount * 10 + (totalIssues / (rawRows.length * 5)) * 50)))
    : 100;

  return {
    totalRawRows: rawRows.length,
    cleanedRowsCount: deduplicatedRecords.length,
    duplicatesCount,
    datesCorrectedCount,
    monthDayInversionsCount,
    missingValuesImputedCount,
    formatNormalizationsCount,
    criticalErrorsCount,
    cleaningScore: Math.min(100, Math.max(70, cleanScore)),
    notices,
    cleanedRecords: deduplicatedRecords,
    dateAnalysis,
    clarifyingQuestions
  };
}
