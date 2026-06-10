import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import { useCms } from '../context/CmsContext';
import { cmsGet, cmsPut } from '../utils/cmsApi';
import './MeetingRequestDetailsPage.css';

const statusOptions = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

const MeetingRequestDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useCms();
  const [meetingRequest, setMeetingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Pending');
  const [saving, setSaving] = useState(false);

  const fetchMeetingRequest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cmsGet(`/meeting-requests/${id}`);
      setMeetingRequest(data.data);
      setStatus(data.data?.status || 'Pending');
    } catch (error) {
      showToast(error.message, 'error');
      setTimeout(() => navigate('/admin/meetings'), 2000);
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    if (id) {
      fetchMeetingRequest();
    }
  }, [id, fetchMeetingRequest]);

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleUpdateStatus = async () => {
    if (!meetingRequest || status === meetingRequest.status) return;

    try {
      setSaving(true);
      const data = await cmsPut(`/meeting-requests/${id}/status`, { status });
      setMeetingRequest(data.data);
      showToast('Meeting status updated successfully.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="meeting-details-page">
        <div className="loading-state">
          <FaSpinner className="spinner-icon" />
          <p>Loading meeting request...</p>
        </div>
      </div>
    );
  }

  if (!meetingRequest) {
    return (
      <div className="meeting-details-page">
        <div className="error-state">
          <p>Meeting request not found.</p>
          <Link to="/admin/meetings" className="btn-action btn-view">
            <FaArrowLeft /> Back to Meetings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-page meeting-details-page">
      <div className="details-header">
        <div className="details-nav">
          <Link to="/admin/meetings" className="btn-action btn-view">
            <FaArrowLeft /> Back to Meeting Requests
          </Link>
        </div>
        <div>
          <h2>{meetingRequest.name || 'Meeting Request'}</h2>
          <p>Meeting created on {formatDate(meetingRequest.createdAt)}</p>
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-card">
          <h3>Customer Details</h3>
          <div className="detail-row">
            <span className="label">Name</span>
            <span>{meetingRequest.name || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Email</span>
            <span>{meetingRequest.email || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Phone</span>
            <span>{meetingRequest.phone || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Location</span>
            <span>{meetingRequest.propertyLocation || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Project Type</span>
            <span>{meetingRequest.projectType || '—'}</span>
          </div>
        </div>

        <div className="detail-card">
          <h3>Meeting Details</h3>
          <div className="detail-row">
            <span className="label">Preferred Date</span>
            <span>{meetingRequest.preferredDate || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Preferred Time</span>
            <span>{meetingRequest.preferredTime || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status</span>
            <span className={`status-badge status-${meetingRequest.status.toLowerCase()}`}>
              {meetingRequest.status}
            </span>
          </div>
          <div className="detail-row full-width">
            <span className="label">Message</span>
            <span className="message-box">{meetingRequest.message || 'No message provided.'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Updated</span>
            <span>{meetingRequest.updatedAt ? formatDate(meetingRequest.updatedAt) : '—'}</span>
          </div>
        </div>
      </div>

      <div className="status-section">
        <div className="status-panel">
          <h3>Update Status</h3>
          <div className="form-group">
            <label htmlFor="meeting-status">Select status</label>
            <select
              id="meeting-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="form-input"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleUpdateStatus}
            disabled={saving || status === meetingRequest.status}
            className="btn-action btn-approve"
          >
            {saving ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingRequestDetailsPage;
