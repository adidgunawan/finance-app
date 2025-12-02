import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions } from './hooks/useTransactions';
import { Table, Column } from '../../components/Table/Table';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

export function TransactionList() {
  const { transactions, loading, error, deleteTransaction } = useTransactions();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showTransactionMenu, setShowTransactionMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowTransactionMenu(false);
      }
    };

    if (showTransactionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTransactionMenu]);

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

  const handleRowClick = (transaction: Transaction) => {
    navigate(`/transactions/${transaction.id}`);
  };

  const handleDelete = async (transaction: Transaction) => {
    if (window.confirm(`Are you sure you want to delete transaction ${transaction.transaction_number}?`)) {
      try {
        await deleteTransaction(transaction.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete transaction');
      }
    }
  };

  const columns: Column<Transaction>[] = [
    {
      key: 'transaction_number',
      label: 'Number',
      width: '150px',
      sortable: true,
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
    },
    {
      key: 'payer',
      label: 'Payer',
      render: (value) => (value?.name || '-'),
    },
    {
      key: 'payee',
      label: 'Payee',
      render: (value) => (value?.name || '-'),
    },
    {
      key: 'total',
      label: 'Amount',
      width: '150px',
      sortable: true,
      render: (value) => formatCurrency(value, 'IDR'),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  const handleTransactionTypeSelect = (type: 'Income' | 'Expense' | 'Transfer') => {
    setShowTransactionMenu(false);
    navigate(`/transactions/${type.toLowerCase()}/new`);
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
        <div style={{ position: 'relative', display: 'inline-block' }} ref={menuRef}>
          <button className="primary" onClick={() => setShowTransactionMenu(!showTransactionMenu)}>
            Add Transaction
          </button>
          {showTransactionMenu && (
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

      <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: '1', minWidth: '200px' }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="all">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Transfer">Transfer</option>
          </select>
        </div>
      </div>

      <Table
        data={filteredTransactions}
        columns={columns}
        onRowClick={handleRowClick}
        onDelete={handleDelete}
        emptyMessage="No transactions found. Create your first transaction to get started."
      />
    </div>
  );
}

