
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AuctionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const AuctionCreateModal = ({ isOpen, onClose, onSave }: AuctionCreateModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    youtube_url: '',
    initial_bid_value: 0,
    current_bid_value: 0,
    bid_increment: 100,
    start_date: '',
    end_date: '',
    registration_wait_value: 5,
    registration_wait_unit: 'minutes' as 'minutes' | 'hours' | 'days',
    status: 'inactive' as 'active' | 'inactive',
    auction_type: 'rural' as 'rural' | 'judicial',
    is_live: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const auctionData = {
        name: formData.name,
        description: formData.description,
        youtube_url: formData.youtube_url,
        initial_bid_value: formData.initial_bid_value,
        current_bid_value: formData.current_bid_value || formData.initial_bid_value,
        bid_increment: formData.bid_increment,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        registration_wait_value: formData.registration_wait_value,
        registration_wait_unit: formData.registration_wait_unit,
        status: formData.status,
        auction_type: formData.auction_type,
        is_live: formData.is_live
      };

      const { error } = await supabase
        .from('auctions')
        .insert([auctionData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Leilão criado com sucesso"
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        youtube_url: '',
        initial_bid_value: 0,
        current_bid_value: 0,
        bid_increment: 100,
        start_date: '',
        end_date: '',
        registration_wait_value: 5,
        registration_wait_unit: 'minutes',
        status: 'inactive',
        auction_type: 'rural',
        is_live: false
      });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao criar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o leilão",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Novo Leilão</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-white">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-black border-green-600/30 text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="auction_type" className="text-white">Tipo</Label>
              <select
                id="auction_type"
                value={formData.auction_type}
                onChange={(e) => setFormData({ ...formData, auction_type: e.target.value as 'rural' | 'judicial' })}
                className="w-full px-3 py-2 bg-black border border-green-600/30 text-white rounded"
              >
                <option value="rural">Rural</option>
                <option value="judicial">Judicial</option>
              </select>
            </div>

            <div>
              <Label htmlFor="initial_bid_value" className="text-white">Valor Inicial</Label>
              <Input
                id="initial_bid_value"
                type="number"
                step="0.01"
                value={formData.initial_bid_value}
                onChange={(e) => setFormData({ ...formData, initial_bid_value: parseFloat(e.target.value) || 0 })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="current_bid_value" className="text-white">Valor Atual</Label>
              <Input
                id="current_bid_value"
                type="number"
                step="0.01"
                value={formData.current_bid_value}
                onChange={(e) => setFormData({ ...formData, current_bid_value: parseFloat(e.target.value) || 0 })}
                className="bg-black border-green-600/30 text-white"
                placeholder="Se vazio, usará o valor inicial"
              />
            </div>

            <div>
              <Label htmlFor="bid_increment" className="text-white">Incremento</Label>
              <Input
                id="bid_increment"
                type="number"
                step="0.01"
                value={formData.bid_increment}
                onChange={(e) => setFormData({ ...formData, bid_increment: parseFloat(e.target.value) || 0 })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="status" className="text-white">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 bg-black border border-green-600/30 text-white rounded"
              >
                <option value="inactive">Inativo</option>
                <option value="active">Ativo</option>
              </select>
            </div>

            <div>
              <Label htmlFor="start_date" className="text-white">Data de Início</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="end_date" className="text-white">Data de Fim</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="registration_wait_value" className="text-white">Tempo de Espera para Registro</Label>
              <div className="flex gap-2">
                <Input
                  id="registration_wait_value"
                  type="number"
                  value={formData.registration_wait_value}
                  onChange={(e) => setFormData({ ...formData, registration_wait_value: parseInt(e.target.value) || 0 })}
                  className="bg-black border-green-600/30 text-white flex-1"
                />
                <select
                  value={formData.registration_wait_unit}
                  onChange={(e) => setFormData({ ...formData, registration_wait_unit: e.target.value as 'minutes' | 'hours' | 'days' })}
                  className="px-3 py-2 bg-black border border-green-600/30 text-white rounded"
                >
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                  <option value="days">Dias</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-black border-green-600/30 text-white"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="youtube_url" className="text-white">URL do YouTube</Label>
            <Input
              id="youtube_url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              className="bg-black border-green-600/30 text-white"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_live"
              checked={formData.is_live}
              onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
            />
            <Label htmlFor="is_live" className="text-white">Leilão ao vivo</Label>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-green-600/30 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Criando...' : 'Criar Leilão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuctionCreateModal;
