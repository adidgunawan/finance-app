import React, { useState, useMemo } from 'react';
import { useAccounts } from './hooks/useAccounts';
import { AccountForm } from './AccountForm';
import { Table, Column } from '../../components/Table/Table';
import type { Account } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

export function ChartOfAccounts() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts;
    const term = searchTerm.toLowerCase();
    return accounts.filter(
      (acc) =>
        acc.name.toLowerCase().includes(term) ||
        acc.account_number.toString().includes(term) ||
        acc.type.toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const handleCreate = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: { name: string; type: Account['type']; parent_id: string | null }) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await createAccount(data);
    }
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleInlineEdit = async (account: Account, field: string, value: any) => {
    try {
      await updateAccount(account.id, { [field]: value });
    } catch (err) {
      console.error('Failed to update account:', err);
    }
  };

  const handleDelete = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete account ${account.account_number} - ${account.name}?`)) {
      try {
        await deleteAccount(account.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete account');
      }
    }
  };

  const columns: Column<Account>[] = [
    {
      key: 'account_number',
      label: 'Number',
      width: '100px',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
    },
    {
      key: 'type',
      label: 'Type',
      width: '120px',
      sortable: true,
    },
    {
      key: 'balance',
      label: 'Balance',
      width: '150px',
      sortable: true,
      render: (value) => (value !== undefined ? formatCurrency(value, 'IDR') : '-'),
    },
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Chart of Accounts</h1>
        {!showForm && (
          <button className="primary" onClick={handleCreate}>
            Add Account
          </button>
        )}
      </div>

      {showForm ? (
        <div style={{ marginBottom: '24px' }}>
          <AccountForm
            account={editingAccount || undefined}
            accounts={accounts}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '100%', width: '100%' }}
            />
          </div>
          <Table
            data={filteredAccounts}
            columns={columns}
            onEdit={handleInlineEdit}
            onDelete={handleDelete}
            emptyMessage="No accounts found. Create your first account to get started."
          />
        </>
      )}
    </div>
  );
}

