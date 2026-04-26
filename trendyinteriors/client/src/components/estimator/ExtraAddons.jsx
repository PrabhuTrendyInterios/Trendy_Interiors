import React from 'react';

const ESSENTIAL_ADDONS = [
  {
    id: 'lighting',
    name: 'Lighting Package',
    description: 'Ambient, task, and accent lighting solutions to set the perfect mood for your home.',
    image: '/images/estimator/lighting.png',
    priceHint: 'Premium selection'
  },
  { 
    id: 'wallpaper',
    name: 'Wallpaper / Panels',
    description: 'Designer textures and elegant wall panels for a sophisticated and modern look.',
    image: '/images/estimator/wallpaper.png',
    priceHint: 'Luxury finishes'
  },
  {
    id: 'pooja',
    name: 'Pooja Unit',
    description: 'Beautifully crafted traditional or modern prayer units designed specifically for your home.',
    image: '/images/estimator/pooja.png',
    priceHint: 'Custom design'
  }
];

const LIFESTYLE_ADDONS = [
  {
    id: 'ceiling',
    name: 'False Ceiling',
    description: 'Premium POP or wooden ceiling designs with integrated LED cove lighting.',
    image: '/images/estimator/ceiling.png',
    priceHint: 'Architectural detail'
  },
  {
    id: 'flooring',
    name: 'Luxury Flooring',
    description: 'High-end Italian marble, premium hardwood, or designer tiling options.',
    image: '/images/estimator/flooring.png',
    priceHint: 'Foundation of luxury'
  },
  {
    id: 'curtains',
    name: 'Curtains & Blinds',
    description: 'Designer fabric curtains and motorized window blinds for ultimate comfort.',
    image: '/images/estimator/curtains.png',
    priceHint: 'Soft furnishing'
  }
];

const ExtraAddons = ({ selectedAddons = [], onToggleAddon, onNext, onPrev }) => {
  const renderAddonCard = (addon, isHorizontal = false) => (
    <div 
      key={addon.id} 
      className={`addon-card ${selectedAddons.includes(addon.id) ? 'selected' : ''}`}
      onClick={() => onToggleAddon(addon.id)}
      style={{
        cursor: 'pointer',
        borderRadius: '20px',
        overflow: 'hidden',
        backgroundColor: '#fff',
        boxShadow: selectedAddons.includes(addon.id) 
          ? '0 20px 40px rgba(107, 78, 255, 0.15)' 
          : '0 10px 30px rgba(0, 0, 0, 0.05)',
        border: selectedAddons.includes(addon.id) 
          ? '3px solid #6b4eff' 
          : '3px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: selectedAddons.includes(addon.id) ? 'translateY(-10px)' : 'none',
        position: 'relative'
      }}
    >
      <div className="addon-image-wrapper" style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
        <img 
          src={addon.image} 
          alt={addon.name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {selectedAddons.includes(addon.id) && (
          <div className="addon-selected-badge" style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            backgroundColor: '#6b4eff',
            color: '#fff',
            padding: '6px 15px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            fontWeight: '600',
            boxShadow: '0 4px 10px rgba(107, 78, 255, 0.3)'
          }}>
            Selected
          </div>
        )}
      </div>
      <div className="addon-content" style={{ padding: '20px' }}>
        <span className="addon-price-hint" style={{ 
          fontSize: '0.7rem', 
          textTransform: 'uppercase', 
          letterSpacing: '1px', 
          color: '#6b4eff', 
          fontWeight: '700',
          display: 'block',
          marginBottom: '5px'
        }}>
          {addon.priceHint}
        </span>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#1a1a1a' }}>{addon.name}</h3>
        <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: '1.5', margin: 0 }}>{addon.description}</p>
      </div>
    </div>
  );

  return (
    <div className="extra-addons-step">
      <div className="addons-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '10px', color: '#1a1a1a' }}>Extra Add-ons</h2>
        <p style={{ fontSize: '1rem', color: '#666', maxWidth: '600px', margin: '0 auto' }}>
          Enhance your space with these premium optional additions.
        </p>
      </div>

      <div className="addons-section">
        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#333', borderLeft: '4px solid #6b4eff', paddingLeft: '15px' }}>
          Essential Enhancements
        </h3>
        <div className="addons-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {ESSENTIAL_ADDONS.map(addon => (
            <div key={addon.id}>
              {renderAddonCard(addon)}
            </div>
          ))}
        </div>
      </div>

      <div className="addons-section">
        <h3 style={{ fontSize: '1.4rem', marginBottom: '20px', color: '#333', borderLeft: '4px solid #6b4eff', paddingLeft: '15px' }}>
          Lifestyle & Comfort
        </h3>
        <div className="addons-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {LIFESTYLE_ADDONS.map(addon => (
            <div key={addon.id}>
              {renderAddonCard(addon)}
            </div>
          ))}
        </div>
      </div>

      <div className="skip-note" style={{ 
        textAlign: 'center', 
        padding: '15px', 
        backgroundColor: '#f8f9ff', 
        borderRadius: '15px',
        marginBottom: '30px',
        border: '1px dashed #d1d9ff'
      }}>
        <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
          Don't worry, you can always discuss these details later with our consultants.
        </p>
      </div>

      <div className="estimator-actions" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
      }}>
        <button className="btn-secondary" onClick={onPrev}>Back</button>
        <button className="btn-primary" onClick={onNext}>
          {selectedAddons.length > 0 ? 'Continue' : 'Skip & Continue'}
        </button>
      </div>
    </div>
  );
};

export default ExtraAddons;
