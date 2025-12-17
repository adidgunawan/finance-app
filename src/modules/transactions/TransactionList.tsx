import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTransactions } from './hooks/useTransactions';
import { useSearch } from '../../contexts/SearchContext';
import { Table, Column } from '../../components/Table/Table';
import { HighlightText } from '../../components/Text/HighlightText';
import { useToast } from '../../contexts/ToastContext';
import { PageLoader } from '../../components/Layout/PageLoader';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function TransactionList() {
  const { transactions, loading, error, deleteTransaction, deleteTransactions } = useTransactions();
  const { showError, showSuccess, showConfirm } = useToast();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useSearch();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
          className="text-primary underline-offset-4 hover:underline"
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
          <div className="flex flex-wrap gap-2">
            {transaction.tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
              >
                {searchTerm && tag.toLowerCase().includes(searchTerm.toLowerCase())
                  ? <HighlightText text={tag} highlight={searchTerm} />
                  : tag}
              </Badge>
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
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(transaction)}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={() => handleDelete(transaction)}>
            Delete
          </Button>
        </div>
      ),
    },
  ], [columns]);

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div className="text-destructive">Error: {error}</div>;
  }

  const handleTransactionTypeSelect = (type: 'Income' | 'Expense' | 'Transfer') => {
    navigate(`/transactions/${type.toLowerCase()}/new`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">
            Browse and manage all transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBatchDelete}>
              Delete Selected ({selectedIds.length})
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Add Transaction</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleTransactionTypeSelect('Income')}>
                Income
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTransactionTypeSelect('Expense')}>
                Expense
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTransactionTypeSelect('Transfer')}>
                Transfer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
            <SelectItem value="Transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
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
      />
    </div>
  );
}

