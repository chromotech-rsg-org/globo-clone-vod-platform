import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExportHistoryItem {
  id: string;
  user_id: string;
  table_name: string;
  file_name: string;
  filters: any;
  record_count: number | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export const useExportHistory = () => {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('export_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      // Fetch user names for each export
      const historyWithUsers = await Promise.all((data || []).map(async (item) => {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', item.user_id)
          .maybeSingle();
        
        return { ...item, user: userProfile };
      }));

      setHistory(historyWithUsers);
    } catch (err) {
      console.error('Error fetching export history:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = async (
    tableName: string,
    fileName: string,
    recordCount?: number,
    filters?: any
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error: insertError } = await supabase
        .from('export_history')
        .insert({
          user_id: user.id,
          table_name: tableName,
          file_name: fileName,
          record_count: recordCount,
          filters: filters || null,
        });

      if (insertError) throw insertError;

      // Refresh history
      await fetchHistory();
    } catch (err) {
      console.error('Error adding to export history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
    addToHistory,
  };
};
