import React, { useState, useEffect } from 'react';
import { Images as ImagesIcon, FolderPlus, Search, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageUpload from '@/components/ui/image-upload';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


interface StorageImage {
  url: string;
  path: string;
  name: string;
  folder: string;
}

interface SiteImageMapping {
  key: string;
  label: string;
  section: string;
  elementKey: string;
  currentUrl: string;
}

const Images = () => {
  const [images, setImages] = useState<StorageImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('todos');
  const [selectedImageMapping, setSelectedImageMapping] = useState<SiteImageMapping | null>(null);
  const [siteImages, setSiteImages] = useState<Record<string, string>>({});

  const imageMappings: SiteImageMapping[] = [
    {
      key: 'hero_background_image',
      label: 'Imagem de Fundo do Hero',
      section: 'hero',
      elementKey: 'background_image',
      currentUrl: ''
    },
    {
      key: 'header_logo_image',
      label: 'Logo do Cabeçalho',
      section: 'header',
      elementKey: 'logo_image',
      currentUrl: ''
    },
    {
      key: 'footer_logo_image',
      label: 'Logo do Rodapé',
      section: 'footer',
      elementKey: 'logo_image',
      currentUrl: ''
    },
    {
      key: 'login_background_image',
      label: 'Imagem de Fundo do Login',
      section: 'login',
      elementKey: 'background_image',
      currentUrl: ''
    }
  ];

  useEffect(() => {
    fetchImages();
    fetchSiteImages();
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

  const fetchSiteImages = async () => {
    try {
      const { data, error } = await supabase
        .from('customizations')
        .select('*')
        .eq('active', true)
        .eq('element_type', 'image');

      if (error) throw error;

      const siteImagesMap: Record<string, string> = {};
      data?.forEach((item) => {
        const key = `${item.section}_${item.element_key}`;
        if (item.element_value) {
          siteImagesMap[key] = item.element_value;
        }
      });

      setSiteImages(siteImagesMap);
    } catch (error) {
      console.error('Erro ao carregar imagens do site:', error);
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

  const saveImageToSite = async (imageUrl: string) => {
    if (!selectedImageMapping) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Check if customization exists
      const { data: existing, error: selectError } = await supabase
        .from('customizations')
        .select('id')
        .eq('page', selectedImageMapping.section === 'login' ? 'login' : 'home')
        .eq('section', selectedImageMapping.section)
        .eq('element_key', selectedImageMapping.elementKey)
        .maybeSingle();

      if (selectError) throw selectError;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('customizations')
          .update({
            element_value: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new
        const customizationData = {
          page: selectedImageMapping.section === 'login' ? 'login' : 'home',
          section: selectedImageMapping.section,
          element_type: 'image',
          element_key: selectedImageMapping.elementKey,
          element_value: imageUrl,
          active: true
        };

        const { error } = await supabase
          .from('customizations')
          .insert(customizationData);

        if (error) throw error;
      }

      setSiteImages(prev => ({ ...prev, [selectedImageMapping.key]: imageUrl }));
      setSelectedImageMapping(null);
      
      toast.success('Imagem do site atualizada com sucesso!');
    } catch (error: any) {
      let errorMessage = "Não foi possível atualizar a imagem do site";
      if (error.message === 'Usuário não autenticado') {
        errorMessage = "Você precisa estar logado para realizar esta ação";
      }
      
      toast.error(errorMessage);
    }
  };

  const folders = ['todos', ...Array.from(new Set(images.map(img => img.folder)))];
  
  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'todos' || img.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  if (loading) {
    return (
        <div className="p-6">
          <div className="text-white">Carregando...</div>
        </div>
    );
  }

  return (
    <>
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold text-white">Gestão de Imagens</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Site Images Management */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Imagens do Site</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {imageMappings.map((mapping) => (
                <div key={mapping.key} className="space-y-2">
                  <label className="text-gray-300 text-sm">{mapping.label}</label>
                  <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                    {siteImages[mapping.key] ? (
                      <img 
                        src={siteImages[mapping.key]} 
                        alt={mapping.label}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-600 rounded flex items-center justify-center mb-2">
                        <ImagesIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setSelectedImageMapping(mapping)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      Alterar Imagem
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={selectedFolder} onValueChange={setSelectedFolder} className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-1 bg-gray-700">
              {folders.slice(0, 4).map((folder) => (
                <TabsTrigger key={folder} value={folder} className="capitalize text-gray-300">
                  {folder === 'todos' ? 'Todas' : folder}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar imagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64 bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Organização por Pastas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Hero/Banner</h4>
                    <ImageUpload
                      onImageUploaded={handleImageUploaded}
                      onImageDeleted={handleImageDeleted}
                      folder="hero"
                      maxSizeKB={5120}
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-gray-300">Logos</h4>
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
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-8">
                  <ImagesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchTerm ? 'Nenhuma imagem encontrada com este termo' : 'Nenhuma imagem encontrada'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">
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

      {/* Image Selection Dialog */}
      <Dialog open={!!selectedImageMapping} onOpenChange={() => setSelectedImageMapping(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Selecionar Imagem - {selectedImageMapping?.label}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-gray-300">
              Selecione uma imagem abaixo ou faça upload de uma nova:
            </div>
            
            {/* Upload Section in Dialog */}
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white text-sm">Upload Nova Imagem</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  onImageUploaded={(url, path) => {
                    handleImageUploaded(url, path);
                    saveImageToSite(url);
                  }}
                  folder="site"
                  maxSizeKB={5120}
                />
              </CardContent>
            </Card>
            
            {/* Existing Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div key={image.path} className="bg-gray-700 rounded-lg p-2">
                  <img 
                    src={image.url} 
                    alt={image.name}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <p className="text-gray-300 text-xs truncate mb-2">{image.name}</p>
                  <Button
                    size="sm"
                    onClick={() => saveImageToSite(image.url)}
                    className="w-full bg-red-600 hover:bg-red-700 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Usar esta
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Images;
