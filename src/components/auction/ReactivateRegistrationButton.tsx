
import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useAuctionRegistration } from '@/hooks/useAuctionRegistration';

interface ReactivateRegistrationButtonProps {
  auctionId: string;
  disabled?: boolean;
}

const ReactivateRegistrationButton: React.FC<ReactivateRegistrationButtonProps> = ({ 
  auctionId, 
  disabled = false 
}) => {
  const { registration, reactivateRegistration } = useAuctionRegistration(auctionId);

  if (!registration || registration.status !== 'canceled') {
    return null;
  }

  const handleReactivate = async () => {
    await reactivateRegistration();
  };

  return (
    <Button
      onClick={handleReactivate}
      disabled={disabled}
      variant="outline"
      className="flex items-center gap-2"
    >
      <RotateCcw size={16} />
      Reativar Habilitação
    </Button>
  );
};

export default ReactivateRegistrationButton;
