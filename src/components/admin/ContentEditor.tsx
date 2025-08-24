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
import { Save, Edit, Plus, Trash2, Eye, GripVertical } from 'lucide-react';
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
  category: string | null;
  rating: string | null;
  age_rating_background_color?: string | null;
  section_id: string;
  order_index: number;
  active: boolean;
}
const ContentEditor = () => {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editingSection, setEditingSection] = useState<ContentSection | null>(null);
  const {
    toast
  } = useToast();
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
        const {
          error
        } = await supabase.from('content_items').update({
          title: item.title,
          image_url: item.image_url,
          category: item.category,
          rating: item.rating,
          age_rating_background_color: item.age_rating_background_color,
          updated_at: new Date().toISOString()
        }).eq('id', item.id);
        if (error) throw error;
      } else {
        // Create new item
        const {
          error
        } = await supabase.from('content_items').insert({
          title: item.title,
          image_url: item.image_url,
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
      const {
        error
      } = await supabase.from('content_items').delete().eq('id', itemId);
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
      category: item?.category || '',
      rating: item?.rating || '',
      age_rating_background_color: item?.age_rating_background_color || '#fbbf24',
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
    return <Card className="bg-admin-muted border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-foreground text-sm">
            {item ? 'Editar Item' : 'Novo Item'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-admin-foreground">Título</Label>
            <Input value={formData.title} onChange={e => setFormData(prev => ({
            ...prev,
            title: e.target.value
          }))} className="bg-admin-input border-admin-border text-admin-foreground" placeholder="Nome do filme/série" />
          </div>

          <div>
            <Label className="text-admin-foreground">Categoria</Label>
            <Input value={formData.category} onChange={e => setFormData(prev => ({
            ...prev,
            category: e.target.value
          }))} className="bg-admin-input border-admin-border text-admin-foreground" placeholder="Ex: Ação, Drama, Comédia" />
          </div>

          <div>
            <Label className="text-admin-foreground">Faixa Etária</Label>
            <Input value={formData.rating} onChange={e => setFormData(prev => ({
            ...prev,
            rating: e.target.value
          }))} className="bg-admin-input border-admin-border text-admin-foreground" placeholder="Ex: 12+, 16+, Livre" />
          </div>

          <div>
            <Label className="text-admin-foreground">Cor de Fundo da Faixa Etária</Label>
            <div className="flex space-x-2">
              <input type="color" value={formData.age_rating_background_color || '#fbbf24'} onChange={e => setFormData(prev => ({
              ...prev,
              age_rating_background_color: e.target.value
            }))} className="w-12 h-8 rounded border border-admin-border cursor-pointer" />
              <Input value={formData.age_rating_background_color || '#fbbf24'} onChange={e => setFormData(prev => ({
              ...prev,
              age_rating_background_color: e.target.value
            }))} className="bg-admin-input border-admin-border text-admin-foreground flex-1" placeholder="#fbbf24" />
            </div>
          </div>

          <div>
            <Label className="text-admin-foreground">Imagem</Label>
            {formData.image_url && <div className="mb-2">
                <img src={formData.image_url} alt="Preview" className="w-20 h-28 object-cover rounded border border-admin-border" />
              </div>}
            <ImageUpload onImageUploaded={handleImageUpload} folder="content" maxSizeKB={5120} />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave} variant="admin" size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={() => setEditingItem(null)} variant="outline" size="sm" className="border-admin-border text-admin-foreground">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>;
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
    return <Card className="bg-admin-muted border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-foreground text-sm">
            {section ? 'Editar Seção' : 'Nova Seção'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-admin-foreground">Título da Seção</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-admin-input border-admin-border text-admin-foreground" placeholder="Ex: Filmes em Alta, Séries Originais" />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave} variant="admin" size="sm" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={() => setEditingSection(null)} variant="outline" size="sm" className="border-admin-border text-admin-foreground">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>;
  };
  if (loading) {
    return <div className="text-admin-foreground">Carregando conteúdo...</div>;
  }
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-admin-foreground text-slate-50">
          Seções de Conteúdo
        </h3>
        <Button onClick={() => setEditingSection({} as ContentSection)} variant="admin" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      {editingSection && <SectionEditor section={editingSection.id ? editingSection : undefined} />}

      <Tabs defaultValue={sections[0]?.id} className="space-y-4">
        <TabsList className="bg-admin-muted">
          {sections.map(section => <TabsTrigger key={section.id} value={section.id} className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground text-slate-50">
              {section.title}
              <Badge variant="secondary" className="ml-2 text-xs">
                {section.content_items?.length || 0}
              </Badge>
            </TabsTrigger>)}
        </TabsList>

        {sections.map(section => <TabsContent key={section.id} value={section.id} className="space-y-4">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-admin-foreground text-slate-50">{section.title}</CardTitle>
                  <p className="text-sm text-admin-muted-foreground">
                    {section.content_items?.length || 0} itens
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => setEditingSection(section)} variant="outline" size="sm" className="border-admin-border text-admin-foreground">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setEditingItem({} as ContentItem)} variant="admin" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {editingItem && !editingItem.id && <div className="mb-4">
                    <ItemEditor sectionId={section.id} />
                  </div>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.content_items?.map(item => <Card key={item.id} className="bg-admin-muted border-admin-border">
                      <CardContent className="p-4">
                        {editingItem?.id === item.id ? <ItemEditor item={item} sectionId={section.id} /> : <div className="space-y-3">
                            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded" />}
                            <div>
                              <h4 className="font-medium text-admin-foreground text-sm">
                                {item.title}
                              </h4>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-admin-muted-foreground">
                                  {item.category}
                                </span>
                                {item.rating && <Badge variant="outline" className="text-xs" style={{
                          backgroundColor: item.age_rating_background_color || '#fbbf24',
                          color: '#000000',
                          borderColor: item.age_rating_background_color || '#fbbf24'
                        }}>
                                    {item.rating}
                                  </Badge>}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button onClick={() => setEditingItem(item)} variant="outline" size="sm" className="flex-1 border-admin-border text-admin-foreground">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button onClick={() => deleteItem(item.id)} variant="destructive" size="sm" className="flex-1">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>}
                      </CardContent>
                    </Card>)}
                </div>
              </CardContent>
            </Card>
          </TabsContent>)}
      </Tabs>
    </div>;
};
export default ContentEditor;