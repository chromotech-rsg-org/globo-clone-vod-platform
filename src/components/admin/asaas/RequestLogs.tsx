import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye, RefreshCw, Download, FileText } from 'lucide-react';

interface RequestLog {
  timestamp: string;
  method: string;
  endpoint: string;
  environment: 'sandbox' | 'production';
  requestBody: any;
  response: {
    status: number;
    data: any;
  };
}

const ENDPOINTS = [
  '/v3/customers',
  '/v3/subscriptions',
  '/v3/checkouts',
  '/v3/payments',
  '/v3/myAccount'
];

export const RequestLogs: React.FC = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<RequestLog[]>([]);
  const [endpointFilter, setEndpointFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, endpointFilter, environmentFilter, statusFilter, searchTerm]);

  const loadLogs = () => {
    const savedLogs = localStorage.getItem('asaas-request-logs');
    if (savedLogs) {
      const parsedLogs = JSON.parse(savedLogs);
      setLogs(parsedLogs);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    if (endpointFilter !== 'all') {
      filtered = filtered.filter(log => log.endpoint === endpointFilter);
    }

    if (environmentFilter !== 'all') {
      filtered = filtered.filter(log => log.environment === environmentFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter(log => log.response.status >= 200 && log.response.status < 300);
      } else if (statusFilter === 'error') {
        filtered = filtered.filter(log => log.response.status >= 400);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.requestBody).toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.response.data).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  };

  const clearLogs = () => {
    localStorage.removeItem('asaas-request-logs');
    setLogs([]);
    setFilteredLogs([]);
    toast({
      title: "Logs limpos",
      description: "Todos os logs de requisições foram removidos."
    });
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asaas-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Logs exportados",
      description: "Arquivo JSON baixado com sucesso."
    });
  };

  const getStatusBadgeVariant = (status: number) => {
    if (status >= 200 && status < 300) return 'default';
    if (status >= 400 && status < 500) return 'destructive';
    if (status >= 500) return 'destructive';
    return 'outline';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'GET': return 'default';
      case 'POST': return 'default';
      case 'PUT': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full">
          <Input
            placeholder="Buscar nos logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={endpointFilter} onValueChange={setEndpointFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os endpoints</SelectItem>
              {ENDPOINTS.map(endpoint => (
                <SelectItem key={endpoint} value={endpoint}>{endpoint}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os ambientes</SelectItem>
              <SelectItem value="sandbox">Sandbox</SelectItem>
              <SelectItem value="production">Produção</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="success">Sucesso (2xx)</SelectItem>
              <SelectItem value="error">Erro (4xx, 5xx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLogs} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportLogs} size="sm" disabled={filteredLogs.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="destructive" onClick={clearLogs} size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum log de requisição encontrado.</p>
          <p className="text-sm mt-2">
            Faça algumas requisições para a API do Asaas para ver os logs aqui.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <TableRow key={index}>
                  <TableCell>{formatDate(log.timestamp)}</TableCell>
                  <TableCell>
                    <Badge variant={getMethodBadgeVariant(log.method)}>
                      {log.method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant={log.environment === 'production' ? 'destructive' : 'secondary'}>
                      {log.environment === 'sandbox' ? 'Sandbox' : 'Produção'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(log.response.status)}>
                      {log.response.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>
                            {selectedLog?.method} {selectedLog?.endpoint}
                          </DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="request" className="w-full">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="request">Requisição</TabsTrigger>
                            <TabsTrigger value="response">Resposta</TabsTrigger>
                          </TabsList>
                          <TabsContent value="request">
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Informações da Requisição:</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <strong>Data/Hora:</strong> {formatDate(selectedLog?.timestamp || '')}
                                    </div>
                                    <div>
                                      <strong>Ambiente:</strong> {selectedLog?.environment}
                                    </div>
                                    <div>
                                      <strong>Método:</strong> {selectedLog?.method}
                                    </div>
                                    <div>
                                      <strong>Endpoint:</strong> {selectedLog?.endpoint}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Corpo da Requisição:</h4>
                                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                                    {JSON.stringify(selectedLog?.requestBody, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </ScrollArea>
                          </TabsContent>
                          <TabsContent value="response">
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium mb-2">Status da Resposta:</h4>
                                  <Badge variant={getStatusBadgeVariant(selectedLog?.response.status || 0)}>
                                    {selectedLog?.response.status}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Corpo da Resposta:</h4>
                                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                                    {JSON.stringify(selectedLog?.response.data, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-800">Sobre os Logs:</h4>
        <ul className="text-sm text-gray-700 mt-2 space-y-1">
          <li>• Os logs são salvos automaticamente no navegador</li>
          <li>• Máximo de 100 logs são mantidos (os mais antigos são removidos)</li>
          <li>• Use os filtros para encontrar requisições específicas</li>
          <li>• Exporte os logs em formato JSON para análise externa</li>
        </ul>
      </div>
    </div>
  );
};