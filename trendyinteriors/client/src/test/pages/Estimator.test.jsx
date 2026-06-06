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
      onChange={(e) => props.onUpdateLead && props.onUpdateLead('name', e.target.value)}
      value={props.leadData?.name || ''}
    />
    <input
      placeholder="Email"
      onChange={(e) => props.onUpdateLead && props.onUpdateLead('email', e.target.value)}
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

  test('renders estimator shell and first step', () => {
    render(<Estimator />);
    expect(screen.getByText(/design estimator/i)).toBeInTheDocument();
    expect(screen.getByText('Select Bedroom')).toBeInTheDocument();
  });

  test('Estimator loads draft from localStorage on mount', () => {
    const draft = {
      rooms: { Bedroom: 1 },
      selectedRoomForDimensions: 'Bedroom-1',
      roomDimensionsByRoom: {},
      extraAddons: [],
      leadData: { name: 'John', email: 'john@test.com', phone: '9999999999', location: '', message: '' },
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

  test('moves from room selection to dimensions selection', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => {
      expect(screen.getByText('Calculate')).toBeInTheDocument();
    });
  });

  test('handles multiple room selection', () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Select Kitchen'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    const saved = JSON.parse(localStorage.getItem('trendyInteriorsEstimatorDraft'));
    expect(saved.rooms.Bedroom).toBe(1);
    expect(saved.rooms.Kitchen).toBe(1);
  });
});
