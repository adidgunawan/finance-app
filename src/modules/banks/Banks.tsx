import { useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';

import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import type { Bank, Account } from '../../lib/types';
import { Loader2 } from 'lucide-react';

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
    return <div className="text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Banks</h1>
          <p className="text-sm text-muted-foreground">Manage your banks and linked wallet accounts.</p>
        </div>
        <Button onClick={handleAdd}>Add Bank</Button>
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
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(bank);
                  }}
                >
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(bank);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(bank);
                  }}
                >
                  Delete
                </Button>
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
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Bank Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
            disabled={formLoading}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleFormCancel} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={formLoading}>
              {editingBank ? 'Update' : 'Create'}
            </Button>
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
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <div className="text-sm">Loading...</div>
          </div>
        ) : selectedBank ? (
          <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
            {/* Total Balance */}
            <div className="mb-6 rounded-md border bg-muted/40 p-4">
              <div className="mb-1 text-sm text-muted-foreground">
                Total Balance (All Wallets)
              </div>
              <div className="text-2xl font-semibold">
                {formatCurrency(selectedBank.totalBalance || 0, 'IDR')}
              </div>
            </div>

            {/* Connected Accounts Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
                Connected Wallet Accounts ({selectedBank.accounts?.length || 0})
              </h3>

              {selectedBank.accounts && selectedBank.accounts.length > 0 ? (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="px-3 py-2 text-left font-medium">
                          Account Number
                        </th>
                        <th className="px-3 py-2 text-left font-medium">
                          Name
                        </th>
                        <th className="px-3 py-2 text-right font-medium">
                          Balance
                        </th>
                        <th className="w-[120px] px-3 py-2 text-center font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBank.accounts.map((account) => (
                        <tr key={account.id} className="border-t">
                          <td className="px-3 py-2">
                            {account.account_number}
                          </td>
                          <td className="px-3 py-2">
                            {account.name}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatCurrency(account.balance || 0, 'IDR')}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Button
                              type="button"
                              onClick={() => handleRemoveWallet(account.id, account.name)}
                              disabled={isUpdatingWallets}
                              variant="destructive"
                              size="sm"
                            >
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-md border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No wallet accounts connected to this bank
                </div>
              )}
            </div>

            {/* Add Wallet Section */}
            <div className="rounded-md border bg-muted/40 p-4">
              <h3 className="mb-3 text-sm font-semibold">Add Wallet Account</h3>
              <div className="flex gap-2">
                <div className="flex-1">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <Button
                  type="button"
                  onClick={handleAddWallet}
                  disabled={isUpdatingWallets || !selectedWalletToAdd || availableWallets.length === 0}
                >
                  Add Wallet
                </Button>
              </div>
              {availableWallets.length === 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
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