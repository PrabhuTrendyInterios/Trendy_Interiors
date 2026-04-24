import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomSelection from './RoomSelection';

describe('client/components/estimator/RoomSelection', () => {
  test('disables next when no rooms selected', () => {
    render(<RoomSelection selectedRooms={{}} onUpdateRoomCount={jest.fn()} onNext={jest.fn()} />);

    expect(screen.getByRole('button', { name: /next step/i })).toBeDisabled();
  });

  test('calls onUpdateRoomCount when plus button clicked', () => {
    const onUpdateRoomCount = jest.fn();

    render(<RoomSelection selectedRooms={{ Bedroom: 0 }} onUpdateRoomCount={onUpdateRoomCount} onNext={jest.fn()} />);

    const increaseButtons = screen.getAllByLabelText('Increase quantity');
    fireEvent.click(increaseButtons[0]);

    expect(onUpdateRoomCount).toHaveBeenCalled();
  });

  test('shows selected summary when rooms exist', () => {
    render(<RoomSelection selectedRooms={{ Bedroom: 2 }} onUpdateRoomCount={jest.fn()} onNext={jest.fn()} />);
    expect(screen.getByText(/selected:/i)).toBeInTheDocument();
  });
});
