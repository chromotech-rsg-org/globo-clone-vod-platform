
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';
import Home from './pages/Home';
import Plans from './pages/Plans';
import { Toaster } from '@/components/ui/toaster';
import { useCustomizationTheme } from '@/hooks/useCustomizationTheme';

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Apply customization theme
  useCustomizationTheme();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Handle login form submission
  const handleLoginSubmit = async (email: string, password: string) => {
    // This will be handled by the LoginForm component internally
    // through the useAuth context
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="flex-1">
        <Routes>
          <Route 
            path="/login" 
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginForm 
                  onSubmit={handleLoginSubmit} 
                  isSubmitting={false} 
                />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? <Dashboard /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/subscription" 
            element={
              user ? <Subscription /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/plans" 
            element={<Plans />} 
          />
          <Route 
            path="/" 
            element={<Home />} 
          />
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
