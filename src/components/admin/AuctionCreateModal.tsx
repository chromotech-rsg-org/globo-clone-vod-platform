
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import ImageUpload from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AuctionLotsManager } from './AuctionLotsManager';

interface AuctionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

const AuctionCreateModal = ({ isOpen, onClose, onSave }: AuctionCreateModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    youtube_url: '',
    image_url: '',
    initial_bid_value: 0,
    current_bid_value: 0,
    bid_increment: 100,
    start_date: '',
    end_date: '',
    status: false, // mudou para boolean (true = ativo, false = inativo)
    auction_type: 'rural' as 'rural' | 'judicial',
    is_live: false
  });

  // Helper function to convert Brazil timezone to UTC for database
  const convertToUTC = (brasilDateString: string): string => {
    if (!brasilDateString) return '';
    
    // Parse the Brasil time as local
    const brasilTime = new Date(brasilDateString);
    // Add 3 hours to convert Brasil time to UTC
    const utcTime = new Date(brasilTime.getTime() + (3 * 60 * 60 * 1000));
    
    return utcTime.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const auctionData = {
        name: formData.name,
        description: formData.description,
        youtube_url: formData.youtube_url,
        image_url: formData.image_url,
        initial_bid_value: formData.initial_bid_value,
        current_bid_value: formData.current_bid_value || formData.initial_bid_value,
        bid_increment: formData.bid_increment,
        start_date: formData.start_date ? convertToUTC(formData.start_date) : null,
        end_date: formData.end_date ? convertToUTC(formData.end_date) : null,
        status: formData.status ? 'active' : 'inactive',
        auction_type: formData.auction_type,
        is_live: formData.is_live
      };

      const { data, error } = await supabase
        .from('auctions')
        .insert([auctionData])
        .select('id')
        .single();

      if (error) throw error;

      setCreatedAuctionId(data.id);
      
      toast({
        title: "Sucesso",
        description: "Leilão criado com sucesso!"
      });
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

  const handleClose = () => {
    // Reset everything when closing
    setCreatedAuctionId(null);
    setFormData({
      name: '',
      description: '',
      youtube_url: '',
      image_url: '',
      initial_bid_value: 0,
      current_bid_value: 0,
      bid_increment: 100,
      start_date: '',
      end_date: '',
      status: false,
      auction_type: 'rural',
      is_live: false
    });
    if (onSave) onSave();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-6xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-700">
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
              <Label htmlFor="start_date" className="text-white">Data de Início (Horário de Brasília)</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="end_date" className="text-white">Data de Fim (Horário de Brasília)</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                />
                <Label htmlFor="status" className="text-white">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
                />
                <Label htmlFor="is_live" className="text-white">Ao vivo</Label>
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

          <div>
            <Label className="text-white">Imagem do Leilão</Label>
            <ImageUpload 
              onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
              folder="auction-images"
              existingImages={formData.image_url ? [{ 
                url: formData.image_url, 
                path: formData.image_url.split('/').pop() || '', 
                name: 'Imagem do Leilão' 
              }] : []}
            />
          </div>

          {createdAuctionId && (
            <div className="border-t border-green-600/30 pt-6 bg-gray-900/50 rounded-lg p-4 -mx-2">
              <h3 className="text-lg font-semibold text-white mb-4">Gerenciar Lotes</h3>
              <AuctionLotsManager auctionId={createdAuctionId} />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-green-600/30 text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {saving ? 'Salvando...' : 'Salvar Leilão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuctionCreateModal;
