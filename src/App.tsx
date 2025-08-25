
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import UserHeader from "./components/UserHeader";

// Pages
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import Subscription from "./pages/Subscription";
import NotFound from "./pages/NotFound";
import TermsAndConditions from "./pages/TermsAndConditions";

// Admin Pages
import AdminLayout from "./components/AdminLayout";
import Users from "./pages/admin/Users";
import Plans from "./pages/admin/Plans";
import Packages from "./pages/admin/Packages";
import Coupons from "./pages/admin/Coupons";
import Subscriptions from "./pages/admin/Subscriptions";
import Customization from "./pages/admin/Customization";
import Customizations from "./pages/admin/Customizations";
import HeroSlider from "./pages/admin/HeroSlider";
import Content from "./pages/admin/Content";
import Images from "./pages/admin/Images";

// Auction Pages
import Auctions from "./pages/admin/Auctions";
import Bids from "./pages/admin/Bids";
import Registrations from "./pages/admin/Registrations";
import AuctionHome from "./pages/auction/AuctionHome";
import AuctionRoom from "./pages/auction/AuctionRoom";
import AuctionDashboard from "./pages/auction/AuctionDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <UserHeader />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/home" element={<Home />} />
              <Route path="/termos-e-condicoes" element={<TermsAndConditions />} />
              
              {/* Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/subscription"
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                }
              />

              {/* Auction Routes */}
              <Route
                path="/leiloes"
                element={
                  <ProtectedRoute>
                    <AuctionHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leiloes/:id"
                element={
                  <ProtectedRoute>
                    <AuctionRoom />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leiloes-dashboard"
                element={
                  <ProtectedRoute>
                    <AuctionDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requireRole={['admin', 'desenvolvedor']}>
                    <AdminLayout>
                      <Routes>
                        <Route path="usuarios" element={<Users />} />
                        <Route path="planos" element={<Plans />} />
                        <Route path="pacotes" element={<Packages />} />
                        <Route path="cupons" element={<Coupons />} />
                        <Route path="assinaturas" element={<Subscriptions />} />
                        <Route path="personalizacao" element={<Customization />} />
                        <Route path="customizations" element={<Customizations />} />
                        <Route path="hero-slider" element={<HeroSlider />} />
                        <Route path="conteudo" element={<Content />} />
                        <Route path="imagens" element={<Images />} />
                        <Route path="leiloes" element={<Auctions />} />
                        <Route path="lances" element={<Bids />} />
                        <Route path="habilitacoes" element={<Registrations />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
