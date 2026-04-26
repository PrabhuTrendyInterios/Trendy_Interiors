import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const BuyOnline = require('../../pages/BuyOnline').default;

describe('client/pages/BuyOnline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('shows kitchen products and switches category', async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime
    });

    render(
      <MemoryRouter>
        <BuyOnline />
      </MemoryRouter>
    );

    expect(screen.getByText(/buy online/i)).toBeInTheDocument();

    // Resolve first loading
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/premium modular island/i)
    ).toBeInTheDocument();

    // Click category
    await user.click(
      screen.getByRole('button', { name: /interior accessories/i })
    );

    // Resolve second loading
    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(
      screen.getByText(/abstract wall art/i)
    ).toBeInTheDocument();
  });
});
