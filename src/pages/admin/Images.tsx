import React, { useState, useEffect } from 'react';
import { Images as ImagesIcon, FolderPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageUpload from '@/components/ui/image-upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface StorageImage {
  url: string;
  path: string;
  name: string;
  folder: string;
}

const Images = () => {
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('todos');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const { data, error } = await supabase.storage
        .from('site-images')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      const imageUrls: StorageImage[] = [];
      
      if (data) {
        for (const file of data) {
          if (file.name && file.name !== '.emptyFolderPlaceholder') {
            const { data: { publicUrl } } = supabase.storage
              .from('site-images')
              .getPublicUrl(file.name);
            
            const folder = file.name.includes('/') ? file.name.split('/')[0] : 'raiz';
            
            imageUrls.push({
              url: publicUrl,
              path: file.name,
              name: file.name.split('/').pop() || file.name,
              folder
            });
          }
        }
      }

      setImages(imageUrls);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
      toast.error('Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploaded = (url: string, path: string) => {
    const folder = path.includes('/') ? path.split('/')[0] : 'raiz';
    const name = path.split('/').pop() || path;
    
    setImages(prev => [{
      url,
      path,
      name,
      folder
    }, ...prev]);
  };

  const handleImageDeleted = (path: string) => {
    setImages(prev => prev.filter(img => img.path !== path));
  };

  const folders = ['todos', ...Array.from(new Set(images.map(img => img.folder)))];
  
  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'todos' || img.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <ImagesIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestão de Imagens</h1>
        </div>
        <div className="text-center py-8">
          <p>Carregando imagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ImagesIcon className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestão de Imagens</h1>
        </div>
      </div>

      <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-1">
            {folders.slice(0, 4).map((folder) => (
              <TabsTrigger key={folder} value={folder} className="capitalize">
                {folder === 'todos' ? 'Todas' : folder}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5" />
                Enviar Nova Imagem
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onImageDeleted={handleImageDeleted}
                folder="geral"
                maxSizeKB={10240} // 10MB
              />
            </CardContent>
          </Card>

          {/* Folders Management */}
          <Card>
            <CardHeader>
              <CardTitle>Organização por Pastas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Hero/Banner</h4>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    onImageDeleted={handleImageDeleted}
                    folder="hero"
                    maxSizeKB={5120}
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Logos</h4>
                  <ImageUpload
                    onImageUploaded={handleImageUploaded}
                    onImageDeleted={handleImageDeleted}
                    folder="logos"
                    maxSizeKB={2048}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Images Display */}
        <TabsContent value={selectedFolder} className="space-y-4">
          {filteredImages.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <ImagesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhuma imagem encontrada com este termo' : 'Nenhuma imagem encontrada'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  Imagens {selectedFolder !== 'todos' && `- ${selectedFolder}`} ({filteredImages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  existingImages={filteredImages}
                  onImageDeleted={handleImageDeleted}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Images;