import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../components/DesignCarousel', () => () => <div>DesignCarousel Mock</div>);
const About = require('../../pages/About').default;

describe('client/pages/About', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/team-members')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/designs')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      return Promise.reject(new Error('unexpected'));
    });
  });

  test('renders about content', async () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByText(/about us/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('DesignCarousel Mock')).toBeInTheDocument());
  });
});
