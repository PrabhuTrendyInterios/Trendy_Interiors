import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CmsLayout from './pages/CmsLayout';
import DashboardHome from './pages/DashboardHome';
import ProjectsPage from './pages/ProjectsPage';
import TeamMembersPage from './pages/TeamMembersPage';
import RoomsPage from './pages/RoomsPage';
import GlobalAddonsPage from './pages/GlobalAddonsPage';
import SettingsPage from './pages/SettingsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import ActivityPage from './pages/ActivityPage';
import EstimatesPage from './pages/EstimatesPage';
import EstimateDetailsPage from './pages/EstimateDetailsPage';
import MeetingRequestsPage from './pages/MeetingRequestsPage';
import MeetingRequestDetailsPage from './pages/MeetingRequestDetailsPage';
import TestimonialsPage from './pages/TestimonialsPage';
import AdminRoute from './components/AdminRoute';

const Layout = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/forgot-password', '/reset-password'].some((path) =>
    location.pathname.startsWith(path)
  );

  return (
    <main className={`main-content ${!isAuthPage ? 'main-content-admin' : ''}`}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<AdminRoute />}>
          <Route path="/" element={<CmsLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="dashboard" element={<Navigate to="/" replace />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="team" element={<TeamMembersPage />} />
            <Route path="rooms" element={<RoomsPage />} />
            <Route path="global-addons" element={<GlobalAddonsPage />} />
            <Route path="estimates" element={<EstimatesPage />} />
            <Route path="estimates/:id" element={<EstimateDetailsPage />} />
            <Route path="meetings" element={<MeetingRequestsPage />} />
            <Route path="meetings/:id" element={<MeetingRequestDetailsPage />} />
            <Route path="testimonials" element={<TestimonialsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin-users" element={<AdminUsersPage />} />
            <Route path="activity" element={<ActivityPage />} />
          </Route>
        </Route>
      </Routes>
    </main>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <Layout />
      </Router>
    </AuthProvider>
  );
}

export default App;
