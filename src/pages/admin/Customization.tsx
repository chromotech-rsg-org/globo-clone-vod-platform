import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import ImageUpload from '@/components/ui/image-upload';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Palette, 
  Globe, 
  Image, 
  Monitor,
  Settings,
  Play
} from 'lucide-react';

const Customization = () => {
  const { toast } = useToast();
  const { getCustomization, refetch } = useAdminCustomizations();
  
  // Função para atualizar customização
  const updateCustomization = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('customizations')
        .upsert({
          page: 'home',
          section: 'global',
          element_type: 'text',
          element_key: key,
          element_value: value,
          active: true
        }, {
          onConflict: 'page,section,element_key'
        });

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error('Erro ao salvar customização:', error);
      throw error;
    }
  };

  // Estados para as diferentes abas
  const [globalSettings, setGlobalSettings] = useState({
    site_name: '',
    site_description: '',
    site_keywords: '',
    admin_logo_image: ''
  });

  const [colorSettings, setColorSettings] = useState({
    primary_color: '',
    secondary_color: '',
    accent_color: '',
    background_color: '',
    text_color: ''
  });

  const [bannerSettings, setBannerSettings] = useState({
    hero_banner_title: '',
    hero_banner_subtitle: '',
    hero_banner_image: '',
    hero_banner_cta_text: '',
    hero_banner_cta_url: ''
  });

  const [streamingSettings, setStreamingSettings] = useState({
    streaming_login: '',
    streaming_secret: '',
    streaming_api_url: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Carregar configurações globais
      setGlobalSettings({
        site_name: getCustomization('global_site_name', ''),
        site_description: getCustomization('global_site_description', ''),
        site_keywords: getCustomization('global_site_keywords', ''),
        admin_logo_image: getCustomization('admin_logo_image', '')
      });

      // Carregar configurações de cores
      setColorSettings({
        primary_color: getCustomization('theme_primary_color', ''),
        secondary_color: getCustomization('theme_secondary_color', ''),
        accent_color: getCustomization('theme_accent_color', ''),
        background_color: getCustomization('theme_background_color', ''),
        text_color: getCustomization('theme_text_color', '')
      });

      // Carregar configurações de banner
      setBannerSettings({
        hero_banner_title: getCustomization('hero_banner_title', ''),
        hero_banner_subtitle: getCustomization('hero_banner_subtitle', ''),
        hero_banner_image: getCustomization('hero_banner_image', ''),
        hero_banner_cta_text: getCustomization('hero_banner_cta_text', ''),
        hero_banner_cta_url: getCustomization('hero_banner_cta_url', '')
      });

      // Carregar configurações de streaming
      setStreamingSettings({
        streaming_login: getCustomization('streaming_login', 'agroplay.api'),
        streaming_secret: getCustomization('streaming_secret', 'ldkjgeo29vkg99133xswrt48rq3sqyf6q4r58f8h'),
        streaming_api_url: getCustomization('streaming_api_url', '')
      });

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar as configurações",
        variant: "destructive"
      });
    }
  };

  const handleSaveGlobal = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateCustomization('global_site_name', globalSettings.site_name),
        updateCustomization('global_site_description', globalSettings.site_description),
        updateCustomization('global_site_keywords', globalSettings.site_keywords),
        updateCustomization('admin_logo_image', globalSettings.admin_logo_image)
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações globais salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações globais:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações globais",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveColors = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateCustomization('theme_primary_color', colorSettings.primary_color),
        updateCustomization('theme_secondary_color', colorSettings.secondary_color),
        updateCustomization('theme_accent_color', colorSettings.accent_color),
        updateCustomization('theme_background_color', colorSettings.background_color),
        updateCustomization('theme_text_color', colorSettings.text_color)
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações de cores salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de cores:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações de cores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBanner = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateCustomization('hero_banner_title', bannerSettings.hero_banner_title),
        updateCustomization('hero_banner_subtitle', bannerSettings.hero_banner_subtitle),
        updateCustomization('hero_banner_image', bannerSettings.hero_banner_image),
        updateCustomization('hero_banner_cta_text', bannerSettings.hero_banner_cta_text),
        updateCustomization('hero_banner_cta_url', bannerSettings.hero_banner_cta_url)
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações de banner salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de banner:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações de banner",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveStreaming = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        updateCustomization('streaming_login', streamingSettings.streaming_login),
        updateCustomization('streaming_secret', streamingSettings.streaming_secret),
        updateCustomization('streaming_api_url', streamingSettings.streaming_api_url)
      ]);

      toast({
        title: "Sucesso",
        description: "Configurações de streaming salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de streaming:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar as configurações de streaming",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-admin-foreground">Personalização</h1>
          <p className="text-admin-muted-foreground">
            Configure as personalizações do sistema
          </p>
        </div>
        <Badge variant="outline" className="border-admin-border text-admin-foreground">
          <Settings className="h-4 w-4 mr-2" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-admin-muted">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global
          </TabsTrigger>
          <TabsTrigger value="colors" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Cores
          </TabsTrigger>
          <TabsTrigger value="banner" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Banner
          </TabsTrigger>
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Play className="h-4 w-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        {/* Aba Global */}
        <TabsContent value="global" className="space-y-6">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Globais
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Configure as informações gerais do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-admin-foreground">Nome do Site</Label>
                <Input
                  id="site_name"
                  value={globalSettings.site_name}
                  onChange={(e) => setGlobalSettings({...globalSettings, site_name: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="Nome do seu site"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description" className="text-admin-foreground">Descrição do Site</Label>
                <Textarea
                  id="site_description"
                  value={globalSettings.site_description}
                  onChange={(e) => setGlobalSettings({...globalSettings, site_description: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="Descrição do seu site"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_keywords" className="text-admin-foreground">Palavras-chave (SEO)</Label>
                <Input
                  id="site_keywords"
                  value={globalSettings.site_keywords}
                  onChange={(e) => setGlobalSettings({...globalSettings, site_keywords: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-admin-foreground">Logo do Painel Admin</Label>
                <ImageUpload
                  value={globalSettings.admin_logo_image}
                  onChange={(url) => setGlobalSettings({...globalSettings, admin_logo_image: url})}
                  className="bg-admin-input border-admin-border"
                />
              </div>

              <Separator className="bg-admin-border" />

              <Button 
                onClick={handleSaveGlobal} 
                disabled={isLoading}
                className="bg-admin-primary hover:bg-admin-primary/90 text-admin-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações Globais'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Streaming */}
        <TabsContent value="streaming" className="space-y-6">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground flex items-center gap-2">
                <Play className="h-5 w-5" />
                Configurações de Streaming
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Configure as variáveis de API para streaming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="streaming_login" className="text-admin-foreground">Login da API</Label>
                <Input
                  id="streaming_login"
                  value={streamingSettings.streaming_login}
                  onChange={(e) => setStreamingSettings({...streamingSettings, streaming_login: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="agroplay.api"
                />
                <p className="text-sm text-admin-muted-foreground">
                  Identificador de login para a API de streaming
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streaming_secret" className="text-admin-foreground">Chave Secreta</Label>
                <Input
                  id="streaming_secret"
                  type="password"
                  value={streamingSettings.streaming_secret}
                  onChange={(e) => setStreamingSettings({...streamingSettings, streaming_secret: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="ldkjgeo29vkg99133xswrt48rq3sqyf6q4r58f8h"
                />
                <p className="text-sm text-admin-muted-foreground">
                  Chave secreta para autenticação na API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streaming_api_url" className="text-admin-foreground">URL da API</Label>
                <Input
                  id="streaming_api_url"
                  type="url"
                  value={streamingSettings.streaming_api_url}
                  onChange={(e) => setStreamingSettings({...streamingSettings, streaming_api_url: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="https://api.streaming.com"
                />
                <p className="text-sm text-admin-muted-foreground">
                  URL base da API de streaming
                </p>
              </div>

              <div className="bg-admin-muted/50 p-4 rounded-lg border border-admin-border">
                <h4 className="font-medium text-admin-foreground mb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações Atuais
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-admin-muted-foreground">Login:</span>
                    <span className="text-admin-foreground font-mono">{streamingSettings.streaming_login || 'Não configurado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-muted-foreground">Secret:</span>
                    <span className="text-admin-foreground font-mono">
                      {streamingSettings.streaming_secret ? '••••••••••••••••' : 'Não configurado'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-admin-muted-foreground">URL:</span>
                    <span className="text-admin-foreground font-mono">{streamingSettings.streaming_api_url || 'Não configurado'}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-admin-border" />

              <Button 
                onClick={handleSaveStreaming} 
                disabled={isLoading}
                className="bg-admin-primary hover:bg-admin-primary/90 text-admin-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações de Streaming'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Cores */}
        <TabsContent value="colors" className="space-y-6">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Configurações de Cores
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Personalize as cores do tema do painel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color" className="text-admin-foreground">Cor Primária</Label>
                  <Input
                    type="color"
                    id="primary_color"
                    value={colorSettings.primary_color}
                    onChange={(e) => setColorSettings({...colorSettings, primary_color: e.target.value})}
                    className="h-10 bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color" className="text-admin-foreground">Cor Secundária</Label>
                  <Input
                    type="color"
                    id="secondary_color"
                    value={colorSettings.secondary_color}
                    onChange={(e) => setColorSettings({...colorSettings, secondary_color: e.target.value})}
                    className="h-10 bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent_color" className="text-admin-foreground">Cor de Destaque</Label>
                  <Input
                    type="color"
                    id="accent_color"
                    value={colorSettings.accent_color}
                    onChange={(e) => setColorSettings({...colorSettings, accent_color: e.target.value})}
                    className="h-10 bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_color" className="text-admin-foreground">Cor de Fundo</Label>
                  <Input
                    type="color"
                    id="background_color"
                    value={colorSettings.background_color}
                    onChange={(e) => setColorSettings({...colorSettings, background_color: e.target.value})}
                    className="h-10 bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text_color" className="text-admin-foreground">Cor do Texto</Label>
                  <Input
                    type="color"
                    id="text_color"
                    value={colorSettings.text_color}
                    onChange={(e) => setColorSettings({...colorSettings, text_color: e.target.value})}
                    className="h-10 bg-admin-input border-admin-border text-admin-foreground"
                  />
                </div>
              </div>

              <Separator className="bg-admin-border" />

              <Button 
                onClick={handleSaveColors} 
                disabled={isLoading}
                className="bg-admin-primary hover:bg-admin-primary/90 text-admin-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações de Cores'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Banner */}
        <TabsContent value="banner" className="space-y-6">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground flex items-center gap-2">
                <Image className="h-5 w-5" />
                Configurações do Banner
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Personalize o banner principal do site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_banner_title" className="text-admin-foreground">Título do Banner</Label>
                <Input
                  id="hero_banner_title"
                  value={bannerSettings.hero_banner_title}
                  onChange={(e) => setBannerSettings({...bannerSettings, hero_banner_title: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="Título chamativo para o banner"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_banner_subtitle" className="text-admin-foreground">Subtítulo do Banner</Label>
                <Textarea
                  id="hero_banner_subtitle"
                  value={bannerSettings.hero_banner_subtitle}
                  onChange={(e) => setBannerSettings({...bannerSettings, hero_banner_subtitle: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="Subtítulo descritivo do banner"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-admin-foreground">Imagem do Banner</Label>
                <ImageUpload
                  value={bannerSettings.hero_banner_image}
                  onChange={(url) => setBannerSettings({...bannerSettings, hero_banner_image: url})}
                  className="bg-admin-input border-admin-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_banner_cta_text" className="text-admin-foreground">Texto do Botão CTA</Label>
                <Input
                  id="hero_banner_cta_text"
                  value={bannerSettings.hero_banner_cta_text}
                  onChange={(e) => setBannerSettings({...bannerSettings, hero_banner_cta_text: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="Saiba Mais"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_banner_cta_url" className="text-admin-foreground">URL do Botão CTA</Label>
                <Input
                  id="hero_banner_cta_url"
                  type="url"
                  value={bannerSettings.hero_banner_cta_url}
                  onChange={(e) => setBannerSettings({...bannerSettings, hero_banner_cta_url: e.target.value})}
                  className="bg-admin-input border-admin-border text-admin-foreground"
                  placeholder="https://seusite.com/pagina-desejada"
                />
              </div>

              <Separator className="bg-admin-border" />

              <Button 
                onClick={handleSaveBanner} 
                disabled={isLoading}
                className="bg-admin-primary hover:bg-admin-primary/90 text-admin-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando...' : 'Salvar Configurações do Banner'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Avançado */}
        <TabsContent value="advanced" className="space-y-6">
          <Card className="bg-admin-card border-admin-border">
            <CardHeader>
              <CardTitle className="text-admin-foreground flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription className="text-admin-muted-foreground">
                Opções de configuração avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-admin-foreground">
                Em breve, configurações avançadas estarão disponíveis aqui.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Customization;
