import React, { useEffect, useState, useCallback } from 'react';
import { FaCheck, FaTimes, FaTrash, FaComments, FaStar } from 'react-icons/fa';
import { useCms } from '../context/CmsContext';
import { authDelete, authGet, authPatch } from '../utils/publicApi';

const TestimonialsPage = () => {
  const { showToast } = useCms();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTestimonials = useCallback(async () => {
    try {
      const data = await authGet('/api/testimonials/admin/all');
      const testimonialsList = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : [];

      if (!testimonialsList.length && data.success === false) {
        console.warn('Admin testimonials endpoint returned no data:', data);
      }

      setTestimonials(testimonialsList);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      showToast(error.message || 'Failed to load testimonials', 'error');
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      await authPatch(`/api/testimonials/${id}/approve`);

      showToast('Testimonial approved and published!', 'success');
      fetchTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      showToast(error.message, 'error');
    }
  };

  const handleDeny = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      await authPatch(`/api/testimonials/${id}/deny`);

      showToast('Testimonial unpublished!', 'success');
      fetchTestimonials();
    } catch (error) {
      console.error('Error unpublishing testimonial:', error);
      showToast(error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showToast('Authentication required', 'error');
        return;
      }

      await authDelete(`/api/testimonials/${id}`);

      showToast('Testimonial deleted successfully!', 'success');
      fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      showToast(error.message, 'error');
    }
  };

  const approvedCount = testimonials.filter(t => t.approved).length;
  const pendingCount = testimonials.filter(t => !t.approved).length;

  return (
    <div className="cms-page">
      <div className="content-section">
        <div className="section-header">
          <div>
            <h3 className="section-title">Manage Testimonials</h3>
            <p className="section-subtitle">Review and approve customer testimonials</p>
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
            <div style={{ padding: '10px 15px', background: '#f0f0f0', borderRadius: '6px', color: '#333' }}>
              <strong>Total:</strong> {testimonials.length}
            </div>
            <div style={{ padding: '10px 15px', background: '#e8f5e9', borderRadius: '6px', color: '#333' }}>
              <strong>Published:</strong> {approvedCount}
            </div>
            <div style={{ padding: '10px 15px', background: '#fff3e0', borderRadius: '6px', color: '#333' }}>
              <strong>Pending:</strong> {pendingCount}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading testimonials...</p>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="empty-state">
            <FaComments className="empty-icon" />
            <p>No testimonials yet</p>
          </div>
        ) : (
          <div className="testimonials-grid">
            {/* Pending Testimonials */}
            {pendingCount > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h4 style={{ marginBottom: '20px', color: '#ff9800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ⏳ Pending Approval ({pendingCount})
                </h4>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {testimonials
                    .filter(t => !t.approved)
                    .map((testimonial) => (
                      <div key={testimonial._id} className="testimonial-admin-card pending">
                        <div className="testimonial-admin-header">
                          <div>
                            <h4>{testimonial.name}</h4>
                            <p className="testimonial-admin-location">{testimonial.postalAddress}</p>
                            {testimonial.mobileNumber && (
                              <p className="testimonial-admin-contact">{testimonial.mobileNumber}</p>
                            )}
                          </div>
                          <span className="testimonial-admin-status pending-badge">Pending</span>
                        </div>
                        <div className="testimonial-admin-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                              style={{ color: i < testimonial.rating ? '#ffc107' : '#ddd' }}
                            />
                          ))}
                          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                            {testimonial.rating} out of 5
                          </span>
                        </div>
                        <p className="testimonial-admin-text">"{testimonial.testimonialText}"</p>
                        <div className="testimonial-admin-actions">
                          <button
                            onClick={() => handleApprove(testimonial._id)}
                            className="btn-admin-approve"
                            title="Approve and publish"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleDelete(testimonial._id)}
                            className="btn-admin-delete"
                            title="Delete testimonial"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Published Testimonials */}
            {approvedCount > 0 && (
              <div>
                <h4 style={{ marginBottom: '20px', color: '#4caf50', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✓ Published ({approvedCount})
                </h4>
                <div style={{ display: 'grid', gap: '20px' }}>
                  {testimonials
                    .filter(t => t.approved)
                    .map((testimonial) => (
                      <div key={testimonial._id} className="testimonial-admin-card approved">
                        <div className="testimonial-admin-header">
                          <div>
                            <h4>{testimonial.name}</h4>
                            <p className="testimonial-admin-location">{testimonial.postalAddress}</p>
                            {testimonial.mobileNumber && (
                              <p className="testimonial-admin-contact">{testimonial.mobileNumber}</p>
                            )}
                          </div>
                          <span className="testimonial-admin-status approved-badge">Published</span>
                        </div>
                        <div className="testimonial-admin-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <FaStar
                              key={i}
                              className={i < testimonial.rating ? 'star-filled' : 'star-empty'}
                              style={{ color: i < testimonial.rating ? '#ffc107' : '#ddd' }}
                            />
                          ))}
                          <span style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                            {testimonial.rating} out of 5
                          </span>
                        </div>
                        <p className="testimonial-admin-text">"{testimonial.testimonialText}"</p>
                        <div className="testimonial-admin-actions">
                          <button
                            onClick={() => handleDeny(testimonial._id)}
                            className="btn-admin-unpublish"
                            title="Unpublish testimonial"
                          >
                            <FaTimes /> Unpublish
                          </button>
                          <button
                            onClick={() => handleDelete(testimonial._id)}
                            className="btn-admin-delete"
                            title="Delete testimonial"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .testimonial-admin-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
        }

        .testimonial-admin-card.pending {
          border-left: 4px solid #ff9800;
          background: #fffbf0;
        }

        .testimonial-admin-card.approved {
          border-left: 4px solid #4caf50;
          background: #f1f8f4;
        }

        .testimonial-admin-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .testimonial-admin-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
          gap: 20px;
        }

        .testimonial-admin-header h4 {
          margin: 0 0 5px 0;
          font-size: 16px;
          color: #333;
        }

        .testimonial-admin-location {
          margin: 3px 0;
          font-size: 14px;
          color: #666;
        }

        .testimonial-admin-contact {
          margin: 3px 0;
          font-size: 13px;
          color: #999;
        }

        .testimonial-admin-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        .pending-badge {
          background: #ffe0b2;
          color: #e65100;
        }

        .approved-badge {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .testimonial-admin-rating {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          gap: 4px;
        }

        .testimonial-admin-rating svg {
          font-size: 16px;
        }

        .testimonial-admin-text {
          margin: 15px 0;
          font-style: italic;
          color: #555;
          line-height: 1.5;
          border-left: 3px solid #ddd;
          padding-left: 15px;
        }

        .testimonial-admin-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .btn-admin-approve,
        .btn-admin-unpublish,
        .btn-admin-delete {
          padding: 8px 14px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }

        .btn-admin-approve {
          background: #4caf50;
          color: white;
        }

        .btn-admin-approve:hover {
          background: #45a049;
          transform: translateY(-2px);
        }

        .btn-admin-unpublish {
          background: #ff9800;
          color: white;
        }

        .btn-admin-unpublish:hover {
          background: #fb8c00;
          transform: translateY(-2px);
        }

        .btn-admin-delete {
          background: #f44336;
          color: white;
        }

        .btn-admin-delete:hover {
          background: #da190b;
          transform: translateY(-2px);
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #666;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: #999;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 15px;
          opacity: 0.5;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          flex-wrap: wrap;
          gap: 20px;
        }

        .section-subtitle {
          margin: 5px 0 0 0;
          color: #999;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default TestimonialsPage;
