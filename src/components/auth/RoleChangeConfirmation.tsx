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
  
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            {isPrivilegeEscalation ? 'Critical Security Action' : 'Confirm Role Change'}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              You are about to change the role of <strong>{userName}</strong> from{' '}
              <span className="font-semibold">{currentRole}</span> to{' '}
              <span className="font-semibold">{newRole}</span>.
            </p>
            
            {isPrivilegeEscalation && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                <p className="text-red-800 font-semibold">⚠️ WARNING: Privilege Escalation</p>
                <p className="text-red-700 text-sm mt-1">
                  This action will grant administrative privileges to this user. They will be able to:
                </p>
                <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                  <li>Access all user data</li>
                  <li>Modify system settings</li>
                  <li>Change other users' roles</li>
                  <li>Access sensitive administrative functions</li>
                </ul>
              </div>
            )}
            
            <p className="text-sm text-gray-600 mt-3">
              This action will be logged for security auditing purposes.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={isPrivilegeEscalation ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isPrivilegeEscalation ? 'Grant Admin Access' : 'Change Role'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RoleChangeConfirmation;