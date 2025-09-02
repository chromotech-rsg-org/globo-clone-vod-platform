
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save } from 'lucide-react';

interface AuctionFormData {
  name: string;
  description?: string;
  youtube_url?: string;
  initial_bid_value: number;
  bid_increment: number;
  start_date?: string;
  end_date?: string;
  registration_wait_value: number;
  registration_wait_unit: 'minutes' | 'hours' | 'days';
  status: 'active' | 'inactive';
  auction_type: 'rural' | 'judicial';
  increment_mode: string;
  min_custom_bid?: number;
  max_custom_bid?: number;
}

const AuctionEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AuctionFormData>({
    name: '',
    description: '',
    youtube_url: '',
    initial_bid_value: 0,
    bid_increment: 100,
    start_date: '',
    end_date: '',
    registration_wait_value: 5,
    registration_wait_unit: 'minutes',
    status: 'inactive',
    auction_type: 'rural',
    increment_mode: 'fixed',
    min_custom_bid: 0,
    max_custom_bid: 0,
  });

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

      if (data) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          youtube_url: data.youtube_url || '',
          initial_bid_value: data.initial_bid_value || 0,
          bid_increment: data.bid_increment || 100,
          start_date: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : '',
          end_date: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : '',
          registration_wait_value: data.registration_wait_value || 5,
          registration_wait_unit: data.registration_wait_unit || 'minutes',
          status: data.status || 'inactive',
          auction_type: data.auction_type || 'rural',
          increment_mode: data.increment_mode || 'fixed',
          min_custom_bid: data.min_custom_bid || 0,
          max_custom_bid: data.max_custom_bid || 0,
        });
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        ...formData,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('auctions')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Leilão atualizado com sucesso"
      });
      
      navigate('/admin/leiloes');
    } catch (error) {
      console.error('Erro ao atualizar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o leilão",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof AuctionFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <header className="bg-black border-b border-green-600/30">
        <div className="px-6 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/leiloes')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl font-bold text-white">Editar Leilão</h1>
        </div>
      </header>

      <div className="p-6">
        <Card className="bg-black border-green-600/30">
          <CardHeader>
            <CardTitle className="text-white">Informações do Leilão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded"
                  >
                    <option value="inactive">Inativo</option>
                    <option value="active">Ativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tipo do Leilão
                  </label>
                  <select
                    value={formData.auction_type}
                    onChange={(e) => handleInputChange('auction_type', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded"
                  >
                    <option value="rural">Rural</option>
                    <option value="judicial">Judicial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Valor Inicial (R$)
                  </label>
                  <Input
                    type="number"
                    value={formData.initial_bid_value}
                    onChange={(e) => handleInputChange('initial_bid_value', parseFloat(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Incremento (R$)
                  </label>
                  <Input
                    type="number"
                    value={formData.bid_increment}
                    onChange={(e) => handleInputChange('bid_increment', parseFloat(e.target.value) || 0)}
                    className="bg-gray-900 border-gray-700 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tempo de Espera
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.registration_wait_value}
                      onChange={(e) => handleInputChange('registration_wait_value', parseInt(e.target.value) || 0)}
                      className="bg-gray-900 border-gray-700 text-white flex-1"
                      min="1"
                    />
                    <select
                      value={formData.registration_wait_unit}
                      onChange={(e) => handleInputChange('registration_wait_unit', e.target.value)}
                      className="px-3 py-2 bg-gray-900 border border-gray-700 text-white rounded"
                    >
                      <option value="minutes">Minutos</option>
                      <option value="hours">Horas</option>
                      <option value="days">Dias</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data/Hora de Início
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data/Hora de Término
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL do YouTube
                </label>
                <Input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/leiloes')}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="admin"
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
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
