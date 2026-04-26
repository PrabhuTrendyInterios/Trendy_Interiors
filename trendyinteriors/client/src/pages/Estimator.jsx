import React, { useEffect, useState } from 'react';
import RoomSelection from '../components/estimator/RoomSelection';
import BudgetSelection from '../components/estimator/BudgetSelection';
import DimensionsSelection from '../components/estimator/DimensionsSelection';
import './Estimator.css';

const ESTIMATOR_DRAFT_KEY = 'trendyInteriorsEstimatorDraft';
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : 'https://trendyinteriors-1.onrender.com');
const ESTIMATOR_API_URL = `${API_BASE_URL}/api/estimators`;

const buildRoomInstances = (rooms) =>
  Object.entries(rooms || {}).flatMap(([roomName, count]) =>
    Array.from({ length: Number(count) || 0 }, (_, index) => ({
      id: `${roomName}-${index + 1}`,
      roomName,
      label: Number(count) > 1 ? `${roomName} ${index + 1}` : roomName,
    })),
  );

const migrateRoomDimensions = (roomDimensionsByRoom) => {
  const migrated = {};
  Object.entries(roomDimensionsByRoom || {}).forEach(([roomId, dimensions]) => {
    migrated[roomId] = {
      length: dimensions?.length || '',
      width: dimensions?.width || '',
      height: dimensions?.height || '',
      selectedDesignIdea: {
        layout: dimensions?.selectedDesignIdea?.layout || '',
        addons: Array.isArray(dimensions?.selectedDesignIdea?.addons) ? dimensions.selectedDesignIdea.addons : [],
        room: dimensions?.selectedDesignIdea?.room || '',
        roomType: dimensions?.selectedDesignIdea?.roomType || '',
        planTier: dimensions?.selectedDesignIdea?.planTier || '',
      },
    };
  });
  return migrated;
};

const Estimator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [quoteSummary, setQuoteSummary] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [formData, setFormData] = useState(() => {
    try {
      const storedDraft = localStorage.getItem(ESTIMATOR_DRAFT_KEY);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        return {
          rooms: parsedDraft.rooms || {},
          budgetPlan: parsedDraft.budgetPlan || '',
          selectedRoomForDimensions: parsedDraft.selectedRoomForDimensions || '',
          roomDimensionsByRoom: migrateRoomDimensions(parsedDraft.roomDimensionsByRoom),
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

  useEffect(() => {
    try {
      localStorage.setItem(ESTIMATOR_DRAFT_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Unable to save estimator draft', error);
    }
  }, [formData]);

  const handleNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const updateFormData = (key, value) => {
    setApiError('');
    setSubmissionResult(null);
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === 'rooms' || key === 'budgetPlan') {
      setQuoteSummary(null);
    }
  };

  const updateRoomDimensions = (roomId, key, value) => {
    setApiError('');
    setSubmissionResult(null);
    setQuoteSummary(null);

    setFormData((prev) => ({
      ...prev,
      roomDimensionsByRoom: {
        ...prev.roomDimensionsByRoom,
        [roomId]: {
          ...(prev.roomDimensionsByRoom[roomId] || {
            length: '',
            width: '',
            height: '',
            selectedDesignIdea: {
              layout: '',
              addons: [],
              room: '',
              roomType: '',
              planTier: '',
            },
          }),
          [key]: value,
        },
      },
    }));
  };

  const updateRoomDesignIdea = (roomId, idea) => {
    setApiError('');
    setSubmissionResult(null);
    setQuoteSummary(null);

    setFormData((prev) => ({
      ...prev,
      roomDimensionsByRoom: {
        ...prev.roomDimensionsByRoom,
        [roomId]: {
          ...(prev.roomDimensionsByRoom[roomId] || {
            length: '',
            width: '',
            height: '',
            selectedDesignIdea: {
              layout: '',
              addons: [],
              room: '',
              roomType: '',
              planTier: '',
            },
          }),
          selectedDesignIdea: {
            layout: idea?.layout || '',
            addons: idea?.addons || [],
            room: idea?.room || '',
            roomType: idea?.roomType || '',
            planTier: idea?.planTier || '',
          },
        },
      },
    }));
  };

  const parseApiError = async (response) => {
    try {
      const body = await response.json();
      if (Array.isArray(body.errors) && body.errors.length > 0) {
        return body.errors.join(' ');
      }
      return body.message || body.error || 'Request failed.';
    } catch (error) {
      return 'Request failed.';
    }
  };

  const handleDimensionsNext = async () => {
    if (isCalculating) {
      return;
    }

    setApiError('');
    setIsCalculating(true);

    try {
      const response = await fetch(`${ESTIMATOR_API_URL}/calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const result = await response.json();
      setQuoteSummary(result?.data?.quoteSummary || null);
      setCurrentStep(4);
    } catch (error) {
      setApiError(error.message || 'Unable to calculate estimate.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmitEstimator = async () => {
    if (isSubmitting) {
      return;
    }

    setApiError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(ESTIMATOR_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const result = await response.json();
      setSubmissionResult(result?.data || null);
      localStorage.removeItem(ESTIMATOR_DRAFT_KEY);
    } catch (error) {
      setApiError(error.message || 'Unable to submit estimate request.');
    } finally {
      setIsSubmitting(false);
    }
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
            onNext={handleDimensionsNext}
            onPrev={handlePrevStep}
            isCalculating={isCalculating}
          />
        );
      case 4:
        return (
          <div className="estimator-placeholder">
            <h2>Review &amp; Submit</h2>
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

            {quoteSummary && (
              <div className="selected-summary" style={{ textAlign: 'left' }}>
                <p style={{ marginBottom: 8 }}><strong>Estimated Area:</strong> {quoteSummary.totalAreaSqFt} sq. ft</p>
                <p style={{ marginBottom: 8 }}><strong>Estimated Total:</strong> {quoteSummary.currency} {quoteSummary.estimatedAmount}</p>
                {Array.isArray(quoteSummary.lineItems) && quoteSummary.lineItems.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    {quoteSummary.lineItems.map((item) => (
                      <li key={item.roomId} style={{ marginBottom: 6 }}>
                        {item.label}: {item.areaSqFt} sq. ft x {quoteSummary.currency} {item.ratePerSqFt} = {quoteSummary.currency} {item.estimatedCost}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {apiError && (
              <div className="selected-summary" style={{ backgroundColor: '#fff0f0', borderColor: '#f5a5a5', color: '#8b1f1f' }}>
                <strong>Error:</strong> {apiError}
              </div>
            )}

            {submissionResult && (
              <div className="selected-summary" style={{ backgroundColor: '#eefaf0', borderColor: '#9fd5aa', color: '#1e5b2f' }}>
                <strong>Estimator submitted successfully.</strong> Reference ID: {submissionResult._id}
              </div>
            )}

            <div className="estimator-actions">
              <button className="btn-secondary" onClick={handlePrevStep}>Back</button>
              <button className="btn-primary" onClick={handleSubmitEstimator} disabled={isSubmitting || !!submissionResult}>
                {isSubmitting ? 'Submitting...' : submissionResult ? 'Submitted' : 'Submit Estimate'}
              </button>
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
            {currentStep === 3 && isCalculating && (
              <div className="selected-summary" style={{ marginBottom: 16 }}>
                Calculating estimate preview...
              </div>
            )}
            {currentStep === 3 && apiError && (
              <div className="selected-summary" style={{ marginBottom: 16, backgroundColor: '#fff0f0', borderColor: '#f5a5a5', color: '#8b1f1f' }}>
                <strong>Error:</strong> {apiError}
              </div>
            )}
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estimator;
