
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AuctionRoomHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-black border-b border-green-600/30">
      <div className="px-6 py-4">
        <div className="flex items-center justify-start">
          <Button 
            variant="outline" 
            onClick={() => navigate('/auctions')}
            className="flex items-center gap-2 bg-black border-white text-white hover:bg-white hover:text-black"
          >
            <ArrowLeft size={16} />
            Voltar ao Painel
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AuctionRoomHeader;
