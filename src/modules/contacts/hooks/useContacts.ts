import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Contact } from '../../../lib/types';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setContacts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const createContact = async (contactData: {
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  }) => {
    try {
      const { data, error: createError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select()
        .single();

      if (createError) throw createError;
      await fetchContacts();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    try {
      const { error: updateError } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;
      await fetchContacts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteContact = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from('contacts').delete().eq('id', id);

      if (deleteError) throw deleteError;
      await fetchContacts();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    contacts,
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    refresh: fetchContacts,
  };
}

