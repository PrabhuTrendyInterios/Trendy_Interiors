import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/Carousel', () => () => <div>Carousel Mock</div>);
jest.mock('../../components/PremiumSectionHeader', () => ({ title }) => <div>{title}</div>);
const { useAuth } = require('../../context/AuthContext');
const Home = require('../../pages/Home').default;

describe('client/pages/Home', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: null });
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/projects')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/testimonials')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/services')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      return Promise.reject(new Error('unexpected'));
    });
  });

  test('renders hero and key sections', async () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText(/filling the heart, not just space/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('What We Do Best')).toBeInTheDocument());
  });
});
