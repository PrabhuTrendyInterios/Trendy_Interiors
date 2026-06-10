import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));
const ForgotPassword = require('../../pages/ForgotPassword').default;

describe('client/pages/ForgotPassword', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockNavigate.mockReset();
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============ Initial Rendering Tests ============
  test('renders forgotten password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByText(/reset admin password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  test('displays admin email in message', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByText(/trendyadmin123@gmail.com/i)).toBeInTheDocument();
  });

  test('shows send otp button', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  test('renders back to login link', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    const links = screen.queryAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });

  test('renders auth container', () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(container.querySelector('.auth-container')).toBeInTheDocument();
  });

  test('renders auth card', () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(container.querySelector('.auth-card')).toBeInTheDocument();
  });

  test('renders auth form', () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    expect(container.querySelector('.auth-form')).toBeInTheDocument();
  });

  // ============ Send OTP Tests ============
  test('handleSendOTP sends request and shows success message', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent successfully' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const sendButton = screen.getByRole('button', { name: /send otp/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/otp sent successfully/i)).toBeInTheDocument();
    });
  });

  test('handleSendOTP shows error on API failure', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Email not found' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/email not found/i)).toBeInTheDocument();
    });
  });

  test('handleSendOTP handles network error', async () => {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network failed'));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/network failed/i)).toBeInTheDocument();
    });
  });

  test('handleSendOTP disables button while loading', async () => {
    global.fetch = jest.fn(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    const btn = screen.getByRole('button', { name: /send otp/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(btn).toBeDisabled();
    });
  });

  // ============ OTP Verification Tests ============
  test('handleVerifyOTP succeeds with valid OTP', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OTP verified', resetToken: 'token-123' })
      });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < Math.min(6, otpInputs.length); i++) {
      fireEvent.change(otpInputs[i], { target: { value: String(i) } });
    }

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('handleVerifyOTP validates OTP length', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid 6-digit otp/i)).toBeInTheDocument();
    });
  });

  test('handleVerifyOTP handles API error', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'OTP expired' })
      });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < Math.min(6, otpInputs.length); i++) {
      fireEvent.change(otpInputs[i], { target: { value: String(i) } });
    }

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/otp expired/i)).toBeInTheDocument();
    });
  });

  // ============ OTP Input Handling Tests ============
  test('handleOtpChange updates digit', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const firstInput = document.getElementById('forgot-otp-0');
    if (firstInput) {
      fireEvent.change(firstInput, { target: { value: '1' } });
      expect(firstInput.value).toBe('1');
    }
  });

  test('handleOtpChange filters non-numeric input', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const input = document.getElementById('forgot-otp-0');
    if (input) {
      fireEvent.change(input, { target: { value: 'abc123' } });
      expect(input.value).toMatch(/^\d?$/);
    }
  });

  // ============ Reset Password Tests ============
  test('handleResetPassword validates password mismatch', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OTP verified', resetToken: 'token-123' })
      });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < Math.min(6, otpInputs.length); i++) {
      fireEvent.change(otpInputs[i], { target: { value: String(i) } });
    }

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword' } });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  test('handleResetPassword validates minimum length', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OTP verified', resetToken: 'token-123' })
      });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < Math.min(6, otpInputs.length); i++) {
      fireEvent.change(otpInputs[i], { target: { value: String(i) } });
    }

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.change(confirmInput, { target: { value: '12345' } });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  test('handleResetPassword succeeds and shows success message', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'OTP sent' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'OTP verified', resetToken: 'token-123' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Password reset successfully' })
      });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const otpInputs = screen.getAllByDisplayValue('');
    for (let i = 0; i < Math.min(6, otpInputs.length); i++) {
      fireEvent.change(otpInputs[i], { target: { value: String(i) } });
    }

    fireEvent.click(screen.getByRole('button', { name: /verify otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);

    fireEvent.change(passwordInput, { target: { value: 'NewPassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'NewPassword123' } });

    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password reset successfully/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('send otp again button resets OTP state', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verify otp/i })).toBeInTheDocument();
    });

    const resendButton = screen.getByRole('button', { name: /send otp again/i });
    fireEvent.click(resendButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
    });
  });

  test('displays subtitle based on step', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'OTP sent' })
    });

    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/send otp to your admin email/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /send otp/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter otp sent to admin email/i)).toBeInTheDocument();
    });
  });
});


