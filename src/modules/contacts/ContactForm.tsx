import React, { useState } from 'react';
import { Input } from '../../components/Form/Input';
import { useToast } from '../../contexts/ToastContext';
import type { Contact } from '../../lib/types';

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
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ marginBottom: '16px', padding: '8px', background: 'var(--error)', color: 'white', borderRadius: '4px', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Name *</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contact name"
          required
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Phone</label>
        <Input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address"
          disabled={loading}
          rows={3}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button type="button" onClick={onCancel} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Saving...' : contact ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}

