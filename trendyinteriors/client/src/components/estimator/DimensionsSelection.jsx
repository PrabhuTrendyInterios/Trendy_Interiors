import React, { useEffect, useMemo } from 'react';

const PLAN_LABELS = {
  starter: 'Starter',
  budgetFriendly: 'Budget Friendly',
  premium: 'Premium',
  signature: 'Luxury',
};

const ROOM_TITLES = {
  'Living Room': 'Living Room',
  Bedroom: 'Bedroom',
  Kitchen: 'Kitchen',
  Bathroom: 'Bathroom',
  'Home Office': 'Home Office',
  'Dining Room': 'Dining Room',
};

const planTags = {
  starter: 'Essentials',
  budgetFriendly: 'Smart Balance',
  premium: 'Elevated',
  signature: 'Signature Luxury',
};

const roomIdeaNames = {
  'Living Room': ['TV Wall & Storage', 'Statement Sofa Zone', 'Feature Ceiling Concept', 'Open Layout Styling', 'Premium Lighting Layer'],
  Bedroom: ['Wardrobe Wall Plan', 'Headboard Feature Design', 'Ambient Lighting Setup', 'Compact Storage Flow', 'Dresser + Mirror Corner'],
  Kitchen: ['Modular Layout Plan', 'Counter + Back splash Mood', 'Tall Unit Composition', 'Island/Peninsula Setup', 'Storage Optimization Design'],
  Bathroom: ['Vanity & Mirror Layout', 'Shower Partition Theme', 'Tile Harmony Board', 'Storage Niche Planning', 'Luxury Fixture Pairing'],
  'Home Office': ['Workstation Layout', 'Shelving + Storage Wall', 'Acoustic Comfort Setup', 'Task Lighting Plan', 'Client-Ready Corner'],
  'Dining Room': ['Dining Wall Feature', 'Table + Pendant Composition', 'Storage Console Design', 'Seating Balance Concept', 'Warm Lighting Mood'],
};

const getCuratedIdeas = (roomName, planTier) => {
  if (!roomName || !planTier) return [];

  const cleanRoom = ROOM_TITLES[roomName] || roomName;
  const names = roomIdeaNames[cleanRoom] || ['Layout Concept', 'Styling Concept', 'Material Concept', 'Lighting Concept', 'Storage Concept'];

  return names.slice(0, 5).map((name, index) => {
    const id = `${roomName}-${planTier}-${index + 1}`;
    return {
      id,
      name: `${name} • ${PLAN_LABELS[planTier] || 'Plan'}`,
      image: `https://picsum.photos/seed/est-${encodeURIComponent(id)}/900/650`,
      room: roomName,
      planTier,
      tag: planTags[planTier] || 'Curated',
    };
  });
};

const DimensionsSelection = ({
  selectedRooms,
  selectedBudget,
  selectedRoom,
  onSelectRoom,
  roomDimensions,
  onUpdateRoomDimensions,
  onSelectDesignIdea,
  onNext,
  onPrev,
}) => {
  const roomEntries = useMemo(
    () =>
      Object.entries(selectedRooms || {}).flatMap(([roomName, count]) =>
        Array.from({ length: Number(count) || 0 }, (_, index) => ({
          id: `${roomName}-${index + 1}`,
          roomName,
          label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
        })),
      ),
    [selectedRooms],
  );

  const selectedRoomEntry = roomEntries.find((room) => room.id === selectedRoom);
  const selectedRoomDimensions = roomDimensions?.[selectedRoom] || {
    length: '',
    width: '',
    height: '',
    selectedDesignIdea: null,
  };

  useEffect(() => {
    if (!selectedRoom && roomEntries.length > 0) {
      onSelectRoom(roomEntries[0].id);
    }
  }, [selectedRoom, roomEntries, onSelectRoom]);

  useEffect(() => {
    if (selectedRoom && !roomEntries.some((room) => room.id === selectedRoom) && roomEntries.length > 0) {
      onSelectRoom(roomEntries[0].id);
    }
  }, [roomEntries, selectedRoom, onSelectRoom]);

  const curatedIdeas = useMemo(() => getCuratedIdeas(selectedRoomEntry?.roomName, selectedBudget), [selectedRoomEntry, selectedBudget]);

  useEffect(() => {
    if (selectedRoomDimensions.selectedDesignIdea && !curatedIdeas.some((idea) => idea.id === selectedRoomDimensions.selectedDesignIdea.id)) {
      onSelectDesignIdea(selectedRoom, null);
    }
  }, [curatedIdeas, selectedRoom, selectedRoomDimensions.selectedDesignIdea, onSelectDesignIdea]);

  const length = Number(selectedRoomDimensions.length) || 0;
  const width = Number(selectedRoomDimensions.width) || 0;
  const area = length * width;

  const roomIsComplete = (roomId) => {
    const dimensions = roomDimensions?.[roomId] || {};
    return Number(dimensions.length) > 0 && Number(dimensions.width) > 0 && Number(dimensions.height) > 0 && Boolean(dimensions.selectedDesignIdea);
  };

  const completedRoomCount = roomEntries.filter((room) => roomIsComplete(room.id)).length;

  const currentRoomIndex = selectedRoom ? roomEntries.findIndex((room) => room.id === selectedRoom) : -1;
  const currentRoomLabel = selectedRoomEntry?.label || 'your selected room';

  const handleRoomMove = (direction) => {
    if (!roomEntries.length) return;

    const fallbackIndex = currentRoomIndex >= 0 ? currentRoomIndex : 0;
    const nextIndex = direction === 'prev' ? fallbackIndex - 1 : fallbackIndex + 1;
    const normalizedIndex = Math.min(Math.max(nextIndex, 0), roomEntries.length - 1);
    onSelectRoom(roomEntries[normalizedIndex].id);
  };

  return (
    <div className="dimensions-step-container">
      <div className="dimensions-step-header">
        <h2>Room Dimensions &amp; Design Ideas</h2>
        <p>Share measurements for each room individually and pick one inspiration idea per room so we can prepare a more accurate quote.</p>
      </div>

      <div className="dimensions-top-row">
        <div className="dimensions-room-selector">
          <label htmlFor="estimator-room">Selected Room</label>
          <select
            id="estimator-room"
            value={selectedRoom || ''}
            onChange={(event) => onSelectRoom(event.target.value)}
            disabled={roomEntries.length === 0}
          >
            {roomEntries.length === 0 ? (
              <option value="">No room selected</option>
            ) : (
              roomEntries.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.label}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="dimensions-plan-pill">
          <span>Plan Tier</span>
          <strong>{PLAN_LABELS[selectedBudget] || 'Not selected'}</strong>
        </div>
      </div>

      <div className="dimensions-room-navigation">
        <button type="button" className="btn-secondary" onClick={() => handleRoomMove('prev')} disabled={currentRoomIndex <= 0}>
          Previous Room
        </button>
        <div className="dimensions-room-status">
          <span>
            Room {currentRoomIndex >= 0 ? currentRoomIndex + 1 : 0} of {roomEntries.length || 0}
          </span>
          <strong>{currentRoomLabel}</strong>
        </div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => handleRoomMove('next')}
          disabled={currentRoomIndex < 0 || currentRoomIndex >= roomEntries.length - 1}
        >
          Next Room
        </button>
      </div>

      <div className="dimensions-layout-grid">
        <div className="dimensions-left-column">
          <div className="dimension-input-card">
            <h3>Technical Inputs</h3>
            <div className="dimension-field-grid">
              <label>
                Length (ft)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(selectedRoomDimensions.length || '')}
                  onChange={(event) => onUpdateRoomDimensions(selectedRoom, 'length', event.target.value)}
                  placeholder="e.g. 16"
                  disabled={!selectedRoom}
                />
              </label>
              <label>
                Width (ft)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(selectedRoomDimensions.width || '')}
                  onChange={(event) => onUpdateRoomDimensions(selectedRoom, 'width', event.target.value)}
                  placeholder="e.g. 12"
                  disabled={!selectedRoom}
                />
              </label>
              <label>
                Height (ft)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(selectedRoomDimensions.height || '')}
                  onChange={(event) => onUpdateRoomDimensions(selectedRoom, 'height', event.target.value)}
                  placeholder="e.g. 10"
                  disabled={!selectedRoom}
                />
              </label>
            </div>

            <div className="area-card">
              <span>Current Room Area</span>
              <strong>{area.toFixed(2)} sq. ft</strong>
            </div>
          </div>

          <div className="room-dimensions-panel">
            <h3>Room Dimension Info</h3>
            <p>Track each selected room here. This panel scrolls independently so the full estimator stays compact.</p>
            <div className="room-completion-list">
              {roomEntries.map((room) => {
                const dimensions = roomDimensions?.[room.id] || {};
                const isComplete = roomIsComplete(room.id);

                return (
                  <div key={room.id} className={`room-completion-item ${room.id === selectedRoom ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                    <span>{room.label}</span>
                    <strong>{isComplete ? 'Ready' : 'Pending'}</strong>
                    <small>
                      {Number(dimensions.length) > 0 && Number(dimensions.width) > 0 && Number(dimensions.height) > 0
                        ? `${(Number(dimensions.length) * Number(dimensions.width)).toFixed(2)} sq. ft`
                        : 'Measurements missing'}
                    </small>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="design-gallery-card">
          <h3>Curated Design Ideas</h3>
          <p>
            Suggestions for <strong>{currentRoomLabel}</strong> under{' '}
            <strong>{PLAN_LABELS[selectedBudget] || 'your plan'}</strong>.
          </p>

          <div className="design-ideas-grid">
            {curatedIdeas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => onSelectDesignIdea(selectedRoom, idea)}
                className={`design-idea-card ${selectedRoomDimensions.selectedDesignIdea?.id === idea.id ? 'selected' : ''}`}
              >
                <img src={idea.image} alt={idea.name} />
                <div className="design-idea-content">
                  <span className="design-idea-tag">{idea.tag}</span>
                  <h4>{idea.name}</h4>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="selected-summary">
        <strong>Selected for quote:</strong>{' '}
        {selectedRoomDimensions.selectedDesignIdea
          ? `${selectedRoomDimensions.selectedDesignIdea.name} (${currentRoomLabel})`
          : 'No design idea selected yet.'}
      </div>

      <div className="quote-progress-note">
        {completedRoomCount} of {roomEntries.length || 0} rooms ready for quote.
      </div>

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button type="button" className="btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default DimensionsSelection;