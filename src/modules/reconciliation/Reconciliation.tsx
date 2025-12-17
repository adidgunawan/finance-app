import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearch } from '../../contexts/SearchContext';

import { useReconciliation } from './hooks/useReconciliation';
import { useAccounts } from '../chart-of-accounts/hooks/useAccounts';
import { useContacts } from '../contacts/hooks/useContacts';
import { parseBCACsv } from '../../lib/utils/csvParser';
import { CsvTransactionTable } from './CsvTransactionTable';
import { TransactionMatchModal } from './TransactionMatchModal';
import { FileUpload } from '../../components/Form/FileUpload';
import { PageLoader } from '../../components/Layout/PageLoader';
import { Select } from '../../components/Form/Select';
import { useToast } from '../../contexts/ToastContext';
import type { ParsedCsvRow, ReconciliationCsvData, MatchStatus } from '../../lib/types';
import { Button } from '@/components/ui/button';

export function Reconciliation() {

  const { showError, showSuccess, showConfirm } = useToast();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { contacts } = useContacts();
  const { searchTerm, setSearchTerm } = useSearch();

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);

  const {
    sessions,
    currentSession,
    loading: reconciliationLoading,
    createSession,
    loadSession,
    updateSession,
    finalizeSession,
    deleteSession,
    findMatchingTransactionsForRow,
    linkTransaction,
    loadMatches,
    refreshSessions,
    clearCurrentSession,
  } = useReconciliation();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<ReconciliationCsvData | null>(null);
  const [matches, setMatches] = useState<Map<number, MatchStatus>>(new Map());
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<ParsedCsvRow | null>(null);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isManuallyLoadingSession = useRef(false);

  const walletAccounts = accounts.filter((a) => a.is_wallet === true);

  // Get selected account and bank name from it
  const selectedAccount = useMemo(() => {
    return selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) : null;
  }, [selectedAccountId, accounts]);

  const bankName = selectedAccount?.bank?.name || '';

  // Load matches for a session
  const loadMatchesForSession = React.useCallback(async (sessionId: string) => {
    const loadedMatches = await loadMatches(sessionId);
    const matchMap = new Map<number, MatchStatus>();
    loadedMatches.forEach((match) => {
      matchMap.set(match.csv_row_index, match.match_status);
    });
    setMatches(matchMap);
  }, [loadMatches]);

  // Sync currentSession with csvData - only when session changes externally
  useEffect(() => {
    // Skip sync if we're manually loading a session (to avoid race conditions)
    if (isManuallyLoadingSession.current) {
      return;
    }

    // Only sync if we don't already have csvData set (to avoid overwriting during manual load)
    if (currentSession && currentSession.csv_data && !csvData) {
      setCsvData(currentSession.csv_data);
      loadMatchesForSession(currentSession.id);
    } else if (!currentSession && csvData) {
      // Only clear if session is explicitly cleared
      setCsvData(null);
      setMatches(new Map());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession?.id]); // Only react to session ID changes

  // Load existing draft session when account changes
  useEffect(() => {
    if (!selectedAccountId) {
      setCsvData(null);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      // Load existing draft session for this account
      const accountSession = sessions.find((s) => s.account_id === selectedAccountId);
      if (accountSession) {
        const session = await loadSession(accountSession.id);
        if (cancelled) return;

        if (session && session.csv_data) {
          setCsvData(session.csv_data);
          loadMatchesForSession(session.id);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId]); // Only depend on selectedAccountId


  // Handle CSV file upload
  const handleFileUpload = async (files: File[]) => {
    console.log('handleFileUpload called with files:', files);

    if (files.length === 0) {
      // User removed the file - clear the data
      console.log('No files, clearing data');
      setCsvFile(null);
      setCsvData(null);
      return;
    }

    const file = files[0];
    console.log('Processing file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file extension (case-insensitive)
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    console.log('File extension:', fileExtension);

    if (!fileExtension || fileExtension !== 'csv') {
      const errorMsg = fileExtension
        ? `Invalid file type.Please upload a CSV file.Got: .${fileExtension} `
        : 'Invalid file. File must have a .csv extension.';
      console.error('File validation failed:', errorMsg);
      showError(errorMsg);
      setCsvFile(null);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = `File is too large.Maximum size is 10MB.Got: ${(file.size / 1024 / 1024).toFixed(2)} MB`;
      console.error('File size validation failed:', errorMsg);
      showError(errorMsg);
      setCsvFile(null);
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      console.error('File is empty');
      showError('File is empty. Please select a valid CSV file.');
      setCsvFile(null);
      return;
    }

    if (!selectedAccountId) {
      console.error('No account selected');
      showError('Please select a wallet account first');
      setCsvFile(null);
      return;
    }

    if (!bankName) {
      console.error('No bank name set');
      showError('Please set the bank name for this account in Chart of Accounts first');
      setCsvFile(null);
      return;
    }

    console.log('All validations passed, starting to parse CSV...');

    try {
      setIsProcessing(true);
      const fileContent = await file.text();
      const parsedData = parseBCACsv(fileContent);

      if (parsedData.rows.length === 0) {
        showError('No transactions found in CSV file');
        setIsProcessing(false);
        return;
      }

      // Always display the CSV data first, even if database save fails
      setCsvFile(file);
      setCsvData(parsedData);

      // Try to save to database, but don't fail if tables don't exist
      try {
        let sessionToUse = currentSession || sessions.find((s) => s.account_id === selectedAccountId);

        if (sessionToUse) {
          const updatedSession = await updateSession(sessionToUse.id, {
            csv_data: parsedData,
            bank_name: bankName,
          });
          if (updatedSession) {
            await loadMatchesForSession(updatedSession.id);
            await refreshSessions();
            showSuccess('CSV file uploaded and session updated');
          }
        } else {
          const newSession = await createSession(selectedAccountId, bankName, parsedData);
          if (newSession) {
            await loadMatchesForSession(newSession.id);
            showSuccess('CSV file uploaded and session created');
          }
        }
      } catch (dbError: any) {
        // Database operations failed (likely tables don't exist)
        // Still show the CSV data, but warn the user
        console.warn('Could not save to database. CSV data will not persist:', dbError);
        showError(
          'CSV parsed successfully, but could not save to database. ' +
          'Please run database migrations to enable persistence. ' +
          'The CSV will be displayed but will be lost on page refresh.'
        );
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to parse CSV file';
      console.error('Error in CSV upload process:', err);
      showError(`Error: ${errorMessage}. Please check the console for details.`);
      setCsvFile(null);
      setCsvData(null);
    } finally {
      setIsProcessing(false);
      console.log('CSV upload process completed');
    }
  };

  // Handle Find Transaction button click
  const handleFindTransaction = async (rowIndex: number, row: ParsedCsvRow) => {
    try {
      setSelectedRowIndex(rowIndex);
      setSelectedRow(row);
      const results = findMatchingTransactionsForRow(row, 3);
      setMatchResults(results);
      setShowMatchModal(true);
    } catch (err: any) {
      showError(err.message || 'Failed to find matching transactions');
    }
  };

  // Handle linking to an existing transaction
  const handleLinkTransaction = async (transactionId: string) => {
    if (!currentSession || selectedRowIndex === null) return;

    try {
      setIsProcessing(true);
      await linkTransaction(currentSession.id, selectedRowIndex, transactionId);
      const updatedMatches = new Map(matches);
      updatedMatches.set(selectedRowIndex, 'matched');
      setMatches(updatedMatches);
      showSuccess('Transaction linked successfully');
      setShowMatchModal(false);
    } catch (err: any) {
      showError(err.message || 'Failed to link transaction');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get wallet account for the current session
  const walletAccount = useMemo(() => {
    if (!currentSession) return null;
    return walletAccounts.find((a) => a.id === currentSession.account_id) || null;
  }, [currentSession, walletAccounts]);


  // Handle finalize
  const handleFinalize = () => {
    if (!currentSession) {
      showError('No active session to finalize');
      return;
    }

    showConfirm(
      'Are you sure you want to finalize this reconciliation? The CSV data will be cleared and the session will be marked as finalized.',
      async () => {
        try {
          setIsProcessing(true);
          await finalizeSession(currentSession.id);
          setCsvData(null);
          setMatches(new Map());
          setCsvFile(null);
          showSuccess('Reconciliation finalized successfully');
        } catch (err: any) {
          showError(err.message || 'Failed to finalize reconciliation');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  // Handle delete session
  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = sessions.find((s) => s.id === sessionId);
    const sessionLabel = sessionToDelete
      ? `${sessionToDelete.account?.name || 'Account'} - ${sessionToDelete.account?.bank?.name || sessionToDelete.bank_name || 'Unknown'} (${new Date(sessionToDelete.created_at).toLocaleDateString()})`
      : 'this session';

    showConfirm(
      `Are you sure you want to delete ${sessionLabel}? This action cannot be undone and will also delete all associated transaction matches.`,
      async () => {
        try {
          setIsProcessing(true);
          await deleteSession(sessionId);

          // Clear data if we deleted the current session
          if (currentSession?.id === sessionId) {
            setCsvData(null);
            setMatches(new Map());
            setCsvFile(null);
          }

          showSuccess('Session deleted successfully');
        } catch (err: any) {
          showError(err.message || 'Failed to delete session');
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  // Load existing session
  const handleLoadSession = async (sessionId: string) => {
    try {
      isManuallyLoadingSession.current = true;
      setIsProcessing(true);

      // Find session from existing sessions to get quick data without loading
      const existingSession = sessions.find((s) => s.id === sessionId);
      if (existingSession) {
        // Set account ID (bank name will come from account.bank)
        setSelectedAccountId(existingSession.account_id);
      }

      // Load full session data (with CSV) and matches in parallel
      const [session, matchesData] = await Promise.all([
        loadSession(sessionId),
        loadMatches(sessionId)
      ]);

      if (session) {
        // Batch all CSV data updates together
        if (session.csv_data) {
          setCsvData(session.csv_data);

          const matchMap = new Map<number, MatchStatus>();
          matchesData.forEach((match) => {
            matchMap.set(match.csv_row_index, match.match_status);
          });
          setMatches(matchMap);
        } else {
          setCsvData(null);
          setMatches(new Map());
        }
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
      showError(err.message || 'Failed to load session');
      // Reset on error
      setCsvData(null);
      setMatches(new Map());
    } finally {
      setIsProcessing(false);
      // Allow useEffect to run again after a short delay
      setTimeout(() => {
        isManuallyLoadingSession.current = false;
      }, 100);
    }
  };

  if (accountsLoading || reconciliationLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bank Reconciliation</h1>
        <p className="text-sm text-muted-foreground">
          Match imported bank transactions to existing records.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Single Row: Wallet Account, Bank Name, Session, Upload */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          {/* Wallet Account */}
          <div style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <Select
              label="Wallet Account"
              value={selectedAccountId || ''}
              onChange={(e) => {
                setSelectedAccountId(e.target.value || null);
                setCsvData(null);
                setMatches(new Map());
              }}
              options={[
                { value: '', label: 'Select...' },
                ...walletAccounts.map((acc) => ({
                  value: acc.id,
                  label: `${acc.account_number} - ${acc.name} `,
                })),
              ]}
            />
          </div>

          {/* Bank Name */}
          <div style={{ marginBottom: 0, flex: '1 1 200px' }}>
            <Select
              label="Bank Name"
              value={bankName || ''}
              onChange={() => { }}
              disabled={true}
              options={[
                { value: bankName || '', label: bankName || 'No bank set - configure in Chart of Accounts' },
              ]}
            />
          </div>

          {/* Session Selection */}
          <div style={{ marginBottom: 0, flex: '1 1 200px' }}>
            {sessions.length > 0 ? (
              <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Select
                    label="Session"
                    value={currentSession?.id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        handleLoadSession(value);
                      } else {
                        // Clear session selection - create new session
                        // Clear everything synchronously
                        isManuallyLoadingSession.current = true;
                        clearCurrentSession();
                        setCsvData(null);
                        setMatches(new Map());
                        setCsvFile(null);
                        // Reset flag immediately - state updates will trigger re-render
                        setTimeout(() => {
                          isManuallyLoadingSession.current = false;
                        }, 50);
                      }
                    }}
                    disabled={isProcessing}
                    options={[
                      { value: '', label: 'Create New...' },
                      ...sessions.map((session) => {
                        const bankName = session.account?.bank?.name || session.bank_name || 'Unknown';
                        return {
                          value: session.id,
                          label: `${session.account?.name || 'Account'} - ${bankName} (${new Date(session.created_at).toLocaleDateString()})`,
                        };
                      }),
                    ]}
                  />
                  {isProcessing && (
                    <div
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
                    >
                      Loading...
                    </div>
                  )}
                </div>
                {currentSession && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteSession(currentSession.id)}
                    disabled={isProcessing}
                    title="Delete this session"
                  >
                    Delete
                  </Button>
                )}
              </div>
            ) : (
              <Select
                label="Session"
                value="no-sessions"
                onChange={() => { }}
                disabled={true}
                options={[{ value: 'no-sessions', label: 'No sessions' }]}
              />
            )}
          </div>

          {/* CSV Upload */}
          <div style={{ marginBottom: 0, flex: '1 1 200px' }}>
            {selectedAccountId && bankName ? (
              <div>
                <div className="mb-2 text-sm font-medium">Upload CSV</div>
                <FileUpload
                  value={csvFile ? [csvFile] : []}
                  onChange={handleFileUpload}
                  accept=".csv,.CSV,text/csv"
                  multiple={false}
                />
                {isProcessing && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Processing...
                  </div>
                )}
                {csvFile && !isProcessing && (
                  <div className="mt-1 truncate text-xs text-muted-foreground">
                    {csvFile.name}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium">Upload CSV</div>
                <Button type="button" variant="outline" disabled>
                  Choose Files
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* CSV Data Display */}
        {csvData && csvData.rows.length > 0 && (
          <>
            <div className="mt-6 space-y-3">
              <h2 className="text-lg font-semibold">
                CSV Transactions ({csvData.rows.length} rows)
              </h2>
              <div className="text-sm text-muted-foreground">
                Account: {csvData.metadata.account_name} ({csvData.metadata.account_number}) - {csvData.metadata.currency}
              </div>
              <CsvTransactionTable
                rows={csvData.rows.filter(row => {
                  if (!searchTerm) return true;
                  const term = searchTerm.toLowerCase();
                  return (
                    row.description.toLowerCase().includes(term) ||
                    row.amount.toString().includes(term) ||
                    row.branch.toLowerCase().includes(term)
                  );
                })}
                matches={matches}
                onFindTransaction={handleFindTransaction}
                searchTerm={searchTerm}
              />
            </div>

            {/* Finalize Button */}
            {currentSession && (
              <div className="mt-6 flex justify-end">
                <Button onClick={handleFinalize} disabled={isProcessing}>
                  Finalize Reconciliation
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Match Modal */}
      <TransactionMatchModal
        isOpen={showMatchModal}
        onClose={() => {
          setShowMatchModal(false);
          setSelectedRow(null);
          setSelectedRowIndex(null);
          setMatchResults([]);
        }}
        csvRow={selectedRow}
        matches={matchResults}
        onLinkTransaction={handleLinkTransaction}
        onCreateNewTransaction={() => { }}
        walletAccount={walletAccount}
        accounts={accounts}
        contacts={contacts}
      />
    </div>
  );
}

