
import React, { useState } from 'react';
import { Search, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold text-xl">
              G
            </div>
            <span className="text-white font-bold text-xl">Globoplay</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-white transition-colors">
              Início
            </Link>
            <Link to="#" className="text-gray-300 hover:text-white transition-colors">
              Filmes
            </Link>
            <Link to="#" className="text-gray-300 hover:text-white transition-colors">
              Séries
            </Link>
            <Link to="#" className="text-gray-300 hover:text-white transition-colors">
              Novelas
            </Link>
            <Link to="#" className="text-gray-300 hover:text-white transition-colors">
              Esportes
            </Link>
          </nav>

          {/* Search and User */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Search className="h-5 w-5" />
            </button>
            
            {user ? (
              <Link 
                to="/dashboard" 
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:block">{user.name}</span>
              </Link>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Entrar
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-800 py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                Início
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white transition-colors">
                Filmes
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white transition-colors">
                Séries
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white transition-colors">
                Novelas
              </Link>
              <Link to="#" className="text-gray-300 hover:text-white transition-colors">
                Esportes
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
