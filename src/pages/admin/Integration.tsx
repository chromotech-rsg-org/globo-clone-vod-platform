import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MotvIntegrationService } from "@/services/motvIntegration";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Settings, History, Play, Eye, EyeOff, Wifi, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CryptoJS from "crypto-js";

interface IntegrationSettings {
  id?: string;
  api_base_url: string;
  api_login: string;
  api_secret: string;
}

interface IntegrationJob {
  id: string;
  job_type: string;
  entity_type: string;
  entity_id: string;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error?: string;
  created_at: string;
  processed_at?: string;
  integration_logs: Array<{
    id: string;
    endpoint: string;
    status_code: number;
    success: boolean;
    error_message?: string;
    created_at: string;
  }>;
}

interface TestResult {
  id: string;
  endpoint: string;
  method: string;
  requestData: any;
  response: any;
  statusCode: number;
  success: boolean;
  timestamp: string;
}

export default function AdminIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingJobs, setProcessingJobs] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState<IntegrationSettings>({
    api_base_url: '',
    api_login: '',
    api_secret: '',
  });
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);
  const [testingCustomerCreate, setTestingCustomerCreate] = useState(false);
  const [testingSubscribe, setTestingSubscribe] = useState(false);
  const [testingCancel, setTestingCancel] = useState(false);
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [customerData, setCustomerData] = useState({
    login: "Alexandre22",
    password: "123456",
    profileName: "Nome Completo",
    email: "alexandre22@alexandre22.comm",
    firstname: "Alexandre22",
    lastname: "Sobrenome"
  });
  const [subscribeData, setSubscribeData] = useState({
    viewers_id: 6869950,
    products_id: 118
  });
  const [cancelData, setCancelData] = useState({
    viewers_id: 6843842,
    products_id: 1
  });

  useEffect(() => {
    loadSettings();
    loadJobsHistory();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await MotvIntegrationService.getIntegrationSettings();
      if (data) {
        setSettings({
          id: data.id,
          api_base_url: data.api_base_url,
          api_login: data.api_login,
          api_secret: data.api_secret,
        });
      }
    } catch (error) {
      console.error('Error loading integration settings:', error);
    }
  };

  const loadJobsHistory = async () => {
    try {
      const data = await MotvIntegrationService.getJobsHistory();
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs history:', error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await MotvIntegrationService.updateIntegrationSettings({
        api_base_url: settings.api_base_url,
        api_login: settings.api_login,
        api_secret: settings.api_secret,
      });

      toast({
        title: "Configurações salvas",
        description: "As configurações de integração foram atualizadas com sucesso.",
      });

      loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPendingJobs = async () => {
    setProcessingJobs(true);
    try {
      const success = await MotvIntegrationService.triggerJobProcessing();
      if (success) {
        toast({
          title: "Jobs processados",
          description: "Os jobs pendentes foram processados com sucesso.",
        });
        loadJobsHistory();
      } else {
        toast({
          title: "Erro",
          description: "Erro ao processar os jobs pendentes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing jobs:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar os jobs pendentes.",
        variant: "destructive",
      });
    } finally {
      setProcessingJobs(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-connection');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: data.message,
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message || data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a conexão da API. Verifique se as configurações foram salvas.",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const generateAuthToken = () => {
    const login = "gentv.api";
    const secret = "cvehyx0cx43kmqmcwiclq4ajroe2ar0yt10q6y3n";
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToHash = timestamp + login + secret;
    const tokenHash = CryptoJS.SHA1(stringToHash).toString();
    return login + ":" + timestamp + ":" + tokenHash;
  };

  const addToTestHistory = (endpoint: string, method: string, requestData: any, response: any, statusCode: number, success: boolean) => {
    const testResult: TestResult = {
      id: Date.now().toString(),
      endpoint,
      method,
      requestData,
      response,
      statusCode,
      success,
      timestamp: new Date().toISOString()
    };
    setTestHistory(prev => [testResult, ...prev]);
  };

  const handleTestCustomerCreate = async () => {
    setTestingCustomerCreate(true);
    try {
      const authToken = generateAuthToken();
      const requestData = { data: customerData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/createMotvCustomer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/createMotvCustomer', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Usuário criado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        toast({
          title: "Erro ao criar usuário",
          description: `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      addToTestHistory('api/integration/createMotvCustomer', 'POST', { data: customerData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a criação do usuário. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingCustomerCreate(false);
    }
  };

  const handleTestSubscribe = async () => {
    setTestingSubscribe(true);
    try {
      const authToken = generateAuthToken();
      const requestData = { data: subscribeData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/subscribe', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Plano criado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        toast({
          title: "Erro ao criar plano",
          description: `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      addToTestHistory('api/integration/subscribe', 'POST', { data: subscribeData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar a criação do plano. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingSubscribe(false);
    }
  };

  const handleTestCancel = async () => {
    setTestingCancel(true);
    try {
      const authToken = generateAuthToken();
      const requestData = { data: cancelData };
      
      const response = await fetch(`${settings.api_base_url}/api/integration/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authToken,
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      
      // Adicionar ao histórico
      addToTestHistory('api/integration/cancel', 'POST', requestData, result, response.status, response.ok);

      if (response.ok) {
        toast({
          title: "Plano cancelado com sucesso!",
          description: `Resposta da API: ${JSON.stringify(result)}`,
        });
      } else {
        toast({
          title: "Erro ao cancelar plano",
          description: `Erro ${response.status}: ${result.message || 'Erro desconhecido'}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      addToTestHistory('api/integration/cancel', 'POST', { data: cancelData }, { error: error.message }, 0, false);
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar o cancelamento do plano. Verifique a configuração da API.",
        variant: "destructive",
      });
    } finally {
      setTestingCancel(false);
    }
  };

  const generateRandomCustomerData = () => {
    const randomId = Math.floor(Math.random() * 10000);
    const randomName = `Usuario${randomId}`;
    const randomEmail = `usuario${randomId}@teste.com`;
    
    setCustomerData({
      login: randomName,
      password: "123456",
      profileName: `${randomName} Completo`,
      email: randomEmail,
      firstname: randomName,
      lastname: "Teste"
    });

    toast({
      title: "Dados gerados!",
      description: "Os dados foram preenchidos automaticamente.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Integração MOTV</h1>
        <Button
          onClick={loadJobsHistory}
          variant="outline"
          size="sm"
          className="gap-2 border-admin-border text-black hover:bg-black hover:text-white"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-admin-card border-admin-border">
          <TabsTrigger value="settings" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <User className="h-4 w-4" />
            Testes de API
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <Eye className="h-4 w-4" />
            Histórico de Testes
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <History className="h-4 w-4" />
            Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground">Configurações da API</CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Configure as credenciais para integração com a API MOTV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api_base_url" className="text-admin-foreground">URL Base da API</Label>
                  <Input
                    id="api_base_url"
                    type="url"
                    placeholder="https://api.exemplo.com"
                    value={settings.api_base_url}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      api_base_url: e.target.value
                    }))}
                    required
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_login" className="text-admin-foreground">Login da API</Label>
                  <Input
                    id="api_login"
                    type="text"
                    placeholder="usuario_api"
                    value={settings.api_login}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      api_login: e.target.value
                    }))}
                    required
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api_secret" className="text-admin-foreground">Chave Secreta</Label>
                  <div className="relative">
                    <Input
                      id="api_secret"
                      type={showPassword ? "text" : "password"}
                      placeholder="chave_secreta_api"
                      value={settings.api_secret}
                      onChange={(e) => setSettings(prev => ({
                        ...prev, 
                        api_secret: e.target.value
                      }))}
                      required
                      className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute inset-y-0 right-0 px-3 flex items-center hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-admin-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-admin-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90">
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                  
                  <Button 
                    type="button" 
                    onClick={handleTestConnection} 
                    disabled={testingConnection || !settings.api_base_url || !settings.api_login || !settings.api_secret}
                    variant="outline"
                    className="gap-2 border-admin-border text-black hover:bg-admin-foreground hover:text-admin-card"
                  >
                    <Wifi className="h-4 w-4" />
                    {testingConnection ? "Testando..." : "Testar Conexão"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <div className="space-y-6">
            {/* Customer Create Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Customer Create (Criar usuário)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de criação de usuário via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="login" className="text-admin-foreground">Login</Label>
                      <Input
                        id="login"
                        value={customerData.login}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, login: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-admin-foreground">Password</Label>
                      <Input
                        id="password"
                        value={customerData.password}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="profileName" className="text-admin-foreground">Nome do Perfil</Label>
                    <Input
                      id="profileName"
                      value={customerData.profileName}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, profileName: e.target.value }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-admin-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-admin-foreground">Primeiro Nome</Label>
                      <Input
                        id="firstname"
                        value={customerData.firstname}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, firstname: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="text-admin-foreground">Sobrenome</Label>
                      <Input
                        id="lastname"
                        value={customerData.lastname}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, lastname: e.target.value }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <Button
                      onClick={generateRandomCustomerData}
                      variant="outline"
                      className="gap-2 border-admin-border text-admin-foreground hover:bg-admin-foreground hover:text-admin-card"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Gerar Dados
                    </Button>
                    
                    <Button
                      onClick={handleTestCustomerCreate}
                      disabled={testingCustomerCreate || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <User className="h-4 w-4" />
                      {testingCustomerCreate ? "Criando usuário..." : "Testar Criação de Usuário"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscribe Plan Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Subscribe Plan (Criar Plano)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de criação de plano via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subscribe_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                      <Input
                        id="subscribe_viewers_id"
                        type="number"
                        value={subscribeData.viewers_id}
                        onChange={(e) => setSubscribeData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscribe_products_id" className="text-admin-foreground">Products ID</Label>
                      <Input
                        id="subscribe_products_id"
                        type="number"
                        value={subscribeData.products_id}
                        onChange={(e) => setSubscribeData(prev => ({ ...prev, products_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestSubscribe}
                      disabled={testingSubscribe || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <Play className="h-4 w-4" />
                      {testingSubscribe ? "Criando plano..." : "Testar Criação de Plano"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cancel Plan Test */}
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Cancel Plan (Cancelar Plano)</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Teste de cancelamento de plano via API MOTV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cancel_viewers_id" className="text-admin-foreground">Viewers ID</Label>
                      <Input
                        id="cancel_viewers_id"
                        type="number"
                        value={cancelData.viewers_id}
                        onChange={(e) => setCancelData(prev => ({ ...prev, viewers_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cancel_products_id" className="text-admin-foreground">Products ID</Label>
                      <Input
                        id="cancel_products_id"
                        type="number"
                        value={cancelData.products_id}
                        onChange={(e) => setCancelData(prev => ({ ...prev, products_id: parseInt(e.target.value) || 0 }))}
                        className="bg-admin-input border-admin-border text-admin-foreground"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={handleTestCancel}
                      disabled={testingCancel || !settings.api_base_url}
                      className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {testingCancel ? "Cancelando plano..." : "Testar Cancelamento de Plano"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground">Histórico de Testes de API</CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Visualize o histórico completo de todos os testes realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="bg-admin-table-bg border-admin-border">
                  <TableHeader>
                    <TableRow className="bg-admin-table-header border-admin-border">
                      <TableHead className="text-admin-foreground">Endpoint</TableHead>
                      <TableHead className="text-admin-foreground">Método</TableHead>
                      <TableHead className="text-admin-foreground">Status</TableHead>
                      <TableHead className="text-admin-foreground">Código</TableHead>
                      <TableHead className="text-admin-foreground">Data/Hora</TableHead>
                      <TableHead className="text-admin-foreground">Request</TableHead>
                      <TableHead className="text-admin-foreground">Response</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testHistory.map((test) => (
                      <TableRow key={test.id} className="border-admin-border hover:bg-admin-muted/20">
                        <TableCell className="font-medium text-admin-table-text">
                          {test.endpoint}
                        </TableCell>
                        <TableCell className="text-admin-table-text">
                          <Badge variant="outline" className="text-xs">
                            {test.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {test.success ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">Sucesso</Badge>
                          ) : (
                            <Badge variant="destructive">Falha</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-admin-table-text">
                          {test.statusCode || 'N/A'}
                        </TableCell>
                        <TableCell className="text-admin-table-text">
                          {formatDate(test.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-xs bg-admin-muted/10 p-2 rounded overflow-auto max-h-20">
                            <pre className="text-admin-table-text whitespace-pre-wrap">
                              {JSON.stringify(test.requestData, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="text-xs bg-admin-muted/10 p-2 rounded overflow-auto max-h-20">
                            <pre className={`whitespace-pre-wrap ${test.success ? 'text-green-600' : 'text-red-400'}`}>
                              {JSON.stringify(test.response, null, 2)}
                            </pre>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {testHistory.length === 0 && (
                  <div className="text-center py-8 text-admin-muted-foreground">
                    Nenhum teste realizado ainda
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-admin-foreground">
                Histórico de Jobs de Integração
                <Button
                  onClick={handleProcessPendingJobs}
                  disabled={processingJobs}
                  size="sm"
                  className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
                >
                  <Play className="h-4 w-4" />
                  {processingJobs ? "Processando..." : "Processar Pendentes"}
                </Button>
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Visualize o status dos jobs de integração com a API MOTV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="bg-admin-table-bg border-admin-border">
                  <TableHeader>
                    <TableRow className="bg-admin-table-header border-admin-border">
                      <TableHead className="text-admin-foreground">Tipo</TableHead>
                      <TableHead className="text-admin-foreground">Entidade</TableHead>
                      <TableHead className="text-admin-foreground">Status</TableHead>
                      <TableHead className="text-admin-foreground">Tentativas</TableHead>
                      <TableHead className="text-admin-foreground">Criado em</TableHead>
                      <TableHead className="text-admin-foreground">Processado em</TableHead>
                      <TableHead className="text-admin-foreground">Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id} className="border-admin-border hover:bg-admin-muted/20">
                        <TableCell className="font-medium text-admin-table-text">
                          {job.job_type.replace('_', ' ').toUpperCase()}
                        </TableCell>
                        <TableCell className="text-admin-table-text">{job.entity_type}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="text-admin-table-text">
                          {job.attempts}/{job.max_attempts}
                        </TableCell>
                        <TableCell className="text-admin-table-text">{formatDate(job.created_at)}</TableCell>
                        <TableCell className="text-admin-table-text">
                          {job.processed_at ? formatDate(job.processed_at) : '-'}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {job.last_error && (
                            <div className="text-sm text-red-400 truncate" title={job.last_error}>
                              {job.last_error}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {jobs.length === 0 && (
                  <div className="text-center py-8 text-admin-muted-foreground">
                    Nenhum job encontrado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}