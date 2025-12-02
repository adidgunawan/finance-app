import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactions } from './hooks/useTransactions';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTransaction, deleteTransaction } = useTransactions();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await fetchTransaction(id!);
      setTransaction(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (transaction && window.confirm(`Are you sure you want to delete transaction ${transaction.transaction_number}?`)) {
      try {
        await deleteTransaction(transaction.id);
        navigate('/transactions');
      } catch (err: any) {
        alert(err.message || 'Failed to delete transaction');
      }
    }
  };

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error || !transaction) {
    return (
      <div className="container">
        <div style={{ color: 'var(--error)' }}>Error: {error || 'Transaction not found'}</div>
        <button onClick={() => navigate('/transactions')} style={{ marginTop: '16px' }}>
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Transaction Details</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/transactions')}>Back</button>
          <button className="danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <table style={{ marginBottom: '24px' }}>
          <tbody>
            <tr>
              <td style={{ fontWeight: 600, width: '200px' }}>Transaction Number</td>
              <td>{transaction.transaction_number}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Type</td>
              <td>{transaction.type}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Date</td>
              <td>{formatDate(transaction.date)}</td>
            </tr>
            {transaction.payer && (
              <tr>
                <td style={{ fontWeight: 600 }}>Payer</td>
                <td>{transaction.payer.name}</td>
              </tr>
            )}
            {transaction.payee && (
              <tr>
                <td style={{ fontWeight: 600 }}>Payee</td>
                <td>{transaction.payee.name}</td>
              </tr>
            )}
            {transaction.paid_from_account && (
              <tr>
                <td style={{ fontWeight: 600 }}>Paid From</td>
                <td>
                  {transaction.paid_from_account.account_number} - {transaction.paid_from_account.name}
                </td>
              </tr>
            )}
            {transaction.paid_to_account && (
              <tr>
                <td style={{ fontWeight: 600 }}>Paid To</td>
                <td>
                  {transaction.paid_to_account.account_number} - {transaction.paid_to_account.name}
                </td>
              </tr>
            )}
            {transaction.type === 'Transfer' && transaction.amount !== null && (
              <tr>
                <td style={{ fontWeight: 600 }}>Amount</td>
                <td>{formatCurrency(transaction.amount, transaction.currency)}</td>
              </tr>
            )}
            <tr>
              <td style={{ fontWeight: 600 }}>Total</td>
              <td>{formatCurrency(transaction.total, transaction.currency)}</td>
            </tr>
            {transaction.tags.length > 0 && (
              <tr>
                <td style={{ fontWeight: 600 }}>Tags</td>
                <td>
                  {transaction.tags.map((tag, idx) => (
                    <span key={idx} className="tag" style={{ marginRight: '4px' }}>
                      {tag}
                    </span>
                  ))}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {transaction.items && transaction.items.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Line Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transaction.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.account?.account_number} - {item.account?.name}
                    </td>
                    <td>{item.description || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount, transaction.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>
                    Subtotal:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(
                      transaction.items.reduce((sum, item) => sum + item.amount, 0),
                      transaction.currency
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {transaction.costs && transaction.costs.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Transfer Costs</h3>
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th style={{ width: '150px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transaction.costs.map((cost) => (
                  <tr key={cost.id}>
                    <td>
                      {cost.account?.account_number} - {cost.account?.name}
                    </td>
                    <td>{cost.description || '-'}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(cost.amount, transaction.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {transaction.attachments && transaction.attachments.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Attachments</h3>
            <div>
              {transaction.attachments.map((attachment) => (
                <div key={attachment.id} style={{ marginBottom: '8px' }}>
                  <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                    {attachment.file_name}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

