import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";

type ErrorType = "portal" | "validation" | "connection" | "generic";

interface CheckoutErrorModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  errorType?: ErrorType;
  onRetry?: () => void;
  onClose: () => void;
}

const errorConfig: Record<ErrorType, { icon: string; defaultTitle: string }> = {
  portal: {
    icon: "🔌",
    defaultTitle: "Erro de Conexão com o Portal",
  },
  validation: {
    icon: "⚠️",
    defaultTitle: "Dados Inválidos",
  },
  connection: {
    icon: "📡",
    defaultTitle: "Erro de Conexão",
  },
  generic: {
    icon: "❌",
    defaultTitle: "Ops! Algo Deu Errado",
  },
};

export function CheckoutErrorModal({
  isOpen,
  title,
  message,
  errorType = "generic",
  onRetry,
  onClose,
}: CheckoutErrorModalProps) {
  const config = errorConfig[errorType];
  const displayTitle = title || config.defaultTitle;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-2xl">{displayTitle}</DialogTitle>
          <DialogDescription className="text-base whitespace-pre-line">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          {onRetry && (
            <Button onClick={onRetry} className="w-full" size="lg">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}

          {errorType === "validation" && (
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full"
              size="lg"
            >
              Entendi
            </Button>
          )}

          {errorType === "generic" && !onRetry && (
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar para Início
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
