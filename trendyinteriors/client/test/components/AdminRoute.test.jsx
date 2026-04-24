import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('../context/AuthContext');
const AdminRoute = require('./AdminRoute').default;

const renderWithRouter = (initialPath = '/admin') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<div>Admin Area</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('client/components/AdminRoute', () => {
  test('shows loading while auth context is loading', () => {
    useAuth.mockReturnValue({ loading: true, user: null });
    renderWithRouter();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test('redirects non-admin user to login', () => {
    useAuth.mockReturnValue({ loading: false, user: { role: 'user' } });
    renderWithRouter();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('renders outlet for admin user', () => {
    useAuth.mockReturnValue({ loading: false, user: { role: 'admin' } });
    renderWithRouter();
    expect(screen.getByText('Admin Area')).toBeInTheDocument();
  });
});
