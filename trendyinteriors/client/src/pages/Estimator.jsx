import React, { useEffect, useState } from 'react';
import RoomSelection from '../components/estimator/RoomSelection';
import DimensionsSelection from '../components/estimator/DimensionsSelection';
import ExtraAddons from '../components/estimator/ExtraAddons';
import LeadCapture from '../components/estimator/LeadCapture';
import {
  API_BASE_URL,
  buildRoomInstances,
  fetchEstimatorRooms,
  fetchGlobalAddons,
  formatGlobalAddonForCard,
  normalizeEstimatorRoom,
} from '../utils/estimatorApi';
import './Estimator.css';

const ESTIMATOR_DRAFT_KEY = 'trendyInteriorsEstimatorDraft';
const ESTIMATOR_API_URL = `${API_BASE_URL}/api/estimators`;

const migrateRoomDimensions = (roomDimensionsByRoom) => {
  const migrated = {};
  Object.entries(roomDimensionsByRoom || {}).forEach(([roomId, dimensions]) => {
    migrated[roomId] = {
      length: dimensions?.length || '',
      width: dimensions?.width || '',
      height: dimensions?.height || '',
      sizeCategory: dimensions?.sizeCategory || '',
      selectedDesignIdea: {
        layout: dimensions?.selectedDesignIdea?.layout || '',
        addons: Array.isArray(dimensions?.selectedDesignIdea?.addons) ? dimensions.selectedDesignIdea.addons : [],
        room: dimensions?.selectedDesignIdea?.room || '',
      },
    };
  });
  return migrated;
};

const Estimator = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(new Set());
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
          selectedRoomForDimensions: parsedDraft.selectedRoomForDimensions || '',
          roomDimensionsByRoom: migrateRoomDimensions(parsedDraft.roomDimensionsByRoom),
          extraAddons: parsedDraft.extraAddons || [],
          leadData: parsedDraft.leadData || { name: '', email: '', phone: '', location: '', message: '' },
        };
      }
    } catch (error) {
      console.error('Unable to load estimator draft', error);
    }

    return {
      rooms: {},
      selectedRoomForDimensions: '',
      roomDimensionsByRoom: {},
      extraAddons: [],
      leadData: { name: '', email: '', phone: '', location: '', message: '' },
    };
  });

  const [roomsCatalog, setRoomsCatalog] = useState([]);
  const [globalAddonsOptions, setGlobalAddonsOptions] = useState([]);
  const [loadingEstimatorData, setLoadingEstimatorData] = useState(true);
  const [loadConfigError, setLoadConfigError] = useState('');

  useEffect(() => {
    const loadEstimatorData = async () => {
      try {
        const [roomsResponse, addonsResponse] = await Promise.all([
          fetchEstimatorRooms(),
          fetchGlobalAddons(),
        ]);

        setRoomsCatalog((roomsResponse.data || []).map(normalizeEstimatorRoom));
        setGlobalAddonsOptions(addonsResponse.data || []);
        setLoadConfigError('');
      } catch (error) {
        console.error(error);
        setRoomsCatalog([]);
        setGlobalAddonsOptions([]);
        setLoadConfigError('Unable to load estimator data. Please refresh and try again.');
      } finally {
        setLoadingEstimatorData(false);
      }
    };

    loadEstimatorData();
  }, []);

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

  // Calculate quote when reaching review step
  useEffect(() => {
    const calculateQuoteForReview = async () => {
      if (currentStep !== 5 || quoteSummary) {
        return; // Don't recalculate if already calculated
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
      } catch (error) {
        setApiError(error.message || 'Unable to calculate estimate.');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateQuoteForReview();
  }, [currentStep, formData, quoteSummary]);

  const handleNextStep = () => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    switch (currentStep) {
      case 1: // Room Selection
        return Object.keys(formData.rooms).length > 0;
      case 2: // Dimensions
        return formData.selectedRoomForDimensions && Object.keys(formData.roomDimensionsByRoom).length > 0;
      case 3: // Extra Add-ons
        return true; // This is optional
      case 4: // Lead Capture
        return formData.leadData.name && formData.leadData.email && formData.leadData.phone;
      case 5: // Review
        return true; // Just display mode
      default:
        return false;
    }
  };

  // Check if a step can be navigated to
  const canNavigateToStep = (step) => {
    if (step === currentStep) return false; // Can't click current step
    if (step < currentStep) return true; // Can always go back
    if (step === currentStep + 1) return isCurrentStepComplete(); // Can go to next only if current is complete
    return false; // Can't skip ahead
  };

  // Handle progress button click
  const handleProgressClick = (step) => {
    if (step < currentStep || (step === currentStep + 1 && isCurrentStepComplete())) {
      // Mark current step as completed if going forward
      if (step > currentStep && isCurrentStepComplete()) {
        setCompletedSteps(prev => new Set([...prev, currentStep]));
      }
      setCurrentStep(step);
    }
  };

  const updateFormData = (key, value) => {
    setApiError('');
    setSubmissionResult(null);
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));

    if (key === 'rooms') {
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
            sizeCategory: '',
            selectedDesignIdea: {
              layout: '',
              addons: [],
              room: '',
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
            sizeCategory: '',
            selectedDesignIdea: {
              layout: '',
              addons: [],
              room: '',
            },
          }),
          selectedDesignIdea: {
            layout: idea?.layout || '',
            addons: idea?.addons || [],
            room: idea?.room || '',
          },
        },
      },
    }));
  };

  const toggleAddon = (addonId) => {
    setFormData((prev) => {
      const currentAddons = prev.extraAddons || [];
      const newAddons = currentAddons.includes(addonId)
        ? currentAddons.filter((id) => id !== addonId)
        : [...currentAddons, addonId];
      
      return {
        ...prev,
        extraAddons: newAddons,
      };
    });
  };

  const updateLeadData = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      leadData: {
        ...prev.leadData,
        [key]: value,
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

  const handleDimensionsNext = () => {
    // Just move to the next step without calculating yet
    // Calculation will happen on the review step
    setCurrentStep((prev) => prev + 1);
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
        body: JSON.stringify({
          ...formData,
          customerInfo: {
            name: formData.leadData?.name || '',
            email: formData.leadData?.email || '',
            phone: formData.leadData?.phone || '',
            location: formData.leadData?.location || '',
          },
        }),
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
            rooms={roomsCatalog}
            loading={loadingEstimatorData}
            selectedRooms={formData.rooms}
            isStepCompleted={completedSteps.has(1)}
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
          <DimensionsSelection
            selectedRooms={formData.rooms}
            selectedRoom={formData.selectedRoomForDimensions}
            isStepCompleted={completedSteps.has(2)}
            onSelectRoom={(roomId) => {
              updateFormData('selectedRoomForDimensions', roomId);
            }}
            roomDimensions={formData.roomDimensionsByRoom}
            onUpdateRoomDimensions={updateRoomDimensions}
            onSelectDesignIdea={updateRoomDesignIdea}
            roomsCatalog={roomsCatalog}
            onNext={handleDimensionsNext}
            onPrev={handlePrevStep}
          />
        );
      case 3:
        return (
          <ExtraAddons
            selectedAddons={formData.extraAddons}
            isStepCompleted={completedSteps.has(3)}
            onToggleAddon={toggleAddon}
            onPrev={handlePrevStep}
            onNext={handleNextStep}
            addonsOptions={globalAddonsOptions}
            loading={loadingEstimatorData}
          />
        );
      case 4:
        return (
          <LeadCapture
            leadData={formData.leadData}
            isStepCompleted={completedSteps.has(4)}
            onUpdateLead={updateLeadData}
            onPrev={handlePrevStep}
            onNext={handleNextStep}
          />
        );
      case 5:
        return (
          <div className="review-container">
            {/* Left Side - Image */}
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=500&q=80"
                alt="Interior Design"
                style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%)' }}></div>
            </div>

            {/* Right Side - Details & Quote */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h2 style={{ color: 'var(--color-charcoal-dark)', marginBottom: '1rem', fontSize: '2rem' }}>Your Design Quote</h2>
                <p style={{ color: 'var(--color-gray)', marginBottom: '1.5rem', fontSize: '1rem' }}>Review your selections and get your personalized estimate</p>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#fffdf3', borderRadius: '8px', borderLeft: '4px solid var(--color-gold)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Total Area</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-charcoal-dark)' }}>
                    {quoteSummary ? quoteSummary.totalAreaSqFt.toLocaleString('en-IN') : '0'} sq. ft
                  </p>
                </div>
              </div>

              {/* Selected Rooms */}
              <div>
                <h4 style={{ color: 'var(--color-charcoal-dark)', marginBottom: '0.75rem', fontSize: '0.95rem', fontWeight: '600' }}>Selected Rooms</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Object.entries(formData.rooms).map(([room, count]) => (
                    <div key={room} style={{ padding: '0.5rem 1rem', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: '20px', fontSize: '0.9rem', color: 'var(--color-charcoal-dark)', border: '1px solid var(--color-gold)' }}>
                      <strong>{count}x</strong> {room}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Quote Box */}
              {isCalculating && !quoteSummary && (
                <div style={{ padding: '2rem', backgroundColor: '#eef4f9', borderRadius: '12px', textAlign: 'center', color: '#1e5b7f', border: '1px solid #a9d5e8' }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>Calculating your estimate...</p>
                </div>
              )}

              {quoteSummary && (
                <>
                  <div style={{ padding: '2rem', backgroundColor: '#fffdf3', borderRadius: '12px', border: '2px solid var(--color-gold)' }}>
                    <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '600' }}>Estimated Total Cost</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '1.5rem', color: 'var(--color-gold-dark)' }}>₹</span>
                      <p style={{ margin: 0, fontSize: '3rem', fontWeight: '800', color: 'var(--color-charcoal-dark)' }}>
                        {quoteSummary.estimatedAmount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  
                  {/* Detailed Breakdown */}
                  {Array.isArray(quoteSummary.lineItems) && quoteSummary.lineItems.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(212, 175, 55, 0.2)', paddingTop: '1.5rem' }}>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-charcoal-dark)' }}>Cost Breakdown</p>
                      {quoteSummary.lineItems.map((item) => (
                        <div key={item.roomId} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
                          {item.roomId === 'global-addons' || item.roomId === 'extra-addons' ? (
                            // Extra Add-ons Display - Show each with individual cost
                            <>
                              <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.95rem' }}>Premium Add-ons</p>
                              {Array.isArray(item.addonDetails) && item.addonDetails.length > 0 ? (
                                <div style={{ marginTop: '0.25rem' }}>
                                  {item.addonDetails.map((addon) => (
                                    <div key={addon.id || addon.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-gold-dark)' }}>
                                        • {addon.name}
                                      </p>
                                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.85rem' }}>
                                        ₹{(addon.price || 0).toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.9rem' }}>Total Add-ons</p>
                                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '0.9rem' }}>₹{item.estimatedCost.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              ) : Array.isArray(item.addons) && item.addons.length > 0 ? (
                                <div style={{ marginTop: '0.25rem' }}>
                                  {item.addons.map((addonId, idx) => {
                                    const addonMeta = globalAddonsOptions
                                      .map(formatGlobalAddonForCard)
                                      .find(
                                        (addon) =>
                                          addon._id?.toString() === addonId ||
                                          addon.id === addonId ||
                                          addon.name === addonId
                                      );
                                    return (
                                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingLeft: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-gold-dark)' }}>
                                          • {addonMeta?.name || addonId}
                                        </p>
                                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.85rem' }}>
                                          ₹{(addonMeta?.price || 0).toLocaleString('en-IN')}
                                        </p>
                                      </div>
                                    );
                                  })}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                    <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.9rem' }}>Total Add-ons</p>
                                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '0.9rem' }}>₹{item.estimatedCost.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            // Room Items Display
                            <>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.95rem' }}>{item.label}</p>
                                <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '1rem' }}>₹{item.estimatedCost.toLocaleString('en-IN')}</p>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-gray)' }}>
                                {item.areaSqFt} sq. ft × ₹{item.ratePerSqFt}/sq. ft = ₹{(item.baseCost ?? item.areaSqFt * item.ratePerSqFt).toLocaleString('en-IN')}
                              </p>
                              {item.layoutCost > 0 && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gold-dark)' }}>
                                  {item.layout} Layout: +₹{item.layoutCost.toLocaleString('en-IN')}
                                </p>
                              )}
                              {item.addonsCost > 0 && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gold-dark)' }}>
                                  Room Add-ons: +₹{item.addonsCost.toLocaleString('en-IN')}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </>
              )}

              {apiError && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fff0f0', borderRadius: '12px', border: '1px solid #f5a5a5', color: '#8b1f1f' }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>⚠ Error: {apiError}</p>
                </div>
              )}

              {submissionResult && (
                <div style={{ padding: '1.5rem', backgroundColor: '#eefaf0', borderRadius: '12px', border: '1px solid #9fd5aa', color: '#1e5b2f' }}>
                  <p style={{ margin: 0, fontWeight: '600' }}>✓ Estimator submitted successfully!</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Reference ID: {submissionResult._id}</p>
                </div>
              )}

              {/* Actions */}
              <div className="estimator-actions">
                {submissionResult ? (
                  <>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        // Download PDF
                        window.open(`${ESTIMATOR_API_URL}/${submissionResult._id}/pdf/download`, '_blank');
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      📥 Download PDF
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        // Reset form
                        localStorage.removeItem(ESTIMATOR_DRAFT_KEY);
                        window.location.reload();
                      }}
                    >
                      Create New Quotation
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn-secondary" onClick={handlePrevStep}>
                      Back
                    </button>
                    <button className="btn-primary" onClick={handleSubmitEstimator} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Estimate'}
                    </button>
                  </>
                )}
              </div>
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
            <button 
              className={`progress-step ${currentStep === 1 ? 'current' : ''} ${currentStep > 1 ? 'visited' : ''} ${!canNavigateToStep(1) ? 'disabled' : ''}`} 
              onClick={() => handleProgressClick(1)}
              disabled={!canNavigateToStep(1)}
            >
              1. Room
            </button>
            <div className={`progress-line ${currentStep > 1 ? 'active' : ''}`}></div>
            <button 
              className={`progress-step ${currentStep === 2 ? 'current' : ''} ${currentStep > 2 ? 'visited' : ''} ${!canNavigateToStep(2) ? 'disabled' : ''}`} 
              onClick={() => handleProgressClick(2)}
              disabled={!canNavigateToStep(2)}
            >
              2. Dimensions
            </button>
            <div className={`progress-line ${currentStep > 2 ? 'active' : ''}`}></div>
            <button 
              className={`progress-step ${currentStep === 3 ? 'current' : ''} ${currentStep > 3 ? 'visited' : ''} ${!canNavigateToStep(3) ? 'disabled' : ''}`} 
              onClick={() => handleProgressClick(3)}
              disabled={!canNavigateToStep(3)}
            >
              3. Add Ons
            </button>
            <div className={`progress-line ${currentStep > 3 ? 'active' : ''}`}></div>
            <button 
              className={`progress-step ${currentStep === 4 ? 'current' : ''} ${currentStep > 4 ? 'visited' : ''} ${!canNavigateToStep(4) ? 'disabled' : ''}`} 
              onClick={() => handleProgressClick(4)}
              disabled={!canNavigateToStep(4)}
            >
              4. Your Info
            </button>
            <div className={`progress-line ${currentStep > 4 ? 'active' : ''}`}></div>
            <button 
              className={`progress-step ${currentStep === 5 ? 'current' : ''} ${currentStep > 5 ? 'visited' : ''} ${!canNavigateToStep(5) ? 'disabled' : ''}`} 
              onClick={() => handleProgressClick(5)}
              disabled={!canNavigateToStep(5)}
            >
              5. Review
            </button>
          </div>

          {loadConfigError && (
            <div style={{ marginBottom: '1rem', padding: '1rem', borderRadius: '12px', backgroundColor: '#fff4f4', color: '#8b1f1f', border: '1px solid #f5a5a5' }}>
              {loadConfigError}
            </div>
          )}
          <div className="estimator-step-container">
            {currentStep === 5 && isCalculating && (
              <div className="selected-summary" style={{ marginBottom: 16 }}>
                Calculating estimate preview...
              </div>
            )}
            {currentStep === 5 && apiError && (
              <div className="selected-summary" style={{ marginBottom: 16, backgroundColor: '#fff0f0', borderColor: '#f5a5a5', color: '#8b1f1f' }}>
                <strong>Error:</strong> {apiError}
              </div>
            )}
            <div className="estimator-step-container" key={`step-${currentStep}`}>
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estimator;
