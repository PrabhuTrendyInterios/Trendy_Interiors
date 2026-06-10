import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Testimonials from './pages/Testimonials';
import ReachUs from './pages/ReachUs';
import GiveTestimonial from './pages/GiveTestimonial';
import Projects from './pages/Projects';
import BuyOnline from './pages/BuyOnline';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CmsLayout from './pages/admin/CmsLayout';
import DashboardHome from './pages/admin/pages/DashboardHome';
import ProjectsPage from './pages/admin/pages/ProjectsPage';
import TeamMembersPage from './pages/admin/pages/TeamMembersPage';
import RoomsPage from './pages/admin/pages/RoomsPage';
import GlobalAddonsPage from './pages/admin/pages/GlobalAddonsPage';
import SettingsPage from './pages/admin/pages/SettingsPage';
import EstimatesPage from './pages/admin/pages/EstimatesPage';
import EstimateDetailsPage from './pages/admin/pages/EstimateDetailsPage';
import MeetingRequestsPage from './pages/admin/pages/MeetingRequestsPage';
import MeetingRequestDetailsPage from './pages/admin/pages/MeetingRequestDetailsPage';
import AdminRoute from './components/AdminRoute';
import Estimator from './pages/Estimator';
import TourGuide from './components/TourGuide';
import PopupCard from "./components/PopupCard";
import './App.css';

const Layout = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const showFooter =
    !isAdminRoute &&
    !['/login', '/forgot-password', '/reset-password'].some((path) =>
      location.pathname.startsWith(path)
    );

  return (
    <div className="app-wrapper">
      {!isAdminRoute && <Header />}
      {!isAdminRoute && <TourGuide />}
      <main className={`main-content ${isAdminRoute ? 'main-content-admin' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/abouts" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/reachus" element={<ReachUs />} />
          <Route path="/give-testimonial" element={<GiveTestimonial />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/buy-online" element={<BuyOnline />} />
          <Route path="/estimator" element={<Estimator />} />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<CmsLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="dashboard" element={<Navigate to="/admin" replace />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="team" element={<TeamMembersPage />} />
              <Route path="rooms" element={<RoomsPage />} />
              <Route path="global-addons" element={<GlobalAddonsPage />} />
              <Route path="estimates" element={<EstimatesPage />} />
              <Route path="estimates/:id" element={<EstimateDetailsPage />} />
              <Route path="meetings" element={<MeetingRequestsPage />} />
              <Route path="meetings/:id" element={<MeetingRequestDetailsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
        <PopupCard />
      </main>
      {showFooter && <Footer />}
    </div>
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