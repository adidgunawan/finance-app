import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReconciliation } from './hooks/useReconciliation';
import { useAccounts } from '../chart-of-accounts/hooks/useAccounts';
import { parseBCACsv } from '../../lib/utils/csvParser';
import { CsvTransactionTable } from './CsvTransactionTable';
import { TransactionMatchModal } from './TransactionMatchModal';
import { FileUpload } from '../../components/Form/FileUpload';
import { Select } from '../../components/Form/Select';
import { useToast } from '../../contexts/ToastContext';
import type { ParsedCsvRow, ReconciliationCsvData, MatchStatus, Account } from '../../lib/types';

export function Reconciliation() {
  const navigate = useNavigate();
  const { showError, showSuccess, showConfirm } = useToast();
  const { accounts, loading: accountsLoading } = useAccounts();
  const {
    sessions,
    currentSession,
    loading: reconciliationLoading,
    createSession,
    loadSession,
    updateSession,
    finalizeSession,
    findMatchingTransactionsForRow,
    linkTransaction,
    markForNewTransaction,
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
  const isManuallyLoadingSession = React.useRef(false);

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
        ? `Invalid file type. Please upload a CSV file. Got: .${fileExtension}` 
        : 'Invalid file. File must have a .csv extension.';
      console.error('File validation failed:', errorMsg);
      showError(errorMsg);
      setCsvFile(null);
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = `File is too large. Maximum size is 10MB. Got: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
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

  // Handle creating new transaction
  const handleCreateNewTransaction = () => {
    if (!selectedRow || !currentSession) return;

    const account = walletAccounts.find((a) => a.id === currentSession.account_id);
    if (!account) return;

    // Pre-fill transaction form based on type
    if (selectedRow.type === 'debit') {
      // Debit = Expense
      const params = new URLSearchParams({
        date: selectedRow.date,
        description: selectedRow.description,
        amount: selectedRow.amount.toString(),
        account_id: account.id,
        from_reconciliation: 'true',
      });
      navigate(`/transactions/expense/new?${params.toString()}`);
    } else {
      // Credit = Income
      const params = new URLSearchParams({
        date: selectedRow.date,
        description: selectedRow.description,
        amount: selectedRow.amount.toString(),
        account_id: account.id,
        from_reconciliation: 'true',
      });
      navigate(`/transactions/income/new?${params.toString()}`);
    }
  };

  // Handle marking for new transaction
  const handleMarkForNewTransaction = async (rowIndex: number) => {
    if (!currentSession) return;

    try {
      setIsProcessing(true);
      await markForNewTransaction(currentSession.id, rowIndex);
      const updatedMatches = new Map(matches);
      updatedMatches.set(rowIndex, 'new');
      setMatches(updatedMatches);
      showSuccess('Marked for new transaction creation');
    } catch (err: any) {
      showError(err.message || 'Failed to mark for new transaction');
    } finally {
      setIsProcessing(false);
    }
  };

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
    return <div>Loading...</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Bank Reconciliation</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Single Row: Wallet Account, Bank Name, Session, Upload */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr', 
          gap: '16px',
          alignItems: 'flex-start'
        }}>
          {/* Wallet Account */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Wallet Account</label>
            <Select
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
                  label: `${acc.account_number} - ${acc.name}`,
                })),
              ]}
            />
          </div>

          {/* Bank Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Bank Name</label>
            <Select
              value={bankName || ''}
              onChange={() => {}}
              disabled={true}
              options={[
                { value: bankName || '', label: bankName || 'No bank set - configure in Chart of Accounts' },
              ]}
            />
          </div>

          {/* Session Selection */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Session</label>
            {sessions.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <Select
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
                  <div style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    pointerEvents: 'none',
                  }}>
                    Loading...
                  </div>
                )}
              </div>
            ) : (
              <Select
                value=""
                onChange={() => {}}
                disabled={true}
                options={[{ value: '', label: 'No sessions' }]}
              />
            )}
          </div>

          {/* CSV Upload */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Upload CSV</label>
            {selectedAccountId && bankName ? (
              <div>
                <FileUpload
                  value={csvFile ? [csvFile] : []}
                  onChange={handleFileUpload}
                  accept=".csv,.CSV,text/csv"
                  multiple={false}
                />
                {isProcessing && (
                  <div style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '11px' }}>
                    Processing...
                  </div>
                )}
                {csvFile && !isProcessing && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {csvFile.name}
                  </div>
                )}
              </div>
            ) : (
              <button 
                type="button"
                disabled 
                style={{ 
                  opacity: 0.5, 
                  cursor: 'not-allowed',
                  padding: '6px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '3px',
                  background: 'var(--bg-secondary)',
                  fontSize: '14px',
                }}
              >
                Choose Files
              </button>
            )}
          </div>
        </div>

        {/* CSV Data Display */}
        {csvData && csvData.rows.length > 0 && (
          <>
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
                CSV Transactions ({csvData.rows.length} rows)
              </h2>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Account: {csvData.metadata.account_name} ({csvData.metadata.account_number}) - {csvData.metadata.currency}
              </div>
              <CsvTransactionTable
                rows={csvData.rows}
                matches={matches}
                onFindTransaction={handleFindTransaction}
              />
            </div>

            {/* Finalize Button */}
            {currentSession && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleFinalize}
                  disabled={isProcessing}
                  className="primary"
                  style={{
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  Finalize Reconciliation
                </button>
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
        onCreateNewTransaction={handleCreateNewTransaction}
      />
    </div>
  );
}

