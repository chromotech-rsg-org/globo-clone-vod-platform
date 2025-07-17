import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Palette, Home, LogIn, Image as ImageIcon, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import ImageUpload from '@/components/ui/image-upload';
import { useContentSections } from '@/hooks/useContentSections';

interface Customization {
  id?: string;
  page: string;
  section: string;
  element_type: string;
  element_key: string;
  element_value: string;
  active: boolean;
}

const AdminPersonalization = () => {
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const { toast } = useToast();
  const { sections: contentSections, refetch: refetchContentSections } = useContentSections('home');

  const defaultCustomizations = {
    // Home Page
    'home_hero_title': 'Sua melhor escolha em streaming',
    'home_hero_subtitle': 'Assista aos melhores filmes e séries',
    'home_hero_button_text': 'Assinar Agora',
    'home_hero_background_color': '#0f172a',
    'home_hero_text_color': '#ffffff',
    'home_hero_background_image': '',
    
    'home_header_logo_image': '',
    'home_header_menu_color': '#ffffff',
    'home_header_background_color': 'transparent',
    
    'home_footer_copyright': '© 2024 Todos os direitos reservados',
    'home_footer_background_color': '#1f2937',
    'home_footer_text_color': '#ffffff',
    'home_footer_logo_image': '',
    
    'home_plans_title': 'Escolha seu plano',
    'home_plans_subtitle': 'Planos flexíveis para todos os perfis',
    'home_plans_background_color': '#0f172a',
    
    // Global/Site
    'global_site_background_color': '#0f172a',
    'global_primary_color': '#ef4444',
    'global_secondary_color': '#1f2937',
    
    // Login Page
    'login_title': 'Faça seu login',
    'login_subtitle': 'Acesse sua conta para continuar',
    'login_background_color': '#0f172a',
    'login_background_image': '',
    'login_card_background_color': '#1f2937',
    
    // System Admin
    'admin_logo': '',
    'admin_title': 'Painel Administrativo',
    'admin_company_name': 'Minha Empresa',
    'admin_primary_color': '#1e40af',
    'admin_success_color': '#059669',
    'admin_danger_color': '#dc2626',
    'admin_sidebar_bg': '#1f2937',
    'admin_content_bg': '#111827'
  };

  useEffect(() => {
    fetchCustomizations();
  }, []);

  const fetchCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .eq('active', true);

      if (error) throw error;

      const customizationMap: Record<string, string> = { ...defaultCustomizations };
      
      data?.forEach((item) => {
        const key = `${item.page}_${item.section}_${item.element_key}`;
        if (item.element_value) {
          customizationMap[key] = item.element_value;
        }
      });

      setCustomizations(customizationMap);
    } catch (error) {
      console.error('Erro ao carregar personalizações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as personalizações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCustomization = async (key: string, value: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const [page, section, elementKey] = key.split('_');
      const elementType = key.includes('color') ? 'color' : 
                         key.includes('image') ? 'image' : 'text';

      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('customizations')
        .select('id')
        .eq('page', page)
        .eq('section', section)
        .eq('element_key', elementKey)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        // Atualizar existente
        const { error } = await supabase
          .from('customizations')
          .update({
            element_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo
        const { error } = await supabase
          .from('customizations')
          .insert({
            page,
            section,
            element_type: elementType,
            element_key: elementKey,
            element_value: value,
            active: true
          });

        if (error) throw error;
      }

      setCustomizations(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Sucesso",
        description: "Personalização salva com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao salvar personalização:', error);
      toast({
        title: "Erro",
        description: error.message === 'Usuário não autenticado' 
          ? "Você precisa estar logado para realizar esta ação"
          : "Não foi possível salvar a personalização",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (key: string, url: string) => {
    saveCustomization(key, url);
  };

  const renderElementEditor = (key: string, label: string, type: 'text' | 'color' | 'image' | 'textarea' = 'text') => {
    const value = customizations[key] || defaultCustomizations[key as keyof typeof defaultCustomizations] || '';

    return (
      <Card key={key} className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <Label className="text-gray-300 mb-2 block">{label}</Label>
          
          {type === 'text' && (
            <div className="flex space-x-2">
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white flex-1"
                placeholder={label}
              />
              <Button
                onClick={() => saveCustomization(key, customizations[key] || '')}
                variant="admin"
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}

          {type === 'textarea' && (
            <div className="space-y-2">
              <Textarea
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={label}
                rows={3}
              />
              <Button
                onClick={() => saveCustomization(key, customizations[key] || '')}
                variant="admin"
                size="sm"
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          )}

          {type === 'color' && (
            <div className="flex space-x-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setCustomizations(prev => ({ ...prev, [key]: newValue }));
                  saveCustomization(key, newValue);
                }}
                className="bg-gray-700 border-gray-600 w-20 h-10"
              />
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white flex-1"
                placeholder="#000000"
              />
              <Button
                onClick={() => saveCustomization(key, customizations[key] || '')}
                variant="admin"
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          )}

          {type === 'image' && (
            <div className="space-y-2">
              {value && (
                <img src={value} alt={label} className="w-32 h-20 object-contain bg-gray-700 rounded" />
              )}
              <ImageUpload
                onImageUploaded={(url) => handleImageUpload(key, url)}
                folder="site"
                maxSizeKB={5120}
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

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
          <h1 className="text-xl font-bold text-white">Personalização Completa</h1>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-700">
            <TabsTrigger value="home" className="data-[state=active]:bg-gray-600">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-gray-600">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-600">
              <ImageIcon className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-gray-600">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <div className="space-y-6">
              {/* Hero Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Seção Hero/Banner</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('home_hero_title', 'Título Principal', 'text')}
                  {renderElementEditor('home_hero_subtitle', 'Subtítulo', 'text')}
                  {renderElementEditor('home_hero_button_text', 'Texto do Botão', 'text')}
                  {renderElementEditor('home_hero_background_color', 'Cor de Fundo', 'color')}
                  {renderElementEditor('home_hero_text_color', 'Cor do Texto', 'color')}
                  {renderElementEditor('home_hero_background_image', 'Imagem de Fundo', 'image')}
                </CardContent>
              </Card>

              {/* Header Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Cabeçalho</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('home_header_logo_image', 'Logo do Cabeçalho', 'image')}
                  {renderElementEditor('home_header_menu_color', 'Cor do Menu', 'color')}
                  {renderElementEditor('home_header_background_color', 'Cor de Fundo', 'color')}
                </CardContent>
              </Card>

              {/* Plans Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Seção de Planos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('home_plans_title', 'Título da Seção', 'text')}
                  {renderElementEditor('home_plans_subtitle', 'Subtítulo', 'text')}
                  {renderElementEditor('home_plans_background_color', 'Cor de Fundo', 'color')}
                </CardContent>
              </Card>

              {/* Footer Section */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Rodapé</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('home_footer_copyright', 'Texto de Copyright', 'text')}
                  {renderElementEditor('home_footer_background_color', 'Cor de Fundo', 'color')}
                  {renderElementEditor('home_footer_text_color', 'Cor do Texto', 'color')}
                  {renderElementEditor('home_footer_logo_image', 'Logo do Rodapé', 'image')}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="login" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Página de Login</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderElementEditor('login_title', 'Título', 'text')}
                {renderElementEditor('login_subtitle', 'Subtítulo', 'text')}
                {renderElementEditor('login_background_color', 'Cor de Fundo', 'color')}
                {renderElementEditor('login_card_background_color', 'Cor do Card', 'color')}
                {renderElementEditor('login_background_image', 'Imagem de Fundo', 'image')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Gestão de Conteúdo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Gerencie as seções de conteúdo da página inicial, como carrosséis de filmes, séries e novelas.
                  </p>
                  
                  {contentSections.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {contentSections.map((section) => (
                        <Card key={section.id} className="bg-gray-700 border-gray-600">
                          <CardContent className="p-4">
                            <h3 className="text-white font-medium mb-2">{section.title}</h3>
                            <p className="text-gray-300 text-sm mb-2">
                              Tipo: {section.type === 'horizontal' ? 'Horizontal' : 'Vertical'}
                            </p>
                            <p className="text-gray-300 text-sm mb-3">
                              {section.items.length} itens
                            </p>
                            <Button 
                              size="sm" 
                              variant="admin"
                              className="w-full"
                              onClick={() => window.location.href = '/admin/content'}
                            >
                              Editar Conteúdo
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-700 border-gray-600">
                      <CardContent className="p-8 text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400 mb-4">Nenhuma seção de conteúdo encontrada</p>
                        <Button 
                          variant="admin"
                          onClick={() => window.location.href = '/admin/content'}
                        >
                          Criar Primeira Seção
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="space-y-6">
              {/* Sistema */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Configurações do Sistema Admin</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('admin_logo', 'Logo do Admin', 'image')}
                  {renderElementEditor('admin_title', 'Nome do Sistema', 'text')}
                  {renderElementEditor('admin_company_name', 'Nome da Empresa', 'text')}
                </CardContent>
              </Card>

              {/* Cores do Sistema */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Cores do Sistema Admin</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderElementEditor('admin_primary_color', 'Cor Primária (Botões)', 'color')}
                  {renderElementEditor('admin_success_color', 'Cor de Sucesso', 'color')}
                  {renderElementEditor('admin_danger_color', 'Cor de Perigo', 'color')}
                  {renderElementEditor('admin_sidebar_bg', 'Fundo da Sidebar', 'color')}
                  {renderElementEditor('admin_content_bg', 'Fundo do Conteúdo', 'color')}
                </CardContent>
              </Card>

              {/* Cores Globais */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Cores Globais do Site</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderElementEditor('global_site_background_color', 'Cor de Fundo Geral', 'color')}
                  {renderElementEditor('global_primary_color', 'Cor Primária', 'color')}
                  {renderElementEditor('global_secondary_color', 'Cor Secundária', 'color')}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview Button */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardContent className="p-4 text-center">
            <Button 
              variant="admin" 
              onClick={() => window.open('/', '_blank')}
              className="w-full md:w-auto"
            >
              <Home className="h-4 w-4 mr-2" />
              Visualizar Site com Mudanças
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPersonalization;