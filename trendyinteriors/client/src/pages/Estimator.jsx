import React, { useEffect, useState } from 'react';
import RoomSelection from '../components/estimator/RoomSelection';
import BudgetSelection from '../components/estimator/BudgetSelection';
import DimensionsSelection from '../components/estimator/DimensionsSelection';
import './Estimator.css';

const ESTIMATOR_DRAFT_KEY = 'trendyInteriorsEstimatorDraft';

const buildRoomInstances = (rooms) =>
  Object.entries(rooms || {}).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    })),
  );

const Estimator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    try {
      const storedDraft = localStorage.getItem(ESTIMATOR_DRAFT_KEY);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        return {
          rooms: parsedDraft.rooms || {},
          budgetPlan: parsedDraft.budgetPlan || '',
          selectedRoomForDimensions: parsedDraft.selectedRoomForDimensions || '',
          roomDimensionsByRoom: parsedDraft.roomDimensionsByRoom || {},
        };
      }
    } catch (error) {
      console.error('Unable to load estimator draft', error);
    }

    return {
      rooms: {},
      budgetPlan: '',
      selectedRoomForDimensions: '',
      roomDimensionsByRoom: {},
    };
  });

  useEffect(() => {
    const roomInstances = buildRoomInstances(formData.rooms);
    if (roomInstances.length === 0 && formData.selectedRoomForDimensions) {
      updateFormData('selectedRoomForDimensions', '');
      return;
    }

    if (roomInstances.length > 0 && !roomInstances.some((room) => room.id === formData.selectedRoomForDimensions)) {
      updateFormData('selectedRoomForDimensions', roomInstances[0].id);
    }
  }, [formData.rooms, formData.selectedRoomForDimensions]);

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

  const updateRoomDimensions = (roomId, key, value) => {
    setFormData((prev) => ({
      ...prev,
      roomDimensionsByRoom: {
        ...prev.roomDimensionsByRoom,
        [roomId]: {
          ...(prev.roomDimensionsByRoom[roomId] || {
            length: '',
            width: '',
            height: '',
            selectedDesignIdea: null,
          }),
          [key]: value,
        },
      },
    }));
  };

  const updateRoomDesignIdea = (roomId, idea) => {
    setFormData((prev) => ({
      ...prev,
      roomDimensionsByRoom: {
        ...prev.roomDimensionsByRoom,
        [roomId]: {
          ...(prev.roomDimensionsByRoom[roomId] || {
            length: '',
            width: '',
            height: '',
            selectedDesignIdea: null,
          }),
          selectedDesignIdea: idea,
        },
      },
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
          <DimensionsSelection
            selectedRooms={formData.rooms}
            selectedBudget={formData.budgetPlan}
            selectedRoom={formData.selectedRoomForDimensions}
            onSelectRoom={(roomId) => {
              updateFormData('selectedRoomForDimensions', roomId);
            }}
            roomDimensions={formData.roomDimensionsByRoom}
            onUpdateRoomDimensions={updateRoomDimensions}
            onSelectDesignIdea={updateRoomDesignIdea}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        );
      case 4:
        return (
          <div className="estimator-placeholder">
            <h2>Adds On Coming Soon</h2>
            <p>You have selected:</p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: '20px 0' }}>
              {Object.entries(formData.rooms).map(([room, count]) => (
                <li key={room} style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>{count}</strong> x {room}
                </li>
              ))}
            </ul>
            <p>Plan: {formData.budgetPlan}</p>
            <p>Rooms dimensions:</p>
            <ul style={{ listStyleType: 'none', padding: 0, margin: '20px 0' }}>
              {Object.entries(formData.roomDimensionsByRoom).map(([roomId, dimensions]) => (
                <li key={roomId} style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                  <strong>{dimensions.length} x {dimensions.width} x {dimensions.height}</strong> - {roomId}
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
            <div className={`progress-line ${currentStep >= 4 ? 'active' : ''}`}></div>
            <div className={`progress-step ${currentStep >= 4 ? 'active' : ''}`}>4. Add Ons</div>
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
