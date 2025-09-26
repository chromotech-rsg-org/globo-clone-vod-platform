import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ExportOptions {
  table: string;
  fileName?: string;
  columns?: string[];
  filters?: Record<string, any>;
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = async (options: ExportOptions) => {
    setIsExporting(true);
    try {
      let query = supabase.from(options.table).select(options.columns?.join(',') || '*');
      
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há dados para exportar com os filtros aplicados",
          variant: "destructive"
        });
        return;
      }

      // Converter para CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          }).join(',')
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', options.fileName || `${options.table}_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `${data.length} registros exportados com sucesso`
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportSelected = async (options: ExportOptions & { selectedIds: string[] }) => {
    if (options.selectedIds.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para exportar",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const { data, error } = await supabase
        .from(options.table)
        .select(options.columns?.join(',') || '*')
        .in('id', options.selectedIds);
      
      if (error) throw error;
      if (!data || data.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não foi possível encontrar os dados selecionados",
          variant: "destructive"
        });
        return;
      }

      // Converter para CSV
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return String(value);
          }).join(',')
        )
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', options.fileName || `${options.table}_selected_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Exportação concluída",
        description: `${data.length} registros selecionados exportados com sucesso`
      });
    } catch (error) {
      console.error('Error exporting selected data:', error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados selecionados",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToCSV,
    exportSelected,
    isExporting
  };
};