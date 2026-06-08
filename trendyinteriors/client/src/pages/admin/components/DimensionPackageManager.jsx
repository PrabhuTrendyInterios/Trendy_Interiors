import React, { useState } from 'react';
import { FaEdit, FaTrash, FaPlus, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import RoomNestedManager from './RoomNestedManager';

const DIMENSION_FIELDS = [
  { key: 'name', label: 'Name', required: true, placeholder: 'e.g. Standard' },
  { key: 'length', label: 'Length (ft)', type: 'number', step: '0.1', min: 0 },
  { key: 'width', label: 'Width (ft)', type: 'number', step: '0.1', min: 0 },
  { key: 'height', label: 'Height (ft)', type: 'number', step: '0.1', min: 0 },
];

const PACKAGE_COMPONENT_FIELDS = [
  { key: 'name', label: 'Name', required: true, fullWidth: true },
  { key: 'description', label: 'Description', type: 'textarea', fullWidth: true, rows: 2 },
  { key: 'price', label: 'Price (₹)', type: 'number', min: 0 },
  { key: 'mandatory', label: 'Mandatory', type: 'checkbox', fullWidth: false },
  { key: 'displayOrder', label: 'Display Order', type: 'number', min: 0, fullWidth: false },
];

const DimensionPackageManager = ({ dimensions, onChange }) => {
  const [expandedDimIndex, setExpandedDimIndex] = useState(null);
  const [dimensionDraft, setDimensionDraft] = useState(null);
  const [dimensionEditIndex, setDimensionEditIndex] = useState(null);
  const [dimensionFormOpen, setDimensionFormOpen] = useState(false);

  const toggleExpandedDimension = (index) => {
    setExpandedDimIndex(expandedDimIndex === index ? null : index);
    setDimensionFormOpen(false);
  };

  const handleDimensionChange = (updatedDimensions) => {
    onChange(updatedDimensions);
  };

  const handlePackageComponentsChange = (dimensionIndex, updatedComponents) => {
    const updatedDimensions = [...dimensions];
    updatedDimensions[dimensionIndex] = {
      ...updatedDimensions[dimensionIndex],
      packageComponents: updatedComponents,
    };
    onChange(updatedDimensions);
  };

  return (
    <div className="dimension-package-manager">
      <div className="room-nested-header">
        <h4 className="subsection-title">Dimensions & Package Components</h4>
      </div>

      {dimensions.length === 0 && !dimensionFormOpen && (
        <p className="room-nested-empty">No dimensions yet. Use the Dimensions section above to add one.</p>
      )}

      {dimensions.length > 0 && (
        <div className="cms-nested-list">
          {dimensions.map((dimension, dimIndex) => (
            <div key={dimension._id || dimIndex} className="dimension-item-container">
              <div className="dimension-item">
                <button
                  type="button"
                  className="dimension-expand-btn"
                  onClick={() => toggleExpandedDimension(dimIndex)}
                  title="Toggle expansion"
                >
                  {expandedDimIndex === dimIndex ? <FaChevronDown /> : <FaChevronRight />}
                </button>
                <div className="dimension-item-info">
                  <h5>{dimension.name}</h5>
                  <p>
                    {dimension.length || 0} × {dimension.width || 0} × {dimension.height || 0} ft
                  </p>
                  {dimension.packageComponents && dimension.packageComponents.length > 0 && (
                    <p className="component-count">
                      {dimension.packageComponents.length} component{dimension.packageComponents.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {expandedDimIndex === dimIndex && (
                <div className="dimension-expanded-content">
                  <div className="nested-manager-wrapper">
                    <RoomNestedManager
                      title="Package Components"
                      items={dimension.packageComponents || []}
                      emptyItem={{ name: '', description: '', price: '', mandatory: false, displayOrder: 0 }}
                      fields={PACKAGE_COMPONENT_FIELDS}
                      onChange={(components) => handlePackageComponentsChange(dimIndex, components)}
                      renderSummary={(item) => (
                        <>
                          <h6>{item.name}</h6>
                          <p>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                          {item.description && <p className="component-desc">{item.description}</p>}
                          <p className="component-meta">
                            {item.mandatory && <span className="badge mandatory">Mandatory</span>}
                            {item.displayOrder > 0 && <span className="badge">Order: {item.displayOrder}</span>}
                          </p>
                        </>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DimensionPackageManager;
