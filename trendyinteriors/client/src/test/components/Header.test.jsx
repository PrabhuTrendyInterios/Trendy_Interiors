import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/ChangePasswordModal', () => ({ isOpen }) => (isOpen ? <div>Change Password Modal</div> : null));

const { useAuth } = require('../../context/AuthContext');
const Header = require('../../components/Header').default;

describe('client/components/Header', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });
  });

  test('renders primary navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  test('shows admin actions for admin user', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, logout: jest.fn() });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Logout').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });
});
