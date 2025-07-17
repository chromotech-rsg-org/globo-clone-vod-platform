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

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const siteBgColor = getCustomization('global', 'site_background_color', '#111827');
  const siteName = getCustomization('global', 'site_name', 'Globoplay');
  const siteLogoUrl = getCustomization('global', 'site_logo', '');
  const primaryColor = getCustomization('global', 'primary_color', '#3b82f6');
  const buttonTextColor = getCustomization('global', 'button_text_color', '#ffffff');

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: siteBgColor }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={siteName} className="h-10 w-auto" />
            ) : (
              <div 
                className="text-white px-3 py-1 rounded font-bold text-xl"
                style={{ backgroundColor: primaryColor }}
              >
                {siteName.charAt(0)}
              </div>
            )}
            <span className="text-white font-bold text-2xl">{siteName}</span>
          </Link>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">Acesse sua conta</CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Entre ou cadastre-se no Globoplay
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="login" className="text-gray-300">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="text-gray-300">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="seu@email.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300">Senha</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    style={{ 
                      backgroundColor: primaryColor, 
                      color: buttonTextColor,
                      borderColor: primaryColor
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-gray-300">Nome</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={registerData.name}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Seu nome completo"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-gray-300">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="seu@email.com"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-gray-300">Senha</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    style={{ 
                      backgroundColor: primaryColor, 
                      color: buttonTextColor,
                      borderColor: primaryColor
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Não tem uma conta?{' '}
                <Link 
                  to="/checkout" 
                  style={{ color: primaryColor }}
                  className="hover:opacity-80"
                >
                  Assine agora
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;