import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ui/image-upload';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useHeroSlider } from '@/hooks/useHeroSlider';

const HeroSliderEditor = () => {
  const {
    slides,
    autoplayDuration,
    setAutoplayDuration,
    addSlide,
    removeSlide,
    updateSlide,
    saveSlides,
    saving
  } = useHeroSlider();

  const handleSave = async () => {
    const result = await saveSlides();
    if (result.success) {
      toast.success('Configurações do slider salvas com sucesso!');
    } else {
      toast.error(result.error || 'Erro ao salvar configurações do slider');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Slider</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="autoplay">Duração do Autoplay (ms)</Label>
            <Input
              id="autoplay"
              type="number"
              value={autoplayDuration}
              onChange={(e) => setAutoplayDuration(e.target.value)}
              placeholder="5000"
            />
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Slides ({slides.length})</h3>
        <Button 
          onClick={addSlide}
          variant="outline"
          disabled={saving}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Slide
        </Button>
      </div>

      <div className="grid gap-6">
        {slides.map((slide, index) => (
          <Card key={slide.id} className="relative">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Slide {index + 1}</CardTitle>
              {slides.length > 1 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeSlide(slide.id)}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={slide.title}
                    onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                    placeholder="Título do slide"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <Label>Subtítulo</Label>
                  <Input
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                    placeholder="Subtítulo do slide"
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={slide.description}
                    onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                    placeholder="Descrição do slide"
                    rows={3}
                    disabled={saving}
                  />
                </div>
                
                <div>
                  <Label>Texto do Botão</Label>
                  <Input
                    value={slide.buttonText}
                    onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                    placeholder="Texto do botão"
                    disabled={saving}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Imagem de Fundo</Label>
                  <ImageUpload
                    onImageUploaded={(url) => updateSlide(slide.id, 'image', url)}
                    folder="hero-slides"
                  />
                  {slide.image && (
                    <div className="mt-2 text-sm text-gray-600">
                      Imagem atual: {slide.image.substring(0, 50)}...
                    </div>
                  )}
                </div>
                
                {slide.image && (
                  <div>
                    <Label>Preview</Label>
                    <div className="aspect-video bg-cover bg-center rounded-lg border" 
                         style={{ backgroundImage: `url(${slide.image})` }}>
                      <div className="h-full bg-black/50 rounded-lg flex items-center justify-center">
                        <div className="text-center text-white p-4">
                          <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                          <p className="text-sm mb-2">{slide.subtitle}</p>
                          <p className="text-xs mb-4">{slide.description}</p>
                          <div className="inline-block bg-white text-black px-4 py-2 rounded">
                            {slide.buttonText}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HeroSliderEditor;