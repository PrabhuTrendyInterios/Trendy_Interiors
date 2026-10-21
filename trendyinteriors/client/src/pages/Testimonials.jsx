import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { publicGet } from '../utils/publicApi';
import { FaComments, FaPenNib, FaQuoteLeft, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ScrollVideoBackground from '../components/ScrollVideoBackground';
import './Testimonials.css';

const PER_PAGE = 9;

const Testimonials = () => {
  const navigate = useNavigate();
  const gridRef = useRef(null);

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ averageRating: 0, totalClients: 0 });
  const [, setStatsLoaded] = useState(false);

  // Fetch stats once (all approved) for the trust indicators
  useEffect(() => {
    publicGet('/api/testimonials?limit=500')
      .then((res) => {
        if (res.success && res.data?.length > 0) {
          const avg = (
            res.data.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / res.data.length
          ).toFixed(1);
          setStats({ averageRating: avg, totalClients: res.pagination?.total ?? res.data.length });
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoaded(true));

    window.scrollTo(0, 0);
  }, []);

  const fetchPage = useCallback(async (page) => {
    setLoading(true);
    try {
      const res = await publicGet(`/api/testimonials?page=${page}&limit=${PER_PAGE}`);
      if (res.success) {
        setTestimonials(res.data || []);
        setCurrentPage(res.pagination?.page ?? page);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setTotal(res.pagination?.total ?? res.data?.length ?? 0);
      }
    } catch {
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    fetchPage(page);
    // Smooth scroll to the grid
    setTimeout(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Build page number array with ellipsis for large page counts
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

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
              <span className="trust-number">600+</span>
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
      <section className="testimonials-content" ref={gridRef}>
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
          ) : testimonials.length === 0 ? (
            <div className="no-testimonials">
              <div className="empty-icon"><FaComments aria-hidden="true" /></div>
              <h3>No stories yet</h3>
              <p>Be the first one to share your experience with us.</p>
            </div>
          ) : (
            <>
              <div className="testimonials-grid-3x3">
                {testimonials.map((t, index) => (
                  <div
                    key={t._id || index}
                    className="testimonial-card-premium"
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
                    <FaQuoteLeft className="quote-icon-bg" />
                    <div className="testimonial-body">
                      <div className="rating-stars">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FaStar
                            key={i}
                            className={i < (Number(t.rating) || 5) ? 'star-filled' : 'star-empty'}
                          />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-wrapper">
                  <div className="pagination-info">
                    Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, total)} of {total} reviews
                  </div>

                  <nav className="pagination" aria-label="Testimonial pages">
                    <button
                      className="page-btn page-nav"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <FaChevronLeft />
                    </button>

                    {getPageNumbers().map((p, idx) =>
                      p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="page-ellipsis">…</span>
                      ) : (
                        <button
                          key={p}
                          className={`page-btn ${p === currentPage ? 'active' : ''}`}
                          onClick={() => goToPage(p)}
                          aria-current={p === currentPage ? 'page' : undefined}
                        >
                          {p}
                        </button>
                      )
                    )}

                    <button
                      className="page-btn page-nav"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <FaChevronRight />
                    </button>
                  </nav>
                </div>
              )}
            </>
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
