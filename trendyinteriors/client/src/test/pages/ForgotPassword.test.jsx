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
  });

  test('renders forgotten password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );

    expect(screen.getByText(/reset admin password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });
});
