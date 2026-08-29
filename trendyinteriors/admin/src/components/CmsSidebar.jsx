import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaTachometerAlt,
  FaProjectDiagram,
  FaUsers,
  FaDoorOpen,
  FaPuzzlePiece,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaCalculator,
  FaCalendarAlt,
  FaComments,
  FaUserShield,
  FaHistory,
} from 'react-icons/fa';
import './CmsSidebar.css';

const navItems = [
  { to: '/', end: true, label: 'Dashboard', icon: FaTachometerAlt },
  { to: '/projects', label: 'Projects', icon: FaProjectDiagram },
  { to: '/team', label: 'Team Members', icon: FaUsers },
  { to: '/testimonials', label: 'Testimonials', icon: FaComments },
  { to: '/estimates', label: 'Estimates', icon: FaCalculator },
  { to: '/meetings', label: 'Meetings', icon: FaCalendarAlt },
];

const estimatorItems = [
  { to: '/rooms', label: 'Rooms', icon: FaDoorOpen },
  { to: '/global-addons', label: 'Global Addons', icon: FaPuzzlePiece },
];

const CmsSidebar = ({ collapsed, mobileOpen, onToggle, onMobileClose }) => {
  return (
    <aside className={`cms-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="cms-sidebar-brand">
        <img src="/images/logo.png" alt="Trendy Interios" className="cms-sidebar-logo" />
        <div className={`cms-sidebar-brand-text ${collapsed ? 'desktop-collapsed' : ''}`}>
          <span className="cms-brand-name">
            Trendy <span className="cms-brand-accent">Interios</span>
          </span>
          <span className="cms-brand-tag">Content Manager</span>
        </div>
      </div>

      <nav className="cms-sidebar-nav">
        <div className="cms-nav-group">
          <span className={`cms-nav-label ${collapsed ? 'desktop-collapsed' : ''}`}>Main</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}
                title={item.label}
                onClick={onMobileClose}
              >
                <Icon className="cms-nav-icon" />
                <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="cms-nav-group">
          <span className={`cms-nav-label ${collapsed ? 'desktop-collapsed' : ''}`}>Estimator CMS</span>
          {estimatorItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}
                title={item.label}
                onClick={onMobileClose}
              >
                <Icon className="cms-nav-icon" />
                <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="cms-nav-group">
          <span className={`cms-nav-label ${collapsed ? 'desktop-collapsed' : ''}`}>System</span>
          <NavLink
            to="/admin-users"
            className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}
            title="Admin Users"
            onClick={onMobileClose}
          >
            <FaUserShield className="cms-nav-icon" />
            <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>Admin Users</span>
          </NavLink>
          <NavLink
            to="/activity"
            className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}
            title="Activity"
            onClick={onMobileClose}
          >
            <FaHistory className="cms-nav-icon" />
            <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>Activity</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `cms-nav-link ${isActive ? 'active' : ''}`}
            title="Settings"
            onClick={onMobileClose}
          >
            <FaCog className="cms-nav-icon" />
            <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>Settings</span>
          </NavLink>
        </div>
      </nav>

      <div className="cms-sidebar-footer">
        <a href="https://trendyinterios.netlify.app" className="cms-nav-link cms-external-link" target="_blank" rel="noreferrer">
          <FaExternalLinkAlt className="cms-nav-icon" />
          <span className={`cms-nav-text ${collapsed ? 'desktop-collapsed' : ''}`}>View Website</span>
        </a>
        <button type="button" className="cms-collapse-btn" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>
    </aside>
  );
};

export default CmsSidebar;
