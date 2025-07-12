import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StorageImage {
  url: string;
  path: string;
  name: string;
  folder: string;
}

export const useStorageImages = (folder?: string) => {
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImages();
  }, [folder]);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('site-images')
        .list(folder || '', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const imageUrls: StorageImage[] = [];
      
      if (data) {
        for (const file of data) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const filePath = folder ? `${folder}/${file.name}` : file.name;
            const { data: { publicUrl } } = supabase.storage
              .from('site-images')
              .getPublicUrl(filePath);
            
            const itemFolder = filePath.includes('/') ? filePath.split('/')[0] : 'raiz';
            
            imageUrls.push({
              url: publicUrl,
              path: filePath,
              name: file.name,
              folder: itemFolder
            });
          }
        }
      }

      setImages(imageUrls);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imageName: string) => {
    const image = images.find(img => img.name === imageName || img.path === imageName);
    return image?.url || null;
  };

  const getImagesByFolder = (folderName: string) => {
    return images.filter(img => img.folder === folderName);
  };

  return {
    images,
    loading,
    getImageUrl,
    getImagesByFolder,
    refetch: fetchImages
  };
};