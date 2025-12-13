import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Account, TransactionItem, TransferCost } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function addDays(date: string | Date, days: number): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

export function generateAccountNumber(
  accounts: Account[],
  type: Account['type'],
  parentId: string | null = null
): number {
  // Get accounts of the same type
  const sameTypeAccounts = accounts.filter((a) => a.type === type);

  if (sameTypeAccounts.length === 0) {
    // First account of this type
    const baseNumbers: Record<Account['type'], number> = {
      Asset: 1000,
      Liability: 2000,
      Equity: 3000,
      Income: 4000,
      Expense: 5000,
    };
    return baseNumbers[type];
  }

  // If parent is specified, find children of that parent
  if (parentId) {
    const parent = accounts.find((a) => a.id === parentId);
    if (parent) {
      // Get all children of this parent (same type)
      const parentChildren = sameTypeAccounts.filter((a) => a.parent_id === parentId);
      
      if (parentChildren.length > 0) {
        // Find the highest child number
        const maxChildNumber = Math.max(...parentChildren.map((a) => a.account_number));
        // Next child should be sequential (parent + 1, parent + 2, etc.)
        // But we need to check if maxChildNumber is already in sequence
        const nextSequential = maxChildNumber + 1;
        
        // Check if next sequential number would conflict with other accounts
        const conflictingAccount = accounts.find((a) => a.account_number === nextSequential);
        if (!conflictingAccount) {
          return nextSequential;
        }
        
        // If conflict, find next available number after max child
        let candidate = maxChildNumber + 1;
        while (accounts.some((a) => a.account_number === candidate)) {
          candidate++;
        }
        return candidate;
      } else {
        // First child of this parent - use parent's number + 1
        const firstChildNumber = parent.account_number + 1;
        
        // Check if this number is already taken
        const conflictingAccount = accounts.find((a) => a.account_number === firstChildNumber);
        if (!conflictingAccount) {
          return firstChildNumber;
        }
        
        // If conflict, find next available number
        let candidate = firstChildNumber;
        while (accounts.some((a) => a.account_number === candidate)) {
          candidate++;
        }
        return candidate;
      }
    }
  }

  // No parent specified - find the highest account number for this type
  const maxNumber = Math.max(...sameTypeAccounts.map((a) => a.account_number));
  
  // Find next available number (increment by 10 for top-level accounts)
  let candidate = maxNumber + 10;
  while (accounts.some((a) => a.account_number === candidate)) {
    candidate += 10;
  }
  return candidate;
}


export function calculateAccountBalance(
  accountId: string,
  transactions: any[],
  account?: Account
): number {
  // Start with initial balance if account has one
  let balance = account?.initial_balance || 0;

  transactions.forEach((transaction) => {
    if (transaction.type === 'Income') {
      // Income increases assets (paid_to_account)
      if (transaction.paid_to_account_id === accountId) {
        balance += transaction.total;
      }
      // Income items increase income accounts
      if (transaction.items) {
        transaction.items.forEach((item: TransactionItem) => {
          if (item.account_id === accountId) {
            balance += item.amount;
          }
        });
      }
    } else if (transaction.type === 'Expense') {
      // Expense decreases assets (paid_from_account)
      if (transaction.paid_from_account_id === accountId) {
        balance -= transaction.total;
      }
      // Expense items increase expense accounts
      if (transaction.items) {
        transaction.items.forEach((item: TransactionItem) => {
          if (item.account_id === accountId) {
            balance += item.amount;
          }
        });
      }
    } else if (transaction.type === 'Transfer') {
      // Transfer: decrease from source, increase to destination
      if (transaction.paid_from_account_id === accountId) {
        balance -= (transaction.amount || transaction.total);
      }
      if (transaction.paid_to_account_id === accountId) {
        balance += (transaction.amount || transaction.total);
      }
      // Transfer costs affect the account
      if (transaction.costs) {
        transaction.costs.forEach((cost: TransferCost) => {
          if (cost.account_id === accountId) {
            balance += cost.amount;
          }
        });
      }
    }
  });

  return balance;
}
