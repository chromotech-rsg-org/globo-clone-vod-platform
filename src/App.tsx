import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from 'react-error-boundary';
import AuctionHome from './pages/auction/AuctionHome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Admin from './pages/admin/Admin';
import Checkout from './pages/Checkout';
import Terms from './pages/Terms';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <div className="min-h-screen bg-background text-foreground">
              <Routes>
                <Route path="/" element={<AuctionHome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/admin/*" element={<Admin />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
              <Toaster />
            </div>
          </ErrorBoundary>
        </QueryClientProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
