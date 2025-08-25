
import React from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Package, CreditCard, Gavel, UserCheck, HandHeart } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin' || user?.role === 'desenvolvedor';

  const stats = [
    { title: 'Usuários Ativos', value: '2,543', icon: Users, color: 'text-blue-600' },
    { title: 'Pacotes Ativos', value: '156', icon: Package, color: 'text-green-600' },
    { title: 'Assinaturas', value: '1,234', icon: CreditCard, color: 'text-purple-600' },
    { title: 'Leilões Ativos', value: '23', icon: Gavel, color: 'text-orange-600' },
    { title: 'Habilitações Pendentes', value: '45', icon: UserCheck, color: 'text-red-600' },
    { title: 'Lances Pendentes', value: '12', icon: HandHeart, color: 'text-indigo-600' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-admin-text mb-2">Dashboard</h1>
          <p className="text-admin-muted-foreground">
            Bem-vindo de volta, {user?.name || user?.email}! Aqui está um resumo da sua plataforma.
          </p>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="bg-admin-card border-admin-border hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-admin-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-admin-text">{stat.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-text">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-admin-border">
                <span className="text-admin-muted-foreground">Novo usuário cadastrado</span>
                <span className="text-sm text-admin-muted-foreground">há 2 minutos</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-admin-border">
                <span className="text-admin-muted-foreground">Nova assinatura ativada</span>
                <span className="text-sm text-admin-muted-foreground">há 15 minutos</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-admin-muted-foreground">Leilão finalizado</span>
                <span className="text-sm text-admin-muted-foreground">há 1 hora</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
