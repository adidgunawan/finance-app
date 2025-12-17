import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { generateTransactionNumber } from '../../lib/utils/transactionNumber';
import { DateInput } from '../../components/Form/DateInput';
import { Select } from '../../components/Form/Select';
import { TagInput } from '../../components/Form/TagInput';
import { FileUpload } from '../../components/Form/FileUpload';
import { Input } from '../../components/Form/Input';
import { useToast } from '../../contexts/ToastContext';
import type { TransferFormData, Account } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { Loader2 } from 'lucide-react';
import { Input as ShadcnInput } from '@/components/ui/input';
import {
  Table as ShadcnTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function TransferForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);

  const [formData, setFormData] = useState<TransferFormData>({
    transaction_date: new Date().toISOString().split('T')[0],
    tags: [],
    paid_from_account_id: null,
    paid_to_account_id: null,
    currency: 'IDR',
    amount: 0,
    costs: [],
    attachments: [],
  });

  useEffect(() => {
    const loadData = async () => {
      const { data: accountsData } = await supabase.from('accounts').select('*').order('account_number');

      if (accountsData) {
        setAccounts(accountsData);
        setCashAccounts(accountsData.filter((a) => a.is_wallet === true));
      }
    };

    loadData();
  }, []);

  // Load transaction data when editing
  useEffect(() => {
    if (isEditing && id) {
      const loadTransaction = async () => {
        try {
          setLoading(true);
          const { data: transaction, error: txnError } = await supabase
            .from('transactions')
            .select('*, costs:transfer_costs(*)')
            .eq('id', id)
            .single();

          if (txnError) throw txnError;

          setTransactionNumber(transaction.transaction_number);
          setFormData({
            transaction_date: transaction.date,
            tags: transaction.tags || [],
            paid_from_account_id: transaction.paid_from_account_id,
            paid_to_account_id: transaction.paid_to_account_id,
            currency: transaction.currency,
            amount: transaction.amount || 0,
            costs: transaction.costs?.map((cost: any) => ({
              account_id: cost.account_id,
              description: cost.description || '',
              amount: cost.amount,
            })) || [],
            attachments: [],
          });
        } catch (err: any) {
          setError(err.message || 'Failed to load transaction');
        } finally {
          setLoading(false);
        }
      };

      loadTransaction();
    }
  }, [isEditing, id]);

  // Generate transaction number when date changes (only for new transactions)
  useEffect(() => {
    if (!isEditing) {
      const generateNumber = async () => {
        const date = new Date(formData.transaction_date);
        const txnNum = await generateTransactionNumber('Transfer', date);
        setTransactionNumber(txnNum);
      };

      generateNumber();
    }
  }, [formData.transaction_date, isEditing]);

  const total = formData.amount + formData.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  const handleCostChange = (index: number, field: string, value: any) => {
    const newCosts = [...formData.costs];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setFormData({ ...formData, costs: newCosts });
  };

  const handleAddCost = () => {
    setFormData({
      ...formData,
      costs: [...formData.costs, { account_id: '', description: '', amount: 0 }],
    });
  };

  const handleRemoveCost = (index: number) => {
    setFormData({
      ...formData,
      costs: formData.costs.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.paid_from_account_id || !formData.paid_to_account_id) {
      showError('Both Paid From and Paid To accounts are required');
      return;
    }

    if (formData.paid_from_account_id === formData.paid_to_account_id) {
      showError('Paid From and Paid To accounts must be different');
      return;
    }

    if (formData.amount <= 0) {
      showError('Amount must be greater than 0');
      return;
    }

    try {
      setLoading(true);

      let transaction: { id: string } | undefined;

      if (isEditing && id) {
        // Update transaction
        const { data: updatedTransaction, error: txnError } = await supabase
          .from('transactions')
          .update({
            date: formData.transaction_date,
            tags: formData.tags,
            paid_from_account_id: formData.paid_from_account_id,
            paid_to_account_id: formData.paid_to_account_id,
            currency: formData.currency,
            amount: formData.amount,
            total: total,
          })
          .eq('id', id)
          .select()
          .single();

        if (txnError) throw txnError;
        transaction = updatedTransaction;

        // Delete existing costs and create new ones
        await supabase.from('transfer_costs').delete().eq('transaction_id', id);

        if (formData.costs.length > 0) {
          const { error: costsError } = await supabase.from('transfer_costs').insert(
            formData.costs.map((cost) => ({
              transaction_id: id,
              account_id: cost.account_id,
              description: cost.description,
              amount: cost.amount,
            }))
          );

          if (costsError) throw costsError;
        }
      } else {
        // Create transaction
        const { data: newTransaction, error: txnError } = await supabase
          .from('transactions')
          .insert({
            transaction_number: transactionNumber,
            type: 'Transfer',
            date: formData.transaction_date,
            tags: formData.tags,
            paid_from_account_id: formData.paid_from_account_id,
            paid_to_account_id: formData.paid_to_account_id,
            currency: formData.currency,
            amount: formData.amount,
            total: total,
          })
          .select()
          .single();

        if (txnError) throw txnError;
        transaction = newTransaction;

        // Create transfer costs if any
        if (formData.costs.length > 0 && transaction) {
          const transactionId = transaction.id;
          const { error: costsError } = await supabase.from('transfer_costs').insert(
            formData.costs.map((cost) => ({
              transaction_id: transactionId,
              account_id: cost.account_id,
              description: cost.description,
              amount: cost.amount,
            }))
          );

          if (costsError) throw costsError;
        }
      }

      // Upload attachments
      if (formData.attachments.length > 0 && transaction) {
        const transactionId = transaction.id;
        const uploadPromises = formData.attachments.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${transactionId}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('transaction-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('transaction-attachments').getPublicUrl(fileName);

          return {
            transaction_id: transactionId,
            file_url: urlData.publicUrl,
            file_name: file.name,
          };
        });

        const attachmentData = await Promise.all(uploadPromises);

        const { error: attachError } = await supabase.from('attachments').insert(attachmentData);
        if (attachError) throw attachError;
      }

      if (transaction) {
        showSuccess(isEditing ? 'Transaction updated successfully' : 'Transaction created successfully');
        navigate(`/transactions/${transaction.id}`);
      }
    } catch (err: any) {
      const errorMessage = err.message || (isEditing ? 'Failed to update transaction' : 'Failed to create transaction');
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cashAccountOptions = cashAccounts.map((a) => ({
    value: a.id,
    label: `${a.account_number} - ${a.name}`,
  }));

  const costAccountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.account_number} - ${a.name}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? 'Edit Transfer Transaction' : 'New Transfer Transaction'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Move funds between wallet accounts and optionally record costs.
          </p>
        </div>
        <Button onClick={() => navigate('/transactions')} variant="outline">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Transaction Number" value={transactionNumber} disabled className="bg-muted" />
          <DateInput
            label="Transaction Date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Paid From (Cash & Bank)"
            value={formData.paid_from_account_id || ''}
            onChange={(e) => setFormData({ ...formData, paid_from_account_id: e.target.value || null })}
            options={cashAccountOptions}
            placeholder="Select account"
            required
            disabled={loading}
          />
          <Select
            label="Paid To (Cash & Bank)"
            value={formData.paid_to_account_id || ''}
            onChange={(e) => setFormData({ ...formData, paid_to_account_id: e.target.value || null })}
            options={cashAccountOptions}
            placeholder="Select account"
            required
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
            disabled={loading}
          />
          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            options={[{ value: 'IDR', label: 'IDR' }]}
            disabled={loading}
          />
        </div>

        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Optional Costs</CardTitle>
              <CardDescription>Fees or charges related to the transfer.</CardDescription>
            </div>
            <Button type="button" onClick={handleAddCost} disabled={loading} variant="outline">
              Add Cost
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.costs.length > 0 ? (
              <ShadcnTable>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[420px]">Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[160px] text-right">Amount</TableHead>
                    <TableHead className="w-[90px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.costs.map((cost, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <select
                          value={cost.account_id}
                          onChange={(e) => handleCostChange(index, 'account_id', e.target.value)}
                          required
                          disabled={loading}
                          className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                          <option value="">Select account</option>
                          {costAccountOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                      <TableCell>
                        <ShadcnInput
                          type="text"
                          value={cost.description}
                          onChange={(e) => handleCostChange(index, 'description', e.target.value)}
                          disabled={loading}
                          placeholder="Optional description"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <ShadcnInput
                          type="number"
                          step="0.01"
                          min="0"
                          value={cost.amount || ''}
                          onChange={(e) => handleCostChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          required
                          disabled={loading}
                          className="text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          onClick={() => handleRemoveCost(index)}
                          disabled={loading}
                          variant="ghost"
                          size="sm"
                        >
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ShadcnTable>
            ) : (
              <p className="text-sm text-muted-foreground">
                No costs added.
              </p>
            )}

            <div className="text-sm font-medium">
              Total: {formatCurrency(total, formData.currency)}
            </div>
          </CardContent>
        </Card>

        <FileUpload
          label="Attachments"
          value={formData.attachments}
          onChange={(files) => setFormData({ ...formData, attachments: files })}
        />

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <div className="flex gap-2">
          <Button type="submit" variant="default" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Transaction' : 'Create Transaction'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/transactions')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

