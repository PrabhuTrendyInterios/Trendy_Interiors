import React, { useState } from 'react';
import RoomSelection from '../components/estimator/RoomSelection';
import BudgetSelection from '../components/estimator/BudgetSelection';
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
          <BudgetSelection
            selectedBudget={formData.budgetPlan}
            onSelectBudget={(budgetPlan) => updateFormData('budgetPlan', budgetPlan)}
            onPrev={handlePrevStep}
            onNext={handleNextStep}
          />
        );
      case 3:
        return (
          <div className="estimator-placeholder">
            <h2>Step 3: Dimensions</h2>
            <p>We are almost there. Your selected rooms and budget plan will help us fine-tune the final estimate.</p>
            <div className="selected-summary">
              <strong>Rooms selected:</strong>{' '}
              {Object.entries(formData.rooms).length > 0 ?
                Object.entries(formData.rooms).map(([room, count]) => `${count} ${room}${count > 1 ? 's' : ''}`).join(', ') :
                'No rooms selected yet.'
              }
            </div>
            <div className="selected-summary">
              <strong>Budget plan:</strong> {formData.budgetPlan ? formData.budgetPlan.replace(/\b\w/g, (l) => l.toUpperCase()) : 'Not selected yet.'}
            </div>
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
