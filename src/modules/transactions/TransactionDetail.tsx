import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransactions } from './hooks/useTransactions';
import { useToast } from '../../contexts/ToastContext';
import { PageLoader } from '../../components/Layout/PageLoader';
import type { Transaction } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchTransaction, deleteTransaction } = useTransactions();
  const { showError, showSuccess, showConfirm } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadTransaction();
    }
  }, [id]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      const data = await fetchTransaction(id!);
      setTransaction(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (transaction) {
      showConfirm(
        `Are you sure you want to delete transaction ${transaction.transaction_number}?`,
        async () => {
          try {
            await deleteTransaction(transaction.id);
            showSuccess('Transaction deleted successfully');
            navigate('/transactions');
          } catch (err: any) {
            showError(err.message || 'Failed to delete transaction');
          }
        }
      );
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error || !transaction) {
    return (
      <div className="space-y-4">
        <div className="text-destructive">
          Error: {error || 'Transaction not found'}
        </div>
        <div>
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            Back to Transactions
          </Button>
        </div>
      </div>
    );
  }

  const itemsSubtotal =
    transaction.items?.reduce((sum, item) => sum + item.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Transaction Details
          </h1>
          <p className="text-sm text-muted-foreground">
            {transaction.transaction_number}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/transactions')}>
            Back
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ShadcnTable>
            <TableBody>
              <TableRow>
                <TableCell className="w-[220px] font-medium">Type</TableCell>
                <TableCell>{transaction.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="w-[220px] font-medium">Date</TableCell>
                <TableCell>{formatDate(transaction.date)}</TableCell>
              </TableRow>
              {transaction.payer ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Payer</TableCell>
                  <TableCell>{transaction.payer.name}</TableCell>
                </TableRow>
              ) : null}
              {transaction.payee ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Payee</TableCell>
                  <TableCell>{transaction.payee.name}</TableCell>
                </TableRow>
              ) : null}
              {transaction.paid_from_account ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Paid From</TableCell>
                  <TableCell>
                    {transaction.paid_from_account.account_number} -{" "}
                    {transaction.paid_from_account.name}
                  </TableCell>
                </TableRow>
              ) : null}
              {transaction.paid_to_account ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Paid To</TableCell>
                  <TableCell>
                    {transaction.paid_to_account.account_number} -{" "}
                    {transaction.paid_to_account.name}
                  </TableCell>
                </TableRow>
              ) : null}
              {transaction.type === 'Transfer' && transaction.amount !== null ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Amount</TableCell>
                  <TableCell>
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </TableCell>
                </TableRow>
              ) : null}
              <TableRow>
                <TableCell className="w-[220px] font-medium">Total</TableCell>
                <TableCell>
                  {formatCurrency(transaction.total, transaction.currency)}
                </TableCell>
              </TableRow>
              {transaction.tags.length > 0 ? (
                <TableRow>
                  <TableCell className="w-[220px] font-medium">Tags</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {transaction.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </ShadcnTable>
        </CardContent>
      </Card>

      {transaction.items && transaction.items.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ShadcnTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[160px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.account?.account_number} - {item.account?.name}
                    </TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.amount, transaction.currency)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(itemsSubtotal, transaction.currency)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </ShadcnTable>
          </CardContent>
        </Card>
      ) : null}

      {transaction.costs && transaction.costs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transfer Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <ShadcnTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[160px]">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      {cost.account?.account_number} - {cost.account?.name}
                    </TableCell>
                    <TableCell>{cost.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cost.amount, transaction.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </ShadcnTable>
          </CardContent>
        </Card>
      ) : null}

      {transaction.attachments && transaction.attachments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attachments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transaction.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-primary underline-offset-4 hover:underline"
                >
                  {attachment.file_name}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

