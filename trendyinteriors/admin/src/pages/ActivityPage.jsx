import React, { useEffect, useState, useCallback } from 'react';
import { FaHistory, FaSyncAlt } from 'react-icons/fa';
import FormCard from '../components/FormCard';
import { useCms } from '../context/CmsContext';
import { cmsGet } from '../utils/cmsApi';

const ActivityPage = () => {
  const { showToast } = useCms();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cmsGet('/activity-logs?limit=150');
      setLogs(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="cms-page">
      <div className="admin-section-wrapper" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-section" style={{ maxWidth: '960px' }}>
          <FormCard title="Activity Log" icon={<FaHistory />}>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
              Recent actions taken by admin users across the panel — useful for tracking who changed what.
            </p>

            <button
              type="button"
              className="btn-secondary"
              onClick={fetchLogs}
              disabled={loading}
              style={{ marginBottom: '1.25rem' }}
            >
              <FaSyncAlt /> Refresh
            </button>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading activity...</p>
              </div>
            ) : logs.length === 0 ? (
              <p className="empty-text" style={{ textAlign: 'center', color: 'var(--color-gray)' }}>
                No activity recorded yet.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Resource</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--color-gray)' }}>{formatDate(log.createdAt)}</td>
                        <td>
                          {log.userName}
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-gray)' }}>{log.userEmail}</div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{log.action}</td>
                        <td>{log.resource}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </FormCard>
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
