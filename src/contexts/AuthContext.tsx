
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  role: 'user' | 'admin' | 'desenvolvedor';
  subscription?: {
    plan: string;
    status: 'active' | 'inactive';
    expiresAt: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isLoading: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  cpf: string;
  phone: string;
  plan: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Mock login - in real app, this would be an API call
      const mockUsers = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@globoplay.com',
          cpf: '123.456.789-00',
          phone: '(11) 99999-9999',
          role: 'admin' as const,
          password: '123456'
        },
        {
          id: '2',
          name: 'User Test',
          email: 'user@test.com',
          cpf: '987.654.321-00',
          phone: '(11) 88888-8888',
          role: 'user' as const,
          password: '123456',
          subscription: {
            plan: 'Globoplay Premiere',
            status: 'active' as const,
            expiresAt: '2024-12-31'
          }
        }
      ];

      const foundUser = mockUsers.find(u => u.email === email && u.password === password);
      if (!foundUser) {
        throw new Error('Credenciais inválidas');
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setIsLoading(true);
    try {
      // Mock registration - in real app, this would be an API call
      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        role: 'user',
        subscription: {
          plan: userData.plan,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      };

      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
