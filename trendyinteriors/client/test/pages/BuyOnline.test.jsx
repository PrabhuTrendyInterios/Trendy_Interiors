import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const BuyOnline = require('./BuyOnline').default;

describe('client/pages/BuyOnline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows kitchen products and switches category', async () => {
    render(
      <MemoryRouter>
        <BuyOnline />
      </MemoryRouter>
    );

    expect(screen.getByText(/buy online/i)).toBeInTheDocument();
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByText(/premium modular island/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /interior accessories/i }));
    await act(async () => {
      jest.advanceTimersByTime(450);
    });
    await waitFor(() => expect(screen.getByText(/abstract wall art/i)).toBeInTheDocument());
  });
});
