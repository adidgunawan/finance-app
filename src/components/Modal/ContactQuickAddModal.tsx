import React, { useState } from 'react';
import { Modal } from './Modal';
import { ContactForm } from '../../modules/contacts/ContactForm';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import type { Contact } from '../../lib/types';

interface ContactQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContactAdded: (contact: Contact) => void;
}

export function ContactQuickAddModal({ isOpen, onClose, onContactAdded }: ContactQuickAddModalProps) {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }) => {
    try {
      setLoading(true);
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      showSuccess('Contact added successfully');
      onContactAdded(contact);
      onClose();
    } catch (err: any) {
      showError(err.message || 'Failed to add contact');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Add New Contact">
      <ContactForm onSubmit={handleSubmit} onCancel={handleCancel} />
    </Modal>
  );
}


