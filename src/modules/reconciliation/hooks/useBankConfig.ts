import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { BankConfiguration } from '../../../lib/types';

export function useBankConfig() {
  const [configs] = useState<BankConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bank configuration for a specific account
  const loadBankConfig = useCallback(async (accountId: string) => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('bank_configurations')
        .select(`
          *,
          account:accounts(*)
        `)
        .eq('account_id', accountId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is fine
        throw fetchError;
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set or update bank configuration for an account
  const setBankConfig = useCallback(async (accountId: string, bankName: string) => {
    try {
      setLoading(true);

      // Check if config exists
      const { data: existing } = await supabase
        .from('bank_configurations')
        .select('id')
        .eq('account_id', accountId)
        .single();

      if (existing) {
        // Update existing
        const { data, error: updateError } = await supabase
          .from('bank_configurations')
          .update({ bank_name: bankName })
          .eq('account_id', accountId)
          .select(`
            *,
            account:accounts(*)
          `)
          .single();

        if (updateError) throw updateError;
        return data;
      } else {
        // Create new
        const { data, error: insertError } = await supabase
          .from('bank_configurations')
          .insert({
            account_id: accountId,
            bank_name: bankName,
          })
          .select(`
            *,
            account:accounts(*)
          `)
          .single();

        if (insertError) throw insertError;
        return data;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    configs,
    loading,
    error,
    loadBankConfig,
    setBankConfig,
  };
}

