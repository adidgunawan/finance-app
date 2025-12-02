import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Account, Transaction } from '../../../lib/types';
import { generateAccountNumber, calculateAccountBalance } from '../../../lib/utils';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const { data: accountsData, error: fetchError } = await supabase
        .from('accounts')
        .select('*')
        .order('account_number', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch all transactions to calculate balances
      const { data: transactionsData, error: txnError } = await supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(*),
          costs:transfer_costs(*)
        `);

      if (txnError) throw txnError;

      // Calculate balances for each account
      const accountsWithBalances = (accountsData || []).map((account) => {
        const balance = calculateAccountBalance(
          account.id,
          (transactionsData || []) as Transaction[],
          account
        );
        return { ...account, balance };
      });

      setAccounts(accountsWithBalances);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const createAccount = async (accountData: {
    name: string;
    type: Account['type'];
    parent_id?: string | null;
    initial_balance?: number;
    initial_balance_date?: string | null;
    is_wallet?: boolean;
  }) => {
    const maxRetries = 5;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Fetch latest accounts from database to ensure we have current data
        const { data: latestAccounts, error: fetchError } = await supabase
          .from('accounts')
          .select('*')
          .order('account_number', { ascending: true });

        if (fetchError) throw fetchError;

        // Generate account number based on latest data from database
        let accountNumber = generateAccountNumber(
          latestAccounts || [],
          accountData.type,
          accountData.parent_id || null
        );

        // Verify the number doesn't exist (handle race conditions)
        const { data: existingAccounts, error: checkError } = await supabase
          .from('accounts')
          .select('account_number')
          .eq('account_number', accountNumber)
          .limit(1);

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 is "not found" which is fine
          throw checkError;
        }

        // If account number exists, find the next available number
        if (existingAccounts && existingAccounts.length > 0) {
          const sameTypeAccounts = (latestAccounts || []).filter(
            (a) => a.type === accountData.type
          );
          if (sameTypeAccounts.length > 0) {
            const maxNumber = Math.max(...sameTypeAccounts.map((a) => a.account_number));
            accountNumber = maxNumber + 10;
          } else {
            // Fallback: use base number for type
            const baseNumbers: Record<Account['type'], number> = {
              Asset: 1000,
              Liability: 2000,
              Equity: 3000,
              Income: 4000,
              Expense: 5000,
            };
            accountNumber = baseNumbers[accountData.type] + (retryCount + 1) * 10;
          }
        }

        const { data, error: createError } = await supabase
          .from('accounts')
          .insert({
            name: accountData.name,
            type: accountData.type,
            parent_id: accountData.parent_id || null,
            account_number: accountNumber,
            initial_balance: accountData.initial_balance || 0,
            initial_balance_date: accountData.initial_balance_date || null,
            is_wallet: accountData.is_wallet || false,
          })
          .select()
          .single();

        if (createError) {
          // If it's a duplicate key error (PostgreSQL error code 23505) and we haven't exhausted retries, try again
          if (
            (createError.code === '23505' || createError.message?.includes('duplicate key')) &&
            retryCount < maxRetries - 1
          ) {
            retryCount++;
            // Wait a bit before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 50 * (retryCount + 1)));
            continue;
          }
          throw createError;
        }

        await fetchAccounts();
        return data;
      } catch (err: any) {
        // If it's the last retry or not a duplicate key error, throw
        if (
          retryCount >= maxRetries - 1 ||
          (err.code !== '23505' && !err.message?.includes('duplicate key'))
        ) {
          setError(err.message);
          throw err;
        }
        retryCount++;
        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 50 * (retryCount + 1)));
      }
    }

    throw new Error('Failed to create account after multiple attempts');
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAccount = async (id: string) => {
    try {
      // Check if account has linked transactions
      const { data: transactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .or(`paid_from_account_id.eq.${id},paid_to_account_id.eq.${id}`)
        .limit(1);

      if (checkError) throw checkError;

      // Check transaction items
      const { data: items, error: itemsError } = await supabase
        .from('transaction_items')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (itemsError) throw itemsError;

      // Check transfer costs
      const { data: costs, error: costsError } = await supabase
        .from('transfer_costs')
        .select('id')
        .eq('account_id', id)
        .limit(1);

      if (costsError) throw costsError;

      if (transactions && transactions.length > 0) {
        throw new Error('Cannot delete account with linked transactions');
      }

      if (items && items.length > 0) {
        throw new Error('Cannot delete account with linked transaction items');
      }

      if (costs && costs.length > 0) {
        throw new Error('Cannot delete account with linked transfer costs');
      }

      // Check for child accounts
      const { data: children, error: childrenError } = await supabase
        .from('accounts')
        .select('id')
        .eq('parent_id', id)
        .limit(1);

      if (childrenError) throw childrenError;

      if (children && children.length > 0) {
        throw new Error('Cannot delete account with child accounts');
      }

      const { error: deleteError } = await supabase.from('accounts').delete().eq('id', id);

      if (deleteError) throw deleteError;
      await fetchAccounts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    refresh: fetchAccounts,
  };
}

