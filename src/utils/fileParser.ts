import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { SubscriptionRecord, DataSanitizationReport, SanitizationConfig } from '../types';
import { sanitizeUploadedDataset, DEFAULT_SANITIZATION_CONFIG } from './dataSanitizer';

/**
 * Robust Spreadsheet File Reader & Parser
 * Handles Excel (.xlsx, .xls) and CSV/TSV files with:
 * - Dynamic header row detection (bypasses title/empty rows)
 * - Safe date string parsing (preserves European DD/MM and ISO strings)
 * - Automatic data sanitization & date accuracy verification
 */
export async function parseAndSanitizeSpreadsheetFile(
  file: File,
  config: SanitizationConfig = DEFAULT_SANITIZATION_CONFIG,
  noticeDate: string = '2025-07-31'
): Promise<{
  records: SubscriptionRecord[];
  report: DataSanitizationReport;
  rawCount: number;
  fileName: string;
  rawRows: any[];
  detectedNoticeDate?: string | null;
}> {
  const fileName = file.name;
  const lowerName = fileName.toLowerCase();

  let rawRows: any[] = [];

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read sheet as 2D array of rows
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      raw: false, 
      dateNF: 'yyyy-mm-dd' 
    });

    if (!rawMatrix || rawMatrix.length === 0) {
      throw new Error(`The Excel file '${fileName}' appears to be empty.`);
    }

    // Locate the actual header row (look within first 10 rows for keywords)
    let headerRowIndex = 0;
    const headerKeywords = ['asset', 'id', 'serial', 'start', 'date', 'fee', 'plan', 'device', 'name', 'billed', 'unit'];
    
    for (let i = 0; i < Math.min(rawMatrix.length, 10); i++) {
      const row = rawMatrix[i];
      if (!Array.isArray(row)) continue;
      const matchCount = row.filter(cell => {
        if (!cell) return false;
        const str = String(cell).toLowerCase().replace(/[^a-z]/g, '');
        return headerKeywords.some(kw => str.includes(kw));
      }).length;

      if (matchCount >= 2) {
        headerRowIndex = i;
        break;
      }
    }

    const headers = rawMatrix[headerRowIndex].map((h, idx) => {
      const clean = String(h || '').trim();
      return clean || `Column_${idx + 1}`;
    });

    // Convert subsequent rows into structured objects
    for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
      const row = rawMatrix[r];
      if (!Array.isArray(row) || row.length === 0) continue;
      const rowObj: Record<string, any> = {};
      let hasData = false;

      for (let c = 0; c < headers.length; c++) {
        const val = row[c];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          hasData = true;
          rowObj[headers[c]] = val;
        }
      }

      if (hasData) {
        rawRows.push(rowObj);
      }
    }
  } else {
    // CSV or TSV File
    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false
    });

    if (parsed.errors && parsed.errors.length > 0 && parsed.data.length === 0) {
      throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
    }

    rawRows = parsed.data as any[];
  }

  if (rawRows.length === 0) {
    throw new Error(`No data rows could be extracted from '${fileName}'.`);
  }

  // Run through sanitization and date accuracy validation engine
  const report = sanitizeUploadedDataset(rawRows, config, noticeDate);

  if (!report.cleanedRecords || report.cleanedRecords.length === 0) {
    throw new Error(`No valid subscription or asset records could be sanitized from '${fileName}'. Please check column headers.`);
  }

  let detectedNoticeDate: string | null = null;
  for (const row of rawRows) {
    if (!row || typeof row !== 'object') continue;
    for (const [k, v] of Object.entries(row)) {
      if (/notice.*date|termination.*date/i.test(k) && typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) {
        detectedNoticeDate = v.trim();
        break;
      }
    }
    if (detectedNoticeDate) break;
  }

  return {
    records: report.cleanedRecords,
    report,
    rawCount: rawRows.length,
    fileName,
    rawRows,
    detectedNoticeDate
  };
}
