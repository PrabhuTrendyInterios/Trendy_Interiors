import React from 'react';
import { render } from '@testing-library/react';
import ScrollVideoBackground from '../../components/ScrollVideoBackground';

describe('ScrollVideoBackground', () => {
  it('renders a mobile-safe background video element', () => {
    const { container } = render(
      <ScrollVideoBackground imageSrc="/images/test.png" videoSrc="/video/test.mp4" />
    );

    const video = container.querySelector('.scroll-video-media');

    expect(video).toBeInTheDocument();
    expect(video).not.toHaveAttribute('autoplay');
    expect(video).toHaveProperty('muted', true);
    expect(video).not.toHaveAttribute('loop');
    expect(video).toHaveProperty('playsInline', true);
    expect(video).toHaveAttribute('preload', 'auto');
    expect(video).toHaveAttribute('aria-hidden', 'true');
  });
});
