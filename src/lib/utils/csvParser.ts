import type { ParsedCsvRow, CsvMetadata, ReconciliationCsvData } from '../types';

/**
 * Parse BCA bank CSV file format
 * Format:
 * - Header rows: No. Rekening, Nama, Mata Uang
 * - Empty line
 * - Column headers: Tanggal, Keterangan, Cabang, Jumlah, (empty), Saldo
 * - Transaction rows: date in DD/MM format, description, branch, amount, DB/CR, balance
 * - Footer rows: Summary information
 */
export function parseBCACsv(fileContent: string): ReconciliationCsvData {
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let metadata: CsvMetadata = {
    account_number: '',
    account_name: '',
    currency: 'IDR',
  };

  const rows: ParsedCsvRow[] = [];
  let inTransactionSection = false;
  const currentYear = new Date().getFullYear();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Parse header metadata
    if (line.startsWith('No. Rekening')) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        // Remove quotes and = signs
        metadata.account_number = parts[2].replace(/'/g, '').trim();
      }
      continue;
    }

    if (line.startsWith('Nama')) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        metadata.account_name = parts[2].replace(/'/g, '').trim();
      }
      continue;
    }

    if (line.startsWith('Mata Uang')) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        metadata.currency = parts[2].replace(/'/g, '').trim();
      }
      continue;
    }

    // Skip empty lines
    if (!line || line.length === 0) {
      continue;
    }

    // Check if we've reached the transaction headers
    if (line.startsWith('Tanggal,Keterangan,Cabang,Jumlah')) {
      inTransactionSection = true;
      continue;
    }

    // Skip footer rows (summary)
    if (line.startsWith('Saldo Awal') || 
        line.startsWith('Kredit') || 
        line.startsWith('Debet') || 
        line.startsWith('Saldo Akhir')) {
      inTransactionSection = false;
      continue;
    }

    // Parse transaction rows
    if (inTransactionSection) {
      const parsedRow = parseBCATransactionRow(line, currentYear);
      if (parsedRow) {
        rows.push(parsedRow);
      }
    }
  }

  return {
    rows,
    metadata,
  };
}

/**
 * Parse a single BCA transaction row
 * Format: 'DD/MM,Description,Branch,Amount,DB/CR,Balance
 */
function parseBCATransactionRow(line: string, currentYear: number): ParsedCsvRow | null {
  // BCA CSV uses comma separator, but descriptions may contain commas
  // We need to handle this carefully
  
  // Split by comma, but preserve quoted content
  const parts: string[] = [];
  let currentPart = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === "'" && (i === 0 || line[i - 1] === ',')) {
      // Leading quote starts a field
      continue;
    }

    if (char === ',' && !inQuotes) {
      parts.push(currentPart.trim());
      currentPart = '';
      continue;
    }

    currentPart += char;
  }
  
  // Add the last part
  if (currentPart.length > 0) {
    parts.push(currentPart.trim());
  }

  // We expect at least 6 parts: date, description, branch, amount, type, balance
  if (parts.length < 6) {
    return null;
  }

  const [dateStr, description, branch, amountStr, typeStr, balanceStr] = parts;

  // Parse date (format: DD/MM, may have leading quote)
  const cleanDateStr = dateStr.replace(/'/g, '').trim();
  const dateMatch = cleanDateStr.match(/(\d{2})\/(\d{2})/);
  if (!dateMatch) {
    return null;
  }

  const day = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10);
  
  // Create date - use current year, but if month is in the future, assume previous year
  let year = currentYear;
  const now = new Date();
  if (month > now.getMonth() + 1) {
    year = currentYear - 1;
  }

  const date = new Date(year, month - 1, day);
  const formattedDate = date.toISOString().split('T')[0];

  // Parse amount
  const amount = parseFloat(amountStr.replace(/'/g, '').replace(/,/g, '')) || 0;

  // Parse balance
  const balance = parseFloat(balanceStr.replace(/'/g, '').replace(/,/g, '')) || 0;

  // Determine type (DB = debit, CR = credit)
  const type = typeStr.trim().toUpperCase() === 'CR' ? 'credit' : 'debit';

  return {
    date: formattedDate,
    description: description.replace(/'/g, '').trim(),
    branch: branch.replace(/'/g, '').trim(),
    amount,
    balance,
    type,
  };
}

