import React, { useEffect, useRef, useState } from 'react';
import { FaCheck, FaExclamationTriangle, FaLock, FaTimes } from 'react-icons/fa';
import RoomSelection from '../components/estimator/RoomSelection';
import DimensionsSelection from '../components/estimator/DimensionsSelection';
import ExtraAddons from '../components/estimator/ExtraAddons';
import LeadCapture from '../components/estimator/LeadCapture';
import TermsAndCondition from '../components/estimator/TermsAndCondition';
import {
  API_BASE_URL,
  buildRoomInstances,
  fetchEstimatorRooms,
  fetchGlobalAddons,
  findRoomByName,
  formatGlobalAddonForCard,
  buildGlobalAddonDetails,
  getGlobalAddonsTotal,
  normalizeGlobalAddonId,
  normalizeSelectedGlobalAddonEntries,
  normalizeSelectedGlobalAddons,
  toggleGlobalAddonSelection,
  updateGlobalAddonQuantity,
  buildDefaultLayoutMaterialSelection,
  getLayoutMaterialsForRoom,
  getLayoutMaterialsTotal,
  isLayoutMaterialSelected,
  matchDimensionFromSizeCategory,
  normalizeLayoutMaterialSelection,
  normalizeEstimatorRoom,
  reloadLayoutMaterialSelection,
  toggleLayoutMaterialSelection,
} from '../utils/estimatorApi';
import Footer from '../components/Footer';
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

const isDimensionRoomComplete = (room, roomDimensionsByRoom, roomsCatalog) => {
  const roomData = findRoomByName(roomsCatalog, room.roomName);
  const requiresDims = roomData?.requiresDimensions !== false;
  const requiresLayout = Array.isArray(roomData?.layouts) && roomData.layouts.length > 0;
  const dimensions = roomDimensionsByRoom?.[room.id] || {};
  const hasDimensions =
    Number(dimensions.length) > 0 &&
    Number(dimensions.width) > 0 &&
    Number(dimensions.height) > 0;
  const hasLayout = Boolean(dimensions.selectedDesignIdea?.layout);

  if (requiresDims && !hasDimensions) {
    return false;
  }

  if (requiresLayout && !hasLayout) {
    return false;
  }

  return true;
};

const recalculateQuoteTotals = (
  quote,
  selectedComponents,
  selectedMaterials,
  selectedGlobalAddons = [],
  globalAddonsOptions = [],
) => {
  if (!quote || !Array.isArray(quote.lineItems)) {
    return quote;
  }

  const updatedQuote = JSON.parse(JSON.stringify(quote));
  let newRoomTotals = 0;
  const normalizedSelectedAddons = normalizeSelectedGlobalAddonEntries(selectedGlobalAddons);
  const addonDetails = buildGlobalAddonDetails(normalizedSelectedAddons, globalAddonsOptions);
  const globalAddonsTotal = getGlobalAddonsTotal(normalizedSelectedAddons, globalAddonsOptions);

  updatedQuote.lineItems = updatedQuote.lineItems
    .filter((item) => item.roomId !== 'global-addons' && item.roomId !== 'extra-addons')
    .map((item) => {
      if (!item.roomId) {
        newRoomTotals += item.estimatedCost || 0;
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

      newRoomTotals += newEstimatedCost;

      return {
        ...item,
        packageComponentsTotal,
        layoutMaterialsCost,
        estimatedCost: newEstimatedCost,
      };
    });

  updatedQuote.lineItems.push({
    roomId: 'global-addons',
    roomName: 'Global Add-ons',
    label: 'Premium Add-ons',
    areaSqFt: 0,
    ratePerSqFt: 0,
    baseCost: 0,
    layout: '',
    layoutCost: 0,
    addons: addonDetails.map((addon) => addon.name),
    addonDetails,
    addonsCost: globalAddonsTotal,
    estimatedCost: globalAddonsTotal,
  });

  updatedQuote.roomTotals = newRoomTotals;
  updatedQuote.globalAddonsTotal = globalAddonsTotal;
  updatedQuote.estimatedAmount = newRoomTotals + globalAddonsTotal;

  return updatedQuote;
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsReviewed, setTermsReviewed] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [termsPromptActive, setTermsPromptActive] = useState(false);
  const termsPromptTimerRef = useRef(null);
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
  }); // roomId -> { materialId: boolean }
  const [formData, setFormData] = useState(() => {
    try {
      const storedDraft = localStorage.getItem(ESTIMATOR_DRAFT_KEY);
      if (storedDraft) {
        const parsedDraft = JSON.parse(storedDraft);
        return {
          rooms: parsedDraft.rooms || {},
          selectedRoomForDimensions: parsedDraft.selectedRoomForDimensions || '',
          roomDimensionsByRoom: migrateRoomDimensions(parsedDraft.roomDimensionsByRoom),
          extraAddons: normalizeSelectedGlobalAddonEntries(parsedDraft.extraAddons || []),
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

  useEffect(() => () => window.clearTimeout(termsPromptTimerRef.current), []);

  const promptTermsReview = () => {
    window.clearTimeout(termsPromptTimerRef.current);
    setTermsPromptActive(false);
    termsPromptTimerRef.current = window.setTimeout(() => {
      setTermsPromptActive(true);
      termsPromptTimerRef.current = window.setTimeout(() => setTermsPromptActive(false), 1800);
    }, 0);
  };

  const [roomsCatalog, setRoomsCatalog] = useState([]);
  const [globalAddonsOptions, setGlobalAddonsOptions] = useState([]);
  const [reviewAddonIds, setReviewAddonIds] = useState([]);
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
        setLoadConfigError('Unable to load quote data. Please refresh and try again.');
      } finally {
        setLoadingEstimatorData(false);
      }
    };

    loadEstimatorData();
  }, []);

  useEffect(() => {
    if (globalAddonsOptions.length === 0) {
      return;
    }

    const activeAddonIds = new Set(
      globalAddonsOptions.map((addon) => normalizeGlobalAddonId(addon._id || addon.id)),
    );

    setFormData((prev) => {
      const normalizedSelection = normalizeSelectedGlobalAddonEntries(prev.extraAddons);
      const filteredSelection = normalizedSelection.filter((addon) => activeAddonIds.has(addon.id));

      const selectionChanged =
        filteredSelection.length !== normalizedSelection.length ||
        filteredSelection.some((addon, index) => JSON.stringify(addon) !== JSON.stringify(normalizedSelection[index]));

      if (!selectionChanged) {
        return prev;
      }

      return {
        ...prev,
        extraAddons: filteredSelection,
      };
    });
  }, [globalAddonsOptions]);

  useEffect(() => {
    const roomInstances = buildRoomInstances(formData.rooms);
    if (roomInstances.length === 0 && formData.selectedRoomForDimensions) {
      updateFormData('selectedRoomForDimensions', '');
      return;
    }

    if (roomInstances.length > 0 && !roomInstances.some((room) => room.id === formData.selectedRoomForDimensions)) {
      const firstCatalogRoom = roomsCatalog.find((room) => Number(formData.rooms[room.name]) > 0);
      updateFormData(
        'selectedRoomForDimensions',
        firstCatalogRoom ? `${firstCatalogRoom.name}-1` : roomInstances[0].id,
      );
    }
  }, [formData.rooms, formData.selectedRoomForDimensions, roomsCatalog]);

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
    if (roomsCatalog.length === 0) return;

    setFormData((prev) => {
      const nextDimensions = { ...prev.roomDimensionsByRoom };
      let changed = false;

      buildRoomInstances(prev.rooms).forEach((roomInstance) => {
        const current = nextDimensions[roomInstance.id];
        const room = findRoomByName(roomsCatalog, roomInstance.roomName);
        if (!current || !room) return;

        const selectedSize = current.sizeCategory || '';
        const sizeIsStale = Boolean(selectedSize) && !matchDimensionFromSizeCategory(
          room.dimensions,
          selectedSize,
        );

        if (sizeIsStale) {
          nextDimensions[roomInstance.id] = {
            length: '',
            width: '',
            height: '',
            sizeCategory: '',
            selectedDesignIdea: { layout: '', addons: [], room: roomInstance.roomName },
          };
          changed = true;
          return;
        }

        const design = current.selectedDesignIdea || {};
        const validLayouts = new Set((room.layouts || []).map((layout) => layout.name));
        const validAddons = new Set((room.addons || []).map((addon) => addon.name));
        const layout = validLayouts.has(design.layout) ? design.layout : '';
        const addons = (design.addons || []).filter((addon) => validAddons.has(addon));

        if (layout !== (design.layout || '') || addons.length !== (design.addons || []).length) {
          nextDimensions[roomInstance.id] = {
            ...current,
            selectedDesignIdea: { ...design, layout, addons, room: roomInstance.roomName },
          };
          changed = true;
        }
      });

      return changed ? { ...prev, roomDimensionsByRoom: nextDimensions } : prev;
    });
  }, [roomsCatalog]);

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
        // Package materials are selected initially but remain optional and deselectable.
        if (quote && Array.isArray(quote.lineItems)) {
          const initialComponents = {};
          const initialLayoutMaterials = {};

          quote.lineItems.forEach((item) => {
            if (item.roomId && item.roomId !== 'global-addons' && Array.isArray(item.packageComponents)) {
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
      formData.extraAddons || [],
      globalAddonsOptions,
    );

    const quoteJson = JSON.stringify(quoteSummary);
    const updatedJson = JSON.stringify(updatedQuote);
    if (quoteJson !== updatedJson) {
      setQuoteSummary(updatedQuote);
    }
  }, [currentStep, quoteSummary, selectedPackageComponents, selectedLayoutMaterials, formData.extraAddons, globalAddonsOptions]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      const firstCatalogRoom = roomsCatalog.find((room) => Number(formData.rooms[room.name]) > 0);
      const firstSelectedRoom = firstCatalogRoom?.name || Object.keys(formData.rooms)[0];

      if (firstSelectedRoom) {
        updateFormData('selectedRoomForDimensions', `${firstSelectedRoom}-1`);
      }
    }

    if (currentStep === 3) {
      setReviewAddonIds(normalizeSelectedGlobalAddons(formData.extraAddons));
    }

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
          return roomInstances.length > 0 && roomInstances.every((room) =>
            isDimensionRoomComplete(room, formData.roomDimensionsByRoom, roomsCatalog)
          );
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
        if (currentStep === 3) {
          setReviewAddonIds(normalizeSelectedGlobalAddons(formData.extraAddons));
        }

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
    setApiError('');
    setSubmissionResult(null);

    setFormData((prev) => ({
      ...prev,
      extraAddons: toggleGlobalAddonSelection(prev.extraAddons, addonId),
    }));
  };

  const updateAddonQuantity = (addonId, delta) => {
    setApiError('');
    setSubmissionResult(null);

    setFormData((prev) => ({
      ...prev,
      extraAddons: updateGlobalAddonQuantity(prev.extraAddons, addonId, delta),
    }));
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
    if (!isCurrentStepComplete()) {
      return;
    }

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
      const submittedEstimator = result?.data || null;
      setSubmissionResult(submittedEstimator);
      localStorage.removeItem(ESTIMATOR_DRAFT_KEY);
      return submittedEstimator;
    } catch (error) {
      setApiError(error.message || 'Unable to submit estimate request.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAndDownload = async () => {
    if (!termsAccepted) {
      promptTermsReview();
      return;
    }

    const submittedEstimator = await handleSubmitEstimator();
    if (submittedEstimator?._id) {
      await downloadCurrentQuotePDF(submittedEstimator._id);
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
              const roomConfig = findRoomByName(roomsCatalog, room);
              const maxCount = Math.max(
                1,
                Number(roomConfig?.maxSelectableRooms) || (
                  String(room).toLowerCase().includes('bedroom') ? 6 : 2
                ),
              );
              const nextCount = Math.min(maxCount, Number(count) || 0);
              const newRooms = { ...formData.rooms };
              if (nextCount <= 0) {
                delete newRooms[room];
              } else {
                newRooms[room] = nextCount;
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
            onUpdateAddonQuantity={updateAddonQuantity}
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
      case 5: {
        const formattedGlobalAddons = globalAddonsOptions.map(formatGlobalAddonForCard);
        const reviewAddons = reviewAddonIds
          .map((addonId) => formattedGlobalAddons.find((addon) => addon.id === addonId))
          .filter(Boolean);

        return (
          <div className="review-container">
            {/* Left Side - Image */}
            <div className="review-image-card" style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
              <img 
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=900&q=82"
                alt="Interior Design"
                style={{ width: '100%', height: '500px', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, transparent 60%)' }}></div>
            </div>

            {/* Right Side - Details & Quote */}
            <div
              className="review-quote-column quotation-review-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                '--quotation-review-bg': `url(${process.env.PUBLIC_URL}/images/hero-sectionn.png)`,
              }}
            >
              <div className="review-quote-header">
                <span className="quotation-review-kicker">Quotation Review</span>
                <h2 style={{ color: 'var(--color-charcoal-dark)', marginBottom: '1rem', fontSize: '2rem' }}>Your Design Quote</h2>
                <p style={{ color: 'var(--color-gray)', marginBottom: '1.5rem', fontSize: '1rem' }}>Review your selections and get your personalized estimate</p>
              </div>

              {/* Summary Cards */}
              <div className="review-summary-section" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="review-summary-card" style={{ padding: '1rem', backgroundColor: '#fffdf3', borderRadius: '8px', borderLeft: '4px solid var(--color-gold)' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-gray)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Configured Rooms</p>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-charcoal-dark)' }}>
                    {quoteSummary ? quoteSummary.lineItems.filter((item) => item.roomId !== 'global-addons').length : 0}
                  </p>
                </div>
              </div>

              {/* Selected Rooms */}
              <div className="review-selected-rooms">
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
                  <div className="quote-review-panel" style={{ padding: '2rem', backgroundColor: '#fffdf3', borderRadius: '12px', border: '2px solid var(--color-gold)' }}>
                  {/* Detailed Breakdown */}
                  {Array.isArray(quoteSummary.lineItems) && quoteSummary.lineItems.length > 0 && (
                    <div className="quote-cost-breakdown" style={{ borderTop: '0', paddingTop: 0 }}>
                      <p style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-charcoal-dark)' }}>Cost Breakdown</p>
                      {quoteSummary.lineItems.map((item) => (
                        <div className="quote-line-item" key={item.roomId} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
                          {item.roomId === 'global-addons' || item.roomId === 'extra-addons' ? (
                            // Extra Add-ons Display - Show each with individual cost
                            <>
                              <p style={{ margin: '0 0 0.75rem 0', fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.95rem' }}>Premium Add-ons</p>
                              <div style={{ marginTop: '1.25rem' }}>
                                {reviewAddons.length === 0 && (
                                  <p style={{ margin: 0, color: 'var(--color-gray)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                    No premium add-ons selected.
                                  </p>
                                )}

                                {reviewAddons.map((addon) => {
                                  const selectedEntry = normalizeSelectedGlobalAddonEntries(formData.extraAddons)
                                    .find((entry) => entry.id === addon.id);
                                  const isSelected = Boolean(selectedEntry);
                                  const count = selectedEntry?.count || 0;
                                  const displayedPrice = isSelected ? (Number(addon.price) || 0) * count : 0;

                                  return (
                                    <div className="quote-addon-row" key={addon.id || addon.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', paddingLeft: '1.25rem' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0, cursor: 'pointer', color: isSelected ? 'var(--color-charcoal-dark)' : '#4b5563', fontWeight: isSelected ? 700 : 600 }}>
                                        <button
                                          type="button"
                                          className={`quote-toggle-control quote-switch-control ${isSelected ? 'selected' : ''}`}
                                          onClick={(event) => {
                                            event.preventDefault();
                                            toggleAddon(addon.id);
                                          }}
                                          role="switch"
                                          aria-checked={isSelected}
                                          title={isSelected ? 'Click to deselect' : 'Click to select'}
                                        >
                                          <span className="quote-switch-text">{isSelected ? 'ON' : 'OFF'}</span>
                                          <span className="quote-switch-knob" aria-hidden="true">
                                            {isSelected ? <FaCheck aria-hidden="true" /> : <FaTimes aria-hidden="true" />}
                                          </span>
                                        </button>
                                        <span style={{ fontSize: '1rem', lineHeight: 1.4 }}>
                                          • {addon.name}
                                        </span>
                                      </label>
                                      <p style={{ margin: 0, minWidth: '90px', textAlign: 'right', fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '0.95rem' }}>
                                        ₹{displayedPrice.toLocaleString('en-IN')}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            // Room Items Display
                            <>
                              <div className="quote-room-cost-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <p style={{ margin: 0, fontWeight: '600', color: 'var(--color-charcoal-dark)', fontSize: '0.95rem' }}>{item.label}</p>
                                <p style={{ margin: 0, fontWeight: '700', color: 'var(--color-charcoal-dark)', fontSize: '1rem' }}>₹{item.estimatedCost.toLocaleString('en-IN')}</p>
                              </div>
                              {item.areaSqFt === 0 && item.layout && (
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#4b5563', fontWeight: 600 }}>
                                  {item.layout}
                                </p>
                              )}
                              {item.addonsCost > 0 && (
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: '#3a2b08', fontWeight: 700 }}>
                                  Room Add-ons: +₹{item.addonsCost.toLocaleString('en-IN')}
                                </p>
                              )}
                              
                              {/* Package Components Section */}
                              {item.roomId && Array.isArray(item.packageComponents) && item.packageComponents.length > 0 ? (
                                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-charcoal-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items</p>
                                  
                                  {item.packageComponents.map((component) => {
                                    // Skip components without valid IDs
                                    if (!component.id) {
                                      console.warn('[PackageComponents] Component missing ID:', component.name);
                                      return null;
                                    }
                                    
                                    const isSelected = selectedPackageComponents[item.roomId]?.includes(component.id);
                                    
                                    return (
                                      <div className="quote-option-cost-row" key={component.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                        {component.mandatory ? (
                                          <span style={{ fontSize: '0.9rem', color: 'var(--color-gold-dark)', display: 'inline-flex' }}>
                                            <FaLock aria-hidden="true" />
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            className={`quote-switch-control ${isSelected ? 'selected' : ''}`}
                                            onClick={() => item.roomId && component.id && togglePackageComponent(item.roomId, component.id)}
                                            style={{ 
                                              cursor: 'pointer',
                                              width: '20px',
                                              height: '20px',
                                              minWidth: '20px',
                                              minHeight: '20px',
                                              borderRadius: '50%',
                                              border: `2px solid ${isSelected ? 'var(--color-gold)' : '#c62828'}`,
                                              backgroundColor: isSelected ? 'var(--color-gold)' : 'rgba(198, 40, 40, 0.08)',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              padding: 0,
                                              transition: 'all 0.3s ease',
                                              boxShadow: isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.1)' : 'none',
                                            }}
                                            role="switch"
                                            aria-checked={isSelected}
                                            title={isSelected ? 'Click to deselect' : 'Click to select'}
                                          >
                                            <span className="quote-switch-text">{isSelected ? 'ON' : 'OFF'}</span>
                                            <span className="quote-switch-knob" aria-hidden="true">
                                              {isSelected ? <FaCheck aria-hidden="true" /> : <FaTimes aria-hidden="true" />}
                                            </span>
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
                                  
                                </div>
                              ) : (
                                Array.isArray(item.packageComponents) && !item.layout && (
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
                                      Items
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
                                            <div className="quote-option-cost-row" key={material.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', paddingLeft: '0.5rem' }}>
                                              <button
                                                type="button"
                                                className={`quote-switch-control ${isSelected ? 'selected' : ''}`}
                                                onClick={() =>
                                                  item.roomId &&
                                                  material.id &&
                                                  !material.mandatory &&
                                                  toggleLayoutMaterial(item.roomId, material.id)
                                                }
                                                disabled={material.mandatory}
                                                title={isSelected ? 'Click to deselect' : 'Click to select'}
                                                role="switch"
                                                aria-checked={isSelected}
                                                style={{
                                                  cursor: material.mandatory ? 'not-allowed' : 'pointer',
                                                  width: '20px',
                                                  height: '20px',
                                                  minWidth: '20px',
                                                  minHeight: '20px',
                                                  borderRadius: '50%',
                                                  border: `2px solid ${isSelected ? 'var(--color-gold)' : '#c62828'}`,
                                                  backgroundColor: isSelected ? 'var(--color-gold)' : 'rgba(198, 40, 40, 0.08)',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  padding: 0,
                                                  transition: 'all 0.3s ease',
                                                  boxShadow: isSelected ? '0 0 0 3px rgba(212, 175, 55, 0.1)' : 'none',
                                                }}
                                              >
                                                <span className="quote-switch-text">{isSelected ? 'ON' : 'OFF'}</span>
                                                <span className="quote-switch-knob" aria-hidden="true">
                                                  {isSelected ? <FaCheck aria-hidden="true" /> : <FaTimes aria-hidden="true" />}
                                                </span>
                                              </button>
                                              <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-charcoal-dark)', fontWeight: '500' }}>
                                                  {material.name}
                                                  {material.size && (
                                                    <span style={{ marginLeft: '0.35rem', fontSize: '0.68rem', color: 'var(--color-gray)', fontWeight: 500 }}>
                                                      ({material.size})
                                                    </span>
                                                  )}
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
                    <div className="quote-acceptance-section" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={termsAccepted}
                              onChange={(event) => {
                                if (!termsReviewed) {
                                  promptTermsReview();
                                  return;
                                }

                                setTermsAccepted(event.target.checked);
                              }}
                              aria-describedby="quote-terms-prompt"
                              style={{ width: '18px', height: '18px', marginTop: '3px', accentColor: 'var(--color-gold)', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.95rem', color: 'var(--color-charcoal-dark)', lineHeight: 1.4 }}>
                              {termsReviewed ? 'I agree to the ' : 'Read the '}
                              <button
                                type="button"
                                className={`quote-terms-link ${termsPromptActive ? 'needs-attention' : ''}`}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setTermsPromptActive(false);
                                  setIsTermsOpen(true);
                                }}
                                style={{ border: 'none', backgroundColor: 'transparent', color: 'var(--color-gold-dark)', cursor: 'pointer' }}
                              >
                                <strong>terms and conditions</strong>
                              </button>
                              {termsReviewed ? '.' : ' before accepting.'}
                            </span>
                          </label>
                          <span
                            id="quote-terms-prompt"
                            className={`quote-terms-prompt ${termsPromptActive ? 'visible' : ''}`}
                            aria-live="polite"
                          >
                            {termsPromptActive ? 'Please open and read the terms and conditions first.' : ''}
                          </span>
                        </div>
                        <ul className="quote-terms-notes">
                          <li>This price includes manufacturing and execution process.</li>
                          <li>Freight and installation cost may vary based on site distance.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <TermsAndCondition
                isOpen={isTermsOpen}
                hasAccepted={termsAccepted}
                onClose={() => setIsTermsOpen(false)}
                onAccept={() => {
                  setTermsReviewed(true);
                  setTermsAccepted(true);
                  setIsTermsOpen(false);
                }}
              />

              {apiError && (
                <div style={{ padding: '1.5rem', backgroundColor: '#fff0f0', borderRadius: '12px', border: '1px solid #f5a5a5', color: '#8b1f1f' }}>
                  <p style={{ margin: 0, fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaExclamationTriangle aria-hidden="true" /> Error: {apiError}
                  </p>
                </div>
              )}

              {submissionResult && (
                <div style={{ padding: '1.5rem', backgroundColor: '#eefaf0', borderRadius: '12px', border: '1px solid #9fd5aa', color: '#1e5b2f' }}>
                  <p style={{ margin: 0, fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FaCheck aria-hidden="true" /> Quote Interior Yourself request submitted successfully!
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>Reference ID: {submissionResult._id}</p>
                </div>
              )}

              {/* Actions */}
              <div className="estimator-actions">
                {submissionResult ? (
                  <>
                    <button
                      className="btn-primary"
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <button className="btn-secondary" onClick={handlePrevStep}>
                        Back
                      </button>
                    </div>
                    <button className="btn-primary" onClick={handleSubmitAndDownload} disabled={isSubmitting || isDownloadingPdf}>
                      {isSubmitting || isDownloadingPdf ? 'Preparing Download...' : 'Submit & Download'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      }
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <div
      className="estimator-page"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(14, 14, 14, 0.72), rgba(14, 14, 14, 0.45)), url(${process.env.PUBLIC_URL}/images/hero-sectionn.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="estimator-header-bg">
        <div className="container">
          <h1 className="estimator-page-title">Quote Interior Yourself</h1>
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
      <Footer />
    </div>
  );
};

export default Estimator;
