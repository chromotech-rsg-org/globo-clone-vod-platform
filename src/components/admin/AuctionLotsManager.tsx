import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Trash2, Save, X, ArrowUpDown, Copy, AlertTriangle } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';
import { useAuctionItems } from '@/hooks/useAuctionItems';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuctionItem } from '@/types/auction';
import CurrencyInput from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface AuctionLotsManagerRef {
  savePendingChanges: () => Promise<void>;
}

interface AuctionLotsManagerProps {
  auctionId: string;
}

interface LotFormData {
  name: string;
  description: string;
  initial_value: number;
  increment: number;
  status: 'not_started' | 'in_progress' | 'finished' | 'indisponivel' | 'pre_bidding';
  image_url: string;
  order_index: number;
}

interface LotChanges {
  [itemId: string]: Partial<LotFormData>;
}

const StatusBadge = ({ status }: { status: AuctionItem['status'] }) => {
  const statusConfig = {
    not_started: { label: 'Não Iniciado', variant: 'secondary' as const, className: 'bg-gray-800 text-gray-300 border-gray-600' },
    pre_bidding: { label: 'Pré Lance', variant: 'secondary' as const, className: 'bg-yellow-900/40 text-yellow-400 border-yellow-600' },
    in_progress: { label: 'Em Andamento', variant: 'default' as const, className: 'bg-green-900/40 text-green-400 border-green-600' },
    finished: { label: 'Finalizado', variant: 'outline' as const, className: 'bg-gray-900 text-white border-gray-500' },
    indisponivel: { label: 'Indisponível', variant: 'destructive' as const, className: 'bg-red-900/40 text-red-400 border-red-600' },
  };

  const config = statusConfig[status] || statusConfig.not_started;
  return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
};

const SortableItem = ({ 
  item, 
  onDelete,
  onDuplicate,
  onQuickStatusUpdate,
  onChange,
  isExpanded = false,
  onToggleExpand,
  hasInProgressLot
}: {
  item: AuctionItem;
  onDelete: () => void;
  onDuplicate: () => void;
  onQuickStatusUpdate: (itemId: string, status: string, currentStatus: string) => void;
  onChange: (itemId: string, changes: Partial<LotFormData>) => void;
  isExpanded?: boolean;
  onToggleExpand: (itemId: string) => void;
  hasInProgressLot: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-gray-900 border border-green-600/30 rounded-lg p-4 hover:border-green-600/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-green-400" />
          </div>
          
          <div className={`flex-1 ${isExpanded ? 'space-y-3' : ''}`}>
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white text-sm mb-1">{item.name}</div>
                  <div className="text-gray-400 text-xs">#{item.order_index}</div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleExpand(item.id);
                  }}
                  className="text-green-400 hover:bg-green-900/30 h-6 w-6 p-0"
                >
                  {isExpanded ? '−' : '+'}
                </Button>
              </div>
            </div>
            
            {isExpanded && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor={`name-${item.id}`} className="text-white">Nome</Label>
                  <Input
                    id={`name-${item.id}`}
                    value={item.name}
                    onChange={(e) => onChange(item.id, { name: e.target.value })}
                    className="bg-black border-green-600/30 text-white focus:border-green-500"
                  />
                </div>
                <div>
                  <Label htmlFor={`description-${item.id}`} className="text-white">Descrição</Label>
                  <Textarea
                    id={`description-${item.id}`}
                    value={item.description || ''}
                    onChange={(e) => onChange(item.id, { description: e.target.value })}
                    rows={2}
                    className="bg-black border-green-600/30 text-white focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor={`initial-value-${item.id}`} className="text-white">Valor Inicial</Label>
                    <CurrencyInput
                      value={item.initial_value}
                      onChange={(value) => onChange(item.id, { initial_value: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`increment-${item.id}`} className="text-white">Incremento</Label>
                    <CurrencyInput
                      value={item.increment || 0}
                      onChange={(value) => onChange(item.id, { increment: value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`order-${item.id}`} className="text-white">Ordem</Label>
                    <Input
                      id={`order-${item.id}`}
                      type="number"
                      value={item.order_index}
                      onChange={(e) => onChange(item.id, { order_index: parseInt(e.target.value) || 0 })}
                      className="bg-black border-green-600/30 text-white focus:border-green-500"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor={`status-${item.id}`} className="text-white">Status</Label>
                  <Select value={item.status} onValueChange={(value) => onChange(item.id, { status: value as LotFormData['status'] })}>
                    <SelectTrigger className="bg-black border-green-600/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-green-600/30">
                      <SelectItem value="not_started" className="text-white hover:bg-gray-800">Não Iniciado</SelectItem>
                      <SelectItem value="pre_bidding" className="text-yellow-400 hover:bg-gray-800">Pré Lance</SelectItem>
                      <SelectItem value="in_progress" className="text-white hover:bg-gray-800">Em Andamento</SelectItem>
                      <SelectItem value="finished" className="text-white hover:bg-gray-800">Finalizado</SelectItem>
                      <SelectItem value="indisponivel" className="text-white hover:bg-gray-800">Indisponível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white">Imagem do Lote</Label>
                  <ImageUpload 
                    onImageUploaded={(url, path) => onChange(item.id, { image_url: url })}
                    folder="auction-items"
                    existingImages={item.image_url ? [{ 
                      url: item.image_url, 
                      path: item.image_url.includes('auction-items/') 
                        ? item.image_url.split('auction-items/')[1] 
                        : item.image_url.split('/').pop() || '', 
                      name: 'Imagem do Lote' 
                    }] : []}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          <div className="flex items-center gap-1 mr-2">
            <Button
              size="sm"
              variant={item.status === 'not_started' ? 'default' : 'outline'}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickStatusUpdate(item.id, 'not_started', item.status);
              }}
              className={`h-6 px-2 text-xs ${
                item.status === 'not_started' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'border-gray-600 text-gray-400 hover:bg-gray-800'
                }`}
              title="Não Iniciado"
            >
              ⏸
            </Button>
            <Button
              size="sm"
              variant={item.status === 'pre_bidding' ? 'default' : 'outline'}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickStatusUpdate(item.id, 'pre_bidding', item.status);
              }}
              className={`h-6 px-2 text-xs ${
                item.status === 'pre_bidding' 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'border-yellow-600 text-yellow-400 hover:bg-yellow-900/30'
                }`}
              title="Pré Lance"
            >
              ⏰
            </Button>
            <Button
              size="sm"
              variant={item.status === 'in_progress' ? 'default' : 'outline'}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickStatusUpdate(item.id, 'in_progress', item.status);
              }}
              className={`h-6 px-2 text-xs ${
                item.status === 'in_progress' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'border-green-600 text-green-400 hover:bg-green-900/30'
                }`}
              title="Em Andamento"
              disabled={hasInProgressLot && item.status !== 'in_progress'}
            >
              ▶
            </Button>
            <Button
              size="sm"
              variant={item.status === 'finished' ? 'default' : 'outline'}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickStatusUpdate(item.id, 'finished', item.status);
              }}
              className={`h-6 px-2 text-xs ${
                item.status === 'finished' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-blue-600 text-blue-400 hover:bg-blue-900/30'
                }`}
              title="Finalizado"
            >
              ✓
            </Button>
          </div>
          <StatusBadge status={item.status} />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDuplicate();
            }}
            className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
            title="Duplicar Lote"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete} className="bg-red-900 hover:bg-red-800 text-white">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const AuctionLotsManager = React.forwardRef<AuctionLotsManagerRef, AuctionLotsManagerProps>(({ auctionId }, ref) => {
  const { items, loading, refetch } = useAuctionItems(auctionId);
  
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [lotChanges, setLotChanges] = useState<LotChanges>({});
  const [allLotsExpanded, setAllLotsExpanded] = useState(false);
  const [expandedLots, setExpandedLots] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [showInProgressWarning, setShowInProgressWarning] = useState(false);
  const [showFinishWithoutWinnerDialog, setShowFinishWithoutWinnerDialog] = useState(false);
  const [pendingFinishLotId, setPendingFinishLotId] = useState<string | null>(null);
  const [showStartNextLotDialog, setShowStartNextLotDialog] = useState(false);
  
  const [formData, setFormData] = useState<LotFormData>({
    name: '',
    description: '',
    initial_value: 0,
    increment: 100,
    status: 'not_started',
    image_url: '',
    order_index: 0
  });

  // Check if there's a lot in progress
  const getInProgressLot = () => {
    const inProgressFromItems = items.find(item => item.status === 'in_progress');
    if (inProgressFromItems) return inProgressFromItems;
    
    // Also check in pending changes
    for (const [itemId, changes] of Object.entries(lotChanges)) {
      if (changes.status === 'in_progress') {
        return items.find(item => item.id === itemId);
      }
    }
    return null;
  };

  const hasInProgressLot = !!getInProgressLot();

  // Get the next lot in sequence
  const getNextLot = (currentLotId: string) => {
    const currentItem = items.find(item => item.id === currentLotId);
    if (!currentItem) return null;
    
    const sortedItems = [...items].sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedItems.findIndex(item => item.id === currentLotId);
    
    // Find next lot that is not finished
    for (let i = currentIndex + 1; i < sortedItems.length; i++) {
      if (sortedItems[i].status !== 'finished' && sortedItems[i].status !== 'indisponivel') {
        return sortedItems[i];
      }
    }
    return null;
  };

  // Check if lot has a winner bid
  const checkLotHasWinner = async (lotId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('bids')
      .select('id')
      .eq('auction_item_id', lotId)
      .eq('is_winner', true)
      .limit(1);
    
    return !error && data && data.length > 0;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleLotChange = (itemId: string, changes: Partial<LotFormData>) => {
    setLotChanges(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        ...changes
      }
    }));
  };

  const getUpdatedItem = (item: AuctionItem): AuctionItem => {
    const changes = lotChanges[item.id];
    if (!changes) return item;
    
    return {
      ...item,
      ...changes
    };
  };


  // Auto-order function
  const handleAutoOrder = async () => {
    try {
      const sortedItems = [...items].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      
      const updates = sortedItems.map((item, index) => ({
        id: item.id,
        order_index: index + 1
      }));

      for (const update of updates) {
        await supabase
          .from('auction_items')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      toast({
        title: "Ordem reorganizada",
        description: "Os lotes foram reorganizados automaticamente com base nos números de ordem.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error auto-ordering:', error);
      toast({
        title: "Erro ao reorganizar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      
      // Update order indices in database
      try {
        const updates = newItems.map((item, index) => ({
          id: item.id,
          order_index: index + 1
        }));

        for (const update of updates) {
          await supabase
            .from('auction_items')
            .update({ order_index: update.order_index })
            .eq('id', update.id);
        }

        toast({
          title: "Ordem atualizada",
          description: "A ordem dos lotes foi atualizada com sucesso.",
        });

        refetch();
      } catch (error: any) {
        console.error('Error updating order:', error);
        toast({
          title: "Erro ao atualizar ordem",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleCreate = async () => {
    try {
      const maxOrder = Math.max(...items.map(item => item.order_index), 0);
      const targetOrder = formData.order_index || maxOrder + 1;
      
      // Check if the target order already exists
      const existingItem = items.find(item => item.order_index === targetOrder);
      
      if (existingItem && formData.order_index > 0) {
        // Reorder all items that have order_index >= the target order
        const itemsToReorder = items.filter(item => 
          item.order_index >= targetOrder
        );

        // Update all conflicting items first
        for (const item of itemsToReorder) {
          await supabase
            .from('auction_items')
            .update({ order_index: item.order_index + 1 })
            .eq('id', item.id);
        }
      }

      const { error } = await supabase
        .from('auction_items')
        .insert({
          auction_id: auctionId,
          name: formData.name,
          description: formData.description,
          initial_value: formData.initial_value,
          current_value: formData.initial_value,
          increment: formData.increment,
          status: formData.status,
          image_url: formData.image_url,
          order_index: targetOrder
        });

      if (error) throw error;

      setFormData({
        name: '',
        description: '',
        initial_value: 0,
        increment: 100,
        status: 'not_started',
        image_url: '',
        order_index: 0
      });
      setShowForm(false);
      
      toast({
        title: "Lote criado",
        description: existingItem && formData.order_index > 0 
          ? "O lote foi criado e outros lotes foram reordenados automaticamente."
          : "O lote foi criado com sucesso.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error creating lot:', error);
      toast({
        title: "Erro ao criar lote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleQuickStatusUpdate = async (itemId: string, newStatus: string, currentStatus: string) => {
    // Check if trying to set to in_progress when another lot is already in progress
    if (newStatus === 'in_progress' && currentStatus !== 'in_progress') {
      const inProgressLot = getInProgressLot();
      if (inProgressLot && inProgressLot.id !== itemId) {
        setShowInProgressWarning(true);
        return;
      }
    }

    // Check if finishing a lot
    if (newStatus === 'finished' && currentStatus === 'in_progress') {
      const hasWinner = await checkLotHasWinner(itemId);
      if (!hasWinner) {
        setPendingFinishLotId(itemId);
        setShowFinishWithoutWinnerDialog(true);
        return;
      }
    }

    // Normal status update
    handleLotChange(itemId, { status: newStatus as LotFormData['status'] });
  };

  const handleConfirmFinishWithoutWinner = () => {
    if (pendingFinishLotId) {
      handleLotChange(pendingFinishLotId, { status: 'finished' });
      setShowFinishWithoutWinnerDialog(false);
      
      // Check if there's a next lot to start
      const nextLot = getNextLot(pendingFinishLotId);
      if (nextLot) {
        setShowStartNextLotDialog(true);
      } else {
        setPendingFinishLotId(null);
      }
    }
  };

  const handleStartNextLot = () => {
    if (pendingFinishLotId) {
      const nextLot = getNextLot(pendingFinishLotId);
      if (nextLot) {
        handleLotChange(nextLot.id, { status: 'in_progress' });
      }
    }
    setShowStartNextLotDialog(false);
    setPendingFinishLotId(null);
  };

  const handleSkipStartNextLot = () => {
    setShowStartNextLotDialog(false);
    setPendingFinishLotId(null);
  };

  const toggleLotExpansion = (lotId: string) => {
    setExpandedLots(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lotId)) {
        newSet.delete(lotId);
      } else {
        newSet.add(lotId);
      }
      return newSet;
    });
  };

  const handleAllLotsToggle = () => {
    if (allLotsExpanded) {
      setExpandedLots(new Set());
      setAllLotsExpanded(false);
    } else {
      setExpandedLots(new Set(items.map(item => item.id)));
      setAllLotsExpanded(true);
    }
  };

  // Expose methods to parent through ref
  React.useImperativeHandle(ref, () => ({
    savePendingChanges: async () => {
      try {
        const updates = Object.entries(lotChanges);
        
        for (const [itemId, changes] of updates) {
          if (Object.keys(changes).length > 0) {
            const { error } = await supabase
              .from('auction_items')
              .update(changes)
              .eq('id', itemId);

            if (error) throw error;
          }
        }

        if (updates.length > 0) {
          toast({
            title: "Lotes salvos",
            description: `${updates.length} lote(s) foram atualizados com sucesso.`,
          });
          
          setLotChanges({});
          refetch();
        }
      } catch (error: any) {
        console.error('Error saving lot changes:', error);
        toast({
          title: "Erro ao salvar lotes",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    }
  }));

  const handleDelete = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('auction_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Lote excluído",
        description: "O lote foi excluído com sucesso.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error deleting lot:', error);
      toast({
        title: "Erro ao excluir lote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (item: AuctionItem) => {
    try {
      let duplicatedImageUrl = '';
      
      // Se houver imagem, copiar para o storage
      if (item.image_url) {
        try {
          // Extrair o path da imagem original
          const originalPath = item.image_url.includes('auction-items/') 
            ? item.image_url.split('auction-items/')[1] 
            : item.image_url.split('/').pop() || '';
          
          if (originalPath) {
            // Baixar a imagem original
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('site-images')
              .download(`auction-items/${originalPath}`);
            
            if (!downloadError && fileData) {
              // Gerar novo nome de arquivo com timestamp
              const fileExtension = originalPath.split('.').pop();
              const timestamp = Date.now();
              const newFileName = `${timestamp}_copy_${originalPath}`;
              
              // Upload da cópia
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('site-images')
                .upload(`auction-items/${newFileName}`, fileData, {
                  contentType: fileData.type,
                  upsert: false
                });
              
              if (!uploadError && uploadData) {
                // Obter URL pública da nova imagem
                const { data: urlData } = supabase.storage
                  .from('site-images')
                  .getPublicUrl(`auction-items/${newFileName}`);
                
                duplicatedImageUrl = urlData.publicUrl;
              }
            }
          }
        } catch (imageError) {
          console.warn('Erro ao copiar imagem, continuando sem imagem:', imageError);
          // Continua sem imagem se houver erro
        }
      }
      
      // Reordenar lotes subsequentes
      const itemsToReorder = items.filter(lot => 
        lot.order_index > item.order_index
      );
      
      for (const lot of itemsToReorder) {
        await supabase
          .from('auction_items')
          .update({ order_index: lot.order_index + 1 })
          .eq('id', lot.id);
      }
      
      // Criar o novo lote duplicado
      const { error } = await supabase
        .from('auction_items')
        .insert({
          auction_id: auctionId,
          name: `Cópia de ${item.name}`,
          description: item.description,
          initial_value: item.initial_value,
          current_value: item.initial_value,
          increment: item.increment,
          status: 'not_started', // Sempre criar como não iniciado
          image_url: duplicatedImageUrl || '',
          order_index: item.order_index + 1
        });

      if (error) throw error;
      
      toast({
        title: "Lote duplicado",
        description: duplicatedImageUrl 
          ? "O lote foi duplicado com sucesso, incluindo a imagem."
          : "O lote foi duplicado com sucesso.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error duplicating lot:', error);
      toast({
        title: "Erro ao duplicar lote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-400">Carregando lotes...</div>;
  }

  return (
    <div className="bg-gray-900 border border-green-600/30 rounded-lg">
      <div className="bg-gray-800 border-b border-green-600/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Gerenciar Lotes</h3>
          <div className="flex gap-2">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAllLotsToggle();
              }} 
              type="button"
              variant="outline"
              className="border-green-600/50 text-green-400 hover:bg-green-900/30"
            >
              {allLotsExpanded ? 'Recolher Todos' : 'Expandir Todos'}
            </Button>
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAutoOrder();
              }}
              type="button" 
              variant="outline"
              className="border-green-600/50 text-green-400 hover:bg-green-900/30"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Auto-Ordenar
            </Button>
            <Button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowForm(true);
            }} disabled={showForm} type="button" className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Lote
            </Button>
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {showForm && (
          <div className="bg-black/50 border border-green-600/20 rounded-lg p-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="new-name" className="text-white">Nome</Label>
                <Input
                  id="new-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do lote"
                  className="bg-black border-green-600/30 text-white focus:border-green-500"
                />
              </div>
              <div>
                <Label htmlFor="new-description" className="text-white">Descrição</Label>
                <Textarea
                  id="new-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do lote"
                  rows={2}
                  className="bg-black border-green-600/30 text-white focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="new-initial-value" className="text-white">Valor Inicial</Label>
                  <CurrencyInput
                    value={formData.initial_value}
                    onChange={(value) => setFormData({ ...formData, initial_value: value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-increment" className="text-white">Incremento</Label>
                  <CurrencyInput
                    value={formData.increment}
                    onChange={(value) => setFormData({ ...formData, increment: value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-order" className="text-white">Ordem</Label>
                  <Input
                    id="new-order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="Número da ordem"
                    className="bg-black border-green-600/30 text-white focus:border-green-500"
                    min="1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-status" className="text-white">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as LotFormData['status'] })}>
                  <SelectTrigger className="bg-black border-green-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-green-600/30">
                    <SelectItem value="not_started" className="text-white hover:bg-gray-800">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress" className="text-white hover:bg-gray-800">Em Andamento</SelectItem>
                    <SelectItem value="finished" className="text-white hover:bg-gray-800">Finalizado</SelectItem>
                    <SelectItem value="indisponivel" className="text-white hover:bg-gray-800">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Imagem do Lote</Label>
                <ImageUpload 
                  onImageUploaded={(url, path) => setFormData({ ...formData, image_url: url })}
                  folder="auction-items"
                  existingImages={formData.image_url ? [{ 
                    url: formData.image_url, 
                    path: formData.image_url.includes('auction-items/') 
                      ? formData.image_url.split('auction-items/')[1] 
                      : formData.image_url.split('/').pop() || '', 
                    name: 'Imagem do Lote' 
                  }] : []}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!formData.name} className="bg-green-600 hover:bg-green-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Lote
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            Nenhum lote cadastrado para este leilão.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                 {items.map((item) => (
                 <SortableItem
                   key={item.id}
                   item={getUpdatedItem(item)}
                   onDelete={() => handleDelete(item.id)}
                   onDuplicate={() => handleDuplicate(item)}
                   onQuickStatusUpdate={handleQuickStatusUpdate}
                   onChange={handleLotChange}
                   isExpanded={expandedLots.has(item.id)}
                   onToggleExpand={toggleLotExpansion}
                   hasInProgressLot={hasInProgressLot}
                 />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Warning Dialog: Cannot have two lots in progress */}
        <AlertDialog open={showInProgressWarning} onOpenChange={setShowInProgressWarning}>
          <AlertDialogContent className="bg-gray-900 border-yellow-600/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-yellow-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Lote em Andamento
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Já existe um lote em andamento. Você precisa finalizar o lote atual antes de iniciar outro.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction 
                onClick={() => setShowInProgressWarning(false)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Entendi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog: Finish without winner */}
        <AlertDialog open={showFinishWithoutWinnerDialog} onOpenChange={setShowFinishWithoutWinnerDialog}>
          <AlertDialogContent className="bg-gray-900 border-orange-600/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-orange-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Finalizar Sem Vencedor
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Este lote não possui um lance vencedor definido. Deseja finalizar mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={() => {
                  setShowFinishWithoutWinnerDialog(false);
                  setPendingFinishLotId(null);
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmFinishWithoutWinner}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Sim, Finalizar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Dialog: Start next lot */}
        <AlertDialog open={showStartNextLotDialog} onOpenChange={setShowStartNextLotDialog}>
          <AlertDialogContent className="bg-gray-900 border-green-600/50">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-green-400">
                Iniciar Próximo Lote?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                O lote foi finalizado. Deseja iniciar o próximo lote automaticamente?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                onClick={handleSkipStartNextLot}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Não, apenas finalizar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleStartNextLot}
                className="bg-green-600 hover:bg-green-700"
              >
                Sim, Iniciar Próximo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});

AuctionLotsManager.displayName = 'AuctionLotsManager';

export default AuctionLotsManager;