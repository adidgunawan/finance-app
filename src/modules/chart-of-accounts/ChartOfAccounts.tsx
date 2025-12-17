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
        <tr
          style={{
            backgroundColor: 'var(--bg-primary)',
            fontWeight: isParent ? '600' : '400',
          }}
        >
          <td style={{ paddingLeft: `${12 + indent}px` }}>
            {hasChildren && (
              <button
                onClick={() => toggleParentExpanded(account.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0 4px',
                  marginRight: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {isExpanded ? '−' : '+'}
              </button>
            )}
            {!hasChildren && <span style={{ marginLeft: '20px' }} />}
            <span style={{ fontWeight: isParent ? '600' : '400' }}>
              <HighlightText text={account.account_number.toString()} highlight={searchTerm} />
            </span>
          </td>
          <td>
            <span style={{ fontWeight: isParent ? '600' : '400' }}>
              <HighlightText text={account.name} highlight={searchTerm} />
            </span>
          </td>
          <td style={{ textAlign: 'right', fontWeight: isParent ? '600' : '400' }}>
            {account.balance !== undefined ? formatCurrency(account.balance, 'IDR') : '-'}
          </td>
          <td>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleEdit(account)}
                style={{ fontSize: '12px', padding: '4px 8px' }}
              >
                Edit
              </button>
              <button
                className="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(account);
                }}
                disabled={hasLinkedTransactions}
                style={{
                  fontSize: '12px',
                  padding: '4px 8px',
                  opacity: hasLinkedTransactions ? 0.5 : 1,
                  cursor: hasLinkedTransactions ? 'not-allowed' : 'pointer',
                }}
                title={hasLinkedTransactions ? 'Cannot delete account with linked transactions' : 'Delete account'}
              >
                Delete
              </button>
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
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Chart of Accounts</h1>
        <button className="primary" onClick={handleCreate}>
          Add Account
        </button>
      </div>

      {
        groupedAccounts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No accounts found. Create your first account to get started.
          </div>
        ) : (
          <div>
            {groupedAccounts.map((group) => {
              const parentAccounts = getParentAccounts(group.accounts);
              const isTypeExpanded = expandedTypes.has(group.type);

              return (
                <div key={group.type} style={{ marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: 'var(--bg-secondary)',
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => toggleTypeExpanded(group.type)}
                  >
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0 4px',
                        marginRight: '8px',
                        fontSize: '14px',
                      }}
                    >
                      {isTypeExpanded ? '−' : '+'}
                    </button>
                    <span>{group.type}</span>
                  </div>
                  {isTypeExpanded && (
                    <table style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '120px', textAlign: 'left' }}>Number</th>
                          <th style={{ textAlign: 'left' }}>Account Name</th>
                          <th style={{ width: '150px', textAlign: 'right' }}>Balance</th>
                          <th style={{ width: '150px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parentAccounts
                          .sort((a, b) => a.account_number - b.account_number)
                          .map((parent) => renderAccountRow(parent, 0, group.accounts))}
                      </tbody>
                    </table>
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

