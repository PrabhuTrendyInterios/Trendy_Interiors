import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaProjectDiagram,
  FaUsers,
  FaDoorOpen,
  FaPuzzlePiece,
  FaCog,
} from 'react-icons/fa';
import { cmsGet } from '../utils/cmsApi';

const DashboardHome = () => {
  const [stats, setStats] = useState({
    projects: 0,
    team: 0,
    rooms: 0,
    addons: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [projects, team, rooms, addons] = await Promise.all([
          cmsGet('/projects'),
          cmsGet('/team-members'),
          cmsGet('/rooms'),
          cmsGet('/global-addons'),
        ]);

        setStats({
          projects: projects.count ?? projects.data?.length ?? 0,
          team: team.count ?? team.data?.length ?? 0,
          rooms: rooms.count ?? rooms.data?.length ?? 0,
          addons: addons.count ?? addons.data?.length ?? 0,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    { label: 'Projects', value: stats.projects, to: '/admin/projects' },
    { label: 'Team Members', value: stats.team, to: '/admin/team' },
    { label: 'Rooms', value: stats.rooms, to: '/admin/rooms' },
    { label: 'Global Addons', value: stats.addons, to: '/admin/global-addons' },
  ];

  const quickLinks = [
    { to: '/admin/projects', icon: FaProjectDiagram, title: 'Manage Projects', desc: 'Publish and edit portfolio work' },
    { to: '/admin/team', icon: FaUsers, title: 'Team Members', desc: 'Update team profiles and social links' },
    { to: '/admin/rooms', icon: FaDoorOpen, title: 'Estimator Rooms', desc: 'Configure dimensions, layouts, and addons' },
    { to: '/admin/global-addons', icon: FaPuzzlePiece, title: 'Global Addons', desc: 'Premium optional packages' },
    { to: '/admin/settings', icon: FaCog, title: 'Settings', desc: 'Pricing defaults and site configuration' },
  ];

  return (
    <div className="cms-page">
      <div className="cms-stats-grid">
        {statCards.map((card) => (
          <div key={card.label} className="cms-stat-card">
            <div className="cms-stat-label">{card.label}</div>
            <div className="cms-stat-value">{loading ? '—' : card.value}</div>
            <Link to={card.to} className="cms-stat-link">
              View all →
            </Link>
          </div>
        ))}
      </div>

      <h2 className="cms-section-title">Quick Actions</h2>
      <div className="cms-quick-links">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.to} to={link.to} className="cms-quick-card">
              <div className="cms-quick-icon">
                <Icon />
              </div>
              <div className="cms-quick-text">
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
