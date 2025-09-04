import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserRegistrationFlowService, RegistrationData } from "@/services/userRegistrationFlow";
import { Loader2, Play } from "lucide-react";

export function UserRegistrationDemo() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<RegistrationData>({
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    password: '123456',
    cpf: '123.456.789-00',
    phone: '(11) 99999-9999',
    selectedPlanId: ''
  });

  const handleTestRegistration = async () => {
    setLoading(true);
    
    try {
      const result = await UserRegistrationFlowService.registerUser(testData);
      
      if (result.success) {
        toast({
          title: "Teste de cadastro concluído",
          description: result.message,
          variant: result.requiresPasswordReset ? "default" : "default"
        });
      } else {
        toast({
          title: "Erro no teste de cadastro",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Test registration error:', error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro inesperado durante o teste",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-admin-card border-admin-border">
      <CardHeader>
        <CardTitle className="text-admin-foreground flex items-center gap-2">
          <Play className="h-5 w-5" />
          Teste do Fluxo de Cadastro
        </CardTitle>
        <CardDescription className="text-admin-muted-foreground">
          Execute um teste completo do fluxo de cadastro com integração MOTV
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-name" className="text-admin-foreground">Nome</Label>
              <Input
                id="test-name"
                value={testData.name}
                onChange={(e) => setTestData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-email" className="text-admin-foreground">E-mail</Label>
              <Input
                id="test-email"
                type="email"
                value={testData.email}
                onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-password" className="text-admin-foreground">Senha</Label>
              <Input
                id="test-password"
                value={testData.password}
                onChange={(e) => setTestData(prev => ({ ...prev, password: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-cpf" className="text-admin-foreground">CPF</Label>
              <Input
                id="test-cpf"
                value={testData.cpf}
                onChange={(e) => setTestData(prev => ({ ...prev, cpf: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-phone" className="text-admin-foreground">Telefone</Label>
              <Input
                id="test-phone"
                value={testData.phone}
                onChange={(e) => setTestData(prev => ({ ...prev, phone: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              onClick={handleTestRegistration}
              disabled={loading}
              className="gap-2 bg-admin-primary text-admin-primary-foreground hover:bg-admin-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Executando teste...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Executar Teste de Cadastro
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserRegistrationDemo;