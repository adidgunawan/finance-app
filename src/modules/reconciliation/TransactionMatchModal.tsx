import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal/Modal';
import type { TransactionMatchResult, ParsedCsvRow } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface TransactionMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvRow: ParsedCsvRow | null;
  matches: TransactionMatchResult[];
  onLinkTransaction: (transactionId: string) => void;
  onCreateNewTransaction: () => void;
}

export function TransactionMatchModal({
  isOpen,
  onClose,
  csvRow,
  matches,
  onLinkTransaction,
  onCreateNewTransaction,
}: TransactionMatchModalProps) {
  const navigate = useNavigate();

  if (!csvRow) return null;

  const handleLinkTransaction = (transactionId: string) => {
    onLinkTransaction(transactionId);
    onClose();
  };

  const handleViewTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4caf50'; // Green
    if (confidence >= 50) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Find Matching Transaction">
      <div>
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>CSV Transaction Details</h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div><strong>Date:</strong> {formatDate(csvRow.date)}</div>
            <div><strong>Description:</strong> {csvRow.description}</div>
            <div><strong>Amount:</strong> {formatCurrency(csvRow.amount, 'IDR')}</div>
            <div><strong>Type:</strong> {csvRow.type.toUpperCase()}</div>
          </div>
        </div>

        {matches.length > 0 ? (
          <>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              Potential Matches ({matches.length})
            </h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {matches.map((match, index) => (
                <div
                  key={match.transaction.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '16px',
                    marginBottom: '12px',
                    backgroundColor: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                        {match.transaction.transaction_number}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {formatDate(match.transaction.date)} • {match.transaction.type}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: '600',
                          backgroundColor: getConfidenceColor(match.confidence),
                          color: 'white',
                        }}
                      >
                        {match.confidence}% match
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    {match.reason}
                  </div>

                  {match.transaction.items && match.transaction.items.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      {match.transaction.items.map((item, idx) => (
                        <div key={idx} style={{ fontSize: '13px', marginBottom: '4px' }}>
                          • {item.account?.name}: {item.description || 'No description'} - {formatCurrency(item.amount, 'IDR')}
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => handleLinkTransaction(match.transaction.id)}
                      style={{
                        flex: 1,
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        background: 'var(--accent)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '0.9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                    >
                      Link to This Transaction
                    </button>
                    <button
                      onClick={() => handleViewTransaction(match.transaction.id)}
                      style={{
                        padding: '8px 16px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                      }}
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: '16px' }}>No matching transactions found.</p>
            <p style={{ fontSize: '13px', marginBottom: '24px' }}>
              You can create a new transaction using the CSV details.
            </p>
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button
            onClick={() => {
              onCreateNewTransaction();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              borderRadius: '4px',
              background: 'var(--success)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Create New Transaction
          </button>
        </div>
      </div>
    </Modal>
  );
}

