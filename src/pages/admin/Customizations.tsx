
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';

interface Customization {
  id: string;
  page: string;
  section: string;
  element_type: string;
  element_key: string;
  element_value: string | null;
  active: boolean;
}

const AdminCustomizations = () => {
  const [customizations, setCustomizations] = useState<Customization[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<Customization | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    page: '',
    section: '',
    element_type: '',
    element_key: '',
    element_value: '',
    active: true
  });

  useEffect(() => {
    fetchCustomizations();
  }, []);

  const fetchCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .order('page', { ascending: true });

      if (error) throw error;
      setCustomizations(data || []);
    } catch (error) {
      console.error('Erro ao buscar personalizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as personalizações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('customizations')
          .update({
            page: formData.page,
            section: formData.section,
            element_type: formData.element_type,
            element_key: formData.element_key,
            element_value: formData.element_value,
            active: formData.active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Personalização atualizada com sucesso"
        });
      } else {
        // Create new
        const { error } = await supabase
          .from('customizations')
          .insert([{
            page: formData.page,
            section: formData.section,
            element_type: formData.element_type,
            element_key: formData.element_key,
            element_value: formData.element_value,
            active: formData.active
          }]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Personalização criada com sucesso"
        });
      }

      fetchCustomizations();
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a personalização",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta personalização?')) return;

    try {
      const { error } = await supabase
        .from('customizations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Personalização excluída com sucesso"
      });
      fetchCustomizations();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a personalização",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: Customization) => {
    setEditingItem(item);
    setFormData({
      page: item.page,
      section: item.section,
      element_type: item.element_type,
      element_key: item.element_key,
      element_value: item.element_value || '',
      active: item.active
    });
    setIsCreating(false);
  };

  const resetForm = () => {
    setEditingItem(null);
    setIsCreating(false);
    setFormData({
      page: '',
      section: '',
      element_type: '',
      element_key: '',
      element_value: '',
      active: true
    });
  };

  const groupedCustomizations = customizations.reduce((acc, item) => {
    if (!acc[item.page]) acc[item.page] = [];
    acc[item.page].push(item);
    return acc;
  }, {} as Record<string, Customization[]>);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-white">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Personalização</h1>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Panel */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  {editingItem ? 'Editar Personalização' : 'Nova Personalização'}
                  {(editingItem || isCreating) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="page" className="text-gray-300">Página</Label>
                  <Select value={formData.page} onValueChange={(value) => setFormData({...formData, page: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione a página" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="plans">Planos</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="section" className="text-gray-300">Seção</Label>
                  <Input
                    id="section"
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Ex: hero, header, footer"
                  />
                </div>

                <div>
                  <Label htmlFor="element_type" className="text-gray-300">Tipo do Elemento</Label>
                  <Select value={formData.element_type} onValueChange={(value) => setFormData({...formData, element_type: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="image">Imagem</SelectItem>
                      <SelectItem value="color">Cor</SelectItem>
                      <SelectItem value="logo">Logo</SelectItem>
                      <SelectItem value="favicon">Favicon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="element_key" className="text-gray-300">Chave do Elemento</Label>
                  <Input
                    id="element_key"
                    value={formData.element_key}
                    onChange={(e) => setFormData({...formData, element_key: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Ex: title, subtitle, background_color"
                  />
                </div>

                <div>
                  <Label htmlFor="element_value" className="text-gray-300">Valor</Label>
                  <Textarea
                    id="element_value"
                    value={formData.element_value}
                    onChange={(e) => setFormData({...formData, element_value: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Valor do elemento"
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({...formData, active: checked})}
                  />
                  <Label htmlFor="active" className="text-gray-300">Ativo</Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                  {!editingItem && !isCreating && (
                    <Button 
                      onClick={() => setIsCreating(true)} 
                      variant="outline" 
                      className="border-gray-600 text-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* List Panel */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="all" className="space-y-4">
              <TabsList className="bg-gray-800">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="home">Home</TabsTrigger>
                <TabsTrigger value="plans">Planos</TabsTrigger>
                <TabsTrigger value="login">Login</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700">
                          <TableHead className="text-gray-300">Página</TableHead>
                          <TableHead className="text-gray-300">Seção</TableHead>
                          <TableHead className="text-gray-300">Tipo</TableHead>
                          <TableHead className="text-gray-300">Chave</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-gray-300">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customizations.map((item) => (
                          <TableRow key={item.id} className="border-gray-700">
                            <TableCell className="text-white capitalize">{item.page}</TableCell>
                            <TableCell className="text-white">{item.section}</TableCell>
                            <TableCell className="text-white">{item.element_type}</TableCell>
                            <TableCell className="text-white">{item.element_key}</TableCell>
                            <TableCell>
                              <Badge variant={item.active ? 'default' : 'secondary'}>
                                {item.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(item)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(item.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {['home', 'plans', 'login'].map((page) => (
                <TabsContent key={page} value={page}>
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white capitalize">Personalização - {page}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-700">
                            <TableHead className="text-gray-300">Seção</TableHead>
                            <TableHead className="text-gray-300">Tipo</TableHead>
                            <TableHead className="text-gray-300">Chave</TableHead>
                            <TableHead className="text-gray-300">Valor</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-gray-300">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(groupedCustomizations[page] || []).map((item) => (
                            <TableRow key={item.id} className="border-gray-700">
                              <TableCell className="text-white">{item.section}</TableCell>
                              <TableCell className="text-white">{item.element_type}</TableCell>
                              <TableCell className="text-white">{item.element_key}</TableCell>
                              <TableCell className="text-white truncate max-w-xs">
                                {item.element_value}
                              </TableCell>
                              <TableCell>
                                <Badge variant={item.active ? 'default' : 'secondary'}>
                                  {item.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(item)}
                                    className="text-gray-400 hover:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(item.id)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomizations;
