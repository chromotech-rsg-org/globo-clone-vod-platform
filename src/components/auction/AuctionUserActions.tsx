
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/utils/formatters';
import { Auction, Bid, BidUserState } from '@/types/auction';
import { Play, Square, User, AlertCircle, CheckCircle, Clock, Trophy } from 'lucide-react';

interface AuctionUserActionsProps {
  auction: Auction;
  bids: Bid[];
  userState: BidUserState;
  stateInfo: any;
  submittingBid: boolean;
  userPendingBid: Bid | null;
  userId?: string;
  onBidClick: () => void;
  onRequestRegistration: () => void;
}

const AuctionUserActions = ({ 
  auction, 
  bids, 
  userState, 
  stateInfo, 
  submittingBid, 
  userPendingBid, 
  userId,
  onBidClick,
  onRequestRegistration
}: AuctionUserActionsProps) => {
  return (
    <Card className="bg-black border-green-600/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <stateInfo.icon size={20} />
          {stateInfo.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant={stateInfo.variant === 'destructive' ? 'destructive' : 'default'} className="bg-gray-900 border-green-600/30">
          <AlertDescription className="text-gray-300">
            {stateInfo.description}
          </AlertDescription>
        </Alert>
         
        {stateInfo.action && (
          <Button 
            onClick={stateInfo.onClick}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            variant={stateInfo.variant === 'destructive' ? 'outline' : 'default'}
            disabled={stateInfo.disabled || submittingBid || !stateInfo.onClick}
          >
            {submittingBid ? 'Enviando lance...' : stateInfo.action}
          </Button>
        )}

        {/* Status do lance do usuário */}
        {userPendingBid && (
          <Alert className="bg-gray-900 border-yellow-600/30">
            <Clock className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-gray-300">
              <div className="flex justify-between items-center">
                <span>Seu lance: {formatCurrency(userPendingBid.bid_value)}</span>
                <Badge variant="secondary" className="bg-yellow-600/20 text-yellow-400">Em análise</Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Mostrar se o usuário tem lance vencedor */}
        {(() => {
          const userWinningBid = bids.find(bid => 
            bid.user_id === userId && bid.is_winner && bid.status === 'approved'
          );
          if (userWinningBid) {
            return (
              <Alert className="bg-green-900/20 border-green-500/50">
                <Trophy className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  <div className="text-center">
                    <p className="font-bold">🎉 Parabéns! Você é o vencedor!</p>
                    <p>Lance vencedor: {formatCurrency(userWinningBid.bid_value)}</p>
                  </div>
                </AlertDescription>
              </Alert>
            );
          }
          
          // Verificar se há algum vencedor no leilão
          const anyWinner = bids.find(bid => bid.is_winner);
          if (anyWinner && anyWinner.user_id !== userId) {
            return (
              <Alert className="bg-orange-900/20 border-orange-500/50">
                <Trophy className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-300">
                  <div className="text-center">
                    <p className="font-bold">Leilão Finalizado</p>
                    <p>Lance vencedor: {formatCurrency(anyWinner.bid_value)}</p>
                    <p className="text-sm">Vencedor: {anyWinner.user_name || 'Usuário'}</p>
                  </div>
                </AlertDescription>
              </div>
            );
          }
        })()}
      </CardContent>
    </Card>
  );
};

export default AuctionUserActions;
