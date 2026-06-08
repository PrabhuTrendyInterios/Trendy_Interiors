import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

const RoomNestedManager = ({ title, items = [], emptyItem, fields, onChange, renderSummary }) => {
  const [draft, setDraft] = useState(emptyItem);
  const [editIndex, setEditIndex] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const resetDraft = () => {
    setDraft(emptyItem);
    setEditIndex(null);
    setFormOpen(false);
  };

  const openCreate = () => {
    setDraft(emptyItem);
    setEditIndex(null);
    setFormOpen(true);
  };

  const openEdit = (index) => {
    setDraft({ ...items[index] });
    setEditIndex(index);
    setFormOpen(true);
  };

  const handleSave = () => {
    const nameField = fields.find((f) => f.key === 'name');
    if (nameField?.required && !String(draft.name || '').trim()) {
      return;
    }

    const next = [...items];
    const payload = { ...draft };

    fields.forEach((field) => {
      if (field.type === 'number') {
        payload[field.key] = Number(draft[field.key]) || 0;
      } else if (field.type === 'checkbox') {
        payload[field.key] = Boolean(draft[field.key]);
      }
    });

    if (editIndex !== null) {
      next[editIndex] = payload;
    } else {
      next.push(payload);
    }

    onChange(next);
    resetDraft();
  };

  const handleRemove = (index) => {
    if (!window.confirm(`Remove this ${title.toLowerCase()} item?`)) return;
    onChange(items.filter((_, i) => i !== index));
    if (editIndex === index) resetDraft();
  };

  return (
    <div className="room-nested-manager">
      <div className="room-nested-header">
        <h4 className="subsection-title">{title}</h4>
        {!formOpen && (
          <button type="button" className="btn-secondary room-nested-add-btn" onClick={openCreate}>
            <FaPlus /> Add
          </button>
        )}
      </div>

      {items.length === 0 && !formOpen && (
        <p className="room-nested-empty">No items yet. Click Add to create one.</p>
      )}

      {items.length > 0 && (
        <div className="cms-nested-list">
          {items.map((item, index) => (
            <div key={item._id || index} className="cms-nested-item">
              <div className="cms-nested-item-info">
                {renderSummary(item)}
              </div>
              <div className="cms-nested-actions">
                <button type="button" className="btn-action-edit" onClick={() => openEdit(index)} title="Edit">
                  <FaEdit />
                </button>
                <button type="button" className="btn-action-delete" onClick={() => handleRemove(index)} title="Delete">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="room-nested-form cms-inline-form">
          <div className="room-nested-form-title">
            {editIndex !== null ? `Edit ${title.slice(0, -1)}` : `New ${title.slice(0, -1)}`}
          </div>
          <div className="form-row">
            {fields.map((field) => (
              <div key={field.key} className={`form-group ${field.fullWidth ? '' : 'small'}`} style={field.fullWidth ? { width: '100%' } : undefined}>
                <label htmlFor={`${title}-${field.key}`}>
                  {field.label}
                  {field.required && <span className="required"> *</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    id={`${title}-${field.key}`}
                    value={draft[field.key] ?? ''}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    className="form-textarea"
                    rows={field.rows || 2}
                    placeholder={field.placeholder}
                  />
                ) : field.type === 'checkbox' ? (
                  <input
                    id={`${title}-${field.key}`}
                    type="checkbox"
                    checked={Boolean(draft[field.key])}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [field.key]: e.target.checked,
                      })
                    }
                    className="form-checkbox"
                  />
                ) : (
                  <input
                    id={`${title}-${field.key}`}
                    type={field.type || 'text'}
                    value={draft[field.key] ?? ''}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        [field.key]: field.type === 'number' ? e.target.value : e.target.value,
                      })
                    }
                    className="form-input"
                    step={field.step || '1'}
                    min={field.min}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="form-actions-footer">
            <button type="button" className="btn-publish" onClick={handleSave}>
              {editIndex !== null ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetDraft}>
              <FaTimes /> Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomNestedManager;
