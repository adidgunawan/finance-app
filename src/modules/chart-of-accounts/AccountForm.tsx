import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '../../components/Form/Input';
import { Select } from '../../components/Form/Select';
import { DateInput } from '../../components/Form/DateInput';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateAccountNumber } from '../../lib/utils';
import { useBanks } from '../banks/hooks/useBanks';
import { useToast } from '../../contexts/ToastContext';
import type { Account, AccountType } from '../../lib/types';

interface AccountFormProps {
  account?: Account;
  accounts: Account[];
  onSubmit: (data: { 
    name: string; 
    type: AccountType; 
    parent_id: string | null;
    initial_balance?: number;
    initial_balance_date?: string | null;
    is_wallet?: boolean;
    bank_id?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function AccountForm({ account, accounts, onSubmit, onCancel }: AccountFormProps) {
  const { banks, createBank } = useBanks();
  const { showError, showSuccess } = useToast();
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState<AccountType>(account?.type || 'Asset');
  const [parentId, setParentId] = useState(account?.parent_id || '');
  const [initialBalance, setInitialBalance] = useState<number>(account?.initial_balance || 0);
  const [initialBalanceDate, setInitialBalanceDate] = useState<string>(
    account?.initial_balance_date || new Date().toISOString().split('T')[0]
  );
  const [isWallet, setIsWallet] = useState<boolean>(account?.is_wallet || false);
  const [bankId, setBankId] = useState<string>(account?.bank_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [creatingBank, setCreatingBank] = useState(false);

  // Reset bank_id when is_wallet is unchecked
  useEffect(() => {
    if (!isWallet) {
      setBankId('');
    }
  }, [isWallet]);

  // Calculate the generated account number based on current selections
  const generatedAccountNumber = useMemo(() => {
    if (account) {
      // If editing, show existing account number
      return account.account_number;
    }
    // If creating new, calculate based on type and parent
    return generateAccountNumber(accounts, type, parentId || null);
  }, [account, accounts, type, parentId]);

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

  const bankOptions = [
    { value: '', label: 'Select Bank...' },
    ...banks.map((bank) => ({ value: bank.id, label: bank.name })),
    { value: '__add_new__', label: '+ Add New Bank' },
  ];

  const handleCreateBank = async () => {
    if (!newBankName.trim()) {
      showError('Bank name is required');
      return;
    }

    try {
      setCreatingBank(true);
      const newBank = await createBank(newBankName.trim());
      setBankId(newBank.id);
      setShowBankModal(false);
      setNewBankName('');
      showSuccess(`Bank "${newBank.name}" created successfully`);
    } catch (err: any) {
      showError(err.message || 'Failed to create bank');
    } finally {
      setCreatingBank(false);
    }
  };

  const handleBankChange = (value: string) => {
    if (value === '__add_new__') {
      setShowBankModal(true);
    } else {
      setBankId(value);
    }
  };

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
        initial_balance: initialBalance,
        initial_balance_date: initialBalanceDate || null,
        is_wallet: isWallet,
        bank_id: isWallet && bankId ? bankId : null,
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
          label="Account Number"
          value={generatedAccountNumber}
          disabled
          style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
        />
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
      <div className="form-row">
        <Input
          label="Initial Balance"
          type="number"
          step="0.01"
          value={initialBalance}
          onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
          disabled={loading}
        />
        <DateInput
          label="Initial Balance Date"
          value={initialBalanceDate}
          onChange={(e) => setInitialBalanceDate(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="form-group">
        <label 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: isWallet ? 'var(--bg-secondary)' : 'transparent',
            border: `1px solid ${isWallet ? 'var(--accent)' : 'var(--border-color)'}`,
            transition: 'all 0.2s',
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = isWallet ? 'var(--bg-hover)' : 'var(--bg-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isWallet ? 'var(--bg-secondary)' : 'transparent';
          }}
        >
          <input
            type="checkbox"
            checked={isWallet}
            onChange={(e) => setIsWallet(e.target.checked)}
            disabled={loading}
            style={{ 
              cursor: loading ? 'not-allowed' : 'pointer',
              width: '18px',
              height: '18px',
              accentColor: 'var(--accent)',
            }}
          />
          <span style={{ 
            fontSize: '14px',
            fontWeight: isWallet ? '500' : '400',
            color: 'var(--text-primary)',
            lineHeight: '1.4',
          }}>
            Wallet Account
            <span style={{ 
              display: 'block',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: '400',
              marginTop: '2px',
            }}>
              Cash, Bank, Credit Card
            </span>
          </span>
        </label>
      </div>
      {isWallet && (
        <div className="form-group">
          <Select
            label="Bank"
            value={bankId}
            onChange={(e) => handleBankChange(e.target.value)}
            options={bankOptions}
            disabled={loading}
          />
        </div>
      )}
      {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" className="primary" disabled={loading}>
          {account ? 'Update' : 'Create'} Account
        </button>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
      </div>

      <Dialog open={showBankModal} onOpenChange={() => {
        setShowBankModal(false);
        setNewBankName('');
      }}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Bank</DialogTitle>
          </DialogHeader>
        <div className="form-group">
          <Input
            label="Bank Name"
            value={newBankName}
            onChange={(e) => setNewBankName(e.target.value)}
            required
            disabled={creatingBank}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateBank();
              }
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => {
              setShowBankModal(false);
              setNewBankName('');
            }}
            disabled={creatingBank}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateBank}
            className="primary"
            disabled={creatingBank || !newBankName.trim()}
          >
            Create Bank
          </button>
        </div>
      </DialogContent>
      </Dialog>
    </form>
  );
}

