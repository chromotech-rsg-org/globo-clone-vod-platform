
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  console.log('PublicRoute - Current location:', location.pathname);
  console.log('PublicRoute - Auth state:', { isLoading, hasUser: !!user });

  if (isLoading) {
    console.log('PublicRoute - Loading auth state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se o usuário está logado e está tentando acessar login ou checkout, redireciona para dashboard
  if (user && (location.pathname === '/login' || location.pathname === '/checkout')) {
    console.log('PublicRoute - Authenticated user accessing public route, redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  // Para outras rotas públicas (como a home "/"), não redireciona automaticamente
  console.log('PublicRoute - Allowing access to public route');
  return <>{children}</>;
};

export default PublicRoute;
