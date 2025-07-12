import React, { useState, useRef } from 'react';
import { Upload, X, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  onImageUploaded?: (url: string, path: string) => void;
  onImageDeleted?: (path: string) => void;
  existingImages?: Array<{ url: string; path: string; name: string }>;
  folder?: string;
  maxSizeKB?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  onImageDeleted,
  existingImages = [],
  folder = '',
  maxSizeKB = 5120 // 5MB default
}) => {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState(existingImages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeKB * 1024) {
      toast.error(`Arquivo muito grande. Máximo permitido: ${maxSizeKB / 1024}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem válido');
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('site-images')
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-images')
        .getPublicUrl(data.path);

      const newImage = {
        url: publicUrl,
        path: data.path,
        name: file.name
      };

      setImages(prev => [...prev, newImage]);
      onImageUploaded?.(publicUrl, data.path);
      
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteImage = async (imagePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('site-images')
        .remove([imagePath]);

      if (error) throw error;

      setImages(prev => prev.filter(img => img.path !== imagePath));
      onImageDeleted?.(imagePath);
      toast.success('Imagem removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      toast.error('Erro ao remover imagem');
    }
  };

  const handlePreviewImage = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Clique para selecionar uma imagem ou arraste e solte aqui
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos aceitos: JPG, PNG, GIF, WEBP (Máximo: {maxSizeKB / 1024}MB)
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-4"
        >
          {uploading ? 'Enviando...' : 'Selecionar Imagem'}
        </Button>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Imagens Enviadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="border border-border rounded-lg overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate" title={image.name}>
                    {image.name}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewImage(image.url)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteImage(image.path)}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-2 rounded text-xs">
                    <p className="text-muted-foreground">URL:</p>
                    <input
                      type="text"
                      value={image.url}
                      readOnly
                      className="w-full bg-transparent text-xs border-none outline-none"
                      onClick={(e) => e.currentTarget.select()}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;