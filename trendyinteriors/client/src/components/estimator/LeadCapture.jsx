import React, { useState } from 'react';

const LeadCapture = ({ leadData, onUpdateLead, onNext, onPrev }) => {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!leadData.name || leadData.name.trim().length < 2) {
      newErrors.name = 'Full name is required';
    }
    if (!leadData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!leadData.phone || !/^[0-9+\-\s]{8,15}$/.test(leadData.phone)) {
      newErrors.phone = 'Valid phone number is required';
    }
    if (!leadData.location || leadData.location.trim().length < 2) {
      newErrors.location = 'City/Area is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '12px 0',
    fontSize: '1rem',
    color: 'var(--color-charcoal-dark)',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${hasError ? '#e53e3e' : 'rgba(0,0,0,0.1)'}`,
    outline: 'none',
    transition: 'border-color 0.3s ease',
    fontFamily: 'var(--font-body)',
  });

  const labelStyle = {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: 'var(--color-charcoal-dark)',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    display: 'block',
    marginBottom: '4px',
    fontFamily: 'var(--font-body)',
  };

  return (
    <div className="lead-capture-container" style={{
      display: 'flex',
      minHeight: '650px',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      backgroundColor: 'var(--color-white)',
      boxShadow: 'var(--shadow-lg)',
      margin: 'var(--spacing-md) 0'
    }}>
      {/* Visual Side */}
      <div className="lead-visual-side" style={{
        flex: '1',
        backgroundImage: 'url("/images/estimator/lead-bg.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '50px',
        color: 'var(--color-white)'
      }}>
        {/* Darker overlay for better text readability */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)',
          zIndex: 1
        }} />
        <div style={{ zIndex: 2, position: 'relative' }}>
          <h3 style={{ 
            fontSize: '2.5rem', 
            marginBottom: '15px', 
            fontWeight: '700', 
            color: 'var(--color-white)',
            fontFamily: 'var(--font-heading)',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Design Consultation
          </h3>
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.95, 
            lineHeight: '1.6', 
            color: 'var(--color-white)',
            fontFamily: 'var(--font-body)',
            margin: 0
          }}>
            Experience the art of luxury living. Share your details to receive a personalized design blueprint.
          </p>
        </div>
      </div>

      {/* Form Side */}
      <div className="lead-form-side" style={{
        flex: '1',
        padding: '60px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)'
      }}>
        <div style={{ marginBottom: '50px' }}>
          <h2 style={{ 
            fontSize: '2.8rem', 
            color: 'var(--color-charcoal-dark)', 
            marginBottom: '15px', 
            fontWeight: '800', 
            letterSpacing: '-1.5px',
            fontFamily: 'var(--font-heading)'
          }}>
            Your Details
          </h2>
          <p style={{ 
            color: 'var(--color-gray)', 
            fontSize: '1.1rem',
            fontFamily: 'var(--font-body)'
          }}>
            Secure your complimentary consultation with our premium design experts.
          </p>
        </div>

        <div className="lead-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '35px' }}>
          {/* Name */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={leadData.name || ''}
              onChange={(e) => onUpdateLead('name', e.target.value)}
              style={inputStyle(!!errors.name)}
              onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-gold)'}
              onBlur={(e) => e.target.style.borderBottomColor = errors.name ? '#e53e3e' : 'rgba(0,0,0,0.1)'}
            />
            {errors.name && <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.name}</span>}
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email address"
              value={leadData.email || ''}
              onChange={(e) => onUpdateLead('email', e.target.value)}
              style={inputStyle(!!errors.email)}
              onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-gold)'}
              onBlur={(e) => e.target.style.borderBottomColor = errors.email ? '#e53e3e' : 'rgba(0,0,0,0.1)'}
            />
            {errors.email && <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.email}</span>}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={leadData.phone || ''}
              onChange={(e) => onUpdateLead('phone', e.target.value)}
              style={inputStyle(!!errors.phone)}
              onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-gold)'}
              onBlur={(e) => e.target.style.borderBottomColor = errors.phone ? '#e53e3e' : 'rgba(0,0,0,0.1)'}
            />
            {errors.phone && <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.phone}</span>}
          </div>

          {/* Location */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>City / Area</label>
            <input
              type="text"
              placeholder="Enter your city or area"
              value={leadData.location || ''}
              onChange={(e) => onUpdateLead('location', e.target.value)}
              style={inputStyle(!!errors.location)}
              onFocus={(e) => e.target.style.borderBottomColor = 'var(--color-gold)'}
              onBlur={(e) => e.target.style.borderBottomColor = errors.location ? '#e53e3e' : 'rgba(0,0,0,0.1)'}
            />
            {errors.location && <span style={{ color: '#e53e3e', fontSize: '0.8rem', marginTop: '5px', display: 'block' }}>{errors.location}</span>}
          </div>
        </div>

        <div className="estimator-actions" style={{ marginTop: '60px', display: 'flex', gap: '20px' }}>
          <button className="btn-secondary" onClick={onPrev} style={{ flex: 1, padding: '16px' }}>Back</button>
          <button className="btn-primary" onClick={handleNext} style={{ 
            flex: 1.5, 
            background: 'var(--color-charcoal-dark)', 
            color: 'var(--color-white)', 
            padding: '16px',
            fontSize: '1.1rem',
            fontWeight: '600'
          }}>
            Generate My Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCapture;
