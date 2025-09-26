import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ClientDocument {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  category: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
    email: string;
  };
  uploader?: {
    name: string;
    email: string;
  };
}

const DOCUMENT_CATEGORIES = [
  { value: 'general', label: 'Geral' },
  { value: 'identification', label: 'Documentos de Identificação' },
  { value: 'financial', label: 'Documentos Financeiros' },
  { value: 'contracts', label: 'Contratos' },
  { value: 'receipts', label: 'Comprovantes' },
  { value: 'certificates', label: 'Certificados' },
  { value: 'others', label: 'Outros' }
];

export const useClientDocuments = (userId?: string) => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('client_documents')
        .select(`
          *,
          user:profiles!client_documents_user_id_fkey(name, email),
          uploader:profiles!client_documents_uploaded_by_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar os documentos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    targetUserId: string,
    category: string = 'general'
  ) => {
    try {
      setUploading(true);

      // Validar tamanho do arquivo (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Arquivo muito grande. Tamanho máximo: 10MB');
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${targetUserId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Salvar metadados no banco
      const { error: dbError } = await supabase
        .from('client_documents')
        .insert({
          user_id: targetUserId,
          file_path: fileName,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          category: category
        });

      if (dbError) throw dbError;

      toast({
        title: "Documento enviado",
        description: "Documento enviado com sucesso"
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Não foi possível enviar o documento",
        variant: "destructive"
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Error deleting file from storage:', storageError);
      }

      // Deletar registro do banco
      const { error: dbError } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Documento excluído",
        description: "Documento excluído com sucesso"
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o documento",
        variant: "destructive"
      });
      return false;
    }
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .download(filePath);

      if (error) throw error;

      // Criar URL de download
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download iniciado",
        description: "O download do documento foi iniciado"
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível fazer o download do documento",
        variant: "destructive"
      });
    }
  };

  const getDocumentUrl = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(filePath, 3600); // 1 hora

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const updateDocumentCategory = async (documentId: string, category: string) => {
    try {
      const { error } = await supabase
        .from('client_documents')
        .update({ category })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Categoria atualizada",
        description: "A categoria do documento foi atualizada"
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error updating document category:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a categoria",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [userId]);

  return {
    documents,
    loading,
    uploading,
    categories: DOCUMENT_CATEGORIES,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentUrl,
    updateDocumentCategory,
    refetch: fetchDocuments
  };
};