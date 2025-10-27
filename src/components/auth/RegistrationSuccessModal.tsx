import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, LogIn, ExternalLink } from "lucide-react";

interface RegistrationSuccessModalProps {
  isOpen: boolean;
  userName: string;
  planName?: string;
  onAccessAccount: () => void;
  onGoToPortal: () => void;
}

export function RegistrationSuccessModal({
  isOpen,
  userName,
  planName,
  onAccessAccount,
  onGoToPortal,
}: RegistrationSuccessModalProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-2xl">
            Cadastro Realizado com Sucesso!
          </DialogTitle>
          <DialogDescription className="text-base">
            Olá <strong>{userName}</strong>! Sua conta foi criada com sucesso
            {planName && (
              <>
                {" "}
                e seu plano <strong>{planName}</strong> foi ativado
              </>
            )}
            .
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onAccessAccount}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Acessar Minha Conta
          </Button>
          
          <Button
            onClick={onGoToPortal}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Ir para o Portal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
