import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  payment_type: string;
  active: boolean;
  best_seller: boolean;
  priority: number;
  free_days: number;
  description?: string;
  benefits?: string[];
  package_ids?: string[];
}

interface Package {
  id: string;
  name: string;
  code: string;
  active: boolean;
  suspension_package: boolean;
  unique_package: boolean;
}

interface PlanFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan?: Plan;
  onSuccess: () => void;
}

const PlanFormDialog: React.FC<PlanFormDialogProps> = ({
  open,
  onOpenChange,
  plan,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    billing_cycle: 'monthly',
    payment_type: 'credit_card',
    active: true,
    best_seller: false,
    priority: 0,
    free_days: 0,
    description: '',
    benefits: [''],
    selectedPackages: [] as string[],
  });
  const { toast } = useToast();

  const isEditing = !!plan;

  useEffect(() => {
    const fetchPackages = async () => {
      const { data, error } = await supabase
        .from('packages')
        .select('id, name, code, active, suspension_package, unique_package')
        .eq('active', true)
        .order('name');

      if (error) {
        console.error('Erro ao carregar pacotes:', error);
      } else {
        setPackages(data || []);
      }
    };

    if (open) {
      fetchPackages();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (plan) {
        // Carregar pacotes do plano se estiver editando
        const fetchPlanPackages = async () => {
          const { data } = await supabase
            .from('plan_packages')
            .select('package_id')
            .eq('plan_id', plan.id);
          
          const packageIds = data?.map(pp => pp.package_id) || [];
          
          setFormData({
            name: plan.name,
            price: plan.price,
            billing_cycle: plan.billing_cycle,
            payment_type: plan.payment_type,
            active: plan.active,
            best_seller: plan.best_seller,
            priority: plan.priority,
            free_days: plan.free_days,
            description: plan.description || '',
            benefits: plan.benefits?.length ? plan.benefits : [''],
            selectedPackages: packageIds,
          });
        };

        fetchPlanPackages();
      } else {
        setFormData({
          name: '',
          price: 0,
          billing_cycle: 'monthly',
          payment_type: 'credit_card',
          active: true,
          best_seller: false,
          priority: 0,
          free_days: 0,
          description: '',
          benefits: [''],
          selectedPackages: [],
        });
      }
    }
  }, [open, plan]);

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const addBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const removeBenefit = (index: number) => {
    if (formData.benefits.length > 1) {
      const newBenefits = formData.benefits.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, benefits: newBenefits }));
    }
  };

  const handlePackageToggle = (packageId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedPackages: checked
        ? [...prev.selectedPackages, packageId]
        : prev.selectedPackages.filter(id => id !== packageId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const benefits = formData.benefits.filter(benefit => benefit.trim() !== '');

      const submitData = {
        name: formData.name,
        price: formData.price,
        billing_cycle: formData.billing_cycle,
        payment_type: formData.payment_type,
        active: formData.active,
        best_seller: formData.best_seller,
        priority: formData.priority,
        free_days: formData.free_days,
        description: formData.description || null,
        benefits: benefits.length > 0 ? benefits : null,
        updated_at: new Date().toISOString(),
      };

      let planId: string;

      if (isEditing) {
        const { error } = await supabase
          .from('plans')
          .update(submitData)
          .eq('id', plan.id);

        if (error) throw error;

        planId = plan.id;

        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso"
        });
      } else {
        const { data, error } = await supabase
          .from('plans')
          .insert([submitData])
          .select('id')
          .single();

        if (error) throw error;

        planId = data.id;

        toast({
          title: "Sucesso",
          description: "Plano criado com sucesso"
        });
      }

      // Gerenciar relações com pacotes
      if (isEditing) {
        // Remover relações existentes
        await supabase
          .from('plan_packages')
          .delete()
          .eq('plan_id', planId);
      }

      // Inserir novas relações
      if (formData.selectedPackages.length > 0) {
        const planPackages = formData.selectedPackages.map(packageId => ({
          plan_id: planId,
          package_id: packageId
        }));

        const { error: packageError } = await supabase
          .from('plan_packages')
          .insert(planPackages);

        if (packageError) throw packageError;
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar plano:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o plano",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-black text-white border-green-600/30 max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black [&::-webkit-scrollbar-thumb]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="bg-black border-green-600/30 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-white">Preço *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="bg-black border-green-600/30 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_cycle" className="text-white">Ciclo de Cobrança</Label>
              <Select 
                value={formData.billing_cycle} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, billing_cycle: value }))}
              >
                <SelectTrigger className="bg-black border-green-600/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-green-600/30">
                  <SelectItem value="monthly" className="text-white hover:bg-gray-800">Mensal</SelectItem>
                  <SelectItem value="yearly" className="text-white hover:bg-gray-800">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_type" className="text-white">Tipo de Pagamento</Label>
              <Select 
                value={formData.payment_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_type: value }))}
              >
                <SelectTrigger className="bg-black border-green-600/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-green-600/30">
                  <SelectItem value="credit_card" className="text-white hover:bg-gray-800">Cartão de Crédito</SelectItem>
                  <SelectItem value="pix" className="text-white hover:bg-gray-800">PIX</SelectItem>
                  <SelectItem value="boleto" className="text-white hover:bg-gray-800">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-white">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: Number(e.target.value) }))}
                className="bg-black border-green-600/30 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_days" className="text-white">Dias Grátis</Label>
              <Input
                id="free_days"
                type="number"
                min="0"
                value={formData.free_days}
                onChange={(e) => setFormData(prev => ({ ...prev, free_days: Number(e.target.value) }))}
                className="bg-black border-green-600/30 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-black border-green-600/30 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Benefícios</Label>
            {formData.benefits.map((benefit, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => handleBenefitChange(index, e.target.value)}
                  placeholder="Digite um benefício"
                  className="bg-black border-green-600/30 text-white"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => removeBenefit(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                  disabled={formData.benefits.length === 1}
                >
                  Remover
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              onClick={addBenefit}
              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
            >
              + Adicionar Benefício
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-white">Pacotes Vinculados</Label>
            <div className="max-h-40 overflow-y-auto space-y-2 border border-green-600/30 rounded p-3">
              {packages.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum pacote disponível</p>
              ) : (
                packages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`package-${pkg.id}`}
                      checked={formData.selectedPackages.includes(pkg.id)}
                      onCheckedChange={(checked) => 
                        handlePackageToggle(pkg.id, checked as boolean)
                      }
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label
                      htmlFor={`package-${pkg.id}`}
                      className="text-white text-sm cursor-pointer flex-1"
                    >
                      <div className="flex items-center justify-between">
                        <span>{pkg.name}</span>
                        <div className="flex gap-2">
                          <span className="text-xs text-gray-400">({pkg.code})</span>
                          {pkg.suspension_package && (
                            <span className="text-xs bg-orange-600 text-white px-1 rounded">Suspensão</span>
                          )}
                          {pkg.unique_package && (
                            <span className="text-xs bg-blue-600 text-white px-1 rounded">Único</span>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active" className="text-white">Ativo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="best_seller"
                checked={formData.best_seller}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, best_seller: checked }))}
              />
              <Label htmlFor="best_seller" className="text-white">Mais Vendido</Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="admin"
              disabled={loading}
            >
              {loading ? 'Salvando...' : (isEditing ? 'Salvar' : 'Criar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormDialog;
