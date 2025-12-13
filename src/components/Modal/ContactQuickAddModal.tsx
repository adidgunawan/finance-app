import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
        </DialogHeader>
        <ContactForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </DialogContent>
    </Dialog>
  );
}


