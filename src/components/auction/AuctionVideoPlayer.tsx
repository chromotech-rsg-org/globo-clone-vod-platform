
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Square } from 'lucide-react';
import { Auction } from '@/types/auction';

interface AuctionVideoPlayerProps {
  auction: Auction;
}

const AuctionVideoPlayer = ({ auction }: AuctionVideoPlayerProps) => {
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
          {auction.youtube_url ? (
            <iframe
              src={getYouTubeEmbedUrl(auction.youtube_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <div className="text-center">
                <Play size={64} className="mx-auto mb-4 opacity-50" />
                <p>Transmissão não disponível</p>
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
                <p className="text-gray-300">
                  {auction.description}
                </p>
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
