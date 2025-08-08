
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validatePassword, validateEmailSecurity, validateCpfSecurity, validatePhoneSecurity, sanitizeInputSecure } from '@/utils/validators';
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
  
  const [passwordValidation, setPasswordValidation] = useState({ isValid: true, errors: [] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    // Enhanced email validation
    const emailValidation = validateEmailSecurity(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.errors[0];
    }
    
    const passwordCheck = validatePassword(formData.password);
    if (!passwordCheck.isValid) {
      errors.password = passwordCheck.errors[0];
    }
    
    // Enhanced CPF validation
    if (formData.cpf) {
      const cpfValidation = validateCpfSecurity(formData.cpf);
      if (!cpfValidation.isValid) {
        errors.cpf = cpfValidation.errors[0];
      }
    }
    
    // Enhanced phone validation
    if (formData.phone) {
      const phoneValidation = validatePhoneSecurity(formData.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.errors[0];
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Sanitize inputs before submission
    const sanitizedData = {
      ...formData,
      name: sanitizeInputSecure(formData.name),
      email: formData.email.toLowerCase().trim(),
      cpf: formData.cpf ? sanitizeInputSecure(formData.cpf) : '',
      phone: formData.phone ? sanitizeInputSecure(formData.phone) : ''
    };
    
    await onSubmit(sanitizedData);
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time password validation
    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
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
          className={`bg-gray-700 border-gray-600 text-white ${formErrors.name ? 'border-red-500' : ''}`}
          placeholder="Seu nome completo"
          required
        />
        {formErrors.name && <p className="text-red-400 text-sm">{formErrors.name}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-email" className="text-gray-300">Email</Label>
        <Input
          id="register-email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          className={`bg-gray-700 border-gray-600 text-white ${formErrors.email ? 'border-red-500' : ''}`}
          placeholder="seu@email.com"
          required
        />
        {formErrors.email && <p className="text-red-400 text-sm">{formErrors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-gray-300">Senha</Label>
        <Input
          id="register-password"
          type="password"
          value={formData.password}
          onChange={(e) => updateField('password', e.target.value)}
          className={`bg-gray-700 border-gray-600 text-white ${!passwordValidation.isValid ? 'border-red-500' : ''}`}
          placeholder="••••••••"
          required
        />
        {!passwordValidation.isValid && (
          <div className="text-red-400 text-sm">
            {passwordValidation.errors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}
        {formErrors.password && <p className="text-red-400 text-sm">{formErrors.password}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-cpf" className="text-gray-300">CPF (opcional)</Label>
        <Input
          id="register-cpf"
          type="text"
          value={formData.cpf}
          onChange={(e) => updateField('cpf', e.target.value)}
          className={`bg-gray-700 border-gray-600 text-white ${formErrors.cpf ? 'border-red-500' : ''}`}
          placeholder="000.000.000-00"
        />
        {formErrors.cpf && <p className="text-red-400 text-sm">{formErrors.cpf}</p>}
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
