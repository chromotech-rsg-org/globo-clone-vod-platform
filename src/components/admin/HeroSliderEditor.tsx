import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ImageUpload from '@/components/ui/image-upload';
import { useHeroSlider } from '@/hooks/useHeroSlider';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus } from 'lucide-react';

const HeroSliderEditor = () => {
  const { 
    slides, 
    autoplayDuration, 
    setAutoplayDuration,
    addSlide,
    removeSlide,
    updateSlide,
    saveSlide,
    saveSettings,
    saving,
    isLoaded
  } = useHeroSlider();
  
  const { toast } = useToast();

  const handleSaveSettings = async () => {
    const result = await saveSettings();
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Configurações gerais salvas com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao salvar configurações",
        variant: "destructive",
      });
    }
  };

  const handleSaveSlide = async (slideId: string) => {
    const result = await saveSlide(slideId);
    if (result.success) {
      toast({
        title: "Sucesso",
        description: "Slide salvo com sucesso!",
      });
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao salvar slide",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-lg">Carregando dados do slider...</div>
          <div className="text-sm text-gray-500 mt-2">Aguarde um momento</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="autoplay">Duração do autoplay (ms)</Label>
            <Input
              id="autoplay"
              type="number"
              value={autoplayDuration}
              onChange={(e) => setAutoplayDuration(e.target.value)}
              placeholder="5000"
            />
          </div>
          <Button 
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Add New Slide Button */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Slide</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={addSlide}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Slide
          </Button>
        </CardContent>
      </Card>

      {/* Slides */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Slides do Carrossel</h3>
        {slides.map((slide, index) => (
          <Card key={slide.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Slide {index + 1}</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveSlide(slide.id)}
                  disabled={saving}
                  size="sm"
                >
                  Salvar Slide
                </Button>
                {slides.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeSlide(slide.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`title-${slide.id}`}>Título</Label>
                  <Input
                    id={`title-${slide.id}`}
                    value={slide.title}
                    onChange={(e) => updateSlide(slide.id, 'title', e.target.value)}
                    placeholder="Título do slide"
                  />
                </div>

                <div>
                  <Label htmlFor={`subtitle-${slide.id}`}>Subtítulo</Label>
                  <Input
                    id={`subtitle-${slide.id}`}
                    value={slide.subtitle}
                    onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)}
                    placeholder="Subtítulo do slide"
                  />
                </div>

                <div>
                  <Label htmlFor={`description-${slide.id}`}>Descrição</Label>
                  <Textarea
                    id={`description-${slide.id}`}
                    value={slide.description}
                    onChange={(e) => updateSlide(slide.id, 'description', e.target.value)}
                    placeholder="Descrição do slide"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor={`buttonText-${slide.id}`}>Texto do Botão</Label>
                  <Input
                    id={`buttonText-${slide.id}`}
                    value={slide.buttonText}
                    onChange={(e) => updateSlide(slide.id, 'buttonText', e.target.value)}
                    placeholder="Texto do botão"
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
                      Imagem carregada
                    </div>
                  )}
                </div>

                {slide.image && (
                  <div>
                    <Label>Preview</Label>
                    <div 
                      className="aspect-video bg-cover bg-center rounded-lg border relative overflow-hidden"
                      style={{ backgroundImage: `url(${slide.image})` }}
                    >
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white p-4">
                          <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                          <p className="text-sm mb-2">{slide.subtitle}</p>
                          <p className="text-xs mb-4 line-clamp-2">{slide.description}</p>
                          <div className="inline-block bg-white text-black px-4 py-2 rounded text-sm">
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