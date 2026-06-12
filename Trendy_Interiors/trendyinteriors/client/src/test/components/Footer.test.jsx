import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../components/ChatBot', () => () => <div>ChatBot Mock</div>);

const Footer = require('../../components/Footer').default;

describe('client/components/Footer', () => {
  test('renders contact details and chatbot', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /trendyinterios/i })).toBeInTheDocument();
    expect(screen.getByText('ChatBot Mock')).toBeInTheDocument();
  });
});
