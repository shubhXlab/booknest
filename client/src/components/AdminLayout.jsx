import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import Breadcrumbs from './Breadcrumbs';
import { useLocation, useNavigate } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Parse breadcrumbs from path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = [
    { label: 'Dashboard', to: '/admin/dashboard' },
    ...pathParts.slice(1).reduce((acc, part, i) => {
      const segment = pathParts.slice(0, i + 2).join('/');
      if (segment) {
        acc.push({ label: part.replace(/[-]/g, ' '), to: `/admin${segment}` });
      }
      return acc;
    }, []),
  ];

  return (
    <div className="min-h-screen bg-background-primary">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="flex flex-col min-0 w-full">
        <TopBar
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}