
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const AdminPlans = () => {
  const [plans, setPlans] = useState([
    {
      id: '1',
      priority: 1,
      name: 'Globoplay Premiere',
      active: true,
      bestseller: true,
      price: 36.90,
      freeDays: 7,
      paymentCycle: 'Anual',
      paymentType: 'Cartão de Crédito',
      description: 'Plano completo com Premiere',
      linkedPackage: 'Globoplay Premium',
      benefits: ['Globoplay completo', 'Premiere sem anúncios', 'Download offline']
    }
  ]);

  const [newPlan, setNewPlan] = useState({
    priority: 1,
    name: '',
    active: true,
    bestseller: false,
    price: 0,
    freeDays: 0,
    paymentCycle: 'Mensal',
    paymentType: 'Cartão de Crédito',
    description: '',
    linkedPackage: '',
    benefits: ['']
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const planToAdd = {
      ...newPlan,
      id: Date.now().toString(),
      benefits: newPlan.benefits.filter(benefit => benefit.trim() !== '')
    };
    setPlans([...plans, planToAdd]);
    setNewPlan({
      priority: 1,
      name: '',
      active: true,
      bestseller: false,
      price: 0,
      freeDays: 0,
      paymentCycle: 'Mensal',
      paymentType: 'Cartão de Crédito',
      description: '',
      linkedPackage: '',
      benefits: ['']
    });
    setShowForm(false);
  };

  const addBenefit = () => {
    setNewPlan({
      ...newPlan,
      benefits: [...newPlan.benefits, '']
    });
  };

  const removeBenefit = (index: number) => {
    setNewPlan({
      ...newPlan,
      benefits: newPlan.benefits.filter((_, i) => i !== index)
    });
  };

  const updateBenefit = (index: number, value: string) => {
    const updatedBenefits = [...newPlan.benefits];
    updatedBenefits[index] = value;
    setNewPlan({
      ...newPlan,
      benefits: updatedBenefits
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-white">Cadastro de Planos</h1>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Plan Form */}
        {showForm && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Novo Plano</CardTitle>
              <CardDescription className="text-gray-400">
                Criar um novo plano de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-gray-300">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={newPlan.priority}
                      onChange={(e) => setNewPlan({...newPlan, priority: parseInt(e.target.value)})}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="1"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nome</Label>
                    <Input
                      id="name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Nome do plano"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-gray-300">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({...newPlan, price: parseFloat(e.target.value)})}
                      className="bg-gray-700 border-gray-600 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="freeDays" className="text-gray-300">Dias Grátis</Label>
                    <Input
                      id="freeDays"
                      type="number"
                      value={newPlan.freeDays}
                      onChange={(e) => setNewPlan({...newPlan, freeDays: parseInt(e.target.value)})}
                      className="bg-gray-700 border-gray-600 text-white"
                      min="0"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentCycle" className="text-gray-300">Ciclo de Pagamento</Label>
                    <Select value={newPlan.paymentCycle} onValueChange={(value) => setNewPlan({...newPlan, paymentCycle: value})}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Semanal">Semanal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="paymentType" className="text-gray-300">Tipo de Pagamento</Label>
                    <Select value={newPlan.paymentType} onValueChange={(value) => setNewPlan({...newPlan, paymentType: value})}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Boleto">Boleto</SelectItem>
                        <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                        <SelectItem value="PIX">PIX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Descrição</Label>
                  <Input
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Descrição do plano"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="linkedPackage" className="text-gray-300">Pacote Vinculado</Label>
                  <Input
                    id="linkedPackage"
                    value={newPlan.linkedPackage}
                    onChange={(e) => setNewPlan({...newPlan, linkedPackage: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Pacote vinculado"
                  />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-gray-300">Benefícios</Label>
                    <Button 
                      type="button" 
                      onClick={addBenefit}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Benefício
                    </Button>
                  </div>
                  
                  {newPlan.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        value={benefit}
                        onChange={(e) => updateBenefit(index, e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Benefício"
                      />
                      {newPlan.benefits.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBenefit(index)}
                          className="border-red-600 text-red-400 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newPlan.active}
                      onCheckedChange={(checked) => setNewPlan({...newPlan, active: checked})}
                    />
                    <Label htmlFor="active" className="text-gray-300">Ativo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="bestseller"
                      checked={newPlan.bestseller}
                      onCheckedChange={(checked) => setNewPlan({...newPlan, bestseller: checked})}
                    />
                    <Label htmlFor="bestseller" className="text-gray-300">Mais Vendido</Label>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Salvar Plano
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowForm(false)}
                    className="border-gray-600 text-gray-300"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Plans List */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                      {plan.bestseller && (
                        <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                          Mais Vendido
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded text-xs ${
                        plan.active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                      }`}>
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">R$ {plan.price.toFixed(2)}</p>
                    <p className="text-gray-400 text-sm">{plan.paymentCycle}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Prioridade</p>
                    <p className="text-white">{plan.priority}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Dias Grátis</p>
                    <p className="text-white">{plan.freeDays}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Tipo de Pagamento</p>
                    <p className="text-white">{plan.paymentType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Pacote Vinculado</p>
                    <p className="text-white">{plan.linkedPackage}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm mb-2">Benefícios:</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.benefits.map((benefit, index) => (
                      <span key={index} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">
                        {benefit}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPlans;
