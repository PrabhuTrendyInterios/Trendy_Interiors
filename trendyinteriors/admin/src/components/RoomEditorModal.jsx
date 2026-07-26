import React, { useEffect, useState } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';
import DragDropUpload from './DragDropUpload';
import RoomNestedManager from './RoomNestedManager';
import DimensionPackageManager from './DimensionPackageManager';
import LayoutDimensionMaterialsManager from './LayoutDimensionMaterialsManager';
import generateObjectId from '../utils/generateObjectId';
import './RoomEditorModal.css';

export const emptyRoom = {
  name: '',
  description: '',
  imageUrl: '',
  pricePerSqFt: '',
  status: 'active',
  allowCustomDimensions: false,
  requiresDimensions: true,
  maxSelectableRooms: 2,
  dimensions: [],
  layouts: [],
  addons: [],
};

const DIMENSION_FIELDS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Standard' },
  { key: 'length', label: 'Length (ft)', type: 'number', step: '0.1', min: 0 },
  { key: 'width', label: 'Width (ft)', type: 'number', step: '0.1', min: 0 },
  { key: 'height', label: 'Height (ft)', type: 'number', step: '0.1', min: 0 },
];

const LAYOUT_FIELDS = [
  { key: 'name', label: 'Name', required: true, fullWidth: true },
  { key: 'imageUrl', label: 'Image URL', fullWidth: true, placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, rows: 2 },
  { key: 'fixedPrice', label: 'Fixed Price (₹)', type: 'number', min: 0 },
  {
    key: 'hasLayoutMaterials',
    label: 'Enable Layout-Specific Materials',
    type: 'checkbox',
    fullWidth: true,
  },
];

const ADDON_FIELDS = [
  { key: 'name', label: 'Name', required: true, fullWidth: true },
  { key: 'imageUrl', label: 'Image URL', fullWidth: true, placeholder: 'https://...' },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, rows: 2 },
  { key: 'price', label: 'Price (₹)', type: 'number', min: 0 },
];

export const normalizeRoomFromApi = (room = {}) => ({
  name: room.name || '',
  description: room.description || '',
  imageUrl: room.imageUrl || room.image || '',
  pricePerSqFt: room.pricePerSqFt ?? '',
  status: room.status || (room.active === false ? 'inactive' : 'active'),
  allowCustomDimensions: room.allowCustomDimensions ?? false,
  requiresDimensions: room.requiresDimensions ?? true,
  maxSelectableRooms: room.maxSelectableRooms ?? (
    String(room.name || '').toLowerCase().includes('bedroom') ? 6 : 2
  ),
  dimensions: (room.dimensions || []).map((d) => ({
    ...d,
    name: d.name || d.label || '',
    packageComponents: (d.packageComponents || []).map((pc) => ({
      ...pc,
      name: pc.name || '',
      description: pc.description || '',
      price: pc.price ?? 0,
      mandatory: pc.mandatory ?? false,
      displayOrder: pc.displayOrder ?? 0,
    })),
  })),
  layouts: (room.layouts || []).map((l) => ({
    ...l,
    imageUrl: l.imageUrl || l.image || '',
    fixedPrice: l.fixedPrice ?? l.price ?? 0,
    hasLayoutMaterials: l.hasLayoutMaterials ?? false,
    configurations: Array.isArray(l.configurations)
      ? l.configurations.map((config) => ({
          ...config,
          dimensionId: config.dimensionId,
          materials: (config.materials || []).map((material) => ({
            ...material,
            name: material.name || '',
            size: material.size || '',
            price: material.price ?? 0,
            mandatory: material.mandatory ?? false,
          })),
        }))
      : [],
  })),
  addons: (room.addons || []).map((a) => ({
    ...a,
    imageUrl: a.imageUrl || a.image || '',
  })),
});

const RoomEditorModal = ({ isOpen, room, isSaving, onClose, onSave }) => {
  const [form, setForm] = useState(emptyRoom);

  useEffect(() => {
    if (isOpen) {
      setForm(room ? normalizeRoomFromApi(room) : emptyRoom);
    }
  }, [isOpen, room]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      pricePerSqFt: Number(form.pricePerSqFt) || 0,
      maxSelectableRooms: Math.min(20, Math.max(1, Number(form.maxSelectableRooms) || 1)),
    });
  };

  const ensureDimensionId = (dimensionIndex) => {
    const dimension = form.dimensions[dimensionIndex];
    if (!dimension) return null;
    if (dimension._id) return String(dimension._id);

    const newId = generateObjectId();
    const dimensions = [...form.dimensions];
    dimensions[dimensionIndex] = { ...dimension, _id: newId };
    setForm({ ...form, dimensions });
    return newId;
  };

  return (
    <div className="room-editor-overlay" onClick={onClose} role="presentation">
      <div
        className="room-editor-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-editor-title"
      >
        <div className="room-editor-header">
          <div>
            <h2 id="room-editor-title">{room ? 'Edit Room' : 'Create Room'}</h2>
            <p>All dimensions, layouts, and addons are saved on this room document.</p>
          </div>
          <button type="button" className="room-editor-close" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="room-editor-body admin-form">
          <section className="room-editor-section">
            <h4 className="subsection-title">Room Details</h4>
            <div className="form-group">
              <label htmlFor="room-name">
                Name <span className="required">*</span>
              </label>
              <input
                id="room-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="room-description">Description</label>
              <textarea
                id="room-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows="3"
                className="form-textarea"
              />
            </div>
            <div className="form-row">
              <div className="form-group small">
                <label htmlFor="room-price">
                  Price Per SqFt (₹) <span className="required">*</span>
                </label>
                <input
                  id="room-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.pricePerSqFt}
                  onChange={(e) => setForm({ ...form, pricePerSqFt: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group small">
                <label htmlFor="room-status">Status</label>
                <select
                  id="room-status"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="form-input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group small">
                <label htmlFor="room-max-selectable">Maximum Selectable Rooms</label>
                <input
                  id="room-max-selectable"
                  type="number"
                  min="1"
                  max="20"
                  step="1"
                  value={form.maxSelectableRooms}
                  onChange={(e) => setForm({ ...form, maxSelectableRooms: e.target.value })}
                  required
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group small">
                <label>Require Dimensions</label>
                <div className="checkbox-row">
                  <button
                    type="button"
                    className={`form-toggle ${form.requiresDimensions ? 'checked' : ''}`}
                    onClick={() => setForm({ ...form, requiresDimensions: !form.requiresDimensions })}
                    aria-pressed={form.requiresDimensions}
                    title={form.requiresDimensions ? 'Disable dimension requirement' : 'Require dimensions'}
                  >
                    {form.requiresDimensions && <span aria-hidden="true">✓</span>}
                  </button>
                  <span>Room must have dimensions</span>
                </div>
              </div>
              <div className="form-group small">
                <label>Allow Custom Dimensions</label>
                <div className="checkbox-row">
                  <button
                    type="button"
                    className={`form-toggle ${form.allowCustomDimensions ? 'checked' : ''}`}
                    onClick={() => setForm({ ...form, allowCustomDimensions: !form.allowCustomDimensions })}
                    aria-pressed={form.allowCustomDimensions}
                    disabled={!form.requiresDimensions}
                    title={!form.requiresDimensions ? 'Enable "Require Dimensions" first' : (form.allowCustomDimensions ? 'Disable custom room sizing' : 'Enable custom room sizing')}
                  >
                    {form.allowCustomDimensions && <span aria-hidden="true">✓</span>}
                  </button>
                  <span>Enable custom room sizing</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="room-image-url">Image URL</label>
              <input
                id="room-image-url"
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="https://..."
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Or upload image</label>
              <DragDropUpload
                imageUrl={form.imageUrl}
                onImageUrlChange={(url) => setForm({ ...form, imageUrl: url })}
                label="Room Image"
              />
            </div>
          </section>

          <section className="room-editor-section">
            <RoomNestedManager
              title="Dimensions"
              items={form.dimensions}
              emptyItem={{ name: '', length: '', width: '', height: '' }}
              fields={DIMENSION_FIELDS}
              onChange={(dimensions) => setForm({ ...form, dimensions })}
              renderSummary={(item) => (
                <>
                  <h5>{item.name}</h5>
                  <p>
                    {item.length || 0} × {item.width || 0} × {item.height || 0} ft
                  </p>
                </>
              )}
            />
          </section>

          <section className="room-editor-section">
            <DimensionPackageManager
              dimensions={form.dimensions}
              onChange={(dimensions) => setForm({ ...form, dimensions })}
            />
          </section>

          <section className="room-editor-section">
            <RoomNestedManager
              title="Layouts"
              items={form.layouts}
              emptyItem={{
                name: '',
                imageUrl: '',
                description: '',
                fixedPrice: '',
                hasLayoutMaterials: false,
                configurations: [],
              }}
              fields={LAYOUT_FIELDS}
              onChange={(layouts) => setForm({ ...form, layouts })}
              reorderable
              renderFormExtras={(draft, setDraft) =>
                draft.hasLayoutMaterials ? (
                  <LayoutDimensionMaterialsManager
                    dimensions={form.dimensions}
                    configurations={draft.configurations || []}
                    onChange={(configurations) => setDraft({ ...draft, configurations })}
                    onEnsureDimensionId={ensureDimensionId}
                  />
                ) : null
              }
              renderSummary={(item) => (
                <>
                  <h5>{item.name}</h5>
                  {item.description && <p>{item.description}</p>}
                </>
              )}
            />
          </section>

          <section className="room-editor-section">
            <RoomNestedManager
              title="Room Addons"
              items={form.addons}
              emptyItem={{ name: '', imageUrl: '', description: '', price: '' }}
              fields={ADDON_FIELDS}
              onChange={(addons) => setForm({ ...form, addons })}
              renderSummary={(item) => (
                <>
                  <h5>{item.name}</h5>
                  <p>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                  {item.description && <p>{item.description}</p>}
                </>
              )}
            />
          </section>

          <div className="room-editor-footer form-actions-footer">
            <button type="submit" disabled={isSaving} className="btn-publish">
              <FaSave /> {isSaving ? 'Saving...' : 'Save Room'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomEditorModal;
