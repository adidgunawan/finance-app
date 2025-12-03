import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Bank } from '../../../lib/types';

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

  return {
    banks,
    loading,
    error,
    loadBanks,
    createBank,
    updateBank,
    deleteBank,
  };
}

