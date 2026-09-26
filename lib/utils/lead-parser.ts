import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export type ParsedLeadRow = {
  business_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string;
};

export type ParseResult = {
  fileName: string;
  totalDetected: number;
  validRows: ParsedLeadRow[];
  skippedRows: number;
  skippedReason: string;
  previewRows: ParsedLeadRow[];
};

/**
 * Normalizes an arbitrary row object from CSV or Excel (Outscraper or standard)
 * extracting only the required columns with case-insensitive header matching.
 */
function normalizeRow(rawRow: Record<string, any>): ParsedLeadRow | null {
  if (!rawRow || typeof rawRow !== 'object') return null;

  // Build lowercase dictionary of keys for case-insensitive lookup
  const lowerMap: Record<string, any> = {};
  for (const [key, val] of Object.entries(rawRow)) {
    if (key) {
      lowerMap[key.toLowerCase().trim()] = val;
    }
  }

  // 1. business_name: from "name" or "business_name"
  const rawName = lowerMap['business_name'] !== undefined && lowerMap['business_name'] !== ''
    ? lowerMap['business_name']
    : lowerMap['name'];

  const business_name = rawName != null ? String(rawName).trim() : '';

  // Skip any row where business_name is empty
  if (!business_name) {
    return null;
  }

  // 2. phone: from "phone"
  const rawPhone = lowerMap['phone'] != null ? String(lowerMap['phone']).trim() : '';

  // 3. email: from "email" if column exists and non-empty
  const rawEmail = lowerMap['email'] != null ? String(lowerMap['email']).trim() : '';
  const email = rawEmail ? rawEmail : null;

  // 4. address: from "address"
  const rawAddress = lowerMap['address'] != null ? String(lowerMap['address']).trim() : '';
  const address = rawAddress ? rawAddress : null;

  // 5. city: from "city"
  const rawCity = lowerMap['city'] != null ? String(lowerMap['city']).trim() : '';
  const city = rawCity ? rawCity : null;

  // 6. state: from "state_code" if present, otherwise "state"
  const rawStateCode = lowerMap['state_code'] != null ? String(lowerMap['state_code']).trim() : '';
  const rawState = lowerMap['state'] != null ? String(lowerMap['state']).trim() : '';
  const stateVal = rawStateCode || rawState;
  const state = stateVal ? stateVal : null;

  // 7. category: from "category", falling back to "type" if category is empty
  const rawCategory = lowerMap['category'] != null ? String(lowerMap['category']).trim() : '';
  const rawType = lowerMap['type'] != null ? String(lowerMap['type']).trim() : '';
  const categoryVal = rawCategory || rawType || 'General';

  return {
    business_name,
    phone: rawPhone,
    email,
    address,
    city,
    state,
    category: categoryVal,
  };
}

/**
 * Parses raw array of row objects into valid ParsedLeadRows
 */
function processRawRows(fileName: string, rawRows: Record<string, any>[]): ParseResult {
  const totalDetected = rawRows.length;
  const validRows: ParsedLeadRow[] = [];
  let skippedRows = 0;

  for (const raw of rawRows) {
    const mapped = normalizeRow(raw);
    if (mapped) {
      validRows.push(mapped);
    } else {
      skippedRows++;
    }
  }

  return {
    fileName,
    totalDetected,
    validRows,
    skippedRows,
    skippedReason: skippedRows > 0 ? 'missing business name' : '',
    previewRows: validRows.slice(0, 5),
  };
}

/**
 * Parses a File (.xlsx or .csv) in the browser
 */
export async function parseLeadsFile(file: File): Promise<ParseResult> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = XLSX.read(buffer, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          if (!firstSheetName) {
            resolve({
              fileName,
              totalDetected: 0,
              validRows: [],
              skippedRows: 0,
              skippedReason: '',
              previewRows: [],
            });
            return;
          }
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
          });
          resolve(processRawRows(fileName, rawRows));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  } else {
    // Treat as CSV (PapaParse)
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, any>>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: (results) => {
          resolve(processRawRows(fileName, results.data));
        },
        error: (err) => {
          reject(err);
        },
      });
    });
  }
}
