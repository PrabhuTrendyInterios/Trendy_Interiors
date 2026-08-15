import React, { useEffect, useState, useCallback } from 'react';
import {
  FaArrowDown,
  FaArrowUp,
  FaDoorOpen,
  FaEdit,
  FaGripVertical,
  FaPlus,
  FaTrash,
} from 'react-icons/fa';
import RoomEditorModal from '../components/RoomEditorModal';
import { useCms } from '../context/CmsContext';
import { cmsGet, cmsPost, cmsPut, cmsDelete } from '../utils/cmsApi';
import '../components/RoomEditorModal.css';

const RoomsPage = () => {
  const { showToast } = useCms();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [draggedRoomId, setDraggedRoomId] = useState(null);
  const [dragOverRoomId, setDragOverRoomId] = useState(null);
  const [reordering, setReordering] = useState(false);

  const fetchRooms = useCallback(async () => {
    try {
      const data = await cmsGet('/rooms?includeInactive=true');
      setRooms(data.data || []);
    } catch (error) {
      showToast(error.message, 'error');
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const openCreate = () => {
    setEditingRoom(null);
    setEditorOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditingRoom(null);
  };

  const handleSave = async (form) => {
    setSubmitLoading(true);

    try {
      if (editingRoom?._id) {
        await cmsPut(`/rooms/${editingRoom._id}`, form);
        showToast('Room updated successfully!', 'success');
      } else {
        await cmsPost('/rooms', form);
        showToast('Room created successfully!', 'success');
      }
      closeEditor();
      fetchRooms();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room and all nested configuration?')) return;

    try {
      await cmsDelete(`/rooms/${id}`);
      showToast('Room deleted!', 'success');
      if (editingRoom?._id === id) closeEditor();
      fetchRooms();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  const persistRoomOrder = async (nextRooms, previousRooms) => {
    setRooms(nextRooms);
    setReordering(true);

    try {
      const response = await cmsPut('/rooms/reorder', {
        orderedRoomIds: nextRooms.map((room) => room._id),
      });
      setRooms(response.data || nextRooms);
      showToast('Room visibility order updated!', 'success');
    } catch (error) {
      setRooms(previousRooms);
      showToast(error.message, 'error');
    } finally {
      setReordering(false);
    }
  };

  const moveRoom = (roomId, targetIndex) => {
    if (reordering) return;

    const sourceIndex = rooms.findIndex((room) => room._id === roomId);
    const boundedTargetIndex = Math.max(0, Math.min(rooms.length - 1, targetIndex));
    if (sourceIndex < 0 || sourceIndex === boundedTargetIndex) return;

    const previousRooms = [...rooms];
    const nextRooms = [...rooms];
    const [movedRoom] = nextRooms.splice(sourceIndex, 1);
    nextRooms.splice(boundedTargetIndex, 0, movedRoom);
    persistRoomOrder(nextRooms, previousRooms);
  };

  const handleDrop = (targetRoomId) => {
    const sourceRoomId = draggedRoomId;
    setDraggedRoomId(null);
    setDragOverRoomId(null);

    if (!sourceRoomId || sourceRoomId === targetRoomId || reordering) return;
    const targetIndex = rooms.findIndex((room) => room._id === targetRoomId);
    moveRoom(sourceRoomId, targetIndex);
  };

  return (
    <div className="cms-page">
      <div className="rooms-page-toolbar">
        <div>
          <p className="rooms-page-desc">
            Manage room types with embedded dimensions, layouts, and addons — all stored on a single room document.
          </p>
        </div>
        <button type="button" className="btn-publish" onClick={openCreate}>
          <FaPlus /> Create Room
        </button>
      </div>

      <div className="content-section">
        <div className="section-header">
          <h3 className="section-title">All Rooms</h3>
          <span className="item-count">{rooms.length}</span>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="empty-state">
            <FaDoorOpen className="empty-icon" />
            <p>No rooms configured yet</p>
            <button type="button" className="btn-publish" onClick={openCreate} style={{ marginTop: '1rem' }}>
              <FaPlus /> Create First Room
            </button>
          </div>
        ) : (
          <div className="rooms-table-wrap">
            <table className="rooms-table">
              <thead>
                <tr>
                  <th className="rooms-drag-column"><span className="sr-only">Reorder</span></th>
                  <th>Room</th>
                  <th>Price / sq.ft</th>
                  <th>Status</th>
                  <th>Max selection</th>
                  <th>Nested Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room, index) => (
                  <tr
                    key={room._id}
                    draggable={!reordering}
                    className={`${draggedRoomId === room._id ? 'is-dragging' : ''} ${dragOverRoomId === room._id ? 'is-drag-over' : ''}`}
                    onDragStart={(event) => {
                      setDraggedRoomId(room._id);
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', room._id);
                    }}
                    onDragEnter={() => draggedRoomId && draggedRoomId !== room._id && setDragOverRoomId(room._id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleDrop(room._id);
                    }}
                    onDragEnd={() => {
                      setDraggedRoomId(null);
                      setDragOverRoomId(null);
                    }}
                  >
                    <td className="rooms-drag-cell">
                      <div className="rooms-drag-controls">
                        <span className="rooms-drag-handle" title="Drag to reorder" aria-hidden="true">
                          <FaGripVertical />
                        </span>
                        <div className="rooms-order-buttons">
                          <button
                            type="button"
                            onClick={() => moveRoom(room._id, index - 1)}
                            disabled={reordering || index === 0}
                            aria-label={`Move ${room.name} up`}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRoom(room._id, index + 1)}
                            disabled={reordering || index === rooms.length - 1}
                            aria-label={`Move ${room.name} down`}
                          >
                            <FaArrowDown />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="rooms-table-room">
                        {room.imageUrl && (
                          <img src={room.imageUrl} alt={room.name} className="rooms-table-thumb" />
                        )}
                        <div>
                          <strong>{room.name}</strong>
                          {room.description && <p>{room.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td>₹{Number(room.pricePerSqFt || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`cms-badge ${room.status === 'active' ? 'active' : 'inactive'}`}>
                        {room.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{room.maxSelectableRooms || 2}</td>
                    <td className="rooms-table-meta">
                      {room.dimensions?.length || 0} dim · {room.layouts?.length || 0} layout ·{' '}
                      {room.addons?.length || 0} addon
                    </td>
                    <td>
                      <div className="cms-nested-actions">
                        <button type="button" className="btn-action-edit" onClick={() => openEdit(room)} title="Edit">
                          <FaEdit />
                        </button>
                        <button type="button" className="btn-action-delete" onClick={() => handleDelete(room._id)} title="Delete">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="rooms-order-status" aria-live="polite">
          {reordering ? 'Saving room order...' : ''}
        </p>
      </div>

      <RoomEditorModal
        isOpen={editorOpen}
        room={editingRoom}
        isSaving={submitLoading}
        onClose={closeEditor}
        onSave={handleSave}
      />
    </div>
  );
};

export default RoomsPage;
