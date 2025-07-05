
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/auth/LoadingSpinner';
import AuthCard from '@/components/auth/AuthCard';
import { RegisterData } from '@/types/auth';

const Login = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, user, session, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    console.log('Login page - checking auth state:', { user: !!user, session: !!session, isLoading });
    if (session && !isLoading) {
      console.log('User has session, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [session, isLoading, navigate]);

  const handleLogin = async (email: string, password: string) => {
    if (isSubmitting || isLoading) return;
    
    console.log('Login form submitted');
    setIsSubmitting(true);

    try {
      const { error } = await login(email, password);
      
      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Erro no login",
          description: error.message || "Credenciais inválidas. Tente novamente.",
          variant: "destructive"
        });
        setIsSubmitting(false);
      } else {
        console.log('Login successful, showing success message');
        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando para o dashboard..."
        });
        
        // The redirect will happen automatically via useEffect when user state updates
        // But add a timeout as fallback
        setTimeout(() => {
          console.log('Fallback redirect after login');
          navigate('/dashboard', { replace: true });
          setIsSubmitting(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Login exception:', error);
      toast({
        title: "Erro no login",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (registerData: RegisterData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

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
    
    setIsSubmitting(false);
  };

  // Show loading while checking authentication state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't render the login form if user is already logged in
  if (user) {
    return <LoadingSpinner message="Redirecionando..." />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <AuthCard 
        onLogin={handleLogin}
        onRegister={handleRegister}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default Login;
