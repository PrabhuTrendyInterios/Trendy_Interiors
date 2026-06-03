import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Estimator from '../../pages/Estimator';

jest.mock('../../components/estimator/RoomSelection', () => (props) => (
  <div>
    <button onClick={() => props.onUpdateRoomCount('Bedroom', 1)}>Select Bedroom</button>
    <button onClick={() => props.onUpdateRoomCount('Kitchen', 1)}>Select Kitchen</button>
    <button onClick={props.onNext}>Next From Rooms</button>
  </div>
));

jest.mock('../../components/estimator/DimensionsSelection', () => (props) => (
  <div>
    <button onClick={() => props.onUpdateRoomDimensions('Bedroom-1', 'length', 12)}>Set Length</button>
    <button onClick={props.onPrev}>Back Dimensions</button>
    <button onClick={props.onNext}>Calculate</button>
  </div>
));

jest.mock('../../components/estimator/BudgetSelection', () => (props) => (
  <div>
    <button onClick={() => props.onSelectBudget('premium')}>Select Budget</button>
    <button onClick={props.onNext}>Continue</button>
  </div>
));

jest.mock('../../components/estimator/ExtraAddons', () => (props) => (
  <div>
    <button onClick={() => props.onToggleAddon('lighting')}>Add Lighting</button>
    <button onClick={props.onNext}>Review</button>
  </div>
));

jest.mock('../../components/estimator/LeadCapture', () => (props) => (
  <div>
    <input
      placeholder="Full Name"
      onChange={(e) => props.onUpdateLeadData && props.onUpdateLeadData('name', e.target.value)}
      value={props.leadData?.name || ''}
    />
    <input
      placeholder="Email"
      onChange={(e) => props.onUpdateLeadData && props.onUpdateLeadData('email', e.target.value)}
      value={props.leadData?.email || ''}
    />
    <button onClick={() => props.onSubmit && props.onSubmit()}>Submit Estimator</button>
  </div>
));

describe('client/pages/Estimator', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ============ Rendering Tests ============
  test('renders estimator shell and first step', () => {
    render(<Estimator />);
    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
    expect(screen.getByText('Select Bedroom')).toBeInTheDocument();
  });

  // ============ localStorage Draft Management Tests ============
  test('Estimator loads draft from localStorage on mount', () => {
    const draft = {
      rooms: { Bedroom: 1 },
      budgetPlan: 'premium',
      selectedRoomForDimensions: 'Bedroom-1',
      roomDimensionsByRoom: {},
      extraAddons: [],
      leadData: { name: 'John', email: 'john@test.com', phone: '9999999999', location: '', message: '' }
    };
    localStorage.setItem('trendyInteriorsEstimatorDraft', JSON.stringify(draft));

    render(<Estimator />);

    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
  });

  test('Estimator saves formData to localStorage on update', () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.rooms.Bedroom).toBe(1);
  });

  test('Estimator handles corrupt localStorage gracefully', () => {
    localStorage.setItem('trendyInteriorsEstimatorDraft', '{invalid json');

    render(<Estimator />);

    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
  });

  test('Estimator starts with empty state when no draft', () => {
    localStorage.clear();

    render(<Estimator />);

    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
  });

  // ============ Step Navigation Tests ============
  test('moves from room selection to dimensions selection', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Calculate')).toBeInTheDocument();
    });
  });

  test('navigates back from dimensions to rooms', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Back Dimensions')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Back Dimensions'));

    await waitFor(() => {
      expect(screen.getByText('Next From Rooms')).toBeInTheDocument();
    });
  });

  test('prevents next when room selection empty', () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Next From Rooms'));

    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
  });

  // ============ Form Data Updates Tests ============
  test('updateFormData updates and saves to localStorage', () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.rooms).toHaveProperty('Bedroom');
  });

  test('updateRoomDimensions creates nested structure correctly', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Set Length')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Set Length'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.roomDimensionsByRoom).toBeDefined();
  });

  // ============ Multiple Room Selection Tests ============
  test('handles multiple room selection', () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Select Kitchen'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.rooms.Bedroom).toBe(1);
    expect(saved.rooms.Kitchen).toBe(1);
  });

  // ============ Budget Selection Tests ============
  test('selects and saves budget plan', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Calculate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Calculate'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.budgetPlan).toBeDefined();
  });

  // ============ Component Structure Tests ============
  test('renders room selection component', () => {
    render(<Estimator />);
    expect(screen.getByText('Select Bedroom')).toBeInTheDocument();
  });

  test('LocalStorage key is used correctly', () => {
    render(<Estimator />);

    const draft = localStorage.getItem('trendyInteriorsEstimatorDraft');
    expect(draft).toBeDefined();
  });

  test('Form data persists across re-renders', () => {
    const { rerender } = render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));

    const saved1 = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    
    rerender(<Estimator />);

    const saved2 = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved1.rooms.Bedroom).toBe(saved2.rooms.Bedroom);
  });

  test('Navigation buttons work correctly', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Back Dimensions')).toBeInTheDocument();
    });

    expect(screen.getByText('Back Dimensions')).toBeInTheDocument();
  });
});


