
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  const selectedPlan = location.state?.selectedPlan || 'premiere';
  const billingCycle = location.state?.billingCycle || 'anual';

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const plans = {
    premiere: { name: 'Globoplay Premiere', price: 36.90 },
    cartola: { name: 'Globoplay Cartola', price: 15.40 },
    telecine: { name: 'Globoplay Telecine', price: 29.90 },
    combate: { name: 'Globoplay Combate', price: 28.80 }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply masks
    if (name === 'cpf') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (name === 'phone') {
      formattedValue = value.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive"
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        cpf: formData.cpf,
        phone: formData.phone,
        plan: plans[selectedPlan as keyof typeof plans].name
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Erro ao criar conta. Tente novamente.",
          variant: "destructive"
        });
      } else {
        navigate('/dashboard');
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao Globoplay"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">G</div>
            <span className="text-white font-bold text-2xl">Globoplay</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Plano Selecionado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-gray-600 rounded-lg p-4">
                <h3 className="text-white font-semibold text-lg">
                  {plans[selectedPlan as keyof typeof plans].name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">Padrão com Anúncios</p>
                <div className="text-white">
                  <span className="text-sm">12x</span>
                  <span className="text-2xl font-bold ml-1">
                    R$ {plans[selectedPlan as keyof typeof plans].price.toFixed(2)}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  Total de R$ {(plans[selectedPlan as keyof typeof plans].price * 12).toFixed(2)}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Benefícios inclusos:</h4>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Globoplay completo</li>
                  <li>• Canais ao vivo</li>
                  <li>• Download para offline</li>
                  <li>• Sem anúncios nos conteúdos premium</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Registration Form */}
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

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Criando conta...' : 'Continuar'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Já tem uma conta?{' '}
                  <Link to="/login" className="text-blue-400 hover:text-blue-300">
                    Faça login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
