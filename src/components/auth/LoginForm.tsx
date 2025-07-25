
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmail, sanitizeInput } from '@/utils/validators';

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
    
    // Validate inputs
    const validationErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      validationErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      validationErrors.password = 'Password is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Sanitize and submit
    await onSubmit(sanitizeInput(email.toLowerCase().trim()), password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
