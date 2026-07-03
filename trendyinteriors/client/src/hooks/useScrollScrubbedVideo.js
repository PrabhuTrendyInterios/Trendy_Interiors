import { useEffect, useRef, useState } from 'react';

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

const getScrollProgress = () => {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  if (maxScroll <= 0) {
    return 0;
  }

  return clamp01(window.scrollY / maxScroll);
};

const getEaseFactor = (distance) => {
  if (distance > 0.35) return 0.46;
  if (distance > 0.18) return 0.32;
  if (distance > 0.08) return 0.22;
  return 0.14;
};

const useScrollScrubbedVideo = (videoRef) => {
  const animationRef = useRef(null);
  const targetProgressRef = useRef(0);
  const renderedProgressRef = useRef(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const syncScrolledState = (progress) => {
      setIsScrolled((wasScrolled) => {
        if (progress > 0.002 && !wasScrolled) return true;
        if (progress <= 0.002 && wasScrolled) return false;
        return wasScrolled;
      });
    };

    const setVideoTime = (progress, immediate = false) => {
      if (!video.duration) return false;

      const nextTime = progress * video.duration;
      const timeDiff = Math.abs(video.currentTime - nextTime);

      if (Number.isFinite(nextTime) && (immediate || timeDiff > 0.004)) {
        video.currentTime = nextTime;
      }

      return true;
    };

    const stopAnimation = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const scrubFrame = () => {
      animationRef.current = null;

      if (!video.duration) {
        return;
      }

      const target = targetProgressRef.current;
      const current = renderedProgressRef.current;
      const distance = target - current;
      const absDistance = Math.abs(distance);

      if (absDistance < 0.0007) {
        renderedProgressRef.current = target;
        setVideoTime(target);
        return;
      }

      const nextProgress = clamp01(current + distance * getEaseFactor(absDistance));
      renderedProgressRef.current = nextProgress;
      setVideoTime(nextProgress);

      animationRef.current = requestAnimationFrame(scrubFrame);
    };

    const requestScrub = () => {
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(scrubFrame);
      }
    };

    const syncTargetFromScroll = () => {
      const progress = getScrollProgress();
      targetProgressRef.current = progress;
      syncScrolledState(progress);

      if (document.hidden) {
        renderedProgressRef.current = progress;
        setVideoTime(progress, true);
        stopAnimation();
        return;
      }

      requestScrub();
    };

    const handleLoadedMetadata = () => {
      const progress = getScrollProgress();
      targetProgressRef.current = progress;
      renderedProgressRef.current = progress;
      syncScrolledState(progress);
      video.pause();
      setVideoTime(progress, true);
    };

    video.pause();
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    window.addEventListener('scroll', syncTargetFromScroll, { passive: true });
    window.addEventListener('resize', syncTargetFromScroll);
    document.addEventListener('visibilitychange', syncTargetFromScroll);

    handleLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      window.removeEventListener('scroll', syncTargetFromScroll);
      window.removeEventListener('resize', syncTargetFromScroll);
      document.removeEventListener('visibilitychange', syncTargetFromScroll);
      stopAnimation();
    };
  }, [videoRef]);

  return isScrolled;
};

export default useScrollScrubbedVideo;
