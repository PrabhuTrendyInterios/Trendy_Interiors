import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaFileDownload, FaSpinner } from 'react-icons/fa';
import { useCms } from '../context/CmsContext';
import { cmsGet } from '../utils/cmsApi';
import './EstimateDetailsPage.css';

const EstimateDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCms();
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const data = await cmsGet(`/estimators/${id}`);
        setEstimate(data.data);
      } catch (error) {
        showToast(error.message, 'error');
        setTimeout(() => navigate('/estimates'), 2000);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEstimate();
    }
  }, [id, showToast, navigate]);

  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/estimators/${id}/pdf/download`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Trendy_Interiors_Quotation_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="estimate-details-page">
        <div className="loading-state">
          <FaSpinner className="spinner-icon" />
          <p>Loading estimate details...</p>
        </div>
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="estimate-details-page">
        <div className="error-state">
          <p>Estimate not found</p>
          <Link to="/estimates" className="btn-back">
            <FaArrowLeft /> Back to Estimates
          </Link>
        </div>
      </div>
    );
  }

  const normalizeEntries = (value) => {
    if (!value || typeof value !== 'object') return [];
    if (typeof value.entries === 'function') return Array.from(value.entries());
    return Object.entries(value);
  };

  const rooms = normalizeEntries(estimate.rooms);
  const dimensions = normalizeEntries(estimate.roomDimensionsByRoom);
  const addons = Array.isArray(estimate.extraAddons) ? estimate.extraAddons : [];

  return (
    <div className="estimate-details-page">
      {/* Header */}
      <div className="details-header">
        <div className="header-nav">
          <Link to="/estimates" className="btn-back">
            <FaArrowLeft /> Back to Estimates
          </Link>
        </div>

        <div className="header-title">
          <h1>{estimate.customerInfo?.name || 'Estimate'}</h1>
          <p>Ref: {estimate._id}</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="btn-download-pdf"
          >
            <FaFileDownload /> {downloadingPDF ? 'Downloading...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Main content grid */}
      <div className="details-grid">
        {/* Left column: Customer & Project Info */}
        <div className="details-column">
          {/* Customer Information */}
          <div className="details-section">
            <h2 className="section-title">Customer Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Name</label>
                <p>{estimate.customerInfo?.name || '—'}</p>
              </div>
              <div className="info-item">
                <label>Email</label>
                <p>
                  {estimate.customerInfo?.email ? (
                    <a href={`mailto:${estimate.customerInfo.email}`}>
                      {estimate.customerInfo.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div className="info-item">
                <label>Phone</label>
                <p>
                  {estimate.customerInfo?.phone ? (
                    <a href={`tel:${estimate.customerInfo.phone}`}>
                      {estimate.customerInfo.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div className="info-item">
                <label>Location</label>
                <p>{estimate.customerInfo?.location || '—'}</p>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="details-section">
            <h2 className="section-title">Project Summary</h2>
            <div className="info-grid">
              <div className="info-item">
                <label>Status</label>
                <p>
                  <span className={`status-badge status-${estimate.status}`}>
                    {estimate.status}
                  </span>
                </p>
              </div>
              <div className="info-item">
                <label>Total Area</label>
                <p>{estimate.quoteSummary?.totalAreaSqFt || 0} sq.ft</p>
              </div>
              <div className="info-item">
                <label>Submitted Date</label>
                <p>{formatDate(estimate.createdAt)}</p>
              </div>
              {estimate.updatedAt && (
                <div className="info-item">
                  <label>Last Updated</label>
                  <p>{formatDate(estimate.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rooms Overview */}
          {rooms.length > 0 && (
            <div className="details-section">
              <h2 className="section-title">Rooms Included</h2>
              <div className="rooms-list">
                {rooms.map(([roomId, quantity]) => (
                  <div key={roomId} className="room-item">
                    <span className="room-name">{roomId}</span>
                    <span className="room-quantity">× {quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Details & Breakdown */}
        <div className="details-column">
          {/* Room Dimensions */}
          {dimensions.length > 0 && (
            <div className="details-section">
              <h2 className="section-title">Room Dimensions</h2>
              <div className="dimensions-list">
                {dimensions.map(([roomId, dims]) => (
                  <div key={roomId} className="dimension-item">
                    <h4>{roomId}</h4>
                    {Array.isArray(dims) && dims.length > 0 ? (
                      <ul>
                        {dims.map((dim, idx) => (
                          <li key={idx}>
                            {dim.name}: {dim.length}ft × {dim.width}ft
                            {dim.layout && <span className="dim-layout"> ({dim.layout})</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-data">No dimensions specified</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Addons */}
          {addons && addons.length > 0 && (
            <div className="details-section">
              <h2 className="section-title">Extra Addons</h2>
              <div className="addons-list">
                {addons.map((addon, idx) => (
                  <div key={idx} className="addon-item">
                    <div className="addon-info">
                      <span className="addon-name">{addon.name || 'Addon'}</span>
                      <span className="addon-qty">Qty: {addon.quantity || 1}</span>
                    </div>
                    <span className="addon-price">
                      {formatCurrency((addon.price || 0) * (addon.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {estimate.quoteSummary && (
            <div className="details-section cost-section">
              <h2 className="section-title">Cost Breakdown</h2>
              <div className="cost-breakdown">
                <div className="cost-row">
                  <span className="cost-label">Base Cost (Rooms)</span>
                  <span className="cost-value">
                    {formatCurrency(estimate.quoteSummary.totalBasePrice || 0)}
                  </span>
                </div>

                <div className="cost-row">
                  <span className="cost-label">Addons</span>
                  <span className="cost-value">
                    {formatCurrency(estimate.quoteSummary.totalAddonsPrice || 0)}
                  </span>
                </div>

                <div className="cost-row">
                  <span className="cost-label">Discount</span>
                  <span className="cost-value discount">
                    {estimate.quoteSummary.discountPercentage || 0}%
                  </span>
                </div>

                <div className="cost-row">
                  <span className="cost-label">Discount Amount</span>
                  <span className="cost-value discount">
                    -{formatCurrency(estimate.quoteSummary.discountAmount || 0)}
                  </span>
                </div>

                <div className="cost-divider" />

                <div className="cost-row total">
                  <span className="cost-label">Total Estimated Amount</span>
                  <span className="cost-value total">
                    {formatCurrency(estimate.quoteSummary.estimatedAmount || 0)}
                  </span>
                </div>

                <div className="cost-row validity">
                  <span className="cost-label">Quotation Validity</span>
                  <span className="cost-value">
                    {estimate.quoteSummary.validityInDays || 30} days
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      {estimate.notes && (
        <div className="details-section full-width">
          <h2 className="section-title">Notes</h2>
          <p className="notes-content">{estimate.notes}</p>
        </div>
      )}

      {/* Footer actions */}
      <div className="details-footer">
        <Link to="/estimates" className="btn-back">
          <FaArrowLeft /> Back to Estimates
        </Link>
      </div>
    </div>
  );
};

export default EstimateDetailsPage;
