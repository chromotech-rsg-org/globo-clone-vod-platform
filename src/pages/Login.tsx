import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCustomizations } from '@/hooks/useCustomizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', password: '', cpf: '', phone: ''
  });
  
  const { login, register, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getCustomization } = useCustomizations('login');

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      console.log('User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await login(loginData.email, loginData.password);
      
      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas. Tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard..."
        });
        // Navigation will happen automatically via useEffect
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      const { error } = await register(registerData);
      
      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message || "Não foi possível criar a conta. Tente novamente.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Cadastro realizado com sucesso!",
          description: "Verifique seu email para confirmar a conta."
        });
      }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking authentication state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is already logged in
  if (user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Get customizations using the correct keys
  const loginTitle = getCustomization('form', 'title', 'Acesse sua conta');
  const loginSubtitle = getCustomization('form', 'subtitle', 'Entre ou cadastre-se no Globoplay');
  const loginBgColor = getCustomization('background', 'color', '#111827');
  const loginBgImage = getCustomization('background', 'image', '');
  const loginCardBgColor = getCustomization('card', 'background', '#1f2937');
  
  // Global customizations
  const siteName = getCustomization('global', 'site_name', 'Globoplay');
  const siteLogoUrl = getCustomization('global', 'site_logo', '');
  const primaryColor = getCustomization('global', 'primary_color', '#3b82f6');
  const buttonTextColor = getCustomization('global', 'button_text_color', '#ffffff');

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Background Image Section */}
      <div 
        className="hidden lg:block relative"
        style={{
          backgroundImage: `url('${loginBgImage || '/lovable-uploads/3c31e6f6-37f9-475f-b8fe-d62743f4c2e8.png'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Login Form Section */}
      <div className="flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt={siteName} className="h-16 w-auto" />
              ) : (
                <div 
                  className="text-white px-4 py-2 rounded-lg font-bold text-2xl"
                  style={{ backgroundColor: '#4ade80' }}
                >
                  AGRO
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-lg text-gray-600">Acessar Agro Play</h1>
                <span className="text-gray-400">↓</span>
              </div>
              <h2 className="text-2xl font-semibold text-green-600">Gerenciar Conta</h2>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Usuário"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="relative">
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Senha"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={isSubmitting}
                >
                  {showLoginPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="text-center">
              <Link 
                to="/forgot-password"
                className="text-gray-600 text-sm hover:text-green-600 transition-colors"
              >
                Esqueci minha senha
              </Link>
            </div>
          </form>

          {/* Register Link */}
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  // Switch to register tab functionality
                  const registerTab = document.querySelector('[data-value="register"]') as HTMLElement;
                  registerTab?.click();
                }}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Cadastre-se
              </button>
            </p>
            
            {/* Bottom Logo */}
            <div className="pt-8">
              <div className="text-center">
                <span className="text-green-600 font-bold text-lg">agro</span>
                <span className="text-gray-600 font-bold text-lg">mercado</span>
              </div>
            </div>
          </div>

          {/* Hidden Register Form */}
          <div className="hidden" data-register-form>
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="space-y-4">
                <Input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Nome completo"
                  required
                  disabled={isSubmitting}
                />
                
                <Input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Email"
                  required
                  disabled={isSubmitting}
                />
                
                <div className="relative">
                  <Input
                    type={showRegisterPassword ? "text" : "password"}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Senha"
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    {showRegisterPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;