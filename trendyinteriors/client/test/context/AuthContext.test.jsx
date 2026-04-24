import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const Probe = () => {
  const { user, login, logout, register } = useAuth();

  return (
    <div>
      <span data-testid="user-name">{user?.name || 'none'}</span>
      <button onClick={() => login({ name: 'Asha', role: 'admin' }, 'token-1')}>login</button>
      <button onClick={() => register({ name: 'Raj' }, 'token-2')}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe('client/context/AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('hydrates user from localStorage', async () => {
    localStorage.setItem('user', JSON.stringify({ name: 'Stored User', role: 'user' }));

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    expect(await screen.findByTestId('user-name')).toHaveTextContent('Stored User');
  });

  test('login and logout update localStorage', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('login'));
    expect(localStorage.getItem('token')).toBe('token-1');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Asha');

    fireEvent.click(screen.getByText('logout'));
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user-name')).toHaveTextContent('none');
  });

  test('register stores user and token', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('register'));

    expect(localStorage.getItem('token')).toBe('token-2');
    expect(JSON.parse(localStorage.getItem('user')).name).toBe('Raj');
  });
});
