import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Copy, ExternalLink, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CheckoutTesterProps {
  environment: 'sandbox' | 'production';
  apiKey: string;
}

interface CheckoutData {
  name: string;
  description: string;
  dueDate: string;
  billingType: string[];
  chargeType: string;
  value: string;
  installmentCount: string;
  installmentValue: string;
  cycle: string;
  customer: string;
  redirectUrl: string;
  productName: string;
  productDescription: string;
  productImageUrl: string;
  expiresIn: string;
}

export const CheckoutTester: React.FC<CheckoutTesterProps> = ({ environment, apiKey }) => {
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    name: '',
    description: '',
    dueDate: '',
    billingType: [],
    chargeType: '',
    value: '',
    installmentCount: '',
    installmentValue: '',
    cycle: '',
    customer: '',
    redirectUrl: '',
    productName: '',
    productDescription: '',
    productImageUrl: '',
    expiresIn: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof CheckoutData, value: string | string[]) => {
    setCheckoutData(prev => ({ ...prev, [field]: value }));
  };

  const handleBillingTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setCheckoutData(prev => ({
        ...prev,
        billingType: [...prev.billingType, type]
      }));
    } else {
      setCheckoutData(prev => ({
        ...prev,
        billingType: prev.billingType.filter(t => t !== type)
      }));
    }
  };

  const fillTestData = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 7);
    
    setCheckoutData({
      name: 'Checkout Plano Premium',
      description: 'Acesso completo ao sistema por 30 dias',
      dueDate: tomorrow.toISOString().split('T')[0],
      billingType: ['PIX', 'CREDIT_CARD'],
      chargeType: 'DETACHED',
      value: '29.90',
      installmentCount: '',
      installmentValue: '',
      cycle: '',
      customer: '',
      redirectUrl: 'https://meusite.com/obrigado',
      productName: 'Plano Premium',
      productDescription: 'Acesso completo com todas as funcionalidades',
      productImageUrl: 'https://exemplo.com/produto.jpg',
      expiresIn: '60'
    });
  };

  const buildRequestBody = () => {
    const body: any = {};
    
    // Required field
    if (checkoutData.chargeType) body.chargeType = checkoutData.chargeType;

    // Optional fields
    if (checkoutData.name) body.name = checkoutData.name;
    if (checkoutData.description) body.description = checkoutData.description;
    if (checkoutData.dueDate) body.dueDate = checkoutData.dueDate;
    if (checkoutData.billingType.length > 0) body.billingType = checkoutData.billingType;
    if (checkoutData.customer) body.customer = checkoutData.customer;
    if (checkoutData.redirectUrl) body.redirectUrl = checkoutData.redirectUrl;
    if (checkoutData.expiresIn) body.expiresIn = parseInt(checkoutData.expiresIn);

    // Charge type specific fields
    if (checkoutData.chargeType === 'DETACHED' && checkoutData.value) {
      body.value = parseFloat(checkoutData.value);
    }

    if (checkoutData.chargeType === 'INSTALLMENT') {
      if (checkoutData.installmentCount) body.installmentCount = parseInt(checkoutData.installmentCount);
      if (checkoutData.installmentValue) body.installmentValue = parseFloat(checkoutData.installmentValue);
    }

    if (checkoutData.chargeType === 'RECURRENT' && checkoutData.cycle) {
      body.cycle = checkoutData.cycle;
    }

    // Product information
    if (checkoutData.productName || checkoutData.productDescription || checkoutData.productImageUrl) {
      body.product = {};
      if (checkoutData.productName) body.product.name = checkoutData.productName;
      if (checkoutData.productDescription) body.product.description = checkoutData.productDescription;
      if (checkoutData.productImageUrl) body.product.imageUrl = checkoutData.productImageUrl;
    }

    return body;
  };

  const createCheckout = async () => {
    if (!apiKey) {
      toast({
        title: "Erro",
        description: "Configure a chave de API antes de testar.",
        variant: "destructive"
      });
      return;
    }

    if (!checkoutData.chargeType) {
      toast({
        title: "Erro",
        description: "Tipo de cobrança é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    const requestBody = buildRequestBody();
    setRequestBody(JSON.stringify(requestBody, null, 2));

    setLoading(true);
    try {
      console.log('[CheckoutTester] Calling asaas-api-proxy...', {
        endpoint: '/checkouts',
        environment,
        hasApiKey: !!apiKey
      });

      // Use supabase.functions.invoke instead of fetch
      const { data: result, error: functionError } = await supabase.functions.invoke('asaas-api-proxy', {
        body: {
          method: 'POST',
          endpoint: '/checkouts',
          body: requestBody,
          apiKey: apiKey, // Don't add 'Bearer ' - edge function adds it
          environment
        }
      });

      // Check for edge function error
      if (functionError) {
        console.error('[CheckoutTester] Edge function error:', functionError);
        throw new Error(functionError.message);
      }

      console.log('[CheckoutTester] Response received:', result);

      setResponse({ 
        status: result?.status || 'unknown', 
        data: result?.data 
      });

      // Save to logs
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: 'POST',
        endpoint: '/v3/checkouts',
        environment,
        requestBody,
        response: { status: result?.status, data: result?.data }
      };
      
      const logs = JSON.parse(localStorage.getItem('asaas-request-logs') || '[]');
      logs.unshift(logEntry);
      localStorage.setItem('asaas-request-logs', JSON.stringify(logs.slice(0, 100)));

      if (result?.success) {
        toast({
          title: "Checkout criado com sucesso",
          description: `ID: ${result.data?.id}`,
        });
      } else {
        toast({
          title: "Erro ao criar checkout",
          description: result?.data?.errors?.[0]?.description || result?.error || "Erro desconhecido",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('[CheckoutTester] Error:', error);
      toast({
        title: "Erro de conexão",
        description: error.message || "Não foi possível conectar com a API do Asaas.",
        variant: "destructive"
      });
      setResponse({
        status: 'error',
        data: { error: error.message }
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

  const openCheckoutUrl = () => {
    if (response?.data?.url) {
      window.open(response.data.url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Criar Novo Checkout</h3>
          <p className="text-sm text-muted-foreground">Endpoint: POST /v3/checkouts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fillTestData}>
            Preencher Dados de Teste
          </Button>
          <Button 
            onClick={createCheckout} 
            disabled={loading || !apiKey}
            className="min-w-[130px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Criar Checkout
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chargeType">Tipo de Cobrança *</Label>
                <Select value={checkoutData.chargeType} onValueChange={(value) => handleInputChange('chargeType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DETACHED">Único</SelectItem>
                    <SelectItem value="INSTALLMENT">Parcelado</SelectItem>
                    <SelectItem value="RECURRENT">Assinatura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Checkout</Label>
                <Input
                  id="name"
                  value={checkoutData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Checkout Plano Premium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={checkoutData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Acesso completo ao sistema"
                />
              </div>

              <div className="space-y-2">
                <Label>Métodos de Pagamento</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pix"
                      checked={checkoutData.billingType.includes('PIX')}
                      onCheckedChange={(checked) => handleBillingTypeChange('PIX', checked as boolean)}
                    />
                    <Label htmlFor="pix">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="credit_card"
                      checked={checkoutData.billingType.includes('CREDIT_CARD')}
                      onCheckedChange={(checked) => handleBillingTypeChange('CREDIT_CARD', checked as boolean)}
                    />
                    <Label htmlFor="credit_card">Cartão de Crédito</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Valores e Datas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkoutData.chargeType === 'DETACHED' && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valor</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={checkoutData.value}
                    onChange={(e) => handleInputChange('value', e.target.value)}
                    placeholder="29.90"
                  />
                </div>
              )}

              {checkoutData.chargeType === 'INSTALLMENT' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="installmentCount">Número de Parcelas</Label>
                    <Input
                      id="installmentCount"
                      type="number"
                      value={checkoutData.installmentCount}
                      onChange={(e) => handleInputChange('installmentCount', e.target.value)}
                      placeholder="6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installmentValue">Valor da Parcela</Label>
                    <Input
                      id="installmentValue"
                      type="number"
                      step="0.01"
                      value={checkoutData.installmentValue}
                      onChange={(e) => handleInputChange('installmentValue', e.target.value)}
                      placeholder="9.90"
                    />
                  </div>
                </>
              )}

              {checkoutData.chargeType === 'RECURRENT' && (
                <div className="space-y-2">
                  <Label htmlFor="cycle">Ciclo da Assinatura</Label>
                  <Select value={checkoutData.cycle} onValueChange={(value) => handleInputChange('cycle', value)}>
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
              )}

              <div className="space-y-2">
                <Label htmlFor="dueDate">Data de Expiração</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={checkoutData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresIn">Expiração (minutos)</Label>
                <Input
                  id="expiresIn"
                  type="number"
                  value={checkoutData.expiresIn}
                  onChange={(e) => handleInputChange('expiresIn', e.target.value)}
                  placeholder="60"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">ID do Cliente</Label>
                <Input
                  id="customer"
                  value={checkoutData.customer}
                  onChange={(e) => handleInputChange('customer', e.target.value)}
                  placeholder="cus_000005492777"
                />
                <p className="text-xs text-muted-foreground">
                  Opcional - vincula o checkout a um cliente específico
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redirectUrl">URL de Redirecionamento</Label>
                <Input
                  id="redirectUrl"
                  value={checkoutData.redirectUrl}
                  onChange={(e) => handleInputChange('redirectUrl', e.target.value)}
                  placeholder="https://meusite.com/obrigado"
                />
                <p className="text-xs text-muted-foreground">
                  URL para onde o cliente será redirecionado após o pagamento
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informações do Produto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Nome do Produto</Label>
                <Input
                  id="productName"
                  value={checkoutData.productName}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  placeholder="Plano Premium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productDescription">Descrição do Produto</Label>
                <Input
                  id="productDescription"
                  value={checkoutData.productDescription}
                  onChange={(e) => handleInputChange('productDescription', e.target.value)}
                  placeholder="Acesso completo com todas as funcionalidades"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productImageUrl">URL da Imagem</Label>
                <Input
                  id="productImageUrl"
                  value={checkoutData.productImageUrl}
                  onChange={(e) => handleInputChange('productImageUrl', e.target.value)}
                  placeholder="https://exemplo.com/produto.jpg"
                />
              </div>
            </CardContent>
          </Card>

          {(requestBody || response) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Requisição e Resposta
                  <div className="flex gap-2">
                    {response?.data?.url && (
                      <Button variant="outline" size="sm" onClick={openCheckoutUrl}>
                        <Globe className="w-4 h-4 mr-2" />
                        Abrir
                      </Button>
                    )}
                    {response && (
                      <Button variant="outline" size="sm" onClick={copyResponse}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar
                      </Button>
                    )}
                  </div>
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
                    {response.data?.url && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          <strong>URL do Checkout:</strong>
                        </p>
                        <a 
                          href={response.data.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          {response.data.url}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium text-purple-800">Tipos de Checkout:</h4>
        <ul className="text-sm text-purple-700 mt-2 space-y-1">
          <li>• <strong>DETACHED:</strong> Pagamento único com valor fixo</li>
          <li>• <strong>INSTALLMENT:</strong> Pagamento parcelado</li>
          <li>• <strong>RECURRENT:</strong> Assinatura recorrente com ciclo definido</li>
        </ul>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="w-4 h-4" />
        <a 
          href="https://docs.asaas.com/reference/criar-novo-checkout" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Documentação da API do Asaas - Criar Checkout
        </a>
      </div>
    </div>
  );
};