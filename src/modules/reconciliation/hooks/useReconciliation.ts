import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  ReconciliationSession,
  ReconciliationCsvData,
  BankTransactionMatch,
  ParsedCsvRow,
} from '../../../lib/types';
import { findMatchingTransactions } from '../../../lib/utils/transactionMatcher';
import { useTransactions } from '../../transactions/hooks/useTransactions';

export function useReconciliation() {
  const [sessions, setSessions] = useState<ReconciliationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ReconciliationSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { transactions } = useTransactions();
  const loadingRef = React.useRef(false);

  // Load all draft sessions
  const loadDraftSessions = useCallback(async () => {
    // Prevent multiple simultaneous requests
    if (loadingRef.current) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('reconciliation_sessions')
        .select(`
          *,
          account:accounts(
            *,
            bank:banks(*)
          )
        `)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (fetchError) {
        // If table doesn't exist, just return empty array instead of error
        if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
          console.warn('Reconciliation sessions table does not exist. Please run migrations.');
          setSessions([]);
          setError(null);
          return;
        }
        // For other errors, log but don't cause infinite loops
        console.error('Error loading draft sessions:', fetchError);
        setSessions([]);
        setError(null); // Don't set error state to avoid triggering re-renders
        return;
      }
      setSessions(data || []);
      setError(null);
    } catch (err: any) {
      // Only log errors, don't set error state to avoid loops
      console.error('Error loading draft sessions:', err);
      setSessions([]);
      setError(null);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  // Load a specific session by ID
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      // Don't set loading here - let the caller handle it to avoid double loading states
      const { data, error: fetchError } = await supabase
        .from('reconciliation_sessions')
        .select(`
          *,
          account:accounts(
            *,
            bank:banks(*)
          )
        `)
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      // Don't load matches here - let the caller handle it for better performance
      // The matches will be loaded separately when needed

      setCurrentSession(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Create a new reconciliation session
  const createSession = useCallback(
    async (accountId: string, bankName: string, csvData: ReconciliationCsvData) => {
      try {
        setLoading(true);
        const { data, error: createError } = await supabase
          .from('reconciliation_sessions')
          .insert({
            account_id: accountId,
            bank_name: bankName,
            csv_data: csvData,
            status: 'draft',
          })
          .select(`
            *,
            account:accounts(
              *,
              bank:banks(*)
            )
          `)
          .single();

        if (createError) throw createError;

        setCurrentSession(data);
        await loadDraftSessions();
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadDraftSessions]
  );

  // Update session CSV data
  const updateSession = useCallback(
    async (sessionId: string, updates: Partial<ReconciliationSession>) => {
      try {
        setLoading(true);
        const { data, error: updateError } = await supabase
          .from('reconciliation_sessions')
          .update(updates)
          .eq('id', sessionId)
          .select(`
            *,
            account:accounts(
              *,
              bank:banks(*)
            )
          `)
          .single();

        if (updateError) throw updateError;

        if (currentSession?.id === sessionId) {
          setCurrentSession(data);
        }
        await loadDraftSessions();
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentSession, loadDraftSessions]
  );

  // Find matching transactions for a CSV row
  const findMatchingTransactionsForRow = useCallback(
    (csvRow: ParsedCsvRow, dateRangeDays: number = 3) => {
      return findMatchingTransactions(csvRow, transactions, {
        dateRangeDays,
        amountTolerance: 0,
        matchDescription: false,
      });
    },
    [transactions]
  );

  // Link a CSV row to an existing transaction
  const linkTransaction = useCallback(
    async (
      sessionId: string,
      csvRowIndex: number,
      transactionId: string
    ) => {
      try {
        setLoading(true);

        // Check if match already exists
        const { data: existing } = await supabase
          .from('bank_transaction_matches')
          .select('id')
          .eq('reconciliation_session_id', sessionId)
          .eq('csv_row_index', csvRowIndex)
          .single();

        if (existing) {
          // Update existing match
          const { error: updateError } = await supabase
            .from('bank_transaction_matches')
            .update({
              transaction_id: transactionId,
              match_status: 'matched',
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          // Create new match
          const { error: insertError } = await supabase
            .from('bank_transaction_matches')
            .insert({
              reconciliation_session_id: sessionId,
              csv_row_index: csvRowIndex,
              transaction_id: transactionId,
              match_status: 'matched',
            });

          if (insertError) throw insertError;
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Mark CSV row for new transaction creation
  const markForNewTransaction = useCallback(
    async (sessionId: string, csvRowIndex: number) => {
      try {
        setLoading(true);

        // Check if match already exists
        const { data: existing } = await supabase
          .from('bank_transaction_matches')
          .select('id')
          .eq('reconciliation_session_id', sessionId)
          .eq('csv_row_index', csvRowIndex)
          .single();

        if (existing) {
          // Update existing match
          const { error: updateError } = await supabase
            .from('bank_transaction_matches')
            .update({
              transaction_id: null,
              match_status: 'new',
            })
            .eq('id', existing.id);

          if (updateError) throw updateError;
        } else {
          // Create new match
          const { error: insertError } = await supabase
            .from('bank_transaction_matches')
            .insert({
              reconciliation_session_id: sessionId,
              csv_row_index: csvRowIndex,
              transaction_id: null,
              match_status: 'new',
            });

          if (insertError) throw insertError;
        }
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Finalize a reconciliation session
  const finalizeSession = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true);
        const { error: updateError } = await supabase
          .from('reconciliation_sessions')
          .update({
            status: 'finalized',
            finalized_at: new Date().toISOString(),
            // Clear CSV data when finalizing
            csv_data: null,
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;

        // Clear current session if it's the one being finalized
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }

        await loadDraftSessions();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentSession, loadDraftSessions]
  );

  // Delete a reconciliation session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        setLoading(true);
        // Delete the session (matches will be deleted automatically due to CASCADE)
        const { error: deleteError } = await supabase
          .from('reconciliation_sessions')
          .delete()
          .eq('id', sessionId);

        if (deleteError) throw deleteError;

        // Clear current session if it's the one being deleted
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
        }

        await loadDraftSessions();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentSession, loadDraftSessions]
  );

  // Load matches for current session
  const loadMatches = useCallback(
    async (sessionId: string): Promise<BankTransactionMatch[]> => {
      try {
        const { data, error: fetchError } = await supabase
          .from('bank_transaction_matches')
          .select(`
            *,
            transaction:transactions(
              *,
              payer:contacts!transactions_payer_id_fkey(*),
              payee:contacts!transactions_payee_id_fkey(*),
              paid_from_account:accounts!transactions_paid_from_account_id_fkey(*),
              paid_to_account:accounts!transactions_paid_to_account_id_fkey(*)
            )
          `)
          .eq('reconciliation_session_id', sessionId);

        if (fetchError) throw fetchError;
        return data || [];
      } catch (err: any) {
        setError(err.message);
        return [];
      }
    },
    []
  );

  // Load initial data on mount only - only load sessions, not transactions
  useEffect(() => {
    loadDraftSessions();
    // Don't refresh transactions on mount - they'll be loaded when needed for matching
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const clearCurrentSession = useCallback(() => {
    setCurrentSession(null);
  }, []);

  return {
    sessions,
    currentSession,
    loading,
    error,
    loadSession,
    createSession,
    updateSession,
    finalizeSession,
    deleteSession,
    findMatchingTransactionsForRow,
    linkTransaction,
    markForNewTransaction,
    loadMatches,
    refreshSessions: loadDraftSessions,
    clearCurrentSession,
  };
}

