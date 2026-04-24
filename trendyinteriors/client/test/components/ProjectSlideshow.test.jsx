import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProjectSlideshow from './ProjectSlideshow';

describe('client/components/ProjectSlideshow', () => {
  test('returns null when closed', () => {
    const { container } = render(<ProjectSlideshow isOpen={false} project={null} onClose={jest.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders project and image navigation', () => {
    const onClose = jest.fn();
    render(
      <ProjectSlideshow
        isOpen={true}
        project={{ title: 'Villa', description: 'Erode', images: ['a.jpg', 'b.jpg'] }}
        onClose={onClose}
      />
    );

    expect(screen.getByText('Villa')).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/next image/i));
    expect(screen.getByText(/2 \/ 2/i)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/close slideshow/i));
    expect(onClose).toHaveBeenCalled();
  });
});
