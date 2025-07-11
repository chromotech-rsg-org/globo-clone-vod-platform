-- Create an admin user profile for testing
INSERT INTO public.profiles (id, name, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@globoplay.com',
  'admin'
) ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  updated_at = now();