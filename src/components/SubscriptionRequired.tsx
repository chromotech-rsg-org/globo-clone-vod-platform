
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard } from 'lucide-react';

const SubscriptionRequired = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Assinatura Necessária</CardTitle>
          <CardDescription>
            Para acessar os leilões, você precisa ter uma assinatura ativa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            <p>Com uma assinatura você pode:</p>
            <ul className="mt-2 space-y-1">
              <li>• Participar de leilões ao vivo</li>
              <li>• Fazer lances em tempo real</li>
              <li>• Acessar transmissões gravadas</li>
              <li>• Receber notificações exclusivas</li>
            </ul>
          </div>
          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link to="/checkout">
                <CreditCard className="h-4 w-4 mr-2" />
                Assinar Agora
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">
                Voltar ao Painel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionRequired;
