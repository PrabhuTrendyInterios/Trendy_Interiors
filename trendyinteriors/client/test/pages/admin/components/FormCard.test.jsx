import React from 'react';
import { render, screen } from '@testing-library/react';
import FormCard from './FormCard';

describe('client/pages/admin/components/FormCard', () => {
  test('renders title, icon and children content', () => {
    render(
      <FormCard title="Details" icon={<span>ICON</span>}>
        <p>Body content</p>
      </FormCard>
    );

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('ICON')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('applies custom className to root element', () => {
    const { container } = render(
      <FormCard title="Details" className="custom-card">
        <p>Body content</p>
      </FormCard>
    );

    expect(container.querySelector('.form-card.custom-card')).toBeInTheDocument();
  });
});
