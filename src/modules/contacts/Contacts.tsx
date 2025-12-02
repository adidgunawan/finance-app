import React, { useState, useMemo } from 'react';
import { useContacts } from './hooks/useContacts';
import { Table, Column } from '../../components/Table/Table';
import type { Contact } from '../../lib/types';

export function Contacts() {
  const { contacts, loading, error, createContact, updateContact, deleteContact } = useContacts();
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleInlineEdit = async (contact: Contact, field: string, value: any) => {
    try {
      await updateContact(contact.id, { [field]: value });
    } catch (err) {
      console.error('Failed to update contact:', err);
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await deleteContact(contact.id);
      } catch (err: any) {
        alert(err.message || 'Failed to delete contact');
      }
    }
  };

  const handleAddRow = async () => {
    try {
      await createContact({ name: 'New Contact' });
    } catch (err: any) {
      alert(err.message || 'Failed to create contact');
    }
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div style={{ color: 'var(--error)' }}>Error: {error}</div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <button className="primary" onClick={handleAddRow}>
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
        columns={columns}
        onEdit={handleInlineEdit}
        onDelete={handleDelete}
        emptyMessage="No contacts found. Add your first contact to get started."
      />
    </div>
  );
}

