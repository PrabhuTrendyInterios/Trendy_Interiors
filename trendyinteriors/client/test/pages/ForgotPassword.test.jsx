import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
const ForgotPassword = require('./ForgotPassword').default;

describe('client/pages/ForgotPassword', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockNavigate.mockReset();
  });

  test('sends otp and moves to reset step', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Verified', resetToken: 'token-1' }) });
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'Password reset' }) });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => expect(screen.getByText('OTP sent')).toBeInTheDocument());
  });
});
