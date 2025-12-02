import { supabase } from '../supabase';
import type { TransactionType } from '../types';

function formatDateForTransaction(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function generateTransactionNumber(
  type: TransactionType,
  date: Date = new Date()
): Promise<string> {
  const dateStr = formatDateForTransaction(date);
  const prefix = type === 'Income' ? 'INC' : type === 'Expense' ? 'EXP' : 'TRF';
  const datePart = dateStr;

  // Query existing transactions for this date and type
  const { data: existing, error } = await supabase
    .from('transactions')
    .select('transaction_number')
    .eq('type', type)
    .gte('date', dateStr)
    .lte('date', dateStr);

  if (error) {
    console.error('Error fetching transactions:', error);
    return `${prefix}-${datePart}.01`;
  }

  // Extract sequence numbers from existing transactions
  const pattern = new RegExp(`${prefix}-${datePart}\\.(\\d+)`);
  const sequences = existing
    ?.map((t) => {
      const match = t.transaction_number.match(pattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0) || [];

  const nextSequence = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;
  const sequenceStr = nextSequence.toString().padStart(2, '0');

  return `${prefix}-${datePart}.${sequenceStr}`;
}

