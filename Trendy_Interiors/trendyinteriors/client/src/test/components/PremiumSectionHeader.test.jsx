import React from 'react';
import { render, screen } from '@testing-library/react';
import PremiumSectionHeader from '../../components/PremiumSectionHeader';

describe('client/components/PremiumSectionHeader', () => {
  test('renders title and subtitle', () => {
    render(<PremiumSectionHeader sectionName="PORTFOLIO" title="Latest Projects" subtitle="Explore more" />);

    expect(screen.getByText('PORTFOLIO')).toBeInTheDocument();
    expect(screen.getByText('Latest Projects')).toBeInTheDocument();
    expect(screen.getByText('Explore more')).toBeInTheDocument();
  });

  test('supports left alignment without decorative line', () => {
    const { container } = render(
      <PremiumSectionHeader title="Heading" alignment="left" showDecorativeLine={false} />
    );

    expect(container.querySelector('.premium-section-header-left')).toBeInTheDocument();
  });
});
