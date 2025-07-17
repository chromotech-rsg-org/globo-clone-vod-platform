import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ui/image-upload';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/AdminLayout';
import { Save, Home, LogIn, ImageIcon, Settings } from 'lucide-react';

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
  const navigate = useNavigate();

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
    'global_site_name': 'Globoplay',
    
    // Login Page
    'login_title': 'Faça seu login',
    'login_subtitle': 'Acesse sua conta para continuar',
    'login_background_color': '#0f172a',
    'login_background_image': '',
    'login_card_background_color': '#1f2937',
    
    // System Admin
    'admin_logo': '',
    'admin_title': 'Globoplay Admin',
    'admin_company_name': 'Globoplay',
    'admin_primary_color': '#1e40af',
    'admin_sidebar_color': '#1f2937',
    'admin_background_color': '#111827'
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
      <Card key={key} className="bg-admin-card border-admin-border">
        <CardContent className="p-4">
          <Label className="text-admin-foreground mb-2 block">{label}</Label>
          
          {type === 'text' && (
            <div className="flex space-x-2">
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground flex-1"
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
                className="bg-admin-input border-admin-border text-admin-foreground"
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
                className="bg-admin-input border-admin-border w-20 h-10"
              />
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-admin-input border-admin-border text-admin-foreground flex-1"
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
                <img src={value} alt={label} className="w-32 h-20 object-contain bg-admin-muted rounded" />
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
          <div className="text-admin-foreground">Carregando...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-foreground">Personalização do Sistema</h1>
          <p className="text-admin-muted-foreground text-sm">Personalize a aparência e conteúdo do site</p>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-admin-muted">
            <TabsTrigger value="home" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Home className="h-4 w-4 mr-2" />
              Home
            </TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <ImageIcon className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="system" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Seção Hero/Banner</CardTitle>
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

            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Seção de Planos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderElementEditor('home_plans_title', 'Título da Seção', 'text')}
                {renderElementEditor('home_plans_subtitle', 'Subtítulo', 'text')}
                {renderElementEditor('home_plans_background_color', 'Cor de Fundo', 'color')}
              </CardContent>
            </Card>

            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Rodapé</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderElementEditor('home_footer_copyright', 'Texto de Copyright', 'text')}
                {renderElementEditor('home_footer_background_color', 'Cor de Fundo', 'color')}
                {renderElementEditor('home_footer_text_color', 'Cor do Texto', 'color')}
                {renderElementEditor('home_footer_logo_image', 'Logo do Rodapé', 'image')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login" className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Página de Login</CardTitle>
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

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Gerenciar Conteúdo</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Configure as seções de conteúdo da página inicial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ContentManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Configurações do Sistema</CardTitle>
                <CardDescription className="text-admin-muted-foreground">
                  Personalize logo, nome e cores do sistema administrativo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderElementEditor('admin_logo', 'Logo do Sistema', 'image')}
                {renderElementEditor('admin_title', 'Nome do Sistema', 'text')}
                {renderElementEditor('admin_primary_color', 'Cor Principal', 'color')}
                {renderElementEditor('admin_sidebar_color', 'Cor do Menu', 'color')}
                {renderElementEditor('admin_background_color', 'Cor de Fundo', 'color')}
                {renderElementEditor('global_site_name', 'Nome do Site', 'text')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-4 bg-admin-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-admin-foreground font-medium">Preview das Mudanças</h3>
              <p className="text-admin-muted-foreground text-sm">Visualize o site com as personalizações aplicadas</p>
            </div>
            <Button
              onClick={() => window.open('/', '_blank')}
              variant="outline"
              className="border-admin-border text-admin-foreground hover:bg-admin-primary hover:text-admin-primary-foreground"
            >
              Visualizar Site
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const ContentManager = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const { data, error } = await supabase
        .from('content_sections')
        .select('*, content_items(*)')
        .eq('active', true)
        .order('order_index');

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

  const updateSectionTitle = async (sectionId, newTitle) => {
    try {
      const { error } = await supabase
        .from('content_sections')
        .update({ title: newTitle })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.map(section => 
        section.id === sectionId ? { ...section, title: newTitle } : section
      ));

      toast({
        title: "Sucesso",
        description: "Título atualizado com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao atualizar título:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o título.",
        variant: "destructive"
      });
    }
  };

  const updateItemTitle = async (itemId, newTitle) => {
    try {
      const { error } = await supabase
        .from('content_items')
        .update({ title: newTitle })
        .eq('id', itemId);

      if (error) throw error;

      setSections(prev => prev.map(section => ({
        ...section,
        content_items: section.content_items?.map(item =>
          item.id === itemId ? { ...item, title: newTitle } : item
        )
      })));

      toast({
        title: "Sucesso",
        description: "Título do item atualizado!",
      });
    } catch (error) {
      console.error('Erro ao atualizar título do item:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o título do item.",
        variant: "destructive"
      });
    }
  };

  if (loading) return <div className="text-admin-muted-foreground">Carregando seções...</div>;

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="bg-admin-muted border-admin-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Input
                  value={section.title}
                  onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                  className="text-lg font-semibold bg-admin-input border-admin-border text-admin-foreground"
                />
                <Badge variant="outline" className="border-admin-border text-admin-muted-foreground">
                  {section.type}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.content_items?.map((item) => (
                <div key={item.id} className="border border-admin-border rounded-lg p-4 bg-admin-background">
                  <div className="aspect-video bg-admin-muted rounded mb-2 overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-admin-muted-foreground">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <Input
                    value={item.title}
                    onChange={(e) => updateItemTitle(item.id, e.target.value)}
                    className="text-sm bg-admin-input border-admin-border text-admin-foreground"
                  />
                  <p className="text-xs text-admin-muted-foreground mt-1">{item.category}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminPersonalization;