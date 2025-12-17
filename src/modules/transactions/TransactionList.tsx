import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTransactions } from './hooks/useTransactions';
import { useSearch } from '../../contexts/SearchContext';
import { Table, Column } from '../../components/Table/Table';
import { HighlightText } from '../../components/Text/HighlightText';
import { useToast } from '../../contexts/ToastContext';
import { PageLoader } from '../../components/Layout/PageLoader';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

export function TransactionList() {
  const { transactions, loading, error, deleteTransaction, deleteTransactions } = useTransactions();
  const { showError, showSuccess, showConfirm } = useToast();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close desktop menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowDesktopMenu(false);
      }
    };

    if (showDesktopMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDesktopMenu]);

  // Clear selection when transactions change or filters change
  useEffect(() => {
    setSelectedIds([]);
  }, [transactions, typeFilter, searchTerm]);

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transaction_number.toLowerCase().includes(term) ||
          t.payer?.name.toLowerCase().includes(term) ||
          t.payee?.name.toLowerCase().includes(term) ||
          t.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [transactions, searchTerm, typeFilter]);


  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.type.toLowerCase()}/edit/${transaction.id}`);
  };

  const handleDelete = async (transaction: Transaction) => {
    showConfirm(
      `Are you sure you want to delete transaction ${transaction.transaction_number}?`,
      async () => {
        try {
          await deleteTransaction(transaction.id);
          showSuccess('Transaction deleted successfully');
        } catch (err: any) {
          showError(err.message || 'Failed to delete transaction');
        }
      }
    );
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    showConfirm(
      `Are you sure you want to delete ${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''}?`,
      async () => {
        try {
          await deleteTransactions(selectedIds);
          setSelectedIds([]);
          showSuccess(`${selectedIds.length} transaction${selectedIds.length > 1 ? 's' : ''} deleted successfully`);
        } catch (err: any) {
          showError(err.message || 'Failed to delete transactions');
        }
      }
    );
  };



  const columns: Column<Transaction>[] = useMemo(() => [
    {
      key: 'transaction_number',
      label: 'Number',
      width: '150px',
      sortable: true,
      render: (value, transaction) => (
        <Link
          to={`/transactions/${transaction.id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            color: 'var(--accent)',
            textDecoration: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.textDecoration = 'none';
          }}
        >
          <HighlightText text={value} highlight={searchTerm} />
        </Link>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      width: '120px',
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: 'type',
      label: 'Type',
      width: '100px',
      sortable: true,
      render: (value) => <HighlightText text={value} highlight={searchTerm} />,
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (_value, transaction) => {
        const contact = transaction.type === 'Income' ? transaction.payer : transaction.payee;
        const displayValue = contact?.name || '-';
        return searchTerm && displayValue !== '-' ? <HighlightText text={displayValue} highlight={searchTerm} /> : displayValue;
      },
    },
    {
      key: 'details',
      label: 'Details',
      render: (_value, transaction) => {
        const parts: string[] = [];

        if (transaction.type === 'Income' && transaction.paid_to_account) {
          parts.push(`To: ${transaction.paid_to_account.account_number} - ${transaction.paid_to_account.name}`);
        } else if (transaction.type === 'Expense' && transaction.paid_from_account) {
          parts.push(`From: ${transaction.paid_from_account.account_number} - ${transaction.paid_from_account.name}`);
        } else if (transaction.type === 'Transfer') {
          if (transaction.paid_from_account) {
            parts.push(`From: ${transaction.paid_from_account.account_number} - ${transaction.paid_from_account.name}`);
          }
          if (transaction.paid_to_account) {
            parts.push(`To: ${transaction.paid_to_account.account_number} - ${transaction.paid_to_account.name}`);
          }
        }

        if (transaction.items && transaction.items.length > 0) {
          parts.push(`${transaction.items.length} item${transaction.items.length > 1 ? 's' : ''}`);
        }

        return parts.length > 0 ? parts.join(' | ') : '-';
      },
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (_value, transaction) => {
        if (!transaction.tags || transaction.tags.length === 0) {
          return '-';
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {transaction.tags.map((tag, index) => (
              <span
                key={index}
                className="tag"
                style={{
                  fontSize: '12px',
                  padding: '2px 6px',
                }}
              >
                {searchTerm && tag.toLowerCase().includes(searchTerm.toLowerCase())
                  ? <HighlightText text={tag} highlight={searchTerm} />
                  : tag}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: 'total',
      label: 'Amount',
      width: '150px',
      sortable: true,
      render: (value) => formatCurrency(value, 'IDR'),
    },
  ], [searchTerm]);

  const columnsWithActions: Column<Transaction>[] = useMemo(() => [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      render: (_value, transaction) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleEdit(transaction)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Edit
          </button>
          <button
            className="danger"
            onClick={() => handleDelete(transaction)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ], [columns]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  const handleTransactionTypeSelect = (type: 'Income' | 'Expense' | 'Transfer') => {
    setShowDesktopMenu(false);
    navigate(`/transactions/${type.toLowerCase()}/new`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>

        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedIds.length > 0 && (
            <button
              className="danger"
              onClick={handleBatchDelete}
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}

          <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
            <button className="primary" onClick={() => setShowDesktopMenu(!showDesktopMenu)}>
              Add Transaction
            </button>
            {showDesktopMenu && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '3px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  minWidth: '150px',
                }}
              >
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => handleTransactionTypeSelect('Income')}
                >
                  Income
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => handleTransactionTypeSelect('Expense')}
                >
                  Expense
                </button>
                <button
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => handleTransactionTypeSelect('Transfer')}
                >
                  Transfer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: '160px', fontSize: '13px' }}
        >
          <option value="all">All Types</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
          <option value="Transfer">Transfer</option>
        </select>
      </div>

      <Table
        data={filteredTransactions}
        columns={columnsWithActions}
        onRowClick={undefined}
        onDelete={undefined}
        emptyMessage="No transactions found. Create your first transaction to get started."
        selectable={true}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
      />
    </div>
  );
}

