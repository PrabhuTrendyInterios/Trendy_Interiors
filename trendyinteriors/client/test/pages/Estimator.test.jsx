import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Estimator from './Estimator';

jest.mock('../components/estimator/RoomSelection', () => (props) => (
  <div>
    <button onClick={() => props.onUpdateRoomCount('Bedroom', 1)}>Select Bedroom</button>
    <button onClick={props.onNext}>Next From Rooms</button>
  </div>
));

jest.mock('../components/estimator/BudgetSelection', () => (props) => (
  <div>
    <button onClick={() => props.onSelectBudget('premium')}>Select Premium</button>
    <button onClick={props.onPrev}>Back Budget</button>
    <button onClick={props.onNext}>Next From Budget</button>
  </div>
));

jest.mock('../components/estimator/DimensionsSelection', () => (props) => (
  <div>
    <button onClick={props.onPrev}>Back Dimensions</button>
    <button onClick={props.onNext}>Calculate</button>
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

  test('moves from room selection to budget selection', async () => {
    render(<Estimator />);

    fireEvent.click(screen.getByText('Select Bedroom'));
    fireEvent.click(screen.getByText('Next From Rooms'));

    await waitFor(() => expect(screen.getByText('Select Premium')).toBeInTheDocument());
  });
});
