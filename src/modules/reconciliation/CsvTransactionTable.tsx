import type { ParsedCsvRow, MatchStatus } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { HighlightText } from '../../components/Text/HighlightText';

interface CsvTransactionTableProps {
  rows: ParsedCsvRow[];
  matches?: Map<number, MatchStatus>; // Map of row index to match status
  onFindTransaction?: (rowIndex: number, row: ParsedCsvRow) => void;
  searchTerm?: string;
}

export function CsvTransactionTable({
  rows,
  matches = new Map(),
  onFindTransaction,
  searchTerm = '',
}: CsvTransactionTableProps) {
  const getMatchStatusBadge = (rowIndex: number) => {
    const status = matches.get(rowIndex);
    if (!status || status === 'pending') {
      return null;
    }

    const styles: Record<MatchStatus, { bg: string; color: string; text: string }> = {
      matched: { bg: '#e8f5e9', color: '#2e7d32', text: 'Matched' },
      new: { bg: '#fff3e0', color: '#e65100', text: 'New Transaction' },
      pending: { bg: 'transparent', color: 'transparent', text: '' },
    };

    const style = styles[status];

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: '3px',
          fontSize: '11px',
          fontWeight: '500',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    );
  };

  if (rows.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
        No CSV transactions to display
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="desktop-only" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Branch</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Balance</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Type</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
            <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--bg-secondary)',
              }}
            >
              <td style={{ padding: '12px' }}>{formatDate(row.date)}</td>
              <td style={{ padding: '12px', maxWidth: '400px' }}>
                <div
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '400px',
                  }}
                  title={row.description}
                >
                  {searchTerm ? <HighlightText text={row.description} highlight={searchTerm} /> : row.description}
                </div>
              </td>
              <td style={{ padding: '12px' }}>
                {searchTerm ? <HighlightText text={row.branch} highlight={searchTerm} /> : row.branch}
              </td>
              <td
                style={{
                  padding: '12px',
                  textAlign: 'right',
                  color: row.type === 'debit' ? 'var(--error)' : 'var(--success)',
                }}
              >
                {searchTerm ? <HighlightText text={formatCurrency(row.amount, 'IDR')} highlight={searchTerm} /> : formatCurrency(row.amount, 'IDR')}
              </td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                {formatCurrency(row.balance, 'IDR')}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: row.type === 'debit' ? '#ffebee' : '#e8f5e9',
                    color: row.type === 'debit' ? '#c62828' : '#2e7d32',
                  }}
                >
                  {row.type.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {getMatchStatusBadge(index)}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {onFindTransaction && (
                  <button
                    onClick={() => onFindTransaction(index, row)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 12px',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Find Transaction
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile Card View */}
      <div className="mobile-only mobile-list">
        {rows.map((row, index) => (
          <div key={index} className="mobile-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{formatDate(row.date)}</span>
              <span
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '500',
                  backgroundColor: row.type === 'debit' ? '#ffebee' : '#e8f5e9',
                  color: row.type === 'debit' ? '#c62828' : '#2e7d32',
                }}
              >
                {row.type.toUpperCase()}
              </span>
            </div>

            <div style={{ marginBottom: '8px', fontSize: '14px', color: 'var(--text-primary)' }}>
              {searchTerm ? <HighlightText text={row.description} highlight={searchTerm} /> : row.description}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {searchTerm ? <HighlightText text={row.branch} highlight={searchTerm} /> : row.branch}
              </span>
              <span style={{ fontWeight: 600, fontSize: '15px', color: row.type === 'debit' ? 'var(--error)' : 'var(--success)' }}>
                {searchTerm ? <HighlightText text={formatCurrency(row.amount, 'IDR')} highlight={searchTerm} /> : formatCurrency(row.amount, 'IDR')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <div>
                {getMatchStatusBadge(index)}
              </div>
              {onFindTransaction && (
                <button
                  onClick={() => onFindTransaction(index, row)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Find Match
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

