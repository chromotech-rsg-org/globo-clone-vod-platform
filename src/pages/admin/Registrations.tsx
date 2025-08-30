
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, Eye, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DataTablePagination from '@/components/admin/DataTablePagination';

interface Registration {
  id: string;
  auction_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'canceled';
  created_at: string;
  updated_at: string;
  internal_notes?: string;
  client_notes?: string;
  approved_by?: string;
  next_registration_allowed_at?: string;
}

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [statusFilter, currentPage, pageSize, searchTerm]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('auction_registrations')
        .select('*', { count: 'exact' });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (searchTerm) {
        query = query.or(`id.ilike.%${searchTerm}%,auction_id.ilike.%${searchTerm}%,user_id.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) {
        console.error('Error fetching registrations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch registrations.',
          variant: 'destructive',
        });
        return;
      }

      setRegistrations(data as Registration[] || []);
      setTotalItems(count || 0);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch registrations.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected' | 'canceled') => {
    try {
      const { error } = await supabase
        .from('auction_registrations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating registration status:', error);
        toast({
          title: 'Error',
          description: 'Failed to update registration status.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Success',
        description: 'Registration status updated successfully.',
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error updating registration status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update registration status.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    try {
      const { error } = await supabase.from('auction_registrations').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Registration deleted successfully"
      });
      fetchRegistrations();
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast({
        title: "Error",
        description: "Failed to delete the registration",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (registration: Registration) => {
    alert(`View details for registration ID: ${registration.id}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <>
      <header className="bg-admin-header border-b border-admin-border">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-admin-sidebar-text">Gerenciar Habilitações</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Search and Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar por ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-black border border-green-600/30 text-white rounded"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
            <option value="canceled">Cancelado</option>
          </select>
        </div>

        {/* Registrations Table */}
        <Card className="bg-admin-card border-admin-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-admin-border">
                  <TableHead className="text-admin-muted-foreground">ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Leilão ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Usuário ID</TableHead>
                  <TableHead className="text-admin-muted-foreground">Status</TableHead>
                  <TableHead className="text-admin-muted-foreground">Data de Registro</TableHead>
                  <TableHead className="text-admin-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-4 text-admin-table-text">
                      Carregando habilitações...
                    </TableCell>
                  </TableRow>
                ) : registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-4 text-admin-table-text">
                      Nenhuma habilitação encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map(registration => (
                    <TableRow key={registration.id} className="border-admin-border">
                      <TableCell className="text-admin-table-text">{registration.id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-admin-table-text">{registration.auction_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-admin-table-text">{registration.user_id.slice(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant={
                          registration.status === 'approved' ? 'admin-success' :
                          registration.status === 'pending' ? 'secondary' :
                          'admin-danger'
                        }>
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-admin-table-text">
                        {new Date(registration.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleViewDetails(registration)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {registration.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleStatusChange(registration.id, 'canceled')}
                              className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          {registration.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleStatusChange(registration.id, 'approved')}
                                className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                              >
                                <UserCheck className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleStatusChange(registration.id, 'rejected')}
                                className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {registration.status === 'canceled' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleStatusChange(registration.id, 'approved')}
                              className="text-green-400 hover:text-green-300 hover:bg-gray-800"
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDelete(registration.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            
            <DataTablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AdminRegistrations;
