
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';
import Header from './components/Header';
import { Toaster } from '@/components/ui/toaster';
import { useCustomizationTheme } from '@/hooks/useCustomizationTheme';

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Apply customization theme
  useCustomizationTheme();

  // Redirect to login if not authenticated
  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  }

  if (!user && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  if (user && location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </main>
      <Toaster />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
