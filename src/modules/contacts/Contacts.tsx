import { useState, useMemo, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useContacts } from './hooks/useContacts';
import { useSearch } from '../../contexts/SearchContext';
import { Table, Column } from '../../components/Table/Table';
import { HighlightText } from '../../components/Text/HighlightText';
import { Modal } from '../../components/Modal/Modal';
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
        <button onClick={handleAdd} className="primary desktop-only">
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
        mobileRenderer={(contact) => (
          <div
            onClick={() => handleEdit(contact)}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'transparent',
            }}
          >
            {/* Avatar / Icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '16px',
              marginRight: '12px',
              flexShrink: 0
            }}>
              {contact.name.charAt(0).toUpperCase()}
            </div>

            {/* Middle: Name & Info */}
            <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
              <div style={{
                fontWeight: '600',
                fontSize: '15px',
                color: 'var(--text-primary)',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                <HighlightText text={contact.name} highlight={searchTerm} />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {contact.phone || contact.email || 'No contact info'}
              </div>
            </div>

            {/* Right: Edit Action */}
            <div style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>
              Edit ›
            </div>
          </div>
        )}
      />


      {/* Mobile FAB */}
      <div className="mobile-only">
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          zIndex: 100
        }}>
          <button
            onClick={handleAdd}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(35, 131, 226, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            <FiPlus />
          </button>
        </div>
      </div>

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

