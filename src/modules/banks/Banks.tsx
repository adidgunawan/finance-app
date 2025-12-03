import { useState, useMemo } from 'react';
import { useBanks } from './hooks/useBanks';
import { Table, Column } from '../../components/Table/Table';
import { Modal } from '../../components/Modal/Modal';
import { Input } from '../../components/Form/Input';
import { useToast } from '../../contexts/ToastContext';
import type { Bank } from '../../lib/types';

export function Banks() {
  const { banks, loading, error, createBank, updateBank, deleteBank } = useBanks();
  const { showError, showSuccess, showConfirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formName, setFormName] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const filteredBanks = useMemo(() => {
    if (!searchTerm) return banks;
    const term = searchTerm.toLowerCase();
    return banks.filter((bank) => bank.name.toLowerCase().includes(term));
  }, [banks, searchTerm]);

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

  const columns: Column<Bank>[] = [
    {
      key: 'name',
      label: 'Bank Name',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Created At',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading && banks.length === 0) {
    return <div>Loading...</div>;
  }

  if (error && banks.length === 0) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Banks</h1>
        <button onClick={handleAdd} className="primary">
          Add Bank
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="Search banks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
      </div>

      <Table
        data={filteredBanks}
        columns={columns}
        keyField="id"
        actions={(bank) => (
          <>
            <button onClick={() => handleEdit(bank)} style={{ marginRight: '8px' }}>
              Edit
            </button>
            <button onClick={() => handleDelete(bank)} className="danger">
              Delete
            </button>
          </>
        )}
        emptyMessage="No banks found"
      />

      <Modal
        isOpen={showForm}
        onClose={handleFormCancel}
        title={editingBank ? 'Edit Bank' : 'Add Bank'}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <Input
              label="Bank Name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              disabled={formLoading}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={handleFormCancel} disabled={formLoading}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={formLoading}>
              {editingBank ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

