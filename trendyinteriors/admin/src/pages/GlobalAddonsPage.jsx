import React, { useEffect, useState, useCallback } from 'react';

import { FaTrash, FaPlus, FaEdit, FaTimes, FaPuzzlePiece } from 'react-icons/fa';

import FormCard from '../components/FormCard';

import { useCms } from '../context/CmsContext';

import { cmsGet, cmsPost, cmsPut, cmsDelete } from '../utils/cmsApi';



const emptyAddon = {

  name: '',

  price: 0,

  size: '',

  description: '',

  imageUrl: '',

  active: true,

  order: 0,

};



const GlobalAddonsPage = () => {

  const { showToast } = useCms();

  const [addons, setAddons] = useState([]);

  const [loading, setLoading] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);

  const [form, setForm] = useState(emptyAddon);

  const [editingId, setEditingId] = useState(null);



  const fetchAddons = useCallback(async () => {
    try {
      const data = await cmsGet('/global-addons?includeInactive=true');
      setAddons(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setAddons([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);



  const resetForm = () => {

    setForm(emptyAddon);

    setEditingId(null);

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    setSubmitLoading(true);



    try {

      const payload = {

        ...form,

        price: Number(form.price) || 0,

        size: form.size || '',

        order: Number(form.order) || 0,

      };



      if (editingId) {

        await cmsPut(`/global-addons/${editingId}`, payload);

        showToast('Global addon updated!', 'success');

      } else {

        await cmsPost('/global-addons', payload);

        showToast('Global addon created!', 'success');

      }

      resetForm();

      fetchAddons();

    } catch (error) {

      showToast(error.message, 'error');

    } finally {

      setSubmitLoading(false);

    }

  };



  const handleEdit = (addon) => {

    setForm({

      name: addon.name,

      price: addon.price,

      size: addon.size || '',

      description: addon.description || '',

      imageUrl: addon.imageUrl || '',

      active: addon.active !== false,

      order: addon.order || 0,

    });

    setEditingId(addon._id);

    window.scrollTo({ top: 0, behavior: 'smooth' });

  };



  const handleDelete = async (id) => {

    if (!window.confirm('Delete this global addon?')) return;



    try {

      await cmsDelete(`/global-addons/${id}`);

      showToast('Global addon deleted!', 'success');

      if (editingId === id) resetForm();

      fetchAddons();

    } catch (error) {

      showToast(error.message, 'error');

    }

  };



  return (

    <div className="cms-page">

      <div className="admin-section-wrapper">

        <div className="form-section">

          <FormCard

            title={editingId ? 'Update Global Addon' : 'Add Global Addon'}

            icon={editingId ? <FaEdit /> : <FaPlus />}

          >

            <form onSubmit={handleSubmit} className="admin-form">

              <div className="form-group">

                <label htmlFor="addon-name">

                  Name <span className="required">*</span>

                </label>

                <input

                  id="addon-name"

                  type="text"

                  value={form.name}

                  onChange={(e) => setForm({ ...form, name: e.target.value })}

                  required

                  className="form-input"

                />

              </div>

              <div className="form-group">

                <label htmlFor="addon-price">

                  Price (₹) <span className="required">*</span>

                </label>

                <input

                  id="addon-price"

                  type="number"

                  min="0"

                  value={form.price}

                  onChange={(e) => setForm({ ...form, price: e.target.value })}

                  required

                  className="form-input"

                />

              </div>

              <div className="form-group">

                <label htmlFor="addon-size">Size / Unit</label>

                <input

                  id="addon-size"

                  type="text"

                  value={form.size}

                  onChange={(e) => setForm({ ...form, size: e.target.value })}

                  className="form-input"

                  placeholder="e.g. 4 X 6 sqft, per unit"

                />

              </div>

              <div className="form-group">

                <label htmlFor="addon-description">Description</label>

                <textarea

                  id="addon-description"

                  value={form.description}

                  onChange={(e) => setForm({ ...form, description: e.target.value })}

                  rows="3"

                  className="form-textarea"

                />

              </div>

              <div className="form-group">

                <label htmlFor="addon-image">Image URL</label>

                <input

                  id="addon-image"

                  type="url"

                  value={form.imageUrl}

                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}

                  className="form-input"

                  placeholder="https://..."

                />

              </div>

              <div className="form-row">

                <div className="form-group small">

                  <label htmlFor="addon-order">Display Order</label>

                  <input

                    id="addon-order"

                    type="number"

                    value={form.order}

                    onChange={(e) => setForm({ ...form, order: e.target.value })}

                    className="form-input"

                  />

                </div>

                <div className="form-group small checkbox-group">

                  <label>Active</label>

                  <button
                    type="button"
                    className={`form-toggle ${form.active ? 'checked' : ''}`}
                    onClick={() => setForm({ ...form, active: !form.active })}
                    aria-pressed={form.active}
                    title={form.active ? 'Deactivate addon' : 'Activate addon'}
                  >
                    {form.active && <span aria-hidden="true">✓</span>}
                  </button>

                </div>

              </div>

              <div className="form-actions-footer">

                <button type="submit" disabled={submitLoading} className="btn-publish">

                  {submitLoading ? 'Saving...' : editingId ? 'Update Addon' : 'Create Addon'}

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

            <h3 className="section-title">Global Addons</h3>

            <span className="item-count">{addons.length}</span>

          </div>

          {loading ? (

            <div className="loading-state">

              <div className="spinner" />

            </div>

          ) : addons.length === 0 ? (

            <div className="empty-state">

              <FaPuzzlePiece className="empty-icon" />

              <p>No global addons yet</p>

            </div>

          ) : (

            <div className="content-grid">

              {addons.map((addon) => (

                <div key={addon._id} className="content-card">

                  <div className="content-card-body" style={{ padding: '1.25rem' }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                      <h4>{addon.name}</h4>

                      <span className={`cms-badge ${addon.active ? 'active' : 'inactive'}`}>

                        {addon.active ? 'Active' : 'Inactive'}

                      </span>

                    </div>

                    <p style={{ fontSize: '1.25rem', color: 'var(--color-gold)', fontWeight: 700, margin: '0.5rem 0' }}>

                      ₹{Number(addon.price).toLocaleString('en-IN')}

                    </p>

                    {addon.size && (

                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600, margin: '0 0 0.5rem' }}>

                        Size: {addon.size}

                      </p>

                    )}

                    <p>{addon.description || 'No description'}</p>

                  </div>

                  <div className="content-card-actions">

                    <button type="button" onClick={() => handleEdit(addon)} className="btn-action-edit">

                      <FaEdit />

                    </button>

                    <button type="button" onClick={() => handleDelete(addon._id)} className="btn-action-delete">

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



export default GlobalAddonsPage;

