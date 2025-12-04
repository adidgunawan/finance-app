import type { Transaction, ParsedCsvRow, TransactionMatchResult } from '../types';

export interface MatchingOptions {
  dateRangeDays?: number; // Default ±3 days
  amountTolerance?: number; // Default 0 (exact match)
  matchDescription?: boolean; // Default false
}

/**
 * Find transactions that match a CSV row based on date and amount
 */
export function findMatchingTransactions(
  csvRow: ParsedCsvRow,
  transactions: Transaction[],
  options: MatchingOptions = {}
): TransactionMatchResult[] {
  const {
    dateRangeDays = 3,
    amountTolerance = 0,
    matchDescription = false,
  } = options;

  const csvDate = new Date(csvRow.date);
  const csvAmount = Math.abs(csvRow.amount);
  const csvType = csvRow.type; // 'debit' or 'credit'

  const matches: TransactionMatchResult[] = [];

  for (const transaction of transactions) {
    const txnDate = new Date(transaction.date);
    const daysDifference = Math.abs((csvDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24));

    // Check date range
    if (daysDifference > dateRangeDays) {
      continue;
    }

    // Check amount match
    const txnAmount = Math.abs(transaction.total);
    const amountDiff = Math.abs(csvAmount - txnAmount);

    if (amountDiff > amountTolerance) {
      continue;
    }

    // Check transaction type compatibility
    // Debit in CSV should match Expense or Transfer (from account)
    // Credit in CSV should match Income or Transfer (to account)
    let typeMatches = false;
    if (csvType === 'debit') {
      // Debit means money going out - should match Expense or Transfer (from)
      typeMatches = transaction.type === 'Expense' || 
                   (transaction.type === 'Transfer' && transaction.paid_from_account_id !== null);
    } else {
      // Credit means money coming in - should match Income or Transfer (to)
      typeMatches = transaction.type === 'Income' || 
                   (transaction.type === 'Transfer' && transaction.paid_to_account_id !== null);
    }

    if (!typeMatches) {
      continue;
    }

    // Calculate confidence score
    let confidence = 100;
    
    // Reduce confidence based on date difference
    confidence -= (daysDifference / dateRangeDays) * 20;
    
    // Reduce confidence based on amount difference
    if (amountTolerance > 0 && amountDiff > 0) {
      confidence -= (amountDiff / amountTolerance) * 10;
    }

    // If description matching is enabled, check similarity
    if (matchDescription && transaction.items && transaction.items.length > 0) {
      const descriptions = transaction.items.map(item => item.description || '').join(' ');
      const similarity = calculateStringSimilarity(
        csvRow.description.toLowerCase(),
        descriptions.toLowerCase()
      );
      confidence += similarity * 20;
    }

    confidence = Math.max(0, Math.min(100, confidence));

    // Build reason string
    const reasons: string[] = [];
    if (daysDifference === 0) {
      reasons.push('Exact date match');
    } else {
      reasons.push(`${daysDifference.toFixed(1)} days difference`);
    }
    
    if (amountDiff === 0) {
      reasons.push('Exact amount match');
    } else if (amountDiff > 0) {
      reasons.push(`Amount diff: ${amountDiff.toFixed(2)}`);
    }

    if (matchDescription) {
      reasons.push('Description similarity considered');
    }

    matches.push({
      transaction,
      confidence: Math.round(confidence),
      reason: reasons.join(', '),
    });
  }

  // Sort by confidence (highest first)
  matches.sort((a, b) => b.confidence - a.confidence);

  return matches;
}

/**
 * Calculate string similarity using simple character overlap
 * Returns a value between 0 and 1
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const words2 = str2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;

  let matches = 0;
  for (const word1 of words1) {
    if (words2.some(word2 => word2.includes(word1) || word1.includes(word2))) {
      matches++;
    }
  }

  return matches / Math.max(words1.length, words2.length);
}


