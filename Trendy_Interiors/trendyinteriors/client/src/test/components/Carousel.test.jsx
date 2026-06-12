import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Carousel from '../../components/Carousel';

describe('client/components/Carousel', () => {
  test('shows no slides state when empty', () => {
    render(<Carousel slides={[]} autoPlay={false} />);
    expect(screen.getByText(/no slides available/i)).toBeInTheDocument();
  });

  test('renders current slide and navigates', () => {
    render(
      <Carousel
        slides={[
          { image: 'a.jpg', title: 'Slide A', description: 'Desc A' },
          { image: 'b.jpg', title: 'Slide B', description: 'Desc B' },
        ]}
        autoPlay={false}
      />
    );

    expect(screen.getByText('Slide A')).toBeInTheDocument();
    const nextButton = document.querySelector('.carousel-button.next');
    fireEvent.click(nextButton);
    expect(screen.getByText('Slide B')).toBeInTheDocument();
  });
});
