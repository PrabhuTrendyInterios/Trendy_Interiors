import React, { useEffect, useState, useCallback } from 'react';
import { FaTrash, FaPlus, FaEdit, FaDoorOpen } from 'react-icons/fa';
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
                  <th>Room</th>
                  <th>Price / sq.ft</th>
                  <th>Status</th>
                  <th>Max selection</th>
                  <th>Nested Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room._id}>
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
