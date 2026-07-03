import React, { useEffect, useRef, useState } from 'react';

const ScrollVideoBackground = ({ imageSrc, videoSrc }) => {
  const videoRef = useRef(null);
  const videoAnimationRef = useRef(null);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const getScrollProgress = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) {
        return 0;
      }

      return Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
    };

    const syncScrolledState = (progress) => {
      setIsScrolled((wasScrolled) => {
        if (progress > 0.002 && !wasScrolled) return true;
        if (progress <= 0.002 && wasScrolled) return false;
        return wasScrolled;
      });
    };

    const updateVideoFrame = () => {
      videoAnimationRef.current = null;

      if (!video.duration) {
        return;
      }

      currentProgressRef.current = targetProgressRef.current;
      const nextTime = targetProgressRef.current * video.duration;

      if (Number.isFinite(nextTime) && Math.abs(video.currentTime - nextTime) > 0.006) {
        video.currentTime = nextTime;
      }
    };

    const requestVideoFrame = () => {
      if (!videoAnimationRef.current) {
        videoAnimationRef.current = requestAnimationFrame(updateVideoFrame);
      }
    };

    const handleScroll = () => {
      const progress = getScrollProgress();
      targetProgressRef.current = progress;
      syncScrolledState(progress);
      requestVideoFrame();
    };

    const handleLoadedMetadata = () => {
      const progress = getScrollProgress();
      targetProgressRef.current = progress;
      currentProgressRef.current = progress;
      syncScrolledState(progress);

      if (video.duration) {
        video.currentTime = progress * video.duration;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);

      if (videoAnimationRef.current) {
        cancelAnimationFrame(videoAnimationRef.current);
      }
    };
  }, []);

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
