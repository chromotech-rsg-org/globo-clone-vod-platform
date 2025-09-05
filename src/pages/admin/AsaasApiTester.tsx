import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiKeySettings } from '@/components/admin/asaas/ApiKeySettings';
import { WebhookManager } from '@/components/admin/asaas/WebhookManager';
import { CustomerTester } from '@/components/admin/asaas/CustomerTester';
import { SubscriptionTester } from '@/components/admin/asaas/SubscriptionTester';
import { CheckoutTester } from '@/components/admin/asaas/CheckoutTester';
import { RequestLogs } from '@/components/admin/asaas/RequestLogs';
import { Settings, Webhook, Users, CreditCard, ShoppingCart, FileText } from 'lucide-react';

const AsaasApiTester = () => {
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [apiKeys, setApiKeys] = useState({
    sandbox: '',
    production: ''
  });

  return (
    <div className="p-6 space-y-6 bg-admin-content-bg min-h-full">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-admin-primary/20 border border-admin-border flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-admin-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-admin-foreground">Integração Asaas</h1>
          <p className="text-admin-muted-foreground">Ferramenta para testar e integrar com a API de pagamentos do Asaas</p>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Assinaturas
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Checkouts
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Configure suas chaves de API e ambiente de teste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeySettings
                environment={environment}
                setEnvironment={setEnvironment}
                apiKeys={apiKeys}
                setApiKeys={setApiKeys}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Webhooks</CardTitle>
              <CardDescription>
                Visualize e gerencie webhooks recebidos do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WebhookManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Criação de Clientes</CardTitle>
              <CardDescription>
                Teste o endpoint POST /v3/customers para criar novos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerTester environment={environment} apiKey={apiKeys[environment]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Criação de Assinaturas</CardTitle>
              <CardDescription>
                Teste o endpoint POST /v3/subscriptions para criar novas assinaturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionTester environment={environment} apiKey={apiKeys[environment]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checkouts">
          <Card>
            <CardHeader>
              <CardTitle>Teste de Criação de Checkouts</CardTitle>
              <CardDescription>
                Teste o endpoint POST /v3/checkouts para criar novos checkouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CheckoutTester environment={environment} apiKey={apiKeys[environment]} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Requisições</CardTitle>
              <CardDescription>
                Visualize todas as requisições realizadas para a API do Asaas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RequestLogs />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AsaasApiTester;