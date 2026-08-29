import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaClipboardCheck,
  FaDraftingCompass,
  FaFileInvoiceDollar,
  FaGem,
  FaHandshake,
  FaKey,
  FaPalette,
  FaPlay,
  FaStar,
  FaTools,
  FaTrophy,
  FaTruck,
  FaYoutube,
} from 'react-icons/fa';
import PremiumSectionHeader from '../components/PremiumSectionHeader';
import { useAuth } from '../context/AuthContext';
import { publicGet, normalizeProjectForDisplay, getProjectCover } from '../utils/publicApi';
import useScrollScrubbedVideo from '../hooks/useScrollScrubbedVideo';
import './Home.css';
import './PremiumSectionHeader.css';
import './HomeEnhancements.css';

const HERO_IMAGE = '/images/hero-sectionn.webp';
const HERO_IMAGE_FALLBACK = '/images/hero-sectionn.png';
const HERO_IMAGE_PLACEHOLDER = '/images/hero-sectionn-placeholder.webp';

const Home = () => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [heroImageSrc, setHeroImageSrc] = useState(HERO_IMAGE_PLACEHOLDER);
  const [isHeroImageLoaded, setIsHeroImageLoaded] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const isScrolled = useScrollScrubbedVideo(videoRef);
  const shouldShowVideo = isScrolled && isHeroVideoReady;

  useEffect(() => {
    let isCancelled = false;
    const image = new Image();

    const commitLoadedImage = (src) => {
      if (isCancelled) {
        return;
      }

      setHeroImageSrc(src);
      setIsHeroImageLoaded(true);
    };

    image.decoding = 'async';
    image.fetchPriority = 'high';
    image.onload = () => {
      if (image.decode) {
        image.decode().then(
          () => commitLoadedImage(HERO_IMAGE),
          () => commitLoadedImage(HERO_IMAGE)
        );
        return;
      }

      commitLoadedImage(HERO_IMAGE);
    };
    image.onerror = () => commitLoadedImage(HERO_IMAGE_FALLBACK);
    image.src = HERO_IMAGE;

    return () => {
      isCancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  const defaultServices = [
    {
      title: 'Interior Design',
      description:
        'Transform your space with our expert interior design services. We create personalized environments that reflect your style and enhance your lifestyle with meticulous attention to detail.',
      icon: null,
    },
    {
      title: 'Modern Design',
      description:
        'Experience contemporary aesthetics with our modern design solutions. We blend functionality with cutting-edge style to create spaces that are both beautiful and practical.',
      icon: null,
    },
    {
      title: 'Planning & Consultation',
      description:
        'Comprehensive planning services from concept to completion. Our expert consultants guide you through every step, ensuring your vision becomes reality with precision and care.',
      icon: null,
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

  const channelVideos = [
    { id: 'TJFKoSXVSlk', title: 'Meet Tijo 🤖 | The Newest Member of Trendy Interios' },
    { id: 'HcxtLwy1fNs', title: 'Modern Luxury Dream Home Interior Designed & Executed by Trendy InterioS' },
    { id: 'z96yDS1d8CM', title: 'Namma work pathu client sonna first words 😱' },
    { id: 'rVQ7NgtFtac', title: 'Complete Turnkey Interior Kitchen Design | Modern Home Interior' },
    { id: 'mqouZX4MBSo', title: 'TV Units That Define Your Living Space' },
    { id: 'CB0euNyHI3c', title: 'Where Comfort Meets Class 💫' },
    { id: '5ImJuRDXIEs', title: 'Design that Elevates Every Step' },
    { id: 'aiWHlztQzEw', title: 'This is how we leveled up a home in Erode!' },
  ];
  const videoTrackRef = useRef(null);
  const [activeVideoId, setActiveVideoId] = useState(null);

  const scrollVideoTrack = (direction) => {
    const track = videoTrackRef.current;
    if (!track) return;
    const card = track.querySelector('.youtube-card');
    const scrollAmount = card ? card.offsetWidth + 24 : 320;
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  const getServiceIcon = (service, index) => {
    const title = `${service?.title || ''}`.toLowerCase();

    if (title.includes('plan') || title.includes('consult')) {
      return <FaDraftingCompass aria-hidden="true" />;
    }

    if (title.includes('modern') || title.includes('luxury')) {
      return <FaGem aria-hidden="true" />;
    }

    if (title.includes('delivery') || title.includes('material')) {
      return <FaTruck aria-hidden="true" />;
    }

    if (title.includes('install') || title.includes('implement') || title.includes('execute')) {
      return <FaTools aria-hidden="true" />;
    }

    const fallbackIcons = [
      <FaBuilding aria-hidden="true" />,
      <FaGem aria-hidden="true" />,
      <FaDraftingCompass aria-hidden="true" />,
    ];

    return fallbackIcons[index % fallbackIcons.length];
  };

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
          backgroundImage: `url(${heroImageSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: shouldShowVideo ? 0 : 1,
          transition: 'opacity 0.6s ease',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Video background that fades in on scroll */}
      <video
        ref={videoRef}
        className="home-bg-video"
        muted
        playsInline
        preload="metadata"
        poster={isHeroImageLoaded ? HERO_IMAGE : HERO_IMAGE_PLACEHOLDER}
        onLoadedData={() => setIsHeroVideoReady(true)}
        onCanPlay={() => setIsHeroVideoReady(true)}
        style={{ opacity: shouldShowVideo ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <source src="/video/hero-section.mp4" type="video/mp4" />
      </video>

      {/* Hero Carousel Section */}
      <section className="hero-section">
        <div className="tagline">
          {user && (
            <div className="welcome-message">
              <p className="welcome-text">Welcome to Trendy Interiors</p>
            </div>
          )}
          <h1>Filling the Heart, Not Space</h1>
          <p>Premium Interior Design Solutions for Modern Living</p>
          <div className="hero-cta-buttons">
            <Link
              to="/estimator"
              className="btn-primary tour-estimator-btn"
              style={{ textDecoration: 'none' }}
              aria-label="Quote Interior Yourself"
            >
              <span className="quote-cta-label" aria-hidden="true">
                {'Quote Interior Yourself'.split('').map((character, index) => (
                  <span
                    className="quote-cta-letter"
                    style={{ '--letter-index': index }}
                    key={`${character}-${index}`}
                  >
                    {character === ' ' ? '\u00A0' : character}
                  </span>
                ))}
              </span>
            </Link>
            <Link
              to="/projects"
              className="btn-secondary tour-view-projects-btn"
              style={{ textDecoration: 'none' }}
            >
              Watch Gallery
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
                <div className="service-icon">{getServiceIcon(service, index)}</div>
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
                  <div className="stars" aria-label={`${t.rating || 5} star rating`}>
                    {Array.from({ length: t.rating || 5 }, (_, starIndex) => (
                      <FaStar key={starIndex} aria-hidden="true" />
                    ))}
                  </div>
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
              <div className="badge-icon"><FaTrophy aria-hidden="true" /></div>
              <div className="badge-text">
                <h3>200+</h3>
                <p>Happy Clients</p>
              </div>
            </div>
            <div className="trust-badge">
              <div className="badge-icon"><FaStar aria-hidden="true" /></div>
              <div className="badge-text">
                <h3>4.9/5</h3>
                <p>Average Rating</p>
              </div>
            </div>
            <div className="trust-badge">
              <div className="badge-icon"><FaCheckCircle aria-hidden="true" /></div>
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
                    {getServiceIcon(service, index)}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* YouTube Channel Section */}
      <section className="youtube-section">
        <div className="container">
          <PremiumSectionHeader
            sectionName="ON YOUTUBE"
            title="Watch Us In Action"
            subtitle="Real projects, real transformations - straight from our YouTube channel"
          />

          <div className="youtube-carousel-wrapper">
            <button
              type="button"
              className="youtube-carousel-arrow youtube-carousel-arrow-left"
              onClick={() => scrollVideoTrack(-1)}
              aria-label="Scroll to previous videos"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>

            <div className="youtube-carousel-track" ref={videoTrackRef}>
              {channelVideos.map((video) => (
                <div key={video.id} className="youtube-card">
                  <div className="youtube-card-frame">
                    {activeVideoId === video.id ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
                        title={video.title}
                        loading="lazy"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        type="button"
                        className="youtube-thumb-button"
                        onClick={() => setActiveVideoId(video.id)}
                        aria-label={`Play video: ${video.title}`}
                      >
                        <img
                          src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                          alt={video.title}
                          loading="lazy"
                        />
                        <span className="youtube-play-overlay">
                          <FaPlay aria-hidden="true" />
                        </span>
                      </button>
                    )}
                  </div>
                  <h4 className="youtube-card-title">{video.title}</h4>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="youtube-carousel-arrow youtube-carousel-arrow-right"
              onClick={() => scrollVideoTrack(1)}
              aria-label="Scroll to next videos"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="youtube-subscribe-cta">
            <a
              href="https://www.youtube.com/@Trendy_InterioS"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary youtube-subscribe-btn"
            >
              <FaYoutube aria-hidden="true" />
              Subscribe on YouTube
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
