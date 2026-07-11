import { useEffect, useRef, useState } from 'react';

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);
const MIN_SCRUB_VIEWPORTS = 1.6;

const getScrollProgress = () => {
  const viewportHeight = window.innerHeight || 1;
  const maxScroll = document.documentElement.scrollHeight - viewportHeight;

  if (maxScroll <= 0) {
    return 0;
  }

  const scrubDistance = Math.max(maxScroll, viewportHeight * MIN_SCRUB_VIEWPORTS);
  return clamp01(window.scrollY / scrubDistance);
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
  const pendingSeekProgressRef = useRef(null);
  const lastSeekAtRef = useRef(0);
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

    const getMinSeekInterval = () => (window.innerWidth <= 768 ? 48 : 34);

    const pauseIfPlaying = () => {
      if (!video.paused) {
        video.pause();
      }
    };

    const setVideoTime = (progress, immediate = false) => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return false;

      const nextTime = progress * video.duration;
      const timeDiff = Math.abs(video.currentTime - nextTime);

      if (!Number.isFinite(nextTime)) {
        return false;
      }

      if (!immediate && video.seeking) {
        pendingSeekProgressRef.current = progress;
        return false;
      }

      const now = performance.now();
      if (!immediate && now - lastSeekAtRef.current < getMinSeekInterval()) {
        pendingSeekProgressRef.current = progress;
        return false;
      }

      if (immediate || timeDiff > 0.016) {
        video.currentTime = nextTime;
        lastSeekAtRef.current = now;
      }

      pendingSeekProgressRef.current = null;
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
        if (setVideoTime(target)) {
          renderedProgressRef.current = target;
        } else {
          animationRef.current = requestAnimationFrame(scrubFrame);
        }
        return;
      }

      const nextProgress = clamp01(current + distance * getEaseFactor(absDistance));
      const didSeek = setVideoTime(nextProgress);

      if (didSeek) {
        renderedProgressRef.current = nextProgress;
      }

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
      pauseIfPlaying();
      setVideoTime(progress, true);
    };

    const handleSeeked = () => {
      if (pendingSeekProgressRef.current !== null) {
        requestScrub();
      }
    };

    pauseIfPlaying();
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    window.addEventListener('scroll', syncTargetFromScroll, { passive: true });
    window.addEventListener('resize', syncTargetFromScroll);
    document.addEventListener('visibilitychange', syncTargetFromScroll);

    handleLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('scroll', syncTargetFromScroll);
      window.removeEventListener('resize', syncTargetFromScroll);
      document.removeEventListener('visibilitychange', syncTargetFromScroll);
      stopAnimation();
    };
  }, [videoRef]);

  return isScrolled;
};

export default useScrollScrubbedVideo;
