
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Eye } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';

interface CustomizationEditorProps {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'color' | 'image' | 'textarea';
  onChange: (value: string) => void;
  onSave: () => Promise<{ success: boolean; error?: string } | undefined>;
  loading?: boolean;
  placeholder?: string;
  description?: string;
}

export const CustomizationEditor: React.FC<CustomizationEditorProps> = ({
  id,
  label,
  value,
  type,
  onChange,
  onSave,
  loading = false,
  placeholder,
  description
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleSave = async () => {
    try {
      const result = await onSave();
      // Não resetar o valor local após salvar - deixar o useEffect do value fazer isso
      if (result && !result.success) {
        // Se deu erro, reverter para o valor original
        setLocalValue(value);
      }
    } catch (error) {
      // Se deu erro, reverter para o valor original
      setLocalValue(value);
    }
  };

  const handleInputChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleImageUpload = (url: string) => {
    setLocalValue(url);
    onChange(url);
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg p-4 space-y-3">
      <div className="space-y-1">
        <Label className="text-admin-foreground font-medium">{label}</Label>
        {description && (
          <p className="text-xs text-admin-muted-foreground">{description}</p>
        )}
      </div>
      
      {type === 'text' && (
        <div className="flex space-x-2">
          <Input
            id={id}
            value={localValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="bg-admin-input border-admin-border text-admin-foreground flex-1"
            placeholder={placeholder || label}
          />
          <Button
            onClick={handleSave}
            variant="admin"
            size="sm"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      )}

      {type === 'textarea' && (
        <div className="space-y-2">
          <Textarea
            id={id}
            value={localValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="bg-admin-input border-admin-border text-admin-foreground resize-none"
            placeholder={placeholder || label}
            rows={3}
          />
          <Button
            onClick={handleSave}
            variant="admin"
            size="sm"
            disabled={loading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      )}

      {type === 'color' && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              type="color"
              value={localValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="bg-admin-input border-admin-border w-16 h-10 p-1 rounded"
            />
            <Input
              value={localValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="bg-admin-input border-admin-border text-admin-foreground flex-1"
              placeholder="#000000"
            />
            <Button
            onClick={handleSave}
              variant="admin"
              size="sm"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
          {/* Preview da cor */}
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded border border-admin-border flex-shrink-0" 
              style={{ backgroundColor: localValue }}
              title={`Preview: ${label}`}
            />
            <div className="text-xs text-admin-muted-foreground flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </div>
          </div>
        </div>
      )}

      {type === 'image' && (
        <div className="space-y-3">
          {localValue && (
            <div className="bg-admin-muted rounded p-2">
              <div className="flex items-center space-x-2 mb-2">
                <Eye className="h-3 w-3 text-admin-muted-foreground" />
                <span className="text-xs text-admin-muted-foreground">Preview atual:</span>
              </div>
              <img 
                src={localValue} 
                alt={label} 
                className="w-full max-w-[200px] h-auto object-contain rounded" 
              />
            </div>
          )}
          <div className="space-y-2">
            <ImageUpload
              onImageUploaded={handleImageUpload}
              folder="customizations"
              maxSizeKB={5120}
            />
            {localValue && (
              <Button
                onClick={handleSave}
                variant="admin"
                size="sm"
                disabled={loading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Imagem
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
