import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CustomerTesterProps {
  environment: 'sandbox' | 'production';
  apiKey: string;
}

interface CustomerData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  mobilePhone: string;
  address: string;
  addressNumber: string;
  complement: string;
  province: string;
  postalCode: string;
  externalReference: string;
  notificationDisabled: boolean;
  additionalEmails: string;
  municipalInscription: string;
  stateInscription: string;
  observations: string;
  groupName: string;
  companyType: string;
}

export const CustomerTester: React.FC<CustomerTesterProps> = ({ environment, apiKey }) => {
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: '',
    cpfCnpj: '',
    email: '',
    phone: '',
    mobilePhone: '',
    address: '',
    addressNumber: '',
    complement: '',
    province: '',
    postalCode: '',
    externalReference: '',
    notificationDisabled: false,
    additionalEmails: '',
    municipalInscription: '',
    stateInscription: '',
    observations: '',
    groupName: '',
    companyType: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [requestBody, setRequestBody] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: keyof CustomerData, value: string | boolean) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const fillTestData = () => {
    setCustomerData({
      name: 'João Silva Santos',
      cpfCnpj: '24971563792',
      email: 'joao.silva@email.com',
      phone: '1133334444',
      mobilePhone: '11999887766',
      address: 'Rua das Flores',
      addressNumber: '123',
      complement: 'Apto 45',
      province: 'Centro',
      postalCode: '01310-100',
      externalReference: 'CLIENTE_001',
      notificationDisabled: false,
      additionalEmails: 'suporte@email.com',
      municipalInscription: '',
      stateInscription: '',
      observations: 'Cliente de teste',
      groupName: 'Clientes VIP',
      companyType: 'MEI'
    });
  };

  const buildRequestBody = () => {
    const body: any = {};
    
    // Add required fields
    if (customerData.name) body.name = customerData.name;
    if (customerData.cpfCnpj) body.cpfCnpj = customerData.cpfCnpj;

    // Add optional fields only if they have values
    if (customerData.email) body.email = customerData.email;
    if (customerData.phone) body.phone = customerData.phone;
    if (customerData.mobilePhone) body.mobilePhone = customerData.mobilePhone;
    if (customerData.address) body.address = customerData.address;
    if (customerData.addressNumber) body.addressNumber = customerData.addressNumber;
    if (customerData.complement) body.complement = customerData.complement;
    if (customerData.province) body.province = customerData.province;
    if (customerData.postalCode) body.postalCode = customerData.postalCode;
    if (customerData.externalReference) body.externalReference = customerData.externalReference;
    if (customerData.notificationDisabled) body.notificationDisabled = customerData.notificationDisabled;
    if (customerData.additionalEmails) body.additionalEmails = customerData.additionalEmails;
    if (customerData.municipalInscription) body.municipalInscription = customerData.municipalInscription;
    if (customerData.stateInscription) body.stateInscription = customerData.stateInscription;
    if (customerData.observations) body.observations = customerData.observations;
    if (customerData.groupName) body.groupName = customerData.groupName;
    if (customerData.companyType) body.companyType = customerData.companyType;

    return body;
  };

  const createCustomer = async () => {
    if (!apiKey) {
      toast({
        title: "Erro",
        description: "Configure a chave de API antes de testar.",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.name || !customerData.cpfCnpj) {
      toast({
        title: "Erro",
        description: "Nome e CPF/CNPJ são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const requestBody = buildRequestBody();
    setRequestBody(JSON.stringify(requestBody, null, 2));

    setLoading(true);
    try {
      // Use Supabase Edge Function to proxy the request
      const response = await fetch('/functions/v1/asaas-api-proxy', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'POST',
          endpoint: '/customers',
          body: requestBody,
          apiKey: `Bearer ${apiKey}`,
          environment
        })
      });

      const result = await response.json();
      setResponse({ status: result.status, data: result.data });

      // Save to logs
      const logEntry = {
        timestamp: new Date().toISOString(),
        method: 'POST',
        endpoint: '/v3/customers',
        environment,
        requestBody,
        response: { status: result.status, data: result.data }
      };
      
      const logs = JSON.parse(localStorage.getItem('asaas-request-logs') || '[]');
      logs.unshift(logEntry);
      localStorage.setItem('asaas-request-logs', JSON.stringify(logs.slice(0, 100)));

      if (result.success) {
        toast({
          title: "Cliente criado com sucesso",
          description: `ID: ${result.data?.id}`,
        });
      } else {
        toast({
          title: "Erro ao criar cliente",
          description: result.data?.errors?.[0]?.description || result.error || "Erro desconhecido",
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
          <h3 className="text-lg font-semibold">Criar Novo Cliente</h3>
          <p className="text-sm text-muted-foreground">Endpoint: POST /v3/customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fillTestData}>
            Preencher Dados de Teste
          </Button>
          <Button 
            onClick={createCustomer} 
            disabled={loading || !apiKey}
            className="min-w-[120px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Criar Cliente
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
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={customerData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nome completo do cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpfCnpj">CPF/CNPJ *</Label>
                <Input
                  id="cpfCnpj"
                  value={customerData.cpfCnpj}
                  onChange={(e) => handleInputChange('cpfCnpj', e.target.value)}
                  placeholder="CPF ou CNPJ (apenas números)"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={customerData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="1133334444"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobilePhone">Celular</Label>
                  <Input
                    id="mobilePhone"
                    value={customerData.mobilePhone}
                    onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                    placeholder="11999887766"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="additionalEmails">E-mails Adicionais</Label>
                <Input
                  id="additionalEmails"
                  value={customerData.additionalEmails}
                  onChange={(e) => handleInputChange('additionalEmails', e.target.value)}
                  placeholder="email1@exemplo.com, email2@exemplo.com"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">CEP</Label>
                <Input
                  id="postalCode"
                  value={customerData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  placeholder="01310-100"
                />
                <p className="text-xs text-muted-foreground">
                  Se informado, preencherá automaticamente cidade, estado e endereço
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={customerData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua das Flores"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressNumber">Número</Label>
                  <Input
                    id="addressNumber"
                    value={customerData.addressNumber}
                    onChange={(e) => handleInputChange('addressNumber', e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={customerData.complement}
                    onChange={(e) => handleInputChange('complement', e.target.value)}
                    placeholder="Apto 45"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Bairro</Label>
                  <Input
                    id="province"
                    value={customerData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Centro"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="externalReference">Referência Externa</Label>
                <Input
                  id="externalReference"
                  value={customerData.externalReference}
                  onChange={(e) => handleInputChange('externalReference', e.target.value)}
                  placeholder="CLIENTE_001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupName">Nome do Grupo</Label>
                <Input
                  id="groupName"
                  value={customerData.groupName}
                  onChange={(e) => handleInputChange('groupName', e.target.value)}
                  placeholder="Clientes VIP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyType">Tipo de Empresa</Label>
                <Input
                  id="companyType"
                  value={customerData.companyType}
                  onChange={(e) => handleInputChange('companyType', e.target.value)}
                  placeholder="MEI, LTDA, SA, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="municipalInscription">Inscrição Municipal</Label>
                  <Input
                    id="municipalInscription"
                    value={customerData.municipalInscription}
                    onChange={(e) => handleInputChange('municipalInscription', e.target.value)}
                    placeholder="123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stateInscription">Inscrição Estadual</Label>
                  <Input
                    id="stateInscription"
                    value={customerData.stateInscription}
                    onChange={(e) => handleInputChange('stateInscription', e.target.value)}
                    placeholder="987654321"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={customerData.observations}
                  onChange={(e) => handleInputChange('observations', e.target.value)}
                  placeholder="Observações sobre o cliente"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notificationDisabled"
                  checked={customerData.notificationDisabled}
                  onCheckedChange={(checked) => handleInputChange('notificationDisabled', checked)}
                />
                <Label htmlFor="notificationDisabled">Desativar Notificações</Label>
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

      <div className="bg-admin-card border border-admin-border rounded-lg p-4">
        <h4 className="font-medium text-admin-primary">Dicas Importantes:</h4>
        <ul className="text-sm text-admin-muted-foreground mt-2 space-y-1">
          <li>• Verifique se não há clientes duplicados antes de criar</li>
          <li>• Se informar o CEP, não informe cidade, estado e endereço</li>
          <li>• Use seus próprios dados para testes em sandbox</li>
          <li>• CPF de teste: 24971563792 | CNPJ de teste: 34238864000168</li>
        </ul>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ExternalLink className="w-4 h-4" />
        <a 
          href="https://docs.asaas.com/reference/criar-novo-cliente" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:underline"
        >
          Documentação da API do Asaas - Criar Cliente
        </a>
      </div>
    </div>
  );
};