import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const { useAuth } = require('../../context/AuthContext');
const Login = require('../../pages/Login').default;

describe('client/pages/Login', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ login: jest.fn() });
    global.fetch = jest.fn();
    mockNavigate.mockReset();
  });

  test('rejects non-admin users', async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ user: { role: 'user' }, token: 't' }) });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'user@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Pass@123' } });
    fireEvent.click(screen.getByRole('button', { name: /login to dashboard/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
