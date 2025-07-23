import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, LogIn, Settings, Image, Palette, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { useCustomizations } from '@/hooks/useCustomizations';
import { useAdminLoginCustomizations } from '@/hooks/useAdminLoginCustomizations';
import { supabase } from '@/integrations/supabase/client';
import { CustomizationEditor } from '@/components/admin/CustomizationEditor';
import ContentEditor from '@/components/admin/ContentEditor';
import HeroSliderEditor from '@/components/admin/HeroSliderEditor';

interface CustomizationConfig {
  key: string;
  label: string;
  type: 'text' | 'color' | 'image' | 'textarea';
  section: string;
  page: string;
  placeholder?: string;
  description?: string;
  defaultValue: string;
}

const AdminCustomization = () => {
  const { toast } = useToast();
  const { customizations, refetch } = useCustomizations('home');
  const { customizations: loginCustomizations, saveCustomization: saveLoginCustomization, saving: loginSaving } = useAdminLoginCustomizations();
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const getCustomization = (key: string, defaultValue: string = '') => {
    return customizations[key] || defaultValue;
  };

  const saveCustomization = async (key: string, value: string, section: string, elementType: string) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    
    try {
      const { error } = await supabase
        .from('customizations')
        .upsert({
          page: 'home',
          section: section,
          element_type: elementType,
          element_key: key,
          element_value: value,
          active: true
        }, {
          onConflict: 'page,section,element_key'
        });

      if (error) throw error;
      
      await refetch();
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return { success: false, error: 'Erro ao salvar personalização' };
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  // Configurações de personalização organizadas por página e seção
  const customizationConfigs: CustomizationConfig[] = [
    // HOME - HERO SECTION (for single image mode)
    {
      key: 'title',
      label: 'Título Principal',
      type: 'text',
      section: 'hero',
      page: 'home',
      placeholder: 'Ex: The Last of Us',
      description: 'Título principal do banner hero (modo imagem única)',
      defaultValue: 'The Last of Us'
    },
    {
      key: 'subtitle',
      label: 'Subtítulo',
      type: 'text',
      section: 'hero',
      page: 'home',
      placeholder: 'Ex: SÉRIE ORIGINAL HBO',
      description: 'Subtítulo ou categoria do conteúdo em destaque',
      defaultValue: 'SÉRIE ORIGINAL HBO'
    },
    {
      key: 'description',
      label: 'Descrição',
      type: 'textarea',
      section: 'hero',
      page: 'home',
      placeholder: 'Descrição detalhada do conteúdo...',
      description: 'Descrição completa do conteúdo em destaque',
      defaultValue: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.'
    },
    {
      key: 'button_text',
      label: 'Texto do Botão',
      type: 'text',
      section: 'hero',
      page: 'home',
      placeholder: 'Ex: Assistir',
      description: 'Texto do botão principal do hero',
      defaultValue: 'Assistir'
    },
    {
      key: 'background_image',
      label: 'Imagem de Fundo',
      type: 'image',
      section: 'hero',
      page: 'home',
      description: 'Imagem de fundo do banner principal (modo imagem única)',
      defaultValue: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop'
    },
    {
      key: 'title_color',
      label: 'Cor do Título',
      type: 'color',
      section: 'hero',
      page: 'home',
      description: 'Cor do texto do título principal',
      defaultValue: '#ffffff'
    },
    {
      key: 'button_background_color',
      label: 'Cor de Fundo do Botão',
      type: 'color',
      section: 'hero',
      page: 'home',
      description: 'Cor de fundo do botão principal',
      defaultValue: '#ffffff'
    },
    {
      key: 'button_text_color',
      label: 'Cor do Texto do Botão',
      type: 'color',
      section: 'hero',
      page: 'home',
      description: 'Cor do texto do botão principal',
      defaultValue: '#000000'
    },

    // HOME - HEADER
    {
      key: 'logo_image',
      label: 'Logo do Site',
      type: 'image',
      section: 'header',
      page: 'home',
      description: 'Logo principal do site no cabeçalho',
      defaultValue: ''
    },
    {
      key: 'menu_home',
      label: 'Título Menu - Início',
      type: 'text',
      section: 'header',
      page: 'home',
      placeholder: 'Início',
      description: 'Texto do link do menu Início',
      defaultValue: 'Início'
    },
    {
      key: 'menu_content',
      label: 'Título Menu - Conteúdo',
      type: 'text',
      section: 'header',
      page: 'home',
      placeholder: 'Conteúdo',
      description: 'Texto do link do menu Conteúdo',
      defaultValue: 'Conteúdo'
    },
    {
      key: 'menu_plans',
      label: 'Título Menu - Planos',
      type: 'text',
      section: 'header',
      page: 'home',
      placeholder: 'Planos',
      description: 'Texto do link do menu Planos',
      defaultValue: 'Planos'
    },
    {
      key: 'menu_login',
      label: 'Título Menu - Login',
      type: 'text',
      section: 'header',
      page: 'home',
      placeholder: 'Entrar',
      description: 'Texto do botão de login',
      defaultValue: 'Entrar'
    },
    {
      key: 'background_color',
      label: 'Cor de Fundo do Header',
      type: 'color',
      section: 'header',
      page: 'home',
      description: 'Cor de fundo do cabeçalho',
      defaultValue: 'transparent'
    },
    {
      key: 'text_color',
      label: 'Cor do Texto do Menu',
      type: 'color',
      section: 'header',
      page: 'home',
      description: 'Cor dos links do menu de navegação',
      defaultValue: '#ffffff'
    },
    {
      key: 'hover_color',
      label: 'Cor do Hover do Menu',
      type: 'color',
      section: 'header',
      page: 'home',
      description: 'Cor dos links do menu ao passar o mouse',
      defaultValue: '#ef4444'
    },

    // HOME - FOOTER
    {
      key: 'footer_logo_image',
      label: 'Logo do Rodapé',
      type: 'image',
      section: 'footer',
      page: 'home',
      description: 'Logo exibida no rodapé',
      defaultValue: ''
    },
    {
      key: 'footer_copyright',
      label: 'Texto de Copyright',
      type: 'text',
      section: 'footer',
      page: 'home',
      placeholder: '© 2024 Todos os direitos reservados',
      description: 'Texto de direitos autorais no rodapé',
      defaultValue: '© 2024 Todos os direitos reservados'
    },
    {
      key: 'footer_background_color',
      label: 'Cor de Fundo do Rodapé',
      type: 'color',
      section: 'footer',
      page: 'home',
      description: 'Cor de fundo do rodapé',
      defaultValue: '#1f2937'
    },
    {
      key: 'footer_text_color',
      label: 'Cor do Texto do Rodapé',
      type: 'color',
      section: 'footer',
      page: 'home',
      description: 'Cor do texto no rodapé',
      defaultValue: '#ffffff'
    },

    // HOME - PLANS SECTION
    {
      key: 'plans_title',
      label: 'Título da Seção de Planos',
      type: 'text',
      section: 'plans',
      page: 'home',
      placeholder: 'Escolha seu plano',
      description: 'Título principal da seção de planos',
      defaultValue: 'Escolha seu plano'
    },
    {
      key: 'plans_subtitle',
      label: 'Subtítulo dos Planos',
      type: 'text',
      section: 'plans',
      page: 'home',
      placeholder: 'Planos flexíveis para todos os perfis',
      description: 'Subtítulo da seção de planos',
      defaultValue: 'Planos flexíveis para todos os perfis'
    },
    {
      key: 'plans_background_color',
      label: 'Cor de Fundo da Seção',
      type: 'color',
      section: 'plans',
      page: 'home',
      description: 'Cor de fundo da seção de planos',
      defaultValue: '#0f172a'
    },

    // GLOBAL SETTINGS
    {
      key: 'site_name',
      label: 'Nome do Site',
      type: 'text',
      section: 'global',
      page: 'home',
      placeholder: 'Meu Streaming',
      description: 'Nome principal do site',
      defaultValue: 'Globoplay'
    },
    {
      key: 'site_background_color',
      label: 'Cor de Fundo Global',
      type: 'color',
      section: 'global',
      page: 'home',
      description: 'Cor de fundo principal do site',
      defaultValue: '#0f172a'
    },
    {
      key: 'primary_color',
      label: 'Cor Primária',
      type: 'color',
      section: 'global',
      page: 'home',
      description: 'Cor principal do tema',
      defaultValue: '#ef4444'
    },
    {
      key: 'secondary_color',
      label: 'Cor Secundária',
      type: 'color',
      section: 'global',
      page: 'home',
      description: 'Cor secundária do tema',
      defaultValue: '#1f2937'
    },

    // LOGIN PAGE
    {
      key: 'title',
      label: 'Título da Página',
      type: 'text',
      section: 'form',
      page: 'login',
      placeholder: 'Faça seu login',
      description: 'Título principal da página de login',
      defaultValue: 'Faça seu login'
    },
    {
      key: 'subtitle',
      label: 'Subtítulo',
      type: 'text',
      section: 'form',
      page: 'login',
      placeholder: 'Acesse sua conta para continuar',
      description: 'Subtítulo da página de login',
      defaultValue: 'Acesse sua conta para continuar'
    },
    {
      key: 'image',
      label: 'Imagem de Fundo',
      type: 'image',
      section: 'background',
      page: 'login',
      description: 'Imagem de fundo da página de login',
      defaultValue: ''
    },
    {
      key: 'color',
      label: 'Cor de Fundo',
      type: 'color',
      section: 'background',
      page: 'login',
      description: 'Cor de fundo da página de login',
      defaultValue: '#0f172a'
    },
    {
      key: 'background',
      label: 'Cor de Fundo do Card',
      type: 'color',
      section: 'card',
      page: 'login',
      description: 'Cor de fundo do card de login',
      defaultValue: '#1f2937'
    }
  ];

  const getCurrentValue = (config: CustomizationConfig) => {
    const key = `${config.section}_${config.key}`;
    
    if (config.page === 'login') {
      return localChanges[key] ?? (loginCustomizations[key] || config.defaultValue);
    }
    
    return localChanges[key] ?? getCustomization(key, config.defaultValue);
  };

  const handleChange = (config: CustomizationConfig, value: string) => {
    const key = `${config.section}_${config.key}`;
    setLocalChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (config: CustomizationConfig) => {
    const key = `${config.section}_${config.key}`;
    const value = getCurrentValue(config);

    let result;
    if (config.page === 'login') {
      result = await saveLoginCustomization(key, value, config.section, config.type);
    } else {
      result = await saveCustomization(key, value, config.section, config.type);
    }
    
    if (result.success) {
      // Remove from local changes since it's now saved
      setLocalChanges(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      
      toast({
        title: "Sucesso",
        description: `${config.label} atualizado com sucesso`
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível salvar a personalização",
        variant: "destructive"
      });
    }
  };

  const renderSection = (page: string, section: string, title: string, description?: string) => {
    const sectionConfigs = customizationConfigs.filter(
      config => config.page === page && config.section === section
    );

    if (sectionConfigs.length === 0) return null;

    return (
      <Card className="bg-admin-card border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-foreground">{title}</CardTitle>
          {description && (
            <p className="text-sm text-admin-muted-foreground">{description}</p>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionConfigs.map((config) => (
            <CustomizationEditor
              key={`${config.section}_${config.key}`}
              id={`${config.section}_${config.key}`}
              label={config.label}
              value={getCurrentValue(config)}
              type={config.type}
              placeholder={config.placeholder}
              description={config.description}
              onChange={(value) => handleChange(config, value)}
              onSave={() => handleSave(config)}
              loading={config.page === 'login' ? (loginSaving[`${config.section}_${config.key}`] || false) : (saving[`${config.section}_${config.key}`] || false)}
            />
          ))}
        </CardContent>
      </Card>
    );
  };

  const isLoading = Object.keys(customizations).length === 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-admin-foreground">Carregando personalizações...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-foreground">Central de Personalização</h1>
          <p className="text-admin-muted-foreground text-sm">
            Personalize a aparência, conteúdo e configurações do seu site
          </p>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-admin-muted">
            <TabsTrigger 
              value="home" 
              className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground"
            >
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </TabsTrigger>
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground"
            >
              <Image className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger 
              value="login" 
              className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="global" 
              className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <HeroSliderEditor />
            {renderSection('home', 'hero', 'Banner Principal (Modo Simples)', 'Configure o banner com imagem única (desabilitado se usar slider)')}
            {renderSection('home', 'header', 'Cabeçalho', 'Configure o cabeçalho do site')}
            {renderSection('home', 'plans', 'Seção de Planos', 'Configure a seção de planos de assinatura')}
            {renderSection('home', 'footer', 'Rodapé', 'Configure o rodapé do site')}
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="bg-admin-card border-admin-border">
              <CardHeader>
                <CardTitle className="text-admin-foreground">Gerenciamento de Conteúdo</CardTitle>
                <p className="text-sm text-admin-muted-foreground">
                  Gerencie seções de conteúdo, carrosséis e itens individuais
                </p>
              </CardHeader>
              <CardContent>
                <ContentEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="login" className="space-y-6">
            {renderSection('login', 'form', 'Formulário de Login', 'Configure o título e subtítulo do formulário')}
            {renderSection('login', 'background', 'Fundo da Página', 'Configure a cor e imagem de fundo')}
            {renderSection('login', 'card', 'Card de Login', 'Configure a aparência do card de login')}
          </TabsContent>

          <TabsContent value="global" className="space-y-6">
            {renderSection('home', 'global', 'Configurações Globais', 'Configure cores e configurações globais do site')}
          </TabsContent>
        </Tabs>

        {/* Preview Button */}
        <div className="mt-8 p-4 bg-admin-muted rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-admin-foreground font-medium flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Preview das Mudanças
              </h3>
              <p className="text-admin-muted-foreground text-sm">
                Visualize o site com as personalizações aplicadas
              </p>
            </div>
            <Button
              onClick={() => window.open('/', '_blank')}
              variant="outline"
              className="border-admin-border text-admin-foreground hover:bg-admin-primary hover:text-admin-primary-foreground"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Site
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomization;