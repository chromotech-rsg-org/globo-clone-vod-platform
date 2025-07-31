import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf, formatPhone } from '@/utils/formatters';

interface CheckoutPersonalStepProps {
  initialData: {
    name: string;
    cpf: string;
    phone: string;
  };
  onSubmit: (data: any) => void;
}

const CheckoutPersonalStep = ({ initialData, onSubmit }: CheckoutPersonalStepProps) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    cpf: initialData.cpf || '',
    phone: initialData.phone || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') {
      formattedValue = formatCpf(value);
    } else if (name === 'phone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.cpf.trim()) {
      newErrors.cpf = 'CPF é obrigatório';
    } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
      newErrors.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (formData.phone.replace(/\D/g, '').length !== 11) {
      newErrors.phone = 'Telefone deve ter 11 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">
          Dados Pessoais
        </h2>
        <p className="text-gray-400">
          Informe seus dados pessoais para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-white">Nome Completo *</Label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Digite seu nome completo"
          />
          {errors.name && (
            <p className="text-red-400 text-sm">{errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf" className="text-white">CPF *</Label>
          <Input
            id="cpf"
            name="cpf"
            type="text"
            value={formData.cpf}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && (
            <p className="text-red-400 text-sm">{errors.cpf}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white">Telefone *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="(00) 00000-0000"
            maxLength={15}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm">{errors.phone}</p>
          )}
        </div>

        <div className="pt-4">
          <Button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPersonalStep;