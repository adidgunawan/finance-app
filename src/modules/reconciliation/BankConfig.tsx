import React, { useState, useEffect } from 'react';
import { Select } from '../../components/Form/Select';
import { useBankConfig } from './hooks/useBankConfig';
import { useToast } from '../../contexts/ToastContext';
import type { Account } from '../../lib/types';

interface BankConfigProps {
  accountId: string | null;
  onBankSelected?: (bankName: string) => void;
}

const AVAILABLE_BANKS = ['BCA', 'Mandiri', 'BNI', 'BRI', 'Other'];

export function BankConfig({ accountId, onBankSelected }: BankConfigProps) {
  const { loadBankConfig, setBankConfig, loading } = useBankConfig();
  const { showError, showSuccess } = useToast();
  const [currentBank, setCurrentBank] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (accountId) {
      loadBankConfig(accountId).then((config) => {
        if (config) {
          setCurrentBank(config.bank_name);
          onBankSelected?.(config.bank_name);
        } else {
          setCurrentBank('');
        }
      });
    } else {
      setCurrentBank('');
    }
  }, [accountId, loadBankConfig, onBankSelected]);

  const handleBankChange = async (bankName: string) => {
    if (!accountId) {
      showError('Please select an account first');
      return;
    }

    try {
      setIsLoading(true);
      await setBankConfig(accountId, bankName);
      setCurrentBank(bankName);
      onBankSelected?.(bankName);
      showSuccess(`Bank set to ${bankName}`);
    } catch (err: any) {
      showError(err.message || 'Failed to save bank configuration');
    } finally {
      setIsLoading(false);
    }
  };

  if (!accountId) {
    return (
      <div className="form-group">
        <label className="form-label">Bank Name</label>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Please select a wallet account first
        </div>
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className="form-label">Bank Name</label>
      <Select
        value={currentBank}
        onChange={(e) => handleBankChange(e.target.value)}
        options={[
          { value: '', label: 'Select Bank...' },
          ...AVAILABLE_BANKS.map((bank) => ({ value: bank, label: bank })),
        ]}
        disabled={isLoading || loading}
      />
    </div>
  );
}

