
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Package } from 'lucide-react';

const AdminPackages = () => {
  const [packages, setPackages] = useState([
    {
      id: '1',
      name: 'Globoplay Básico',
      code: 'GLOBO_BASIC',
      vendorId: 'VEN001',
      active: true,
      suspensionPackage: false
    },
    {
      id: '2',
      name: 'Globoplay Premium',
      code: 'GLOBO_PREMIUM',
      vendorId: 'VEN002',
      active: true,
      suspensionPackage: false
    },
    {
      id: '3',
      name: 'Pacote Suspensão',
      code: 'GLOBO_SUSPENSION',
      vendorId: 'VEN999',
      active: true,
      suspensionPackage: true
    }
  ]);

  const [newPackage, setNewPackage] = useState({
    name: '',
    code: '',
    vendorId: '',
    active: true,
    suspensionPackage: false
  });

  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const packageToAdd = {
      ...newPackage,
      id: Date.now().toString()
    };
    setPackages([...packages, packageToAdd]);
    setNewPackage({
      name: '',
      code: '',
      vendorId: '',
      active: true,
      suspensionPackage: false
    });
    setShowForm(false);
  };

  const togglePackageStatus = (id: string) => {
    setPackages(packages.map(pkg => 
      pkg.id === id ? { ...pkg, active: !pkg.active } : pkg
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
              <h1 className="text-xl font-bold text-white">Cadastro de Pacotes</h1>
            </div>
            <Button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Pacote
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Package Form */}
        {showForm && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Novo Pacote</CardTitle>
              <CardDescription className="text-gray-400">
                Criar um novo pacote de conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">Nome</Label>
                    <Input
                      id="name"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({...newPackage, name: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Nome do pacote"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-gray-300">Código</Label>
                    <Input
                      id="code"
                      value={newPackage.code}
                      onChange={(e) => setNewPackage({...newPackage, code: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="CODIGO_PACOTE"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendorId" className="text-gray-300">Vendor ID</Label>
                    <Input
                      id="vendorId"
                      value={newPackage.vendorId}
                      onChange={(e) => setNewPackage({...newPackage, vendorId: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="VEN001"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newPackage.active}
                      onCheckedChange={(checked) => setNewPackage({...newPackage, active: checked})}
                    />
                    <Label htmlFor="active" className="text-gray-300">Ativo</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="suspensionPackage"
                      checked={newPackage.suspensionPackage}
                      onCheckedChange={(checked) => setNewPackage({...newPackage, suspensionPackage: checked})}
                    />
                    <Label htmlFor="suspensionPackage" className="text-gray-300">Pacote de Suspensão</Label>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Salvar Pacote
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

        {/* Packages List */}
        <div className="space-y-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Package className="h-8 w-8 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-white">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm">Código: {pkg.code}</p>
                      <p className="text-gray-400 text-sm">Vendor ID: {pkg.vendorId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {pkg.suspensionPackage && (
                      <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs">
                        Suspensão
                      </span>
                    )}
                    <Switch
                      checked={pkg.active}
                      onCheckedChange={() => togglePackageStatus(pkg.id)}
                    />
                    <span className="text-gray-300 text-sm">
                      {pkg.active ? 'Ativo' : 'Inativo'}
                    </span>
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

export default AdminPackages;
