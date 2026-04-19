import React, { useState } from 'react';
import RoomSelection from '../components/estimator/RoomSelection';
import './Estimator.css';

const Estimator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    rooms: {},
    budgetPlan: '',
    dimensions: { length: '', width: '' },
  });

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const updateFormData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RoomSelection
            selectedRooms={formData.rooms}
            onUpdateRoomCount={(room, count) => {
              const newRooms = { ...formData.rooms };
              if (count <= 0) {
                delete newRooms[room];
              } else {
                newRooms[room] = count;
              }
              updateFormData('rooms', newRooms);
            }}
            onNext={handleNextStep}
          />
        );
      case 2:
        return (
          <div className="estimator-placeholder">
            <h2>Step 2: Coming Soon!</h2>
            <p>You have selected:</p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: '20px 0' }}>
              {Object.entries(formData.rooms).map(([room, count]) => (
                <li key={room} style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>{count}</strong> x {room}
                </li>
              ))}
            </ul>
            <div className="estimator-actions">
              <button className="btn-secondary" onClick={handlePrevStep}>Back</button>
            </div>
          </div>
        );
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div className="estimator-page">
      <div className="estimator-header-bg">
        <div className="container">
          <h1 className="estimator-page-title">Design Estimator</h1>
          <p className="estimator-page-subtitle">Configure your space step by step and get a premium customized quote.</p>
        </div>
      </div>
      
      <div className="container">
        <div className="estimator-wrapper">
          {/* Progress Indicator */}
          <div className="estimator-progress">
            <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1. Room</div>
            <div className={`progress-line ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2. Budget</div>
            <div className={`progress-line ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3. Dimensions</div>
          </div>

          <div className="estimator-step-container">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estimator;
