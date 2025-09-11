import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';
import { AuctionLotsManager } from './AuctionLotsManager';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface AuctionEditModalProps {
  auction: Auction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AuctionEditModal = ({ auction, isOpen, onClose, onSave }: AuctionEditModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1 = edit auction, 2 = manage lots
  const [formData, setFormData] = useState<Partial<Auction>>({
    name: '',
    description: '',
    youtube_url: '',
    start_date: '',
    end_date: '',
    registration_wait_value: 5,
    registration_wait_unit: 'minutes',
    status: 'inactive',
    auction_type: 'rural',
    is_live: false
  });

  useEffect(() => {
    if (auction) {
      setFormData({
        ...auction,
        start_date: auction.start_date ? auction.start_date.slice(0, -1) : '',
        end_date: auction.end_date ? auction.end_date.slice(0, -1) : ''
      });
    }
    // Reset step when auction changes
    setStep(1);
  }, [auction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const auctionData = {
        name: formData.name,
        description: formData.description,
        youtube_url: formData.youtube_url,
        start_date: formData.start_date,
        end_date: formData.end_date,
        registration_wait_value: formData.registration_wait_value,
        registration_wait_unit: formData.registration_wait_unit,
        status: formData.status,
        auction_type: formData.auction_type,
        is_live: formData.is_live
      };

      const { error } = await supabase
        .from('auctions')
        .update(auctionData)
        .eq('id', auction?.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Leilão atualizado com sucesso"
      });

      setStep(2); // Go to lots management step
    } catch (error) {
      console.error('Erro ao salvar leilão:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o leilão",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    // Reset step when closing
    setStep(1);
    onSave();
    onClose();
  };

  const handleBackToForm = () => {
    setStep(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-6xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            {step === 2 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToForm}
                className="text-gray-400 hover:text-white p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {step === 1 ? 'Editar Leilão' : 'Gerenciar Lotes'}
          </DialogTitle>
        </DialogHeader>

{step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-white">Nome</Label>
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
                <Label htmlFor="registration_wait_value" className="text-white">Tempo de Espera</Label>
                <Input
                  id="registration_wait_value"
                  type="number"
                  min="1"
                  value={formData.registration_wait_value}
                  onChange={(e) => setFormData({ ...formData, registration_wait_value: parseInt(e.target.value) || 5 })}
                  className="bg-black border-green-600/30 text-white"
                />
              </div>

              <div>
                <Label htmlFor="registration_wait_unit" className="text-white">Unidade</Label>
                <select
                  id="registration_wait_unit"
                  value={formData.registration_wait_unit}
                  onChange={(e) => setFormData({ ...formData, registration_wait_unit: e.target.value as 'minutes' | 'hours' | 'days' })}
                  className="w-full px-3 py-2 bg-black border border-green-600/30 text-white rounded"
                >
                  <option value="minutes">Minutos</option>
                  <option value="hours">Horas</option>
                  <option value="days">Dias</option>
                </select>
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
              <Label htmlFor="youtube_url" className="text-white">Link da Transmissão</Label>
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
                onClick={handleClose}
                className="border-green-600/30 text-white hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {saving ? 'Salvando...' : (
                  <>
                    Salvar e Gerenciar Lotes
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="bg-green-900/20 border border-green-600/30 p-4 rounded-lg">
              <p className="text-green-400 text-sm">
                ✅ Leilão atualizado com sucesso! Agora você pode gerenciar os lotes deste leilão.
              </p>
            </div>
            
            {auction?.id && (
              <AuctionLotsManager auctionId={auction.id} />
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleClose}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuctionEditModal;
