import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useDataExport } from '@/hooks/useDataExport';
import AdminLayout from '@/components/AdminLayout';

const AUDIT_TABLES = [
  { value: '', label: 'Todas as tabelas' },
  { value: 'auctions', label: 'Leilões' },
  { value: 'auction_items', label: 'Itens do Leilão' },
  { value: 'bids', label: 'Lances' },
  { value: 'profiles', label: 'Perfis' },
  { value: 'subscriptions', label: 'Assinaturas' },
  { value: 'auction_registrations', label: 'Registros' }
];

const AUDIT_ACTIONS = [
  { value: '', label: 'Todas as ações' },
  { value: 'INSERT', label: 'Criação' },
  { value: 'UPDATE', label: 'Atualização' },
  { value: 'DELETE', label: 'Exclusão' }
];

const Auditoria: React.FC = () => {
  const [filters, setFilters] = useState({
    table: '',
    action: '',
    userId: '',
    dateFrom: '',
    dateTo: ''
  });

  const { logs, loading, error, getChangesSummary, getActionColor, getActionLabel } = useAuditLogs({
    table: filters.table || undefined,
    userId: filters.userId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined
  });

  const { exportToCSV, isExporting } = useDataExport();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      table: '',
      action: '',
      userId: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleExport = () => {
    exportToCSV({
      table: 'audit_logs',
      fileName: `auditoria_${new Date().toISOString().split('T')[0]}.csv`,
      filters: Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )
    });
  };

  const filteredLogs = logs.filter(log => {
    if (filters.action && filters.action !== 'all' && log.action !== filters.action) return false;
    return true;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-admin-table-text">Auditoria do Sistema</h1>
            <p className="text-admin-muted-foreground">
              Acompanhe todas as alterações realizadas no sistema
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-admin-table-text mb-2 block">
                  Tabela
                </label>
                <Select value={filters.table} onValueChange={(value) => handleFilterChange('table', value)}>
                  <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                    <SelectValue placeholder="Selecionar tabela" />
                  </SelectTrigger>
                    <SelectContent className="bg-admin-content-bg border-admin-border">
                    {AUDIT_TABLES.map(table => (
                      <SelectItem 
                        key={table.value || 'all'} 
                        value={table.value || 'all'} 
                        className="text-admin-table-text"
                      >
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-admin-table-text mb-2 block">
                  Ação
                </label>
                <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                  <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                    <SelectValue placeholder="Selecionar ação" />
                  </SelectTrigger>
                    <SelectContent className="bg-admin-content-bg border-admin-border">
                    {AUDIT_ACTIONS.map(action => (
                      <SelectItem 
                        key={action.value || 'all'} 
                        value={action.value || 'all'} 
                        className="text-admin-table-text"
                      >
                        {action.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-admin-table-text mb-2 block">
                  Data Inicial
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-admin-table-text mb-2 block">
                  Data Final
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                />
              </div>

              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="w-full text-admin-table-text border-admin-border"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Logs */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text">
              Logs de Auditoria ({filteredLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full bg-gray-800" />
                    <Skeleton className="h-4 w-1/3 bg-gray-800" />
                    <Skeleton className="h-4 w-1/4 bg-gray-800" />
                    <Skeleton className="h-4 w-1/5 bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-400 py-8">
                Erro ao carregar logs: {error}
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-admin-muted-foreground py-8">
                Nenhum log encontrado com os filtros aplicados
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border border-admin-border rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getActionColor(log.action)} border-current`}>
                            {getActionLabel(log.action)}
                          </Badge>
                          <span className="text-admin-table-text font-medium">
                            {log.table_name}
                          </span>
                          <span className="text-admin-muted-foreground text-sm">
                            {log.user?.name || 'Sistema'}
                          </span>
                        </div>
                        
                        <div className="text-admin-table-text mb-2">
                          {getChangesSummary(log)}
                        </div>
                        
                        <div className="text-admin-muted-foreground text-sm">
                          {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-admin-muted-foreground">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-admin-content-bg border-admin-border max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-admin-table-text">
                              Detalhes da Auditoria
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-admin-table-text mb-2">Informações Gerais</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-admin-muted-foreground">Tabela:</span>
                                  <div className="text-admin-table-text">{log.table_name}</div>
                                </div>
                                <div>
                                  <span className="text-admin-muted-foreground">Ação:</span>
                                  <div className="text-admin-table-text">{getActionLabel(log.action)}</div>
                                </div>
                                <div>
                                  <span className="text-admin-muted-foreground">Usuário:</span>
                                  <div className="text-admin-table-text">{log.user?.name || 'Sistema'}</div>
                                </div>
                                <div>
                                  <span className="text-admin-muted-foreground">Data:</span>
                                  <div className="text-admin-table-text">
                                    {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {log.old_values && (
                              <div>
                                <h4 className="font-semibold text-admin-table-text mb-2">Valores Anteriores</h4>
                                <pre className="bg-gray-900 p-3 rounded text-xs text-admin-table-text overflow-auto">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.new_values && (
                              <div>
                                <h4 className="font-semibold text-admin-table-text mb-2">Novos Valores</h4>
                                <pre className="bg-gray-900 p-3 rounded text-xs text-admin-table-text overflow-auto">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Auditoria;