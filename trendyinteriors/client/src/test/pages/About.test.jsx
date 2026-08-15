import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../components/DesignCarousel', () => () => <div>DesignCarousel Mock</div>);
const About = require('../../pages/About').default;

describe('client/pages/About', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      const okResponse = (data) => Promise.resolve({ ok: true, json: async () => data });
      if (url.includes('/api/team-members')) return okResponse({ success: true, data: [] });
      if (url.includes('/api/designs')) return okResponse({ success: true, data: [] });
      return Promise.reject(new Error('unexpected'));
    });
  });

  test('renders about content', async () => {
    render(
      <MemoryRouter>
        <About />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: /about us/i })).toBeInTheDocument();
    expect(screen.getByText('Client Review')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watch here/i })).toHaveAttribute(
      'href',
      'https://www.youtube.com/@prabul7047',
    );
    await waitFor(() => expect(screen.getByText('DesignCarousel Mock')).toBeInTheDocument());
  });
});
