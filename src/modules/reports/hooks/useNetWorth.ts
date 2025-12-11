import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Account, Transaction } from '../../../lib/types';
import { calculateAccountBalance } from '../../../lib/utils';
import type { PeriodType, PeriodRange } from './useBalanceSheet';

export interface NetWorthDataPoint {
  date: string;
  label: string;
  netWorth: number;
}

export function useNetWorth() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .order('account_number', { ascending: true });

      if (accountsError) throw accountsError;

      // Fetch all transactions
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
      console.error('Error fetching net worth data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodRanges = useCallback((periodType: PeriodType, referenceDate: Date = new Date()): PeriodRange[] => {
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
  }, []);

  const getNetWorthData = useCallback((periodType: PeriodType): NetWorthDataPoint[] => {
    const periodRanges = getPeriodRanges(periodType);
    const dataPoints: NetWorthDataPoint[] = [];

    periodRanges.forEach((period) => {
      // Filter transactions up to and including the period end date
      const filteredTransactions = transactions.filter((t) => {
        const txDate = new Date(t.date);
        const end = new Date(period.endDate);
        return txDate <= end;
      });

      // Calculate total Assets
      const assetAccounts = accounts.filter((acc) => acc.type === 'Asset');
      let totalAssets = 0;
      assetAccounts.forEach((account) => {
        // Check if initial balance should be included
        let accountWithInitialBalance = account;
        if (account.initial_balance && account.initial_balance_date) {
          const initialDate = new Date(account.initial_balance_date);
          const end = new Date(period.endDate);
          if (initialDate > end) {
            accountWithInitialBalance = { ...account, initial_balance: 0 };
          }
        }

        const balance = calculateAccountBalance(
          account.id,
          filteredTransactions,
          accountWithInitialBalance
        );
        totalAssets += balance;
      });

      // Calculate total Liabilities
      const liabilityAccounts = accounts.filter((acc) => acc.type === 'Liability');
      let totalLiabilities = 0;
      liabilityAccounts.forEach((account) => {
        // Check if initial balance should be included
        let accountWithInitialBalance = account;
        if (account.initial_balance && account.initial_balance_date) {
          const initialDate = new Date(account.initial_balance_date);
          const end = new Date(period.endDate);
          if (initialDate > end) {
            accountWithInitialBalance = { ...account, initial_balance: 0 };
          }
        }

        const balance = calculateAccountBalance(
          account.id,
          filteredTransactions,
          accountWithInitialBalance
        );
        totalLiabilities += balance;
      });

      // Net Worth = Assets - Liabilities
      const netWorth = totalAssets - totalLiabilities;

      dataPoints.push({
        date: period.endDate,
        label: period.label,
        netWorth,
      });
    });

    return dataPoints;
  }, [accounts, transactions, getPeriodRanges]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    accounts,
    transactions,
    loading,
    error,
    fetchData,
    getNetWorthData,
    getPeriodRanges,
  };
}

