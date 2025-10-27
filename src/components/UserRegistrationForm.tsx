import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRegistrationFlowService, RegistrationData, RegistrationResult } from "@/services/userRegistrationFlow";
import { Loader2, Eye, EyeOff, User, Mail, Lock, Phone, CreditCard, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { RegistrationSuccessModal } from "@/components/auth/RegistrationSuccessModal";
import { EmailAlreadyExistsModal } from "@/components/auth/EmailAlreadyExistsModal";
import { ErrorModal } from "@/components/auth/ErrorModal";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
}

export function UserRegistrationForm() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoaded, setPlansLoaded] = useState(false);
  
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    selectedPlanId: ''
  });

  // Estados dos modais
  const [modalState, setModalState] = useState<{
    type: 'success' | 'emailExists' | 'error' | null;
    data?: any;
  }>({ type: null });

  const getCustomization = (key: string, fallback: string) => {
    // Pegar URL do portal de customizações ou usar fallback
    return fallback;
  };

  // Carrega os planos disponíveis
  const loadPlans = async () => {
    if (plansLoaded) return;
    
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, description, price, billing_cycle')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error) {
        console.error('Error loading plans:', error);
        return;
      }

      setPlans(data || []);
      setPlansLoaded(true);
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  };

  // Manipula mudanças nos campos do formulário
  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Valida o formulário
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setModalState({
        type: 'error',
        data: {
          title: 'Dados Inválidos',
          message: 'Nome é obrigatório.',
          errorType: 'validation'
        }
      });
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setModalState({
        type: 'error',
        data: {
          title: 'Dados Inválidos',
          message: 'E-mail válido é obrigatório.',
          errorType: 'validation'
        }
      });
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      setModalState({
        type: 'error',
        data: {
          title: 'Dados Inválidos',
          message: 'A senha deve ter pelo menos 6 caracteres.',
          errorType: 'validation'
        }
      });
      return false;
    }

    return true;
  };

  // Processa o resultado do cadastro
  const handleRegistrationResult = (result: RegistrationResult) => {
    if (result.success) {
      // Buscar nome do plano selecionado
      const selectedPlan = plans.find(p => p.id === formData.selectedPlanId);
      
      setModalState({
        type: 'success',
        data: {
          userName: formData.name,
          planName: selectedPlan?.name
        }
      });
    } else {
      // Verificar se é erro de email duplicado
      if (result.message.includes('já está cadastrado') || 
          result.message.includes('já existe')) {
        setModalState({
          type: 'emailExists',
          data: { email: formData.email }
        });
      } else {
        // Verificar tipo de erro
        let errorType: 'portal' | 'connection' | 'generic' = 'generic';
        if (result.message.includes('portal')) {
          errorType = 'portal';
        } else if (result.message.includes('conexão') || result.message.includes('conectar')) {
          errorType = 'connection';
        }

        setModalState({
          type: 'error',
          data: {
            message: result.message,
            errorType
          }
        });
      }
    }
  };

  // Submete o formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const result = await UserRegistrationFlowService.registerUser(formData);
      handleRegistrationResult(result);
    } catch (error) {
      console.error('Registration error:', error);
      setModalState({
        type: 'error',
        data: {
          message: 'Ocorreu um erro inesperado. Tente novamente.',
          errorType: 'generic'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers dos modais
  const handleAccessAccount = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (!error) {
        navigate('/dashboard');
      } else {
        navigate('/login', { state: { email: formData.email } });
      }
    } catch (e) {
      navigate('/login', { state: { email: formData.email } });
    }
  };

  const handleGoToPortal = () => {
    const portalUrl = getCustomization('portal_url', 'https://agromercado.tv.br');
    window.open(portalUrl, '_blank');
  };

  const handleLogin = () => {
    navigate('/login', { state: { email: formData.email } });
  };

  const handleResetPassword = () => {
    navigate('/reset-password', { state: { email: formData.email } });
  };

  const handleTryAnotherEmail = () => {
    setModalState({ type: null });
    setFormData(prev => ({ ...prev, email: '' }));
  };

  const handleCloseErrorModal = () => {
    setModalState({ type: null });
  };

  const handleRetry = () => {
    setModalState({ type: null });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            Criar Conta
          </CardTitle>
          <CardDescription>
            Preencha os dados abaixo para criar sua conta na plataforma
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Plano */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Selecionar Plano (Opcional)
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="plan">Plano</Label>
                <Select
                  value={formData.selectedPlanId}
                  onValueChange={(value) => handleInputChange('selectedPlanId', value)}
                  onOpenChange={loadPlans}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano (deixe em branco para decidir depois)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum plano selecionado</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-sm text-muted-foreground">
                            R$ {plan.price.toFixed(2)}/{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botão de cadastro */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>

            {/* Link para login */}
            <div className="text-center text-sm text-muted-foreground">
              Já possui uma conta?{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/login')}
              >
                Fazer login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Modais */}
      <RegistrationSuccessModal
        isOpen={modalState.type === 'success'}
        userName={modalState.data?.userName || ''}
        planName={modalState.data?.planName}
        onAccessAccount={handleAccessAccount}
        onGoToPortal={handleGoToPortal}
      />

      <EmailAlreadyExistsModal
        isOpen={modalState.type === 'emailExists'}
        email={modalState.data?.email || ''}
        onLogin={handleLogin}
        onResetPassword={handleResetPassword}
        onTryAnotherEmail={handleTryAnotherEmail}
      />

      <ErrorModal
        isOpen={modalState.type === 'error'}
        title={modalState.data?.title}
        message={modalState.data?.message || ''}
        errorType={modalState.data?.errorType}
        onRetry={handleRetry}
        onClose={handleCloseErrorModal}
      />
    </div>
  );
}

export default UserRegistrationForm;