
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Package {
  id?: string;
  name: string;
  code: string;
  vendor_id?: string;
  active: boolean;
  suspension_package: boolean;
  unique_package: boolean;
}

interface PackageFormDialogProps {
  package?: Package;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

const PackageFormDialog: React.FC<PackageFormDialogProps> = ({ package: pkg, trigger, onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Package>({
    name: '',
    code: '',
    vendor_id: '',
    active: true,
    suspension_package: false,
    unique_package: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        code: pkg.code || '',
        vendor_id: pkg.vendor_id || '',
        active: pkg.active ?? true,
        suspension_package: pkg.suspension_package ?? false,
        unique_package: pkg.unique_package ?? false,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        vendor_id: '',
        active: true,
        suspension_package: false,
        unique_package: false,
      });
    }
  }, [pkg, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: "Erro",
        description: "Nome e código são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      if (pkg?.id) {
        // Editar pacote existente
        const { error } = await supabase
          .from('packages')
          .update({
            name: formData.name.trim(),
            code: formData.code.trim(),
            vendor_id: formData.vendor_id?.trim() || null,
            active: formData.active,
            suspension_package: formData.suspension_package,
            unique_package: formData.unique_package,
            updated_at: new Date().toISOString()
          })
          .eq('id', pkg.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pacote atualizado com sucesso"
        });
      } else {
        // Criar novo pacote
        const { error } = await supabase
          .from('packages')
          .insert({
            name: formData.name.trim(),
            code: formData.code.trim(),
            vendor_id: formData.vendor_id?.trim() || null,
            active: formData.active,
            suspension_package: formData.suspension_package,
            unique_package: formData.unique_package
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Pacote criado com sucesso"
        });
      }

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar pacote:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o pacote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {pkg ? 'Editar Pacote' : 'Novo Pacote'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
              placeholder="Nome do pacote"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-gray-300">Código *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
              placeholder="Código do pacote"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor_id" className="text-gray-300">ID do Fornecedor</Label>
            <Input
              id="vendor_id"
              value={formData.vendor_id}
              onChange={(e) => setFormData(prev => ({ ...prev, vendor_id: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
              placeholder="ID do fornecedor (opcional)"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
            />
            <Label htmlFor="active" className="text-gray-300">Ativo</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="suspension_package"
              checked={formData.suspension_package}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, suspension_package: checked }))}
            />
            <Label htmlFor="suspension_package" className="text-gray-300">Pacote de Suspensão</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="unique_package"
              checked={formData.unique_package}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, unique_package: checked }))}
            />
            <Label htmlFor="unique_package" className="text-gray-300">Pacote Único</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="admin"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (pkg ? 'Atualizar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PackageFormDialog;
