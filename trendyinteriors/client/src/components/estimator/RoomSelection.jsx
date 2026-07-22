import React from 'react';
import { FaPlus, FaMinus, FaHome } from 'react-icons/fa';

const RoomSelection = ({ rooms = [], loading = false, selectedRooms, isStepCompleted, onUpdateRoomCount, onNext }) => {
  const hasSelection = Object.keys(selectedRooms).length > 0 || isStepCompleted;
  const getRoomLimit = (room = {}) => Math.max(
    1,
    Number(room.maxSelectableRooms) || (
      String(room.name || '').toLowerCase().includes('bedroom') ? 6 : 2
    ),
  );

  return (
    <div className="room-selection-container">
      <div className="room-selection-header">
        <h2>Select Your Spaces</h2>
        <p>Which areas of your home would you like to design today? Select the quantity for each.</p>
      </div>

      {loading ? (
        <div className="selected-summary" style={{ textAlign: 'center' }}>
          Loading rooms...
        </div>
      ) : rooms.length === 0 ? (
        <div className="selected-summary" style={{ textAlign: 'center' }}>
          No rooms are available right now. Please check back later.
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map((room) => {
            const count = selectedRooms[room.name] || 0;
            const maxCount = getRoomLimit(room);
            return (
              <div
                key={room._id || room.id}
                className={`room-card room-card-${room.id} ${count > 0 ? 'selected' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url('${room.image}')`,
                }}
              >
                <div className="room-icon"><FaHome /></div>
                <div className="room-name">{room.name}</div>

                <div className="room-counter" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="counter-btn"
                    onClick={() => onUpdateRoomCount(room.name, count - 1)}
                    disabled={count === 0}
                    aria-label="Decrease quantity"
                  >
                    <FaMinus size={10} />
                  </button>
                  <span className="counter-value">{count}</span>
                  <button
                    className="counter-btn"
                    onClick={() => onUpdateRoomCount(room.name, Math.min(maxCount, count + 1))}
                    disabled={count >= maxCount}
                    aria-label="Increase quantity"
                    title={`Maximum ${maxCount}`}
                  >
                    <FaPlus size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasSelection && (
        <div className="selected-summary">
          <strong>Selected:</strong>{' '}
          {Object.entries(selectedRooms)
            .map(([name, qty]) => `${qty} ${name}${qty > 1 ? 's' : ''}`)
            .join(', ')}
        </div>
      )}

      <div className="estimator-actions">
        <button className="btn-secondary btn-hidden" onClick={() => {}}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext} disabled={!hasSelection || loading || rooms.length === 0}>
          Next
        </button>
      </div>
    </div>
  );
};

export default RoomSelection;
