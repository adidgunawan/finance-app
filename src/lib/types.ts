export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Account {
  id: string;
  account_number: number;
  name: string;
  type: AccountType;
  parent_id: string | null;
  initial_balance?: number;
  initial_balance_date?: string | null;
  created_at: string;
  updated_at: string;
  balance?: number;
}

export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  type: TransactionType;
  date: string;
  tags: string[];
  payer_id: string | null;
  payee_id: string | null;
  paid_from_account_id: string | null;
  paid_to_account_id: string | null;
  currency: string;
  amount: number | null;
  total: number;
  created_at: string;
  updated_at: string;
  payer?: Contact;
  payee?: Contact;
  paid_from_account?: Account;
  paid_to_account?: Account;
  items?: TransactionItem[];
  costs?: TransferCost[];
  attachments?: Attachment[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  account_id: string;
  description: string | null;
  amount: number;
  created_at: string;
  account?: Account;
}

export interface TransferCost {
  id: string;
  transaction_id: string;
  account_id: string;
  description: string | null;
  amount: number;
  created_at: string;
  account?: Account;
}

export interface Attachment {
  id: string;
  transaction_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
}

export interface IncomeFormData {
  transaction_date: string;
  tags: string[];
  payer_id: string | null;
  paid_to_account_id: string | null;
  items: {
    account_id: string;
    description: string;
    amount: number;
  }[];
  attachments: File[];
}

export interface ExpenseFormData {
  transaction_date: string;
  tags: string[];
  payee_id: string | null;
  paid_from_account_id: string | null;
  items: {
    account_id: string;
    description: string;
    amount: number;
  }[];
  attachments: File[];
}

export interface TransferFormData {
  transaction_date: string;
  tags: string[];
  paid_from_account_id: string | null;
  paid_to_account_id: string | null;
  currency: string;
  amount: number;
  costs: {
    account_id: string;
    description: string;
    amount: number;
  }[];
  attachments: File[];
}

