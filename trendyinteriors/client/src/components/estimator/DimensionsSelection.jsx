import React, { useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { buildRoomInstances, findRoomByName } from '../../utils/estimatorApi';

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80';

const isKitchenRoom = (roomName = '') => String(roomName).toLowerCase().includes('kitchen');

const getRoomOptions = (roomName, roomsCatalog = []) => {
  const room = findRoomByName(roomsCatalog, roomName);
  const layouts = room?.layouts || [];
  const addons = isKitchenRoom(roomName) ? [] : room?.addons || [];

  return {
    showLayout: layouts.length > 0,
    showAddons: addons.length > 0,
    layoutTitle: layouts.length > 0 ? 'Layout Selection' : '',
    addonTitle: addons.length > 0 ? 'Room Add-ons' : '',
    layouts,
    addons,
  };
};

const getDimensionPresets = (roomName, roomsCatalog = []) => {
  const room = findRoomByName(roomsCatalog, roomName);
  const templates = room?.dimensions || [];

  return templates.reduce((presets, template) => {
    const key = template.id || template.name;
    presets[key] = {
      label: template.label || template.name,
      length: Number(template.length) || 0,
      width: Number(template.width) || 0,
      height: Number(template.height) || 0,
    };
    return presets;
  }, {});
};

const getRoomImage = (roomName, roomsCatalog = []) => {
  const room = findRoomByName(roomsCatalog, roomName);
  return room?.image || DEFAULT_ROOM_IMAGE;
};

const getDefaultDimensions = () => ({
  length: '',
  width: '',
  height: '',
  sizeCategory: '',
  selectedDesignIdea: {
    layout: '',
    addons: [],
    room: '',
  },
});

const getDimensionLabel = (dimensions = {}) => {
  const length = Number(dimensions.length) || 0;
  const width = Number(dimensions.width) || 0;

  if (!length || !width) {
    return 'Add measurements';
  }

  return `${length} X ${width} sqft`;
};

const DimensionsSelection = ({
  selectedRooms,
  selectedRoom,
  onSelectRoom,
  roomDimensions,
  onUpdateRoomDimensions,
  onSelectDesignIdea,
  roomsCatalog = [],
  onNext,
  onPrev,
  isCalculating = false,
}) => {
  const [customOpenByRoom, setCustomOpenByRoom] = useState({});
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  const roomEntries = useMemo(() => {
    const selected = selectedRooms || {};
    const orderedSelections = {};

    roomsCatalog.forEach((room) => {
      if (Number(selected[room.name]) > 0) {
        orderedSelections[room.name] = selected[room.name];
      }
    });

    Object.entries(selected).forEach(([roomName, count]) => {
      if (!(roomName in orderedSelections) && Number(count) > 0) {
        orderedSelections[roomName] = count;
      }
    });

    return buildRoomInstances(orderedSelections);
  }, [roomsCatalog, selectedRooms]);
  const roomTypeEntries = useMemo(
    () => Array.from(new Set(roomEntries.map((room) => room.roomName))),
    [roomEntries],
  );

  const selectedRoomType = useMemo(() => {
    if (roomTypeEntries.includes(selectedRoom)) {
      return selectedRoom;
    }

    return roomEntries.find((room) => room.id === selectedRoom)?.roomName || roomTypeEntries[0] || '';
  }, [roomEntries, roomTypeEntries, selectedRoom]);

  const visibleRoomEntries = roomEntries.filter((room) => room.roomName === selectedRoomType);
  const selectedRoomIndex = visibleRoomEntries.findIndex((room) => room.id === selectedRoom);
  const activeRoomEntry = visibleRoomEntries[activeRoomIndex] || visibleRoomEntries[0];
  const selectedRoomData = findRoomByName(roomsCatalog, selectedRoomType);
  const requiresDimensions = selectedRoomData?.requiresDimensions !== false;
  const allowCustomDimensions = Boolean(selectedRoomData?.allowCustomDimensions);
  const currentOptions = getRoomOptions(selectedRoomType, roomsCatalog);
  const dimensionPresets = getDimensionPresets(selectedRoomType, roomsCatalog);
  const presetEntries = Object.entries(dimensionPresets);

  useEffect(() => {
    if (roomEntries.length === 0) {
      return;
    }

    if (!roomEntries.some((room) => room.id === selectedRoom)) {
      const fallbackRoom = roomEntries.find((room) => room.roomName === selectedRoomType) || roomEntries[0];
      onSelectRoom(fallbackRoom.id);
    }
  }, [onSelectRoom, roomEntries, selectedRoom, selectedRoomType]);

  useEffect(() => {
    setActiveRoomIndex(selectedRoomIndex >= 0 ? selectedRoomIndex : 0);
  }, [selectedRoomIndex, selectedRoomType]);

  useEffect(() => {
    if (activeRoomIndex >= visibleRoomEntries.length) {
      setActiveRoomIndex(Math.max(visibleRoomEntries.length - 1, 0));
    }
  }, [activeRoomIndex, visibleRoomEntries.length]);

  const getDimensions = (roomId) => roomDimensions?.[roomId] || getDefaultDimensions();

  const roomIsComplete = (room) => {
    const roomData = findRoomByName(roomsCatalog, room.roomName);
    const dimensions = getDimensions(room.id);
    const roomOptions = getRoomOptions(room.roomName, roomsCatalog);
    const requiresDims = roomData?.requiresDimensions !== false;
    const hasDimensions =
      Number(dimensions.length) > 0 &&
      Number(dimensions.width) > 0 &&
      Number(dimensions.height) > 0;
    const hasLayout = Boolean(dimensions.selectedDesignIdea?.layout);

    if (requiresDims && !hasDimensions) {
      return false;
    }

    if (roomOptions.showLayout && !hasLayout) {
      return false;
    }

    return true;
  };

  const allRoomsConfigured = roomEntries.length > 0 && roomEntries.every(roomIsComplete);
  const completedRoomCount = roomEntries.filter(roomIsComplete).length;
  const completedCategoryRoomCount = visibleRoomEntries.filter(roomIsComplete).length;
  const selectedCategoryIndex = roomTypeEntries.indexOf(selectedRoomType);
  const isLastRoomInCategory = activeRoomIndex === visibleRoomEntries.length - 1;
  const hasPreviousCategory = selectedCategoryIndex > 0;
  const hasNextCategory = selectedCategoryIndex >= 0 && selectedCategoryIndex < roomTypeEntries.length - 1;
  const canGoBackward = activeRoomIndex > 0 || hasPreviousCategory;
  const hasForwardTarget = !isLastRoomInCategory || hasNextCategory;
  const canGoForward = Boolean(activeRoomEntry) && roomIsComplete(activeRoomEntry) && hasForwardTarget;
  const forwardLabel = isLastRoomInCategory ? 'Next category' : 'Next room';

  const navigateBackward = () => {
    if (activeRoomIndex > 0) {
      onSelectRoom(visibleRoomEntries[activeRoomIndex - 1].id);
      return;
    }

    if (hasPreviousCategory) {
      const previousType = roomTypeEntries[selectedCategoryIndex - 1];
      const previousCategoryRooms = roomEntries.filter((room) => room.roomName === previousType);
      onSelectRoom(previousCategoryRooms[previousCategoryRooms.length - 1].id);
    }
  };

  const navigateForward = () => {
    if (!canGoForward) {
      return;
    }

    if (!isLastRoomInCategory) {
      onSelectRoom(visibleRoomEntries[activeRoomIndex + 1].id);
      return;
    }

    const nextType = roomTypeEntries[selectedCategoryIndex + 1];
    const nextCategoryRoom = roomEntries.find((room) => room.roomName === nextType);
    if (nextCategoryRoom) {
      onSelectRoom(nextCategoryRoom.id);
    }
  };

  const saveDesign = (room, nextDesign) => {
    onSelectDesignIdea(room.id, {
      layout: nextDesign.layout || '',
      addons: nextDesign.addons || [],
      room: room.roomName || '',
    });
  };

  const handleSizeSelect = (roomId, sizeKey) => {
    const preset = dimensionPresets[sizeKey];
    if (!preset) return;

    onUpdateRoomDimensions(roomId, 'sizeCategory', sizeKey);
    onUpdateRoomDimensions(roomId, 'length', String(preset.length));
    onUpdateRoomDimensions(roomId, 'width', String(preset.width));
    onUpdateRoomDimensions(roomId, 'height', String(preset.height));
  };

  const handleCustomDimensionChange = (roomId, key, value) => {
    onUpdateRoomDimensions(roomId, key, value);
    if (getDimensions(roomId).sizeCategory) {
      onUpdateRoomDimensions(roomId, 'sizeCategory', '');
    }
  };

  const renderRoomPanel = (room) => {
    const dimensions = getDimensions(room.id);
    const selectedDesign = dimensions.selectedDesignIdea || getDefaultDimensions().selectedDesignIdea;
    const customOpen = Boolean(customOpenByRoom[room.id]);
    const hasDimensions =
      Number(dimensions.length) > 0 &&
      Number(dimensions.width) > 0 &&
      Number(dimensions.height) > 0;
    const canChooseLayout = !requiresDimensions || hasDimensions;

    return (
      <div className="premium-design-control-panel" key={room.id}>
        <span className="premium-panel-label">Room Configuration</span>
        <h3>{room.label}</h3>

        {requiresDimensions && (
          <div className="dimension-input-card">
            <h3>Room Size</h3>
            <div className="size-buttons-container">
              <label>
                {allowCustomDimensions
                  ? 'Select size first, then choose layout:'
                  : 'Select size first:'}
              </label>
              <div className="size-button-group">
                {presetEntries.map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={`size-button ${
                      dimensions.sizeCategory === key && !customOpen
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => {
                      handleSizeSelect(room.id, key);
                      setCustomOpenByRoom((prev) => ({ ...prev, [room.id]: false }));
                    }}
                  >
                    <span>{preset.label}</span>
                    <strong>{preset.length} X {preset.width} sqft</strong>
                  </button>
                ))}
                {allowCustomDimensions && (
                  <button
                    type="button"
                    className={`size-button ${customOpen ? 'selected' : ''}`}
                    onClick={() => setCustomOpenByRoom((prev) => ({ ...prev, [room.id]: !customOpen }))}
                  >
                    Custom
                  </button>
                )}
              </div>
            </div>

            {allowCustomDimensions && customOpen && (
              <>
                <h4>Enter Custom Dimensions</h4>
                <div className="custom-dimensions-inputs">
                  {['length', 'width', 'height'].map((key) => (
                    <div className="custom-input-field" key={key}>
                      <label htmlFor={`${key}-${room.id}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} (ft)
                        <input
                          id={`${key}-${room.id}`}
                          type="number"
                          min="0"
                          step="0.1"
                          value={String(dimensions[key] || '')}
                          onChange={(event) => handleCustomDimensionChange(room.id, key, event.target.value)}
                          placeholder={key === 'height' ? 'e.g. 10' : 'e.g. 12'}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}

            {hasDimensions && (
              <div className="size-info-box">
                <div className="area-card">
                  <span>Selected Size</span>
                  <strong>{getDimensionLabel(dimensions)}</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {!requiresDimensions && (
          <div className="dimension-input-card">
            This room does not require dimensions. Choose a layout below to calculate this space.
          </div>
        )}

        {currentOptions.showLayout && (
          <div className={`premium-design-section ${canChooseLayout ? '' : 'is-disabled'}`}>
            <h4>{currentOptions.layoutTitle}</h4>
            {!canChooseLayout && <p className="dimension-lock-note">Select room size before choosing layout.</p>}

            <div className="premium-image-option-grid">
              {currentOptions.layouts.map((layout) => {
                const layoutLabel = layout.label || layout.name;
                const layoutKey = layout.name || String(layout._id || '');
                const layoutCost = Number(layout.price) || 0;

                return (
                  <button
                    type="button"
                    key={layoutKey}
                    className={`premium-image-option ${selectedDesign.layout === layoutKey ? 'selected' : ''}`}
                    style={{ backgroundImage: layout.image ? `url(${layout.image})` : undefined }}
                    onClick={() => canChooseLayout && saveDesign(room, { ...selectedDesign, layout: layoutKey })}
                    disabled={!canChooseLayout}
                  >
                    <div className="premium-image-option-overlay"></div>
                    <span>{layoutLabel}</span>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: '#f7df8c' }}>
                      ₹{layoutCost.toLocaleString('en-IN')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentOptions.showAddons && (
          <div className="premium-design-section">
            <h4>{currentOptions.addonTitle}</h4>
            <div className="premium-image-option-grid">
              {currentOptions.addons.map((addon) => {
                const addonLabel = addon.label || addon.name;
                const addonCost = Number(addon.price) || 0;

                return (
                  <button
                    type="button"
                    key={addonLabel}
                    className={`premium-image-option ${
                      selectedDesign.addons?.includes(addonLabel) ? 'selected' : ''
                    }`}
                    style={{ backgroundImage: addon.image ? `url(${addon.image})` : undefined }}
                    onClick={() => {
                      const currentAddons = selectedDesign.addons || [];
                      const updatedAddons = currentAddons.includes(addonLabel)
                        ? currentAddons.filter((item) => item !== addonLabel)
                        : [...currentAddons, addonLabel];
                      saveDesign(room, { ...selectedDesign, addons: updatedAddons });
                    }}
                  >
                    <div className="premium-image-option-overlay"></div>
                    <span>{addonLabel}</span>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: '#f7df8c' }}>
                      ₹{addonCost.toLocaleString('en-IN')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dimensions-step-container">
      <div className="dimensions-step-header">
        <h2>Room Dimensions & Design Options</h2>
        <p>Configure each selected room in order. Complete the required options to continue.</p>
      </div>

      <div className="premium-design-focus">
        <div
          className="premium-design-image-card"
          style={{ backgroundImage: `url(${getRoomImage(selectedRoomType, roomsCatalog)})` }}
        >
          <div className="premium-design-image-overlay"></div>
          <div className="premium-design-image-content">
            <span>{selectedRoomType || 'Room'}</span>
            <h3>{visibleRoomEntries.length} selected</h3>
            <p>{completedCategoryRoomCount} of {visibleRoomEntries.length || 0} in this category ready</p>
          </div>
        </div>

        <div className="dimensions-room-carousel">
          {hasForwardTarget && (
            <button
              type="button"
              className="room-carousel-arrow room-carousel-next"
              onClick={navigateForward}
              disabled={!canGoForward}
              aria-label={forwardLabel}
              title={forwardLabel}
            >
              <FaChevronLeft />
            </button>
          )}

          <div className="dimensions-room-panels">
            {activeRoomEntry ? renderRoomPanel(activeRoomEntry) : null}
            {activeRoomEntry && (
              <span className="room-carousel-position">
                {activeRoomIndex + 1} / {visibleRoomEntries.length}
              </span>
            )}
          </div>

          {canGoBackward && (
            <button
              type="button"
              className="room-carousel-arrow room-carousel-prev"
              onClick={navigateBackward}
              aria-label="Previous room"
              title="Previous room"
            >
              <FaChevronRight />
            </button>
          )}
        </div>
      </div>

      <div className="quote-progress-note">
        {completedRoomCount} of {roomEntries.length || 0} rooms ready for quote.
      </div>

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onNext}
          disabled={!allRoomsConfigured || isCalculating}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DimensionsSelection;
