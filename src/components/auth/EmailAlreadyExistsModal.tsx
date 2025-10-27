import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn, KeyRound, Mail } from "lucide-react";

interface EmailAlreadyExistsModalProps {
  isOpen: boolean;
  email: string;
  onLogin: () => void;
  onResetPassword: () => void;
  onTryAnotherEmail: () => void;
}

export function EmailAlreadyExistsModal({
  isOpen,
  email,
  onLogin,
  onResetPassword,
  onTryAnotherEmail,
}: EmailAlreadyExistsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onTryAnotherEmail()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <DialogTitle className="text-2xl">
            Este E-mail Já Está Cadastrado
          </DialogTitle>
          <DialogDescription className="text-base">
            Já existe uma conta cadastrada com o e-mail{" "}
            <strong className="text-foreground">{email}</strong>. Você pode
            fazer login, recuperar sua senha ou tentar outro e-mail.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={onLogin}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Fazer Login
          </Button>
          
          <Button
            onClick={onResetPassword}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            Recuperar Senha
          </Button>
          
          <Button
            onClick={onTryAnotherEmail}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            <Mail className="w-4 h-4 mr-2" />
            Tentar Outro E-mail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
