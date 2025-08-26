
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtime } from '@/hooks/useRealtime';
import { AlertCircle, CheckCircle, Clock, XCircle, RotateCcw } from 'lucide-react';

interface Registration {
  id: string;
  status: string;
  client_notes?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

interface HabilitationStatusProps {
  auctionId: string;
}

const HabilitationStatus = ({ auctionId }: HabilitationStatusProps) => {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [reopening, setReopening] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRegistration = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('auction_registrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('auction_id', auctionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setRegistration(data);
    } catch (error) {
      console.error('Error fetching registration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistration();
  }, [user?.id, auctionId]);

  // Setup realtime updates
  useRealtime({
    onRegistrationUpdate: fetchRegistration
  });

  const handleReopenRegistration = async () => {
    if (!user?.id) return;
    
    try {
      setReopening(true);
      const { error } = await supabase.rpc('reopen_registration', {
        p_user: user.id,
        p_auction: auctionId
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Habilitação reaberta com sucesso!",
      });
      
      fetchRegistration();
    } catch (error) {
      console.error('Error reopening registration:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reabrir a habilitação",
        variant: "destructive"
      });
    } finally {
      setReopening(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'canceled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Aprovada</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>;
      case 'canceled':
        return <Badge variant="secondary">Cancelada</Badge>;
      case 'reopened':
        return <Badge variant="outline">Reaberta</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="text-center p-4">
        <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Nenhuma habilitação encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status da Habilitação</h3>
        {getStatusIcon(registration.status)}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          {getStatusBadge(registration.status)}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Criada em:</span>
          <span>{new Date(registration.created_at).toLocaleDateString('pt-BR')}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-600">Atualizada em:</span>
          <span>{new Date(registration.updated_at).toLocaleDateString('pt-BR')}</span>
        </div>

        {registration.client_notes && (
          <div>
            <span className="text-gray-600 block mb-1">Observações:</span>
            <p className="text-sm bg-gray-50 p-2 rounded">{registration.client_notes}</p>
          </div>
        )}

        {registration.status === 'canceled' && (
          <div className="pt-4 flex justify-center">
            <Button
              onClick={handleReopenRegistration}
              disabled={reopening}
              className="w-full"
            >
              {reopening ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reabrir Habilitação
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabilitationStatus;
