import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Auction, AuctionItem } from '@/types/auction';
import { Calendar, Clock, Package, ChevronDown, ChevronUp } from 'lucide-react';

interface AuctionHeaderProps {
  auction: Auction;
  lots: AuctionItem[];
}

const AuctionHeader = ({ auction, lots }: AuctionHeaderProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const activeLots = lots.filter(lot => lot.status === 'in_progress' || lot.is_current);
  const finishedLots = lots.filter(lot => lot.status === 'finished');
  const notStartedLots = lots.filter(lot => lot.status === 'not_started');

  return (
    <Card className="bg-black border-green-600/30">
      <CardContent className="p-6 bg-black">
        <div className="space-y-4">
          {/* Nome e Status do Leilão */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{auction.name}</h1>
              {auction.description && (
                <div className="space-y-2">
                  <p 
                    className={`text-gray-300 text-lg leading-relaxed cursor-pointer transition-all duration-200 ${
                      !isDescriptionExpanded 
                        ? 'line-clamp-1 hover:text-white' 
                        : ''
                    }`}
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  >
                    {auction.description}
                  </p>
                  {auction.description.length > 80 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="p-0 h-auto text-gray-400 hover:text-white text-sm"
                    >
                      {isDescriptionExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Mostrar menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Mostrar mais
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 ml-6">
              <Badge className={`${
                auction.status === 'active' && auction.is_live 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : auction.status === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {auction.status === 'active' && auction.is_live && '🔴'} 
                {auction.status === 'active' && auction.is_live ? 'AO VIVO' : 
                 auction.status === 'active' ? 'ATIVO' : 'INATIVO'}
              </Badge>
              <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-600">
                {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
              </Badge>
            </div>
          </div>

          {/* Informações de Data e Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Data de Início */}
            <div className="flex items-center gap-3 p-3 bg-black rounded-lg">
              <Calendar className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Início</p>
                <p className="text-white font-medium">
                  {auction.start_date 
                    ? new Date(auction.start_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Não definido'
                  }
                </p>
              </div>
            </div>

            {/* Data de Fim */}
            <div className="flex items-center gap-3 p-3 bg-black rounded-lg">
              <Clock className="h-5 w-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Encerramento</p>
                <p className="text-white font-medium">
                  {auction.end_date 
                    ? new Date(auction.end_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric', 
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Não definido'
                  }
                </p>
              </div>
            </div>

            {/* Estatísticas de Lotes */}
            <div className="flex items-center gap-3 p-3 bg-black rounded-lg">
              <Package className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Lotes</p>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{lots.length} total</span>
                  {activeLots.length > 0 && (
                    <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                      {activeLots.length} ativo
                    </Badge>
                  )}
                  {finishedLots.length > 0 && (
                    <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30 text-xs">
                      {finishedLots.length} finalizado
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionHeader;