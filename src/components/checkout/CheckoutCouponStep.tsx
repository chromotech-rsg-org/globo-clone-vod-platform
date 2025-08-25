
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Ticket, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutCouponStepProps {
  onCouponApplied: (coupon: any) => void;
  onSkip: () => void;
}

const CheckoutCouponStep = ({ onCouponApplied, onSkip }: CheckoutCouponStepProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    setIsValidating(true);
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setValidatedCoupon(data);
        toast.success(`Cupom válido! Desconto de ${data.discount_percentage}%`);
      } else {
        toast.error('Cupom não encontrado ou inativo');
        setValidatedCoupon(null);
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      toast.error('Erro ao validar cupom');
      setValidatedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCoupon = () => {
    if (validatedCoupon) {
      onCouponApplied(validatedCoupon);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateCoupon();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Cupom de Desconto
        </h2>
        <p className="text-gray-400">
          Tem um cupom? Digite o código para aplicar o desconto
        </p>
      </div>

      <Card className="bg-gray-700 border-gray-600">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coupon" className="text-white flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Código do Cupom
              </Label>
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="bg-gray-800 border-gray-500 text-white flex-1"
                  placeholder="Ex: DESCONTO10"
                  disabled={isValidating}
                />
                <Button
                  onClick={validateCoupon}
                  disabled={isValidating || !couponCode.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? 'Validando...' : 'Validar'}
                </Button>
              </div>
            </div>

            {validatedCoupon && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Check className="h-5 w-5" />
                  <span className="font-semibold">Cupom Válido!</span>
                </div>
                <div className="text-white">
                  <p className="font-medium">{validatedCoupon.name}</p>
                  <p className="text-sm text-gray-300">
                    Desconto de {validatedCoupon.discount_percentage}%
                  </p>
                  {validatedCoupon.notes && (
                    <p className="text-sm text-gray-400 mt-1">
                      {validatedCoupon.notes}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button 
          onClick={onSkip}
          variant="outline"
          className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          Pular
        </Button>
        <Button 
          onClick={handleApplyCoupon}
          disabled={!validatedCoupon}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {validatedCoupon ? 'Aplicar Cupom' : 'Continuar sem Cupom'}
        </Button>
      </div>
    </div>
  );
};

export default CheckoutCouponStep;
