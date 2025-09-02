
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';

const AuctionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auction, setAuction] = useState<Partial<Auction>>({
    name: '',
    description: '',
    youtube_url: '',
    initial_bid_value: 0,
    current_bid_value: 0,
    bid_increment: 0,
    start_date: '',
    end_date: '',
    registration_wait_value: 5,
    registration_wait_unit: 'minutes',
    status: 'inactive',
    auction_type: 'rural',
    is_live: false
  });

  useEffect(() => {
    if (id) {
      fetchAuction();
    } else {
      setLoading(false);
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

      if (data) {
        setAuction({
          ...data,
          registration_wait_unit: data.registration_wait_unit as 'minutes' | 'hours' | 'days',
          status: data.status as 'active' | 'inactive',
          auction_type: data.auction_type as 'rural' | 'judicial'
        });
      }
    } catch (error) {
      console.error('Erro ao buscar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do leilão",
        variant: "destructive",
      });
      navigate('/admin/leiloes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const auctionData = {
        name: auction.name,
        description: auction.description,
        youtube_url: auction.youtube_url,
        initial_bid_value: auction.initial_bid_value,
        current_bid_value: auction.current_bid_value,
        bid_increment: auction.bid_increment,
        start_date: auction.start_date,
        end_date: auction.end_date,
        registration_wait_value: auction.registration_wait_value,
        registration_wait_unit: auction.registration_wait_unit,
        status: auction.status,
        auction_type: auction.auction_type,
        is_live: auction.is_live
      };

      let result;
      if (id) {
        result = await supabase
          .from('auctions')
          .update(auctionData)
          .eq('id', id);
      } else {
        result = await supabase
          .from('auctions')
          .insert([auctionData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Sucesso",
        description: id ? "Leilão atualizado com sucesso" : "Leilão criado com sucesso",
      });

      navigate('/admin/leiloes');
    } catch (error) {
      console.error('Erro ao salvar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o leilão",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-admin-table-text">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">
            {id ? 'Editar Leilão' : 'Criar Leilão'}
          </h1>
        </div>
      </header>

      <div className="p-6">
        <Card className="bg-admin-card border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text">
              {id ? 'Editar Leilão' : 'Novo Leilão'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-admin-table-text">Nome</Label>
                  <Input
                    id="name"
                    value={auction.name}
                    onChange={(e) => setAuction({ ...auction, name: e.target.value })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="auction_type" className="text-admin-table-text">Tipo</Label>
                  <select
                    id="auction_type"
                    value={auction.auction_type}
                    onChange={(e) => setAuction({ ...auction, auction_type: e.target.value as 'rural' | 'judicial' })}
                    className="w-full px-3 py-2 bg-admin-content-bg border border-admin-border text-admin-table-text rounded"
                  >
                    <option value="rural">Rural</option>
                    <option value="judicial">Judicial</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="initial_bid_value" className="text-admin-table-text">Valor Inicial</Label>
                  <Input
                    id="initial_bid_value"
                    type="number"
                    step="0.01"
                    value={auction.initial_bid_value}
                    onChange={(e) => setAuction({ ...auction, initial_bid_value: parseFloat(e.target.value) || 0 })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>

                <div>
                  <Label htmlFor="current_bid_value" className="text-admin-table-text">Valor Atual</Label>
                  <Input
                    id="current_bid_value"
                    type="number"
                    step="0.01"
                    value={auction.current_bid_value}
                    onChange={(e) => setAuction({ ...auction, current_bid_value: parseFloat(e.target.value) || 0 })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>

                <div>
                  <Label htmlFor="bid_increment" className="text-admin-table-text">Incremento</Label>
                  <Input
                    id="bid_increment"
                    type="number"
                    step="0.01"
                    value={auction.bid_increment}
                    onChange={(e) => setAuction({ ...auction, bid_increment: parseFloat(e.target.value) || 0 })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-admin-table-text">Status</Label>
                  <select
                    id="status"
                    value={auction.status}
                    onChange={(e) => setAuction({ ...auction, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-3 py-2 bg-admin-content-bg border border-admin-border text-admin-table-text rounded"
                  >
                    <option value="inactive">Inativo</option>
                    <option value="active">Ativo</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="start_date" className="text-admin-table-text">Data de Início</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={auction.start_date}
                    onChange={(e) => setAuction({ ...auction, start_date: e.target.value })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>

                <div>
                  <Label htmlFor="end_date" className="text-admin-table-text">Data de Fim</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={auction.end_date}
                    onChange={(e) => setAuction({ ...auction, end_date: e.target.value })}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-admin-table-text">Descrição</Label>
                <Textarea
                  id="description"
                  value={auction.description}
                  onChange={(e) => setAuction({ ...auction, description: e.target.value })}
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="youtube_url" className="text-admin-table-text">URL do YouTube</Label>
                <Input
                  id="youtube_url"
                  value={auction.youtube_url}
                  onChange={(e) => setAuction({ ...auction, youtube_url: e.target.value })}
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_live"
                  checked={auction.is_live}
                  onCheckedChange={(checked) => setAuction({ ...auction, is_live: checked })}
                />
                <Label htmlFor="is_live" className="text-admin-table-text">Leilão ao vivo</Label>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/leiloes')}
                  className="border-admin-border text-admin-table-text"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-admin-primary hover:bg-admin-primary/90"
                >
                  {saving ? 'Salvando...' : (id ? 'Atualizar' : 'Criar')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AuctionEdit;
