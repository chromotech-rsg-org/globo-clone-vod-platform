import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface LoginSuccessModalProps {
  isOpen: boolean;
  userName: string;
  onAutoClose: () => void;
}

export function LoginSuccessModal({
  isOpen,
  userName,
  onAutoClose,
}: LoginSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onAutoClose();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onAutoClose]);

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl">Bem-vindo de Volta!</DialogTitle>
          <DialogDescription className="text-base">
            Olá <strong>{userName}</strong>! Login realizado com sucesso.
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center text-sm text-muted-foreground mt-4">
          Redirecionando...
        </div>
      </DialogContent>
    </Dialog>
  );
}
