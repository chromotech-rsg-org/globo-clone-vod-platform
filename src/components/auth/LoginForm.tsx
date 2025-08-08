
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmailSecurity, globalRateLimiter, securityConfig, sanitizeInputSecure } from '@/utils/validators';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  isSubmitting: boolean;
}

const LoginForm = ({ onSubmit, isSubmitting }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Rate limiting check
    const rateLimitKey = `login_${email}`;
    if (!globalRateLimiter.isAllowed(rateLimitKey, securityConfig.rateLimits.loginAttempts, securityConfig.rateLimits.timeWindow)) {
      const remainingTime = Math.ceil(globalRateLimiter.getRemainingTime(rateLimitKey, securityConfig.rateLimits.timeWindow) / 60000);
      setErrors({ 
        general: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.` 
      });
      return;
    }
    
    // Enhanced validation
    const validationErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      validationErrors.email = 'Email é obrigatório';
    } else {
      const emailValidation = validateEmailSecurity(email);
      if (!emailValidation.isValid) {
        validationErrors.email = emailValidation.errors[0];
      }
    }
    
    if (!password.trim()) {
      validationErrors.password = 'Senha é obrigatória';
    } else if (password.length > 128) {
      validationErrors.password = 'Senha muito longa';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Sanitize and submit
    await onSubmit(sanitizeInputSecure(email.toLowerCase().trim()), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{errors.general}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-gray-300">Email</Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
          }}
          className={`bg-gray-700 border-gray-600 text-white ${errors.email ? 'border-red-500' : ''}`}
          placeholder="seu@email.com"
          autoComplete="email"
          required
        />
        {errors.email && <p className="text-red-400 text-sm">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-gray-300">Senha</Label>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
          }}
          className={`bg-gray-700 border-gray-600 text-white ${errors.password ? 'border-red-500' : ''}`}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
        {errors.password && <p className="text-red-400 text-sm">{errors.password}</p>}
      </div>

      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Entrando...' : 'Entrar'}
      </Button>
    </form>
  );
};

export default LoginForm;
