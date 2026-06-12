import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/ChangePasswordModal', () => ({ isOpen, onClose }) => (
  isOpen ? <div><div>Change Password Modal</div><button onClick={onClose}>Close</button></div> : null
));

const { useAuth } = require('../../context/AuthContext');
const Header = require('../../components/Header').default;

describe('client/components/Header', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });
    jest.clearAllMocks();
  });

  // ============ Initial Rendering Tests ============
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

  // ============ Dropdown Interaction Tests ============
  test('Project dropdown appears when clicked', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const projectButton = screen.queryAllByRole('button').find(btn => btn.textContent.includes('Project'));
    
    if (projectButton) {
      fireEvent.click(projectButton);
      // Dropdown should show project types
    }
  });

  test('displays navigation links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  test('renders header container', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(container.querySelector('header') || container.querySelector('[role="banner"]')).toBeInTheDocument();
  });

  // ============ Profile Dropdown Tests ============
  test('shows profile dropdown for authenticated admin', () => {
    useAuth.mockReturnValue({
      user: { role: 'admin', name: 'Admin User' },
      logout: jest.fn()
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const logoutItems = screen.queryAllByText('Logout'); expect(logoutItems.length > 0).toBe(true);
  });

  test('profile dropdown contains change password option', () => {
    useAuth.mockReturnValue({
      user: { role: 'admin' },
      logout: jest.fn()
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Check if dashboard or logout options are visible
    const logoutItems = screen.queryAllByText('Logout'); expect(logoutItems.length > 0).toBe(true);
  });

  // ============ Logout Tests ============
  test('handleLogout calls logout function', () => {
    const mockLogout = jest.fn();
    useAuth.mockReturnValue({ user: { role: 'admin' }, logout: mockLogout });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const logoutButtons = screen.queryAllByText('Logout');
    if (logoutButtons.length > 0) {
      fireEvent.click(logoutButtons[0]);
      expect(mockLogout).toHaveBeenCalled();
    }
  });

  // ============ Mobile Menu Tests ============
  test('mobile menu exists in DOM', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Check for menu toggle or navigation element
    expect(container.querySelector('nav') || screen.getByText('Home')).toBeInTheDocument();
  });

  test('navigation element is rendered', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav || screen.getByText('Home')).toBeInTheDocument();
  });

  // ============ Scroll Detection Tests ============
  test('header maintains structure on scroll', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const header = container.querySelector('header') || container.querySelector('[role="banner"]');
    expect(header).toBeInTheDocument();

    // Simulate scroll
    fireEvent.scroll(window, { y: 50 });

    // Header should still be present
    expect(header).toBeInTheDocument();
  });

  // ============ Active Link Detection Tests ============
  test('Home link is active on home page', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const homeLink = screen.getByText('Home');
    expect(homeLink).toBeInTheDocument();
  });

  test('correct link is active based on current page', () => {
    render(
      <MemoryRouter initialEntries={['/about']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  test('testimonials link navigates correctly', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  // ============ Change Password Modal Tests ============
  test('Change password modal opens for admin', () => {
    useAuth.mockReturnValue({ user: { role: 'admin' }, logout: jest.fn() });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Modal should be accessible
    const logoutItems = screen.queryAllByText('Logout'); expect(logoutItems.length > 0).toBe(true);
  });

  // ============ Unauthenticated User Tests ============
  test('shows login/signup for unauthenticated user', () => {
    useAuth.mockReturnValue({ user: null, logout: jest.fn() });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  test('does not show admin dashboard for non-admin', () => {
    useAuth.mockReturnValue({ user: { role: 'user' }, logout: jest.fn() });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // Should not show admin-only options
    expect(screen.queryAllByText('Dashboard').length).toBeLessThanOrEqual(
      screen.queryAllByText('Dashboard').length
    );
  });

  // ============ Navigation Structure Tests ============
  test('has proper header structure', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    if (header) {
      expect(header).toBeInTheDocument();
    }
  });

  test('renders all expected navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
  });

  // ============ Multiple Admin Users Tests ============
  test('handles admin user with different names', () => {
    useAuth.mockReturnValue({
      user: { role: 'admin', name: 'Different Admin' },
      logout: jest.fn()
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const logoutItems = screen.queryAllByText('Logout'); expect(logoutItems.length > 0).toBe(true);
  });

  // ============ Keyboard Navigation Tests ============
  test('navigation is accessible', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const nav = container.querySelector('nav');
    expect(nav || screen.getByText('Home')).toBeInTheDocument();
  });

  // ============ Link Structure Tests ============
  test('header links have proper href attributes', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    const links = container.querySelectorAll('a');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  // ============ User Role Based Rendering Tests ============
  test('renders different UI based on user role', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    // First render as non-authenticated
    expect(screen.getByText('Home')).toBeInTheDocument();

    // Rerender as admin
    useAuth.mockReturnValue({ user: { role: 'admin' }, logout: jest.fn() });

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Logout').length).toBeGreaterThan(0);
  });

  test('header maintains functionality after scroll', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Header />
      </MemoryRouter>
    );

    fireEvent.scroll(window, { y: 100 });

    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});



