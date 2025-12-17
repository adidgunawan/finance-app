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
import { ContactQuickAddModal } from '../../components/Modal/ContactQuickAddModal';
import type { IncomeFormData, Account, Contact } from '../../lib/types';
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

export function IncomeForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const { showError, showSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [cashAccounts, setCashAccounts] = useState<Account[]>([]);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  const [formData, setFormData] = useState<IncomeFormData>({
    transaction_date: new Date().toISOString().split('T')[0],
    tags: [],
    payer_id: null,
    paid_to_account_id: null,
    items: [{ account_id: '', description: '', amount: 0 }],
    attachments: [],
  });

  useEffect(() => {
    const loadData = async () => {
      const [accountsRes, contactsRes] = await Promise.all([
        supabase.from('accounts').select('*').order('account_number'),
        supabase.from('contacts').select('*').order('name'),
      ]);

      if (accountsRes.data) {
        setAccounts(accountsRes.data);
        setCashAccounts(accountsRes.data.filter((a) => a.is_wallet === true));
      }
      if (contactsRes.data) setContacts(contactsRes.data);
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
            .select('*, items:transaction_items(*), attachments(*)')
            .eq('id', id)
            .single();

          if (txnError) throw txnError;

          setTransactionNumber(transaction.transaction_number);
          setFormData({
            transaction_date: transaction.date,
            tags: transaction.tags || [],
            payer_id: transaction.payer_id,
            paid_to_account_id: transaction.paid_to_account_id,
            items: transaction.items?.map((item: any) => ({
              account_id: item.account_id,
              description: item.description || '',
              amount: item.amount,
            })) || [{ account_id: '', description: '', amount: 0 }],
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
        const txnNum = await generateTransactionNumber('Income', date);
        setTransactionNumber(txnNum);
      };

      generateNumber();
    }
  }, [formData.transaction_date, isEditing]);

  const total = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { account_id: '', description: '', amount: 0 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.paid_to_account_id) {
      showError('Paid To account is required');
      return;
    }

    if (formData.items.some((item) => !item.account_id || item.amount <= 0)) {
      showError('All line items must have an account and amount > 0');
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
            payer_id: formData.payer_id,
            paid_to_account_id: formData.paid_to_account_id,
            total: total,
          })
          .eq('id', id)
          .select()
          .single();

        if (txnError) throw txnError;
        transaction = updatedTransaction;

        // Delete existing items and create new ones
        await supabase.from('transaction_items').delete().eq('transaction_id', id);

        if (formData.items.length > 0) {
          const { error: itemsError } = await supabase.from('transaction_items').insert(
            formData.items.map((item) => ({
              transaction_id: id,
              account_id: item.account_id,
              description: item.description,
              amount: item.amount,
            }))
          );

          if (itemsError) throw itemsError;
        }
      } else {
        // Create transaction
        const { data: newTransaction, error: txnError } = await supabase
          .from('transactions')
          .insert({
            transaction_number: transactionNumber,
            type: 'Income',
            date: formData.transaction_date,
            tags: formData.tags,
            payer_id: formData.payer_id,
            paid_to_account_id: formData.paid_to_account_id,
            currency: 'IDR',
            total: total,
          })
          .select()
          .single();

        if (txnError) throw txnError;
        transaction = newTransaction;

        // Create transaction items
        if (formData.items.length > 0 && transaction) {
          const transactionId = transaction.id;
          const { error: itemsError } = await supabase.from('transaction_items').insert(
            formData.items.map((item) => ({
              transaction_id: transactionId,
              account_id: item.account_id,
              description: item.description,
              amount: item.amount,
            }))
          );

          if (itemsError) throw itemsError;
        }
      }

      // Upload new attachments
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

  const accountOptions = accounts
    .filter((a) => a.type === 'Income')
    .map((a) => ({ value: a.id, label: `${a.account_number} - ${a.name}` }));

  const cashAccountOptions = cashAccounts.map((a) => ({
    value: a.id,
    label: `${a.account_number} - ${a.name}`,
  }));

  const contactOptions = [
    ...contacts.map((c) => ({ value: c.id, label: c.name })),
    { value: '__add_new__', label: 'Add New...' },
  ];

  const handleContactAdded = async (newContact: Contact) => {
    // Refresh contacts list
    const { data: contactsRes } = await supabase.from('contacts').select('*').order('name');
    if (contactsRes) setContacts(contactsRes);

    // Auto-select the newly created contact
    setFormData({ ...formData, payer_id: newContact.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEditing ? 'Edit Income Transaction' : 'New Income Transaction'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Record incoming funds and allocate them to income accounts.
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
            onChange={(e) => {
              setFormData({ ...formData, transaction_date: e.target.value });
            }}
            required
            disabled={loading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Payer"
            value={formData.payer_id || ''}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '__add_new__') {
                setShowAddContactModal(true);
                setFormData({ ...formData, payer_id: null });
              } else {
                setFormData({ ...formData, payer_id: value || null });
              }
            }}
            options={contactOptions}
            placeholder="Select payer"
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

        <TagInput
          label="Tags"
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
        />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Line Items</CardTitle>
              <CardDescription>Allocate amounts to income accounts.</CardDescription>
            </div>
            <Button type="button" onClick={handleAddItem} disabled={loading} variant="outline">
              Add Item
            </Button>
          </CardHeader>
          <CardContent>
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
                {formData.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <select
                        value={item.account_id}
                        onChange={(e) => handleItemChange(index, 'account_id', e.target.value)}
                        required
                        disabled={loading}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select account</option>
                        {accountOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <ShadcnInput
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        disabled={loading}
                        placeholder="Optional description"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <ShadcnInput
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount || ''}
                        onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        required
                        disabled={loading}
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {formData.items.length > 1 ? (
                        <Button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          disabled={loading}
                          variant="ghost"
                          size="sm"
                        >
                          Remove
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(total, 'IDR')}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </ShadcnTable>
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

      <ContactQuickAddModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onContactAdded={handleContactAdded}
      />
    </div>
  );
}

