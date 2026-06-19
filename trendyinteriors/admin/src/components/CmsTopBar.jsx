import React from 'react';
import { FaBars, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CmsTopBar.css';

const CmsTopBar = ({ title, subtitle, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="cms-topbar">
      <div className="cms-topbar-left">
        <button type="button" className="cms-menu-btn" onClick={onMenuClick} aria-label="Open menu">
          <FaBars />
        </button>
        <div>
          <h1 className="cms-topbar-title">{title}</h1>
          {subtitle && <p className="cms-topbar-subtitle">{subtitle}</p>}
        </div>
      </div>
      <div className="cms-topbar-right">
        <div className="cms-user-chip">
          <span className="cms-user-avatar">{(user?.name || 'A').charAt(0).toUpperCase()}</span>
          <div className="cms-user-meta">
            <span className="cms-user-name">{user?.name || 'Admin'}</span>
            <span className="cms-user-role">Administrator</span>
          </div>
        </div>
        <button type="button" className="cms-logout-btn" onClick={handleLogout} title="Sign out">
          <FaSignOutAlt />
        </button>
      </div>
    </header>
  );
};

export default CmsTopBar;
