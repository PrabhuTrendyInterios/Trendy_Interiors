import React from 'react';
import { FaMinus, FaPlus } from 'react-icons/fa';
import {
  formatGlobalAddonForCard,
  getSelectedGlobalAddonEntry,
  isGlobalAddonSelected,
} from '../../utils/estimatorApi';
import './ExtraAddons.css';

const ExtraAddons = ({
  selectedAddons = [],
  isStepCompleted,
  onToggleAddon,
  onUpdateAddonQuantity,
  onNext,
  onPrev,
  addonsOptions = [],
  loading = false,
}) => {
  const availableAddons = addonsOptions.map(formatGlobalAddonForCard);

  const renderAddonRow = (addon) => {
    const isSelected = isGlobalAddonSelected(selectedAddons, addon.id);
    const selectedEntry = getSelectedGlobalAddonEntry(selectedAddons, addon.id);
    const count = selectedEntry?.count || 0;

    return (
      <div
        key={addon.id}
        className={`addon-list-row ${isSelected ? 'selected' : ''}`}
        onClick={() => onToggleAddon(addon.id)}
      >
        <div className="addon-list-main">
          <h3>{addon.name}</h3>
          {addon.description && <p>{addon.description}</p>}
        </div>
        {addon.size && addon.size.trim().toLowerCase() !== 'standard' && (
          <span className="addon-list-size">{addon.size}</span>
        )}
        <span className="addon-list-price">₹{Number(addon.price || 0).toLocaleString('en-IN')}</span>
        <div className="addon-quantity-control" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={() => onUpdateAddonQuantity(addon.id, -1)}
            disabled={!isSelected}
            aria-label={`Decrease ${addon.name}`}
          >
            <FaMinus />
          </button>
          <strong>{count}</strong>
          <button
            type="button"
            onClick={() => onUpdateAddonQuantity(addon.id, 1)}
            aria-label={`Increase ${addon.name}`}
          >
            <FaPlus />
          </button>
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
          <div
            className="addons-list"
            role="region"
            aria-label="Available global add-ons"
            tabIndex={0}
          >
            {availableAddons.map((addon) => renderAddonRow(addon))}
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
