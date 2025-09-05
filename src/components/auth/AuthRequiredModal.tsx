import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Lock, User, Mail, Phone, CreditCard } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueAsGuest: () => void;
  title?: string;
  message?: string;
}

const AuthRequiredModal = ({ 
  isOpen, 
  onClose, 
  onContinueAsGuest,
  title = "Autenticação Necessária",
  message = "Para acessar os leilões, você precisa estar logado em sua conta."
}: AuthRequiredModalProps) => {
  const [mode, setMode] = useState<'options' | 'login' | 'register'>('options');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(loginData.email, loginData.password);
      
      if (error) {
        toast({
          title: "Erro no Login",
          description: error.message || "Erro ao fazer login. Verifique suas credenciais.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso!",
          description: "Login realizado com sucesso. Redirecionando..."
        });
        onClose(); // Modal will close and user will be redirected
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao fazer login.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await register(registerData);
      
      if (error) {
        toast({
          title: "Erro no Cadastro",
          description: error.message || "Erro ao criar conta.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Conta criada com sucesso. Verifique seu email para confirmar."
        });
        onClose();
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao criar conta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setMode('options');
    setLoginData({ email: '', password: '' });
    setRegisterData({ name: '', email: '', password: '', cpf: '', phone: '' });
    setShowPassword(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderOptions = () => (
    <div className="space-y-4">
      <div className="text-center">
        <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground mt-2">{message}</p>
      </div>
      
      <div className="space-y-3">
        <Button 
          onClick={() => setMode('login')}
          className="w-full bg-primary hover:bg-primary/90"
          size="lg"
        >
          <User className="h-4 w-4 mr-2" />
          Fazer Login
        </Button>
        
        <Button 
          onClick={() => setMode('register')}
          variant="outline"
          className="w-full"
          size="lg"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Criar Conta
        </Button>
        
        <Button 
          onClick={onContinueAsGuest}
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          Continuar como Visitante
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Como visitante você pode visualizar os leilões, mas não pode dar lances.
      </p>
    </div>
  );

  const renderLogin = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Fazer Login</h3>
        <p className="text-muted-foreground text-sm">Entre com suas credenciais</p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-email"
              type="email"
              placeholder="seu@email.com"
              value={loginData.email}
              onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="login-password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={loginData.password}
              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          
          <Button type="button" variant="outline" onClick={() => setMode('options')} className="w-full">
            Voltar
          </Button>
        </div>
      </form>
    </div>
  );

  const renderRegister = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Criar Conta</h3>
        <p className="text-muted-foreground text-sm">Preencha seus dados para se cadastrar</p>
      </div>
      
      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Nome Completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-name"
              type="text"
              placeholder="Seu nome completo"
              value={registerData.name}
              onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="register-email">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-email"
              type="email"
              placeholder="seu@email.com"
              value={registerData.email}
              onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="register-password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="register-password"
              type={showPassword ? "text" : "password"}
              placeholder="Escolha uma senha"
              value={registerData.password}
              onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="register-cpf">CPF (opcional)</Label>
            <Input
              id="register-cpf"
              type="text"
              placeholder="000.000.000-00"
              value={registerData.cpf}
              onChange={(e) => setRegisterData(prev => ({ ...prev, cpf: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-phone">Telefone (opcional)</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="register-phone"
                type="text"
                placeholder="(00) 00000-0000"
                value={registerData.phone}
                onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando conta..." : "Criar Conta"}
          </Button>
          
          <Button type="button" variant="outline" onClick={() => setMode('options')} className="w-full">
            Voltar
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">
            {mode === 'options' ? 'Escolha uma opção' : 
             mode === 'login' ? 'Fazer Login' : 'Criar Conta'}
          </DialogTitle>
        </DialogHeader>
        
        {mode === 'options' && renderOptions()}
        {mode === 'login' && renderLogin()}
        {mode === 'register' && renderRegister()}
      </DialogContent>
    </Dialog>
  );
};

export default AuthRequiredModal;