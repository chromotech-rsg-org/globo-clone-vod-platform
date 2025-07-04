
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RegisterData } from '@/types/auth';

interface RegisterFormProps {
  onSubmit: (data: RegisterData) => Promise<void>;
  isSubmitting: boolean;
}

const RegisterForm = ({ onSubmit, isSubmitting }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-name" className="text-gray-300">Nome Completo</Label>
        <Input
          id="register-name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="Seu nome completo"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-gray-300">Email</Label>
        <Input
          id="register-email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="seu@email.com"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-gray-300">Senha</Label>
        <Input
          id="register-password"
          type="password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="••••••••"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-cpf" className="text-gray-300">CPF (opcional)</Label>
        <Input
          id="register-cpf"
          type="text"
          value={formData.cpf}
          onChange={(e) => updateField('cpf', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="000.000.000-00"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-phone" className="text-gray-300">Telefone (opcional)</Label>
        <Input
          id="register-phone"
          type="text"
          value={formData.phone}
          onChange={(e) => updateField('phone', e.target.value)}
          className="bg-gray-700 border-gray-600 text-white"
          placeholder="(11) 99999-9999"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
      </Button>
    </form>
  );
};

export default RegisterForm;
