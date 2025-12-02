import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Transaction } from '../../../lib/types';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          payer:contacts!transactions_payer_id_fkey(*),
          payee:contacts!transactions_payee_id_fkey(*),
          paid_from_account:accounts!transactions_paid_from_account_id_fkey(*),
          paid_to_account:accounts!transactions_paid_to_account_id_fkey(*)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch items, costs, and attachments for each transaction
      const transactionsWithDetails = await Promise.all(
        (data || []).map(async (transaction) => {
          const [itemsResult, costsResult, attachmentsResult] = await Promise.all([
            supabase
              .from('transaction_items')
              .select('*, account:accounts(*)')
              .eq('transaction_id', transaction.id),
            supabase
              .from('transfer_costs')
              .select('*, account:accounts(*)')
              .eq('transaction_id', transaction.id),
            supabase
              .from('attachments')
              .select('*')
              .eq('transaction_id', transaction.id),
          ]);

          return {
            ...transaction,
            items: itemsResult.data || [],
            costs: costsResult.data || [],
            attachments: attachmentsResult.data || [],
          };
        })
      );

      setTransactions(transactionsWithDetails);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransaction = async (id: string): Promise<Transaction | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`
          *,
          payer:contacts!transactions_payer_id_fkey(*),
          payee:contacts!transactions_payee_id_fkey(*),
          paid_from_account:accounts!transactions_paid_from_account_id_fkey(*),
          paid_to_account:accounts!transactions_paid_to_account_id_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const [itemsResult, costsResult, attachmentsResult] = await Promise.all([
        supabase
          .from('transaction_items')
          .select('*, account:accounts(*)')
          .eq('transaction_id', id),
        supabase
          .from('transfer_costs')
          .select('*, account:accounts(*)')
          .eq('transaction_id', id),
        supabase
          .from('attachments')
          .select('*')
          .eq('transaction_id', id),
      ]);

      return {
        ...data,
        items: itemsResult.data || [],
        costs: costsResult.data || [],
        attachments: attachmentsResult.data || [],
      };
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('transactions').delete().eq('id', id);

      if (deleteError) throw deleteError;
      await fetchTransactions();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    transactions,
    loading,
    error,
    fetchTransaction,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}

