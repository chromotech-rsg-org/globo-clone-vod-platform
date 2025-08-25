
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, CreditCard, X } from 'lucide-react';
import { useSiteCustomizations } from '@/hooks/useSiteCustomizations';

interface SubscriptionRequiredModalProps {
  open: boolean;
  onClose: () => void;
}

const SubscriptionRequiredModal = ({ open, onClose }: SubscriptionRequiredModalProps) => {
  const navigate = useNavigate();
  const { siteName } = useSiteCustomizations();

  const handleSubscribe = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Assinatura Necessária
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Para acessar os leilões, você precisa ter uma assinatura ativa no {siteName}.
          </p>
          
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Com uma assinatura você pode:</p>
            <ul className="space-y-1">
              <li>• Participar de leilões ao vivo</li>
              <li>• Fazer lances em tempo real</li>
              <li>• Acessar transmissões gravadas</li>
              <li>• Receber notificações exclusivas</li>
            </ul>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleSubscribe} className="w-full">
              <CreditCard className="h-4 w-4 mr-2" />
              Assinar Agora
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionRequiredModal;
