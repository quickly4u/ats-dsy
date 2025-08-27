import { useEffect, useState, useCallback } from 'react';
import { supabase, getCurrentUserCompanyId } from '../lib/supabase';
import type { ExternalSPOC, InternalSPOC, Client, User } from '../types';

// Form payloads
export type ExternalSPOCInput = {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  department?: string;
  isPrimary: boolean;
  linkedinUrl?: string;
  notes?: string;
  isActive: boolean;
};

export type InternalSPOCInput = {
  userId: string;
  level: 'primary' | 'secondary';
  clientIds: string[];
  isActive: boolean;
};

// Fetch helpers
const fetchClientsByIds = async (ids: string[]): Promise<Client[]> => {
  if (!ids.length) return [] as Client[];
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) return [] as Client[];
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      company_name,
      industry,
      website,
      logo,
      description,
      status,
      contact_email,
      contact_phone,
      address_street,
      address_city,
      address_state,
      address_country,
      address_zip,
      contract_start_date,
      contract_end_date,
      contract_type,
      payment_terms,
      contract_details,
      created_at,
      updated_at,
      company_id
    `)
    .in('id', ids)
    .eq('company_id', companyId);
  if (error) throw error;
  const rows = data || [];
  return rows.map((c: any) => ({
    id: c.id,
    name: c.name,
    companyName: c.company_name || c.name,
    industry: c.industry || 'Unknown',
    website: c.website || undefined,
    logo: c.logo || undefined,
    description: c.description || undefined,
    address: {
      street: c.address_street || '',
      city: c.address_city || '',
      state: c.address_state || '',
      country: c.address_country || '',
      zipCode: c.address_zip || '',
    },
    contactInfo: {
      email: c.contact_email || '',
      phone: c.contact_phone || '',
    },
    contractDetails: {
      startDate: c.contract_start_date ? new Date(c.contract_start_date) : new Date(),
      endDate: c.contract_end_date ? new Date(c.contract_end_date) : undefined,
      contractType: (c.contract_type as any) || 'retainer',
      paymentTerms: c.payment_terms || '',
      isExclusive: (c.contract_details?.isExclusive ?? false),
      includesBackgroundCheck: (c.contract_details?.includesBackgroundCheck ?? false),
      hasReplacementGuarantee: (c.contract_details?.hasReplacementGuarantee ?? false),
      replacementGuaranteeDays: c.contract_details?.replacementGuaranteeDays,
      hasConfidentialityAgreement: (c.contract_details?.hasConfidentialityAgreement ?? false),
      additionalTerms: c.contract_details?.additionalTerms,
    },
    status: (c.status as any) || 'active',
    totalJobs: 0,
    activeJobs: 0,
    successfulPlacements: 0,
    createdAt: c.created_at ? new Date(c.created_at) : new Date(),
    updatedAt: c.updated_at ? new Date(c.updated_at) : new Date(),
  } as Client));
};

const fetchUsersByIds = async (ids: string[]): Promise<Record<string, User>> => {
  if (!ids.length) return {};
  const companyId = await getCurrentUserCompanyId();
  if (!companyId) return {};
  
  const { data, error } = await supabase
    .from('users')
    .select(`id, email, first_name, last_name, avatar, company_id, is_active, created_at`)
    .in('id', ids)
    .eq('company_id', companyId);
  if (error) throw error;
  const map: Record<string, User> = {};
  (data || []).forEach((u: any) => {
    map[u.id] = {
      id: u.id,
      email: u.email || '',
      firstName: u.first_name || '',
      lastName: u.last_name || '',
      phone: '',
      avatar: u.avatar || undefined,
      company: {
        id: u.company_id || 'unknown',
        name: '',
        slug: '',
        subscriptionPlan: 'free',
        createdAt: new Date(),
      },
      roles: [],
      isActive: !!u.is_active,
      createdAt: u.created_at ? new Date(u.created_at) : new Date(),
    } as User;
  });
  return map;
};

export const useExternalSpocs = () => {
  const [externalSpocs, setExternalSpocs] = useState<ExternalSPOC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = () => setReloadToken(t => t + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        const { data, error } = await supabase
          .from('external_spocs')
          .select(`
            id, company_id, client_id, first_name, last_name, email, phone,
            designation, department, is_primary, avatar, linkedin_url, notes,
            is_active, created_at, updated_at
          `)
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        const rows = data || [];
        const clientIds = Array.from(new Set(rows.map((r: any) => r.client_id)));
        const clients = await fetchClientsByIds(clientIds);
        const clientMap = new Map(clients.map(c => [c.id, c]));
        const mapped: ExternalSPOC[] = rows.map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          client: clientMap.get(r.client_id) as Client,
          firstName: r.first_name,
          lastName: r.last_name,
          email: r.email,
          phone: r.phone || undefined,
          designation: r.designation,
          department: r.department || undefined,
          isPrimary: !!r.is_primary,
          avatar: r.avatar || undefined,
          linkedinUrl: r.linkedin_url || undefined,
          notes: r.notes || undefined,
          isActive: !!r.is_active,
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          updatedAt: r.updated_at ? new Date(r.updated_at) : new Date(),
        }));
        setExternalSpocs(mapped);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load external SPOCs:', err);
        setError(err.message || 'Failed to load external SPOCs');
        setExternalSpocs([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reloadToken]);

  const createExternal = useCallback(async (input: ExternalSPOCInput) => {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) throw new Error('Missing company context');
    const { error } = await supabase.from('external_spocs').insert({
      company_id: companyId,
      client_id: input.clientId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone ?? null,
      designation: input.designation,
      department: input.department ?? null,
      is_primary: input.isPrimary,
      avatar: null,
      linkedin_url: input.linkedinUrl ?? null,
      notes: input.notes ?? null,
      is_active: input.isActive,
    });
    if (error) throw error;
    refetch();
  }, []);

  const updateExternal = useCallback(async (id: string, input: Partial<ExternalSPOCInput>) => {
    const patch: any = {};
    if (input.clientId !== undefined) patch.client_id = input.clientId;
    if (input.firstName !== undefined) patch.first_name = input.firstName;
    if (input.lastName !== undefined) patch.last_name = input.lastName;
    if (input.email !== undefined) patch.email = input.email;
    if (input.phone !== undefined) patch.phone = input.phone ?? null;
    if (input.designation !== undefined) patch.designation = input.designation;
    if (input.department !== undefined) patch.department = input.department ?? null;
    if (input.isPrimary !== undefined) patch.is_primary = input.isPrimary;
    if (input.linkedinUrl !== undefined) patch.linkedin_url = input.linkedinUrl ?? null;
    if (input.notes !== undefined) patch.notes = input.notes ?? null;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    const { error } = await supabase.from('external_spocs').update(patch).eq('id', id);
    if (error) throw error;
    refetch();
  }, []);

  const deleteExternal = useCallback(async (id: string) => {
    const { error } = await supabase.from('external_spocs').delete().eq('id', id);
    if (error) throw error;
    refetch();
  }, []);

  return { externalSpocs, isLoading, error, refetch, createExternal, updateExternal, deleteExternal };
};

export const useInternalSpocs = () => {
  const [internalSpocs, setInternalSpocs] = useState<InternalSPOC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = () => setReloadToken(t => t + 1);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const companyId = await getCurrentUserCompanyId();
        if (!companyId) {
          throw new Error('User company not found');
        }
        
        const { data, error } = await supabase
          .from('internal_spocs')
          .select(`id, company_id, user_id, level, is_active, assigned_at, assigned_by`)
          .eq('company_id', companyId)
          .order('assigned_at', { ascending: false });
        if (error) throw error;
        const rows = data || [];
        const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
        const userMap = await fetchUsersByIds(userIds);

        const spocIds = (rows as any[]).map(r => r.id);
        let clientMapBySpoc: Record<string, string[]> = {};
        if (spocIds.length) {
          const { data: mapRows, error: mapErr } = await supabase
            .from('internal_spoc_clients')
            .select('internal_spoc_id, client_id')
            .in('internal_spoc_id', spocIds);
          if (mapErr) throw mapErr;
          clientMapBySpoc = (mapRows || []).reduce((acc: Record<string, string[]>, r: any) => {
            acc[r.internal_spoc_id] = acc[r.internal_spoc_id] || [];
            acc[r.internal_spoc_id].push(r.client_id);
            return acc;
          }, {});
        }

        const uniqueClientIds = Array.from(new Set(Object.values(clientMapBySpoc).flat()));
        const clients = await fetchClientsByIds(uniqueClientIds);
        const clientMap = new Map(clients.map(c => [c.id, c]));

        const mapped: InternalSPOC[] = rows.map((r: any) => {
          const cids = clientMapBySpoc[r.id] || [];
          return {
            id: r.id,
            userId: r.user_id,
            user: userMap[r.user_id],
            level: (r.level as 'primary' | 'secondary'),
            clientIds: cids,
            clients: cids.map(id => clientMap.get(id)!).filter(Boolean) as Client[],
            isActive: !!r.is_active,
            assignedAt: r.assigned_at ? new Date(r.assigned_at) : new Date(),
            assignedBy: r.assigned_by || '',
          } as InternalSPOC;
        });
        setInternalSpocs(mapped);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load internal SPOCs:', err);
        setError(err.message || 'Failed to load internal SPOCs');
        setInternalSpocs([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [reloadToken]);

  const createInternal = useCallback(async (input: InternalSPOCInput) => {
    const companyId = await getCurrentUserCompanyId();
    if (!companyId) throw new Error('Missing company context');
    const { data: authUser } = await supabase.auth.getUser();
    const assignedBy = authUser.user?.id ?? null;

    const { data, error } = await supabase.from('internal_spocs').insert({
      company_id: companyId,
      user_id: input.userId,
      level: input.level,
      is_active: input.isActive,
      assigned_by: assignedBy,
    }).select('id').single();
    if (error) throw error;
    const newId = (data as any)?.id as string;

    if (input.clientIds?.length) {
      const rows = input.clientIds.map(cid => ({ internal_spoc_id: newId, client_id: cid }));
      const { error: mapErr } = await supabase.from('internal_spoc_clients').insert(rows);
      if (mapErr) throw mapErr;
    }
    refetch();
  }, []);

  const updateInternal = useCallback(async (id: string, input: Partial<InternalSPOCInput>) => {
    const patch: any = {};
    if (input.userId !== undefined) patch.user_id = input.userId;
    if (input.level !== undefined) patch.level = input.level;
    if (input.isActive !== undefined) patch.is_active = input.isActive;
    if (Object.keys(patch).length) {
      const { error } = await supabase.from('internal_spocs').update(patch).eq('id', id);
      if (error) throw error;
    }
    if (input.clientIds) {
      // resync assignments
      const { data: current, error: curErr } = await supabase
        .from('internal_spoc_clients')
        .select('client_id')
        .eq('internal_spoc_id', id);
      if (curErr) throw curErr;
      const existing = new Set((current || []).map((r: any) => r.client_id as string));
      const desired = new Set(input.clientIds);
      const toAdd = [...desired].filter(x => !existing.has(x));
      const toRemove = [...existing].filter(x => !desired.has(x));
      if (toAdd.length) {
        const { error: addErr } = await supabase.from('internal_spoc_clients').insert(toAdd.map(cid => ({ internal_spoc_id: id, client_id: cid })));
        if (addErr) throw addErr;
      }
      if (toRemove.length) {
        const { error: delErr } = await supabase
          .from('internal_spoc_clients')
          .delete()
          .eq('internal_spoc_id', id)
          .in('client_id', toRemove);
        if (delErr) throw delErr;
      }
    }
    refetch();
  }, []);

  const deleteInternal = useCallback(async (id: string) => {
    const { error } = await supabase.from('internal_spocs').delete().eq('id', id);
    if (error) throw error;
    refetch();
  }, []);

  return { internalSpocs, isLoading, error, refetch, createInternal, updateInternal, deleteInternal };
};
