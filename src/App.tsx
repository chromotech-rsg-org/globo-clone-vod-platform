
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPackages from "./pages/admin/Packages";
import AdminPlans from "./pages/admin/Plans";
import AdminCoupons from "./pages/admin/Coupons";
import AdminCustomization from "./pages/admin/Customization";
import AdminHeroSlider from "./pages/admin/HeroSlider";
import AdminContent from "./pages/admin/Content";
import AdminImages from "./pages/admin/Images";
import NotFound from "./pages/NotFound";
import { useSiteTitle } from "./hooks/useSiteTitle";

const queryClient = new QueryClient();

function AppContent() {
  useSiteTitle();

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
          <Dashboard />
        </ProtectedRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin/usuarios" element={
        <ProtectedRoute requiredRole="admin">
          <AdminUsers />
        </ProtectedRoute>
      } />
      <Route path="/admin/pacotes" element={
        <ProtectedRoute requiredRole="admin">
          <AdminPackages />
        </ProtectedRoute>
      } />
      <Route path="/admin/planos" element={
        <ProtectedRoute requiredRole="admin">
          <AdminPlans />
        </ProtectedRoute>
      } />
      <Route path="/admin/cupons" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCoupons />
        </ProtectedRoute>
      } />
      <Route path="/admin/personalizacao" element={
        <ProtectedRoute requiredRole="admin">
          <AdminCustomization />
        </ProtectedRoute>
      } />
      <Route path="/admin/hero-slider" element={
        <ProtectedRoute requiredRole="admin">
          <AdminHeroSlider />
        </ProtectedRoute>
      } />
      <Route path="/admin/conteudo" element={
        <ProtectedRoute requiredRole="admin">
          <AdminContent />
        </ProtectedRoute>
      } />
      <Route path="/admin/imagens" element={
        <ProtectedRoute requiredRole="admin">
          <AdminImages />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
