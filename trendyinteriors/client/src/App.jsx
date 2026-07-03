import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import Estimator from './pages/Estimator';
import TourGuide from './components/TourGuide';
import PopupCard from "./components/PopupCard";
import './App.css';
import './pages/PageTheme.css';

const Layout = () => {
  const location = useLocation();
  const showFooter = location.pathname !== '/estimator';

  return (
    <div className="app-wrapper">
      <Header />
      <TourGuide />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/abouts" element={<About />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/reachus" element={<ReachUs />} />
          <Route path="/give-testimonial" element={<GiveTestimonial />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/buy-online" element={<BuyOnline />} />
          <Route path="/estimator" element={<Estimator />} />
        </Routes>
        <PopupCard />
        {showFooter && <Footer />}
      </main>
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
