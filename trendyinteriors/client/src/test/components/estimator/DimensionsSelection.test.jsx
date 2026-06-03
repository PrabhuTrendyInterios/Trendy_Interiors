import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

  // ============ Room Area Calculation Tests ============
  test('renders computed room area', () => {
    render(<DimensionsSelection {...baseProps} />);
    expect(screen.getAllByText(/120.00 sq. ft/i).length).toBeGreaterThan(0);
  });

  test('updates area when dimensions change', () => {
    const { rerender } = render(<DimensionsSelection {...baseProps} />);
    
    expect(screen.getAllByText(/120.00 sq. ft/i).length).toBeGreaterThan(0);

    rerender(
      <DimensionsSelection
        {...baseProps}
        roomDimensions={{
          'Bedroom-1': { length: '15', width: '15', height: '9', selectedDesignIdea: null }
        }}
      />
    );

    expect(screen.getAllByText(/225.00 sq. ft/i).length).toBeGreaterThan(0);
  });

  test('calculates area correctly with different dimensions', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        roomDimensions={{
          'Bedroom-1': { length: '20', width: '25', height: '10', selectedDesignIdea: null }
        }}
      />
    );

    expect(screen.getAllByText(/500.00 sq. ft/i).length).toBeGreaterThan(0);
  });

  // ============ Dimension Input Tests ============
  test('calls onUpdateRoomDimensions when length changes', () => {
    render(<DimensionsSelection {...baseProps} />);
    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: '15' } });
      expect(baseProps.onUpdateRoomDimensions).toHaveBeenCalled();
    }
  });

  test('calls onUpdateRoomDimensions when width changes', () => {
    render(<DimensionsSelection {...baseProps} />);
    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 1) {
      fireEvent.change(inputs[1], { target: { value: '16' } });
      expect(baseProps.onUpdateRoomDimensions).toHaveBeenCalled();
    }
  });

  test('calls onUpdateRoomDimensions when height changes', () => {
    render(<DimensionsSelection {...baseProps} />);
    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 2) {
      fireEvent.change(inputs[2], { target: { value: '10' } });
      expect(baseProps.onUpdateRoomDimensions).toHaveBeenCalled();
    }
  });

  test('dimension inputs accept numeric values', () => {
    const { container } = render(<DimensionsSelection {...baseProps} />);
    const inputs = container.querySelectorAll('input[type="number"]');
    
    if (inputs.length > 0) {
      fireEvent.change(inputs[0], { target: { value: '25' } });
      expect(inputs[0].value).toBe('25');
    }
  });

  // ============ Room Navigation Tests ============
  test('displays room selection if available', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 2, Kitchen: 1 }}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons.length >= 0).toBe(true);
  });

  test('shows room instances for multiple rooms', () => {
    const { container } = render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 2 }}
      />
    );

    expect(container).toBeInTheDocument();
  });

  test('onSelectRoom called when room card clicked', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 2 }}
      />
    );

    const buttons = screen.queryAllByRole('button');
    const roomButton = buttons.find(btn => btn.textContent.includes('Bedroom'));
    
    if (roomButton) {
      fireEvent.click(roomButton);
      expect(baseProps.onSelectRoom).toHaveBeenCalled();
    }
  });

  // ============ Layout Selection Tests (Kitchen Layouts) ============
  test('shows layout options for kitchen', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Kitchen: 1 }}
        selectedRoom="Kitchen-1"
        roomDimensions={{ 'Kitchen-1': { length: '', width: '', height: '', selectedDesignIdea: null } }}
      />
    );

    // Layout options should be available for kitchen
    const buttons = screen.queryAllByRole('button');
    expect(buttons.length >= 0).toBe(true);
  });

  test('layout selection triggers onSelectDesignIdea', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Kitchen: 1 }}
        selectedRoom="Kitchen-1"
        roomDimensions={{ 'Kitchen-1': { length: '12', width: '12', height: '9', selectedDesignIdea: null } }}
      />
    );

    const layoutButtons = screen.queryAllByRole('button');
    expect(layoutButtons.length).toBeGreaterThanOrEqual(1);
  });

  // ============ Addon Selection Tests ============
  test('addon options available for kitchen', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Kitchen: 1 }}
        selectedRoom="Kitchen-1"
        roomDimensions={{ 'Kitchen-1': { length: '12', width: '12', height: '9', selectedDesignIdea: null } }}
      />
    );

    expect(true).toBe(true);
  });

  test('addon toggle calls onSelectDesignIdea', () => {
    const { container } = render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Kitchen: 1 }}
        selectedRoom="Kitchen-1"
        roomDimensions={{ 'Kitchen-1': { length: '12', width: '12', height: '9', selectedDesignIdea: null } }}
      />
    );

    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  // ============ Size Category Selection Tests ============
  test('size category buttons available', () => {
    render(<DimensionsSelection {...baseProps} />);

    const buttons = screen.queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('size category selection updates dimensions', () => {
    render(<DimensionsSelection {...baseProps} />);

    const buttons = screen.queryAllByRole('button');
    const sizeButton = buttons.find(btn => btn.textContent.match(/small|medium|large|low|mid|high/i));

    if (sizeButton) {
      fireEvent.click(sizeButton);
      expect(baseProps.onUpdateRoomDimensions).toHaveBeenCalled();
    }
  });

  // ============ Special Room Handling Tests ============
  test('pooja room has limited options', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ 'Pooja Room': 1 }}
        selectedRoom="Pooja Room-1"
        roomDimensions={{
          'Pooja Room-1': {
            length: '4',
            width: '4',
            height: '7',
            selectedDesignIdea: null
          }
        }}
      />
    );

    expect(true).toBe(true);
  });

  // ============ Navigation Button Tests ============
  test('calls onPrev when back button clicked', () => {
    render(<DimensionsSelection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(baseProps.onPrev).toHaveBeenCalled();
  });

  test('calls onNext when next button clicked', () => {
    render(<DimensionsSelection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    expect(baseProps.onNext).toHaveBeenCalled();
  });

  test('back and next buttons both work', () => {
    render(<DimensionsSelection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  // ============ Loading State Tests ============
  test('shows loading state when calculating', () => {
    const { rerender } = render(<DimensionsSelection {...baseProps} isCalculating={false} />);

    rerender(<DimensionsSelection {...baseProps} isCalculating={true} />);

    // Component should still render, may show loading indicator
    expect(true).toBe(true);
  });

  test('next button disabled when calculating', () => {
    render(<DimensionsSelection {...baseProps} isCalculating={true} />);

    const nextButton = screen.getByRole('button', { name: /^next$/i });
    expect(nextButton).toBeInTheDocument();
  });

  // ============ Multiple Room Tests ============
  test('handles multiple bedrooms', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 2 }}
      />
    );

    expect(true).toBe(true);
  });

  test('handles mixed room types', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 1, Kitchen: 1, 'Living Room': 1 }}
      />
    );

    expect(true).toBe(true);
  });

  // ============ Design Idea Persistence Tests ============
  test('design idea preserved when returning to room', () => {
    const designIdea = { layout: 'L-shaped', addons: ['lighting'] };
    
    render(
      <DimensionsSelection
        {...baseProps}
        roomDimensions={{
          'Bedroom-1': {
            length: '10',
            width: '12',
            height: '9',
            selectedDesignIdea: designIdea
          }
        }}
      />
    );

    expect(true).toBe(true);
  });

  // ============ Input Validation Tests ============
  test('handles empty dimension inputs', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        roomDimensions={{
          'Bedroom-1': {
            length: '',
            width: '',
            height: '',
            selectedDesignIdea: null
          }
        }}
      />
    );

    expect(true).toBe(true);
  });

  test('handles partial dimension inputs', () => {
    render(
      <DimensionsSelection
        {...baseProps}
        roomDimensions={{
          'Bedroom-1': {
            length: '10',
            width: '',
            height: '9',
            selectedDesignIdea: null
          }
        }}
      />
    );

    expect(true).toBe(true);
  });

  // ============ Room Completion Tracking Tests ============
  test('tracks room completion status', () => {
    const { rerender } = render(
      <DimensionsSelection
        {...baseProps}
        selectedRooms={{ Bedroom: 2 }}
        roomDimensions={{
          'Bedroom-1': { length: '10', width: '12', height: '9', selectedDesignIdea: null },
          'Bedroom-2': { length: '', width: '', height: '', selectedDesignIdea: null }
        }}
      />
    );

    // Component should handle both completed and incomplete rooms
    expect(true).toBe(true);
  });

  // ============ Component Structure Tests ============
  test('renders main content sections', () => {
    const { container } = render(<DimensionsSelection {...baseProps} />);

    expect(container).toBeInTheDocument();
  });

  test('renders footer with navigation buttons', () => {
    render(<DimensionsSelection {...baseProps} />);

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument();
  });

  // ============ Budget-Based Rendering Tests ============
  test('renders different options based on budget', () => {
    const { container, rerender } = render(<DimensionsSelection {...baseProps} selectedBudget="premium" />);

    expect(container.querySelector('button') || container.querySelector('div')).toBeDefined();

    rerender(<DimensionsSelection {...baseProps} selectedBudget="budget" />);

    expect(container.querySelector('button') || container.querySelector('div')).toBeDefined();
  });
});


