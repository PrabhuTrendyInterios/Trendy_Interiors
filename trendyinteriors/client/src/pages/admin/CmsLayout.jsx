import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CmsSidebar from './components/CmsSidebar';
import CmsTopBar from './components/CmsTopBar';
import { CmsProvider } from './context/CmsContext';
import './AdminDashboard.css';
import './CmsLayout.css';

const PAGE_META = {
  '/admin': { title: 'Dashboard', subtitle: 'Overview of your content' },
  '/admin/projects': { title: 'Projects', subtitle: 'Manage portfolio projects' },
  '/admin/team': { title: 'Team Members', subtitle: 'Manage your team profiles' },
  '/admin/testimonials': { title: 'Testimonials', subtitle: 'Review and approve customer testimonials' },
  '/admin/estimates': { title: 'Estimates', subtitle: 'Manage customer estimates and quotations' },
  '/admin/meetings': { title: 'Meetings', subtitle: 'Review chatbot meeting requests and statuses' },
  '/admin/rooms': { title: 'Rooms', subtitle: 'Configure estimator room options' },
  '/admin/global-addons': { title: 'Global Addons', subtitle: 'Manage premium add-on packages' },
  '/admin/settings': { title: 'Settings', subtitle: 'Site and estimator configuration' },
};

const CmsLayout = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

const meta =
    PAGE_META[location.pathname] ||
    (location.pathname.startsWith('/admin/meetings')
      ? { title: 'Meetings', subtitle: 'Review chatbot meeting requests and statuses' }
      : { title: 'CMS', subtitle: '' });
  const closeMobile = () => setMobileOpen(false);

  return (
    <CmsProvider>
      <div className="cms-shell">
        {mobileOpen && (
          <button type="button" className="cms-overlay" onClick={closeMobile} aria-label="Close menu" />
        )}
        <CmsSidebar
          collapsed={sidebarCollapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
          onMobileClose={closeMobile}
        />
        <div className={`cms-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <CmsTopBar
            title={meta.title}
            subtitle={meta.subtitle}
            onMenuClick={() => setMobileOpen(true)}
          />
          <div className="cms-content">
            <Outlet />
          </div>
        </div>
      </div>
    </CmsProvider>
  );
};

export default CmsLayout;
