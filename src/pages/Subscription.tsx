
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { AlertTriangle, CreditCard, Calendar, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { user } = useAuth();
  const { hasActiveSubscription, loading } = useSubscriptionCheck();
  const navigate = useNavigate();

  const handleChoosePlan = () => {
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {hasActiveSubscription ? 'Sua Assinatura' : 'Assinatura Necessária'}
          </h1>
          <p className="text-lg text-gray-600">
            {hasActiveSubscription 
              ? 'Gerencie sua assinatura e veja os detalhes' 
              : 'Você precisa de uma assinatura ativa para acessar este conteúdo'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nome</label>
                  <p className="text-lg">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Status da Assinatura
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasActiveSubscription ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">
                      Ativa
                    </Badge>
                    <span className="text-green-700">Sua assinatura está ativa</span>
                  </div>
                  <p className="text-gray-600">
                    Você tem acesso completo a todos os recursos da plataforma.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <span className="text-lg font-medium">Nenhuma assinatura ativa</span>
                  </div>
                  <p className="text-gray-600">
                    Você não possui uma assinatura ativa no momento.
                  </p>
                  <Button 
                    onClick={handleChoosePlan}
                    className="w-full sm:w-auto"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Escolher um plano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Info */}
          {!hasActiveSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>Por que preciso de uma assinatura?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Para acessar nossos leilões e recursos exclusivos, você precisa de uma assinatura ativa que inclui:
                  </p>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Participação em leilões ao vivo
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Acesso a conteúdo premium
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Suporte prioritário
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      Histórico de lances e atividades
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
