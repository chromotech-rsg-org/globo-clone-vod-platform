
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { formatCpf, formatPhone } from '@/utils/formatters';
import { validatePassword, validatePasswordMatch } from '@/utils/validators';
import { supabase } from '@/integrations/supabase/client';

import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

interface CheckoutFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isLoading: boolean;
}

interface FormData {
  name: string;
  cpf: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

const CheckoutForm = ({ onSubmit, isLoading }: CheckoutFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [discount, setDiscount] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCpf(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponValid(null);
      setDiscount(0);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('active', true)
        .single();

      if (error || !data) {
        setCouponValid(false);
        setDiscount(0);
        toast({
          title: "Cupom inválido",
          description: "Cupom não encontrado ou expirado",
          variant: "destructive"
        });
      } else {
        setCouponValid(true);
        setDiscount(data.discount_percentage);
        toast({
          title: "Cupom aplicado!",
          description: `Desconto de ${data.discount_percentage}% aplicado`
        });
      }
    } catch (error) {
      setCouponValid(false);
      setDiscount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      toast({
        title: "Ação necessária",
        description: "Você precisa aceitar os termos e condições para continuar",
        variant: "destructive"
      });
      return;
    }
    
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (!validatePassword(formData.password)) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    await onSubmit(formData);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Criar Conta</CardTitle>
        <CardDescription className="text-gray-400">
          Preencha seus dados para criar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Nome Completo</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf" className="text-gray-300">CPF</Label>
            <Input
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="000.000.000-00"
              maxLength={14}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="(11) 99999-9999"
              maxLength={15}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="joao@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {/* Cupom de desconto */}
          <div className="space-y-2">
            <Label htmlFor="coupon" className="text-gray-300">Cupom de Desconto (opcional)</Label>
            <div className="flex space-x-2">
              <Input
                id="coupon"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Digite o código do cupom"
              />
              <Button 
                type="button"
                onClick={validateCoupon}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={!couponCode.trim()}
              >
                Aplicar
              </Button>
            </div>
            {couponValid === true && (
              <p className="text-green-400 text-sm">✓ Cupom válido - {discount}% de desconto</p>
            )}
            {couponValid === false && (
              <p className="text-red-400 text-sm">✗ Cupom inválido</p>
            )}
          </div>

          {/* Termos e Condições */}
          <div className="flex items-start space-x-3 p-4 bg-gray-900 border border-green-600/30 rounded-lg">
            <Checkbox 
              id="terms" 
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, termsAccepted: checked as boolean }))
              }
              required
              className="mt-1"
            />
            <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed cursor-pointer">
              Eu li e aceito os{' '}
              <Link 
                to="/terms" 
                target="_blank"
                className="text-green-400 hover:text-green-300 underline font-medium"
              >
                Termos e Condições
              </Link>
              {' '}e autorizo a coleta dos meus dados para fins de cadastro e contato.
            </label>
          </div>

          <Button
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Continuar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;
