-- Create storage bucket for site images
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true);

-- Create policies for site images storage
CREATE POLICY "Site images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'site-images');

CREATE POLICY "Admins can upload site images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'site-images' AND get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

CREATE POLICY "Admins can update site images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'site-images' AND get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));

CREATE POLICY "Admins can delete site images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'site-images' AND get_current_user_role() = ANY (ARRAY['admin'::text, 'desenvolvedor'::text]));