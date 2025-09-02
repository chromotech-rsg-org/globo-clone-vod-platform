import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
interface Coupon {
  id: string;
  name: string;
  code: string;
  discount_percentage: number;
  active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}
interface CouponFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCoupon: Coupon | null;
}
const CouponFormDialog: React.FC<CouponFormDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCoupon
}) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    discount_percentage: 0,
    active: true,
    notes: ''
  });
  const {
    toast
  } = useToast();
  useEffect(() => {
    if (editingCoupon) {
      setFormData({
        name: editingCoupon.name,
        code: editingCoupon.code,
        discount_percentage: editingCoupon.discount_percentage,
        active: editingCoupon.active,
        notes: editingCoupon.notes || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        discount_percentage: 0,
        active: true,
        notes: ''
      });
    }
  }, [editingCoupon, isOpen]);
  const handleSave = async () => {
    try {
      // Validar dados obrigatórios
      if (!formData.name.trim()) {
        throw new Error('Nome é obrigatório');
      }
      if (!formData.code.trim()) {
        throw new Error('Código é obrigatório');
      }
      if (formData.discount_percentage <= 0 || formData.discount_percentage > 100) {
        throw new Error('Desconto deve ser entre 1% e 100%');
      }
      const couponData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        discount_percentage: formData.discount_percentage,
        active: formData.active,
        notes: formData.notes.trim() || null
      };
      if (editingCoupon) {
        // Update existing
        const {
          error
        } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom atualizado com sucesso"
        });
      } else {
        // Create new
        const {
          error
        } = await supabase.from('coupons').insert([couponData]);
        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Cupom criado com sucesso"
        });
      }
      onSave();
      onClose();
    } catch (error: any) {
      let errorMessage = "Não foi possível salvar o cupom";
      if (error.message.includes('obrigatório') || error.message.includes('deve ser')) {
        errorMessage = error.message;
      } else if (error.code === '23505') {
        errorMessage = "Já existe um cupom com este código";
      }
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-admin-content-bg border-admin-border text-admin-table-text">
        <DialogHeader>
          <DialogTitle className="text-admin-sidebar-text">
            {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-admin-table-text">Nome</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="Nome do cupom" />
          </div>

          <div>
            <Label htmlFor="code" className="text-admin-table-text">Código</Label>
            <Input id="code" value={formData.code} onChange={e => setFormData({
            ...formData,
            code: e.target.value.toUpperCase()
          })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="CODIGO_CUPOM" />
          </div>

          <div>
            <Label htmlFor="discount" className="text-admin-table-text">Desconto (%)</Label>
            <Input id="discount" type="number" min="1" max="100" value={formData.discount_percentage} onChange={e => setFormData({
            ...formData,
            discount_percentage: Number(e.target.value)
          })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="10" />
          </div>

          <div>
            <Label htmlFor="notes" className="text-admin-table-text">Observações</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
            ...formData,
            notes: e.target.value
          })} className="bg-admin-content-bg border-admin-border text-admin-table-text" placeholder="Observações sobre o cupom (opcional)" rows={3} />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" checked={formData.active} onCheckedChange={checked => setFormData({
            ...formData,
            active: checked
          })} />
            <Label htmlFor="active" className="text-admin-table-text">Ativo</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSave} variant="admin" className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={onClose} variant="outline" className="border-admin-border text-admin-table-text text-slate-950">
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};
export default CouponFormDialog;