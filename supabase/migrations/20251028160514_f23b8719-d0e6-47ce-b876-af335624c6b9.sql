-- Adicionar coluna de orientação de imagem na tabela content_items
ALTER TABLE content_items 
ADD COLUMN IF NOT EXISTS image_orientation text DEFAULT 'vertical' CHECK (image_orientation IN ('vertical', 'horizontal'));