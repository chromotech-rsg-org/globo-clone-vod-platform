-- Atualizar a constraint para permitir mais tipos de elemento
ALTER TABLE customizations DROP CONSTRAINT customizations_element_type_check;

-- Adicionar nova constraint com tipos adicionais
ALTER TABLE customizations ADD CONSTRAINT customizations_element_type_check 
CHECK (element_type = ANY (ARRAY['image'::text, 'text'::text, 'color'::text, 'logo'::text, 'favicon'::text, 'textarea'::text, 'number'::text, 'slider'::text, 'json'::text]));