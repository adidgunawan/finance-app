import { useState, useMemo, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useContacts } from './hooks/useContacts';
import { useSearch } from '../../contexts/SearchContext';
import { Table, Column } from '../../components/Table/Table';
import { HighlightText } from '../../components/Text/HighlightText';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageLoader } from '../../components/Layout/PageLoader';
import { ContactForm } from './ContactForm';
import { useToast } from '../../contexts/ToastContext';
import type { Contact } from '../../lib/types';

export function Contacts() {
  const { contacts, loading, error, createContact, updateContact, deleteContact } = useContacts();
  const { showError, showSuccess, showConfirm } = useToast();
  const { searchTerm, setSearchTerm } = useSearch();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Clear search on mount/unmount
  useEffect(() => {
    setSearchTerm('');
    return () => setSearchTerm('');
  }, [setSearchTerm]);

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
      render: (value) => <HighlightText text={value} highlight={searchTerm} />,
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: true,
      render: (value) => value ? <HighlightText text={value} highlight={searchTerm} /> : '-',
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value) => value ? <HighlightText text={value} highlight={searchTerm} /> : '-',
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
        <button onClick={handleAdd} className="primary">
          Add Contact
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
      </div>

      <Table
        data={filteredContacts}
        columns={columnsWithActions}
        onRowClick={undefined}
        emptyMessage="No contacts found. Add your first contact."
      />

      {showForm && (
        <Dialog open={showForm} onOpenChange={handleFormCancel}>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
            </DialogHeader>
          <ContactForm
            contact={editingContact || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}

