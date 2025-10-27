import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface RateLimitModalProps {
  isOpen: boolean;
  remainingMinutes: number;
  onClose: () => void;
}

export function RateLimitModal({
  isOpen,
  remainingMinutes,
  onClose,
}: RateLimitModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle className="text-2xl">
            Muitas Tentativas de Login
          </DialogTitle>
          <DialogDescription className="text-base">
            Por segurança, você precisa aguardar{" "}
            <strong className="text-foreground">{remainingMinutes} minutos</strong>{" "}
            antes de tentar fazer login novamente.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
