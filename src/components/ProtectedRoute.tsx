
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'desenvolvedor';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  console.log('ProtectedRoute - isLoading:', isLoading, 'user:', user?.id, 'requiredRole:', requiredRole);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-white">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'desenvolvedor') {
    console.log('User role insufficient:', user.role, 'required:', requiredRole);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('Access granted for user:', user.id);
  return <>{children}</>;
};

export default ProtectedRoute;
