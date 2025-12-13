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
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">{isEditing ? 'Edit Transfer Transaction' : 'New Transfer Transaction'}</h1>
        <Button onClick={() => navigate('/transactions')} variant="secondary">Cancel</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <Input label="Transaction Number" value={transactionNumber} disabled />
          <DateInput
            label="Transaction Date"
            value={formData.transaction_date}
            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="form-row">
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

        <div className="form-row">
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

        <div style={{ marginTop: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3>Optional Costs</h3>
            <Button type="button" onClick={handleAddCost} disabled={loading} variant="secondary">
              Add Cost
            </Button>
          </div>

          {formData.costs.length > 0 && (
            <>
              {/* Desktop Table View */}
              <div className="line-items-table">
                <table style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '400px' }}>Account</th>
                      <th>Description</th>
                      <th style={{ width: '150px' }}>Amount</th>
                      <th style={{ width: '80px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.costs.map((cost, index) => (
                      <tr key={index}>
                        <td style={{ width: '400px' }}>
                          <select
                            value={cost.account_id}
                            onChange={(e) => handleCostChange(index, 'account_id', e.target.value)}
                            required
                            disabled={loading}
                            style={{
                              width: '100%',
                              maxWidth: '400px',
                              padding: '6px 8px',
                              border: '1px solid var(--border-color)',
                              borderRadius: '3px',
                              backgroundColor: 'var(--bg-primary)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <option value="">Select account</option>
                            {costAccountOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-input"
                            value={cost.description}
                            onChange={(e) => handleCostChange(index, 'description', e.target.value)}
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="form-input"
                            value={cost.amount || ''}
                            onChange={(e) => handleCostChange(index, 'amount', parseFloat(e.target.value) || 0)}
                            required
                            disabled={loading}
                          />
                        </td>
                        <td>
                          <Button
                            type="button"
                            onClick={() => handleRemoveCost(index)}
                            disabled={loading}
                            variant="destructive"
                            size="sm"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                          >
                            Remove
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="line-items-mobile">
                {formData.costs.map((cost, index) => (
                  <div key={index} className="line-item-card">
                    <div className="line-item-card-header">
                      <span>Cost {index + 1}</span>
                      <Button
                        type="button"
                        onClick={() => handleRemoveCost(index)}
                        disabled={loading}
                        variant="destructive"
                        size="sm"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Account</label>
                      <select
                        value={cost.account_id}
                        onChange={(e) => handleCostChange(index, 'account_id', e.target.value)}
                        required
                        disabled={loading}
                        style={{ width: '100%' }}
                      >
                        <option value="">Select account</option>
                        {costAccountOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <input
                        type="text"
                        className="form-input"
                        value={cost.description}
                        onChange={(e) => handleCostChange(index, 'description', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={cost.amount || ''}
                        onChange={(e) => handleCostChange(index, 'amount', parseFloat(e.target.value) || 0)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Total Display */}
          <div style={{ marginTop: '12px', fontWeight: 600 }}>
            Total: {formatCurrency(total, formData.currency)}
          </div>
        </div>

        <FileUpload
          label="Attachments"
          value={formData.attachments}
          onChange={(files) => setFormData({ ...formData, attachments: files })}
        />

        {error && <div style={{ color: 'var(--error)', marginBottom: '16px' }}>{error}</div>}

        <div className="form-actions">
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
          <Button type="button" onClick={() => navigate('/transactions')} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

