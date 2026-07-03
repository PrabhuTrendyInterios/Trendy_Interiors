import React, { useRef } from 'react';
import useScrollScrubbedVideo from '../hooks/useScrollScrubbedVideo';

const ScrollVideoBackground = ({ imageSrc, videoSrc }) => {
  const videoRef = useRef(null);
  const isScrolled = useScrollScrubbedVideo(videoRef);

  return (
    <>
      <div
        className="scroll-video-image"
        style={{
          backgroundImage: `url(${imageSrc})`,
          opacity: isScrolled ? 0 : 1,
        }}
      />
      <video
        ref={videoRef}
        className="scroll-video-media"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        poster={imageSrc}
        style={{ opacity: isScrolled ? 1 : 0, transition: 'opacity 0.6s ease' }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
    </>
  );
};

export default ScrollVideoBackground;
