
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import PublicRoute from '@/components/PublicRoute';
import ErrorBoundary from '@/components/ErrorBoundary';

// Page imports
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Checkout from '@/pages/Checkout';
import Subscription from '@/pages/Subscription';
import NotFound from '@/pages/NotFound';
import TermsAndConditions from '@/pages/TermsAndConditions';

// Admin pages
import AdminUsers from '@/pages/admin/Users';
import AdminPlans from '@/pages/admin/Plans';
import AdminPackages from '@/pages/admin/Packages';
import AdminSubscriptions from '@/pages/admin/Subscriptions';
import AdminCoupons from '@/pages/admin/Coupons';
import AdminCustomizations from '@/pages/admin/Customizations';
import AdminContent from '@/pages/admin/Content';
import AdminHeroSlider from '@/pages/admin/HeroSlider';
import AdminImages from '@/pages/admin/Images';
import AdminAuctions from '@/pages/admin/Auctions';
import AdminBids from '@/pages/admin/Bids';
import AdminRegistrations from '@/pages/admin/Registrations';

// Auction pages
import AuctionHome from '@/pages/auction/AuctionHome';
import AuctionRoom from '@/pages/auction/AuctionRoom';
import AuctionDashboard from '@/pages/auction/AuctionDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/termos-e-condicoes" element={<TermsAndConditions />} />
                
                {/* Auth routes */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                
                {/* Protected user routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
                
                {/* Auction routes */}
                <Route path="/leiloes" element={<ProtectedRoute><AuctionHome /></ProtectedRoute>} />
                <Route path="/leilao/:id" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />
                <Route path="/leilao/:id/dashboard" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AuctionDashboard /></ProtectedRoute>} />
                
                {/* Admin routes */}
                <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/planos" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminPlans /></ProtectedRoute>} />
                <Route path="/admin/pacotes" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminPackages /></ProtectedRoute>} />
                <Route path="/admin/assinaturas" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminSubscriptions /></ProtectedRoute>} />
                <Route path="/admin/cupons" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminCoupons /></ProtectedRoute>} />
                <Route path="/admin/personalizacao" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminCustomizations /></ProtectedRoute>} />
                <Route path="/admin/conteudo" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminContent /></ProtectedRoute>} />
                <Route path="/admin/slider" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminHeroSlider /></ProtectedRoute>} />
                <Route path="/admin/imagens" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminImages /></ProtectedRoute>} />
                <Route path="/admin/leiloes" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminAuctions /></ProtectedRoute>} />
                <Route path="/admin/lances" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminBids /></ProtectedRoute>} />
                <Route path="/admin/habilitacoes" element={<ProtectedRoute requiredRole={['admin', 'desenvolvedor']}><AdminRegistrations /></ProtectedRoute>} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
