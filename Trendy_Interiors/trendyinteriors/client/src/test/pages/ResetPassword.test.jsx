import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
const ResetPassword = require('../../pages/ResetPassword').default;

describe('client/pages/ResetPassword', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockNavigate.mockReset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('shows invalid link when token missing', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/invalid link/i)).toBeInTheDocument();
  });

  test('resets password with token', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Password reset successfully' }) });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=abc']}>
        <Routes>
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'Strong@123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Strong@123' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument());
    act(() => {
      jest.advanceTimersByTime(2100);
    });
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
