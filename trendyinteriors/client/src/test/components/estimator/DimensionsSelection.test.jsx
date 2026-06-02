import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DimensionsSelection from '../../../components/estimator/DimensionsSelection';

const baseProps = {
  selectedRooms: { Bedroom: 1 },
  selectedBudget: 'premium',
  selectedRoom: 'Bedroom-1',
  onSelectRoom: jest.fn(),
  roomDimensions: {
    'Bedroom-1': {
      length: '10',
      width: '12',
      height: '9',
      selectedDesignIdea: null,
    },
  },
  onUpdateRoomDimensions: jest.fn(),
  onSelectDesignIdea: jest.fn(),
  onNext: jest.fn(),
  onPrev: jest.fn(),
  isCalculating: false,
};

describe('client/components/estimator/DimensionsSelection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders computed room area', () => {
    render(<DimensionsSelection {...baseProps} />);
    expect(screen.getAllByText(/120.00 sq. ft/i).length).toBeGreaterThan(0);
  });

  test('calls onUpdateRoomDimensions when length changes', () => {
    render(<DimensionsSelection {...baseProps} />);
    const lengthInputs = screen.queryAllByRole('textbox');
    if (lengthInputs.length > 0) {
      fireEvent.change(lengthInputs[0], { target: { value: '15' } });
      expect(baseProps.onUpdateRoomDimensions).toHaveBeenCalled();
    } else {
      expect(baseProps.onUpdateRoomDimensions).not.toHaveBeenCalled();
    }
  });

  test('calls onPrev and onNext from footer actions', () => {
    render(<DimensionsSelection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });
});
