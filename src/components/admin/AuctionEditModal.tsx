import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Auction } from '@/types/auction';
import { AuctionLotsManager } from './AuctionLotsManager';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


interface AuctionEditModalProps {
  auction: Auction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const AuctionEditModal = ({ auction, isOpen, onClose, onSave }: AuctionEditModalProps) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Auction>>({
    name: '',
    description: '',
    youtube_url: '',
    image_url: '',
    start_date: '',
    end_date: '',
    status: 'inactive',
    auction_type: 'rural',
    is_live: false,
    allow_pre_bidding: false
  });

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Helper function to format UTC date to local for datetime-local input
  const formatDateForInput = (isoString: string | null): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Convert to local time string (YYYY-MM-DDTHH:mm) expected by datetime-local
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  // Helper function to convert local datetime (from input) to UTC ISO for database
  const convertToUTC = (localDateString: string): string => {
    if (!localDateString) return '';
    return new Date(localDateString).toISOString();
  };

  useEffect(() => {
    if (auction) {
      setFormData({
        ...auction,
        start_date: formatDateForInput(auction.start_date),
        end_date: formatDateForInput(auction.end_date)
      });
    }
  }, [auction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // If a new image was selected, upload it now (deferred upload)
      let imageUrl = formData.image_url || '';
      if (pendingImageFile) {
        const file = pendingImageFile;
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const randomSuffix = Math.random().toString(36).substring(2);
        const fileName = `${timestamp}-${randomSuffix}.${fileExt}`;
        const filePath = `auction-images/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('site-images')
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from('site-images')
          .getPublicUrl(uploadData.path);

        imageUrl = publicData.publicUrl;
      }

      const auctionData = {
        name: formData.name,
        description: formData.description,
        youtube_url: formData.youtube_url,
        image_url: imageUrl,
        start_date: formData.start_date ? convertToUTC(formData.start_date) : null,
        end_date: formData.end_date ? convertToUTC(formData.end_date) : null,
        status: formData.status,
        auction_type: formData.auction_type,
        is_live: formData.is_live,
        allow_pre_bidding: formData.allow_pre_bidding
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

      onSave();
      onClose(); // Close modal after successful save
      setPendingImageFile(null);
      setImagePreview('');
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-6xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Leilão</DialogTitle>
        </DialogHeader>

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
              <Label className="text-white">Data de Início (Horário de Brasília)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-black border-green-600/30 text-white hover:bg-gray-800",
                      !formData.start_date && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? (
                      format(new Date(formData.start_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    ) : (
                      <span>Selecione a data de início</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-green-600/30" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
                        setFormData({ ...formData, start_date: dateStr });
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="p-3 border-t border-green-600/30">
                    <Input
                      type="time"
                      value={formData.start_date ? format(new Date(formData.start_date), "HH:mm") : ""}
                      onChange={(e) => {
                        if (formData.start_date) {
                          const date = new Date(formData.start_date);
                          const [hours, minutes] = e.target.value.split(':');
                          date.setHours(parseInt(hours), parseInt(minutes));
                          const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
                          setFormData({ ...formData, start_date: dateStr });
                        }
                      }}
                      className="bg-black border-green-600/30 text-white"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-white">Data de Fim (Horário de Brasília)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-black border-green-600/30 text-white hover:bg-gray-800",
                      !formData.end_date && "text-gray-400"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? (
                      format(new Date(formData.end_date), "dd/MM/yyyy HH:mm", { locale: ptBR })
                    ) : (
                      <span>Selecione a data de fim</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-gray-900 border-green-600/30" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
                        setFormData({ ...formData, end_date: dateStr });
                      }
                    }}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                  <div className="p-3 border-t border-green-600/30">
                    <Input
                      type="time"
                      value={formData.end_date ? format(new Date(formData.end_date), "HH:mm") : ""}
                      onChange={(e) => {
                        if (formData.end_date) {
                          const date = new Date(formData.end_date);
                          const [hours, minutes] = e.target.value.split(':');
                          date.setHours(parseInt(hours), parseInt(minutes));
                          const dateStr = format(date, "yyyy-MM-dd'T'HH:mm");
                          setFormData({ ...formData, end_date: dateStr });
                        }
                      }}
                      className="bg-black border-green-600/30 text-white"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'active' : 'inactive' })}
                />
                <Label htmlFor="status" className="text-white">Visível</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="allow_pre_bidding"
                  checked={formData.allow_pre_bidding}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_pre_bidding: checked })}
                />
                <Label htmlFor="allow_pre_bidding" className="text-white">Pré Lance</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    is_live: checked,
                    // Quando ativar ao vivo, desativar pré lance
                    allow_pre_bidding: checked ? false : formData.allow_pre_bidding
                  })}
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
            <Label htmlFor="youtube_url" className="text-white">Link da Transmissão</Label>
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
            <div className="mt-2 space-y-3">
              {(imagePreview || formData.image_url) && (
                <div className="relative w-48 h-48 bg-gray-900 border border-green-600/30 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview || (formData.image_url as string)}
                    alt="Pré-visualização da imagem do leilão"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPendingImageFile(file);
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setImagePreview(url);
                  } else {
                    setImagePreview('');
                  }
                }}
                className="bg-black border-green-600/30 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white file:cursor-pointer"
              />
              <p className="text-xs text-gray-400">A imagem será enviada apenas ao salvar.</p>
            </div>
          </div>

          {auction?.id && (
            <div className="border-t border-green-600/30 pt-6 bg-gray-900/50 rounded-lg p-4 -mx-2">
              <h3 className="text-lg font-semibold text-white mb-4">Gerenciar Lotes</h3>
              <AuctionLotsManager auctionId={auction.id} />
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

export default AuctionEditModal;
