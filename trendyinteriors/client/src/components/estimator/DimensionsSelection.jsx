import React, { useEffect, useMemo } from "react";

const SIZE_PRESETS = {
  low: {
    label: "Low",
    length: 10,
    width: 10,
    height: 9,
  },
  mid: {
    label: "Mid",
    length: 14,
    width: 12,
    height: 10,
  },
  large: {
    label: "Large",
    length: 18,
    width: 16,
    height: 11,
  },
};

const PLAN_LABELS = {
  starter: "Starter",
  budgetFriendly: "Budget Friendly",
  premium: "Premium",
  signature: "Luxury",
};

// Layout and Add-on Pricing in INR
const LAYOUT_COSTS = {
  "L Shape": 15000,
  "U Shape": 20000,
  "Straight": 12000,
  "Island": 25000,
  "Sliding Wardrobe": 18000,
  "Hinged Wardrobe": 15000,
};

const ADDON_COSTS = {
  "Chimney": 25000,
  "Tall Unit": 22000,
  "Bed Storage": 20000,
  "Dressing Unit": 25000,
  "Study Unit": 18000,
  "Loft": 30000,
  "TV Unit": 28000,
  "Sofa Setup": 35000,
  "False Ceiling": 40000,
};

const ROOM_IMAGES = {
  Hall:
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
  Bedroom:
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
  Kitchen:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
  "Pooja Room":
    "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=900&q=80",
};

const KITCHEN_LAYOUTS = [
  {
    label: "L Shape",
    image:
      "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "U Shape",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Straight",
    image:
      "https://images.unsplash.com/photo-1556909172-8c2f041fca1e?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Island",
    image:
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=700&q=80",
  },
];

const BEDROOM_LAYOUTS = [
  {
    label: "Sliding Wardrobe",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Hinged Wardrobe",
    image:
      "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=700&q=80",
  },
];

const KITCHEN_ADDONS = [
  {
    label: "Chimney",
    image:
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Tall Unit",
    image:
      "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=700&q=80",
  },
];

const BEDROOM_ADDONS = [
  {
    label: "Bed Storage",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Dressing Unit",
    image:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Study Unit",
    image:
      "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Loft",
    image:
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=700&q=80",
  },
];

const LIVING_ROOM_ADDONS = [
  {
    label: "TV Unit",
    image:
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "Sofa Setup",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80",
  },
  {
    label: "False Ceiling",
    image:
      "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?auto=format&fit=crop&w=700&q=80",
  },
];

const getRoomType = (roomName = "") => {
  const lower = roomName.toLowerCase();

  if (lower.includes("kitchen")) return "Kitchen";
  if (lower.includes("bedroom")) return "Bedroom";
  if (lower.includes("hall")) return "Hall";
  if (lower.includes("pooja")) return "Pooja Room";

  return "General";
};

const getCanonicalRoomName = (roomName = "") => {
  const type = getRoomType(roomName);
  return type === "General" ? String(roomName || "General").trim() || "General" : type;
};

const normalizeRoomsObject = (rooms = {}) => {
  const normalized = {};

  Object.entries(rooms || {}).forEach(([roomName, count]) => {
    const canonicalRoomName = getCanonicalRoomName(roomName);
    normalized[canonicalRoomName] =
      (Number(normalized[canonicalRoomName]) || 0) + (Number(count) || 0);
  });

  return normalized;
};

const getRoomImage = (roomName) => {
  const type = getRoomType(roomName);

  return (
    ROOM_IMAGES[type] ||
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80"
  );
};

const getRoomOptions = (roomName) => {
  const type = getRoomType(roomName);

  if (type === "Kitchen") {
    return {
      showLayout: true,
      showAddons: true,
      layoutTitle: "Kitchen Layout",
      addonTitle: "Kitchen Add-ons",
      layouts: KITCHEN_LAYOUTS,
      addons: KITCHEN_ADDONS,
    };
  }

  if (type === "Bedroom") {
    return {
      showLayout: true,
      showAddons: true,
      layoutTitle: "Wardrobe Type",
      addonTitle: "Bedroom Add-ons",
      layouts: BEDROOM_LAYOUTS,
      addons: BEDROOM_ADDONS,
    };
  }

  if (type === "Hall") {
    return {
      showLayout: false,
      showAddons: true,
      layoutTitle: "",
      addonTitle: "Hall Add-ons",
      layouts: [],
      addons: LIVING_ROOM_ADDONS,
    };
  }

  if (type === "Pooja Room") {
    return {
      showLayout: false,
      showAddons: false,
      layoutTitle: "",
      addonTitle: "",
      layouts: [],
      addons: [],
    };
  }

  return {
    showLayout: false,
    showAddons: false,
    layoutTitle: "",
    addonTitle: "",
    layouts: [],
    addons: [],
  };
};

const DimensionsSelection = ({
  selectedRooms,
  selectedBudget,
  selectedRoom,
  isStepCompleted,
  onSelectRoom,
  roomDimensions,
  onUpdateRoomDimensions,
  onSelectDesignIdea,
  onNext,
  onPrev,
  isCalculating = false,
}) => {
  const [showCustomDimensions, setShowCustomDimensions] = React.useState(false);

  const roomEntries = useMemo(() => {
    const normalizedRooms = normalizeRoomsObject(selectedRooms || {});

    return Object.entries(normalizedRooms).flatMap(([roomName, count]) =>
      Array.from({ length: Number(count) || 0 }, (_, index) => ({
        id: `${roomName}-${index + 1}`,
        roomName,
        label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
      }))
    );
  }, [selectedRooms]);

  const selectedRoomEntry = roomEntries.find((room) => room.id === selectedRoom);

  const selectedRoomDimensions = roomDimensions?.[selectedRoom] || {
    length: "",
    width: "",
    height: "",
    sizeCategory: "",
    selectedDesignIdea: {
      layout: "",
      addons: [],
      room: "",
      roomType: "",
      planTier: "",
    },
  };

  const selectedDesign = selectedRoomDimensions.selectedDesignIdea || {
    layout: "",
    addons: [],
    room: "",
    roomType: "",
    planTier: "",
  };

  const currentOptions = getRoomOptions(selectedRoomEntry?.roomName);

  useEffect(() => {
    if (!selectedRoom && roomEntries.length > 0) {
      onSelectRoom(roomEntries[0].id);
      setShowCustomDimensions(false);
    }
  }, [selectedRoom, roomEntries, onSelectRoom]);

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

  const currentRoomIndex = selectedRoom
    ? roomEntries.findIndex((room) => room.id === selectedRoom)
    : -1;

  const currentRoomLabel = selectedRoomEntry?.label || "your selected room";

  const roomIsComplete = (roomId) => {
    const dimensions = roomDimensions?.[roomId] || {};
    // eslint-disable-next-line no-unused-vars
    const design = dimensions.selectedDesignIdea || {};
    const room = roomEntries.find((item) => item.id === roomId);
    // eslint-disable-next-line no-unused-vars
    const options = getRoomOptions(room?.roomName);

    const hasMeasurements =
      Number(dimensions.length) > 0 &&
      Number(dimensions.width) > 0 &&
      Number(dimensions.height) > 0;

    if (!hasMeasurements) return false;

    return true;
  };

  const completedRoomCount = roomEntries.filter((room) =>
    roomIsComplete(room.id)
  ).length;

  const handleRoomMove = (direction) => {
    if (!roomEntries.length) return;

    const fallbackIndex = currentRoomIndex >= 0 ? currentRoomIndex : 0;
    const nextIndex =
      direction === "prev" ? fallbackIndex - 1 : fallbackIndex + 1;

    const normalizedIndex = Math.min(
      Math.max(nextIndex, 0),
      roomEntries.length - 1
    );

    onSelectRoom(roomEntries[normalizedIndex].id);
  };

  const saveDesign = (nextDesign) => {
    if (!selectedRoom) return;

    onSelectDesignIdea(selectedRoom, {
      layout: nextDesign.layout || "",
      addons: nextDesign.addons || [],
      room: selectedRoomEntry?.roomName || "",
      roomType: getRoomType(selectedRoomEntry?.roomName),
      planTier: selectedBudget,
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

    const preset = SIZE_PRESETS[sizeKey];
    onUpdateRoomDimensions(selectedRoom, "sizeCategory", sizeKey);
    onUpdateRoomDimensions(selectedRoom, "length", String(preset.length));
    onUpdateRoomDimensions(selectedRoom, "width", String(preset.width));
    onUpdateRoomDimensions(selectedRoom, "height", String(preset.height));
  };

  const handleCustomDimensionChange = (key, value) => {
    if (!selectedRoom) return;
    onUpdateRoomDimensions(selectedRoom, key, value);
    // Clear sizeCategory when user starts entering custom dimensions
    if (selectedRoomDimensions.sizeCategory) {
      onUpdateRoomDimensions(selectedRoom, "sizeCategory", "");
    }
  };

  const matchedSize = useMemo(() => {
    const len = Number(selectedRoomDimensions.length) || 0;
    const wid = Number(selectedRoomDimensions.width) || 0;
    const hei = Number(selectedRoomDimensions.height) || 0;

    if (len === 0 || wid === 0 || hei === 0) return null;

    let closestKey = null;
    let smallestDifference = Infinity;

    for (const [key, preset] of Object.entries(SIZE_PRESETS)) {
      const lenDiff = Math.abs(preset.length - len);
      const widDiff = Math.abs(preset.width - wid);
      const heiDiff = Math.abs(preset.height - hei);
      
      const totalDifference = lenDiff + widDiff + heiDiff;
      
      if (totalDifference < smallestDifference) {
        smallestDifference = totalDifference;
        closestKey = key;
      }
    }

    return closestKey;
  }, [selectedRoomDimensions.length, selectedRoomDimensions.width, selectedRoomDimensions.height]);

  const getSelectedSummary = () => {
    if (!currentOptions.showLayout && !currentOptions.showAddons) {
      return `${currentRoomLabel} only requires measurement inputs.`;
    }

    if (currentOptions.showLayout && !selectedDesign.layout) {
      return "No layout selected yet.";
    }

    if (
      !currentOptions.showLayout &&
      currentOptions.showAddons &&
      (!selectedDesign.addons || selectedDesign.addons.length === 0)
    ) {
      return "No add-ons selected yet.";
    }

    const layoutText = selectedDesign.layout ? selectedDesign.layout : "";
    const addonsText =
      selectedDesign.addons && selectedDesign.addons.length > 0
        ? selectedDesign.addons.join(", ")
        : "";

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
          Add room measurements and select room-specific layout or add-ons only
          where required.
        </p>
      </div>

      <div className="dimensions-top-row">
        <div className="dimensions-room-selector">
          <label htmlFor="estimator-room">Selected Room</label>
          <select
            id="estimator-room"
            value={selectedRoom || ""}
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

      <div className="dimensions-room-navigation">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => handleRoomMove("prev")}
          disabled={currentRoomIndex <= 0}
        >
          Previous Room
        </button>

        <div className="dimensions-room-status">
          <span>
            Room {currentRoomIndex >= 0 ? currentRoomIndex + 1 : 0} of{" "}
            {roomEntries.length || 0}
          </span>
          <strong>{currentRoomLabel}</strong>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => handleRoomMove("next")}
          disabled={
            currentRoomIndex < 0 || currentRoomIndex >= roomEntries.length - 1
          }
        >
          Next Room
        </button>
      </div>

      <div className="premium-design-focus">
        <div
          className="premium-design-image-card"
          style={{
            backgroundImage: `url(${getRoomImage(selectedRoomEntry?.roomName)})`,
          }}
        >
          <div className="premium-design-image-overlay"></div>

          <div className="premium-design-image-content">
            <span>{getRoomType(selectedRoomEntry?.roomName)}</span>
            <h3>{currentRoomLabel}</h3>
            <p>{area > 0 ? `${area.toFixed(2)} sq.ft` : "Add measurements"}</p>
          </div>
        </div>

        <div className="premium-design-control-panel">
          <span className="premium-panel-label">
            {PLAN_LABELS[selectedBudget] || "Selected Plan"}
          </span>

          <h3>{currentRoomLabel}</h3>

          {currentOptions.showLayout || currentOptions.showAddons ? (
            <p>
              Showing relevant options for{" "}
              <strong>{getRoomType(selectedRoomEntry?.roomName)}</strong>.
            </p>
          ) : (
            <p>
              This room only needs measurement details. No layout or add-ons are
              required.
            </p>
          )}

          <div className="dimension-input-card">
            <h3>Room Size</h3>

            <div className="size-buttons-container">
              <label>Select a preset size or enter custom dimensions:</label>
              <div className="size-button-group">
                {Object.entries(SIZE_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={`size-button ${
                      (matchedSize === key || selectedRoomDimensions.sizeCategory === key) && !showCustomDimensions
                        ? "selected"
                        : ""
                    }`}
                    onClick={() => {
                      handleSizeSelect(key);
                      setShowCustomDimensions(false);
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={`size-button ${showCustomDimensions ? "selected" : ""}`}
                  onClick={() => setShowCustomDimensions(!showCustomDimensions)}
                >
                  Custom
                </button>
              </div>
            </div>

            {showCustomDimensions && (
              <>
                <h4 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Enter Custom Dimensions</h4>

                <div className="custom-dimensions-inputs">
                  <div className="custom-input-field">
                    <label htmlFor={`length-${selectedRoom}`}>
                      Length (ft)
                      <input
                        id={`length-${selectedRoom}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={String(selectedRoomDimensions.length || "")}
                        onChange={(event) => handleCustomDimensionChange("length", event.target.value)}
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
                        value={String(selectedRoomDimensions.width || "")}
                        onChange={(event) => handleCustomDimensionChange("width", event.target.value)}
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
                        value={String(selectedRoomDimensions.height || "")}
                        onChange={(event) => handleCustomDimensionChange("height", event.target.value)}
                        placeholder="e.g. 10"
                        disabled={!selectedRoom}
                      />
                    </label>
                  </div>
                </div>
              </>
            )}

            {(Number(selectedRoomDimensions.length) > 0 || Number(selectedRoomDimensions.width) > 0 || Number(selectedRoomDimensions.height) > 0) && (
              <div className="size-info-box">
                <div className="area-card">
                  <span>Room Area</span>
                  <strong>{area.toFixed(2)} sq. ft</strong>
                </div>
                {matchedSize && (
                  <div className="size-match-card">
                    <span>Matches</span>
                    <strong>{SIZE_PRESETS[matchedSize].label}</strong>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentOptions.showLayout && (
            <div className="premium-design-section">
              <h4>{currentOptions.layoutTitle}</h4>

              <div className="premium-image-option-grid">
                {currentOptions.layouts.map((layout) => (
                  <button
                    type="button"
                    key={layout.label}
                    className={`premium-image-option ${
                      selectedDesign.layout === layout.label ? "selected" : ""
                    }`}
                    style={{ backgroundImage: `url(${layout.image})` }}
                    onClick={() => handleLayoutSelect(layout.label)}
                  >
                    <div className="premium-image-option-overlay"></div>
                    <span>{layout.label}</span>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: '#d4af37' }}>
                      ₹{(LAYOUT_COSTS[layout.label] || 15000).toLocaleString('en-IN')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentOptions.showAddons && (
            <div className="premium-design-section">
              <h4>{currentOptions.addonTitle}</h4>

              <div className="premium-image-option-grid">
                {currentOptions.addons.map((addon) => (
                  <button
                    type="button"
                    key={addon.label}
                    className={`premium-image-option ${
                      selectedDesign.addons?.includes(addon.label)
                        ? "selected"
                        : ""
                    }`}
                    style={{ backgroundImage: `url(${addon.image})` }}
                    onClick={() => handleAddonToggle(addon.label)}
                  >
                    <div className="premium-image-option-overlay"></div>
                    <span>{addon.label}</span>
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 'bold', color: '#d4af37' }}>
                      ₹{(ADDON_COSTS[addon.label] || 15000).toLocaleString('en-IN')}
                    </div>
                  </button>
                ))}
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

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button
          type="button"
          className="btn-primary"
          onClick={onNext}
          disabled={(!selectedRoomDimensions.length || !selectedRoomDimensions.width || !selectedRoomDimensions.height) && !isStepCompleted}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DimensionsSelection;