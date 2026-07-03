import React from 'react';
import { formatGlobalAddonForCard, isGlobalAddonSelected } from '../../utils/estimatorApi';
import './ExtraAddons.css';

const ExtraAddons = ({
  selectedAddons = [],
  isStepCompleted,
  onToggleAddon,
  onNext,
  onPrev,
  addonsOptions = [],
  loading = false,
}) => {
  const availableAddons = addonsOptions.map(formatGlobalAddonForCard);

  const renderAddonCard = (addon) => {
    const isSelected = isGlobalAddonSelected(selectedAddons, addon.id);

    return (
      <div
        key={addon.id}
        className={`addon-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggleAddon(addon.id)}
      >
        <div className="addon-image-wrapper">
          {addon.image ? (
            <img src={addon.image} alt={addon.name} />
          ) : (
            <div className="addon-placeholder">+</div>
          )}
          {isSelected && <div className="addon-selected-badge">Selected</div>}
        </div>
        <div className="addon-content">
          <span className="addon-price-hint">{addon.priceHint}</span>
          <h3>{addon.name}</h3>
          <p>{addon.description}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="extra-addons-step">
      <div className="addons-header">
        <h2>Extra Add-ons</h2>
        <p>Enhance your space with these premium optional additions.</p>
      </div>

      <div className="addons-section">
        <h3>Available Add-ons</h3>

        {loading ? (
          <div className="selected-summary">Loading add-ons...</div>
        ) : availableAddons.length === 0 ? (
          <div className="selected-summary">No global add-ons are available right now. You can skip this step.</div>
        ) : (
          <div className="addons-grid">
            {availableAddons.map((addon) => renderAddonCard(addon))}
          </div>
        )}
      </div>

      <div className="skip-note">
        <p>Don't worry, you can always discuss these details later with our consultants.</p>
      </div>

      <div className="estimator-actions">
        <button className="btn-secondary" onClick={onPrev}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ExtraAddons;
