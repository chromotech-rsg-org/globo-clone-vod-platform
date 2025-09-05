import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye, Filter, RefreshCw, Webhook } from 'lucide-react';

interface WebhookEvent {
  id: string;
  event: string;
  dateCreated: string;
  payment?: {
    id: string;
    customer: string;
    value: number;
    status: string;
  };
  subscription?: {
    id: string;
    customer: string;
    value: number;
    status: string;
  };
  payload: any;
}

const EVENT_TYPES = [
  'PAYMENT_CREATED',
  'PAYMENT_UPDATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_DELETED',
  'INVOICE_CREATED',
  'INVOICE_UPDATED'
];

export const WebhookManager: React.FC = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    // Set up polling for new events
    const interval = setInterval(loadEvents, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, eventFilter, searchTerm]);

  const loadEvents = () => {
    const savedEvents = localStorage.getItem('asaas-webhook-events');
    if (savedEvents) {
      const parsedEvents = JSON.parse(savedEvents);
      setEvents(parsedEvents);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    if (eventFilter !== 'all') {
      filtered = filtered.filter(event => event.event === eventFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.payment?.customer || event.subscription?.customer || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered.sort((a, b) => 
      new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
    ));
  };

  const clearEvents = () => {
    localStorage.removeItem('asaas-webhook-events');
    setEvents([]);
    setFilteredEvents([]);
    toast({
      title: "Eventos limpos",
      description: "Todos os eventos de webhook foram removidos."
    });
  };

  const getEventBadgeVariant = (eventType: string) => {
    if (eventType.includes('CREATED')) return 'default';
    if (eventType.includes('CONFIRMED') || eventType.includes('RECEIVED')) return 'default';
    if (eventType.includes('UPDATED')) return 'secondary';
    if (eventType.includes('OVERDUE')) return 'destructive';
    if (eventType.includes('DELETED')) return 'destructive';
    return 'outline';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os eventos</SelectItem>
              {EVENT_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadEvents} size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="destructive" onClick={clearEvents} size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum evento de webhook encontrado.</p>
          <p className="text-sm mt-2">
            Configure o webhook no painel do Asaas para começar a receber eventos.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente/ID</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant={getEventBadgeVariant(event.event)}>
                      {event.event}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(event.dateCreated)}</TableCell>
                  <TableCell>
                    {event.payment?.customer || event.subscription?.customer || '-'}
                  </TableCell>
                  <TableCell>
                    {event.payment?.value || event.subscription?.value 
                      ? formatCurrency(event.payment?.value || event.subscription?.value || 0)
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {event.payment?.status || event.subscription?.status || '-'}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedEvent(event)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detalhes do Webhook</DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-96">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-auto">
                            {JSON.stringify(selectedEvent?.payload, null, 2)}
                          </pre>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">Informações sobre Webhooks:</h4>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• Eventos não processados por mais de 14 dias são deletados automaticamente</li>
          <li>• Após 15 falhas consecutivas, a fila de eventos é pausada</li>
          <li>• Sempre responda com HTTP 200 para confirmar recebimento</li>
          <li>• Use idempotência para evitar processar eventos duplicados</li>
        </ul>
      </div>
    </div>
  );
};