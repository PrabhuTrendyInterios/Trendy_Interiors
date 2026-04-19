import React from 'react';
import { FaCouch, FaBed, FaUtensils, FaBath, FaBriefcase, FaCoffee, FaPlus, FaMinus } from 'react-icons/fa';

const rooms = [
  { id: 'livingRoom', name: 'Living Room', icon: <FaCouch />, image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'bedroom', name: 'Bedroom', icon: <FaBed />, image: 'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'kitchen', name: 'Kitchen', icon: <FaUtensils />, image: 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'bathroom', name: 'Bathroom', icon: <FaBath />, image: 'https://images.pexels.com/photos/1910472/pexels-photo-1910472.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'office', name: 'Home Office', icon: <FaBriefcase />, image: 'https://images.pexels.com/photos/1957478/pexels-photo-1957478.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { id: 'dining', name: 'Dining Room', icon: <FaCoffee />, image: 'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

const RoomSelection = ({ selectedRooms, onUpdateRoomCount, onNext }) => {
  const hasSelection = Object.keys(selectedRooms).length > 0;

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
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!hasSelection}
        >
          Next Step &rarr;
        </button>
      </div>
    </div>
  );
};

export default RoomSelection;
