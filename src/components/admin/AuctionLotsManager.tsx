import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuctionItems } from '@/hooks/useAuctionItems';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuctionItem } from '@/types/auction';
import CurrencyInput from '@/components/ui/currency-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface AuctionLotsManagerProps {
  auctionId: string;
}

interface LotFormData {
  name: string;
  description: string;
  initial_value: number;
  increment: number;
  status: 'not_started' | 'in_progress' | 'finished';
}

const StatusBadge = ({ status }: { status: AuctionItem['status'] }) => {
  const statusConfig = {
    not_started: { label: 'Não Iniciado', variant: 'secondary' as const },
    in_progress: { label: 'Em Andamento', variant: 'default' as const },
    finished: { label: 'Finalizado', variant: 'outline' as const },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const SortableItem = ({ 
  item, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  editData, 
  onEditDataChange 
}: {
  item: AuctionItem;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  editData: LotFormData;
  onEditDataChange: (data: Partial<LotFormData>) => void;
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
    <div ref={setNodeRef} style={style} className="bg-card border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          
          {isEditing ? (
            <div className="flex-1 space-y-3">
              <div>
                <Label htmlFor={`name-${item.id}`}>Nome</Label>
                <Input
                  id={`name-${item.id}`}
                  value={editData.name}
                  onChange={(e) => onEditDataChange({ name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`description-${item.id}`}>Descrição</Label>
                <Textarea
                  id={`description-${item.id}`}
                  value={editData.description}
                  onChange={(e) => onEditDataChange({ description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor={`initial-value-${item.id}`}>Valor Inicial</Label>
                  <CurrencyInput
                    value={editData.initial_value}
                    onChange={(value) => onEditDataChange({ initial_value: value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`increment-${item.id}`}>Incremento</Label>
                  <CurrencyInput
                    value={editData.increment}
                    onChange={(value) => onEditDataChange({ increment: value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor={`status-${item.id}`}>Status</Label>
                <Select value={editData.status} onValueChange={(value) => onEditDataChange({ status: value as LotFormData['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{item.name}</h4>
                <StatusBadge status={item.status} />
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
              )}
              <div className="text-sm space-y-1">
                <p>Valor inicial: R$ {item.initial_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                <p>Valor atual: R$ {item.current_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                {item.increment && (
                  <p>Incremento: R$ {item.increment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-3">
          {isEditing ? (
            <>
              <Button size="sm" onClick={onSave}>
                <Save className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={onEdit}>
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const AuctionLotsManager = ({ auctionId }: AuctionLotsManagerProps) => {
  const { items, loading, refetch } = useAuctionItems(auctionId);
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<LotFormData>({
    name: '',
    description: '',
    initial_value: 0,
    increment: 100,
    status: 'not_started'
  });
  const [formData, setFormData] = useState<LotFormData>({
    name: '',
    description: '',
    initial_value: 0,
    increment: 100,
    status: 'not_started'
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
          order_index: maxOrder + 1
        });

      if (error) throw error;

      setFormData({
        name: '',
        description: '',
        initial_value: 0,
        increment: 100,
        status: 'not_started'
      });
      setShowForm(false);
      
      toast({
        title: "Lote criado",
        description: "O lote foi criado com sucesso.",
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

  const handleEdit = (item: AuctionItem) => {
    setEditingId(item.id);
    setEditData({
      name: item.name,
      description: item.description || '',
      initial_value: item.initial_value,
      increment: item.increment || 100,
      status: item.status
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    try {
      const { error } = await supabase
        .from('auction_items')
        .update({
          name: editData.name,
          description: editData.description,
          initial_value: editData.initial_value,
          increment: editData.increment,
          status: editData.status
        })
        .eq('id', editingId);

      if (error) throw error;

      setEditingId(null);
      
      toast({
        title: "Lote atualizado",
        description: "O lote foi atualizado com sucesso.",
      });

      refetch();
    } catch (error: any) {
      console.error('Error updating lot:', error);
      toast({
        title: "Erro ao atualizar lote",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  if (loading) {
    return <div className="text-center py-4">Carregando lotes...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Gerenciar Lotes</CardTitle>
          <Button onClick={() => setShowForm(true)} disabled={showForm}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Lote
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <div>
                <Label htmlFor="new-name">Nome</Label>
                <Input
                  id="new-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome do lote"
                />
              </div>
              <div>
                <Label htmlFor="new-description">Descrição</Label>
                <Textarea
                  id="new-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do lote"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-initial-value">Valor Inicial</Label>
                  <CurrencyInput
                    value={formData.initial_value}
                    onChange={(value) => setFormData({ ...formData, initial_value: value })}
                  />
                </div>
                <div>
                  <Label htmlFor="new-increment">Incremento</Label>
                  <CurrencyInput
                    value={formData.increment}
                    onChange={(value) => setFormData({ ...formData, increment: value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="new-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as LotFormData['status'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Não Iniciado</SelectItem>
                    <SelectItem value="in_progress">Em Andamento</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!formData.name}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Lote
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                    item={item}
                    isEditing={editingId === item.id}
                    onEdit={() => handleEdit(item)}
                    onSave={handleSave}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => handleDelete(item.id)}
                    editData={editData}
                    onEditDataChange={(data) => setEditData({ ...editData, ...data })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
};

export default AuctionLotsManager;