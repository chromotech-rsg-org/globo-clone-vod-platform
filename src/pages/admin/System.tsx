import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Palette, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';
import { CustomizationEditor } from '@/components/admin/CustomizationEditor';

interface SystemCustomization {
  element_key: string;
  element_value: string;
  element_type: 'text' | 'color' | 'image';
  label: string;
  section: string;
}

const AdminSystem = () => {
  const { toast } = useToast();
  const { customizations, getCustomization, saveCustomization, loading } = useAdminCustomizations();
  const [localChanges, setLocalChanges] = useState<Record<string, string>>({});

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

  const getCurrentValue = (key: string, defaultValue: string = '') => {
    return localChanges[key] ?? getCustomization(key, defaultValue);
  };

  const handleChange = (key: string, value: string) => {
    setLocalChanges(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key: string) => {
    const value = getCurrentValue(key);
    const customization = systemCustomizations.find(c => c.element_key === key);
    
    if (!customization) return;

    const result = await saveCustomization(key, value, customization.section, customization.element_type);
    
    if (result.success) {
      // Remove from local changes since it's now saved
      setLocalChanges(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
      
      toast({
        title: "Sucesso",
        description: `${customization.label} atualizado com sucesso`
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível salvar a personalização",
        variant: "destructive"
      });
    }
  };


  const renderElementEditor = (customization: SystemCustomization) => {
    const value = getCurrentValue(customization.element_key, customization.element_value);

    return (
      <CustomizationEditor
        key={customization.element_key}
        id={customization.element_key}
        label={customization.label}
        value={value}
        type={customization.element_type}
        onChange={(newValue) => handleChange(customization.element_key, newValue)}
        onSave={() => handleSave(customization.element_key)}
        loading={loading}
      />
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
          <p className="text-admin-muted-foreground text-sm">Configure a aparência e identidade do sistema administrativo</p>
        </div>
      </header>

      <div className="p-6">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-admin-muted">
            <TabsTrigger value="system" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
            <TabsTrigger value="colors" className="data-[state=active]:bg-admin-primary data-[state=active]:text-admin-primary-foreground">
              <Palette className="h-4 w-4 mr-2" />
              Cores
            </TabsTrigger>
          </TabsList>

          <TabsContent value="system" className="space-y-6">
            <div className="bg-admin-card border border-admin-border rounded-lg">
              <div className="p-6 border-b border-admin-border">
                <h2 className="text-lg font-semibold text-admin-foreground">Configurações Gerais</h2>
                <p className="text-sm text-admin-muted-foreground">Configure logo, nome e informações básicas do sistema</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemCustomizations.filter(c => c.section === 'system').map(renderElementEditor)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="colors" className="space-y-6">
            <div className="bg-admin-card border border-admin-border rounded-lg">
              <div className="p-6 border-b border-admin-border">
                <h2 className="text-lg font-semibold text-admin-foreground">Cores do Sistema</h2>
                <p className="text-sm text-admin-muted-foreground">Personalize o esquema de cores do painel administrativo</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {systemCustomizations.filter(c => c.section === 'colors').map(renderElementEditor)}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSystem;