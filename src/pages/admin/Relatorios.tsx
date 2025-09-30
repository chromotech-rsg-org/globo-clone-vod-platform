import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useDataExport } from '@/hooks/useDataExport';
import { useExportHistory } from '@/hooks/useExportHistory';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AVAILABLE_TABLES = [
  { value: 'profiles', label: 'Usuários', description: 'Perfis de usuários do sistema' },
  { value: 'auctions', label: 'Leilões', description: 'Dados de leilões cadastrados' },
  { value: 'auction_items', label: 'Lotes', description: 'Itens/lotes dos leilões' },
  { value: 'bids', label: 'Lances', description: 'Histórico de lances realizados' },
  { value: 'auction_registrations', label: 'Habilitações', description: 'Registros de habilitação' },
  { value: 'subscriptions', label: 'Assinaturas', description: 'Assinaturas ativas e históricas' },
  { value: 'plans', label: 'Planos', description: 'Planos de assinatura' },
  { value: 'packages', label: 'Pacotes', description: 'Pacotes de produtos' },
  { value: 'coupons', label: 'Cupons', description: 'Cupons de desconto' },
  { value: 'client_documents', label: 'Documentos', description: 'Documentos de clientes' },
  { value: 'client_bid_limits', label: 'Limites de Lance', description: 'Limites de lance por cliente' },
  { value: 'customizations', label: 'Customizações', description: 'Personalizações do sistema' },
  { value: 'integration_settings', label: 'Integrações', description: 'Configurações de integração' },
  { value: 'audit_logs', label: 'Logs de Auditoria', description: 'Histórico de alterações' },
];

const Relatorios: React.FC = () => {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const { exportToCSV, isExporting } = useDataExport();
  const { history, loading: historyLoading, refetch } = useExportHistory();

  const handleExport = async () => {
    if (!selectedTable) {
      toast.error('Selecione uma tabela para exportar');
      return;
    }

    const tableInfo = AVAILABLE_TABLES.find(t => t.value === selectedTable);
    
    await exportToCSV({
      table: selectedTable,
      fileName: `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`,
      tableName: tableInfo?.label || selectedTable,
    });

    // Refresh history after export
    setTimeout(() => refetch(), 1000);
    
    toast.success('Exportação realizada com sucesso!');
  };

  return (
    <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-admin-table-text">Relatórios e Exportações</h1>
            <p className="text-admin-muted-foreground">
              Exporte dados do sistema em formato CSV
            </p>
          </div>
        </div>

        {/* Export Section */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-admin-table-text mb-2 block">
                  Selecione a tabela para exportar
                </label>
                <div className="flex gap-4">
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger className="flex-1 bg-admin-content-bg border-admin-border text-admin-table-text">
                      <SelectValue placeholder="Escolha uma tabela..." />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-content-bg border-admin-border">
                      {AVAILABLE_TABLES.map((table) => (
                        <SelectItem 
                          key={table.value} 
                          value={table.value}
                          className="text-admin-table-text"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{table.label}</span>
                            <span className="text-xs text-admin-muted-foreground">{table.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    onClick={handleExport}
                    disabled={!selectedTable || isExporting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? 'Exportando...' : 'Exportar'}
                  </Button>
                </div>
              </div>

              {selectedTable && (
                <div className="bg-admin-muted/30 p-4 rounded-lg border border-admin-border">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-admin-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-admin-table-text">
                        {AVAILABLE_TABLES.find(t => t.value === selectedTable)?.label}
                      </p>
                      <p className="text-xs text-admin-muted-foreground mt-1">
                        {AVAILABLE_TABLES.find(t => t.value === selectedTable)?.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Export History */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Histórico de Exportações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full bg-gray-800" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="text-center text-admin-muted-foreground py-8">
                Nenhuma exportação realizada ainda
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-admin-table-text">Tabela</TableHead>
                    <TableHead className="text-admin-table-text">Arquivo</TableHead>
                    <TableHead className="text-admin-table-text">Registros</TableHead>
                    <TableHead className="text-admin-table-text">Data</TableHead>
                    <TableHead className="text-admin-table-text">Usuário</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-admin-table-text">
                        <Badge variant="outline" className="border-admin-primary text-admin-primary">
                          {AVAILABLE_TABLES.find(t => t.value === item.table_name)?.label || item.table_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-admin-table-text font-mono text-sm">
                        {item.file_name}
                      </TableCell>
                      <TableCell className="text-admin-table-text">
                        {item.record_count || '-'}
                      </TableCell>
                      <TableCell className="text-admin-muted-foreground">
                        {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-admin-table-text">
                        {item.user?.name || 'Sistema'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  );
};

export default Relatorios;
