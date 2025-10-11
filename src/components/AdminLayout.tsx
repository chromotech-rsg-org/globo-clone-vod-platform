
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import MobileAdminMenu from './MobileAdminMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import PendingNotificationModal from './auction/PendingNotificationModal';
import { usePendingNotifications } from '@/hooks/usePendingNotifications';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { pendingBids, pendingRegistrations, pendingLimitRequests } = usePendingNotifications();

  // Ensure we're in an admin route, if not redirect to dashboard
  useEffect(() => {
    const allowedPaths = ['/dashboard', '/profile', '/subscription'];
    
    // Allow any path starting with /admin or in the allowed list
    const isValidPath = location.pathname.startsWith('/admin') || 
                        allowedPaths.some(path => location.pathname.startsWith(path));
    
    if (!isValidPath) {
      console.log('⚠️ Invalid admin route detected:', location.pathname);
      navigate('/dashboard', { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="admin-layout-container flex min-h-screen bg-black">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <AdminSidebar 
          isCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
        />
      )}
      
      {/* Mobile Menu Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-green-600/30 px-4 py-3 flex items-center justify-between">
          <MobileAdminMenu onNotificationClick={() => setShowNotificationModal(true)} />
          <div className="text-white font-bold text-lg">Painel Admin</div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      )}
      
      <div 
        className="admin-content-main flex-1 min-h-screen bg-black overflow-hidden"
        style={{ 
          marginLeft: isMobile ? '0' : (sidebarCollapsed ? '64px' : '256px'),
          paddingTop: isMobile ? '60px' : '0'
        }}
      >
        <div className="h-full overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="bg-black rounded-xl border border-green-600/30 shadow-xl p-4 md:p-6 min-h-[calc(100vh-6rem)]">
              {children}
            </div>
          </div>
        </div>
      </div>
      
      {/* Notification Modal */}
      <PendingNotificationModal 
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
        pendingBids={pendingBids}
        pendingRegistrations={pendingRegistrations}
        pendingLimitRequests={pendingLimitRequests}
      />
    </div>
  );
};

export default AdminLayout;
