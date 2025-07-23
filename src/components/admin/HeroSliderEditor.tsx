import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from '@/components/ui/image-upload';
import { Save, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAdminCustomizations } from '@/hooks/useAdminCustomizations';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
}

const HeroSliderEditor = () => {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [autoplayDuration, setAutoplayDuration] = useState('5000');
  const { getCustomization, saveCustomization } = useAdminCustomizations();
  const { toast } = useToast();

  useEffect(() => {
    // Load existing slides from corrected key
    const slideImages = getCustomization('slider_images', '');
    const duration = getCustomization('slider_autoplay_duration', '5000');
    
    setAutoplayDuration(duration);
    
    if (slideImages) {
      try {
        const parsedSlides = JSON.parse(slideImages);
        if (Array.isArray(parsedSlides) && parsedSlides.length > 0) {
          setSlides(parsedSlides);
        } else {
          // Initialize with default slide
          setSlides([{
            id: '1',
            image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
            title: 'The Last of Us',
            subtitle: 'SÉRIE ORIGINAL HBO',
            description: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
            buttonText: 'Assistir'
          }]);
        }
      } catch (error) {
        console.error('Error parsing slider images:', error);
        // Initialize with default slide
        setSlides([{
          id: '1',
          image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
          title: 'The Last of Us',
          subtitle: 'SÉRIE ORIGINAL HBO',
          description: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
          buttonText: 'Assistir'
        }]);
      }
    } else {
      // Initialize with default slide
      setSlides([{
        id: '1',
        image: 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=1920&h=1080&fit=crop',
        title: 'The Last of Us',
        subtitle: 'SÉRIE ORIGINAL HBO',
        description: 'Em um futuro pós-apocalíptico, Joel e Ellie precisam sobreviver em um mundo devastado por uma infecção que transforma humanos em criaturas.',
        buttonText: 'Assistir'
      }]);
    }
  }, [getCustomization]);

  const addSlide = () => {
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      image: '',
      title: 'Novo Slide',
      subtitle: 'Subtítulo',
      description: 'Descrição do novo slide...',
      buttonText: 'Assistir'
    };
    setSlides([...slides, newSlide]);
  };

  const removeSlide = (slideId: string) => {
    setSlides(slides.filter(slide => slide.id !== slideId));
  };

  const updateSlide = (slideId: string, field: keyof HeroSlide, value: string) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, [field]: value } : slide
    ));
  };

  const saveSliderSettings = async () => {
    try {
      // Save slides
      const slidesResult = await saveCustomization(
        'slider_images', 
        JSON.stringify(slides), 
        'hero', 
        'text'
      );

      // Save autoplay duration
      const durationResult = await saveCustomization(
        'slider_autoplay_duration',
        autoplayDuration,
        'hero',
        'text'
      );

      if (slidesResult.success && durationResult.success) {
        toast({
          title: "Sucesso",
          description: "Configurações do slider salvos com sucesso!"
        });
      } else {
        throw new Error(slidesResult.error || durationResult.error);
      }
    } catch (error) {
      console.error('Error saving slider settings:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações do slider.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="bg-admin-card border-admin-border">
      <CardHeader>
        <CardTitle className="text-admin-foreground">Editor de Slider Hero</CardTitle>
        <p className="text-sm text-admin-muted-foreground">
          Configure múltiplas imagens e conteúdo para o banner principal
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Autoplay Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-admin-foreground">Duração do Autoplay (ms)</Label>
            <Input
              type="number"
              value={autoplayDuration}
              onChange={(e) => setAutoplayDuration(e.target.value)}
              className="bg-admin-input border-admin-border text-admin-foreground"
              placeholder="5000"
            />
            <p className="text-xs text-admin-muted-foreground mt-1">
              Tempo em milissegundos entre slides (0 = desabilitar)
            </p>
          </div>
          <div className="flex items-end">
            <Button
              onClick={saveSliderSettings}
              variant="admin"
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* Slides List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-admin-foreground font-medium">
              Slides ({slides.length})
            </h3>
            <Button
              onClick={addSlide}
              variant="outline"
              size="sm"
              className="border-admin-border text-admin-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Slide
            </Button>
          </div>

          {slides.map((slide, index) => (
            <Card key={slide.id} className="bg-admin-muted border-admin-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-admin-muted-foreground" />
                    <span className="text-admin-foreground font-medium">
                      Slide {index + 1}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {slide.image ? 'Com imagem' : 'Sem imagem'}
                    </Badge>
                  </div>
                  {slides.length > 1 && (
                    <Button
                      onClick={() => removeSlide(slide.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-admin-foreground">Título</Label>
                    <Input
                      value={slide.title}
                      onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                      placeholder="Título do slide"
                    />
                  </div>
                  <div>
                    <Label className="text-admin-foreground">Subtítulo</Label>
                    <Input
                      value={slide.subtitle}
                      onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                      className="bg-admin-input border-admin-border text-admin-foreground"
                      placeholder="Subtítulo/categoria"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-admin-foreground">Descrição</Label>
                  <Textarea
                    value={slide.description}
                    onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                    className="bg-admin-input border-admin-border text-admin-foreground"
                    placeholder="Descrição detalhada do conteúdo..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-admin-foreground">Texto do Botão</Label>
                  <Input
                    value={slide.buttonText}
                    onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                    className="bg-admin-input border-admin-border text-admin-foreground"
                    placeholder="Assistir"
                  />
                </div>

                <div>
                  <Label className="text-admin-foreground">Imagem de Fundo</Label>
                  {slide.image && (
                    <div className="mb-2">
                      <img 
                        src={slide.image} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded border border-admin-border"
                      />
                    </div>
                  )}
                  <ImageUpload
                    onImageUploaded={(url) => updateSlide(slide.id, 'image', url)}
                    folder="hero-slider"
                    maxSizeKB={10240}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeroSliderEditor;