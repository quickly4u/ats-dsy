import { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentUserCompanyId } from '../lib/supabase';
import { useToast } from './useToast';

export interface Contact {
  id: string;
  companyId: string;
  clientId?: string;
  userId?: string;
  contactType: 'external' | 'internal';
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary: boolean;
  isActive: boolean;
  avatar?: string;
  linkedinUrl?: string;
  notes?: string;
  spocLevel?: 'primary' | 'secondary';
  createdAt: Date;
  updatedAt: Date;
  // Populated data
  client?: any;
  user?: any;
  assignedClients?: any[];
}

export interface CreateContactInput {
  contactType: 'external' | 'internal';
  clientId?: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  linkedinUrl?: string;
  notes?: string;
  spocLevel?: 'primary' | 'secondary';
  assignedClientIds?: string[]; // For internal contacts
}

export interface UpdateContactInput {
  clientId?: string; // allow changing client for external contact
  userId?: string;   // allow changing user for internal contact
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  linkedinUrl?: string;
  notes?: string;
  spocLevel?: 'primary' | 'secondary';
  assignedClientIds?: string[]; // For internal contacts
}

export const useContacts = (contactType?: 'external' | 'internal' | 'all') => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const { success: showSuccess, error: showError } = useToast();

  const refetch = useCallback(() => setReloadToken(t => t + 1), []);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setIsLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }

        // Build query based on contact type filter
        let query = supabase
          .from('contacts')
          .select(`
            id, company_id, client_id, user_id, contact_type,
            first_name, last_name, email, phone, designation, department,
            is_primary, is_active, avatar, linkedin_url, notes, spoc_level,
            created_at, updated_at
          `)
          .eq('company_id', companyId);

        if (contactType && contactType !== 'all') {
          query = query.eq('contact_type', contactType);
        }

        const { data: contactRows, error: contactError } = await query
          .order('created_at', { ascending: false });

        if (contactError) throw contactError;

        // Fetch related data
        const clientIds = [...new Set(contactRows?.map(c => c.client_id).filter(Boolean) || [])];
        const userIds = [...new Set(contactRows?.map(c => c.user_id).filter(Boolean) || [])];

        // Fetch clients
        let clientsMap = new Map();
        if (clientIds.length > 0) {
          const { data: clients, error: clientsError } = await supabase
            .from('clients')
            .select('id, name, company_name, industry, website, logo')
            .in('id', clientIds);
          
          if (clientsError) throw clientsError;
          clientsMap = new Map(clients?.map(c => [c.id, c]) || []);
        }

        // Fetch users
        let usersMap = new Map();
        if (userIds.length > 0) {
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, first_name, last_name, avatar')
            .in('id', userIds);
          
          if (usersError) throw usersError;
          usersMap = new Map(users?.map(u => [u.id, u]) || []);
        }

        // Fetch client assignments for internal contacts
        const internalContactIds = contactRows?.filter(c => c.contact_type === 'internal').map(c => c.id) || [];
        let assignmentsMap = new Map();
        if (internalContactIds.length > 0) {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('contact_client_assignments')
            .select(`
              contact_id, client_id,
              clients (id, name, company_name)
            `)
            .in('contact_id', internalContactIds);
          
          if (assignmentsError) throw assignmentsError;
          
          // Group assignments by contact_id
          assignments?.forEach(assignment => {
            if (!assignmentsMap.has(assignment.contact_id)) {
              assignmentsMap.set(assignment.contact_id, []);
            }
            assignmentsMap.get(assignment.contact_id).push(assignment.clients);
          });
        }

        // Transform data
        const transformedContacts: Contact[] = (contactRows || []).map(row => ({
          id: row.id,
          companyId: row.company_id,
          clientId: row.client_id,
          userId: row.user_id,
          contactType: row.contact_type as 'external' | 'internal',
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          phone: row.phone,
          designation: row.designation,
          department: row.department,
          isPrimary: row.is_primary,
          isActive: row.is_active,
          avatar: row.avatar,
          linkedinUrl: row.linkedin_url,
          notes: row.notes,
          spocLevel: row.spoc_level as 'primary' | 'secondary' | undefined,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          client: row.client_id ? clientsMap.get(row.client_id) : undefined,
          user: row.user_id ? usersMap.get(row.user_id) : undefined,
          assignedClients: assignmentsMap.get(row.id) || [],
        }));

        setContacts(transformedContacts);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching contacts:', err);
        setError(err.message || 'Failed to fetch contacts');
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [reloadToken, contactType]);

  const createContact = useCallback(async (input: CreateContactInput) => {
    try {
      const companyId = await getCurrentUserCompanyId();
      if (!companyId) throw new Error('User company not found');

      const contactData = {
        company_id: companyId,
        client_id: input.clientId || null,
        user_id: input.userId || null,
        contact_type: input.contactType,
        first_name: input.firstName,
        last_name: input.lastName,
        email: input.email,
        phone: input.phone || null,
        designation: input.designation || null,
        department: input.department || null,
        is_primary: input.isPrimary || false,
        is_active: input.isActive !== false,
        linkedin_url: input.linkedinUrl || null,
        notes: input.notes || null,
        spoc_level: input.spocLevel || null,
      };

      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert(contactData)
        .select('id')
        .single();

      if (contactError) throw contactError;

      // Handle client assignments for internal contacts
      if (input.contactType === 'internal' && input.assignedClientIds?.length) {
        const assignments = input.assignedClientIds.map(clientId => ({
          contact_id: contact.id,
          client_id: clientId,
        }));

        const { error: assignmentError } = await supabase
          .from('contact_client_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;
      }

      showSuccess(`${input.contactType === 'external' ? 'External contact' : 'Internal SPOC'} created successfully`);
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error creating contact:', err);
      showError(err.message || 'Failed to create contact');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  const updateContact = useCallback(async (id: string, input: UpdateContactInput) => {
    try {
      const updates: any = {};
      if (input.clientId !== undefined) updates.client_id = input.clientId || null;
      if (input.userId !== undefined) updates.user_id = input.userId || null;
      if (input.firstName !== undefined) updates.first_name = input.firstName;
      if (input.lastName !== undefined) updates.last_name = input.lastName;
      if (input.email !== undefined) updates.email = input.email;
      if (input.phone !== undefined) updates.phone = input.phone;
      if (input.designation !== undefined) updates.designation = input.designation;
      if (input.department !== undefined) updates.department = input.department;
      if (input.isPrimary !== undefined) updates.is_primary = input.isPrimary;
      if (input.isActive !== undefined) updates.is_active = input.isActive;
      if (input.linkedinUrl !== undefined) updates.linkedin_url = input.linkedinUrl;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.spocLevel !== undefined) updates.spoc_level = input.spocLevel;

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;
      }

      // Handle client assignments for internal contacts
      if (input.assignedClientIds !== undefined) {
        // Remove existing assignments
        await supabase
          .from('contact_client_assignments')
          .delete()
          .eq('contact_id', id);

        // Add new assignments
        if (input.assignedClientIds.length > 0) {
          const assignments = input.assignedClientIds.map(clientId => ({
            contact_id: id,
            client_id: clientId,
          }));

          const { error: assignmentError } = await supabase
            .from('contact_client_assignments')
            .insert(assignments);

          if (assignmentError) throw assignmentError;
        }
      }

      showSuccess('Contact updated successfully');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating contact:', err);
      showError(err.message || 'Failed to update contact');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  const deleteContact = useCallback(async (id: string) => {
    try {
      // Remove client assignments first
      await supabase
        .from('contact_client_assignments')
        .delete()
        .eq('contact_id', id);

      // Delete contact
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showSuccess('Contact removed successfully');
      refetch();
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      showError(err.message || 'Failed to remove contact');
      return { error: err.message };
    }
  }, [showSuccess, showError, refetch]);

  // Convenience methods for specific contact types
  const externalContacts = contacts.filter(c => c.contactType === 'external');
  const internalContacts = contacts.filter(c => c.contactType === 'internal');

  // Statistics
  const stats = {
    total: contacts.length,
    external: externalContacts.length,
    internal: internalContacts.length,
    active: contacts.filter(c => c.isActive).length,
    primary: contacts.filter(c => c.isPrimary).length,
  };

  return {
    contacts,
    externalContacts,
    internalContacts,
    stats,
    isLoading,
    error,
    refetch,
    createContact,
    updateContact,
    deleteContact,
  };
};
