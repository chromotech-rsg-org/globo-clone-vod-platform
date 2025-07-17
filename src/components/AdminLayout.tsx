
import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex min-h-screen bg-admin-background">
      <div className="fixed left-0 top-0 h-screen z-10">
        <AdminSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
        />
      </div>
      <div 
        className="flex-1 h-screen overflow-y-auto transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '256px' }}
      >
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
