import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Copy, ExternalLink } from 'lucide-react';

interface SubscriptionTesterProps {
  environment: 'sandbox' | 'production';
  apiKey: string;
}

interface SubscriptionData {
  customer: string;
  billingType: string;
  value: string;
  cycle: string;
  nextDueDate: string;
  description: string;
  externalReference: string;
  endDate: string;
  maxPayments: string;
}

export const SubscriptionTester: React.FC<SubscriptionTesterProps> = ({ environment, apiKey }) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    customer: '',
    billingType: '',
    value: '',
    cycle: '',
    nextDueDate: '',
    description: '',
    externalReference: '',
    endDate: '',
    maxPayments: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof SubscriptionData, value: string) => {
    setSubscriptionData(prev => ({ ...prev, [field]: value }));
  };

  const fillTestData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setSubscriptionData({
      customer: 'cus_000005492777', // Exemplo de ID
      billingType: 'BOLETO',
      value: '29.90',
      cycle: 'MONTHLY',
      nextDueDate: tomorrow.toISOString().split('T')[0],
      description: 'Assinatura Plano Premium',
      externalReference: 'ASSINATURA_001',
      endDate: '',
      maxPayments: ''
    });
  };

  const buildRequestBody = () => {
    const body: any = {};
    
    // Required fields
    if (subscriptionData.customer) body.customer = subscriptionData.customer;
    if (subscriptionData.value) body.value = parseFloat(subscriptionData.value);
    if (subscriptionData.cycle) body.cycle = subscriptionData.cycle;
    if (subscriptionData.nextDueDate) body.nextDueDate = subscriptionData.nextDueDate;

    // Optional fields
    if (subscriptionData.billingType) body.billingType = subscriptionData.billingType;
    if (subscriptionData.description) body.description = subscriptionData.description;
    if (subscriptionData.externalReference) body.externalReference = subscriptionData.externalReference;
    if (subscriptionData.endDate) body.endDate = subscriptionData.endDate;
    if (subscriptionData.maxPayments) body.maxPayments = parseInt(subscriptionData.maxPayments);

    return body;
  };

  const createSubscription = async () => {
    if (!apiKey) {
      toast({
        title: "Erro",
        description: "Configure a chave de API antes de testar.",
        variant: "destructive"
      });
      return;
    }

    if (!subscriptionData.customer || !subscriptionData.value || !subscriptionData.cycle || !subscriptionData.nextDueDate) {
      toast({
        title: "Erro",
        description: "Cliente, valor, ciclo e data da primeira cobrança são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const requestBody = buildRequestBody();
    setRequestBody(JSON.stringify(requestBody, null, 2));

    setLoading(true);
    try {
      const baseUrl = environment === 'sandbox' 
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://www.asaas.com/api/v3';

      const response = await fetch(`${baseUrl}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      setResponse({ status: response.status, data });

      // Save to logs
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: 'POST',
        endpoint: '/v3/subscriptions',
        environment,
        requestBody,
        response: { status: response.status, data }
      };
      
      const logs = JSON.parse(localStorage.getItem('asaas-request-logs') || '[]');
      logs.unshift(logEntry);
      localStorage.setItem('asaas-request-logs', JSON.stringify(logs.slice(0, 100)));

      if (response.ok) {
        toast({
          title: "Assinatura criada com sucesso",
          description: `ID: ${data.id}`,
        });
      } else {
        toast({
          title: "Erro ao criar assinatura",
          description: data.errors?.[0]?.description || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar com a API do Asaas.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast({
      title: "Resposta copiada",
      description: "Resposta copiada para a área de transferência."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Criar Nova Assinatura</h3>
          <p className="text-sm text-muted-foreground">Endpoint: POST /v3/subscriptions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fillTestData}>
            Preencher Dados de Teste
          </Button>
          <Button 
            onClick={createSubscription} 
            disabled={loading || !apiKey}
            className="min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Criar Assinatura
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Obrigatórios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">ID do Cliente *</Label>
                <Input
                  id="customer"
                  value={subscriptionData.customer}
                  onChange={(e) => handleInputChange('customer', e.target.value)}
                  placeholder="cus_000005492777"
                />
                <p className="text-xs text-muted-foreground">
                  Obtido na criação do cliente
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="value">Valor *</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={subscriptionData.value}
                  onChange={(e) => handleInputChange('value', e.target.value)}
                  placeholder="29.90"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cycle">Ciclo *</Label>
                <Select value={subscriptionData.cycle} onValueChange={(value) => handleInputChange('cycle', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Data da Primeira Cobrança *</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={subscriptionData.nextDueDate}
                  onChange={(e) => handleInputChange('nextDueDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Opcionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="billingType">Forma de Pagamento</Label>
                <Select value={subscriptionData.billingType} onValueChange={(value) => handleInputChange('billingType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a forma de pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="UNDEFINED">Indefinido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={subscriptionData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Assinatura Plano Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="externalReference">Referência Externa</Label>
                <Input
                  id="externalReference"
                  value={subscriptionData.externalReference}
                  onChange={(e) => handleInputChange('externalReference', e.target.value)}
                  placeholder="ASSINATURA_001"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Controle de Duração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={subscriptionData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para assinatura sem data de término
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPayments">Máximo de Pagamentos</Label>
                <Input
                  id="maxPayments"
                  type="number"
                  value={subscriptionData.maxPayments}
                  onChange={(e) => handleInputChange('maxPayments', e.target.value)}
                  placeholder="12"
                />
                <p className="text-xs text-muted-foreground">
                  Número máximo de cobranças da assinatura
                </p>
              </div>
            </CardContent>
          </Card>

          {(requestBody || response) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Requisição e Resposta
                  {response && (
                    <Button variant="outline" size="sm" onClick={copyResponse}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {requestBody && (
                  <div>
                    <Label className="text-sm font-medium">Corpo da Requisição:</Label>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto mt-1">
                      {requestBody}
                    </pre>
                  </div>
                )}
                
                {response && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label className="text-sm font-medium">Resposta:</Label>
                      <Badge variant={response.status < 300 ? "default" : "destructive"}>
                        {response.status}
                      </Badge>
                    </div>
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800">Informações Importantes:</h4>
        <ul className="text-sm text-blue-700 mt-2 space-y-1">
          <li>• A primeira cobrança será gerada na data de nextDueDate</li>
          <li>• Para período de trial, configure nextDueDate para uma data futura</li>
          <li>• Se inserir cartão após criação, pagamento ocorre imediatamente</li>
          <li>• Assinatura sem endDate ou maxPayments será recorrente indefinidamente</li>
        </ul>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="w-4 h-4" />
        <a 
          href="https://docs.asaas.com/reference/criar-nova-assinatura" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Documentação da API do Asaas - Criar Assinatura
        </a>
      </div>
    </div>
  );
};