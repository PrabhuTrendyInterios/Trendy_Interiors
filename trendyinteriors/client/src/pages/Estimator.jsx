import React, { useEffect, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import RoomSelection from '../components/estimator/RoomSelection';
import DimensionsSelection from '../components/estimator/DimensionsSelection';
import ExtraAddons from '../components/estimator/ExtraAddons';
import LeadCapture from '../components/estimator/LeadCapture';
import {
  API_BASE_URL,
  buildRoomInstances,
  fetchEstimatorRooms,
  fetchGlobalAddons,
  findRoomByName,
  formatGlobalAddonForCard,
  buildDefaultLayoutMaterialSelection,
  getLayoutMaterialsForRoom,
  getLayoutMaterialsTotal,
  isLayoutMaterialSelected,
  normalizeLayoutMaterialSelection,
  normalizeEstimatorRoom,
  reloadLayoutMaterialSelection,
  toggleLayoutMaterialSelection,
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [apiError, setApiError] = useState('');
  const [quoteSummary, setQuoteSummary] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [selectedPackageComponents, setSelectedPackageComponents] = useState(() => {
    try {
      const storedPackageComponents = localStorage.getItem('estimatorSelectedPackageComponents');
      return storedPackageComponents ? JSON.parse(storedPackageComponents) : {};
    } catch (error) {
      console.error('Unable to load package components', error);
      return {};
    }
  }); // roomId -> [componentIds]
  const [selectedLayoutMaterials, setSelectedLayoutMaterials] = useState(() => {
    try {
      const storedLayoutMaterials = localStorage.getItem('estimatorSelectedLayoutMaterials');
      return storedLayoutMaterials
        ? normalizeLayoutMaterialSelection(JSON.parse(storedLayoutMaterials))
        : {};
    } catch (error) {
      console.error('Unable to load layout materials', error);
      return {};
    }
  }); // roomId -> { materialId: true }
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
    if (roomsCatalog.length === 0) {
      return;
    }

    const availableRooms = new Set(roomsCatalog.map((room) => room.name));
    const sanitizedRooms = Object.fromEntries(
      Object.entries(formData.rooms).filter(
        ([roomName, count]) => availableRooms.has(roomName) && Number(count) > 0,
      ),
    );

    const isDifferent =
      Object.keys(sanitizedRooms).length !== Object.keys(formData.rooms).length ||
      Object.entries(sanitizedRooms).some(
        ([roomName, count]) => formData.rooms[roomName] !== count,
      );

    if (isDifferent) {
      updateFormData('rooms', sanitizedRooms);
    }
  }, [roomsCatalog, formData.rooms]);

  useEffect(() => {
    try {
      localStorage.setItem(ESTIMATOR_DRAFT_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error('Unable to save estimator draft', error);
    }
  }, [formData]);

  // Save selectedPackageComponents to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('estimatorSelectedPackageComponents', JSON.stringify(selectedPackageComponents));
    } catch (error) {
      console.error('Unable to save selected package components', error);
    }
  }, [selectedPackageComponents]);

  // Save selectedLayoutMaterials to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        'estimatorSelectedLayoutMaterials',
        JSON.stringify(normalizeLayoutMaterialSelection(selectedLayoutMaterials)),
      );
    } catch (error) {
      console.error('Unable to save selected layout materials', error);
    }
  }, [selectedLayoutMaterials]);

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
          body: JSON.stringify({
            ...formData,
            selectedPackageComponents,
            selectedLayoutMaterials: normalizeLayoutMaterialSelection(selectedLayoutMaterials),
          }),
        });

        if (!response.ok) {
          throw new Error(await parseApiError(response));
        }

        const result = await response.json();
        const quote = result?.data?.quoteSummary || null;
        setQuoteSummary(quote);

        // Initialize selectedPackageComponents based on fetched quote
        // Only mandatory components are auto-included; optional ones start unselected
        if (quote && Array.isArray(quote.lineItems)) {
          const initialComponents = {};
          const initialLayoutMaterials = {};

          quote.lineItems.forEach((item) => {
            if (item.roomId && item.roomId !== 'global-addons' && Array.isArray(item.packageComponents)) {
              // Start with all package components selected by default.
              // Users can deselect optional items if they don't need them.
              initialComponents[item.roomId] = item.packageComponents
                .filter((component) => component?.id)
                .map((component) => component.id);
            }
          });
          setSelectedPackageComponents(initialComponents);
          setSelectedLayoutMaterials(initialLayoutMaterials);
        }
      } catch (error) {
        setApiError(error.message || 'Unable to calculate estimate.');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateQuoteForReview();
  }, [currentStep, formData, quoteSummary, roomsCatalog, selectedPackageComponents, selectedLayoutMaterials]);

  useEffect(() => {
    if (currentStep !== 5 || !quoteSummary || roomsCatalog.length === 0) {
      return;
    }

    setSelectedLayoutMaterials((prev) => {
      const next = { ...prev };
      let changed = false;

      quoteSummary.lineItems.forEach((item) => {
        if (!item.roomId || item.roomId === 'global-addons' || !item.layout || next[item.roomId]) {
          return;
        }

        const room = findRoomByName(roomsCatalog, item.roomName);
        const sizeCategory = formData.roomDimensionsByRoom[item.roomId]?.sizeCategory || '';
        const layoutData = getLayoutMaterialsForRoom({
          room,
          layoutName: item.layout,
          sizeCategory,
        });

        if (layoutData.materials.length > 0) {
          next[item.roomId] = buildDefaultLayoutMaterialSelection(layoutData.materials);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [currentStep, quoteSummary, roomsCatalog, formData.roomDimensionsByRoom]);

  // Local recalculation on component/material selection - provides instant feedback
  useEffect(() => {
    if (currentStep !== 5 || !quoteSummary) {
      return; // Only recalculate on review step when quote exists
    }

    const updatedQuote = recalculateQuoteTotals(
      quoteSummary,
      selectedPackageComponents,
      selectedLayoutMaterials,
    );

    const quoteJson = JSON.stringify(quoteSummary);
    const updatedJson = JSON.stringify(updatedQuote);
    if (quoteJson !== updatedJson) {
      setQuoteSummary(updatedQuote);
    }
  }, [currentStep, quoteSummary, selectedPackageComponents, selectedLayoutMaterials]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    // Mark current step as completed
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep((prev) => prev + 1);
    scrollToTop();
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
    scrollToTop();
  };

  // Check if current step is complete
  const isCurrentStepComplete = () => {
    switch (currentStep) {
      case 1: // Room Selection
        return Object.keys(formData.rooms).length > 0;
      case 2: // Dimensions
        {
          const roomInstances = buildRoomInstances(formData.rooms);
          return roomInstances.length > 0 && roomInstances.every((room) => {
            const roomData = findRoomByName(roomsCatalog, room.roomName);
            const requiresDims = roomData?.requiresDimensions !== false;

            if (!requiresDims) {
              return true; // Room doesn't require dimensions, so it's complete
            }

            const dimensions = formData.roomDimensionsByRoom[room.id] || {};
            return (
              Number(dimensions.length) > 0 &&
              Number(dimensions.width) > 0 &&
              Number(dimensions.height) > 0
            );
          });
        }
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

  const getRoomNameForInstance = (roomId, rooms = formData.rooms) =>
    buildRoomInstances(rooms).find((room) => room.id === roomId)?.roomName || '';

  const applyLayoutMaterialReset = (roomId, layoutName, sizeCategory, roomName) => {
    setSelectedLayoutMaterials((prev) => {
      const next = { ...prev };
      delete next[roomId];

      const reloaded = reloadLayoutMaterialSelection({
        roomsCatalog,
        roomName,
        layoutName,
        sizeCategory,
      });

      if (reloaded) {
        next[roomId] = reloaded;
      }

      return next;
    });
  };

  const updateRoomDimensions = (roomId, key, value) => {
    setApiError('');
    setSubmissionResult(null);
    setQuoteSummary(null);

    const prevRoom = formData.roomDimensionsByRoom[roomId] || {};
    const dimensionChanged =
      key === 'sizeCategory'
        ? (prevRoom.sizeCategory || '') !== (value || '')
        : ['length', 'width', 'height'].includes(key) &&
          String(prevRoom[key] ?? '') !== String(value ?? '');

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

    if (dimensionChanged) {
      const roomName = getRoomNameForInstance(roomId);
      const layoutName = prevRoom.selectedDesignIdea?.layout || '';
      const sizeCategory =
        key === 'sizeCategory'
          ? value || ''
          : ['length', 'width', 'height'].includes(key)
            ? ''
            : prevRoom.sizeCategory || '';

      applyLayoutMaterialReset(roomId, layoutName, sizeCategory, roomName);
    }
  };

  const updateRoomDesignIdea = (roomId, idea) => {
    setApiError('');
    setSubmissionResult(null);
    setQuoteSummary(null);

    const prevRoom = formData.roomDimensionsByRoom[roomId] || {};
    const layoutChanged =
      (prevRoom.selectedDesignIdea?.layout || '') !== (idea?.layout || '');

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

    if (layoutChanged) {
      const roomName = idea?.room || getRoomNameForInstance(roomId);
      applyLayoutMaterialReset(
        roomId,
        idea?.layout || '',
        prevRoom.sizeCategory || '',
        roomName,
      );
    }
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

  const toggleLayoutMaterial = (roomId, materialId) => {
    setSelectedLayoutMaterials((prev) => ({
      ...prev,
      [roomId]: toggleLayoutMaterialSelection(prev[roomId], materialId),
    }));
  };

  const togglePackageComponent = (roomId, componentId) => {
    setSelectedPackageComponents((prev) => {
      const currentComponents = prev[roomId] || [];
      const newComponents = currentComponents.includes(componentId)
        ? currentComponents.filter((id) => id !== componentId)
        : [...currentComponents, componentId];
      
      return {
        ...prev,
        [roomId]: newComponents,
      };
    });
    
    // Note: quoteSummary will be updated immediately by the useEffect that watches selectedPackageComponents
  };

  // Local recalculation function - updates totals immediately without API call
  const recalculateQuoteTotals = (quote, selectedComponents, selectedMaterials) => {
    if (!quote || !Array.isArray(quote.lineItems)) {
      return quote;
    }

    const updatedQuote = JSON.parse(JSON.stringify(quote));
    let newGrandTotal = 0;
    let newRoomTotals = 0;

    updatedQuote.lineItems = updatedQuote.lineItems.map((item) => {
      if (item.roomId === 'global-addons' || item.roomId === 'extra-addons') {
        newGrandTotal += item.estimatedCost || 0;
        return item;
      }

      if (!item.roomId) {
        newGrandTotal += item.estimatedCost || 0;
        return item;
      }

      let packageComponentsTotal = item.packageComponentsTotal || 0;
      if (Array.isArray(item.packageComponents) && item.packageComponents.length > 0) {
        const selectedIds = selectedComponents[item.roomId] || [];
        packageComponentsTotal = item.packageComponents.reduce((sum, component) => {
          if (!component.id) return sum;
          const isIncluded = component.mandatory === true || selectedIds.includes(component.id);
          return isIncluded ? sum + (component.price || 0) : sum;
        }, 0);
      }

      let layoutMaterialsCost = item.layoutMaterialsCost || 0;
      if (Array.isArray(item.layoutMaterials) && item.layoutMaterials.length > 0) {
        layoutMaterialsCost = getLayoutMaterialsTotal(
          item.layoutMaterials,
          selectedMaterials[item.roomId] || {},
        );
      }

      const newEstimatedCost =
        (item.baseCost || 0) +
        (item.layoutCost || 0) +
        (item.addonsCost || 0) +
        packageComponentsTotal +
        layoutMaterialsCost;

      const updatedItem = {
        ...item,
        packageComponentsTotal,
        layoutMaterialsCost,
        estimatedCost: newEstimatedCost,
      };

      newGrandTotal += newEstimatedCost;
      newRoomTotals += newEstimatedCost;
      return updatedItem;
    });

    updatedQuote.roomTotals = newRoomTotals;
    updatedQuote.estimatedAmount = newGrandTotal;

    return updatedQuote;
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
    scrollToTop();
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
          selectedPackageComponents,
          selectedLayoutMaterials: normalizeLayoutMaterialSelection(selectedLayoutMaterials),
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

  const downloadCurrentQuotePDF = async (estimatorId = null) => {
    if (isDownloadingPdf) return;

    setApiError('');
    setIsDownloadingPdf(true);

    try {
      const requestUrl = estimatorId
        ? `${ESTIMATOR_API_URL}/${estimatorId}/pdf/download`
        : `${ESTIMATOR_API_URL}/pdf/download`;

      const requestOptions = estimatorId
        ? { method: 'GET' }
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...formData,
              selectedPackageComponents,
              selectedLayoutMaterials: normalizeLayoutMaterialSelection(selectedLayoutMaterials),
              customerInfo: {
                name: formData.leadData?.name || '',
                email: formData.leadData?.email || '',
                phone: formData.leadData?.phone || '',
                location: formData.leadData?.location || '',
              },
            }),
          };

      const response = await fetch(requestUrl, requestOptions);
      if (!response.ok) {
        throw new Error(await parseApiError(response));
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.setAttribute('download', estimatorId ? `Trendy_Interiors_Quotation_${estimatorId}.pdf` : 'Trendy_Interiors_Quotation_Preview.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(pdfUrl);
    } catch (error) {
      setApiError(error.message || 'Unable to download PDF.');
    } finally {
      setIsDownloadingPdf(false);
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
                              {item.layout && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gold-dark)' }}>
                                  {item.layout} Layout{item.layoutCost > 0 ? `: +₹${item.layoutCost.toLocaleString('en-IN')}` : ''}
                                </p>
                              )}
                              {(item.layoutMaterialsCost ?? 0) > 0 && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gold-dark)' }}>
                                  Layout Materials: +₹{item.layoutMaterialsCost.toLocaleString('en-IN')}
                                </p>
                              )}
                              {item.areaSqFt === 0 && item.layout && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gray)' }}>
                                  This room is priced by selected layout only because dimensions are optional for this room.
                                </p>
                              )}
                              {item.addonsCost > 0 && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--color-gold-dark)' }}>
                                  Room Add-ons: +₹{item.addonsCost.toLocaleString('en-IN')}
                                </p>
                              )}
                              
                              {/* Package Components Section */}
                              {item.roomId && Array.isArray(item.packageComponents) && item.packageComponents.length > 0 ? (
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-charcoal-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Package Components</p>
                                  
                                  {item.packageComponents.map((component) => {
                                    // Skip components without valid IDs
                                    if (!component.id) {
                                      console.warn('[PackageComponents] Component missing ID:', component.name);
                                      return null;
                                    }
                                    
                                    const isSelected = selectedPackageComponents[item.roomId]?.includes(component.id);
                                    
                                    return (
                                      <div key={component.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                        {component.mandatory ? (
                                          <span style={{ fontSize: '0.9rem', color: 'var(--color-gold-dark)' }}>🔒</span>
                                        ) : (
                                          <button
                                            onClick={() => item.roomId && component.id && togglePackageComponent(item.roomId, component.id)}
                                            style={{ 
                                              cursor: 'pointer',
                                              width: '20px',
                                              height: '20px',
                                              minWidth: '20px',
                                              minHeight: '20px',
                                              borderRadius: '50%',
                                              border: `2px solid ${isSelected ? 'var(--color-gold)' : '#ccc'}`,
                                              backgroundColor: isSelected ? 'var(--color-gold)' : 'white',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              padding: 0,
                                              transition: 'all 0.3s ease',
                                              boxShadow: isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.1)' : 'none',
                                            }}
                                            title={isSelected ? 'Click to deselect' : 'Click to select'}
                                          >
                                            {isSelected && (
                                              <span style={{ 
                                                fontSize: '12px', 
                                                color: 'white', 
                                                fontWeight: 'bold',
                                                lineHeight: 1
                                              }}>✓</span>
                                            )}
                                          </button>
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-charcoal-dark)', fontWeight: '500' }}>
                                            {component.name}
                                            {component.mandatory && (
                                              <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: '400' }}>
                                                (Included)
                                              </span>
                                            )}
                                          </p>
                                          {component.description && (
                                            <p style={{ margin: '2px 0 0 0', fontSize: '0.65rem', color: 'var(--color-gray)' }}>
                                              {component.description}
                                            </p>
                                          )}
                                        </div>
                                        <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                          ₹{(component.price || 0).toLocaleString('en-IN')}
                                        </p>
                                      </div>
                                    );
                                  })}
                                  
                                  {(item.packageComponentsTotal ?? 0) > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                                      <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.8rem' }}>Components Total</p>
                                      <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '0.8rem' }}>+₹{((item.packageComponentsTotal || 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                Array.isArray(item.packageComponents) && (
                                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--color-gray)', fontStyle: 'italic' }}>
                                    No package components available
                                  </p>
                                )
                              )}

                              {item.layout && (() => {
                                const room = findRoomByName(roomsCatalog, item.roomName);
                                const sizeCategory = formData.roomDimensionsByRoom[item.roomId]?.sizeCategory || '';
                                const layoutData = getLayoutMaterialsForRoom({
                                  room,
                                  layoutName: item.layout,
                                  sizeCategory,
                                });

                                return (
                                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-charcoal-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                      {layoutData.layoutName}
                                    </p>

                                    {layoutData.hasLayoutMaterials && layoutData.materials.length > 0 && (
                                      <>
                                        {layoutData.materials.map((material) => {
                                          const roomSelection = selectedLayoutMaterials[item.roomId] || {};
                                          const isSelected = isLayoutMaterialSelected(
                                            roomSelection,
                                            material.id,
                                            material.mandatory,
                                          );

                                          return (
                                            <div key={material.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={material.mandatory}
                                                onChange={() =>
                                                  item.roomId &&
                                                  material.id &&
                                                  !material.mandatory &&
                                                  toggleLayoutMaterial(item.roomId, material.id)
                                                }
                                                style={{
                                                  cursor: material.mandatory ? 'not-allowed' : 'pointer',
                                                  width: '16px',
                                                  height: '16px',
                                                }}
                                              />
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-charcoal-dark)', fontWeight: '500' }}>
                                                  {material.name}
                                                  {material.mandatory && (
                                                    <span style={{ marginLeft: '0.3rem', fontSize: '0.65rem', color: 'var(--color-gray)', fontWeight: '400' }}>
                                                      (Included)
                                                    </span>
                                                  )}
                                                </p>
                                              </div>
                                              <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                ₹{(material.price || 0).toLocaleString('en-IN')}
                                              </p>
                                            </div>
                                          );
                                        })}

                                        {(item.layoutMaterialsCost ?? 0) > 0 && (
                                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(212, 175, 55, 0.15)' }}>
                                            <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.8rem' }}>Materials Total</p>
                                            <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '0.8rem' }}>
                                              +₹{(item.layoutMaterialsCost || 0).toLocaleString('en-IN')}
                                            </p>
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })()}
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
                      className="btn-primary"
                      onClick={() => downloadCurrentQuotePDF(submissionResult._id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <FaDownload /> Download PDF
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        localStorage.removeItem(ESTIMATOR_DRAFT_KEY);
                        localStorage.removeItem('estimatorSelectedPackageComponents');
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
