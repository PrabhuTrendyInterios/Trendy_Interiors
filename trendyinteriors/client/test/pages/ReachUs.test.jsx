import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../components/ContactForm', () => () => <div>ContactForm Mock</div>);
const ReachUs = require('./ReachUs').default;

describe('client/pages/ReachUs', () => {
  test('renders page and contact form', () => {
    render(
      <MemoryRouter>
        <ReachUs />
      </MemoryRouter>
    );

    expect(screen.getByText(/reach us/i)).toBeInTheDocument();
    expect(screen.getByText('ContactForm Mock')).toBeInTheDocument();
  });
});
