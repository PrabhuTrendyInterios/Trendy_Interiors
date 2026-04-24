import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../components/ContactForm', () => () => <div>ContactForm Mock</div>);
const GiveTestimonial = require('./GiveTestimonial').default;

describe('client/pages/GiveTestimonial', () => {
  test('renders page and testimonial form', () => {
    render(
      <MemoryRouter>
        <GiveTestimonial />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /give testimonial/i })).toBeInTheDocument();
    expect(screen.getByText('ContactForm Mock')).toBeInTheDocument();
  });
});
