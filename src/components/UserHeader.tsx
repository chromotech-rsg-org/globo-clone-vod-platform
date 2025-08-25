
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserHeader = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.substring(0, 2).toUpperCase();

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="text-white font-medium">{user.name || user.email}</p>
            <p className="text-gray-400 text-xs">{user.role}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-300 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserHeader;
