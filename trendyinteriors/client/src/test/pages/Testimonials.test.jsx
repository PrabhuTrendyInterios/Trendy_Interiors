import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('axios', () => ({ get: jest.fn() }));
const axios = require('axios');
const Testimonials = require('../../pages/Testimonials').default;

describe('client/pages/Testimonials', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: { success: true, data: [] } });
  });

  test('renders testimonials heading and fallback content', async () => {
    render(
      <MemoryRouter>
        <Testimonials />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /testimonials/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/loved our work/i)).toBeInTheDocument());
  });
});
