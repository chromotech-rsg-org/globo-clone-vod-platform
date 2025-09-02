
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Edit, Play, Pause } from 'lucide-react';

interface Auction {
  id: string;
  name: string;
  description?: string;
  youtube_url?: string;
  initial_bid_value: number;
  current_bid_value: number;
  bid_increment: number;
  start_date?: string;
  end_date?: string;
  registration_wait_value: number;
  registration_wait_unit: string;
  status: string;
  auction_type: string;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

const AuctionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [auction, setAuction] = useState<Auction | null>(null);

  useEffect(() => {
    if (id) {
      fetchAuction();
    }
  }, [id]);

  const fetchAuction = async () => {
    try {
      const { data, error } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAuction(data as Auction);
    } catch (error) {
      console.error('Erro ao carregar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o leilão",
        variant: "destructive"
      });
      navigate('/admin/leiloes');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/leiloes/editar/${id}`);
  };

  const toggleLiveStatus = async () => {
    if (!auction) return;

    try {
      const { error } = await supabase
        .from('auctions')
        .update({ 
          is_live: !auction.is_live,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setAuction(prev => prev ? { ...prev, is_live: !prev.is_live } : null);
      
      toast({
        title: "Sucesso",
        description: `Leilão ${!auction.is_live ? 'iniciado' : 'pausado'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar status do leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do leilão",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="p-6">
        <div className="text-white">Leilão não encontrado</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/leiloes')}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-xl font-bold text-white">Detalhes do Leilão</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={toggleLiveStatus}
              variant={auction.is_live ? "destructive" : "admin"}
              size="sm"
            >
              {auction.is_live ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar Leilão
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Leilão
                </>
              )}
            </Button>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black border-green-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Informações Básicas
                <div className="flex gap-2">
                  <Badge variant={auction.status === 'active' ? 'admin-success' : 'admin-muted'}>
                    {auction.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                  {auction.is_live && (
                    <Badge variant="admin-danger">
                      AO VIVO
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Nome</label>
                <p className="text-white font-medium">{auction.name}</p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Tipo</label>
                <p className="text-white">{auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}</p>
              </div>
              
              {auction.description && (
                <div>
                  <label className="text-sm text-gray-400">Descrição</label>
                  <p className="text-white">{auction.description}</p>
                </div>
              )}
              
              {auction.youtube_url && (
                <div>
                  <label className="text-sm text-gray-400">URL do YouTube</label>
                  <p className="text-white break-all">{auction.youtube_url}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-black border-green-600/30">
            <CardHeader>
              <CardTitle className="text-white">Valores e Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">Valor Inicial</label>
                  <p className="text-white font-medium">R$ {auction.initial_bid_value.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Valor Atual</label>
                  <p className="text-white font-medium">R$ {auction.current_bid_value.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Incremento</label>
                  <p className="text-white">R$ {auction.bid_increment.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-400">Tempo de Espera</label>
                  <p className="text-white">
                    {auction.registration_wait_value} {
                      auction.registration_wait_unit === 'minutes' ? 'minutos' :
                      auction.registration_wait_unit === 'hours' ? 'horas' : 'dias'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black border-green-600/30">
          <CardHeader>
            <CardTitle className="text-white">Datas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400">Data de Início</label>
                <p className="text-white">
                  {auction.start_date ? new Date(auction.start_date).toLocaleString('pt-BR') : 'Não definida'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Data de Término</label>
                <p className="text-white">
                  {auction.end_date ? new Date(auction.end_date).toLocaleString('pt-BR') : 'Não definida'}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Criado em</label>
                <p className="text-white">
                  {new Date(auction.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div>
                <label className="text-sm text-gray-400">Atualizado em</label>
                <p className="text-white">
                  {new Date(auction.updated_at).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuctionDetails;
