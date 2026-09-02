import React, { useEffect, useState, useCallback } from 'react';
import { FaUserShield, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import FormCard from '../components/FormCard';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { useCms } from '../context/CmsContext';
import { useAuth } from '../context/AuthContext';
import { cmsGet, cmsPost, cmsDelete } from '../utils/cmsApi';
import { validatePassword, getPasswordStrengthMessage } from '../utils/passwordValidation';
import './AdminUsersPage.css';

const emptyForm = { name: '', email: '', password: '', confirmPassword: '' };

const AdminUsersPage = () => {
  const { showToast } = useCms();
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, itemId: '', itemName: '', isLoading: false });

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cmsGet('/admin-users');
      setAdmins(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const validation = validatePassword(form.password);
    if (!validation.isValid) {
      const errors = Object.values(validation.errors).filter(Boolean);
      showToast(errors.join('. '), 'error');
      return;
    }

    if (form.password !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSubmitLoading(true);
    try {
      await cmsPost('/admin-users', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      showToast('Admin user added successfully!', 'success');
      setForm(emptyForm);
      setShowForm(false);
      fetchAdmins();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteClick = (admin) => {
    setDeleteModal({ isOpen: true, itemId: admin._id, itemName: admin.name, isLoading: false });
  };

  const confirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await cmsDelete(`/admin-users/${deleteModal.itemId}`);
      showToast('Admin user removed successfully!', 'success');
      setAdmins((prev) => prev.filter((a) => a._id !== deleteModal.itemId));
      setDeleteModal({ isOpen: false, itemId: '', itemName: '', isLoading: false });
    } catch (error) {
      showToast(error.message, 'error');
      setDeleteModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="cms-page">
      <div className="admin-section-wrapper" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-section" style={{ maxWidth: '720px' }}>
          <FormCard title="Admin Users" icon={<FaUserShield />}>
            <p style={{ margin: '0 0 1.25rem', color: 'var(--color-gray)', fontSize: '0.9rem' }}>
              People listed here can log in to this admin panel with full access. Add trusted teammates only.
            </p>

            {!showForm && (
              <button
                type="button"
                className="btn-publish"
                onClick={() => setShowForm(true)}
                style={{ marginBottom: '1.25rem' }}
              >
                <FaPlus /> Add Admin
              </button>
            )}

            {showForm && (
              <form onSubmit={handleSubmit} className="admin-form form-subsection" style={{ marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label htmlFor="admin-name">Name</label>
                  <input
                    id="admin-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-email">Email</label>
                  <input
                    id="admin-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    id="admin-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="form-input"
                    required
                  />
                  <small style={{ color: 'var(--color-gray)' }}>{getPasswordStrengthMessage()}</small>
                </div>
                <div className="form-group">
                  <label htmlFor="admin-confirm-password">Confirm Password</label>
                  <input
                    id="admin-confirm-password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-actions-footer">
                  <button type="submit" disabled={submitLoading} className="btn-publish">
                    {submitLoading ? 'Adding...' : 'Add Admin'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={submitLoading}
                    onClick={() => {
                      setShowForm(false);
                      setForm(emptyForm);
                    }}
                  >
                    <FaTimes /> Cancel
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading admin users...</p>
              </div>
            ) : (
              <div className="admin-users-list">
                {admins.map((admin) => (
                  <div key={admin._id} className="admin-user-card">
                    <div className="admin-user-card-info">
                      <span className="room-name">{admin.name}</span>
                      {admin._id === user?._id && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: 'var(--color-gold)' }}>(You)</span>
                      )}
                      <div style={{ color: 'var(--color-gray)', fontSize: '0.85rem', wordBreak: 'break-all' }}>{admin.email}</div>
                      <div style={{ color: 'var(--color-gray)', fontSize: '0.75rem' }}>Added {formatDate(admin.createdAt)}</div>
                    </div>
                    <button
                      type="button"
                      className="admin-user-remove-btn"
                      onClick={() => handleDeleteClick(admin)}
                      disabled={admin._id === user?._id || admins.length <= 1}
                      title={admin._id === user?._id ? 'You cannot remove your own account' : 'Remove admin'}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </FormCard>
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Remove Admin User?"
        message="Are you sure you want to revoke admin panel access for"
        itemName={deleteModal.itemName}
        isLoading={deleteModal.isLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, itemId: '', itemName: '', isLoading: false })}
      />
    </div>
  );
};

export default AdminUsersPage;
