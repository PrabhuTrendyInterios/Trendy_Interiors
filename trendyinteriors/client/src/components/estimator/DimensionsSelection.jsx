import React, { useEffect, useMemo } from 'react';
import { buildRoomInstances, findRoomByName } from '../../utils/estimatorApi';

const DEFAULT_ROOM_IMAGE =
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80';

const getRoomOptions = (roomName, roomsCatalog = []) => {
  const room = findRoomByName(roomsCatalog, roomName);
  const layouts = room?.layouts || [];
  const addons = room?.addons || [];

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

const DimensionsSelection = ({
  selectedRooms,
  selectedRoom,
  isStepCompleted,
  onSelectRoom,
  roomDimensions,
  onUpdateRoomDimensions,
  onSelectDesignIdea,
  roomsCatalog = [],
  onNext,
  onPrev,
  isCalculating = false,
}) => {
  const [showCustomDimensions, setShowCustomDimensions] = React.useState(false);

  const roomEntries = useMemo(() => buildRoomInstances(selectedRooms || {}), [selectedRooms]);

  const selectedRoomEntry = roomEntries.find((room) => room.id === selectedRoom);

  const selectedRoomDimensions = roomDimensions?.[selectedRoom] || {
    length: '',
    width: '',
    height: '',
    sizeCategory: '',
    selectedDesignIdea: {
      layout: '',
      addons: [],
      room: '',
    },
  };

  const selectedDesign = selectedRoomDimensions.selectedDesignIdea || {
    layout: '',
    addons: [],
    room: '',
  };

  const currentOptions = getRoomOptions(selectedRoomEntry?.roomName, roomsCatalog);
  const dimensionPresets = getDimensionPresets(selectedRoomEntry?.roomName, roomsCatalog);
  const presetEntries = Object.entries(dimensionPresets);
  const selectedRoomData = selectedRoomEntry
    ? findRoomByName(roomsCatalog, selectedRoomEntry.roomName)
    : null;
  const allowCustomDimensions = Boolean(selectedRoomData?.allowCustomDimensions);
  const requiresDimensions = selectedRoomData?.requiresDimensions !== false;

  useEffect(() => {
    if (!selectedRoom && roomEntries.length > 0) {
      onSelectRoom(roomEntries[0].id);
      setShowCustomDimensions(false);
    }
  }, [selectedRoom, roomEntries, onSelectRoom]);

  useEffect(() => {
    if (!allowCustomDimensions && showCustomDimensions) {
      setShowCustomDimensions(false);
    }
  }, [allowCustomDimensions, showCustomDimensions]);

  useEffect(() => {
    if (
      selectedRoom &&
      !roomEntries.some((room) => room.id === selectedRoom) &&
      roomEntries.length > 0
    ) {
      onSelectRoom(roomEntries[0].id);
      setShowCustomDimensions(false);
    }
  }, [roomEntries, selectedRoom, onSelectRoom]);

  const length = Number(selectedRoomDimensions.length) || 0;
  const width = Number(selectedRoomDimensions.width) || 0;
  const area = length * width;

  const currentRoomIndex = selectedRoom ? roomEntries.findIndex((room) => room.id === selectedRoom) : -1;
  const currentRoomLabel = selectedRoomEntry?.label || 'your selected room';

  const roomIsComplete = (roomId) => {
    const roomEntry = roomEntries.find((room) => room.id === roomId);
    if (!roomEntry) return false;

    const roomData = findRoomByName(roomsCatalog, roomEntry.roomName);
    const requiresDims = roomData?.requiresDimensions !== false;
    const roomOptions = getRoomOptions(roomEntry.roomName, roomsCatalog);
    const dimensions = roomDimensions?.[roomId] || {};
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

  const completedRoomCount = roomEntries.filter((room) => roomIsComplete(room.id)).length;

  const allRoomsConfigured = roomEntries.length > 0 && roomEntries.every((room) => roomIsComplete(room.id));

  const handleRoomMove = (direction) => {
    if (!roomEntries.length) return;

    const fallbackIndex = currentRoomIndex >= 0 ? currentRoomIndex : 0;
    const nextIndex = direction === 'prev' ? fallbackIndex - 1 : fallbackIndex + 1;
    const normalizedIndex = Math.min(Math.max(nextIndex, 0), roomEntries.length - 1);

    onSelectRoom(roomEntries[normalizedIndex].id);
  };

  const saveDesign = (nextDesign) => {
    if (!selectedRoom) return;

    onSelectDesignIdea(selectedRoom, {
      layout: nextDesign.layout || '',
      addons: nextDesign.addons || [],
      room: selectedRoomEntry?.roomName || '',
    });
  };

  const handleLayoutSelect = (layout) => {
    if (!currentOptions.showLayout) return;

    saveDesign({
      ...selectedDesign,
      layout,
    });
  };

  const handleAddonToggle = (addon) => {
    if (!currentOptions.showAddons) return;

    const currentAddons = selectedDesign.addons || [];
    const updatedAddons = currentAddons.includes(addon)
      ? currentAddons.filter((item) => item !== addon)
      : [...currentAddons, addon];

    saveDesign({
      ...selectedDesign,
      addons: updatedAddons,
    });
  };

  const handleSizeSelect = (sizeKey) => {
    if (!selectedRoom) return;

    const preset = dimensionPresets[sizeKey];
    if (!preset) return;

    onUpdateRoomDimensions(selectedRoom, 'sizeCategory', sizeKey);
    onUpdateRoomDimensions(selectedRoom, 'length', String(preset.length));
    onUpdateRoomDimensions(selectedRoom, 'width', String(preset.width));
    onUpdateRoomDimensions(selectedRoom, 'height', String(preset.height));
  };

  const handleCustomDimensionChange = (key, value) => {
    if (!selectedRoom) return;
    onUpdateRoomDimensions(selectedRoom, key, value);
    if (selectedRoomDimensions.sizeCategory) {
      onUpdateRoomDimensions(selectedRoom, 'sizeCategory', '');
    }
  };

  const matchedSize = useMemo(() => {
    const len = Number(selectedRoomDimensions.length) || 0;
    const wid = Number(selectedRoomDimensions.width) || 0;
    const hei = Number(selectedRoomDimensions.height) || 0;

    if (len === 0 || wid === 0 || hei === 0 || presetEntries.length === 0) return null;

    let closestKey = null;
    let smallestDifference = Infinity;

    for (const [key, preset] of presetEntries) {
      const totalDifference =
        Math.abs(preset.length - len) +
        Math.abs(preset.width - wid) +
        Math.abs(preset.height - hei);

      if (totalDifference < smallestDifference) {
        smallestDifference = totalDifference;
        closestKey = key;
      }
    }

    return closestKey;
  }, [
    selectedRoomDimensions.length,
    selectedRoomDimensions.width,
    selectedRoomDimensions.height,
    presetEntries,
  ]);

  const getSelectedSummary = () => {
    if (!currentOptions.showLayout && !currentOptions.showAddons) {
      return `${currentRoomLabel} only requires measurement inputs.`;
    }

    if (currentOptions.showLayout && !selectedDesign.layout) {
      return 'No layout selected yet.';
    }

    if (
      !currentOptions.showLayout &&
      currentOptions.showAddons &&
      (!selectedDesign.addons || selectedDesign.addons.length === 0)
    ) {
      return 'No add-ons selected yet.';
    }

    let layoutText = '';
    if (selectedDesign.layout) {
      const matchedLayout = (currentOptions.layouts || []).find((l) =>
        (l.name && l.name === selectedDesign.layout) ||
        (l.label && l.label === selectedDesign.layout) ||
        String(l._id) === selectedDesign.layout
      );
      layoutText = matchedLayout ? (matchedLayout.label || matchedLayout.name) : selectedDesign.layout;
    }
    const addonsText =
      selectedDesign.addons && selectedDesign.addons.length > 0
        ? selectedDesign.addons.join(', ')
        : '';

    if (layoutText && addonsText) {
      return `${layoutText} with ${addonsText} for ${currentRoomLabel}`;
    }

    if (layoutText) {
      return `${layoutText} for ${currentRoomLabel}`;
    }

    return `${addonsText} for ${currentRoomLabel}`;
  };

  return (
    <div className="dimensions-step-container">
      <div className="dimensions-step-header">
        <h2>Room Dimensions & Design Options</h2>
        <p>
          Add room measurements and select room-specific layout or add-ons only where required.
        </p>
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
      </div>

      <div className="premium-design-focus">
        <div
          className="premium-design-image-card"
          style={{
            backgroundImage: `url(${getRoomImage(selectedRoomEntry?.roomName, roomsCatalog)})`,
          }}
        >
          <div className="premium-design-image-overlay"></div>

          <div className="premium-design-image-content">
            <span>{selectedRoomEntry?.roomName || 'Room'}</span>
            <h3>{currentRoomLabel}</h3>
            <p>{area > 0 ? `${area.toFixed(2)} sq.ft` : 'Add measurements'}</p>
          </div>
        </div>

        <div className="premium-design-control-panel">
          <span className="premium-panel-label">Room Configuration</span>

          <h3>{currentRoomLabel}</h3>

          {currentOptions.showLayout || currentOptions.showAddons ? (
            <p>
              Showing relevant options for <strong>{selectedRoomEntry?.roomName}</strong>.
            </p>
          ) : (
            <p>
              This room only needs measurement details. No layout or add-ons are required.
            </p>
          )}

          {!requiresDimensions && (
            <div className="dimension-input-card">
              {selectedDesign.layout ? (
                <>
                  This room does not require dimensions. Your selected layout <strong>{(() => {
                    const matched = (currentOptions.layouts || []).find((l) =>
                      (l.name && l.name === selectedDesign.layout) ||
                      (l.label && l.label === selectedDesign.layout) ||
                      String(l._id) === selectedDesign.layout
                    );
                    return matched ? (matched.label || matched.name) : selectedDesign.layout;
                  })()}</strong> will be used for pricing.
                </>
              ) : (
                <>This room does not require dimensions. Choose a layout below to calculate the quote for this space.</>
              )}
            </div>
          )}

          {requiresDimensions && (
            <div className="dimension-input-card">
              <h3>Room Size</h3>

            <div className="size-buttons-container">
              <label>
                {allowCustomDimensions
                  ? 'Select a preset size or enter custom dimensions:'
                  : 'Select a preset size:'}
              </label>
              <div className="size-button-group">
                {presetEntries.map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={`size-button ${
                      (matchedSize === key || selectedRoomDimensions.sizeCategory === key) &&
                      !showCustomDimensions
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => {
                      handleSizeSelect(key);
                      setShowCustomDimensions(false);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                {allowCustomDimensions && (
                  <button
                    type="button"
                    className={`size-button ${showCustomDimensions ? 'selected' : ''}`}
                    onClick={() => setShowCustomDimensions(!showCustomDimensions)}
                  >
                    Custom
                  </button>
                )}
              </div>
            </div>

            {allowCustomDimensions && showCustomDimensions && (
              <>
                <h4>Enter Custom Dimensions</h4>

                <div className="custom-dimensions-inputs">
                  <div className="custom-input-field">
                    <label htmlFor={`length-${selectedRoom}`}>
                      Length (ft)
                      <input
                        id={`length-${selectedRoom}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={String(selectedRoomDimensions.length || '')}
                        onChange={(event) => handleCustomDimensionChange('length', event.target.value)}
                        placeholder="e.g. 16"
                        disabled={!selectedRoom}
                      />
                    </label>
                  </div>
                  <div className="custom-input-field">
                    <label htmlFor={`width-${selectedRoom}`}>
                      Width (ft)
                      <input
                        id={`width-${selectedRoom}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={String(selectedRoomDimensions.width || '')}
                        onChange={(event) => handleCustomDimensionChange('width', event.target.value)}
                        placeholder="e.g. 12"
                        disabled={!selectedRoom}
                      />
                    </label>
                  </div>
                  <div className="custom-input-field">
                    <label htmlFor={`height-${selectedRoom}`}>
                      Height (ft)
                      <input
                        id={`height-${selectedRoom}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={String(selectedRoomDimensions.height || '')}
                        onChange={(event) => handleCustomDimensionChange('height', event.target.value)}
                        placeholder="e.g. 10"
                        disabled={!selectedRoom}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {(Number(selectedRoomDimensions.length) > 0 ||
              Number(selectedRoomDimensions.width) > 0 ||
              Number(selectedRoomDimensions.height) > 0) && (
              <div className="size-info-box">
                <div className="area-card">
                  <span>Room Area</span>
                  <strong>{area.toFixed(2)} sq. ft</strong>
                </div>
                {matchedSize && dimensionPresets[matchedSize] && (
                  <div className="size-match-card">
                    <span>Matches</span>
                    <strong>{dimensionPresets[matchedSize].label}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {currentOptions.showLayout && (
            <div className="premium-design-section">
              <h4>{currentOptions.layoutTitle}</h4>

              <div className="premium-image-option-grid">
                {currentOptions.layouts.map((layout) => {
                  const layoutLabel = layout.label || layout.name;
                  const layoutKey = layout.name || String(layout._id || '');
                  const layoutCost = Number(layout.price) || 0;

                  return (
                    <button
                      type="button"
                      key={layoutKey}
                      className={`premium-image-option ${
                        selectedDesign.layout === layoutKey ? 'selected' : ''
                      }`}
                      style={{ backgroundImage: layout.image ? `url(${layout.image})` : undefined }}
                      onClick={() => handleLayoutSelect(layoutKey)}
                    >
                      <div className="premium-image-option-overlay"></div>
                      <span>{layoutLabel}</span>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          fontWeight: 'bold',
                          color: '#d4af37',
                        }}
                      >
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
                      onClick={() => handleAddonToggle(addonLabel)}
                    >
                      <div className="premium-image-option-overlay"></div>
                      <span>{addonLabel}</span>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          marginTop: '4px',
                          fontWeight: 'bold',
                          color: '#d4af37',
                        }}
                      >
                        ₹{addonCost.toLocaleString('en-IN')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {!currentOptions.showLayout && !currentOptions.showAddons && (
            <div className="selected-summary">
              Only measurement inputs are required for this room.
            </div>
          )}
        </div>
      </div>

      <div className="selected-summary">
        <strong>Selected for quote:</strong> {getSelectedSummary()}
      </div>

      <div className="quote-progress-note">
        {completedRoomCount} of {roomEntries.length || 0} rooms ready for quote.
      </div>

      <div className="dimensions-room-navigation">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => handleRoomMove('prev')}
          disabled={currentRoomIndex <= 0}
          aria-label="Previous room"
        >
          ←
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
          aria-label="Next room"
        >
          →
        </button>
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
