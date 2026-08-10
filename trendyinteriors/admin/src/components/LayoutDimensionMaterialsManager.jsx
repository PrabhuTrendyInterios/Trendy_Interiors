import React, { useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import RoomNestedManager from './RoomNestedManager';

const DIMENSIONLESS_LAYOUT_CONFIG_ID = '__dimensionless__';

const LAYOUT_MATERIAL_FIELDS = [
  { key: 'name', label: 'Name', required: true, fullWidth: true },
  { key: 'size', label: 'Size / Specification', placeholder: 'e.g. 6ft x 2ft, 18mm BWP' },
  { key: 'price', label: 'Price (₹)', type: 'number', min: 0 },
  { key: 'mandatory', label: 'Mandatory', type: 'checkbox', fullWidth: false },
];

const matchConfiguration = (configurations, dimension, dimensionIndex) => {
  if (dimension._id) {
    const byId = configurations.find(
      (config) => config.dimensionId && String(config.dimensionId) === String(dimension._id)
    );
    if (byId) return byId;
  }

  return configurations[dimensionIndex];
};

const normalizeMaterials = (materials = []) =>
  (Array.isArray(materials) ? materials : []).map((material) => ({
    ...material,
    name: material.name || '',
    size: material.size || '',
    price: material.price ?? 0,
    mandatory: material.mandatory ?? false,
  }));

const syncConfigurations = (dimensions, configurations) =>
  dimensions.map((dimension, index) => {
    const existing = matchConfiguration(configurations, dimension, index);

    return {
      ...(existing?._id ? { _id: existing._id } : {}),
      dimensionId: dimension._id || existing?.dimensionId || null,
      materials: normalizeMaterials(existing?.materials),
    };
  });

const syncDimensionlessConfiguration = (configurations) => {
  const existing = (Array.isArray(configurations) ? configurations : []).find((config) => {
    const normalized = String(config?.dimensionId || '').trim().toLowerCase();
    return normalized === DIMENSIONLESS_LAYOUT_CONFIG_ID || normalized === 'default';
  }) || configurations?.[0];

  return {
    ...(existing?._id ? { _id: existing._id } : {}),
    dimensionId: DIMENSIONLESS_LAYOUT_CONFIG_ID,
    materials: normalizeMaterials(existing?.materials),
  };
};

const LayoutDimensionMaterialsManager = ({
  dimensions = [],
  configurations = [],
  onChange,
  onEnsureDimensionId,
  dimensionless = false,
}) => {
  const [expandedDimIndex, setExpandedDimIndex] = useState(null);

  const syncedConfigurations = syncConfigurations(dimensions, configurations);
  const dimensionlessConfiguration = syncDimensionlessConfiguration(configurations);

  const handleDimensionlessMaterialsChange = (updatedMaterials) => {
    onChange([
      {
        ...(dimensionlessConfiguration?._id ? { _id: dimensionlessConfiguration._id } : {}),
        dimensionId: DIMENSIONLESS_LAYOUT_CONFIG_ID,
        materials: updatedMaterials,
      },
    ]);
  };

  const toggleExpandedDimension = (index) => {
    setExpandedDimIndex(expandedDimIndex === index ? null : index);
  };

  const resolveDimensionId = (dimensionIndex) => {
    const dimension = dimensions[dimensionIndex];
    if (dimension?._id) {
      return String(dimension._id);
    }

    if (typeof onEnsureDimensionId === 'function') {
      return onEnsureDimensionId(dimensionIndex);
    }

    return null;
  };

  const handleMaterialsChange = (dimensionIndex, updatedMaterials) => {
    const dimensionId = resolveDimensionId(dimensionIndex);
    const nextConfigurations = [...syncedConfigurations];

    nextConfigurations[dimensionIndex] = {
      ...(nextConfigurations[dimensionIndex]?._id
        ? { _id: nextConfigurations[dimensionIndex]._id }
        : {}),
      dimensionId: dimensionId || nextConfigurations[dimensionIndex]?.dimensionId,
      materials: updatedMaterials,
    };

    onChange(
      nextConfigurations.filter(
        (config) => config.dimensionId || (config.materials && config.materials.length > 0)
      )
    );
  };

  return (
    <div className="layout-dimension-materials-manager">
      <div className="room-nested-header">
        <h4 className="subsection-title">
          {dimensionless ? 'Layout Items' : 'Dimension-wise Materials'}
        </h4>
      </div>

      {dimensionless ? (
        <div className="nested-manager-wrapper">
          <p className="room-nested-empty">
            This room does not require dimensions. Add the items that belong to this layout.
          </p>
          <RoomNestedManager
            title="Items"
            items={dimensionlessConfiguration.materials}
            emptyItem={{ name: '', size: '', price: '', mandatory: false }}
            fields={LAYOUT_MATERIAL_FIELDS}
            onChange={handleDimensionlessMaterialsChange}
            reorderable
            renderSummary={(item) => (
              <>
                <h6>{item.name}</h6>
                {item.size && <p>Size: {item.size}</p>}
                <p>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                <p className="component-meta">
                  {item.mandatory && <span className="badge mandatory">Mandatory</span>}
                </p>
              </>
            )}
          />
        </div>
      ) : dimensions.length === 0 && (
        <p className="room-nested-empty">
          No dimensions yet. Add dimensions in the Dimensions section above.
        </p>
      )}

      {!dimensionless && dimensions.length > 0 && (
        <div className="cms-nested-list">
          {dimensions.map((dimension, dimIndex) => {
            const config = syncedConfigurations[dimIndex] || { materials: [] };
            const materials = config.materials || [];

            return (
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
                    <h5>{dimension.name || `Dimension ${dimIndex + 1}`}</h5>
                    <p>
                      {dimension.length || 0} × {dimension.width || 0} × {dimension.height || 0} ft
                    </p>
                    {materials.length > 0 && (
                      <p className="component-count">
                        {materials.length} material{materials.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {expandedDimIndex === dimIndex && (
                  <div className="dimension-expanded-content">
                    <div className="nested-manager-wrapper">
                      <RoomNestedManager
                        title="Materials"
                        items={materials}
                        emptyItem={{ name: '', size: '', price: '', mandatory: false }}
                        fields={LAYOUT_MATERIAL_FIELDS}
                        onChange={(updatedMaterials) =>
                          handleMaterialsChange(dimIndex, updatedMaterials)
                        }
                        reorderable
                        renderSummary={(item) => (
                          <>
                            <h6>{item.name}</h6>
                            {item.size && <p>Size: {item.size}</p>}
                            <p>₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                            <p className="component-meta">
                              {item.mandatory && <span className="badge mandatory">Mandatory</span>}
                            </p>
                          </>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LayoutDimensionMaterialsManager;
