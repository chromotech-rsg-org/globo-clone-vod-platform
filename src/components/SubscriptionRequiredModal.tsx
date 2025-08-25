
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, CreditCard, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubscriptionRequiredModal = ({ isOpen, onClose }: SubscriptionRequiredModalProps) => {
  const navigate = useNavigate();

  const handleSubscribe = () => {
    // Navegar para checkout sem plano específico (deixa usuário escolher)
    navigate('/checkout');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Assinatura Necessária
          </DialogTitle>
          <DialogDescription>
            Para acessar os leilões, você precisa ter uma assinatura ativa.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Lock className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-lg">Acesso Premium</CardTitle>
            <CardDescription>
              Desbloqueie todas as funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Com uma assinatura você pode:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Participar de leilões ao vivo
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Fazer lances em tempo real
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Acessar transmissões gravadas
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 bg-primary rounded-full"></span>
                  Receber notificações exclusivas
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleSubscribe} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Assinar Agora
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full">
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionRequiredModal;
