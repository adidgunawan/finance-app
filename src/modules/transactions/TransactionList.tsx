import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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

  // Close mobile menu when clicking outside (optional, or rely on backdrop)
  useEffect(() => {
    // Backdrop handles closing
  }, [showMobileMenu]);

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
    setShowMobileMenu(false);
    navigate(`/transactions/${type.toLowerCase()}/new`);
  };

  const renderMobileTransactionRow = (transaction: Transaction, index: number, allData: Transaction[]) => {
    const currentDate = new Date(transaction.date);
    const prevDate = index > 0 ? new Date(allData[index - 1].date) : null;

    // Check if we need a date header
    const showHeader = index === 0 ||
      currentDate.getDate() !== prevDate?.getDate() ||
      currentDate.getMonth() !== prevDate?.getMonth() ||
      currentDate.getFullYear() !== prevDate?.getFullYear();

    const dateHeader = currentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }); // e.g., 28 August

    // Get icon/avatar info
    let iconChar = '?';
    let iconColor = 'var(--text-secondary)';
    let iconBg = 'var(--bg-secondary)';

    if (transaction.type === 'Income') {
      iconChar = transaction.payer?.name?.charAt(0).toUpperCase() || '?';
      iconColor = '#1565c0'; // blue
      iconBg = '#e3f2fd';
    } else if (transaction.type === 'Expense') {
      iconChar = transaction.payee?.name?.charAt(0).toUpperCase() || '?';
      iconColor = '#c62828'; // red
      iconBg = '#ffebee';
    } else {
      iconChar = '⇄';
      iconColor = 'var(--text-primary)';
      iconBg = 'var(--bg-secondary)';
    }

    const title = transaction.type === 'Income'
      ? transaction.payer?.name || 'Unknown Payer'
      : transaction.type === 'Expense'
        ? transaction.payee?.name || 'Unknown Payee'
        : `Transfer to ${transaction.paid_to_account?.name}`;

    const time = new Date(transaction.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
      <div style={{ marginBottom: '0' }}>
        {showHeader && (
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
            marginTop: index > 0 ? '16px' : '0',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {dateHeader}
          </div>
        )}

        <div
          onClick={() => navigate(`/transactions/${transaction.id}`)}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '10px 0',
            backgroundColor: 'transparent',
            borderBottom: '1px solid var(--border-color)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {/* Avatar / Icon */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '15px',
            marginRight: '12px',
            flexShrink: 0
          }}>
            {iconChar}
          </div>

          {/* Middle: Title & Subtitle */}
          <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--text-primary)',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              <HighlightText text={title} highlight={searchTerm} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {time}
            </div>
          </div>

          {/* Right: Amount */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              color: transaction.type === 'Expense' ? '#c62828' : transaction.type === 'Income' ? '#2e7d32' : 'var(--text-primary)'
            }}>
              {transaction.type === 'Expense' ? '-' : '+'}
              {formatCurrency(transaction.total, 'IDR')}
            </div>
          </div>
        </div>
      </div>
    );
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

          <div className="desktop-only" style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
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
        mobileRenderer={renderMobileTransactionRow}
      />

      {/* Mobile FAB */}
      <div className="mobile-only">
        {/* Backdrop for mobile menu */}
        {showMobileMenu && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 99,
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setShowMobileMenu(false)}
          />
        )}
        <div style={{
          position: 'fixed',
          bottom: '72px',
          right: '20px',
          zIndex: 100
        }}>
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: '0',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-end',
              minWidth: '120px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTransactionTypeSelect('Transfer');
                }}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'auto'
                }}
              >
                <span>Transfer</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#757575' }}></div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTransactionTypeSelect('Expense');
                }}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'auto'
                }}
              >
                <span>Expense</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c62828' }}></div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTransactionTypeSelect('Income');
                }}
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'auto'
                }}
              >
                <span>Income</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1565c0' }}></div>
              </button>
            </div>
          )}

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(35, 131, 226, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            <FiPlus style={{ transform: showMobileMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>
    </div>
  );
}

