import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaHandshake, FaPalette, FaFileInvoiceDollar, FaClipboardCheck, FaTruck, FaTools, FaCheckCircle, FaKey } from 'react-icons/fa';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
import { useAuth } from '../context/AuthContext';
import { publicGet, normalizeProjectForDisplay, getProjectCover } from '../utils/publicApi';
import useScrollScrubbedVideo from '../hooks/useScrollScrubbedVideo';
import './Home.css';
import './PremiumSectionHeader.css';
import './HomeEnhancements.css';

const Home = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const isScrolled = useScrollScrubbedVideo(videoRef);

  const defaultServices = [
    {
      title: 'Interior Design',
      description:
        'Transform your space with our expert interior design services. We create personalized environments that reflect your style and enhance your lifestyle with meticulous attention to detail.',
      icon: '🏛️',
    },
    {
      title: 'Modern Design',
      description:
        'Experience contemporary aesthetics with our modern design solutions. We blend functionality with cutting-edge style to create spaces that are both beautiful and practical.',
      icon: '✨',
    },
    {
      title: 'Planning & Consultation',
      description:
        'Comprehensive planning services from concept to completion. Our expert consultants guide you through every step, ensuring your vision becomes reality with precision and care.',
      icon: '📐',
    },
  ];

  useEffect(() => {
    const fetchLatestProjects = async () => {
      try {
        const data = await publicGet('/api/projects?limit=6');
        if (data.success && Array.isArray(data.data)) {
          setProjects(data.data.map(normalizeProjectForDisplay));
        } else {
          setProjects([]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    const fetchApprovedTestimonials = async () => {
      try {
        const data = await publicGet('/api/testimonials');
        if (data.success) {
          setTestimonials(data.data);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    const fetchServices = async () => {
      try {
        const data = await publicGet('/api/services');
        if (data.success && data.data.length > 0) {
          setServices(data.data);
        } else {
          setServices(defaultServices);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices(defaultServices);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchLatestProjects();
    fetchApprovedTestimonials();
    fetchServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const designProcess = [
    { step: 'Meet Designer', icon: <FaHandshake />, description: 'Initial consultation to understand your vision' },
    { step: 'Design Concepts', icon: <FaPalette />, description: 'Creative design proposals tailored to you' },
    { step: 'Finalize Costing', icon: <FaFileInvoiceDollar />, description: 'Transparent pricing and budget planning' },
    { step: 'Place Order', icon: <FaClipboardCheck />, description: 'Confirm your design and specifications' },
    { step: 'Material Delivery', icon: <FaTruck />, description: 'Premium materials delivered to site' },
    { step: 'Implementation', icon: <FaTools />, description: 'Expert execution by skilled craftsmen' },
    { step: 'Quality Check', icon: <FaCheckCircle />, description: 'Rigorous quality control at every stage' },
    { step: 'Site Handover', icon: <FaKey />, description: 'Final walkthrough and project completion' },
  ];

  return (
    <div className="home-page">
      {/* Background image that fades out on scroll */}
      <div
        className="home-fixed-bg"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/images/hero-sectionn.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: isScrolled ? 0 : 1,
          transition: 'opacity 0.6s ease',
          zIndex: -2,
          pointerEvents: 'none'
        }}
      />

      {/* Video background that fades in on scroll */}
      <video
        ref={videoRef}
        className="home-bg-video"
        muted
        playsInline
        preload="auto"
        poster="/images/hero-sectionn.png"
        style={{ opacity: isScrolled ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <source src="/video/hero-section.mp4" type="video/mp4" />
      </video>

      {/* Hero Carousel Section */}
      <section className="hero-section">
        <div className="tagline">
          {user && (
            <div className="welcome-message">
              <p className="welcome-text">Welcome to Trendy Interiors! 👋</p>
            </div>
          )}
          <h1>Filling the Heart, Not Just Space</h1>
          <p>Premium Interior Design Solutions for Modern Living</p>
          <div className="hero-cta-buttons">
            <Link
              to="/projects"
              className="btn-primary tour-view-projects-btn"
              style={{ textDecoration: 'none' }}
            >
              View Projects
            </Link>
            <Link
              to="/estimator"
              className="btn-secondary tour-estimator-btn"
              style={{ textDecoration: 'none' }}
            >
              Quote Your Interior
            </Link>
          </div>
        </div>
      </section>

      {/* What We Do Section */}
      <section className="services-section tour-services">
        <div className="container">
          <PremiumSectionHeader
            sectionName="OUR EXPERTISE"
            title="What We Do Best"
            subtitle="Crafting exceptional spaces with passion and precision"
          />
          <div className="services-grid">
            {defaultServices.map((service, index) => (
              <div key={index} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Projects Section */}
      <section className="projects-section tour-projects">
        <div className="container">
          <PremiumSectionHeader
            sectionName="PORTFOLIO"
            title="Latest Projects"
            subtitle="Explore our portfolio of stunning interior transformations"
          />
          <div className="projects-grid">
            {loadingProjects ? (
              <p className="loading-text" style={{ textAlign: 'center', color: 'var(--color-gold)', gridColumn: '1 / -1' }}>
                Loading projects...
              </p>
            ) : projects.length === 0 ? (
              <p className="empty-text" style={{ textAlign: 'center', color: 'var(--color-gray)', gridColumn: '1 / -1' }}>
                No projects available yet.
              </p>
            ) : (
              projects.map((project) => (
                <div key={project._id || project.title} className="project-card">
                  <img src={getProjectCover(project)} alt={project.title} />
                  <h3>
                    {project.title}
                    <span className="project-location">{project.description}</span>
                  </h3>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Our Design Journey Section */}
      <section className="design-process-section tour-process">
        <div className="container">
          <PremiumSectionHeader
            sectionName="PROCESS"
            title="Our Design Journey"
            subtitle="From Concept to Completion - A Seamless Experience"
          />
          <div className="design-process-timeline">
            {designProcess.map((item, index) => (
              <div key={index} className="process-step">
                <div className="step-content-wrapper">
                  <div className="step-icon-wrapper">
                    <div className="step-icon">{item.icon}</div>
                    <div className="step-number">{index + 1}</div>
                  </div>
                  <div className="process-step-info">
                    <h4>{item.step}</h4>
                    <p>{item.description}</p>
                  </div>
                </div>
                {index < designProcess.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="testimonials-section tour-testimonials">
        <div className="container">
          <PremiumSectionHeader
            sectionName="TESTIMONIALS"
            title="What Our Clients Say"
            subtitle="Trusted by 200+ happy homeowners across India"
          />

          <div className="testimonials-carousel">
            {loadingTestimonials ? (
              <p className="loading-text" style={{ textAlign: 'center', color: 'var(--color-gold)' }}>Loading testimonials...</p>
            ) : testimonials.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.92)', fontSize: '16px' }}>
                No testimonials yet. Submit your feedback to help us improve!
              </p>
            ) : (
              testimonials.map((t, idx) => (
                <div key={idx} className="testimonial-card">
                  <div className="quote-icon">"</div>
                  <div className="stars">{'★'.repeat(t.rating || 5)}</div>
                  <p className="testimonial-text">"{t.testimonialText}"</p>
                  <div className="customer-info">
                    <div className="customer-avatar">{t.name ? t.name.charAt(0).toUpperCase() : '?'}</div>
                    <div className="customer-details">
                      <h4>{t.name}</h4>
                      <p>{t.postalAddress || 'India'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="trust-badges">
            <div className="trust-badge">
              <div className="badge-icon">🏆</div>
              <div className="badge-text">
                <h3>200+</h3>
                <p>Happy Clients</p>
              </div>
            </div>
            <div className="trust-badge">
              <div className="badge-icon">⭐</div>
              <div className="badge-text">
                <h3>4.9/5</h3>
                <p>Average Rating</p>
              </div>
            </div>
            <div className="trust-badge">
              <div className="badge-icon">✓</div>
              <div className="badge-text">
                <h3>100%</h3>
                <p>Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <section className="our-services-section">
        <div className="container">
          <PremiumSectionHeader
            sectionName="SERVICES"
            title="Our Interior Solutions"
            subtitle="Comprehensive interior design solutions for every space"
          />
          <div className="services-detail-grid">
            {loadingServices ? (
              <p className="loading-text" style={{ textAlign: 'center', color: 'var(--color-gold)' }}>Loading services...</p>
            ) : services.length === 0 ? (
              <p className="empty-text" style={{ textAlign: 'center', color: 'var(--color-gold)', gridColumn: '1 / -1' }}>No services available</p>
            ) : (
              services.map((service, index) => (
                <div key={service._id || index} className="service-detail">
                  <div className="service-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {service.icon}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
