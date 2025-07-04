
import { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  role: 'user' | 'admin' | 'desenvolvedor';
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<{ error: any }>;
  isLoading: boolean;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf?: string;
  phone?: string;
  plan?: string;
}
