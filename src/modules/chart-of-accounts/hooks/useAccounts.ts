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
          (transactionsData || []) as Transaction[]
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
  }) => {
    try {
      const accountNumber = generateAccountNumber(accounts, accountData.type, accountData.parent_id || null);

      const { data, error: createError } = await supabase
        .from('accounts')
        .insert({
          ...accountData,
          account_number: accountNumber,
        })
        .select()
        .single();

      if (createError) throw createError;
      await fetchAccounts();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
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

