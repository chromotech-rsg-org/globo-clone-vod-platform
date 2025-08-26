import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import RegistrationForm from './components/auth/RegistrationForm';
import Dashboard from './pages/Dashboard';
import Subscription from './pages/Subscription';
import Header from './components/Header';
import AuctionList from './pages/AuctionList';
import AuctionDetails from './pages/AuctionDetails';
import CheckoutPage from './pages/CheckoutPage';
import AdminRoute from './components/AdminRoute';
import UserList from './components/admin/UserList';
import CustomizationList from './components/admin/CustomizationList';
import TermsAcceptance from './pages/TermsAcceptance';
import { Toast } from '@/components/ui/toast';
import { Toaster } from '@/components/ui/toaster';
import { useCustomizationTheme } from '@/hooks/useCustomizationTheme';

const AppContent = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Apply customization theme
  useCustomizationTheme();

  // Redirect to login if not authenticated
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando...</div>;
  }

  if (!user && location.pathname !== '/login' && location.pathname !== '/register') {
    return <Navigate to="/login" replace />;
  }

  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegistrationForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/" element={<AuctionList />} />
          <Route path="/auctions/:auctionId" element={<AuctionDetails />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/terms" element={<TermsAcceptance />} />

          {/* Admin Routes */}
          <Route path="/admin/users" element={<AdminRoute><UserList /></AdminRoute>} />
          <Route path="/admin/customizations" element={<AdminRoute><CustomizationList /></AdminRoute>} />
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
