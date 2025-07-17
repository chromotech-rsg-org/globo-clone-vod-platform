import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ui/image-upload';

interface ContentSection {
  id: string;
  title: string;
  type: 'horizontal' | 'vertical';
  page: string;
  order_index: number;
  active: boolean;
}

interface ContentItem {
  id: string;
  title: string;
  image_url: string | null;
  category: string | null;
  rating: string | null;
  section_id: string;
  order_index: number;
  active: boolean;
}

const AdminContent = () => {
  const [sections, setSections] = useState<ContentSection[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFields, setEditingFields] = useState<Record<string, string>>({});
  const [newSection, setNewSection] = useState<{ title: string; type: 'horizontal' | 'vertical'; page: string }>({ title: '', type: 'horizontal', page: 'home' });
  const [showNewSection, setShowNewSection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsResponse, itemsResponse] = await Promise.all([
        supabase.from('content_sections').select('*').order('order_index'),
        supabase.from('content_items').select('*').order('order_index')
      ]);

      if (sectionsResponse.error) throw sectionsResponse.error;
      if (itemsResponse.error) throw itemsResponse.error;

      setSections((sectionsResponse.data || []).map(section => ({
        ...section,
        type: section.type as 'horizontal' | 'vertical'
      })));
      setItems(itemsResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar o conteúdo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSectionField = async (sectionId: string, field: string, value: string) => {
    try {
      const updates: any = {};
      updates[field] = value;
      
      const { error } = await supabase
        .from('content_sections')
        .update(updates)
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.map(s => s.id === sectionId ? { ...s, [field]: value } : s));
      setEditingFields(prev => {
        const newState = { ...prev };
        delete newState[`section-${sectionId}-${field}`];
        return newState;
      });
      
      toast({
        title: "Sucesso",
        description: "Campo atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar campo",
        variant: "destructive",
      });
    }
  };

  const saveItemField = async (itemId: string, field: string, value: string) => {
    try {
      const updates: any = {};
      updates[field] = value;
      
      const { error } = await supabase
        .from('content_items')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === itemId ? { ...i, [field]: value } : i));
      setEditingFields(prev => {
        const newState = { ...prev };
        delete newState[`item-${itemId}-${field}`];
        return newState;
      });
      
      // Força a atualização do cache das seções de conteúdo
      window.dispatchEvent(new CustomEvent('contentUpdated'));
      
      toast({
        title: "Sucesso",
        description: "Campo atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar campo:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar campo",
        variant: "destructive",
      });
    }
  };

  const createSection = async () => {
    try {
      const { data, error } = await supabase
        .from('content_sections')
        .insert([{
          title: newSection.title,
          type: newSection.type,
          page: newSection.page,
          order_index: sections.length + 1
        }])
        .select()
        .single();

      if (error) throw error;

      setSections(prev => [...prev, { ...data, type: data.type as 'horizontal' | 'vertical' }]);
      setNewSection({ title: '', type: 'horizontal', page: 'home' });
      setShowNewSection(false);
      toast({
        title: "Sucesso",
        description: "Seção criada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao criar seção:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar seção",
        variant: "destructive",
      });
    }
  };

  const addItem = async (sectionId: string) => {
    try {
      const sectionItems = items.filter(i => i.section_id === sectionId);
      const { data, error } = await supabase
        .from('content_items')
        .insert([{
          title: 'Novo Item',
          section_id: sectionId,
          order_index: sectionItems.length + 1,
          category: 'Categoria',
          rating: 'L'
        }])
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      toast({
        title: "Sucesso",
        description: "Item adicionado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar item",
        variant: "destructive",
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setItems(prev => prev.filter(i => i.id !== itemId));
      toast({
        title: "Sucesso",
        description: "Item removido com sucesso",
      });
    } catch (error) {
      console.error('Erro ao remover item:', error);
      toast({
        title: "Erro",
        description: "Erro ao remover item",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciar Conteúdo</h1>
        <Button onClick={() => setShowNewSection(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Seção
        </Button>
      </div>

      {showNewSection && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
          <h3 className="text-lg font-semibold mb-4">Nova Seção</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Título da seção"
              value={newSection.title}
              onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
            />
            <Select value={newSection.type} onValueChange={(value: 'horizontal' | 'vertical') => setNewSection(prev => ({ ...prev, type: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={createSection} disabled={!newSection.title}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              <Button variant="outline" onClick={() => setShowNewSection(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {sections.map((section) => {
          const sectionItems = items.filter(item => item.section_id === section.id);
          
          return (
            <div key={section.id} className="border rounded-lg p-6">
              <div className="flex flex-col gap-4 mb-6">
                {/* Título da Seção */}
                <div className="flex items-center gap-2">
                  <label className="font-medium min-w-[80px]">Título:</label>
                  {editingFields[`section-${section.id}-title`] ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={section.title}
                        onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                        className="max-w-md"
                      />
                      <Button size="sm" variant="admin" onClick={() => saveSectionField(section.id, 'title', section.title)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => {
                        const newState = { ...prev };
                        delete newState[`section-${section.id}-title`];
                        return newState;
                      })}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{section.title}</span>
                      <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => ({ ...prev, [`section-${section.id}-title`]: 'true' }))}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Tipo da Seção */}
                <div className="flex items-center gap-2">
                  <label className="font-medium min-w-[80px]">Tipo:</label>
                  {editingFields[`section-${section.id}-type`] ? (
                    <div className="flex items-center gap-2">
                      <Select value={section.type} onValueChange={(value: 'horizontal' | 'vertical') => setSections(prev => prev.map(s => s.id === section.id ? { ...s, type: value } : s))}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                          <SelectItem value="vertical">Vertical</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="admin" onClick={() => saveSectionField(section.id, 'type', section.type)}>
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => {
                        const newState = { ...prev };
                        delete newState[`section-${section.id}-type`];
                        return newState;
                      })}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded">{section.type}</span>
                      <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => ({ ...prev, [`section-${section.id}-type`]: 'true' }))}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Botão para adicionar item */}
                <div className="flex justify-end">
                  <Button size="sm" onClick={() => addItem(section.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sectionItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                    {/* Imagem do Item */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Imagem:</label>
                      {item.image_url && (
                        <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded" />
                      )}
                      <ImageUpload
                        onImageUploaded={(url) => saveItemField(item.id, 'image_url', url)}
                        folder="content"
                        maxSizeKB={5120}
                      />
                    </div>

                    {/* Título do Item */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Título:</label>
                      {editingFields[`item-${item.id}-title`] ? (
                        <div className="flex gap-2">
                          <Input
                            value={item.title}
                            onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))}
                          />
                          <Button size="sm" variant="admin" onClick={() => saveItemField(item.id, 'title', item.title)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.title}</span>
                          <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => ({ ...prev, [`item-${item.id}-title`]: 'true' }))}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Categoria do Item */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Categoria:</label>
                      {editingFields[`item-${item.id}-category`] ? (
                        <div className="flex gap-2">
                          <Input
                            value={item.category || ''}
                            onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                          />
                          <Button size="sm" variant="admin" onClick={() => saveItemField(item.id, 'category', item.category || '')}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{item.category}</span>
                          <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => ({ ...prev, [`item-${item.id}-category`]: 'true' }))}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Classificação do Item */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Classificação Etária:</label>
                      {editingFields[`item-${item.id}-rating`] ? (
                        <div className="flex gap-2">
                          <Select 
                            value={item.rating || ''} 
                            onValueChange={(value) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, rating: value } : i))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L">L - Livre</SelectItem>
                              <SelectItem value="10">10 anos</SelectItem>
                              <SelectItem value="12">12 anos</SelectItem>
                              <SelectItem value="14">14 anos</SelectItem>
                              <SelectItem value="16">16 anos</SelectItem>
                              <SelectItem value="18">18 anos</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="admin" onClick={() => saveItemField(item.id, 'rating', item.rating || '')}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                            {item.rating === 'L' ? 'L - Livre' : item.rating ? `${item.rating} anos` : 'Não definido'}
                          </span>
                          <Button size="sm" variant="outline" onClick={() => setEditingFields(prev => ({ ...prev, [`item-${item.id}-rating`]: 'true' }))}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex justify-end pt-2">
                      <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminContent;