import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { validatePassword, getPasswordStrengthMessage } from '../../utils/passwordValidation';

jest.mock('../../utils/passwordValidation', () => ({
  validatePassword: jest.fn(() => ({ isValid: true, errors: {} })),
  getPasswordStrengthMessage: jest.fn(() => 'Use a strong password')
}));

describe('client/components/ChangePasswordModal', () => {
  beforeEach(() => {
    validatePassword.mockReturnValue({ isValid: true, errors: {} });
    getPasswordStrengthMessage.mockReturnValue('Use a strong password');
    localStorage.setItem('token', 'mock-token');
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('does not render when closed', () => {
    const { container } = render(
      <ChangePasswordModal isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('requests OTP and moves to verify step on success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(<ChangePasswordModal isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole('button', { name: /verify otp/i })).toBeInTheDocument();
  });

  test('shows validation when OTP is incomplete', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(<ChangePasswordModal isOpen={true} onClose={jest.fn()} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await screen.findByText(/one-time password/i);

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    expect(screen.getByText(/please enter a valid 6-digit otp/i)).toBeInTheDocument();
  });

  test('changes password successfully and calls success handlers', async () => {
    jest.useFakeTimers();

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OTP sent' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password changed' })
      });

    render(<ChangePasswordModal isOpen={true} onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));
    await screen.findByText(/one-time password/i);

    const otpInputs = screen.getAllByRole('textbox');
    otpInputs.forEach((input, index) => {
      fireEvent.change(input, { target: { value: `${index + 1}` } });
    });

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));
    await screen.findByLabelText(/^new password$/i);

    fireEvent.change(screen.getByLabelText(/^new password$/i), {
      target: { value: 'Valid@123' }
    });
    fireEvent.change(screen.getByLabelText(/^confirm new password$/i), {
      target: { value: 'Valid@123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByText(/password changed successfully/i)).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
});