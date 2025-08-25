
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { useSiteCustomizations } from '@/hooks/useSiteCustomizations';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  Package, 
  TrendingUp,
  Gavel,
  UserCheck,
  HandHeart
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscriptionCheck();
  const { siteName } = useSiteCustomizations();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground">
            Bem-vindo ao {siteName}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Painel administrativo do sistema' : 'Sua área pessoal'}
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm text-muted-foreground">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Perfil:</span>
              <Badge variant={isAdmin ? "default" : "secondary"}>
                {user?.role === 'admin' ? 'Administrador' : 
                 user?.role === 'desenvolvedor' ? 'Desenvolvedor' : 'Usuário'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status da Assinatura:</span>
              <Badge variant={hasActiveSubscription ? "default" : "destructive"}>
                {hasActiveSubscription ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isAdmin && (
            <>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/usuarios')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Gerenciar usuários do sistema</CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/assinaturas')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Gerenciar assinaturas ativas</CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/leiloes')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Leilões</CardTitle>
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Gerenciar leilões do sistema</CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/habilitacoes')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Habilitações</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Aprovar habilitações pendentes</CardDescription>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/admin/lances')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lances</CardTitle>
                  <HandHeart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>Gerenciar lances dos leilões</CardDescription>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meu Perfil</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>Atualizar informações pessoais</CardDescription>
            </CardContent>
          </Card>

          {!hasActiveSubscription && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/checkout')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinar</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CardDescription>Escolher plano e assinar</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call to Action for Non-Subscribers */}
        {!hasActiveSubscription && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Ative sua assinatura
              </CardTitle>
              <CardDescription>
                Para acessar todos os recursos do {siteName}, você precisa de uma assinatura ativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/checkout')}>
                Escolher Plano
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
