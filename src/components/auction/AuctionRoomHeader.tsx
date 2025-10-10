
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AuctionRoomHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b border-green-600/30">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/auctions')}
          className="flex items-center gap-2 bg-black border-white text-white hover:bg-white hover:text-black text-sm sm:text-base"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Voltar ao Painel</span>
          <span className="sm:hidden">Voltar</span>
        </Button>
      </div>
    </header>
  );
};

export default AuctionRoomHeader;
