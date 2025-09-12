import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentUserCompanyId } from '../lib/supabase';

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: any;
  new_data: any;
  changed_by: string;
  company_id: string;
  changed_at: string;
  changed_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface AuditInfo {
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  created_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
  updated_by_user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export function useAuditLogs(tableName: string, recordId?: string) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) {
      setAuditLogs([]);
      setLoading(false);
      return;
    }

    fetchAuditLogs();
  }, [tableName, recordId]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentUserCompanyId();
      
      if (!companyId) {
        throw new Error('No company ID found');
      }

      // Fetch audit logs (no join)
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .eq('company_id', companyId)
        .order('changed_at', { ascending: false });

      if (logsError) throw logsError;

      const rawLogs: AuditLog[] = logs || [];

      // Fetch users for changed_by
      const userIds = Array.from(new Set(rawLogs.map(l => l.changed_by).filter(Boolean))) as string[];
      let usersById: Record<string, { first_name: string; last_name: string; email: string }> = {};
      if (userIds.length) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, email')
          .in('id', userIds);
        if (usersError) throw usersError;
        (usersData || []).forEach((u: any) => {
          usersById[u.id] = { first_name: u.first_name, last_name: u.last_name, email: u.email };
        });
      }

      const merged = rawLogs.map(l => ({
        ...l,
        changed_by_user: l.changed_by ? usersById[l.changed_by] : undefined
      }));

      setAuditLogs(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { auditLogs, loading, error, refetch: fetchAuditLogs };
}

export function useAuditInfo(tableName: string, recordId?: string) {
  const [auditInfo, setAuditInfo] = useState<AuditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recordId) {
      setAuditInfo(null);
      setLoading(false);
      return;
    }

    fetchAuditInfo();
  }, [tableName, recordId]);

  const fetchAuditInfo = async () => {
    try {
      setLoading(true);
      const companyId = await getCurrentUserCompanyId();
      
      if (!companyId) {
        throw new Error('No company ID found');
      }

      // Get the record with audit fields
      const { data: record, error: recordError } = await supabase
        .from(tableName)
        .select(`
          created_at,
          updated_at,
          created_by,
          updated_by
        `)
        .eq('id', recordId)
        .eq('company_id', companyId)
        .single();

      if (recordError) throw recordError;

      // Get user information separately
      const userIds = [record.created_by, record.updated_by].filter(Boolean);
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      const getUserById = (id: string) => users?.find(u => u.id === id);

      const auditRecord: AuditInfo = {
        ...record,
        created_by_user: record.created_by ? getUserById(record.created_by) || undefined : undefined,
        updated_by_user: record.updated_by ? getUserById(record.updated_by) || undefined : undefined
      };

      setAuditInfo(auditRecord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { auditInfo, loading, error, refetch: fetchAuditInfo };
}

export function getChangeDescription(log: AuditLog): string {
  switch (log.operation) {
    case 'INSERT':
      return 'Record created';
    case 'DELETE':
      return 'Record deleted';
    case 'UPDATE':
      if (log.old_data && log.new_data) {
        const changes = getChangedFields(log.old_data, log.new_data);
        if (changes.length === 0) return 'No changes detected';
        if (changes.length === 1) return `Updated ${changes[0]}`;
        if (changes.length <= 3) return `Updated ${changes.join(', ')}`;
        return `Updated ${changes.length} fields`;
      }
      return 'Record updated';
    default:
      return 'Unknown operation';
  }
}

export function getChangedFields(oldData: any, newData: any): string[] {
  const changes: string[] = [];
  const excludeFields = ['updated_at', 'updated_by', 'created_at', 'created_by'];
  
  for (const key in newData) {
    if (excludeFields.includes(key)) continue;
    
    const oldValue = oldData[key];
    const newValue = newData[key];
    
    // Handle different data types
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      // Convert snake_case to readable format
      const readableKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      changes.push(readableKey);
    }
  }
  
  return changes;
}

export function getFieldChangeDetails(log: AuditLog, field: string): {
  oldValue: any;
  newValue: any;
  hasChanged: boolean;
} {
  if (!log.old_data || !log.new_data) {
    return {
      oldValue: null,
      newValue: null,
      hasChanged: false
    };
  }

  const oldValue = log.old_data[field];
  const newValue = log.new_data[field];
  const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

  return {
    oldValue,
    newValue,
    hasChanged
  };
}

export function formatAuditValue(value: any): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  return String(value);
}
