import type { Account, Transaction, TransactionItem, TransferCost } from './types';

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

  // Find the highest account number for this type
  const maxNumber = Math.max(...sameTypeAccounts.map((a) => a.account_number));

  // If parent is specified, find children of that parent
  if (parentId) {
    const parentChildren = sameTypeAccounts.filter((a) => a.parent_id === parentId);
    if (parentChildren.length > 0) {
      const maxChildNumber = Math.max(...parentChildren.map((a) => a.account_number));
      // Increment by 10
      return maxChildNumber + 10;
    }
    // First child of this parent - use parent's number + 10
    const parent = accounts.find((a) => a.id === parentId);
    if (parent) {
      return parent.account_number + 10;
    }
  }

  // Increment by 10 for new account
  return maxNumber + 10;
}


export function calculateAccountBalance(
  accountId: string,
  transactions: any[]
): number {
  let balance = 0;

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
