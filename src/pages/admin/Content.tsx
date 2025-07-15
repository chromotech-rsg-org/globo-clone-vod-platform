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
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
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

  const saveSection = async (section: ContentSection) => {
    try {
      const { error } = await supabase
        .from('content_sections')
        .update({
          title: section.title,
          type: section.type,
          page: section.page,
          active: section.active
        })
        .eq('id', section.id);

      if (error) throw error;

      setSections(prev => prev.map(s => s.id === section.id ? section : s));
      setEditingSection(null);
      toast({
        title: "Sucesso",
        description: "Seção atualizada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar seção:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar seção",
        variant: "destructive",
      });
    }
  };

  const saveItem = async (item: ContentItem) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({
          title: item.title,
          image_url: item.image_url,
          category: item.category,
          rating: item.rating,
          active: item.active
        })
        .eq('id', item.id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === item.id ? item : i));
      setEditingItem(null);
      toast({
        title: "Sucesso",
        description: "Item atualizado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao salvar item:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar item",
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
              <div className="flex items-center justify-between mb-4">
                {editingSection === section.id ? (
                  <div className="flex items-center gap-4 flex-1">
                    <Input
                      value={section.title}
                      onChange={(e) => setSections(prev => prev.map(s => s.id === section.id ? { ...s, title: e.target.value } : s))}
                      className="max-w-xs"
                    />
                    <Select value={section.type} onValueChange={(value: 'horizontal' | 'vertical') => setSections(prev => prev.map(s => s.id === section.id ? { ...s, type: value } : s))}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => saveSection(section)}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">{section.title}</h2>
                    <span className="text-sm text-gray-500">({section.type})</span>
                    <Button size="sm" variant="outline" onClick={() => setEditingSection(section.id)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button size="sm" onClick={() => addItem(section.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                    {editingItem === item.id ? (
                      <div className="space-y-4">
                        <Input
                          placeholder="Título"
                          value={item.title}
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, title: e.target.value } : i))}
                        />
                        <Input
                          placeholder="Categoria"
                          value={item.category || ''}
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, category: e.target.value } : i))}
                        />
                        <Input
                          placeholder="Classificação"
                          value={item.rating || ''}
                          onChange={(e) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, rating: e.target.value } : i))}
                        />
                        <ImageUpload
                          onImageUploaded={(url) => setItems(prev => prev.map(i => i.id === item.id ? { ...i, image_url: url } : i))}
                          folder="content"
                          maxSizeKB={5120}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveItem(item)}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingItem(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-full h-32 object-cover rounded" />
                        )}
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.category}</p>
                        <p className="text-xs text-gray-500">Classificação: {item.rating}</p>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(item.id)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    )}
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