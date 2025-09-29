import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Upload, Download, Eye, Trash2, Search, Filter, FileText, Image, FileIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  name: string;
  email: string;
}

const Documentos: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    userId: '',
    category: 'general',
    file: null as File | null,
    documentName: ''
  });

  const { documents, loading, uploading, categories, uploadDocument, deleteDocument, downloadDocument } = useClientDocuments();
  const { toast } = useToast();

  // Buscar clientes ao abrir o dialog
  useEffect(() => {
    if (uploadDialogOpen && clients.length === 0) {
      fetchClients();
    }
  }, [uploadDialogOpen]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes",
        variant: "destructive"
      });
    } finally {
      setLoadingClients(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedUserId && doc.user_id !== selectedUserId) return false;
    if (selectedCategory && selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchTerm && !doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleUpload = async () => {
    if (!uploadData.file) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um arquivo",
        variant: "destructive"
      });
      return;
    }

    const success = await uploadDocument(
      uploadData.file, 
      uploadData.userId || null, 
      uploadData.category,
      uploadData.documentName || uploadData.file.name
    );
    if (success) {
      setUploadDialogOpen(false);
      setUploadData({ userId: '', category: 'general', file: null, documentName: '' });
    }
  };

  const handleDelete = async (doc: any) => {
    if (window.confirm(`Deseja excluir o documento "${doc.file_name}"?`)) {
      await deleteDocument(doc.id, doc.file_path);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.includes('pdf')) return FileText;
    return FileIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-admin-table-text">Gestão de Documentos</h1>
            <p className="text-admin-muted-foreground">
              Gerencie documentos dos clientes
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Upload className="h-4 w-4 mr-2" />
                Enviar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-admin-content-bg border-admin-border">
              <DialogHeader>
                <DialogTitle className="text-admin-table-text">Enviar Novo Documento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-admin-table-text">Nome do Documento</Label>
                  <Input
                    value={uploadData.documentName}
                    onChange={(e) => setUploadData(prev => ({ ...prev, documentName: e.target.value }))}
                    placeholder="Nome personalizado (opcional)"
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>
                
                <div>
                  <Label className="text-admin-table-text">Cliente (opcional)</Label>
                  <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={clientSearchOpen}
                        className="w-full justify-between bg-admin-content-bg border-admin-border text-admin-table-text"
                      >
                        {uploadData.userId
                          ? clients.find((client) => client.id === uploadData.userId)?.name
                          : "Selecione um cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0 bg-admin-content-bg border-admin-border">
                      <Command className="bg-admin-content-bg">
                        <CommandInput placeholder="Buscar cliente..." className="text-admin-table-text" />
                        <CommandList>
                          <CommandEmpty className="text-admin-muted-foreground py-6 text-center text-sm">
                            Nenhum cliente encontrado.
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value=""
                              onSelect={() => {
                                setUploadData(prev => ({ ...prev, userId: '' }));
                                setClientSearchOpen(false);
                              }}
                              className="text-admin-table-text"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  uploadData.userId === '' ? "opacity-100" : "opacity-0"
                                )}
                              />
                              Nenhum (documento geral)
                            </CommandItem>
                            {clients.map((client) => (
                              <CommandItem
                                key={client.id}
                                value={client.name}
                                onSelect={() => {
                                  setUploadData(prev => ({ ...prev, userId: client.id }));
                                  setClientSearchOpen(false);
                                }}
                                className="text-admin-table-text"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    uploadData.userId === client.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{client.name}</span>
                                  <span className="text-xs text-admin-muted-foreground">{client.email}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label className="text-admin-table-text">Categoria</Label>
                  <Select 
                    value={uploadData.category} 
                    onValueChange={(value) => setUploadData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-admin-content-bg border-admin-border">
                      {categories.map(category => (
                        <SelectItem key={category.value} value={category.value} className="text-admin-table-text">
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-admin-table-text">Arquivo</Label>
                  <Input
                    type="file"
                    onChange={(e) => setUploadData(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                    className="bg-admin-content-bg border-admin-border text-admin-table-text"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <p className="text-xs text-admin-muted-foreground mt-1">
                    Formatos aceitos: PDF, DOC, DOCX, JPG, PNG, GIF. Máximo: 10MB
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setUploadDialogOpen(false)}
                    className="text-admin-table-text border-admin-border"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-admin-table-text">Buscar por nome</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-admin-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome do arquivo..."
                    className="pl-10 bg-admin-content-bg border-admin-border text-admin-table-text"
                  />
                </div>
              </div>

              <div>
                <Label className="text-admin-table-text">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-admin-content-bg border-admin-border text-admin-table-text">
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent className="bg-admin-content-bg border-admin-border">
                    <SelectItem value="all" className="text-admin-table-text">Todas as categorias</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value} className="text-admin-table-text">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-admin-table-text">ID do Usuário</Label>
                <Input
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  placeholder="Filtrar por usuário..."
                  className="bg-admin-content-bg border-admin-border text-admin-table-text"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <Card className="bg-admin-content-bg border-admin-border">
          <CardHeader>
            <CardTitle className="text-admin-table-text">
              Documentos ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded bg-gray-800" />
                    <Skeleton className="h-4 w-1/3 bg-gray-800" />
                    <Skeleton className="h-4 w-1/4 bg-gray-800" />
                    <Skeleton className="h-4 w-1/5 bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center text-admin-muted-foreground py-8">
                Nenhum documento encontrado
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((document) => {
                  const FileIconComponent = getFileIcon(document.file_type);
                  return (
                    <div key={document.id} className="border border-admin-border rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FileIconComponent className="h-8 w-8 text-admin-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-admin-table-text truncate">
                              {document.file_name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(document.category)}
                              </Badge>
                              <span className="text-xs text-admin-muted-foreground">
                                {formatFileSize(document.file_size)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-admin-muted-foreground">
                        <div>
                          <span className="font-medium">Cliente:</span> {document.user?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Enviado por:</span> {document.uploader?.name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span>{' '}
                          {format(new Date(document.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(document.file_path, document.file_name)}
                          className="text-admin-muted-foreground hover:text-admin-table-text"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(document)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Documentos;