import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/Modal/Modal';
import { DateInput } from '../../components/Form/DateInput';
import { Select } from '../../components/Form/Select';
import { Input } from '../../components/Form/Input';
import { TagInput } from '../../components/Form/TagInput';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { generateTransactionNumber } from '../../lib/utils/transactionNumber';
import type { TransactionMatchResult, ParsedCsvRow, Account, Contact, ExpenseFormData, IncomeFormData, TransferFormData } from '../../lib/types';
import { formatCurrency, formatDate } from '../../lib/utils';

interface TransactionMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvRow: ParsedCsvRow | null;
  matches: TransactionMatchResult[];
  onLinkTransaction: (transactionId: string) => void;
  onCreateNewTransaction: () => void;
  walletAccount: Account | null;
  accounts: Account[];
  contacts: Contact[];
}

export function TransactionMatchModal({
  isOpen,
  onClose,
  csvRow,
  matches,
  onLinkTransaction,
  onCreateNewTransaction,
  walletAccount,
  accounts,
  contacts,
}: TransactionMatchModalProps) {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionNumber, setTransactionNumber] = useState('');
  const [transactionType, setTransactionType] = useState<'Expense' | 'Income' | 'Transfer'>('Expense');
  
  // Expense form state
  const [expenseFormData, setExpenseFormData] = useState<ExpenseFormData>({
    transaction_date: '',
    tags: [],
    payee_id: null,
    paid_from_account_id: null,
    items: [{ account_id: '', description: '', amount: 0 }],
    attachments: [],
  });
  
  // Income form state
  const [incomeFormData, setIncomeFormData] = useState<IncomeFormData>({
    transaction_date: '',
    tags: [],
    payer_id: null,
    paid_to_account_id: null,
    items: [{ account_id: '', description: '', amount: 0 }],
    attachments: [],
  });

  // Transfer form state
  const [transferFormData, setTransferFormData] = useState<TransferFormData>({
    transaction_date: '',
    tags: [],
    paid_from_account_id: null,
    paid_to_account_id: null,
    currency: 'IDR',
    amount: 0,
    costs: [],
    attachments: [],
  });

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowForm(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Initialize form when CSV row is available and showing form
  useEffect(() => {
    if (csvRow && showForm && walletAccount) {
      const date = csvRow.date;
      const description = csvRow.description;
      const amount = csvRow.amount;
      
      // Set default type based on CSV type
      const defaultType = csvRow.type === 'debit' ? 'Expense' : 'Income';
      setTransactionType(defaultType);
      
      // Initialize all forms with CSV data
      setExpenseFormData({
        transaction_date: date,
        tags: [],
        payee_id: null,
        paid_from_account_id: walletAccount.id,
        items: [{ account_id: '', description: description, amount: amount }],
        attachments: [],
      });
      
      setIncomeFormData({
        transaction_date: date,
        tags: [],
        payer_id: null,
        paid_to_account_id: walletAccount.id,
        items: [{ account_id: '', description: description, amount: amount }],
        attachments: [],
      });

      setTransferFormData({
        transaction_date: date,
        tags: [],
        paid_from_account_id: csvRow.type === 'debit' ? walletAccount.id : null,
        paid_to_account_id: csvRow.type === 'credit' ? walletAccount.id : null,
        currency: 'IDR',
        amount: amount,
        costs: [],
        attachments: [],
      });
      
      // Generate transaction number
      generateTransactionNumber(defaultType, new Date(date))
        .then(num => setTransactionNumber(num))
        .catch(err => console.error('Error generating transaction number:', err));
    }
  }, [csvRow, showForm, walletAccount]);

  // Regenerate transaction number when type changes
  useEffect(() => {
    if (showForm && csvRow) {
      generateTransactionNumber(transactionType, new Date(csvRow.date))
        .then(num => setTransactionNumber(num))
        .catch(err => console.error('Error generating transaction number:', err));
    }
  }, [transactionType, showForm, csvRow]);

  if (!csvRow) return null;

  const handleLinkTransaction = (transactionId: string) => {
    onLinkTransaction(transactionId);
    onClose();
  };

  const handleViewTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleBackToMatches = () => {
    setShowForm(false);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!expenseFormData.paid_from_account_id) {
      showError('Paid From account is required');
      setLoading(false);
      return;
    }

    if (expenseFormData.items.some((item) => !item.account_id || item.amount <= 0)) {
      showError('All line items must have an account and amount > 0');
      setLoading(false);
      return;
    }

    try {
      const total = expenseFormData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // Create transaction
      const { data: newTransaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          type: 'Expense',
          date: expenseFormData.transaction_date,
          tags: expenseFormData.tags,
          payee_id: expenseFormData.payee_id,
          paid_from_account_id: expenseFormData.paid_from_account_id,
          currency: 'IDR',
          total: total,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Create transaction items
      if (expenseFormData.items.length > 0 && newTransaction) {
        const transactionId = newTransaction.id;
        const { error: itemsError } = await supabase.from('transaction_items').insert(
          expenseFormData.items.map((item) => ({
            transaction_id: transactionId,
            account_id: item.account_id,
            description: item.description,
            amount: item.amount,
          }))
        );

        if (itemsError) throw itemsError;
      }

      showSuccess('Transaction created successfully');
      if (newTransaction) {
        handleLinkTransaction(newTransaction.id);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!incomeFormData.paid_to_account_id) {
      showError('Paid To account is required');
      setLoading(false);
      return;
    }

    if (incomeFormData.items.some((item) => !item.account_id || item.amount <= 0)) {
      showError('All line items must have an account and amount > 0');
      setLoading(false);
      return;
    }

    try {
      const total = incomeFormData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      // Create transaction
      const { data: newTransaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          type: 'Income',
          date: incomeFormData.transaction_date,
          tags: incomeFormData.tags,
          payer_id: incomeFormData.payer_id,
          paid_to_account_id: incomeFormData.paid_to_account_id,
          currency: 'IDR',
          total: total,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Create transaction items
      if (incomeFormData.items.length > 0 && newTransaction) {
        const transactionId = newTransaction.id;
        const { error: itemsError } = await supabase.from('transaction_items').insert(
          incomeFormData.items.map((item) => ({
            transaction_id: transactionId,
            account_id: item.account_id,
            description: item.description,
            amount: item.amount,
          }))
        );

        if (itemsError) throw itemsError;
      }

      showSuccess('Transaction created successfully');
      if (newTransaction) {
        handleLinkTransaction(newTransaction.id);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#4caf50'; // Green
    if (confidence >= 50) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };
  
  const expenseAccountOptions = accounts
    .filter((a) => a.type === 'Expense')
    .map((a) => ({ value: a.id, label: `${a.account_number} - ${a.name}` }));
  const incomeAccountOptions = accounts
    .filter((a) => a.type === 'Income')
    .map((a) => ({ value: a.id, label: `${a.account_number} - ${a.name}` }));
  const contactOptions = contacts.map((c) => ({ value: c.id, label: c.name }));
  
  const expenseTotal = expenseFormData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const incomeTotal = incomeFormData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  // Amount matching validation
  const csvAmount = csvRow?.amount || 0;
  const checkAmountMatch = (transactionTotal: number) => {
    const tolerance = 0.01; // Allow small floating point differences
    return Math.abs(transactionTotal - csvAmount) <= tolerance;
  };
  
  const getAmountDiscrepancy = (transactionTotal: number) => {
    return transactionTotal - csvAmount;
  };

  const handleExpenseItemChange = (index: number, field: string, value: any) => {
    const newItems = [...expenseFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setExpenseFormData({ ...expenseFormData, items: newItems });
  };

  const handleIncomeItemChange = (index: number, field: string, value: any) => {
    const newItems = [...incomeFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setIncomeFormData({ ...incomeFormData, items: newItems });
  };

  const handleAddExpenseItem = () => {
    setExpenseFormData({
      ...expenseFormData,
      items: [...expenseFormData.items, { account_id: '', description: '', amount: 0 }],
    });
  };

  const handleAddIncomeItem = () => {
    setIncomeFormData({
      ...incomeFormData,
      items: [...incomeFormData.items, { account_id: '', description: '', amount: 0 }],
    });
  };

  const handleRemoveExpenseItem = (index: number) => {
    if (expenseFormData.items.length > 1) {
      setExpenseFormData({
        ...expenseFormData,
        items: expenseFormData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleRemoveIncomeItem = (index: number) => {
    if (incomeFormData.items.length > 1) {
      setIncomeFormData({
        ...incomeFormData,
        items: incomeFormData.items.filter((_, i) => i !== index),
      });
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!transferFormData.paid_from_account_id || !transferFormData.paid_to_account_id) {
      showError('Both Paid From and Paid To accounts are required');
      setLoading(false);
      return;
    }

    if (transferFormData.amount <= 0) {
      showError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const total = transferFormData.amount + (transferFormData.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0));
      
      // Create transaction
      const { data: newTransaction, error: txnError } = await supabase
        .from('transactions')
        .insert({
          transaction_number: transactionNumber,
          type: 'Transfer',
          date: transferFormData.transaction_date,
          tags: transferFormData.tags,
          paid_from_account_id: transferFormData.paid_from_account_id,
          paid_to_account_id: transferFormData.paid_to_account_id,
          currency: transferFormData.currency,
          amount: transferFormData.amount,
          total: total,
        })
        .select()
        .single();

      if (txnError) throw txnError;

      // Create transfer costs if any
      if (transferFormData.costs.length > 0 && newTransaction) {
        const transactionId = newTransaction.id;
        const { error: costsError } = await supabase.from('transfer_costs').insert(
          transferFormData.costs.map((cost) => ({
            transaction_id: transactionId,
            account_id: cost.account_id,
            description: cost.description,
            amount: cost.amount,
          }))
        );

        if (costsError) throw costsError;
      }

      showSuccess('Transaction created successfully');
      if (newTransaction) {
        handleLinkTransaction(newTransaction.id);
      }
    } catch (err: any) {
      showError(err.message || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleTransferCostChange = (index: number, field: string, value: any) => {
    const newCosts = [...transferFormData.costs];
    newCosts[index] = { ...newCosts[index], [field]: value };
    setTransferFormData({ ...transferFormData, costs: newCosts });
  };

  const handleAddTransferCost = () => {
    setTransferFormData({
      ...transferFormData,
      costs: [...transferFormData.costs, { account_id: '', description: '', amount: 0 }],
    });
  };

  const handleRemoveTransferCost = (index: number) => {
    setTransferFormData({
      ...transferFormData,
      costs: transferFormData.costs.filter((_, i) => i !== index),
    });
  };

  const cashAccountOptions = accounts
    .filter((a) => a.is_wallet === true)
    .map((a) => ({ value: a.id, label: `${a.account_number} - ${a.name}` }));
  
  const costAccountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.account_number} - ${a.name}`,
  }));

  const transferTotal = transferFormData.amount + transferFormData.costs.reduce((sum, cost) => sum + (cost.amount || 0), 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={showForm ? `Create New ${transactionType} Transaction` : 'Find Matching Transaction'}
      maxWidth="1000px"
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '4px' }}>
        {/* Always show CSV details at top */}
        <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>CSV Transaction Details</h3>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div><strong>Date:</strong> {formatDate(csvRow.date)}</div>
            <div><strong>Description:</strong> {csvRow.description}</div>
            <div><strong>Amount:</strong> {formatCurrency(csvRow.amount, 'IDR')}</div>
            <div><strong>Type:</strong> {csvRow.type.toUpperCase()}</div>
          </div>
        </div>

        {!showForm ? (
          <>
            {/* Matches view */}
            {matches.length > 0 ? (
              <>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
                  Potential Matches ({matches.length})
                </h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {matches.map((match) => (
                    <div
                      key={match.transaction.id}
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '4px',
                        padding: '16px',
                        marginBottom: '12px',
                        backgroundColor: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                            {match.transaction.transaction_number}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {formatDate(match.transaction.date)} • {match.transaction.type}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '3px',
                              fontSize: '11px',
                              fontWeight: '600',
                              backgroundColor: getConfidenceColor(match.confidence),
                              color: 'white',
                            }}
                          >
                            {match.confidence}% match
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {match.reason}
                      </div>

                      {match.transaction.items && match.transaction.items.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          {match.transaction.items.map((item, idx) => (
                            <div key={idx} style={{ fontSize: '13px', marginBottom: '4px' }}>
                              • {item.account?.name}: {item.description || 'No description'} - {formatCurrency(item.amount, 'IDR')}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => handleLinkTransaction(match.transaction.id)}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            border: 'none',
                            borderRadius: '4px',
                            background: 'var(--accent)',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          Link to This Transaction
                        </button>
                        <button
                          onClick={() => handleViewTransaction(match.transaction.id)}
                          style={{
                            padding: '8px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: '4px',
                            background: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                <p style={{ marginBottom: '16px' }}>No matching transactions found.</p>
                <p style={{ fontSize: '13px', marginBottom: '24px' }}>
                  You can create a new transaction using the CSV details.
                </p>
              </div>
            )}

            {/* Create New Transaction Button */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={handleShowForm}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  background: 'var(--success)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
              >
                Create New Transaction
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Form view */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={handleBackToMatches}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                ← Back to Matches
              </button>

              {/* Transaction Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Transaction Type</label>
                <Select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as 'Expense' | 'Income' | 'Transfer')}
                  options={[
                    { value: 'Expense', label: 'Expense' },
                    { value: 'Income', label: 'Income' },
                    { value: 'Transfer', label: 'Transfer' },
                  ]}
                  disabled={loading}
                />
              </div>

              {transactionType === 'Expense' ? (
                <form onSubmit={handleExpenseSubmit}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Transaction Number" value={transactionNumber} disabled />
                    <DateInput
                      label="Transaction Date"
                      value={expenseFormData.transaction_date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, transaction_date: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Select
                      label="Payee"
                      value={expenseFormData.payee_id || ''}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, payee_id: e.target.value || null })}
                      options={[{ value: '', label: 'Select payee' }, ...contactOptions]}
                      placeholder="Select payee"
                      disabled={loading}
                    />
                    <Select
                      label="Paid From (Cash & Bank)"
                      value={expenseFormData.paid_from_account_id || ''}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, paid_from_account_id: e.target.value || null })}
                      options={walletAccount ? [{ value: walletAccount.id, label: `${walletAccount.account_number} - ${walletAccount.name}` }] : []}
                      required
                      disabled={loading || !walletAccount}
                    />
                  </div>

                  <TagInput
                    label="Tags"
                    value={expenseFormData.tags}
                    onChange={(tags) => setExpenseFormData({ ...expenseFormData, tags })}
                  />

                  <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3>Line Items</h3>
                      <button type="button" onClick={handleAddExpenseItem} disabled={loading} style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Add Item
                      </button>
                    </div>
                    <div className="line-items-table" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Description</th>
                            <th style={{ width: '150px' }}>Amount</th>
                            <th style={{ width: '80px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseFormData.items.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <select
                                  value={item.account_id}
                                  onChange={(e) => handleExpenseItemChange(index, 'account_id', e.target.value)}
                                  required
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                >
                                  <option value="">Select account</option>
                                  {expenseAccountOptions.map((opt) => (
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
                                  onChange={(e) => handleExpenseItemChange(index, 'description', e.target.value)}
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.amount || ''}
                                  onChange={(e) => handleExpenseItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                  required
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                />
                              </td>
                              <td>
                                {expenseFormData.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExpenseItem(index)}
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
                            <td style={{ fontWeight: 600 }}>{formatCurrency(expenseTotal, 'IDR')}</td>
                            <td></td>
                          </tr>
                          {checkAmountMatch(expenseTotal) ? (
                            <tr>
                              <td colSpan={4} style={{ paddingTop: '8px', paddingBottom: '0' }}>
                                <div style={{ 
                                  color: '#4caf50', 
                                  fontSize: '13px', 
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#e8f5e9',
                                  borderRadius: '4px'
                                }}>
                                  ✓ Amount matches CSV: {formatCurrency(csvAmount, 'IDR')}
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ paddingTop: '8px', paddingBottom: '0' }}>
                                <div style={{ 
                                  color: '#f44336', 
                                  fontSize: '13px', 
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#ffebee',
                                  borderRadius: '4px'
                                }}>
                                  Amount mismatch! CSV Amount: {formatCurrency(csvAmount, 'IDR')} | 
                                  Discrepancy: {formatCurrency(getAmountDiscrepancy(expenseTotal), 'IDR')}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleBackToMatches} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="primary" disabled={loading}>
                      Create Transaction
                    </button>
                  </div>
                </form>
              ) : transactionType === 'Income' ? (
                <form onSubmit={handleIncomeSubmit}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Transaction Number" value={transactionNumber} disabled />
                    <DateInput
                      label="Transaction Date"
                      value={incomeFormData.transaction_date}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, transaction_date: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Select
                      label="Payer"
                      value={incomeFormData.payer_id || ''}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, payer_id: e.target.value || null })}
                      options={[{ value: '', label: 'Select payer' }, ...contactOptions]}
                      placeholder="Select payer"
                      disabled={loading}
                    />
                    <Select
                      label="Paid To (Cash & Bank)"
                      value={incomeFormData.paid_to_account_id || ''}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, paid_to_account_id: e.target.value || null })}
                      options={walletAccount ? [{ value: walletAccount.id, label: `${walletAccount.account_number} - ${walletAccount.name}` }] : []}
                      required
                      disabled={loading || !walletAccount}
                    />
                  </div>

                  <TagInput
                    label="Tags"
                    value={incomeFormData.tags}
                    onChange={(tags) => setIncomeFormData({ ...incomeFormData, tags })}
                  />

                  <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3>Line Items</h3>
                      <button type="button" onClick={handleAddIncomeItem} disabled={loading} style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Add Item
                      </button>
                    </div>
                    <div className="line-items-table" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      <table style={{ width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Account</th>
                            <th>Description</th>
                            <th style={{ width: '150px' }}>Amount</th>
                            <th style={{ width: '80px' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeFormData.items.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <select
                                  value={item.account_id}
                                  onChange={(e) => handleIncomeItemChange(index, 'account_id', e.target.value)}
                                  required
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                >
                                  <option value="">Select account</option>
                                  {incomeAccountOptions.map((opt) => (
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
                                  onChange={(e) => handleIncomeItemChange(index, 'description', e.target.value)}
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.amount || ''}
                                  onChange={(e) => handleIncomeItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                  required
                                  disabled={loading}
                                  style={{ width: '100%', padding: '6px' }}
                                />
                              </td>
                              <td>
                                {incomeFormData.items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIncomeItem(index)}
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
                            <td style={{ fontWeight: 600 }}>{formatCurrency(incomeTotal, 'IDR')}</td>
                            <td></td>
                          </tr>
                          {checkAmountMatch(incomeTotal) ? (
                            <tr>
                              <td colSpan={4} style={{ paddingTop: '8px', paddingBottom: '0' }}>
                                <div style={{ 
                                  color: '#4caf50', 
                                  fontSize: '13px', 
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#e8f5e9',
                                  borderRadius: '4px'
                                }}>
                                  ✓ Amount matches CSV: {formatCurrency(csvAmount, 'IDR')}
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <tr>
                              <td colSpan={4} style={{ paddingTop: '8px', paddingBottom: '0' }}>
                                <div style={{ 
                                  color: '#f44336', 
                                  fontSize: '13px', 
                                  fontWeight: '500',
                                  textAlign: 'center',
                                  padding: '8px',
                                  backgroundColor: '#ffebee',
                                  borderRadius: '4px'
                                }}>
                                  Amount mismatch! CSV Amount: {formatCurrency(csvAmount, 'IDR')} | 
                                  Discrepancy: {formatCurrency(getAmountDiscrepancy(incomeTotal), 'IDR')}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleBackToMatches} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="primary" disabled={loading}>
                      Create Transaction
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleTransferSubmit}>
                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input label="Transaction Number" value={transactionNumber} disabled />
                    <DateInput
                      label="Transaction Date"
                      value={transferFormData.transaction_date}
                      onChange={(e) => setTransferFormData({ ...transferFormData, transaction_date: e.target.value })}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Select
                      label="Paid From (Cash & Bank)"
                      value={transferFormData.paid_from_account_id || ''}
                      onChange={(e) => setTransferFormData({ ...transferFormData, paid_from_account_id: e.target.value || null })}
                      options={[{ value: '', label: 'Select account' }, ...cashAccountOptions]}
                      required
                      disabled={loading}
                    />
                    <Select
                      label="Paid To (Cash & Bank)"
                      value={transferFormData.paid_to_account_id || ''}
                      onChange={(e) => setTransferFormData({ ...transferFormData, paid_to_account_id: e.target.value || null })}
                      options={[{ value: '', label: 'Select account' }, ...cashAccountOptions]}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <Input
                      label="Amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={transferFormData.amount || ''}
                      onChange={(e) => setTransferFormData({ ...transferFormData, amount: parseFloat(e.target.value) || 0 })}
                      required
                      disabled={loading}
                    />
                    <Select
                      label="Currency"
                      value={transferFormData.currency}
                      onChange={(e) => setTransferFormData({ ...transferFormData, currency: e.target.value })}
                      options={[{ value: 'IDR', label: 'IDR' }]}
                      disabled={loading}
                    />
                  </div>

                  <TagInput
                    label="Tags"
                    value={transferFormData.tags}
                    onChange={(tags) => setTransferFormData({ ...transferFormData, tags })}
                  />

                  <div style={{ marginTop: '24px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3>Optional Costs</h3>
                      <button type="button" onClick={handleAddTransferCost} disabled={loading} style={{ fontSize: '13px', padding: '6px 12px' }}>
                        Add Cost
                      </button>
                    </div>
                    {transferFormData.costs.length > 0 && (
                      <div className="line-items-table" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Account</th>
                              <th>Description</th>
                              <th style={{ width: '150px' }}>Amount</th>
                              <th style={{ width: '80px' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transferFormData.costs.map((cost, index) => (
                              <tr key={index}>
                                <td>
                                  <select
                                    value={cost.account_id}
                                    onChange={(e) => handleTransferCostChange(index, 'account_id', e.target.value)}
                                    required
                                    disabled={loading}
                                    style={{ width: '100%', padding: '6px' }}
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
                                    value={cost.description}
                                    onChange={(e) => handleTransferCostChange(index, 'description', e.target.value)}
                                    disabled={loading}
                                    style={{ width: '100%', padding: '6px' }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={cost.amount || ''}
                                    onChange={(e) => handleTransferCostChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                    required
                                    disabled={loading}
                                    style={{ width: '100%', padding: '6px' }}
                                  />
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTransferCost(index)}
                                    disabled={loading}
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
                    )}
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                        Total: {formatCurrency(transferTotal, transferFormData.currency)}
                      </div>
                      {checkAmountMatch(transferTotal) ? (
                        <div style={{ 
                          color: '#4caf50', 
                          fontSize: '13px', 
                          fontWeight: '500',
                          padding: '8px',
                          backgroundColor: '#e8f5e9',
                          borderRadius: '4px'
                        }}>
                          ✓ Amount matches CSV: {formatCurrency(csvAmount, 'IDR')}
                        </div>
                      ) : (
                        <div style={{ 
                          color: '#f44336', 
                          fontSize: '13px', 
                          fontWeight: '500',
                          padding: '8px',
                          backgroundColor: '#ffebee',
                          borderRadius: '4px'
                        }}>
                          Amount mismatch! CSV Amount: {formatCurrency(csvAmount, 'IDR')} | 
                          Discrepancy: {formatCurrency(getAmountDiscrepancy(transferTotal), 'IDR')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleBackToMatches} disabled={loading}>
                      Cancel
                    </button>
                    <button type="submit" className="primary" disabled={loading}>
                      Create Transaction
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

