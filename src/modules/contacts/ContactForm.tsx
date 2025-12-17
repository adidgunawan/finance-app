import React, { useState } from 'react';
import { Input } from '../../components/Form/Input';
import { useToast } from '../../contexts/ToastContext';
import type { Contact } from '../../lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (data: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export function ContactForm({ contact, onSubmit, onCancel }: ContactFormProps) {
  const { showError } = useToast();
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState(contact?.phone || '');
  const [email, setEmail] = useState(contact?.email || '');
  const [address, setAddress] = useState(contact?.address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      showError('Name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contact name"
        required
        disabled={loading}
      />

      <Input
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Phone number"
        disabled={loading}
      />

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        disabled={loading}
      />

      <div className="space-y-2">
        <div className="text-sm font-medium">Address</div>
        <Textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          disabled={loading}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : contact ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

