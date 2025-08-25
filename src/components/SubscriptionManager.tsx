
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, CreditCard, ArrowUpCircle, ArrowDownCircle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePlanManagement } from '@/hooks/usePlanManagement';

const SubscriptionManager = () => {
  const navigate = useNavigate();
  const { currentSubscription, availablePlans, loading } = usePlanManagement();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg"></div>
        <div className="h-48 bg-muted animate-pulse rounded-lg"></div>
      </div>
    );
  }

  const handleChangePlan = (planId?: string) => {
    if (planId) {
      navigate('/checkout', { state: { planId, isUpgrade: true } });
    } else {
      navigate('/plans');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      {currentSubscription ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Plano Atual
                </CardTitle>
                <CardDescription>
                  Informações sobre sua assinatura ativa
                </CardDescription>
              </div>
              <Badge variant="default">Ativo</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plano</p>
                <p className="font-semibold text-lg">{currentSubscription.plan.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(currentSubscription.plan.price)}
                  <span className="text-sm text-muted-foreground ml-1">
                    /{currentSubscription.plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {currentSubscription.end_date ? 'Renovação' : 'Ativo desde'}
                </p>
                <p className="font-semibold flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(
                    new Date(currentSubscription.end_date || currentSubscription.start_date), 
                    'dd/MM/yyyy',
                    { locale: ptBR }
                  )}
                </p>
              </div>
            </div>

            {currentSubscription.plan.description && (
              <div>
                <p className="text-sm text-muted-foreground">Descrição</p>
                <p className="text-sm">{currentSubscription.plan.description}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleChangePlan()}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Alterar Plano
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Nenhuma Assinatura Ativa
            </CardTitle>
            <CardDescription>
              Você não possui uma assinatura ativa no momento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => handleChangePlan()} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      {availablePlans.length > 0 && currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Planos Disponíveis</CardTitle>
            <CardDescription>
              Outros planos que você pode escolher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availablePlans
                .filter(plan => plan.id !== currentSubscription.plan.id)
                .map((plan) => {
                  const isUpgrade = plan.price > currentSubscription.plan.price;
                  const isDowngrade = plan.price < currentSubscription.plan.price;
                  
                  return (
                    <div 
                      key={plan.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{plan.name}</h4>
                          {isUpgrade && (
                            <Badge variant="secondary" className="text-green-600">
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                              Upgrade
                            </Badge>
                          )}
                          {isDowngrade && (
                            <Badge variant="outline" className="text-orange-600">
                              <ArrowDownCircle className="h-3 w-3 mr-1" />
                              Downgrade
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{formatCurrency(plan.price)}/{plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}</span>
                          {plan.description && (
                            <span>{plan.description}</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleChangePlan(plan.id)}
                      >
                        Selecionar
                      </Button>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubscriptionManager;
