
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Edit, Save, X, Upload, Eye, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import ImageUpload from '@/components/ui/image-upload';

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
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const { toast } = useToast();

  const defaultCustomizations = {
    // Hero Section
    'hero_title': 'The Last of Us',
    'hero_subtitle': 'SÉRIE ORIGINAL HBO',
    'hero_description': 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
    'hero_button_text': 'Assistir',
    'hero_background_image': 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
    'hero_title_color': '#ffffff',
    'hero_button_color': '#ffffff',
    
    // Plans Section
    'plans_title': 'Escolha seu Plano',
    'plans_subtitle': 'Acesso ilimitado ao melhor do entretenimento',
    'plans_background_color': '#1f2937',
    
    // Header
    'header_logo_text': 'Globoplay',
    'header_background_color': '#111827',
    
    // Login Page
    'login_title': 'Acesse sua conta',
    'login_subtitle': 'Entre ou cadastre-se no Globoplay',
    'login_background_color': '#111827',
    'login_card_background': '#1f2937'
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

      const customizationsMap: Record<string, string> = { ...defaultCustomizations };
      data?.forEach((item: Customization) => {
        const key = `${item.section}_${item.element_key}`;
        if (item.element_value) {
          customizationsMap[key] = item.element_value;
        }
      });

      setCustomizations(customizationsMap);
    } catch (error) {
      console.error('Erro ao buscar personalizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCustomization = async (key: string, value: string) => {
    try {
      // Verificar autenticação
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      const [section, elementKey] = key.split('_', 2);
      const remainingKey = key.substring(section.length + 1);
      
      // Check if customization exists
      const { data: existing, error: selectError } = await supabase
        .from('customizations')
        .select('id')
        .eq('page', section === 'login' ? 'login' : 'home')
        .eq('section', section)
        .eq('element_key', remainingKey)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('customizations')
          .update({
            element_value: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const customizationData = {
          page: section === 'login' ? 'login' : 'home',
          section: section,
          element_type: key.includes('color') ? 'color' : key.includes('image') ? 'image' : 'text',
          element_key: remainingKey,
          element_value: value,
          active: true
        };

        const { error } = await supabase
          .from('customizations')
          .insert(customizationData);

        if (error) throw error;
      }

      setCustomizations(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Sucesso",
        description: "Personalização salva com sucesso"
      });
    } catch (error: any) {
      let errorMessage = "Não foi possível salvar a personalização";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      } else if (error.code === '42501') {
        errorMessage = "Você não tem permissão para realizar esta ação";
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (key: string, url: string) => {
    await saveCustomization(key, url);
  };

  const renderElementEditor = (key: string, label: string, type: 'text' | 'color' | 'image' | 'textarea' = 'text') => {
    const value = customizations[key] || '';

    return (
      <Card className="bg-gray-800 border-gray-700 mb-4">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center justify-between">
            {label}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedElement(selectedElement === key ? null : key)}
              className="text-gray-400 hover:text-white"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        {selectedElement === key && (
          <CardContent className="space-y-4">
            {type === 'text' && (
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={label}
              />
            )}
            
            {type === 'textarea' && (
              <Textarea
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder={label}
                rows={3}
              />
            )}
            
            {type === 'color' && (
              <div className="flex space-x-2">
                <Input
                  type="color"
                  value={value}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                  className="w-16 h-10 bg-gray-700 border-gray-600"
                />
                <Input
                  value={value}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                  className="flex-1 bg-gray-700 border-gray-600 text-white"
                  placeholder="#ffffff"
                />
              </div>
            )}
            
            {type === 'image' && (
              <div className="space-y-4">
                <Input
                  value={value}
                  onChange={(e) => setCustomizations(prev => ({ ...prev, [key]: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="URL da imagem"
                />
                
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-4">
                  <ImageUpload
                    onImageUploaded={(url) => handleImageUpload(key, url)}
                    folder="customizations"
                    maxSizeKB={5120}
                  />
                </div>
                
                {value && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Preview:</Label>
                    <img src={value} alt="Preview" className="w-full h-32 object-cover rounded border border-gray-600" />
                  </div>
                )}
              </div>
            )}
            
            <Button 
              onClick={() => {
                saveCustomization(key, value);
                setSelectedElement(null);
              }}
              className="bg-red-600 hover:bg-red-700 w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </CardContent>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
        <div className="p-6">
          <div className="text-white">Carregando...</div>
        </div>
    );
  }

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">Personalização Visual</h1>
          <Button
            onClick={() => setPreviewMode(!previewMode)}
            variant="outline"
            className="border-gray-600 text-gray-300"
          >
            <Eye className="h-4 w-4 mr-2" />
            {previewMode ? 'Sair do Preview' : 'Visualizar'}
          </Button>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Editor Panel */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <div className="p-4">
            <Tabs defaultValue="home" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                <TabsTrigger value="home" className="text-gray-300">Home</TabsTrigger>
                <TabsTrigger value="login" className="text-gray-300">Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="home" className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--admin-primary))' }}>Seção Hero</h3>
                  {renderElementEditor('hero_title', 'Título Principal', 'text')}
                  {renderElementEditor('hero_subtitle', 'Subtítulo', 'text')}
                  {renderElementEditor('hero_description', 'Descrição', 'textarea')}
                  {renderElementEditor('hero_button_text', 'Texto do Botão', 'text')}
                  {renderElementEditor('hero_background_image', 'Imagem de Fundo', 'image')}
                  {renderElementEditor('hero_title_color', 'Cor do Título', 'color')}
                  {renderElementEditor('hero_button_color', 'Cor do Botão', 'color')}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--admin-primary))' }}>Seção Planos</h3>
                  {renderElementEditor('plans_title', 'Título dos Planos', 'text')}
                  {renderElementEditor('plans_subtitle', 'Subtítulo dos Planos', 'text')}
                  {renderElementEditor('plans_background_color', 'Cor de Fundo', 'color')}
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--admin-primary))' }}>Cabeçalho</h3>
                  {renderElementEditor('header_logo_text', 'Texto do Logo', 'text')}
                  {renderElementEditor('header_background_color', 'Cor de Fundo', 'color')}
                </div>
              </TabsContent>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <div>
                  <h3 className="font-semibold mb-3" style={{ color: 'hsl(var(--admin-primary))' }}>Página de Login</h3>
                  {renderElementEditor('login_title', 'Título', 'text')}
                  {renderElementEditor('login_subtitle', 'Subtítulo', 'text')}
                  {renderElementEditor('login_background_color', 'Cor de Fundo', 'color')}
                  {renderElementEditor('login_card_background', 'Cor do Card', 'color')}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-gray-900 overflow-auto">
          <div className="p-6">
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <h2 className="text-white text-2xl mb-4">Preview das Personalizações</h2>
              <p className="text-gray-400 mb-8">
                As alterações feitas aparecem automaticamente na sua página real. 
                Use o botão "Visualizar" para ver as mudanças em tempo real.
              </p>
              
              {/* Mini Preview */}
              <div className="bg-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
                <div 
                  className="text-center p-8 rounded-lg mb-6"
                  style={{ backgroundColor: customizations.hero_background_color || '#1f2937' }}
                >
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ color: customizations.hero_title_color || '#ffffff' }}
                  >
                    {customizations.hero_title || 'Título Principal'}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {customizations.hero_description || 'Descrição do conteúdo'}
                  </p>
                  <button 
                    className="px-6 py-2 rounded font-semibold"
                    style={{ 
                      backgroundColor: customizations.hero_button_color || '#3b82f6',
                      color: customizations.hero_button_color === '#ffffff' ? '#000000' : '#ffffff'
                    }}
                  >
                    {customizations.hero_button_text || 'Botão'}
                  </button>
                </div>
                
                <div 
                  className="p-6 rounded-lg"
                  style={{ backgroundColor: customizations.plans_background_color || '#1f2937' }}
                >
                  <h4 className="text-white text-xl mb-2">
                    {customizations.plans_title || 'Título dos Planos'}
                  </h4>
                  <p className="text-gray-300">
                    {customizations.plans_subtitle || 'Subtítulo dos planos'}
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <Button
                  onClick={() => window.open('/', '_blank')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Site Completo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminCustomizations;
