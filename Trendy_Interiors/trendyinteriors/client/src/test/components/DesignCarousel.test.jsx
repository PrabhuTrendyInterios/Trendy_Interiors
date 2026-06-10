import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DesignCarousel from '../../components/DesignCarousel';

describe('client/components/DesignCarousel', () => {
  test('returns null when no designs', () => {
    const { container } = render(<DesignCarousel designs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders design and navigates', () => {
    render(
      <DesignCarousel
        designs={[
          { _id: '1', imageUrl: 'a.jpg', title: 'Design A', description: 'A' },
          { _id: '2', imageUrl: 'b.jpg', title: 'Design B', description: 'B' },
        ]}
      />
    );

    expect(screen.getByText('Design A')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/next slide/i));
    expect(screen.getByText('Design B')).toBeInTheDocument();
  });
});
