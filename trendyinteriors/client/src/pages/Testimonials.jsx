import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicGet } from '../utils/publicApi';
import { FaComments, FaPenNib, FaQuoteLeft, FaStar } from 'react-icons/fa';
import ScrollVideoBackground from '../components/ScrollVideoBackground';
import './Testimonials.css';

const Testimonials = () => {
  const navigate = useNavigate();
  const [displayTestimonials, setDisplayTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalClients: 0,
  });

  // Fetch approved testimonials from database
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await publicGet('/api/testimonials');
        if (response.success && response.data && response.data.length > 0) {
          // Get latest 9 testimonials only for display
          const latest9 = response.data.slice(0, 9);
          setDisplayTestimonials(latest9);

          // Calculate stats from all testimonials
          const totalCount = response.data.length;
          const avgRating =
            response.data.length > 0
              ? (
                  response.data.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) /
                  response.data.length
                ).toFixed(1)
              : 0;

          setStats({
            averageRating: avgRating,
            totalClients: totalCount,
          });
        } else {
          // No testimonials yet - show empty state
          setDisplayTestimonials([]);
          setStats({
            averageRating: 0,
            totalClients: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
        // Show empty state on error
        setDisplayTestimonials([]);
        setStats({
          averageRating: 0,
          totalClients: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="testimonials-page">
      <ScrollVideoBackground imageSrc="/images/kitchen-image.png" videoSrc="/video/kitchen-video.mp4" />

      {/* Hero Section */}
      <section className="testimonials-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Testimonials</h1>
          <p className="hero-subtitle">Real stories from people who trusted us with their dreams</p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-indicators">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <span className="trust-number">{stats.averageRating}/5</span>
              <span className="trust-label">Average Rating</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-number">{stats.totalClients}+</span>
              <span className="trust-label">Happy Clients</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <span className="trust-number">10+</span>
              <span className="trust-label">Years of Trust</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="testimonials-content">
        <div className="container">
          <div className="section-header-center">
            <h2>What Our Clients Say</h2>
            <div className="divider-center"></div>
            <p className="section-intro-text">
              The trendy is always grateful to its clients who have made our success story possible.
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading stories...</p>
            </div>
          ) : (
            <div className="testimonials-grid-3x3">
              {displayTestimonials.map((t, index) => (
                <div key={t._id || index} className="testimonial-card-premium" style={{ animationDelay: `${index * 0.1}s` }}>
                  <FaQuoteLeft className="quote-icon-bg" />
                  <div className="testimonial-body">
                    <div className="rating-stars">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <FaStar key={i} className={i < (Number(t.rating) || 5) ? 'star-filled' : 'star-empty'} />
                      ))}
                    </div>
                    <p className="testimonial-quote">"{t.testimonialText || t.text}"</p>
                  </div>

                  <div className="testimonial-footer">
                    <div className="client-avatar">
                      {t.name ? t.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="client-info">
                      <h4>{t.name}</h4>
                      <span>{t.element || t.role || 'Client'} | {t.postalAddress || t.location || 'India'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State Fallback (if no testimonials) */}
          {!loading && displayTestimonials.length === 0 && (
            <div className="no-testimonials">
              <div className="empty-icon"><FaComments aria-hidden="true" /></div>
              <h3>No stories yet</h3>
              <p>Be the first one to share your experience with us.</p>
            </div>
          )}

        </div>
      </section>

      {/* CTA Section */}
      <section className="testimonial-cta">
        <div className="container">
          <div className="cta-box">
            <div className="cta-text">
              <h3>Loved our work?</h3>
              <p>
                Your feedback helps us create better experiences. Share your story
                with the world.
              </p>
            </div>

            <div className="cta-action">
              <button
                className="btn-gold-outline"
                onClick={() => navigate("/give-testimonial")}
              >
                <FaPenNib className="btn-icon" /> Give Testimonial
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Testimonials;
