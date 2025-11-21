import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ui/image-upload';
import { Save, Edit, Plus, Trash2, Eye, GripVertical, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentSection {
  id: string;
  title: string;
  type: string;
  page: string;
  order_index: number;
  active: boolean;
  content_items: ContentItem[];
}

interface ContentItem {
  id: string;
  title: string;
  image_url: string | null;
  image_orientation: string | null;
  category: string | null;
  rating: string | null;
  age_rating_background_color?: string | null;
  section_id: string;
  order_index: number;
  active: boolean;
}

// Opções pré-definidas de faixas etárias
const AGE_RATING_OPTIONS = [
  { label: 'Livre', value: 'L', color: '#10b981' },
  { label: '10+', value: '10', color: '#3b82f6' },
  { label: '12+', value: '12', color: '#eab308' },
  { label: '14+', value: '14', color: '#f97316' },
  { label: '16+', value: '16', color: '#ef4444' },
  { label: '18+', value: '18', color: '#000000' },
];

const ContentEditor = () => {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editItemModalOpen, setEditItemModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState<string>('');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('content_sections').select(`
          *,
          content_items (*)
        `).eq('active', true).order('order_index');
      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Erro ao carregar seções:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as seções de conteúdo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSection = async (section: Partial<ContentSection>) => {
    try {
      if (section.id) {
        // Update existing section
        const {
          error
        } = await supabase.from('content_sections').update({
          title: section.title,
          updated_at: new Date().toISOString()
        }).eq('id', section.id);
        if (error) throw error;
      } else {
        // Create new section
        const {
          error
        } = await supabase.from('content_sections').insert({
          title: section.title,
          type: section.type || 'horizontal',
          page: 'home',
          order_index: sections.length,
          active: true
        });
        if (error) throw error;
      }
      await fetchSections();
      setEditingSection(null);
      setSectionModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Seção salva com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a seção.",
        variant: "destructive"
      });
    }
  };

  const saveItem = async (item: Partial<ContentItem>) => {
    try {
      if (item.id) {
        // Update existing item
        const { error } = await supabase.from('content_items').update({
          title: item.title,
          image_url: item.image_url,
          image_orientation: item.image_orientation,
          category: item.category,
          rating: item.rating,
          age_rating_background_color: item.age_rating_background_color,
          updated_at: new Date().toISOString()
        }).eq('id', item.id);
        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase.from('content_items').insert({
          title: item.title,
          image_url: item.image_url,
          image_orientation: item.image_orientation,
          category: item.category,
          rating: item.rating,
          age_rating_background_color: item.age_rating_background_color,
          section_id: item.section_id,
          order_index: 0,
          active: true
        });
        if (error) throw error;
      }
      await fetchSections();
      setEditingItem(null);
      setItemModalOpen(false);
      setEditItemModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Item salvo com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o item.",
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('content_items').delete().eq('id', itemId);
      if (error) throw error;
      await fetchSections();
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item.",
        variant: "destructive"
      });
    }
  };

  const deleteSection = async (sectionId: string) => {
    try {
      // Primeiro deleta todos os itens da seção
      const { error: itemsError } = await supabase
        .from('content_items')
        .delete()
        .eq('section_id', sectionId);
      
      if (itemsError) throw itemsError;

      // Depois deleta a seção
      const { error: sectionError } = await supabase
        .from('content_sections')
        .delete()
        .eq('id', sectionId);
      
      if (sectionError) throw sectionError;

      await fetchSections();
      toast({
        title: "Sucesso",
        description: "Seção removida com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao remover seção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a seção.",
        variant: "destructive"
      });
    }
  };

  const duplicateItem = async (item: ContentItem) => {
    try {
      const { error } = await supabase.from('content_items').insert({
        title: `${item.title} (Cópia)`,
        image_url: item.image_url,
        image_orientation: item.image_orientation,
        category: item.category,
        rating: item.rating,
        age_rating_background_color: item.age_rating_background_color,
        section_id: item.section_id,
        order_index: item.order_index + 1,
        active: true
      });
      if (error) throw error;
      await fetchSections();
      toast({
        title: "Sucesso",
        description: "Item duplicado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao duplicar item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o item.",
        variant: "destructive"
      });
    }
  };

  const duplicateSection = async (section: ContentSection) => {
    try {
      // Cria a nova seção
      const { data: newSection, error: sectionError } = await supabase
        .from('content_sections')
        .insert({
          title: `${section.title} (Cópia)`,
          type: section.type,
          page: section.page,
          order_index: sections.length,
          active: true
        })
        .select()
        .single();
      
      if (sectionError) throw sectionError;

      // Duplica todos os itens da seção
      if (section.content_items && section.content_items.length > 0) {
        const itemsToInsert = section.content_items.map(item => ({
          title: item.title,
          image_url: item.image_url,
          image_orientation: item.image_orientation,
          category: item.category,
          rating: item.rating,
          age_rating_background_color: item.age_rating_background_color,
          section_id: newSection.id,
          order_index: item.order_index,
          active: true
        }));

        const { error: itemsError } = await supabase
          .from('content_items')
          .insert(itemsToInsert);
        
        if (itemsError) throw itemsError;
      }

      await fetchSections();
      toast({
        title: "Sucesso",
        description: "Seção duplicada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao duplicar seção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar a seção.",
        variant: "destructive"
      });
    }
  };

  const handleSectionDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    const reorderedSections = arrayMove(sections, oldIndex, newIndex);
    setSections(reorderedSections);

    try {
      // Atualizar order_index no banco
      const updates = reorderedSections.map((section, index) => 
        supabase
          .from('content_sections')
          .update({ order_index: index })
          .eq('id', section.id)
      );

      await Promise.all(updates);

      toast({
        title: "Sucesso",
        description: "Ordem das seções atualizada!"
      });
    } catch (error) {
      console.error('Erro ao reordenar seções:', error);
      await fetchSections();
      toast({
        title: "Erro",
        description: "Não foi possível reordenar as seções.",
        variant: "destructive"
      });
    }
  };

  const handleItemDragEnd = async (event: DragEndEvent, sectionId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const section = sections.find(s => s.id === sectionId);
    if (!section?.content_items) return;

    const oldIndex = section.content_items.findIndex((item) => item.id === active.id);
    const newIndex = section.content_items.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(section.content_items, oldIndex, newIndex);

    // Atualizar estado local
    setSections(sections.map(s => 
      s.id === sectionId 
        ? { ...s, content_items: reorderedItems }
        : s
    ));

    try {
      // Atualizar order_index no banco
      const updates = reorderedItems.map((item, index) => 
        supabase
          .from('content_items')
          .update({ order_index: index })
          .eq('id', item.id)
      );

      await Promise.all(updates);

      toast({
        title: "Sucesso",
        description: "Ordem dos itens atualizada!"
      });
    } catch (error) {
      console.error('Erro ao reordenar itens:', error);
      await fetchSections();
      toast({
        title: "Erro",
        description: "Não foi possível reordenar os itens.",
        variant: "destructive"
      });
    }
  };

  const ItemEditor = ({
    item,
    sectionId
  }: {
    item?: ContentItem;
    sectionId: string;
  }) => {
    const [formData, setFormData] = useState({
      title: item?.title || '',
      image_url: item?.image_url || '',
      image_orientation: item?.image_orientation || 'vertical' as 'vertical' | 'horizontal',
      category: item?.category || '',
      rating: item?.rating || 'L',
      age_rating_background_color: item?.age_rating_background_color || '#10b981',
      section_id: sectionId
    });

    const handleImageUpload = (url: string) => {
      setFormData(prev => ({
        ...prev,
        image_url: url
      }));
    };

    const handleSave = () => {
      if (!formData.title.trim()) {
        toast({
          title: "Erro",
          description: "O título é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      saveItem({
        ...formData,
        id: item?.id,
        section_id: sectionId
      });
    };

    return <div className="space-y-4">
          <div>
            <Label className="text-admin-foreground">Título</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} 
              className="bg-admin-input border-admin-border text-admin-foreground" 
              placeholder="Nome do filme/série" 
            />
          </div>

          <div>
            <Label className="text-admin-foreground">Categoria</Label>
            <Input 
              value={formData.category} 
              onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))} 
              className="bg-admin-input border-admin-border text-admin-foreground" 
              placeholder="Ex: Ação, Drama, Comédia" 
            />
          </div>

          <div>
            <Label className="text-admin-foreground">Orientação da Imagem</Label>
            <RadioGroup 
              value={formData.image_orientation} 
              onValueChange={(value: 'vertical' | 'horizontal') => setFormData(prev => ({ ...prev, image_orientation: value }))}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vertical" id="vertical" />
                <Label htmlFor="vertical" className="text-admin-foreground cursor-pointer">Vertical (Poster)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="horizontal" id="horizontal" />
                <Label htmlFor="horizontal" className="text-admin-foreground cursor-pointer">Horizontal (Banner)</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-admin-foreground">Faixa Etária</Label>
            <Select 
              value={formData.rating} 
              onValueChange={(value) => {
                const selected = AGE_RATING_OPTIONS.find(opt => opt.value === value);
                setFormData(prev => ({ 
                  ...prev, 
                  rating: value,
                  age_rating_background_color: selected?.color || '#10b981'
                }));
              }}
            >
              <SelectTrigger className="bg-admin-input border-admin-border text-admin-foreground">
                <SelectValue placeholder="Selecione a faixa etária" />
              </SelectTrigger>
              <SelectContent className="bg-admin-card border-admin-border">
                {AGE_RATING_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="text-admin-foreground">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: option.color }}
                      />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-admin-foreground">Imagem</Label>
            {formData.image_url && (
              <div className="mb-2">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className={`object-cover rounded border border-admin-border ${
                    formData.image_orientation === 'vertical' ? 'w-32 h-48' : 'w-48 h-32'
                  }`} 
                />
              </div>
            )}
            <ImageUpload onImageUploaded={handleImageUpload} folder="content" maxSizeKB={5120} />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSave} variant="admin" size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button 
              onClick={() => {
                setEditingItem(null);
                setItemModalOpen(false);
                setEditItemModalOpen(false);
              }} 
              variant="outline" 
              size="sm" 
              className="border-admin-border text-black bg-white hover:bg-gray-100"
            >
              Cancelar
            </Button>
          </div>
        </div>;
  };

  const SectionEditor = ({
    section
  }: {
    section?: ContentSection;
  }) => {
    const [title, setTitle] = useState(section?.title || '');

    const handleSave = () => {
      if (!title.trim()) {
        toast({
          title: "Erro",
          description: "O título da seção é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      saveSection({
        ...section,
        title,
        type: section?.type || 'horizontal'
      });
    };

    return <div className="space-y-4">
        <div>
          <Label className="text-admin-foreground">Título da Seção</Label>
          <Input 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            className="bg-admin-input border-admin-border text-admin-foreground" 
            placeholder="Ex: Filmes em Alta, Séries Originais" 
          />
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} variant="admin" size="sm" className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button 
            onClick={() => {
              setEditingSection(null);
              setSectionModalOpen(false);
            }} 
            variant="outline" 
            size="sm" 
            className="border-admin-border text-black bg-white hover:bg-gray-100"
          >
            Cancelar
          </Button>
        </div>
      </div>;
  };

  const SortableSectionTab = ({ section }: { section: ContentSection }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
    } = useSortable({ id: section.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div ref={setNodeRef} style={style} className="inline-flex">
        <TabsTrigger value={section.id} className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground text-slate-50">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mr-2">
            <GripVertical className="h-4 w-4" />
          </div>
          {section.title}
          <Badge variant="secondary" className="ml-2 text-xs">
            {section.content_items?.length || 0}
          </Badge>
        </TabsTrigger>
      </div>
    );
  };

  const SortableItem = ({ item, section }: { item: ContentItem; section: ContentSection }) => {
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
      <div ref={setNodeRef} style={style}>
        <Card className="bg-admin-muted border-admin-border">
          <CardContent className="p-4 bg-black">
            <div className="space-y-3 bg-black">
              <div className="flex items-start justify-between">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
                  <GripVertical className="h-5 w-5 text-admin-muted-foreground" />
                </div>
              </div>
              {item.image_url && (
                <img 
                  src={item.image_url} 
                  alt={item.title} 
                  className={`w-full object-cover rounded ${
                    item.image_orientation === 'horizontal' ? 'h-32' : 'h-48'
                  }`} 
                />
              )}
              <div className="bg-black">
                <h4 className="font-medium text-admin-foreground text-sm">
                  {item.title}
                </h4>
                <div className="flex items-center justify-between mt-2 bg-black">
                  <span className="text-xs text-admin-muted-foreground">
                    {item.category}
                  </span>
                  {item.rating && (
                    <Badge 
                      variant="outline" 
                      className="text-xs font-semibold" 
                      style={{
                        backgroundColor: item.age_rating_background_color || '#10b981',
                        color: '#ffffff',
                        borderColor: item.age_rating_background_color || '#10b981'
                      }}
                    >
                      {item.rating}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 bg-black">
                <Dialog open={editItemModalOpen && editingItem?.id === item.id} onOpenChange={(open) => {
                  if (!open) {
                    setEditingItem(null);
                    setEditItemModalOpen(false);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      onClick={() => {
                        setEditingItem(item);
                        setCurrentSectionId(section.id);
                        setEditItemModalOpen(true);
                      }} 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 border-admin-border text-black bg-white hover:bg-gray-100"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-admin-card border-admin-border max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-admin-foreground">Editar Item</DialogTitle>
                    </DialogHeader>
                    <ItemEditor item={item} sectionId={section.id} />
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={() => duplicateItem(item)} 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-admin-border text-black bg-white hover:bg-gray-100"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button onClick={() => deleteItem(item.id)} variant="destructive" size="sm" className="flex-1">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (loading) {
    return <div className="text-admin-foreground bg-black">Carregando conteúdo...</div>;
  }

  return <div className="space-y-6 bg-black">
      <div className="flex items-center justify-between bg-black">
        <h3 className="text-lg font-semibold text-admin-foreground text-slate-50">
          Seções de Conteúdo
        </h3>
        <Dialog open={sectionModalOpen} onOpenChange={setSectionModalOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingSection(null);
              }} 
              variant="admin" 
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Seção
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-admin-card border-admin-border">
            <DialogHeader>
              <DialogTitle className="text-admin-foreground">
                {editingSection?.id ? 'Editar Seção' : 'Nova Seção'}
              </DialogTitle>
            </DialogHeader>
            <SectionEditor section={editingSection || undefined} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue={sections[0]?.id} className="space-y-4 bg-black">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sections.map(s => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <TabsList className="bg-admin-muted flex gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap">
              {sections.map(section => (
                <SortableSectionTab key={section.id} section={section} />
              ))}
            </TabsList>
          </SortableContext>
        </DndContext>

        {sections.map(section => <TabsContent key={section.id} value={section.id} className="space-y-4 bg-black">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader className="flex flex-row items-center justify-between bg-black">
                <div className="bg-black">
                  <CardTitle className="text-admin-foreground text-slate-50">{section.title}</CardTitle>
                  <p className="text-sm text-admin-muted-foreground">
                    {section.content_items?.length || 0} itens
                  </p>
                </div>
                <div className="flex space-x-2 bg-black">
                  <Button 
                    onClick={() => {
                      setEditingSection(section);
                      setSectionModalOpen(true);
                    }} 
                    variant="outline" 
                    size="sm" 
                    className="border-admin-border text-black bg-white hover:bg-gray-100"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button 
                    onClick={() => duplicateSection(section)} 
                    variant="outline" 
                    size="sm" 
                    className="border-admin-border text-black bg-white hover:bg-gray-100"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-admin-card border-admin-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-admin-foreground">Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription className="text-admin-muted-foreground">
                          Tem certeza que deseja excluir a seção "{section.title}"? 
                          Esta ação irá remover todos os {section.content_items?.length || 0} itens desta seção e não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-admin-border text-black bg-white hover:bg-gray-100">
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => deleteSection(section.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir Seção
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => {
                          setEditingItem({} as ContentItem);
                          setCurrentSectionId(section.id);
                          setItemModalOpen(true);
                        }} 
                        variant="admin" 
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-admin-card border-admin-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-admin-foreground">
                          {editingItem?.id ? 'Editar Item' : 'Novo Item'}
                        </DialogTitle>
                      </DialogHeader>
                      <ItemEditor sectionId={currentSectionId} item={editingItem?.id ? editingItem : undefined} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="bg-black">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleItemDragEnd(event, section.id)}
                >
                  <SortableContext
                    items={section.content_items?.map(item => item.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-black">
                      {section.content_items?.map(item => (
                        <SortableItem key={item.id} item={item} section={section} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          </TabsContent>)}
      </Tabs>
    </div>;
};

export default ContentEditor;
