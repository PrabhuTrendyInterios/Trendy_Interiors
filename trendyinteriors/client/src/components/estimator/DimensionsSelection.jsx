import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const roomPanelRef = useRef(null);
  const categorySectionRef = useRef(null);

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
  const currentCategoryComplete =
    visibleRoomEntries.length > 0 && visibleRoomEntries.every(roomIsComplete);
  const hasPreviousCategory = selectedCategoryIndex > 0;
  const hasNextCategory =
    selectedCategoryIndex >= 0 && selectedCategoryIndex < roomTypeEntries.length - 1;

  const selectCategoryAtIndex = (categoryIndex) => {
    const roomType = roomTypeEntries[categoryIndex];
    if (!roomType) {
      return;
    }

    const categoryRooms = roomEntries.filter((room) => room.roomName === roomType);
    if (categoryRooms[0]) {
      onSelectRoom(categoryRooms[0].id);
      window.requestAnimationFrame(() => {
        if (roomPanelRef.current) {
          roomPanelRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        if (categorySectionRef.current) {
          categorySectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  };

  const navigateBackward = () => {
    if (hasPreviousCategory) {
      selectCategoryAtIndex(selectedCategoryIndex - 1);
      return;
    }

    onPrev();
  };

  const navigateForward = () => {
    if (!currentCategoryComplete || isCalculating) {
      return;
    }

    if (hasNextCategory) {
      selectCategoryAtIndex(selectedCategoryIndex + 1);
      return;
    }

    if (allRoomsConfigured) {
      onNext();
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
    const hasLayout = Boolean(selectedDesign.layout);
    const canChooseLayout = true;
    const canChooseSize = !currentOptions.showLayout || hasLayout;
    const layoutSection = currentOptions.showLayout ? (
      <div className={`premium-design-section dimension-layout-inline ${canChooseLayout ? '' : 'is-disabled'}`}>
        <h4>{currentOptions.layoutTitle}</h4>

        <div className="dimension-text-option-grid">
          {currentOptions.layouts.map((layout) => {
            const layoutLabel = layout.label || layout.name;
            const layoutKey = layout.name || String(layout._id || '');

            return (
              <button
                type="button"
                key={layoutKey}
                className={`dimension-text-option ${selectedDesign.layout === layoutKey ? 'selected' : ''}`}
                onClick={() => canChooseLayout && saveDesign(room, { ...selectedDesign, layout: layoutKey })}
                disabled={!canChooseLayout}
              >
                <span>{layoutLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

    return (
      <section className="dimensions-room-section" key={room.id} aria-labelledby={`room-title-${room.id}`}>
        <span className="premium-panel-label">Room Configuration</span>
        <h3 id={`room-title-${room.id}`}>{room.label}</h3>

        {requiresDimensions && (
          <div className="dimension-input-card">
            {layoutSection}
            <h3>Room Size</h3>
            <div className={`size-buttons-container ${canChooseSize ? '' : 'is-locked'}`}>
              <label>
                {allowCustomDimensions
                  ? 'Choose a layout, then select size or custom dimensions:'
                  : 'Choose a layout, then select size:'}
              </label>
              {!canChooseSize && (
                <p className="dimension-lock-note">Select a layout to unlock room size options.</p>
              )}
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
                    disabled={!canChooseSize}
                    onClick={() => {
                      if (!canChooseSize) return;
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
                    disabled={!canChooseSize}
                    onClick={() => {
                      if (!canChooseSize) return;
                      setCustomOpenByRoom((prev) => ({ ...prev, [room.id]: !customOpen }));
                    }}
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
          </div>
        )}

        {!requiresDimensions && (
          <div className="dimension-input-card">
            <p className="dimension-lock-note">This room does not require dimensions. Choose a layout below to calculate this space.</p>
            {layoutSection}
          </div>
        )}

        {currentOptions.showAddons && (
          <div className="premium-design-section">
            <h4>{currentOptions.addonTitle}</h4>
            <div className="dimension-text-option-grid">
              {currentOptions.addons.map((addon) => {
                const addonLabel = addon.label || addon.name;
                const addonCost = Number(addon.price) || 0;

                return (
                  <button
                    type="button"
                    key={addonLabel}
                    className={`dimension-text-option ${
                      selectedDesign.addons?.includes(addonLabel) ? 'selected' : ''
                    }`}
                    onClick={() => {
                      const currentAddons = selectedDesign.addons || [];
                      const updatedAddons = currentAddons.includes(addonLabel)
                        ? currentAddons.filter((item) => item !== addonLabel)
                        : [...currentAddons, addonLabel];
                      saveDesign(room, { ...selectedDesign, addons: updatedAddons });
                    }}
                  >
                    <span>{addonLabel}</span>
                    <strong>₹{addonCost.toLocaleString('en-IN')}</strong>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="dimensions-step-container">
      <div className="dimensions-step-header">
        <h2>Room Dimensions & Design Options</h2>
        <p>Swipe through every room in this category, configure each one, then continue to the next category.</p>
      </div>

      <div
        className="dimensions-category-progress"
        aria-label="Room category progress"
        ref={categorySectionRef}
      >
        {roomTypeEntries.map((roomType, index) => {
          const categoryRooms = roomEntries.filter((room) => room.roomName === roomType);
          const completedCount = categoryRooms.filter(roomIsComplete).length;
          const isCurrent = index === selectedCategoryIndex;
          const isComplete = completedCount === categoryRooms.length;

          return (
            <button
              type="button"
              key={roomType}
              className={`dimensions-category-tab ${isCurrent ? 'selected' : ''} ${isComplete ? 'complete' : ''}`}
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => selectCategoryAtIndex(index)}
            >
              <span>{roomType}</span>
              <strong>{completedCount}/{categoryRooms.length}</strong>
            </button>
          );
        })}
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

        <div
          ref={roomPanelRef}
          className="premium-design-control-panel dimensions-category-room-scroll"
          aria-label={`${selectedRoomType} rooms`}
        >
          {visibleRoomEntries.map(renderRoomPanel)}
        </div>
      </div>

      <div className="quote-progress-note">
        {completedRoomCount} of {roomEntries.length || 0} rooms ready for quote.
      </div>

      <div className="estimator-actions">
        <button
          className={`btn-secondary ${hasPreviousCategory ? 'previous-category-btn' : ''}`}
          onClick={navigateBackward}
        >
          {hasPreviousCategory ? 'Previous Category' : 'Back'}
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={navigateForward}
          disabled={!currentCategoryComplete || isCalculating}
        >
          {hasNextCategory ? 'Next Category' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default DimensionsSelection;
