export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';
export type TransactionType = 'Income' | 'Expense' | 'Transfer';

export interface Bank {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  account_number: number;
  name: string;
  type: AccountType;
  parent_id: string | null;
  initial_balance?: number;
  initial_balance_date?: string | null;
  is_wallet?: boolean;
  bank_id?: string | null;
  created_at: string;
  updated_at: string;
  balance?: number;
  bank?: Bank;
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

// Reconciliation types
export type ReconciliationStatus = 'draft' | 'finalized';
export type MatchStatus = 'matched' | 'new' | 'pending';

/**
 * @deprecated Use Account.bank_id and Account.bank instead
 * This interface is kept for backward compatibility during migration
 */
export interface BankConfiguration {
  id: string;
  account_id: string;
  bank_name: string;
  created_at: string;
  updated_at: string;
  account?: Account;
}

export interface ParsedCsvRow {
  date: string;
  description: string;
  branch: string;
  amount: number;
  balance: number;
  type: 'debit' | 'credit';
}

export interface CsvMetadata {
  account_number: string;
  account_name: string;
  currency: string;
}

export interface ReconciliationCsvData {
  rows: ParsedCsvRow[];
  metadata: CsvMetadata;
}

export interface ReconciliationSession {
  id: string;
  account_id: string;
  bank_name: string;
  csv_data: ReconciliationCsvData;
  status: ReconciliationStatus;
  created_at: string;
  updated_at: string;
  finalized_at: string | null;
  account?: Account;
}

export interface BankTransactionMatch {
  id: string;
  reconciliation_session_id: string;
  csv_row_index: number;
  transaction_id: string | null;
  match_status: MatchStatus;
  created_at: string;
  transaction?: Transaction;
}

export interface TransactionMatchResult {
  transaction: Transaction;
  confidence: number;
  reason: string;
}

