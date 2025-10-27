import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Mail } from "lucide-react";

interface PasswordMismatchModalProps {
  isOpen: boolean;
  maskedEmail: string;
  onClose: () => void;
}

export function PasswordMismatchModal({
  isOpen,
  maskedEmail,
  onClose,
}: PasswordMismatchModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <DialogTitle className="text-2xl">
            Usuário Já Existe no Portal
          </DialogTitle>
          <DialogDescription className="text-base whitespace-pre-line">
            Este e-mail já está cadastrado no portal, mas a senha não confere.
            {"\n\n"}
            Foi enviado um e-mail de redefinição de senha para:{"\n"}
            <strong className="text-foreground">{maskedEmail}</strong>
            {"\n\n"}
            Para confirmar que você tem acesso a este e-mail e atualizar sua senha nos dois sistemas (Portal e Minha Conta), acesse seu e-mail e siga as instruções.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button onClick={onClose} className="w-full" size="lg">
            <Mail className="w-4 h-4 mr-2" />
            Entendi, vou verificar meu e-mail
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
