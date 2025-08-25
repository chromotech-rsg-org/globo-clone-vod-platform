
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

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-destructive mb-4">Algo deu errado</h2>
        <p className="text-muted-foreground mb-4">Ocorreu um erro inesperado.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Recarregar página
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary fallbackRender={ErrorFallback}>
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
