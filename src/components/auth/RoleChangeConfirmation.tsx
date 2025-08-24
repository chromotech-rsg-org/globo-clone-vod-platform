
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RoleChangeConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentRole: string;
  newRole: string;
  userName: string;
}

const RoleChangeConfirmation = ({
  isOpen,
  onClose,
  onConfirm,
  currentRole,
  newRole,
  userName
}: RoleChangeConfirmationProps) => {
  const isPrivilegeEscalation = newRole === 'admin' || newRole === 'desenvolvedor';
  const isPrivilegeReduction = (currentRole === 'admin' || currentRole === 'desenvolvedor') && newRole === 'user';
  
  const handleConfirm = () => {
    // Log security-critical role changes for audit trail
    if (isPrivilegeEscalation || isPrivilegeReduction) {
      console.warn('🚨 SECURITY ALERT: Role change initiated', {
        targetUser: userName,
        fromRole: currentRole,
        toRole: newRole,
        timestamp: new Date().toISOString(),
        action: isPrivilegeEscalation ? 'PRIVILEGE_ESCALATION' : 'PRIVILEGE_REDUCTION'
      });
    }
    
    onConfirm();
  };
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className={isPrivilegeEscalation ? "text-red-600" : "text-orange-600"}>
            {isPrivilegeEscalation && '🔒 Alteração Crítica de Segurança'}
            {isPrivilegeReduction && '⚠️ Redução de Privilégios'}
            {!isPrivilegeEscalation && !isPrivilegeReduction && 'Confirmar Alteração de Perfil'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a alterar o perfil de <strong>{userName}</strong> de{' '}
              <span className="font-semibold text-blue-600">{currentRole}</span> para{' '}
              <span className="font-semibold text-green-600">{newRole}</span>.
            </p>
            
            {isPrivilegeEscalation && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                <p className="text-red-800 font-semibold text-sm">⚠️ ATENÇÃO: Elevação de Privilégios</p>
                <p className="text-red-700 text-xs mt-1">
                  Esta ação concederá privilégios administrativos ao usuário:
                </p>
                <ul className="text-red-700 text-xs mt-1 list-disc list-inside ml-2">
                  <li>Acesso a dados de todos os usuários</li>
                  <li>Modificação de configurações do sistema</li>
                  <li>Alteração de perfis de outros usuários</li>
                  <li>Acesso a funções administrativas sensíveis</li>
                </ul>
              </div>
            )}

            {isPrivilegeReduction && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-3">
                <p className="text-orange-800 font-semibold text-sm">📉 Redução de Privilégios</p>
                <p className="text-orange-700 text-xs mt-1">
                  O usuário perderá acesso a funções administrativas.
                </p>
              </div>
            )}
            
            <p className="text-xs text-gray-600 mt-3 bg-gray-50 p-2 rounded">
              🛡️ Esta ação será registrada nos logs de auditoria para fins de segurança.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel onClick={onClose} className="flex-1">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={`flex-1 ${
              isPrivilegeEscalation 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : isPrivilegeReduction 
                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isPrivilegeEscalation && '🔓 Conceder Acesso Admin'}
            {isPrivilegeReduction && '📉 Reduzir Privilégios'}
            {!isPrivilegeEscalation && !isPrivilegeReduction && 'Alterar Perfil'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleChangeConfirmation;
