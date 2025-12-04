import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Bank, Account, Transaction } from '../../../lib/types';
import { calculateAccountBalance } from '../../../lib/utils';

export interface BankWithDetails extends Bank {
  accounts?: Account[];
  totalBalance?: number;
}

export function useBanks() {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all banks
  const loadBanks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('banks')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setBanks(data || []);
    } catch (err: any) {
      setError(err.message);
      setBanks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new bank
  const createBank = useCallback(async (name: string): Promise<Bank> => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: insertError } = await supabase
        .from('banks')
        .insert({ name: name.trim() })
        .select()
        .single();

      if (insertError) throw insertError;
      
      // Refresh banks list
      await loadBanks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBanks]);

  // Update bank
  const updateBank = useCallback(async (id: string, name: string): Promise<Bank> => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: updateError } = await supabase
        .from('banks')
        .update({ name: name.trim() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Refresh banks list
      await loadBanks();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBanks]);

  // Delete bank (with validation)
  const deleteBank = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if any accounts are using this bank
      const { data: accountsUsingBank, error: checkError } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('bank_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (accountsUsingBank && accountsUsingBank.length > 0) {
        throw new Error(
          `Cannot delete bank. It is being used by account: ${accountsUsingBank[0].name}. Please remove the bank from all accounts first.`
        );
      }

      const { error: deleteError } = await supabase
        .from('banks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Refresh banks list
      await loadBanks();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBanks]);

  // Load banks on mount
  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  // Get bank with details (accounts and balances)
  const getBankWithDetails = useCallback(async (bankId: string): Promise<BankWithDetails | null> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get bank
      const { data: bankData, error: bankError } = await supabase
        .from('banks')
        .select('*')
        .eq('id', bankId)
        .single();

      if (bankError) throw bankError;
      if (!bankData) return null;

      // Get accounts connected to this bank
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select(`
          *,
          bank:banks(*)
        `)
        .eq('bank_id', bankId)
        .eq('is_wallet', true)
        .order('account_number', { ascending: true });

      if (accountsError) throw accountsError;

      // Get all transactions for balance calculation
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

      // Calculate total balance
      const totalBalance = accountsWithBalances.reduce((sum, account) => sum + (account.balance || 0), 0);

      return {
        ...bankData,
        accounts: accountsWithBalances,
        totalBalance,
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get all wallet accounts not connected to any bank
  const getAvailableWalletAccounts = useCallback(async (): Promise<Account[]> => {
    try {
      setLoading(true);
      setError(null);
      
      // Get wallets not connected to any bank
      const { data: accountsData, error: accountsError } = await supabase
        .from('accounts')
        .select(`
          *,
          bank:banks(*)
        `)
        .eq('is_wallet', true)
        .is('bank_id', null)
        .order('account_number', { ascending: true });

      if (accountsError) throw accountsError;

      // Get all transactions for balance calculation
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

      return accountsWithBalances;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    banks,
    loading,
    error,
    loadBanks,
    createBank,
    updateBank,
    deleteBank,
    getBankWithDetails,
    getAvailableWalletAccounts,
  };
}


