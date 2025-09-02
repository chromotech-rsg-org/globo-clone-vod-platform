
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AuctionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuctionCreateModal = ({ isOpen, onClose }: AuctionCreateModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-green-600/30 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Novo Leilão</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center text-gray-400 py-12">
            Modal em branco para criação de leilão
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-green-600/30 text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Criar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuctionCreateModal;
