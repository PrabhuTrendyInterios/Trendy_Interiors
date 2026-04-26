import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../components/ProjectSlideshow', () => ({ isOpen }) => (isOpen ? <div>Slideshow Open</div> : null));
const Projects = require('../../pages/Projects').default;

describe('client/pages/Projects', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    global.fetch = jest.fn((url) => {
      if (url.includes('/api/categories')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      if (url.includes('/api/projects')) return Promise.resolve({ json: async () => ({ success: true, data: [] }) });
      return Promise.reject(new Error('unexpected'));
    });
  });

  test('renders projects page shell and cta', async () => {
    render(
      <MemoryRouter>
        <Projects />
      </MemoryRouter>
    );

    expect(screen.getByText(/our projects/i)).toBeInTheDocument();
    expect(screen.getByText(/have a project in mind/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /get free consultation/i })).toBeInTheDocument();
  });
});
