import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, LogIn, Settings, Image, Palette, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  const {
    toast
  } = useToast();
  const {
    customizations,
    refetch
  } = useCustomizations('home');
  const {
    customizations: loginCustomizations,
    saveCustomization: saveLoginCustomization,
    saving: loginSaving
  } = useAdminLoginCustomizations();
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const getCustomization = (key: string, defaultValue: string = '') => {
    return customizations[key] || defaultValue;
  };
  const saveCustomization = async (key: string, value: string, section: string, elementType: string) => {
    setSaving(prev => ({
      ...prev,
      [key]: true
    }));
    try {
      const {
        error
      } = await supabase.from('customizations').upsert({
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
      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao salvar:', error);
      return {
        success: false,
        error: 'Erro ao salvar personalização'
      };
    } finally {
      setSaving(prev => ({
        ...prev,
        [key]: false
      }));
    }
  };

  // Configurações de personalização organizadas por página e seção
  const customizationConfigs: CustomizationConfig[] = [
  // HOME - HEADER
  {
    key: 'header_logo_image',
    label: 'Logo do Site',
    type: 'image',
    section: 'header',
    page: 'home',
    description: 'Logo principal do site no cabeçalho',
    defaultValue: ''
  }, {
    key: 'header_menu_home',
    label: 'Título Menu - Início',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'Início',
    description: 'Texto do link do menu Início',
    defaultValue: 'Início'
  }, {
    key: 'header_menu_content',
    label: 'Título Menu - Conteúdo',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'Conteúdo',
    description: 'Texto do link do menu Conteúdo',
    defaultValue: 'Conteúdo'
  }, {
    key: 'header_menu_plans',
    label: 'Título Menu - Planos',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'Planos',
    description: 'Texto do link do menu Planos',
    defaultValue: 'Planos'
  }, {
    key: 'header_menu_login',
    label: 'Título Menu - Login',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'Entrar',
    description: 'Texto do botão de login',
    defaultValue: 'Entrar'
  }, {
    key: 'header_background_color',
    label: 'Cor de Fundo do Header',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor de fundo do cabeçalho',
    defaultValue: 'transparent'
  }, {
    key: 'header_text_color',
    label: 'Cor do Texto do Menu',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor dos links do menu de navegação',
    defaultValue: '#ffffff'
  }, {
    key: 'header_hover_color',
    label: 'Cor do Hover do Menu',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor dos links do menu ao passar o mouse',
    defaultValue: '#ef4444'
  }, {
    key: 'custom_button_text',
    label: 'Texto do Botão Customizado',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'Meu Botão',
    description: 'Texto exibido no botão customizado',
    defaultValue: ''
  }, {
    key: 'custom_button_bg_color',
    label: 'Cor de Fundo do Botão Customizado',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor de fundo do botão customizado',
    defaultValue: '#3b82f6'
  }, {
    key: 'custom_button_text_color',
    label: 'Cor do Texto do Botão Customizado',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor do texto do botão customizado',
    defaultValue: '#ffffff'
  }, {
    key: 'custom_button_icon',
    label: 'Ícone do Botão Customizado',
    type: 'image',
    section: 'header',
    page: 'home',
    description: 'Ícone exibido no botão customizado',
    defaultValue: ''
  }, {
    key: 'custom_button_link',
    label: 'Link do Botão Customizado',
    type: 'text',
    section: 'header',
    page: 'home',
    placeholder: 'https://example.com',
    description: 'URL para onde o botão customizado irá redirecionar',
    defaultValue: ''
  }, {
    key: 'content_background_color',
    label: 'Cor de Fundo do Conteúdo',
    type: 'color',
    section: 'header',
    page: 'home',
    description: 'Cor de fundo da área de conteúdo',
    defaultValue: 'transparent'
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
  }, {
    key: 'footer_copyright',
    label: 'Texto de Copyright',
    type: 'text',
    section: 'footer',
    page: 'home',
    placeholder: '© 2024 Todos os direitos reservados',
    description: 'Texto de direitos autorais no rodapé',
    defaultValue: '© 2024 Todos os direitos reservados'
  }, {
    key: 'footer_background_color',
    label: 'Cor de Fundo do Rodapé',
    type: 'color',
    section: 'footer',
    page: 'home',
    description: 'Cor de fundo do rodapé',
    defaultValue: '#1f2937'
  }, {
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
  }, {
    key: 'plans_subtitle',
    label: 'Subtítulo dos Planos',
    type: 'text',
    section: 'plans',
    page: 'home',
    placeholder: 'Planos flexíveis para todos os perfis',
    description: 'Subtítulo da seção de planos',
    defaultValue: 'Planos flexíveis para todos os perfis'
  }, {
    key: 'plans_background_color',
    label: 'Cor de Fundo da Seção',
    type: 'color',
    section: 'plans',
    page: 'home',
    description: 'Cor de fundo da seção de planos',
    defaultValue: '#0f172a'
  }, {
    key: 'plans_border_color',
    label: 'Cor da Borda do Plano Popular',
    type: 'color',
    section: 'plans',
    page: 'home',
    description: 'Cor da borda do plano em destaque',
    defaultValue: '#3b82f6'
  }, {
    key: 'plans_badge_background',
    label: 'Cor de Fundo do Badge Popular',
    type: 'color',
    section: 'plans',
    page: 'home',
    description: 'Cor de fundo do badge "Mais Popular"',
    defaultValue: '#3b82f6'
  }, {
    key: 'plans_badge_text_color',
    label: 'Cor do Texto do Badge',
    type: 'color',
    section: 'plans',
    page: 'home',
    description: 'Cor do texto do badge popular',
    defaultValue: '#ffffff'
  }, {
    key: 'plans_badge_text',
    label: 'Texto do Badge Popular',
    type: 'text',
    section: 'plans',
    page: 'home',
    placeholder: 'Mais Popular',
    description: 'Texto exibido no badge de plano popular',
    defaultValue: 'Mais Popular'
  }, {
    key: 'plans_card_background_color',
    label: 'Cor de Fundo dos Cards dos Planos',
    type: 'color',
    section: 'plans',
    page: 'home',
    description: 'Cor de fundo dos cards de planos',
    defaultValue: '#111827'
  },
  // GLOBAL SETTINGS
  {
    key: 'global_site_name',
    label: 'Nome do Site',
    type: 'text',
    section: 'global',
    page: 'home',
    placeholder: 'Meu Streaming',
    description: 'Nome principal do site',
    defaultValue: 'Globoplay'
  }, {
    key: 'global_site_background_color',
    label: 'Cor de Fundo Global',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor de fundo principal do site',
    defaultValue: '#0f172a'
  }, {
    key: 'global_primary_color',
    label: 'Cor Primária',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor principal do tema',
    defaultValue: '#ef4444'
  }, {
    key: 'global_secondary_color',
    label: 'Cor Secundária',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor secundária do tema',
    defaultValue: '#1f2937'
  }, {
    key: 'admin_logo_image',
    label: 'Logo do Painel Administrativo',
    type: 'image',
    section: 'global',
    page: 'home',
    description: 'Logo exibido no painel administrativo',
    defaultValue: ''
  }, {
    key: 'favicon_image',
    label: 'Favicon do Site',
    type: 'image',
    section: 'global',
    page: 'home',
    description: 'Ícone exibido na aba do navegador',
    defaultValue: ''
  }, {
    key: 'admin_content_bg_color',
    label: 'Cor de Fundo do Sistema Administrativo',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor de fundo do painel administrativo',
    defaultValue: '#111827'
  }, {
    key: 'admin_sidebar_bg_color',
    label: 'Cor de Fundo do Menu Lateral',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor de fundo da barra lateral do admin',
    defaultValue: '#374151'
  }, {
    key: 'admin_sidebar_text_color',
    label: 'Cor do Texto do Menu Lateral',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor do texto na barra lateral',
    defaultValue: '#ffffff'
  }, {
    key: 'admin_primary_color',
    label: 'Cor Primária do Sistema',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor principal dos botões e elementos',
    defaultValue: '#3b82f6'
  }, {
    key: 'admin_table_bg_color',
    label: 'Cor de Fundo das Tabelas',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor de fundo das tabelas no admin',
    defaultValue: '#374151'
  }, {
    key: 'admin_card_bg_color',
    label: 'Cor de Fundo dos Cards',
    type: 'color',
    section: 'global',
    page: 'home',
    description: 'Cor de fundo dos cards no admin',
    defaultValue: '#374151'
  },
  // LOGIN PAGE
  {
    key: 'title',
    label: 'Título Principal',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Acessar Agro Play',
    description: 'Título principal da página de login',
    defaultValue: 'Acessar Agro Play'
  }, {
    key: 'subtitle',
    label: 'Subtítulo',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Gerenciar Conta',
    description: 'Subtítulo da página de login',
    defaultValue: 'Gerenciar Conta'
  }, {
    key: 'main_logo_image',
    label: 'Logo Principal',
    type: 'image',
    section: 'branding',
    page: 'login',
    description: 'Upload do logo principal',
    defaultValue: ''
  }, {
    key: 'bottom_logo_image',
    label: 'Logo Inferior',
    type: 'image',
    section: 'branding',
    page: 'login',
    description: 'Upload do logo inferior',
    defaultValue: ''
  }, {
    key: 'logo_link',
    label: 'Link dos Logos',
    type: 'text',
    section: 'branding',
    page: 'login',
    placeholder: 'https://example.com',
    description: 'Link que será aplicado aos logos (abre em nova aba)',
    defaultValue: ''
  }, {
    key: 'email_placeholder',
    label: 'Placeholder Email',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Usuário',
    description: 'Texto placeholder do campo email',
    defaultValue: 'Usuário'
  }, {
    key: 'password_placeholder',
    label: 'Placeholder Senha',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Senha',
    description: 'Texto placeholder do campo senha',
    defaultValue: 'Senha'
  }, {
    key: 'login_button_text',
    label: 'Texto Botão Login',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Entrar',
    description: 'Texto do botão de login',
    defaultValue: 'Entrar'
  }, {
    key: 'forgot_password_text',
    label: 'Texto Esqueci Senha',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Esqueci minha senha',
    description: 'Texto do link esqueci minha senha',
    defaultValue: 'Esqueci minha senha'
  }, {
    key: 'register_text',
    label: 'Texto Cadastro',
    type: 'text',
    section: 'form',
    page: 'login',
    placeholder: 'Não tem uma conta? Cadastre-se',
    description: 'Texto do link de cadastro',
    defaultValue: 'Não tem uma conta? Cadastre-se'
  }, {
    key: 'background_image',
    label: 'Imagem de Fundo',
    type: 'image',
    section: 'background',
    page: 'login',
    description: 'Imagem de fundo da página de login',
    defaultValue: '/lovable-uploads/3c31e6f6-37f9-475f-b8fe-d62743f4c2e8.png'
  }, {
    key: 'background_color',
    label: 'Cor de Fundo',
    type: 'color',
    section: 'background',
    page: 'login',
    description: 'Cor de fundo da página de login',
    defaultValue: '#ffffff'
  }, {
    key: 'logo_background_color',
    label: 'Cor Fundo Logo Principal',
    type: 'color',
    section: 'branding',
    page: 'login',
    description: 'Cor de fundo do logo principal',
    defaultValue: '#4ade80'
  }, {
    key: 'logo_text_color',
    label: 'Cor Texto Logo Principal',
    type: 'color',
    section: 'branding',
    page: 'login',
    description: 'Cor do texto do logo principal',
    defaultValue: '#ffffff'
  }, {
    key: 'primary_color',
    label: 'Cor Primária',
    type: 'color',
    section: 'theme',
    page: 'login',
    description: 'Cor primária dos elementos (botões, links)',
    defaultValue: '#16a34a'
  }, {
    key: 'button_hover_color',
    label: 'Cor Hover Botão',
    type: 'color',
    section: 'theme',
    page: 'login',
    description: 'Cor do botão ao passar o mouse',
    defaultValue: '#15803d'
  }, {
    key: 'text_color',
    label: 'Cor do Texto',
    type: 'color',
    section: 'theme',
    page: 'login',
    description: 'Cor principal do texto',
    defaultValue: '#374151'
  }, {
    key: 'input_background_color',
    label: 'Cor Fundo Input',
    type: 'color',
    section: 'form',
    page: 'login',
    description: 'Cor de fundo dos campos de entrada',
    defaultValue: '#f9fafb'
  }];
  const getCurrentValue = (config: CustomizationConfig) => {
    const key = `${config.section}_${config.key}`;
    if (config.page === 'login') {
      return localChanges[config.key] ?? (loginCustomizations[config.key] || config.defaultValue);
    }
    return localChanges[config.key] ?? getCustomization(key, config.defaultValue);
  };
  const handleChange = (config: CustomizationConfig, value: string) => {
    const key = config.key;
    setLocalChanges(prev => ({
      ...prev,
      [key]: value
    }));
  };
  const handleSave = async (config: CustomizationConfig) => {
    const key = config.key;
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
        const newState = {
          ...prev
        };
        delete newState[key];
        return newState;
      });
      toast({
        title: "Sucesso",
        description: `${config.label} atualizado com sucesso`
      });
      return {
        success: true
      };
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível salvar a personalização",
        variant: "destructive"
      });
      return {
        success: false,
        error: result.error
      };
    }
  };
  const renderSection = (page: string, section: string, title: string, description?: string) => {
    const sectionConfigs = customizationConfigs.filter(config => config.page === page && config.section === section);
    if (sectionConfigs.length === 0) return null;
    return <Card className="bg-admin-card border-admin-border">
        <CardHeader>
          <CardTitle className="text-admin-foreground">{title}</CardTitle>
          {description && <p className="text-sm text-admin-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sectionConfigs.map(config => <CustomizationEditor key={config.key} id={config.key} label={config.label} value={getCurrentValue(config)} type={config.type} placeholder={config.placeholder} description={config.description} onChange={value => handleChange(config, value)} onSave={() => handleSave(config)} loading={config.page === 'login' ? loginSaving[config.key] || false : saving[config.key] || false} />)}
        </CardContent>
      </Card>;
  };
  const isLoading = Object.keys(customizations).length === 0;
  if (isLoading) {
    return <div className="p-6">
          <div className="text-admin-foreground text-slate-50">Carregando personalizações...</div>
        </div>;
  }
  return <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-foreground text-slate-50">Central de Personalização</h1>
          <p className="text-admin-muted-foreground text-sm">
            Personalize a aparência, conteúdo e configurações do seu site
          </p>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-admin-muted">
            <TabsTrigger value="home" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground text-slate-50">
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Image className="h-4 w-4 mr-2" />
              Conteúdo
            </TabsTrigger>
            <TabsTrigger value="login" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </TabsTrigger>
            <TabsTrigger value="global" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <HeroSliderEditor />
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
            {renderSection('login', 'form', 'Formulário de Login', 'Configure textos e placeholders do formulário')}
            {renderSection('login', 'branding', 'Logo e Marca', 'Configure os textos dos logos')}
            {renderSection('login', 'background', 'Fundo da Página', 'Configure a cor e imagem de fundo')}
            {renderSection('login', 'theme', 'Cores do Tema', 'Configure as cores dos elementos')}
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
            <Button onClick={() => window.open('/', '_blank')} variant="outline" className="border-admin-border text-admin-foreground hover:bg-admin-primary hover:text-admin-primary-foreground">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar Site
            </Button>
          </div>
        </div>
      </div>
    </>;
};
export default AdminCustomization;