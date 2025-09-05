import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, TestTube, Eye, EyeOff } from 'lucide-react';

interface ApiKeySettingsProps {
  environment: 'sandbox' | 'production';
  setEnvironment: (env: 'sandbox' | 'production') => void;
  apiKeys: { sandbox: string; production: string };
  setApiKeys: (keys: { sandbox: string; production: string }) => void;
}

export const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  environment,
  setEnvironment,
  apiKeys,
  setApiKeys
}) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedKeys = localStorage.getItem('asaas-api-keys');
    const savedEnv = localStorage.getItem('asaas-environment');
    const savedWebhook = localStorage.getItem('asaas-webhook-url');

    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
    if (savedEnv) {
      setEnvironment(savedEnv as 'sandbox' | 'production');
    }
    if (savedWebhook) {
      setWebhookUrl(savedWebhook);
    }

    // Generate webhook URL
    const baseUrl = window.location.origin;
    const generatedWebhookUrl = `${baseUrl}/api/asaas-webhook`;
    setWebhookUrl(generatedWebhookUrl);
  }, [setApiKeys, setEnvironment]);

  const handleSaveSettings = () => {
    localStorage.setItem('asaas-api-keys', JSON.stringify(apiKeys));
    localStorage.setItem('asaas-environment', environment);
    localStorage.setItem('asaas-webhook-url', webhookUrl);
    
    toast({
      title: "Configurações salvas",
      description: "As configurações foram salvas com sucesso.",
    });
  };

  const handleTestApiKey = async () => {
    const currentApiKey = apiKeys[environment];
    if (!currentApiKey) {
      toast({
        title: "Erro",
        description: "Informe a chave de API antes de testar.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const baseUrl = environment === 'sandbox' 
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://www.asaas.com/api/v3';

      const response = await fetch(`${baseUrl}/myAccount`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Teste bem-sucedido",
          description: `Conectado como: ${data.name || data.email}`,
        });
      } else {
        toast({
          title: "Teste falhou",
          description: "Chave de API inválida ou erro na conexão.",
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
      setTesting(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast({
      title: "URL copiada",
      description: "URL do webhook copiada para a área de transferência.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="environment">Ambiente</Label>
          <Select value={environment} onValueChange={(value: 'sandbox' | 'production') => setEnvironment(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sandbox">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Sandbox</Badge>
                  Desenvolvimento
                </div>
              </SelectItem>
              <SelectItem value="production">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Produção</Badge>
                  Produção
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">Chave de API ({environment})</Label>
          <div className="flex gap-2">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              value={apiKeys[environment]}
              onChange={(e) => setApiKeys({
                ...apiKeys,
                [environment]: e.target.value
              })}
              placeholder="Insira sua chave de API do Asaas"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">URL do Webhook</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="URL onde o Asaas enviará os webhooks"
              className="flex-1"
            />
            <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Configure esta URL no painel do Asaas para receber notificações de eventos.
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={handleSaveSettings}>
          Salvar Configurações
        </Button>
        <Button
          variant="outline"
          onClick={handleTestApiKey}
          disabled={testing || !apiKeys[environment]}
        >
          <TestTube className="w-4 h-4 mr-2" />
          {testing ? 'Testando...' : 'Testar API'}
        </Button>
      </div>

      {environment === 'sandbox' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800">Dicas para Sandbox:</h4>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Use seus próprios e-mails e telefones para testes</li>
            <li>• Evite números aleatórios como (51) 9999-9999</li>
            <li>• CPF de teste: 24971563792</li>
            <li>• CNPJ de teste: 34238864000168</li>
          </ul>
        </div>
      )}
    </div>
  );
};