import React, { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaEdit, FaGripVertical, FaTrash, FaPlus, FaTimes } from 'react-icons/fa';

const RoomNestedManager = ({
  title,
  items = [],
  emptyItem,
  fields,
  onChange,
  renderSummary,
  renderFormExtras,
  reorderable = false,
}) => {
  const [draft, setDraft] = useState(emptyItem);
  const [editIndex, setEditIndex] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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

  const moveItem = (fromIndex, toIndex) => {
    const boundedTarget = Math.max(0, Math.min(items.length - 1, toIndex));
    if (fromIndex < 0 || fromIndex >= items.length || fromIndex === boundedTarget) return;

    const next = [...items];
    const [movedItem] = next.splice(fromIndex, 1);
    next.splice(boundedTarget, 0, movedItem);
    onChange(next);

    if (editIndex === fromIndex) {
      setEditIndex(boundedTarget);
    } else if (editIndex !== null) {
      if (fromIndex < editIndex && boundedTarget >= editIndex) {
        setEditIndex(editIndex - 1);
      } else if (fromIndex > editIndex && boundedTarget <= editIndex) {
        setEditIndex(editIndex + 1);
      }
    }
  };

  const handleDrop = (targetIndex) => {
    const sourceIndex = draggedIndex;
    setDraggedIndex(null);
    setDragOverIndex(null);

    if (sourceIndex === null || sourceIndex === targetIndex) return;
    moveItem(sourceIndex, targetIndex);
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
            <div
              key={item._id || index}
              className={`cms-nested-item ${reorderable ? 'is-reorderable' : ''} ${draggedIndex === index ? 'is-dragging' : ''} ${dragOverIndex === index ? 'is-drag-over' : ''}`}
              draggable={reorderable}
              onDragStart={(event) => {
                if (!reorderable) return;
                setDraggedIndex(index);
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', String(index));
              }}
              onDragEnter={() => {
                if (reorderable && draggedIndex !== null && draggedIndex !== index) {
                  setDragOverIndex(index);
                }
              }}
              onDragOver={(event) => {
                if (!reorderable) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(event) => {
                if (!reorderable) return;
                event.preventDefault();
                handleDrop(index);
              }}
              onDragEnd={() => {
                setDraggedIndex(null);
                setDragOverIndex(null);
              }}
            >
              {reorderable && (
                <div className="cms-nested-reorder">
                  <span className="cms-nested-drag-handle" title="Drag to reorder" aria-hidden="true">
                    <FaGripVertical />
                  </span>
                  <div className="cms-nested-order-buttons">
                    <button
                      type="button"
                      onClick={() => moveItem(index, index - 1)}
                      disabled={index === 0}
                      aria-label={`Move ${title} item up`}
                    >
                      <FaArrowUp />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, index + 1)}
                      disabled={index === items.length - 1}
                      aria-label={`Move ${title} item down`}
                    >
                      <FaArrowDown />
                    </button>
                  </div>
                </div>
              )}
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
                  <button
                    type="button"
                    className={`form-toggle ${draft[field.key] ? 'checked' : ''}`}
                    onClick={() =>
                      setDraft({
                        ...draft,
                        [field.key]: !draft[field.key],
                      })
                    }
                    aria-pressed={Boolean(draft[field.key])}
                    title={draft[field.key] ? 'Deselect option' : 'Select option'}
                  >
                    {draft[field.key] && (
                      <span aria-hidden="true">✓</span>
                    )}
                  </button>
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
          {typeof renderFormExtras === 'function' ? renderFormExtras(draft, setDraft) : null}
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
