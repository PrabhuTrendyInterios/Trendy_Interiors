import React, { useEffect, useState, useCallback } from 'react';
import { FaTrash, FaPlus, FaEdit, FaTimes, FaProjectDiagram } from 'react-icons/fa';
import FormCard from '../components/FormCard';
import DragDropUpload from '../components/DragDropUpload';
import MultiImageUpload from '../components/MultiImageUpload';
import { useCms } from '../context/CmsContext';
import { cmsGet, cmsPost, cmsPut, cmsDelete } from '../utils/cmsApi';
import { getProjectCover } from '../utils/publicApi';

const emptyProject = {
  title: '',
  description: '',
  category: '',
  coverImageUrl: '',
  galleryImages: [],
  displayOrder: 0,
  status: 'active',
};

const normalizeProjectForm = (project) => ({
  title: project.title || '',
  description: project.description || '',
  category: project.category || '',
  coverImageUrl: project.coverImageUrl || project.image || '',
  galleryImages: project.galleryImages || project.images || [],
  displayOrder: project.displayOrder ?? project.order ?? 0,
  status: project.status || 'active',
});

const ProjectsPage = () => {
  const { showToast } = useCms();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [form, setForm] = useState(emptyProject);
  const [editingId, setEditingId] = useState(null);

  const fetchProjects = useCallback(async () => {
    try {
      const data = await cmsGet('/projects?includeInactive=true');
      setProjects(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const resetForm = () => {
    setForm(emptyProject);
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
        await cmsPut(`/projects/${editingId}`, payload);
        showToast('Project updated successfully!', 'success');
      } else {
        await cmsPost('/projects', payload);
        showToast('Project published successfully!', 'success');
      }
      resetForm();
      fetchProjects();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (project) => {
    setForm(normalizeProjectForm(project));
    setEditingId(project._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;

    try {
      await cmsDelete(`/projects/${id}`);
      showToast('Project deleted successfully!', 'success');
      if (editingId === id) resetForm();
      fetchProjects();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  return (
    <div className="cms-page">
      <div className="admin-section-wrapper">
        <div className="form-section">
          <FormCard
            title={editingId ? 'Update Project' : 'Publish New Project'}
            icon={editingId ? <FaEdit /> : <FaPlus />}
          >
            <form onSubmit={handleSubmit} className="admin-form">
              <div className="form-subsection">
                <h4 className="subsection-title">Project Information</h4>
                <div className="form-group">
                  <label htmlFor="project-title">
                    Title <span className="required">*</span>
                  </label>
                  <input
                    id="project-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                    placeholder="e.g. Luxury Apartment in Chennai"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="project-description">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="project-description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows="4"
                    placeholder="Describe the project, location, key features..."
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="form-subsection">
                <h4 className="subsection-title">Category</h4>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">-- Select a category --</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="art-craft">Art & Craft</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group small">
                  <label htmlFor="project-order">Display Order</label>
                  <input
                    id="project-order"
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group small">
                  <label htmlFor="project-status">Status</label>
                  <select
                    id="project-status"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="form-input"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="form-subsection">
                <h4 className="subsection-title">Cover Image URL</h4>
                <input
                  type="url"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="form-input"
                  style={{ marginBottom: '0.75rem' }}
                />
                <DragDropUpload
                  imageUrl={form.coverImageUrl}
                  onImageUrlChange={(url) => setForm({ ...form, coverImageUrl: url })}
                  label="Cover Image"
                />
              </div>

              <div className="form-subsection">
                <h4 className="subsection-title">Gallery Images</h4>
                <p className="subsection-description">Add up to 5 additional images for the slideshow</p>
                <MultiImageUpload
                  images={form.galleryImages}
                  onImagesChange={(galleryImages) => setForm({ ...form, galleryImages })}
                  maxImages={5}
                />
              </div>

              <div className="form-actions-footer">
                <button type="submit" disabled={submitLoading} className="btn-publish">
                  {submitLoading ? 'Saving...' : editingId ? 'Update Project' : 'Publish Project'}
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
            <h3 className="section-title">All Projects</h3>
            <span className="item-count">{projects.length}</span>
          </div>
          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <FaProjectDiagram className="empty-icon" />
              <p>No projects published yet</p>
            </div>
          ) : (
            <div className="content-grid">
              {projects.map((project) => (
                <div key={project._id} className="content-card">
                  <div className="content-card-image">
                    <img src={getProjectCover(project)} alt={project.title} />
                    {project.category && <span className="content-card-badge">{project.category}</span>}
                  </div>
                  <div className="content-card-body">
                    <h4>{project.title}</h4>
                    <p>{project.description}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <span className={`cms-badge ${project.status === 'active' ? 'active' : 'inactive'}`}>
                        {project.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="cms-badge inactive">Order: {project.displayOrder ?? 0}</span>
                    </div>
                  </div>
                  <div className="content-card-actions">
                    <button type="button" onClick={() => handleEdit(project)} className="btn-action-edit">
                      <FaEdit />
                    </button>
                    <button type="button" onClick={() => handleDelete(project._id)} className="btn-action-delete">
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

export default ProjectsPage;
