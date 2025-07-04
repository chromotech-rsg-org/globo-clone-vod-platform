
-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  cpf text,
  phone text,
  role text DEFAULT 'user'::text
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Policy for admins to insert profiles
CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, cpf, phone, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'cpf', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create subscriptions table
CREATE TABLE public.subscriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id),
  plan_id uuid REFERENCES public.plans(id),
  status text DEFAULT 'active',
  start_date timestamp with time zone DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins to view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'desenvolvedor')
    )
  );
