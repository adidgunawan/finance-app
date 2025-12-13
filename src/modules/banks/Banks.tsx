import { useState, useMemo, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useSearch } from '../../contexts/SearchContext';
import { useBanks, BankWithDetails } from './hooks/useBanks';
import { useAccounts } from '../chart-of-accounts/hooks/useAccounts';
import { Table, Column } from '../../components/Table/Table';
import { HighlightText } from '../../components/Text/HighlightText';
import { PageLoader } from '../../components/Layout/PageLoader';
import { Input } from '../../components/Form/Input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import type { Bank, Account } from '../../lib/types';

export function Banks() {
  const {
    banks,
    loading,
    error,
    createBank,
    updateBank,
    deleteBank,
    getBankWithDetails,
    getAvailableWalletAccounts,
  } = useBanks();
  const { refresh: refreshAccounts } = useAccounts();
  const { showError, showSuccess, showConfirm } = useToast();
  const { searchTerm, setSearchTerm } = useSearch();
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankWithDetails | null>(null);
  const [formName, setFormName] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isUpdatingWallets, setIsUpdatingWallets] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<Account[]>([]);
  const [selectedWalletToAdd, setSelectedWalletToAdd] = useState<string>('');

  const filteredBanks = useMemo(() => {
    if (!searchTerm) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter((bank) => bank.name.toLowerCase().includes(term));
  }, [banks, searchTerm]);

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);

  // Load bank details when modal opens
  useEffect(() => {
    if (showDetailModal && selectedBank) {
      loadBankDetails(selectedBank.id);
    }
  }, [showDetailModal, selectedBank?.id]);

  const loadBankDetails = async (bankId: string) => {
    try {
      setDetailLoading(true);
      const bankDetails = await getBankWithDetails(bankId);
      if (bankDetails) {
        setSelectedBank(bankDetails);
      }
      // Load available wallets
      const wallets = await getAvailableWalletAccounts();
      setAvailableWallets(wallets);
    } catch (err: any) {
      showError(err.message || 'Failed to load bank details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (bank: Bank) => {
    showConfirm(
      `Are you sure you want to delete ${bank.name}?`,
      async () => {
        try {
          await deleteBank(bank.id);
          showSuccess('Bank deleted successfully');
        } catch (err: any) {
          showError(err.message || 'Failed to delete bank');
        }
      }
    );
  };

  const handleAdd = () => {
    setEditingBank(null);
    setFormName('');
    setShowForm(true);
  };

  const handleEdit = (bank: Bank) => {
    setEditingBank(bank);
    setFormName(bank.name);
    setShowForm(true);
  };

  const handleViewDetails = async (bank: Bank) => {
    setSelectedBank({ ...bank, accounts: [], totalBalance: 0 });
    setShowDetailModal(true);
    await loadBankDetails(bank.id);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showError('Bank name is required');
      return;
    }

    try {
      setFormLoading(true);
      if (editingBank) {
        await updateBank(editingBank.id, formName.trim());
        showSuccess('Bank updated successfully');
      } else {
        await createBank(formName.trim());
        showSuccess('Bank created successfully');
      }
      setShowForm(false);
      setEditingBank(null);
      setFormName('');
    } catch (err: any) {
      showError(err.message || `Failed to ${editingBank ? 'update' : 'create'} bank`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBank(null);
    setFormName('');
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedBank(null);
    setSelectedWalletToAdd('');
    setAvailableWallets([]);
  };

  const handleAddWallet = async () => {
    if (!selectedWalletToAdd || !selectedBank) {
      showError('Please select a wallet account');
      return;
    }

    try {
      setIsUpdatingWallets(true);
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ bank_id: selectedBank.id })
        .eq('id', selectedWalletToAdd);

      if (updateError) throw updateError;

      showSuccess('Wallet added to bank successfully');
      setSelectedWalletToAdd('');
      await loadBankDetails(selectedBank.id);
      await refreshAccounts();
    } catch (err: any) {
      showError(err.message || 'Failed to add wallet to bank');
    } finally {
      setIsUpdatingWallets(false);
    }
  };

  const handleRemoveWallet = async (accountId: string, accountName: string) => {
    showConfirm(
      `Are you sure you want to remove ${accountName} from this bank?`,
      async () => {
        if (!selectedBank) return;

        try {
          setIsUpdatingWallets(true);
          const { error: updateError } = await supabase
            .from('accounts')
            .update({ bank_id: null })
            .eq('id', accountId);

          if (updateError) throw updateError;

          showSuccess('Wallet removed from bank successfully');
          await loadBankDetails(selectedBank.id);
          await refreshAccounts();
        } catch (err: any) {
          showError(err.message || 'Failed to remove wallet from bank');
        } finally {
          setIsUpdatingWallets(false);
        }
      }
    );
  };

  const columns: Column<Bank>[] = [
    {
      key: 'name',
      label: 'Bank Name',
      sortable: true,
      render: (value) => <HighlightText text={value} highlight={searchTerm} />,
    },
  ];

  if (loading) {
    return <PageLoader />;
  }

  if (error && banks.length === 0) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Banks</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="primary" onClick={handleAdd}>
            Add Bank
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
      </div>

      <Table
        data={filteredBanks}
        columns={[
          ...columns,
          {
            key: 'actions',
            label: 'Actions',
            width: '200px',
            render: (_value, bank) => (
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(bank);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bank);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bank);
                  }}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
        emptyMessage="No banks found. Add your first bank account."
      />
      {/* Edit/Create Bank Modal */}
      <Dialog open={showForm} onOpenChange={handleFormCancel}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingBank ? 'Edit Bank' : 'Add Bank'}</DialogTitle>
          </DialogHeader>
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <Input
              label="Bank Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              disabled={formLoading}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleFormCancel} disabled={formLoading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={formLoading}>
              {editingBank ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </DialogContent>
      </Dialog>

      {/* Bank Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={handleDetailModalClose}>
        <DialogContent className="max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{selectedBank ? `${selectedBank.name} - Details` : 'Bank Details'}</DialogTitle>
          </DialogHeader>
        {detailLoading && (!selectedBank || !selectedBank.accounts) ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div className="spinner" style={{ marginBottom: '16px' }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '400' }}>Loading...</div>
          </div>
        ) : selectedBank ? (
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Total Balance */}
            <div style={{
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Total Balance (All Wallets)
              </div>
              <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {formatCurrency(selectedBank.totalBalance || 0, 'IDR')}
              </div>
            </div>

            {/* Connected Accounts Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Connected Wallet Accounts ({selectedBank.accounts?.length || 0})
              </h3>

              {selectedBank.accounts && selectedBank.accounts.length > 0 ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                          Account Number
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600' }}>
                          Name
                        </th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600' }}>
                          Balance
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', width: '100px' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBank.accounts.map((account) => (
                        <tr key={account.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {account.account_number}
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px' }}>
                            {account.name}
                          </td>
                          <td style={{ padding: '12px', fontSize: '13px', textAlign: 'right', fontWeight: '500' }}>
                            {formatCurrency(account.balance || 0, 'IDR')}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <button
                              onClick={() => handleRemoveWallet(account.id, account.name)}
                              disabled={isUpdatingWallets}
                              className="danger"
                              style={{ fontSize: '12px', padding: '4px 8px' }}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-secondary)'
                }}>
                  No wallet accounts connected to this bank
                </div>
              )}
            </div>

            {/* Add Wallet Section */}
            <div style={{
              padding: '16px',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '4px',
              border: '1px solid var(--border-color)'
            }}>
              <h3 style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                Add Wallet Account
              </h3>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      className="form-input"
                      value={selectedWalletToAdd}
                      onChange={(e) => setSelectedWalletToAdd(e.target.value)}
                      disabled={isUpdatingWallets || availableWallets.length === 0}
                    >
                      <option value="">Select wallet account...</option>
                      {availableWallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id}>
                          {wallet.account_number} - {wallet.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleAddWallet}
                    disabled={isUpdatingWallets || !selectedWalletToAdd || availableWallets.length === 0}
                    className="primary"
                    style={{
                      padding: '6px 16px',
                      whiteSpace: 'nowrap',
                      fontSize: '14px'
                    }}
                  >
                    Add Wallet
                  </button>
                </div>
              </div>
              {availableWallets.length === 0 && (
                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  No available wallet accounts to add
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
      </Dialog>
    </div>
  );
}