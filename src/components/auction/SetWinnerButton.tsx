
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Loader2 } from 'lucide-react';

interface SetWinnerButtonProps {
  bidId: string;
  onSuccess?: () => void;
  className?: string;
}

const SetWinnerButton = ({ bidId, onSuccess, className }: SetWinnerButtonProps) => {
  const [setting, setSetting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSetWinner = async () => {
    if (!user || !['admin', 'desenvolvedor'].includes(user.role)) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem definir vencedores",
        variant: "destructive"
      });
      return;
    }

    if (!confirm('Tem certeza que deseja definir este lance como vencedor?')) {
      return;
    }

    try {
      setSetting(true);
      
      const { error } = await supabase.rpc('set_bid_winner', {
        p_bid_id: bidId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Vencedor definido com sucesso!",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error setting winner:', error);
      toast({
        title: "Erro",
        description: "Não foi possível definir o vencedor",
        variant: "destructive"
      });
    } finally {
      setSetting(false);
    }
  };

  // Only show button for admin/developer roles
  if (!user || !['admin', 'desenvolvedor'].includes(user.role)) {
    return null;
  }

  return (
    <Button
      onClick={handleSetWinner}
      disabled={setting}
      className={`bg-green-600 hover:bg-green-700 text-white ${className}`}
      size="sm"
    >
      {setting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Trophy className="h-4 w-4 mr-2" />
      )}
      {setting ? 'Definindo...' : 'Definir Vencedor'}
    </Button>
  );
};

export default SetWinnerButton;
