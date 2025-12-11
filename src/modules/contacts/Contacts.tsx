import { useState, useMemo } from 'react';
import { useContacts } from './hooks/useContacts';
import { Table, Column } from '../../components/Table/Table';
import { Modal } from '../../components/Modal/Modal';
import { PageLoader } from '../../components/Layout/PageLoader';
import { ContactForm } from './ContactForm';
import { useToast } from '../../contexts/ToastContext';
import type { Contact } from '../../lib/types';

export function Contacts() {
  const { contacts, loading, error, createContact, updateContact, deleteContact } = useContacts();
  const { showError, showSuccess, showConfirm } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const term = searchTerm.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(term) ||
        contact.phone?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term)
    );
  }, [contacts, searchTerm]);

  const handleDelete = async (contact: Contact) => {
    showConfirm(
      `Are you sure you want to delete ${contact.name}?`,
      async () => {
        try {
          await deleteContact(contact.id);
          showSuccess('Contact deleted successfully');
        } catch (err: any) {
          showError(err.message || 'Failed to delete contact');
        }
      }
    );
  };

  const handleAdd = () => {
    setEditingContact(null);
    setShowForm(true);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormSubmit = async (data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }) => {
    if (editingContact) {
      await updateContact(editingContact.id, data);
    } else {
      await createContact(data);
    }
    setShowForm(false);
    setEditingContact(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const columns: Column<Contact>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'address',
      label: 'Address',
      render: (value) => value || '-',
    },
  ];

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  const columnsWithActions: Column<Contact>[] = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      width: '150px',
      render: (_value, contact) => (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => handleEdit(contact)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Edit
          </button>
          <button
            className="danger"
            onClick={() => handleDelete(contact)}
            style={{ fontSize: '12px', padding: '4px 8px' }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <button className="primary" onClick={handleAdd}>
          Add Contact
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '100%', width: '100%' }}
        />
      </div>

      <Table
        data={filteredContacts}
        columns={columnsWithActions}
        onRowClick={undefined}
        onEdit={undefined}
        onDelete={undefined}
        emptyMessage="No contacts found. Add your first contact to get started."
      />

      {showForm && (
        <Modal
          isOpen={showForm}
          onClose={handleFormCancel}
          title={editingContact ? 'Edit Contact' : 'Add Contact'}
        >
          <ContactForm
            contact={editingContact || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </Modal>
      )}
    </div>
  );
}

