import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaCalendarAlt, FaChevronRight } from 'react-icons/fa';
import { useCms } from '../context/CmsContext';
import { cmsGet } from '../utils/cmsApi';
import './MeetingRequestsPage.css';

const statusOptions = ['all', 'Pending', 'Confirmed', 'Completed', 'Cancelled'];

const MeetingRequestsPage = () => {
  const { showToast } = useCms();
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const fetchMeetingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cmsGet('/meeting-requests');
      setMeetingRequests(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setMeetingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMeetingRequests();
  }, [fetchMeetingRequests]);

  const filteredRequests = useMemo(() => {
    let results = [...meetingRequests];

    if (searchName.trim()) {
      const query = searchName.toLowerCase();
      results = results.filter((request) =>
        (request.name || '').toLowerCase().includes(query)
      );
    }

    if (searchEmail.trim()) {
      const query = searchEmail.toLowerCase();
      results = results.filter((request) =>
        (request.email || '').toLowerCase().includes(query)
      );
    }

    if (searchPhone.trim()) {
      const query = searchPhone.toLowerCase();
      results = results.filter((request) =>
        (request.phone || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      results = results.filter((request) => request.status === statusFilter);
    }

    if (sortBy === 'recent') {
      results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'date') {
      results.sort((a, b) => {
        const aDate = a.preferredDate ? new Date(a.preferredDate) : new Date(0);
        const bDate = b.preferredDate ? new Date(b.preferredDate) : new Date(0);
        return aDate - bDate;
      });
    }

    return results;
  }, [meetingRequests, searchName, searchEmail, searchPhone, statusFilter, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
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
    <div className="cms-page meetings-page">
      <div className="meetings-toolbar">
        <div className="meetings-title">
          <FaCalendarAlt className="meetings-icon" />
          <div>
            <h2>Meeting Requests</h2>
            <p>Review and manage meeting requests from the chatbot.</p>
          </div>
        </div>

        <div className="meetings-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input select-control"
            title="Sort meeting requests"
          >
            <option value="recent">Recent First</option>
            <option value="oldest">Oldest First</option>
            <option value="date">Preferred Date</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input select-control"
            title="Filter by status"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="meetings-filters">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name..."
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

      <div className="meetings-header">
        <h3>
          {filteredRequests.length}{' '}
          {filteredRequests.length === 1 ? 'Meeting Request' : 'Meeting Requests'}
          {(searchName || searchEmail || searchPhone || statusFilter !== 'all') && ' (Filtered)'}
        </h3>
      </div>

      <div className="requests-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading meeting requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <FaCalendarAlt className="empty-icon" />
            <p>{meetingRequests.length === 0 ? 'No meeting requests yet' : 'No matching meeting requests found'}</p>
          </div>
        ) : (
          <div className="requests-grid">
            {filteredRequests.map((request) => (
              <div key={request._id} className="request-card">
                <div className="request-card-header">
                  <div>
                    <h4>{request.name || 'Unknown'}</h4>
                    <p className="request-subtitle">{request.email || 'No email provided'}</p>
                  </div>
                  <span className={`status-badge status-${request.status.toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>

                <div className="request-card-body">
                  <div className="detail-row">
                    <span className="label">Phone</span>
                    <span>{request.phone || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Preferred Date</span>
                    <span>{request.preferredDate || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Preferred Time</span>
                    <span>{request.preferredTime || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Requested</span>
                    <span>{formatDate(request.createdAt)}</span>
                  </div>
                </div>

                <div className="request-actions">
                  <Link to={`/admin/meetings/${request._id}`} className="btn-action btn-view">
                    <FaChevronRight /> View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingRequestsPage;
