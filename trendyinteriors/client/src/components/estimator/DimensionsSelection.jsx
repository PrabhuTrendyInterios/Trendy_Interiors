import React, { useEffect, useMemo } from "react";

const PLAN_LABELS = {
  starter: "Starter",
  budgetFriendly: "Budget Friendly",
  premium: "Premium",
  signature: "Luxury",
};

const ROOM_IMAGES = {
  "Living Room":
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
  Bedroom:
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=900&q=80",
  Kitchen:
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=80",
  Bathroom:
    "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=900&q=80",
  "Home Office":
    "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
  "Dining Room":
    "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80",
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
  if (lower.includes("living") || lower.includes("hall")) return "Living Room";
  if (lower.includes("bathroom")) return "Bathroom";
  if (lower.includes("dining")) return "Dining Room";
  if (lower.includes("office")) return "Home Office";

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

  if (type === "Living Room") return ROOM_IMAGES["Living Room"];

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

  if (type === "Living Room") {
    return {
      showLayout: false,
      showAddons: true,
      layoutTitle: "",
      addonTitle: "Living Room Add-ons",
      layouts: [],
      addons: LIVING_ROOM_ADDONS,
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
  onSelectRoom,
  roomDimensions,
  onUpdateRoomDimensions,
  onSelectDesignIdea,
  onNext,
  onPrev,
  isCalculating = false,
}) => {
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
    }
  }, [selectedRoom, roomEntries, onSelectRoom]);

  useEffect(() => {
    if (
      selectedRoom &&
      !roomEntries.some((room) => room.id === selectedRoom) &&
      roomEntries.length > 0
    ) {
      onSelectRoom(roomEntries[0].id);
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
    const design = dimensions.selectedDesignIdea || {};
    const room = roomEntries.find((item) => item.id === roomId);
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

        <div className="dimensions-plan-pill">
          <span>Plan Tier</span>
          <strong>{PLAN_LABELS[selectedBudget] || "Not selected"}</strong>
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
            <h3>Technical Inputs</h3>

            <div className="dimension-field-grid">
              <label>
                Length (ft)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={String(selectedRoomDimensions.length || "")}
                  onChange={(event) =>
                    onUpdateRoomDimensions(
                      selectedRoom,
                      "length",
                      event.target.value
                    )
                  }
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
                  value={String(selectedRoomDimensions.width || "")}
                  onChange={(event) =>
                    onUpdateRoomDimensions(
                      selectedRoom,
                      "width",
                      event.target.value
                    )
                  }
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
                  value={String(selectedRoomDimensions.height || "")}
                  onChange={(event) =>
                    onUpdateRoomDimensions(
                      selectedRoom,
                      "height",
                      event.target.value
                    )
                  }
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
          disabled={isCalculating}
        >
          {isCalculating ? "Calculating..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default DimensionsSelection;