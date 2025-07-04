
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'admin' | 'desenvolvedor';
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      userId: user?.id, 
      userRole: user?.role,
      requiredRole 
    });
  }, [isLoading, user, requiredRole]);

  if (isLoading) {
    console.log('ProtectedRoute - Still loading auth state');
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
    console.log('ProtectedRoute - No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'desenvolvedor') {
    console.log('ProtectedRoute - Insufficient role:', user.role, 'required:', requiredRole);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('ProtectedRoute - Access granted for user:', user.id, 'role:', user.role);
  return <>{children}</>;
};

export default ProtectedRoute;
