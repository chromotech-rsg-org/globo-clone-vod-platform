
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { RegisterData } from '@/types/auth';
import { useCustomizations } from '@/hooks/useCustomizations';
import { navigateToSection } from '@/utils/scrollToSection';

interface AuthCardProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (data: RegisterData) => Promise<void>;
  isSubmitting: boolean;
}

const AuthCard = ({ onLogin, onRegister, isSubmitting }: AuthCardProps) => {
  const { getCustomization } = useCustomizations('global');
  const navigate = useNavigate();
  const location = useLocation();
  
  const siteName = getCustomization('global_site_name', 'Globoplay');
  const logoUrl = getCustomization('global_logo_url', '');
  
  const handlePlansClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigateToSection(navigate, '/#plans', location.pathname);
  };

  return (
    <div className="max-w-md w-full">
      <div className="text-center mb-8">
        <button onClick={() => navigate('/')} className="inline-flex items-center space-x-2">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-8 w-auto" />
          ) : (
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              {siteName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-white font-bold text-2xl">{siteName}</span>
        </button>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl text-center">Acesse sua conta</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Entre ou cadastre-se no {siteName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-700">
              <TabsTrigger value="login" className="text-gray-300">Entrar</TabsTrigger>
              <TabsTrigger value="register" className="text-gray-300">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <LoginForm onSubmit={onLogin} isSubmitting={isSubmitting} />
            </TabsContent>
            
            <TabsContent value="register">
              <RegisterForm onSubmit={onRegister} isSubmitting={isSubmitting} />
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Não tem uma conta?{' '}
              <button
                onClick={handlePlansClick}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Assine agora
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCard;
