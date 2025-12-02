import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Account, Transaction } from '../../../lib/types';
import { calculateAccountBalance } from '../../../lib/utils';

export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface BalanceSheetData {
  account: Account;
  balance: number;
}

export interface PeriodRange {
  startDate: string;
  endDate: string;
  label: string;
}

export function useBalanceSheet() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      
      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('account_number', { ascending: true });

      if (accountsError) throw accountsError;

      // Always fetch all transactions - we'll filter in getBalanceSheetData
      // This allows comparison mode to work with different date ranges
      const { data: transactionsData, error: txnError } = await supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(*),
          costs:transfer_costs(*)
        `)
        .order('date', { ascending: true });

      if (txnError) throw txnError;

      setAccounts(accountsData || []);
      setTransactions((transactionsData || []) as Transaction[]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching balance sheet data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getBalanceSheetData = (startDate?: string, endDate?: string): BalanceSheetData[] => {
    // For balance sheet, we need cumulative balances up to the end date
    // Filter transactions up to and including the end date
    const filteredTransactions = endDate
      ? transactions.filter(t => {
          const txDate = new Date(t.date);
          const end = new Date(endDate);
          return txDate <= end;
        })
      : transactions;

    return accounts.map((account) => {
      // Check if initial balance should be included
      // Include initial balance if:
      // 1. Account has initial_balance
      // 2. No endDate specified OR initial_balance_date is before/on endDate
      let accountWithInitialBalance = account;
      if (account.initial_balance && account.initial_balance_date) {
        const initialDate = new Date(account.initial_balance_date);
        const end = endDate ? new Date(endDate) : new Date();
        if (initialDate > end) {
          // Initial balance date is after the period, don't include it
          accountWithInitialBalance = { ...account, initial_balance: 0 };
        }
      }

      const balance = calculateAccountBalance(
        account.id,
        filteredTransactions,
        accountWithInitialBalance
      );
      return { account, balance };
    });
  };

  const getPeriodRanges = (periodType: PeriodType, referenceDate: Date = new Date()): PeriodRange[] => {
    const ranges: PeriodRange[] = [];

    if (periodType === 'weekly') {
      // Get last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(referenceDate);
        weekStart.setDate(referenceDate.getDate() - (i * 7) - (referenceDate.getDay() || 7) + 1);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        ranges.push({
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0],
          label: `Week ${i + 1} (${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
        });
      }
    } else if (periodType === 'monthly') {
      // Get last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
        const monthEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        ranges.push({
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0],
          label: monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        });
      }
    } else if (periodType === 'yearly') {
      // Get last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearStart = new Date(referenceDate.getFullYear() - i, 0, 1);
        const yearEnd = new Date(referenceDate.getFullYear() - i, 11, 31);
        yearEnd.setHours(23, 59, 59, 999);

        ranges.push({
          startDate: yearStart.toISOString().split('T')[0],
          endDate: yearEnd.toISOString().split('T')[0],
          label: yearStart.getFullYear().toString(),
        });
      }
    }

    return ranges;
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    accounts,
    transactions,
    loading,
    error,
    fetchData,
    getBalanceSheetData,
    getPeriodRanges,
  };
}

