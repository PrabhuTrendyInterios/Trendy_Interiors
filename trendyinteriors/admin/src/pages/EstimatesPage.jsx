import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaFileDownload, FaEye, FaCalculator } from 'react-icons/fa';
import { useCms } from '../context/CmsContext';
import { cmsGet } from '../utils/cmsApi';
import './EstimatesPage.css';

const EstimatesPage = () => {
  const { showToast } = useCms();
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  // Search and filter state
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const fetchEstimates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cmsGet('/estimators');
      setEstimates(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setEstimates([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchEstimates();
  }, [fetchEstimates]);

  // Filter and search logic
  const filteredEstimates = useMemo(() => {
    let results = [...estimates];

    // Name search
    if (searchName.trim()) {
      const query = searchName.toLowerCase();
      results = results.filter((est) =>
        (est.customerInfo?.name || '').toLowerCase().includes(query)
      );
    }

    // Email search
    if (searchEmail.trim()) {
      const query = searchEmail.toLowerCase();
      results = results.filter((est) =>
        (est.customerInfo?.email || '').toLowerCase().includes(query)
      );
    }

    // Phone search
    if (searchPhone.trim()) {
      const query = searchPhone.toLowerCase();
      results = results.filter((est) =>
        (est.customerInfo?.phone || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      results = results.filter((est) => est.status === statusFilter);
    }

    // Sorting
    if (sortBy === 'recent') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      results.sort((a, b) => (b.quoteSummary?.estimatedAmount || 0) - (a.quoteSummary?.estimatedAmount || 0));
    } else if (sortBy === 'lowest') {
      results.sort((a, b) => (a.quoteSummary?.estimatedAmount || 0) - (b.quoteSummary?.estimatedAmount || 0));
    }

    return results;
  }, [estimates, searchName, searchEmail, searchPhone, statusFilter, sortBy]);

  const handleDownloadPDF = async (estimateId) => {
    setDownloadingId(estimateId);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/estimators/${estimateId}/pdf/download`,
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
      link.setAttribute('download', `Trendy_Interiors_Quotation_${estimateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="cms-page estimates-page">
      {/* Toolbar with filters */}
      <div className="estimates-toolbar">
        <div className="estimates-title">
          <FaCalculator className="estimates-icon" />
          <div>
            <h2>Estimate Management</h2>
            <p>View and manage all customer estimates and quotations</p>
          </div>
        </div>

        <div className="estimates-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input sort-select"
            title="Sort estimates"
          >
            <option value="recent">Recent First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input status-select"
            title="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="quoted">Quoted</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Search filters */}
      <div className="estimates-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="email"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by phone..."
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="estimates-header">
        <h3>
          {filteredEstimates.length} {filteredEstimates.length === 1 ? 'Estimate' : 'Estimates'}
          {(searchName || searchEmail || searchPhone || statusFilter !== 'all') && ' (Filtered)'}
        </h3>
      </div>

      {/* Estimates list */}
      <div className="estimates-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading estimates...</p>
          </div>
        ) : filteredEstimates.length === 0 ? (
          <div className="empty-state">
            <FaCalculator className="empty-icon" />
            <p>{estimates.length === 0 ? 'No estimates yet' : 'No matching estimates found'}</p>
          </div>
        ) : (
          <div className="estimates-grid">
            {filteredEstimates.map((estimate) => (
              <div key={estimate._id} className="estimate-card">
                <div className="estimate-card-header">
                  <div className="estimate-customer">
                    <h4>{estimate.customerInfo?.name || 'Unknown Customer'}</h4>
                    <span className={`status-badge status-${estimate.status}`}>
                      {estimate.status}
                    </span>
                  </div>
                  <div className="estimate-amount">
                    {formatCurrency(estimate.quoteSummary?.estimatedAmount || 0)}
                  </div>
                </div>

                <div className="estimate-details">
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{estimate.customerInfo?.email || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{estimate.customerInfo?.phone || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Area:</span>
                    <span className="value">
                      {estimate.quoteSummary?.totalAreaSqFt || 0} sq.ft
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Submitted:</span>
                    <span className="value">{formatDate(estimate.createdAt)}</span>
                  </div>
                </div>

                <div className="estimate-actions">
                  <Link
                    to={`/estimates/${estimate._id}`}
                    className="btn-action btn-view"
                    title="View details"
                  >
                    <FaEye /> View
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(estimate._id)}
                    disabled={downloadingId === estimate._id}
                    className="btn-action btn-download"
                    title="Download PDF quotation"
                  >
                    <FaFileDownload /> {downloadingId === estimate._id ? 'Downloading...' : 'PDF'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EstimatesPage;
