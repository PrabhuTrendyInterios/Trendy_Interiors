import React, { useEffect, useState, useCallback } from 'react';
import { FaTrash, FaPlus, FaEdit, FaTimes, FaUsers } from 'react-icons/fa';
import FormCard from '../components/FormCard';
import DragDropUpload from '../components/DragDropUpload';
import { useCms } from '../context/CmsContext';
import { cmsGet, cmsPost, cmsPut, cmsDelete } from '../utils/cmsApi';
import { getMemberImage } from '../utils/publicApi';

const emptyMember = {
  name: '',
  role: '',
  contact: '',
  imageUrl: '',
  displayOrder: 0,
  status: 'active',
  linkedin: '',
  instagram: '',
};

const normalizeMemberForm = (member) => ({
  name: member.name || '',
  role: member.role || '',
  contact: member.contact || member.mobilePhone || '',
  imageUrl: member.imageUrl || member.image || '',
  displayOrder: member.displayOrder ?? member.order ?? 0,
  status: member.status || 'active',
  linkedin: member.linkedin || '',
  instagram: member.instagram || '',
});

const TeamMembersPage = () => {
  const { showToast } = useCms();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState(emptyMember);
  const [editingId, setEditingId] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await cmsGet('/team-members?includeInactive=true');
      setMembers(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const resetForm = () => {
    setForm(emptyMember);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      const payload = {
        ...form,
        displayOrder: Number(form.displayOrder) || 0,
      };

      if (editingId) {
        await cmsPut(`/team-members/${editingId}`, payload);
        showToast('Team member updated!', 'success');
      } else {
        await cmsPost('/team-members', payload);
        showToast('Team member added!', 'success');
      }
      resetForm();
      fetchMembers();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (member) => {
    setForm(normalizeMemberForm(member));
    setEditingId(member._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this team member?')) return;

    try {
      await cmsDelete(`/team-members/${id}`);
      showToast('Team member deleted!', 'success');
      if (editingId === id) resetForm();
      fetchMembers();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="cms-page">
      <div className="admin-section-wrapper">
        <div className="form-section">
          <FormCard
            title={editingId ? 'Update Team Member' : 'Add Team Member'}
            icon={editingId ? <FaEdit /> : <FaPlus />}
          >
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-group">
                <label htmlFor="team-name">
                  Name <span className="required">*</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-role">
                  Role <span className="required">*</span>
                </label>
                <input
                  id="team-role"
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-contact">
                  Contact <span className="required">*</span>
                </label>
                <input
                  id="team-contact"
                  type="text"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  required
                  placeholder="Phone number or email"
                  className="form-input"
                />
              </div>
              <div className="form-row">
                <div className="form-group small">
                  <label htmlFor="team-order">Display Order</label>
                  <input
                    id="team-order"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group small">
                  <label htmlFor="team-status">Status</label>
                  <select
                    id="team-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="team-image-url">Image URL</label>
                <input
                  id="team-image-url"
                  type="url"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                  style={{ marginBottom: '0.75rem' }}
                />
                <DragDropUpload
                  imageUrl={form.imageUrl}
                  onImageUrlChange={(url) => setForm({ ...form, imageUrl: url })}
                  label="Profile Photo"
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-linkedin">LinkedIn (optional)</label>
                <input
                  id="team-linkedin"
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="team-instagram">Instagram (optional)</label>
                <input
                  id="team-instagram"
                  type="url"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  className="form-input"
                />
              </div>
              <div className="form-actions-footer">
                <button type="submit" disabled={submitLoading} className="btn-publish">
                  {submitLoading ? 'Saving...' : editingId ? 'Update Member' : 'Add Member'}
                </button>
                {editingId && (
                  <>
                    <button type="button" onClick={resetForm} className="btn-secondary">
                      <FaTimes /> Cancel
                    </button>
                    <button type="button" onClick={() => handleDelete(editingId)} className="btn-danger">
                      <FaTrash /> Delete
                    </button>
                  </>
                )}
              </div>
            </form>
          </FormCard>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h3 className="section-title">Team Members</h3>
            <span className="item-count">{members.length}</span>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
            </div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <FaUsers className="empty-icon" />
              <p>No team members yet</p>
            </div>
          ) : (
            <div className="content-grid">
              {members.map((member) => (
                <div key={member._id} className="content-card">
                  <div className="content-card-image">
                    <img src={getMemberImage(member)} alt={member.name} />
                  </div>
                  <div className="content-card-body">
                    <h4>{member.name}</h4>
                    <p className="team-role">{member.role}</p>
                    <p style={{ fontSize: '0.85rem', color: '#ccc' }}>{member.contact}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <span className={`cms-badge ${member.status === 'active' ? 'active' : 'inactive'}`}>
                        {member.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="cms-badge inactive">Order: {member.displayOrder ?? 0}</span>
                    </div>
                  </div>
                  <div className="content-card-actions">
                    <button type="button" onClick={() => handleEdit(member)} className="btn-action-edit">
                      <FaEdit />
                    </button>
                    <button type="button" onClick={() => handleDelete(member._id)} className="btn-action-delete">
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamMembersPage;
