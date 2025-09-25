
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { Auction } from '@/types/auction';

interface AuctionVideoPlayerProps {
  auction: Auction;
}

const AuctionVideoPlayer = ({ auction }: AuctionVideoPlayerProps) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&modestbranding=1`;
    }
    return url;
  };

  return (
    <Card className="bg-black border-green-600/30">
      <CardContent className="p-0">
        <div className="aspect-video bg-black rounded-t-lg overflow-hidden">
          {auction.broadcast_enabled !== false && auction.youtube_url ? (
            <iframe
              src={getYouTubeEmbedUrl(auction.youtube_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
              <div className="text-center px-8 py-12 max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <Play size={32} className="text-gray-400 ml-1" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Transmissão não disponível
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  A transmissão ao vivo não está ativa no momento, mas você pode continuar 
                  acompanhando todas as informações do leilão e lotes.
                </p>
                <div className="flex items-center justify-center space-x-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Leilão ativo</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {auction.name}
              </h1>
              {auction.description && (
                <div className="space-y-2">
                  <p 
                    className={`text-gray-300 leading-relaxed cursor-pointer transition-all duration-200 ${
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
            <div className="flex flex-col gap-2">
              <Badge 
                variant={auction.is_live ? "default" : "secondary"}
                className="flex items-center gap-1"
              >
                {auction.is_live ? <Play size={12} /> : <Square size={12} />}
                {auction.is_live ? 'AO VIVO' : 'GRAVADO'}
              </Badge>
              <Badge variant="outline" className="border-green-600/30 text-green-400">
                {auction.auction_type === 'rural' ? 'Rural' : 'Judicial'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuctionVideoPlayer;
