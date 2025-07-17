import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Palette, Settings, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import ImageUpload from '@/components/ui/image-upload';

interface SystemCustomization {
  id?: string;
  element_key: string;
  element_value: string;
  element_type: 'text' | 'color' | 'image';
  label: string;
  section: string;
}

const AdminSystem = () => {
  const [loading, setLoading] = useState(true);
  const [customizations, setCustomizations] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const systemCustomizations: SystemCustomization[] = [
    // Sistema - Configurações gerais
    {
      element_key: 'admin_logo',
      element_value: '',
      element_type: 'image',
      label: 'Logo do Sistema',
      section: 'system'
    },
    {
      element_key: 'admin_title',
      element_value: 'Painel Administrativo',
      element_type: 'text',
      label: 'Nome do Sistema',
      section: 'system'
    },
    {
      element_key: 'admin_company_name',
      element_value: 'Minha Empresa',
      element_type: 'text',
      label: 'Nome da Empresa',
      section: 'system'
    },

    // Cores do Sistema Admin
    {
      element_key: 'admin_primary_color',
      element_value: '#3b82f6',
      element_type: 'color',
      label: 'Cor Primária',
      section: 'colors'
    },
    {
      element_key: 'admin_button_bg_color',
      element_value: '#3b82f6',
      element_type: 'color',
      label: 'Cor de Fundo dos Botões',
      section: 'colors'
    },
    {
      element_key: 'admin_button_text_color',
      element_value: '#ffffff',
      element_type: 'color',
      label: 'Cor do Texto dos Botões',
      section: 'colors'
    },
    {
      element_key: 'admin_button_hover_color',
      element_value: '#2563eb',
      element_type: 'color',
      label: 'Cor Hover dos Botões',
      section: 'colors'
    },
    {
      element_key: 'admin_sidebar_bg',
      element_value: '#1f2937',
      element_type: 'color',
      label: 'Fundo da Sidebar',
      section: 'colors'
    },
    {
      element_key: 'admin_sidebar_text_color',
      element_value: '#f3f4f6',
      element_type: 'color',
      label: 'Cor do Texto da Sidebar',
      section: 'colors'
    },
    {
      element_key: 'admin_content_bg',
      element_value: '#111827',
      element_type: 'color',
      label: 'Fundo do Dashboard',
      section: 'colors'
    },
    {
      element_key: 'admin_dashboard_text_color',
      element_value: '#f3f4f6',
      element_type: 'color',
      label: 'Cor do Texto do Dashboard',
      section: 'colors'
    },
    {
      element_key: 'admin_table_header_bg',
      element_value: '#374151',
      element_type: 'color',
      label: 'Fundo do Cabeçalho da Tabela',
      section: 'colors'
    },
    {
      element_key: 'admin_table_bg_color',
      element_value: '#1f2937',
      element_type: 'color',
      label: 'Cor de Fundo das Tabelas',
      section: 'colors'
    },
    {
      element_key: 'admin_table_text_color',
      element_value: '#f3f4f6',
      element_type: 'color',
      label: 'Cor do Texto das Tabelas',
      section: 'colors'
    },
    {
      element_key: 'admin_success_color',
      element_value: '#10b981',
      element_type: 'color',
      label: 'Cor de Sucesso',
      section: 'colors'
    },
    {
      element_key: 'admin_danger_color',
      element_value: '#ef4444',
      element_type: 'color',
      label: 'Cor de Perigo',
      section: 'colors'
    },
    {
      element_key: 'admin_warning_color',
      element_value: '#f59e0b',
      element_type: 'color',
      label: 'Cor de Aviso',
      section: 'colors'
    }
  ];

  useEffect(() => {
    fetchCustomizations();
  }, []);

  const fetchCustomizations = async () => {
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .eq('page', 'admin')
        .eq('active', true);

      if (error) throw error;

      const customizationMap: Record<string, string> = {};
      
      // Valores padrão
      systemCustomizations.forEach(item => {
        customizationMap[item.element_key] = item.element_value;
      });

      // Sobrescrever com valores do banco
      data?.forEach(item => {
        if (item.element_value) {
          customizationMap[item.element_key] = item.element_value;
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

      const customization = systemCustomizations.find(c => c.element_key === key);
      if (!customization) return;

      // Verificar se já existe
      const { data: existing, error: selectError } = await supabase
        .from('customizations')
        .select('id')
        .eq('page', 'admin')
        .eq('section', customization.section)
        .eq('element_key', key)
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
            page: 'admin',
            section: customization.section,
            element_type: customization.element_type,
            element_key: key,
            element_value: value,
            active: true
          });

        if (error) throw error;
      }

      setCustomizations(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "Sucesso",
        description: `${customization.label} atualizado com sucesso`
      });

      // Aplicar cores dinamicamente
      if (customization.element_type === 'color') {
        applyColorToSystem(key, value);
      }
      
      // Aplicar mudanças globalmente se necessário
      if (key === 'admin_title') {
        document.title = value;
      }
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

  const applyColorToSystem = (key: string, color: string) => {
    const root = document.documentElement;
    const hslColor = hexToHsl(color);

    switch (key) {
      case 'admin_primary_color':
        root.style.setProperty('--admin-primary', hslColor);
        root.style.setProperty('--primary', hslColor);
        break;
      case 'admin_button_bg_color':
        root.style.setProperty('--admin-button-bg', hslColor);
        break;
      case 'admin_button_text_color':
        root.style.setProperty('--admin-button-text', hslColor);
        break;
      case 'admin_button_hover_color':
        root.style.setProperty('--admin-button-hover', hslColor);
        break;
      case 'admin_success_color':
        root.style.setProperty('--admin-success', hslColor);
        break;
      case 'admin_danger_color':
        root.style.setProperty('--admin-danger', hslColor);
        root.style.setProperty('--destructive', hslColor);
        break;
      case 'admin_warning_color':
        root.style.setProperty('--admin-warning', hslColor);
        break;
      case 'admin_sidebar_bg':
        root.style.setProperty('--admin-sidebar-bg', hslColor);
        break;
      case 'admin_sidebar_text_color':
        root.style.setProperty('--admin-sidebar-text', hslColor);
        break;
      case 'admin_content_bg':
        root.style.setProperty('--admin-content-bg', hslColor);
        break;
      case 'admin_dashboard_text_color':
        root.style.setProperty('--admin-dashboard-text', hslColor);
        break;
      case 'admin_table_header_bg':
        root.style.setProperty('--admin-table-header', hslColor);
        break;
      case 'admin_table_bg_color':
        root.style.setProperty('--admin-table-bg', hslColor);
        break;
      case 'admin_table_text_color':
        root.style.setProperty('--admin-table-text', hslColor);
        break;
    }
    
    // Força a aplicação das cores em tempo real
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('adminColorsUpdated'));
    }, 100);
  };

  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const handleImageUpload = (key: string, url: string) => {
    saveCustomization(key, url);
  };

  const renderElementEditor = (customization: SystemCustomization) => {
    const value = customizations[customization.element_key] || customization.element_value;

    return (
      <div key={customization.element_key} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <Label className="text-gray-300 mb-3 block font-medium">{customization.label}</Label>
        
        {customization.element_type === 'text' && (
          <div className="flex space-x-2">
            <Input
              value={value}
              onChange={(e) => setCustomizations(prev => ({ ...prev, [customization.element_key]: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white flex-1"
              placeholder={customization.label}
            />
            <Button
              onClick={() => saveCustomization(customization.element_key, customizations[customization.element_key] || '')}
              variant="admin"
              size="sm"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        )}

        {customization.element_type === 'color' && (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="color"
                value={value}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setCustomizations(prev => ({ ...prev, [customization.element_key]: newValue }));
                  saveCustomization(customization.element_key, newValue);
                }}
                className="bg-gray-700 border-gray-600 w-16 h-10 p-1 rounded"
              />
              <Input
                value={value}
                onChange={(e) => setCustomizations(prev => ({ ...prev, [customization.element_key]: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white flex-1"
                placeholder="#000000"
              />
              <Button
                onClick={() => saveCustomization(customization.element_key, customizations[customization.element_key] || '')}
                variant="admin"
                size="sm"
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
            {/* Preview da cor */}
            <div 
              className="w-full h-6 rounded border border-gray-600" 
              style={{ backgroundColor: value }}
              title={`Preview: ${customization.label}`}
            />
          </div>
        )}

        {customization.element_type === 'image' && (
          <div className="space-y-3">
            {value && (
              <div className="bg-gray-700 rounded p-2">
                <img src={value} alt={customization.label} className="w-full max-w-[200px] h-auto object-contain rounded" />
              </div>
            )}
            <ImageUpload
              onImageUploaded={(url) => handleImageUpload(customization.element_key, url)}
              folder="admin"
              maxSizeKB={2048}
            />
          </div>
        )}
      </div>
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
          <h1 className="text-xl font-bold text-white">Personalização do Sistema</h1>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="system" className="data-[state=active]:bg-gray-600">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="colors" className="data-[state=active]:bg-gray-600">
              <Palette className="h-4 w-4 mr-2" />
              Cores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {systemCustomizations
                .filter(c => c.section === 'system')
                .map(renderElementEditor)}
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {systemCustomizations
                .filter(c => c.section === 'colors')
                .map(renderElementEditor)}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystem;