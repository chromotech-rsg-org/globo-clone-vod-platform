
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Edit, Eye } from 'lucide-react';

const AdminUsers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const mockUsers = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@email.com',
      cpf: '123.456.789-00',
      phone: '(11) 99999-9999',
      role: 'user',
      subscription: 'Globoplay Premiere',
      status: 'active'
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@email.com',
      cpf: '987.654.321-00',
      phone: '(11) 88888-8888',
      role: 'user',
      subscription: 'Globoplay Cartola',
      status: 'active'
    },
    {
      id: '3',
      name: 'Admin User',
      email: 'admin@globoplay.com',
      cpf: '111.222.333-44',
      phone: '(11) 77777-7777',
      role: 'admin',
      subscription: null,
      status: 'active'
    }
  ];

  const filteredUsers = mockUsers.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-xl font-bold text-white">Gerenciar Usuários</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-white">{user.name}</h3>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role}
                      </Badge>
                      <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                        {user.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Email</p>
                        <p className="text-white">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">CPF</p>
                        <p className="text-white">{user.cpf}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Telefone</p>
                        <p className="text-white">{user.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Assinatura</p>
                        <p className="text-white">{user.subscription || 'Nenhuma'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <p className="text-gray-400">Nenhum usuário encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
