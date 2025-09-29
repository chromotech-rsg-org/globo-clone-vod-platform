import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_values: any;
  new_values: any;
  user_id: string | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  } | null;
}

interface UseAuditLogsProps {
  table?: string;
  recordId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  action?: string;
}

export const useAuditLogs = (filters: UseAuditLogsProps = {}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.table) {
        query = query.eq('table_name', filters.table);
      }
      if (filters.recordId) {
        query = query.eq('record_id', filters.recordId);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error: fetchError } = await query.limit(500);

      if (fetchError) throw fetchError;

      // Fetch user names separately for efficiency
      const logsWithUsers = await Promise.all((data || []).map(async (log) => {
        if (log.user_id) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', log.user_id)
            .maybeSingle();
          return { ...log, user: userProfile };
        }
        return { ...log, user: null };
      }));

      setLogs(logsWithUsers);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters.table, filters.recordId, filters.userId, filters.action, filters.dateFrom, filters.dateTo]);

  const getChangesSummary = (log: AuditLog) => {
    if (log.action === 'INSERT') {
      return 'Registro criado';
    } else if (log.action === 'DELETE') {
      return 'Registro excluído';
    } else if (log.action === 'UPDATE' && log.old_values && log.new_values) {
      const changes = [];
      const oldVals = log.old_values as Record<string, any>;
      const newVals = log.new_values as Record<string, any>;
      
      for (const key in newVals) {
        if (oldVals[key] !== newVals[key] && key !== 'updated_at') {
          changes.push(`${key}: ${oldVals[key]} → ${newVals[key]}`);
        }
      }
      return changes.length > 0 ? changes.join(', ') : 'Valores atualizados';
    }
    return log.action;
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'text-green-400';
      case 'UPDATE':
        return 'text-yellow-400';
      case 'DELETE':
        return 'text-red-400';
      default:
        return 'text-admin-table-text';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'Criado';
      case 'UPDATE':
        return 'Atualizado';
      case 'DELETE':
        return 'Excluído';
      default:
        return action;
    }
  };

  return {
    logs,
    loading,
    error,
    refetch: fetchLogs,
    getChangesSummary,
    getActionColor,
    getActionLabel
  };
};