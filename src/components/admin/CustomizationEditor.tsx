import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';

interface CustomizationEditorProps {
  id: string;
  label: string;
  value: string;
  type: 'text' | 'color' | 'image';
  onChange: (value: string) => void;
  onSave: () => void;
  loading?: boolean;
}

export const CustomizationEditor: React.FC<CustomizationEditorProps> = ({
  id,
  label,
  value,
  type,
  onChange,
  onSave,
  loading = false
}) => {
  const handleImageUpload = (url: string) => {
    onChange(url);
    onSave();
  };

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg p-4 space-y-3">
      <Label className="text-admin-foreground font-medium">{label}</Label>
      
      {type === 'text' && (
        <div className="flex space-x-2">
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-admin-input border-admin-border text-admin-foreground flex-1"
            placeholder={label}
          />
          <Button
            onClick={onSave}
            variant="admin"
            size="sm"
            disabled={loading}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
      )}

      {type === 'color' && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              type="color"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                onSave();
              }}
              className="bg-admin-input border-admin-border w-16 h-10 p-1 rounded"
            />
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="bg-admin-input border-admin-border text-admin-foreground flex-1"
              placeholder="#000000"
            />
            <Button
              onClick={onSave}
              variant="admin"
              size="sm"
              disabled={loading}
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
          {/* Preview da cor */}
          <div 
            className="w-full h-6 rounded border border-admin-border" 
            style={{ backgroundColor: value }}
            title={`Preview: ${label}`}
          />
        </div>
      )}

      {type === 'image' && (
        <div className="space-y-3">
          {value && (
            <div className="bg-admin-muted rounded p-2">
              <img 
                src={value} 
                alt={label} 
                className="w-full max-w-[200px] h-auto object-contain rounded" 
              />
            </div>
          )}
          <ImageUpload
            onImageUploaded={handleImageUpload}
            folder="admin"
            maxSizeKB={2048}
          />
        </div>
      )}
    </div>
  );
};