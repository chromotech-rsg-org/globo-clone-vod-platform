
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPackages from "./pages/admin/Packages";
import AdminPlans from "./pages/admin/Plans";
import AdminSubscriptions from "./pages/admin/Subscriptions";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCustomization from "./pages/admin/Customization";
import AdminHeroSlider from "./pages/admin/HeroSlider";
import AdminContent from "./pages/admin/Content";
import AdminImages from "./pages/admin/Images";
import AdminAuctions from "./pages/admin/Auctions";
import AdminRegistrations from "./pages/admin/Registrations";
import AdminBids from "./pages/admin/Bids";
import AuctionHome from "./pages/auction/AuctionHome";
import AuctionRoom from "./pages/auction/AuctionRoom";
import AuctionDashboard from "./pages/auction/AuctionDashboard";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import AdminLayout from "./components/AdminLayout";
import NotFound from "./pages/NotFound";
import { useSiteTitle } from "./hooks/useSiteTitle";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function AppContent() {
  useSiteTitle();

  // Apply favicon from customizations globally
  useEffect(() => {
    // Remove default favicon immediately to prevent showing Lovable logo
    const removeDefaultFavicons = () => {
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());
    };

    const applyFavicon = async () => {
      try {
        removeDefaultFavicons(); // Always remove first

        const { data } = await supabase
          .from('customizations')
          .select('element_value')
          .eq('element_key', 'favicon_image')
          .eq('active', true)
          .maybeSingle();

        if (data?.element_value) {
          // Add custom favicon
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.href = data.element_value;
          document.head.appendChild(link);
          
          console.log('Custom favicon applied:', data.element_value);
        }
      } catch (error) {
        console.log('No custom favicon found');
      }
    };

    // Remove default favicon immediately
    removeDefaultFavicons();
    
    // Then apply custom favicon
    applyFavicon();
    
    // Re-apply favicon on route changes
    const handleRouteChange = () => {
      setTimeout(applyFavicon, 100);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/checkout" element={
        <PublicRoute>
          <Checkout />
        </PublicRoute>
      } />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AdminLayout>
            <Profile />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/subscription" element={
        <ProtectedRoute>
          <AdminLayout>
            <Subscription />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Auction Routes - Corrigido */}
      <Route path="/auctions" element={
        <ProtectedRoute>
          <AuctionHome />
        </ProtectedRoute>
      } />
      <Route path="/auctions/:id" element={
        <ProtectedRoute>
          <AuctionRoom />
        </ProtectedRoute>
      } />
      <Route path="/auction-dashboard/:id" element={
        <ProtectedRoute requiredRole="admin">
          <AuctionDashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <Dashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/usuarios" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/pacotes" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminPackages />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/planos" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminPlans />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/assinaturas" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminSubscriptions />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/cupons" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminCoupons />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/personalizacao" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminCustomization />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/hero-slider" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminHeroSlider />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/conteudo" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminContent />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/imagens" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminImages />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/leiloes" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminAuctions />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/habilitacoes" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminRegistrations />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/lances" element={
        <ProtectedRoute requiredRole="admin">
          <AdminLayout>
            <AdminBids />
          </AdminLayout>
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
