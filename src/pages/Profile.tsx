import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCpf, formatPhone } from '@/utils/formatters';
import { sanitizeInputSecure, validateEmailSecurity, validateCpfSecurity, validatePhoneSecurity, globalRateLimiter, securityConfig } from '@/utils/validators';
const Profile = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  useEffect(() => {
    if (user) {
      setFormData({
        name: sanitizeInputSecure(user.name || '', securityConfig.maxLengths.name),
        email: user.email || '',
        cpf: sanitizeInputSecure(user.cpf || '', securityConfig.maxLengths.cpf),
        phone: sanitizeInputSecure(user.phone || '', securityConfig.maxLengths.phone)
      });
    }
  }, [user]);
  const validateForm = () => {
    const errors: Record<string, string[]> = {};

    // Validate name
    const sanitizedName = sanitizeInputSecure(formData.name, securityConfig.maxLengths.name);
    if (!sanitizedName.trim()) {
      errors.name = ['Nome é obrigatório'];
    } else if (sanitizedName.length < 2) {
      errors.name = ['Nome deve ter pelo menos 2 caracteres'];
    }

    // Validate CPF
    if (formData.cpf) {
      const cpfValidation = validateCpfSecurity(formData.cpf);
      if (!cpfValidation.isValid) {
        errors.cpf = cpfValidation.errors;
      }
    }

    // Validate phone
    if (formData.phone) {
      const phoneValidation = validatePhoneSecurity(formData.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.errors;
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const {
      name,
      value
    } = e.target;
    let formattedValue = value;

    // Apply formatting and sanitization
    if (name === 'name') {
      formattedValue = sanitizeInputSecure(value, securityConfig.maxLengths.name);
    } else if (name === 'cpf') {
      formattedValue = formatCpf(sanitizeInputSecure(value, securityConfig.maxLengths.cpf));
    } else if (name === 'phone') {
      formattedValue = formatPhone(sanitizeInputSecure(value, securityConfig.maxLengths.phone));
    }
    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear validation errors for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = {
          ...prev
        };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Rate limiting check
    const rateLimitKey = `profile-update-${user.id}`;
    if (!globalRateLimiter.isAllowed(rateLimitKey, 3, securityConfig.rateLimits.timeWindow)) {
      const remainingTime = globalRateLimiter.getRemainingTime(rateLimitKey, securityConfig.rateLimits.timeWindow);
      const minutes = Math.ceil(remainingTime / (1000 * 60));
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${minutes} minutos antes de tentar novamente`,
        variant: "destructive"
      });
      return;
    }
    if (!validateForm()) {
      toast({
        title: "Dados inválidos",
        description: "Corrija os erros antes de continuar",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await supabase.from('profiles').update({
        name: sanitizeInputSecure(formData.name, securityConfig.maxLengths.name),
        cpf: formData.cpf || null,
        phone: formData.phone || null
      }).eq('id', user.id);
      if (error) throw error;
      toast({
        title: "Perfil atualizado",
        description: "Seus dados foram atualizados com sucesso."
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">
            Meu Perfil
          </h1>
          <p className="text-slate-200">
            Gerencie suas informações pessoais
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Nome Completo</Label>
                <Input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Seu nome completo" maxLength={securityConfig.maxLengths.name} className={`bg-black text-white border-green-600/30 focus:border-green-500 ${validationErrors.name ? "border-red-500" : ""}`} />
                {validationErrors.name && <div className="text-sm text-red-600">
                    {validationErrors.name.map((error, index) => <p key={index}>{error}</p>)}
                  </div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} disabled className="bg-black text-gray-400 border-gray-600" />
                <p className="text-sm text-gray-300">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-white">CPF</Label>
                <Input id="cpf" name="cpf" type="text" value={formData.cpf} onChange={handleInputChange} placeholder="000.000.000-00" maxLength={securityConfig.maxLengths.cpf} className={`bg-black text-white border-green-600/30 focus:border-green-500 ${validationErrors.cpf ? "border-red-500" : ""}`} />
                {validationErrors.cpf && <div className="text-sm text-red-600">
                    {validationErrors.cpf.map((error, index) => <p key={index}>{error}</p>)}
                  </div>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">Telefone</Label>
                <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="(00) 00000-0000" maxLength={securityConfig.maxLengths.phone} className={`bg-black text-white border-green-600/30 focus:border-green-500 ${validationErrors.phone ? "border-red-500" : ""}`} />
                {validationErrors.phone && <div className="text-sm text-red-600">
                    {validationErrors.phone.map((error, index) => <p key={index}>{error}</p>)}
                  </div>}
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Profile;