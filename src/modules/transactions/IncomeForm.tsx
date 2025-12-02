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
import type { IncomeFormData, Account, Contact } from '../../lib/types';
import { formatCurrency } from '../../lib/utils';

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

      let transaction;

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
        if (formData.items.length > 0) {
          const { error: itemsError } = await supabase.from('transaction_items').insert(
            formData.items.map((item) => ({
              transaction_id: transaction.id,
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
        const uploadPromises = formData.attachments.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${transaction.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('transaction-attachments')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('transaction-attachments').getPublicUrl(fileName);

          return {
            transaction_id: transaction.id,
            file_url: urlData.publicUrl,
            file_name: file.name,
          };
        });

        const attachmentData = await Promise.all(uploadPromises);

        const { error: attachError } = await supabase.from('attachments').insert(attachmentData);
        if (attachError) throw attachError;
      }

      showSuccess(isEditing ? 'Transaction updated successfully' : 'Transaction created successfully');
      navigate(`/transactions/${transaction.id}`);
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

  const contactOptions = contacts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Income Transaction' : 'New Income Transaction'}</h1>
        <button onClick={() => navigate('/transactions')}>Cancel</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <Input label="Transaction Number" value={transactionNumber} disabled />
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

        <div className="form-row">
          <Select
            label="Payer"
            value={formData.payer_id || ''}
            onChange={(e) => setFormData({ ...formData, payer_id: e.target.value || null })}
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

        <div style={{ marginTop: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Line Items</h3>
            <button type="button" onClick={handleAddItem} disabled={loading}>
              Add Item
            </button>
          </div>
          <div className="line-items-table">
            <table>
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Description</th>
                  <th style={{ width: '150px' }}>Amount</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select
                      value={item.account_id}
                      onChange={(e) => handleItemChange(index, 'account_id', e.target.value)}
                      required
                      disabled={loading}
                      style={{ width: '100%' }}
                    >
                      <option value="">Select account</option>
                      {accountOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                      required
                      disabled={loading}
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        disabled={loading}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', fontWeight: 600 }}>
                  Total:
                </td>
                <td style={{ fontWeight: 600 }}>{formatCurrency(total, 'IDR')}</td>
                <td></td>
              </tr>
            </tfoot>
            </table>
          </div>
        </div>

        <FileUpload
          label="Attachments"
          value={formData.attachments}
          onChange={(files) => setFormData({ ...formData, attachments: files })}
        />

        {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '24px' }}>
          <button type="submit" className="primary" disabled={loading}>
            {isEditing ? 'Update Transaction' : 'Create Transaction'}
          </button>
          <button type="button" onClick={() => navigate('/transactions')} disabled={loading}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

