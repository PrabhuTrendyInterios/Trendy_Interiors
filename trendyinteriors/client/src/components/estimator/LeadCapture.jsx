import React, { useState } from 'react';
import './LeadCapture.css';

const LeadCapture = ({ leadData, isStepCompleted, onUpdateLead, onNext, onPrev }) => {
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

  const inputClass = (hasError) => `lead-input ${hasError ? 'has-error' : ''}`;
  const labelClass = 'lead-label';

  return (
    <div className="lead-capture-container">
      {/* Visual Side */}
      <div
        className="lead-visual-side"
        style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/estimator/lead-bg.png)` }}
      >
        <div className="lead-visual-overlay" />
        <div className="lead-visual-content">
          <h3>Design Consultation</h3>
          <p>Experience the art of luxury living. Share your details to receive a personalized design blueprint.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className="lead-form-side">
        <div>
          <h2>
            Your Details
          </h2>
          <p>
            Secure your complimentary consultation with our premium design experts.
          </p>
        </div>

        <div className="lead-form-grid">
          {/* Name */}
          <div className="full-span">
            <label className={labelClass}>Full Name</label>
            <input
              className={inputClass(!!errors.name)}
              type="text"
              placeholder="Enter your full name"
              value={leadData.name || ''}
              onChange={(e) => onUpdateLead('name', e.target.value)}
            />
            {errors.name && <span className="lead-error">{errors.name}</span>}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email Address</label>
            <input
              className={inputClass(!!errors.email)}
              type="email"
              placeholder="Enter your email address"
              value={leadData.email || ''}
              onChange={(e) => onUpdateLead('email', e.target.value)}
            />
            {errors.email && <span className="lead-error">{errors.email}</span>}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              className={inputClass(!!errors.phone)}
              type="tel"
              placeholder="Enter your phone number"
              value={leadData.phone || ''}
              onChange={(e) => onUpdateLead('phone', e.target.value)}
            />
            {errors.phone && <span className="lead-error">{errors.phone}</span>}
          </div>

          {/* Location */}
          <div className="full-span">
            <label className={labelClass}>City / Area</label>
            <input
              className={inputClass(!!errors.location)}
              type="text"
              placeholder="Enter your city or area"
              value={leadData.location || ''}
              onChange={(e) => onUpdateLead('location', e.target.value)}
            />
            {errors.location && <span className="lead-error">{errors.location}</span>}
          </div>
        </div>

        <div className="estimator-actions">
          <button className="btn-secondary estimator-back-btn lead-back-btn" onClick={onPrev}>Back</button>
          <button className="btn-primary" onClick={handleNext}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadCapture;
