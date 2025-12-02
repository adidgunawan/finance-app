import React, { useState } from 'react';
import { Input } from '../../components/Form/Input';
import { Select } from '../../components/Form/Select';
import type { Account, AccountType } from '../../lib/types';

interface AccountFormProps {
  account?: Account;
  accounts: Account[];
  onSubmit: (data: { name: string; type: AccountType; parent_id: string | null }) => Promise<void>;
  onCancel: () => void;
}

export function AccountForm({ account, accounts, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<AccountType>(account?.type || 'Asset');
  const [parentId, setParentId] = useState(account?.parent_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountTypeOptions: { value: AccountType; label: string }[] = [
    { value: 'Asset', label: 'Asset' },
    { value: 'Liability', label: 'Liability' },
    { value: 'Equity', label: 'Equity' },
    { value: 'Income', label: 'Income' },
    { value: 'Expense', label: 'Expense' },
  ];

  const parentOptions = accounts
    .filter((a) => a.type === type && a.id !== account?.id)
    .map((a) => ({ value: a.id, label: `${a.account_number} - ${a.name}` }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        type,
        parent_id: parentId || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-row">
        <Input
          label="Account Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as AccountType);
            setParentId(''); // Reset parent when type changes
          }}
          options={accountTypeOptions}
          disabled={loading}
        />
        <Select
          label="Parent Account (Optional)"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          options={parentOptions}
          placeholder="None"
          disabled={loading || parentOptions.length === 0}
        />
      </div>
      {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="primary" disabled={loading}>
          {account ? 'Update' : 'Create'} Account
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>
    </form>
  );
}

