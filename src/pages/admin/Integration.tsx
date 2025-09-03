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
import { RefreshCw, Settings, History, Play } from "lucide-react";

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

export default function AdminIntegration() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [processingJobs, setProcessingJobs] = useState(false);
  const [settings, setSettings] = useState<IntegrationSettings>({
    api_base_url: '',
    api_login: '',
    api_secret: '',
  });
  const [jobs, setJobs] = useState<IntegrationJob[]>([]);

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
          className="gap-2 border-admin-border text-admin-foreground hover:bg-admin-muted"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-admin-card border-admin-border">
          <TabsTrigger value="settings" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-2 text-admin-foreground data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
            <History className="h-4 w-4" />
            Histórico de Jobs
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
                  <Input
                    id="api_secret"
                    type="password"
                    placeholder="chave_secreta_api"
                    value={settings.api_secret}
                    onChange={(e) => setSettings(prev => ({
                      ...prev, 
                      api_secret: e.target.value
                    }))}
                    required
                    className="bg-admin-input border-admin-border text-admin-foreground placeholder:text-admin-muted-foreground focus:ring-admin-primary focus:border-admin-primary"
                  />
                </div>

                <Button type="submit" disabled={loading} className="bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90">
                  {loading ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
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