import { useState, useMemo, useEffect, Fragment } from 'react';
import { useAccounts } from './hooks/useAccounts';
import { useSearch } from '../../contexts/SearchContext';
import { AccountForm } from './AccountForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { PageLoader } from '../../components/Layout/PageLoader';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Account, AccountType } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { HighlightText } from '../../components/Text/HighlightText';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

interface AccountGroup {
  type: AccountType;
  accounts: Account[];
}

export function ChartOfAccounts() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const { showError, showSuccess, showWarning, showConfirm } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const { searchTerm, setSearchTerm } = useSearch();
  const [expandedTypes, setExpandedTypes] = useState<Set<AccountType>>(
    new Set(['Asset', 'Liability', 'Equity', 'Income', 'Expense'])
  );
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [accountsWithTransactions, setAccountsWithTransactions] = useState<Set<string>>(new Set());

  // Check which accounts have linked transactions
  useEffect(() => {
    const checkAccountsWithTransactions = async () => {
      if (accounts.length === 0) return;

      const accountsWithTxns = new Set<string>();

      // Check all accounts in parallel
      const checks = accounts.map(async (account) => {
        // Check transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('id')
          .or(`paid_from_account_id.eq.${account.id},paid_to_account_id.eq.${account.id}`)
          .limit(1);

        // Check transaction items
        const { data: items } = await supabase
          .from('transaction_items')
          .select('id')
          .eq('account_id', account.id)
          .limit(1);

        // Check transfer costs
        const { data: costs } = await supabase
          .from('transfer_costs')
          .select('id')
          .eq('account_id', account.id)
          .limit(1);

        // Check child accounts
        const { data: children } = await supabase
          .from('accounts')
          .select('id')
          .eq('parent_id', account.id)
          .limit(1);

        if (
          (transactions && transactions.length > 0) ||
          (items && items.length > 0) ||
          (costs && costs.length > 0) ||
          (children && children.length > 0)
        ) {
          accountsWithTxns.add(account.id);
        }
      });

      await Promise.all(checks);
      setAccountsWithTransactions(accountsWithTxns);
    };

    checkAccountsWithTransactions();
  }, [accounts]);

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);

  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts;
    const term = searchTerm.toLowerCase();
    const accountsToInclude = new Set<string>();

    // Find all accounts that directly match the search term
    const directlyMatchingAccounts = accounts.filter((acc) => {
      return (
        acc.name.toLowerCase().includes(term) ||
        acc.account_number.toString().includes(term) ||
        acc.type.toLowerCase().includes(term)
      );
    });

    // For each matching account, include it and its parent hierarchy only
    directlyMatchingAccounts.forEach((acc) => {
      accountsToInclude.add(acc.id);

      // Include all ancestors (parents, grandparents, etc.) so we can see the hierarchy
      let currentAccount = acc;
      while (currentAccount.parent_id) {
        const parent = accounts.find((a) => a.id === currentAccount.parent_id);
        if (parent) {
          accountsToInclude.add(parent.id);
          currentAccount = parent;
        } else {
          break;
        }
      }
    });

    // Only return accounts that match or are in the parent hierarchy of matches
    return accounts.filter((acc) => accountsToInclude.has(acc.id));
  }, [accounts, searchTerm]);

  // Organize accounts by type and hierarchy
  const groupedAccounts = useMemo(() => {
    const typeOrder: AccountType[] = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
    const groups: AccountGroup[] = [];

    typeOrder.forEach((type) => {
      const typeAccounts = filteredAccounts.filter((acc) => acc.type === type);
      if (typeAccounts.length > 0) {
        groups.push({ type, accounts: typeAccounts });
      }
    });

    return groups;
  }, [filteredAccounts]);

  // Get parent accounts (accounts with no parent)
  const getParentAccounts = (typeAccounts: Account[]): Account[] => {
    return typeAccounts.filter((acc) => !acc.parent_id);
  };

  // Get child accounts for a parent
  const getChildAccounts = (parentId: string, typeAccounts: Account[]): Account[] => {
    return typeAccounts.filter((acc) => acc.parent_id === parentId);
  };

  // Initialize expanded parents by default - expand ALL accounts (parents and children)
  useEffect(() => {
    if (accounts.length > 0) {
      // Expand all account IDs (both parents and children)
      const allAccountIds = new Set<string>();
      accounts.forEach((acc) => {
        allAccountIds.add(acc.id);
      });
      setExpandedParents(allAccountIds);
    }
  }, [accounts]);

  // Auto-expand parents when searching to show matching children
  useEffect(() => {
    if (searchTerm && filteredAccounts.length > 0) {
      const accountsToExpand = new Set<string>();

      // Find all parent accounts that have matching children
      filteredAccounts.forEach((acc) => {
        if (acc.parent_id) {
          accountsToExpand.add(acc.parent_id);
        }
        // Also expand the account itself if it has children
        const hasChildren = accounts.some((a) => a.parent_id === acc.id);
        if (hasChildren) {
          accountsToExpand.add(acc.id);
        }
      });

      // Expand all necessary parents
      setExpandedParents((prev) => {
        const newExpanded = new Set(prev);
        accountsToExpand.forEach((id) => newExpanded.add(id));
        return newExpanded;
      });
    }
  }, [searchTerm, filteredAccounts, accounts]);


  const toggleTypeExpanded = (type: AccountType) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(type)) {
      newExpanded.delete(type);
    } else {
      newExpanded.add(type);
    }
    setExpandedTypes(newExpanded);
  };

  const toggleParentExpanded = (parentId: string) => {
    const newExpanded = new Set(expandedParents);
    if (newExpanded.has(parentId)) {
      newExpanded.delete(parentId);
    } else {
      newExpanded.add(parentId);
    }
    setExpandedParents(newExpanded);
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    type: Account['type'];
    parent_id: string | null;
    initial_balance?: number;
    initial_balance_date?: string | null;
    is_wallet?: boolean;
    bank_id?: string | null;
  }) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
      setShowEditModal(false);
    } else {
      await createAccount(data);
      setShowForm(false);
    }
    setEditingAccount(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setShowEditModal(false);
    setEditingAccount(null);
  };

  const handleDelete = async (account: Account) => {
    showConfirm(
      `Are you sure you want to delete account ${account.account_number} - ${account.name}?`,
      async () => {
        try {
          await deleteAccount(account.id);
          showSuccess('Account deleted successfully');
        } catch (err: any) {
          if (err.message?.includes('linked transactions')) {
            showWarning('Cannot delete account with linked transactions');
          } else {
            showError(err.message || 'Failed to delete account');
          }
        }
      }
    );
  };



  const renderAccountRow = (account: Account, level: number = 0, typeAccounts: Account[]) => {
    const children = getChildAccounts(account.id, typeAccounts);
    const hasChildren = children.length > 0;
    const isExpanded = expandedParents.has(account.id);
    const indent = level * 24;
    const isParent = level === 0;
    const hasLinkedTransactions = accountsWithTransactions.has(account.id);

    return (
      <Fragment key={account.id}>
        <tr className={cn("bg-background", isParent && "font-medium")}>
          <td className="py-2" style={{ paddingLeft: `${12 + indent}px` }}>
            {hasChildren && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mr-1 h-6 w-6"
                onClick={() => toggleParentExpanded(account.id)}
              >
                {isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            )}
            {!hasChildren && <span className="inline-block w-7" />}
            <span className={cn(isParent && "font-medium")}>
              <HighlightText text={account.account_number.toString()} highlight={searchTerm} />
            </span>
          </td>
          <td>
            <span className={cn(isParent && "font-medium")}>
              <HighlightText text={account.name} highlight={searchTerm} />
            </span>
          </td>
          <td className={cn("text-right", isParent && "font-medium")}>
            {account.balance !== undefined ? formatCurrency(account.balance, 'IDR') : '-'}
          </td>
          <td>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleEdit(account)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(account);
                }}
                disabled={hasLinkedTransactions}
                title={hasLinkedTransactions ? 'Cannot delete account with linked transactions' : 'Delete account'}
              >
                Delete
              </Button>
            </div>
          </td>
        </tr>
        {hasChildren && isExpanded && (
          <>
            {children
              .sort((a, b) => a.account_number - b.account_number)
              .map((child) => renderAccountRow(child, level + 1, typeAccounts))}
          </>
        )}
      </Fragment>
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
          <p className="text-sm text-muted-foreground">Your account hierarchy and balances.</p>
        </div>
        <Button onClick={handleCreate}>Add Account</Button>
      </div>

      {
        groupedAccounts.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No accounts found. Create your first account to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {groupedAccounts.map((group) => {
              const parentAccounts = getParentAccounts(group.accounts);
              const isTypeExpanded = expandedTypes.has(group.type);

              return (
                <div key={group.type} className="rounded-md border">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm font-medium"
                    onClick={() => toggleTypeExpanded(group.type)}
                  >
                    {isTypeExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    <span>{group.type}</span>
                  </button>
                  {isTypeExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="text-muted-foreground">
                          <tr className="border-b">
                            <th className="w-[140px] px-3 py-2 text-left font-medium">Number</th>
                            <th className="px-3 py-2 text-left font-medium">Account Name</th>
                            <th className="w-[160px] px-3 py-2 text-right font-medium">Balance</th>
                            <th className="w-[180px] px-3 py-2 text-left font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="[&_tr:hover]:bg-muted/30">
                          {parentAccounts
                            .sort((a, b) => a.account_number - b.account_number)
                            .map((parent) => renderAccountRow(parent, 0, group.accounts))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      }

      {showForm && (
        <Dialog open={showForm} onOpenChange={handleFormCancel}>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            <AccountForm
              account={undefined}
              accounts={accounts}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      )}

      {showEditModal && editingAccount && (
        <Dialog open={showEditModal} onOpenChange={handleFormCancel}>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit Account</DialogTitle>
            </DialogHeader>
            <AccountForm
              account={editingAccount}
              accounts={accounts}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
      )}
    </div >
  );
}

