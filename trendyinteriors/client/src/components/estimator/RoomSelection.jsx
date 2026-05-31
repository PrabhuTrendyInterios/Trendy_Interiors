import React from 'react';
import { FaCouch, FaBed, FaUtensils, FaPlus, FaMinus, FaPrayingHands } from 'react-icons/fa';

const rooms = [
  { id: 'kitchen', name: 'Kitchen', icon: <FaUtensils />, image: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'bedroom', name: 'Bedroom', icon: <FaBed />, image: 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'hall', name: 'Hall', icon: <FaCouch />, image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'poojaroom', name: 'Pooja Room', icon: <FaPrayingHands />, image: '/images/estimator/poojaroom.png' },
];

const RoomSelection = ({ selectedRooms, isStepCompleted, onUpdateRoomCount, onNext }) => {
  const hasSelection = Object.keys(selectedRooms).length > 0 || isStepCompleted;

  return (
    <div className="room-selection-container">
      <div className="room-selection-header">
        <h2>Select Your Spaces</h2>
        <p>Which areas of your home would you like to design today? Select the quantity for each.</p>
      </div>

      <div className="room-grid">
        {rooms.map((room) => {
          const count = selectedRooms[room.name] || 0;
          return (
            <div
              key={room.id}
              className={`room-card room-card-${room.id} ${count > 0 ? 'selected' : ''}`}
              style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%), url('${room.image}')`,
              }}
            >
              <div className="room-icon">{room.icon}</div>
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
                  onClick={() => onUpdateRoomCount(room.name, count + 1)}
                  aria-label="Increase quantity"
                >
                  <FaPlus size={10} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hasSelection && (
        <div className="selected-summary">
          <strong>Selected:</strong> {
            Object.entries(selectedRooms).map(([name, qty]) => `${qty} ${name}${qty > 1 ? 's' : ''}`).join(', ')
          }
        </div>
      )}

      <div className="estimator-actions">
        <button className="btn-secondary btn-hidden" onClick={() => {}}>
          Back
        </button>
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!hasSelection}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default RoomSelection;
