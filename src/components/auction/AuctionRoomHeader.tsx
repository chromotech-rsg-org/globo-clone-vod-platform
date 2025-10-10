
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AuctionRoomHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b border-green-600/30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auctions')}
            className="flex items-center gap-2 bg-black border-white text-white hover:bg-white hover:text-black text-sm sm:text-base"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Voltar ao Painel</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
          
          <a
            href="https://portal.agroplay.tv.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-md transition-colors font-medium text-sm sm:text-base shadow-lg"
          >
            <span>Agroplay</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default AuctionRoomHeader;
