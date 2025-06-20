
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Percent } from 'lucide-react';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([
    {
      id: '1',
      name: 'Desconto de Boas-vindas',
      code: 'GLOBO10',
      discount: 10,
      active: true,
      observations: 'Válido para novos usuários'
    },
    {
      id: '2',
      name: 'Black Friday',
      code: 'BLACK50',
      discount: 50,
      active: false,
      observations: 'Promoção especial Black Friday'
    }
  ]);

  const [newCoupon, setNewCoupon] = useState({
    name: '',
    code: '',
    discount: 0,
    active: true,
    observations: ''
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const couponToAdd = {
      ...newCoupon,
      id: Date.now().toString(),
      code: newCoupon.code.toUpperCase()
    };
    setCoupons([...coupons, couponToAdd]);
    setNewCoupon({
      name: '',
      code: '',
      discount: 0,
      active: true,
      observations: ''
    });
    setShowForm(false);
  };

  const toggleCouponStatus = (id: string) => {
    setCoupons(coupons.map(coupon => 
      coupon.id === id ? { ...coupon, active: !coupon.active } : coupon
    ));
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
              <h1 className="text-xl font-bold text-white">Cupons de Desconto</h1>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Coupon Form */}
        {showForm && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Novo Cupom</CardTitle>
              <CardDescription className="text-gray-400">
                Criar um novo cupom de desconto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nome</Label>
                    <Input
                      id="name"
                      value={newCoupon.name}
                      onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Nome do cupom"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-300">Código do Cupom</Label>
                    <Input
                      id="code"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="CODIGO10"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-gray-300">% de Desconto</Label>
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="100"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({...newCoupon, discount: parseInt(e.target.value)})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observations" className="text-gray-300">Observações</Label>
                  <Input
                    id="observations"
                    value={newCoupon.observations}
                    onChange={(e) => setNewCoupon({...newCoupon, observations: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Observações sobre o cupom"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newCoupon.active}
                    onCheckedChange={(checked) => setNewCoupon({...newCoupon, active: checked})}
                  />
                  <Label htmlFor="active" className="text-gray-300">Ativo</Label>
                </div>
                
                <div className="flex space-x-4">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Salvar Cupom
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

        {/* Coupons List */}
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <Percent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{coupon.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <p className="text-gray-400 text-sm">Código: <span className="font-mono bg-gray-700 px-2 py-1 rounded text-white">{coupon.code}</span></p>
                        <p className="text-gray-400 text-sm">Desconto: <span className="text-green-400 font-semibold">{coupon.discount}%</span></p>
                      </div>
                      {coupon.observations && (
                        <p className="text-gray-500 text-sm mt-1">{coupon.observations}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Switch
                      checked={coupon.active}
                      onCheckedChange={() => toggleCouponStatus(coupon.id)}
                    />
                    <span className="text-gray-300 text-sm">
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {coupons.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <Percent className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhum cupom cadastrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
