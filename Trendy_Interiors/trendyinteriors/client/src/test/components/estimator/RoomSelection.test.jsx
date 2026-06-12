import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RoomSelection from '../../../components/estimator/RoomSelection';

const sampleRooms = [
  {
    _id: '1',
    id: 'bedroom',
    name: 'Bedroom',
    image: 'https://example.com/bedroom.jpg',
  },
];

describe('client/components/estimator/RoomSelection', () => {
  test('disables next when no rooms selected', () => {
    render(
      <RoomSelection rooms={sampleRooms} selectedRooms={{}} onUpdateRoomCount={jest.fn()} onNext={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  test('calls onUpdateRoomCount when plus button clicked', () => {
    const onUpdateRoomCount = jest.fn();

    render(
      <RoomSelection
        rooms={sampleRooms}
        selectedRooms={{ Bedroom: 0 }}
        onUpdateRoomCount={onUpdateRoomCount}
        onNext={jest.fn()}
      />
    );

    const increaseButtons = screen.getAllByLabelText('Increase quantity');
    fireEvent.click(increaseButtons[0]);

    expect(onUpdateRoomCount).toHaveBeenCalled();
  });

  test('shows selected summary when rooms exist', () => {
    render(
      <RoomSelection
        rooms={sampleRooms}
        selectedRooms={{ Bedroom: 2 }}
        onUpdateRoomCount={jest.fn()}
        onNext={jest.fn()}
      />
    );
    expect(screen.getByText(/selected:/i)).toBeInTheDocument();
  });
});
