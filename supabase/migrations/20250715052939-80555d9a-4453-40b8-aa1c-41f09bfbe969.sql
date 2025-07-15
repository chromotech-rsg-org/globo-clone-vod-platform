-- Create content_sections table for managing carousel sections
CREATE TABLE public.content_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('horizontal', 'vertical')),
  page TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create content_items table for managing individual content items
CREATE TABLE public.content_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT,
  category TEXT,
  rating TEXT,
  section_id UUID REFERENCES public.content_sections(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Create policies for content_sections
CREATE POLICY "Admins can manage content sections" 
ON public.content_sections 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

CREATE POLICY "Content sections are viewable by everyone" 
ON public.content_sections 
FOR SELECT 
USING (active = true);

-- Create policies for content_items
CREATE POLICY "Admins can manage content items" 
ON public.content_items 
FOR ALL 
USING (get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

CREATE POLICY "Content items are viewable by everyone" 
ON public.content_items 
FOR SELECT 
USING (active = true);

-- Create triggers for updated_at
CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON public.content_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON public.content_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default content sections
INSERT INTO public.content_sections (title, type, page, order_index) VALUES
('Em alta', 'horizontal', 'home', 1),
('Novelas', 'vertical', 'home', 2),
('Séries Originais HBO', 'horizontal', 'home', 3),
('Filmes em Destaque', 'horizontal', 'home', 4);

-- Insert default content items
WITH sections AS (
  SELECT id, title FROM public.content_sections WHERE page = 'home'
)
INSERT INTO public.content_items (title, image_url, category, rating, section_id, order_index)
SELECT 
  items.title,
  items.image_url,
  items.category,
  items.rating,
  sections.id,
  items.order_index
FROM sections,
(VALUES 
  ('The Last of Us', 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=800&h=450&fit=crop', 'Série Original HBO', '16', 1, 'Em alta'),
  ('House of the Dragon', 'https://images.unsplash.com/photo-1518329127034-7ed764527b8e?w=800&h=450&fit=crop', 'Série Original HBO', '16', 2, 'Em alta'),
  ('Succession', 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=800&h=450&fit=crop', 'Série Original HBO', '14', 3, 'Em alta'),
  ('Terra e Paixão', 'https://images.unsplash.com/photo-1560169897-fc0cdbdfa4d5?w=400&h=600&fit=crop', 'Novela das 9', 'L', 1, 'Novelas'),
  ('Travessia', 'https://images.unsplash.com/photo-1489599135113-5ac34e8e2e3c?w=400&h=600&fit=crop', 'Novela das 9', '10', 2, 'Novelas'),
  ('Vai na Fé', 'https://images.unsplash.com/photo-1518329127034-7ed764527b8e?w=400&h=600&fit=crop', 'Novela das 7', 'L', 3, 'Novelas')
) AS items(title, image_url, category, rating, order_index, section_title)
WHERE sections.title = items.section_title;