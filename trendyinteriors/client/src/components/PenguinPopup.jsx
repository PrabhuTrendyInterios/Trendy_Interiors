import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaArrowRight, FaTimes } from "react-icons/fa";
import "./PenguinPopup.css";

export const DEFAULT_TRENDY_BOT_ASSETS = {
  mobilePeek: "/assets/trendy-bot/trendy-bot-peek-mobile.webp",
  desktopPeek: "/assets/trendy-bot/trendy-bot-peek-desktop.webp",
  present: "/assets/trendy-bot/trendy-bot-present.webp",
  wave: "/assets/trendy-bot/trendy-bot-wave.webp",
};

const EASE_OUT = [0.22, 1, 0.36, 1];
const PHASE = {
  HIDDEN: "hidden",
  PEEK: "peek",
  PRESENTING: "presenting",
  VISIBLE: "visible",
  CARD_EXIT: "card-exit",
  WAVE: "wave",
  LEAVING: "leaving",
};

const getStorage = (storageType) => {
  if (typeof window === "undefined" || storageType === "none") return null;

  try {
    return storageType === "local" ? window.localStorage : window.sessionStorage;
  } catch (_error) {
    return null;
  }
};

const useMobileBreakpoint = (breakpoint) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, [breakpoint]);

  return isMobile;
};

const PenguinPopup = ({
  title,
  description,
  actionLabel,
  onAction,
  onClose,
  onAutoClose,
  icon,
  informationRows = [],
  secondaryActions = [],
  showDelay = 1200,
  autoCloseDuration = 0,
  storageKey = "trendy-bot-popup-v1",
  storageType = "session",
  imagePaths = DEFAULT_TRENDY_BOT_ASSETS,
  breakpoint = 768,
  className = "",
  shouldSuppress,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMobileBreakpoint(breakpoint);
  const [isMounted, setIsMounted] = useState(false);
  const [phase, setPhase] = useState(PHASE.HIDDEN);
  const [isHovered, setIsHovered] = useState(false);
  const [failedSources, setFailedSources] = useState(() => new Set());
  const timersRef = useRef(new Set());
  const phaseRef = useRef(PHASE.HIDDEN);
  const exitCallbackRef = useRef(null);
  const autoRemainingRef = useRef(autoCloseDuration);
  const autoStartedAtRef = useRef(0);
  const autoInitializedRef = useRef(false);
  const configuredAutoDurationRef = useRef(autoCloseDuration);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(() => {
      timersRef.current.delete(timer);
      callback();
    }, delay);
    timersRef.current.add(timer);
    return timer;
  }, []);

  const rememberDismissal = useCallback(() => {
    if (!storageKey) return;
    const storage = getStorage(storageType);

    try {
      storage?.setItem(storageKey, "dismissed");
    } catch (_error) {
      // Storage can be unavailable in private or restricted browsing modes.
    }
  }, [storageKey, storageType]);

  const finishExit = useCallback(() => {
    const pendingCallback = exitCallbackRef.current;
    exitCallbackRef.current = null;
    phaseRef.current = PHASE.HIDDEN;
    setPhase(PHASE.HIDDEN);
    setIsMounted(false);
    pendingCallback?.();
  }, []);

  const dismiss = useCallback(
    ({ remember = true, callback } = {}) => {
      const currentPhase = phaseRef.current;
      if (
        currentPhase === PHASE.HIDDEN ||
        currentPhase === PHASE.CARD_EXIT ||
        currentPhase === PHASE.WAVE ||
        currentPhase === PHASE.LEAVING
      ) {
        return;
      }

      clearTimers();
      if (remember) rememberDismissal();
      exitCallbackRef.current = callback || null;

      if (prefersReducedMotion) {
        phaseRef.current = PHASE.LEAVING;
        setPhase(PHASE.LEAVING);
        schedule(finishExit, 180);
        return;
      }

      phaseRef.current = PHASE.CARD_EXIT;
      setPhase(PHASE.CARD_EXIT);
      schedule(() => {
        phaseRef.current = PHASE.WAVE;
        setPhase(PHASE.WAVE);
      }, 300);
      schedule(() => {
        phaseRef.current = PHASE.LEAVING;
        setPhase(PHASE.LEAVING);
      }, 720);
      schedule(finishExit, 1370);
    },
    [clearTimers, finishExit, prefersReducedMotion, rememberDismissal, schedule]
  );

  useEffect(() => {
    clearTimers();
    exitCallbackRef.current = null;
    phaseRef.current = PHASE.HIDDEN;
    setPhase(PHASE.HIDDEN);
    setIsMounted(false);

    const storage = getStorage(storageType);
    try {
      if (storageKey && storage?.getItem(storageKey) === "dismissed") return undefined;
    } catch (_error) {
      // Continue without persistence when storage access is blocked.
    }

    const safeDelay = Math.max(0, showDelay);
    schedule(() => {
      const assetsToPreload = [
        isMobile ? imagePaths.mobilePeek : imagePaths.desktopPeek,
        imagePaths.present,
        imagePaths.wave,
      ];

      assetsToPreload.forEach((source) => {
        if (!source) return;
        const image = new Image();
        image.decoding = "async";
        image.src = source;
      });
    }, Math.max(0, safeDelay - 500));

    schedule(() => {
      if (shouldSuppress?.()) return;

      setIsMounted(true);
      if (prefersReducedMotion) {
        phaseRef.current = PHASE.VISIBLE;
        setPhase(PHASE.VISIBLE);
        return;
      }

      phaseRef.current = PHASE.PRESENTING;
      setPhase(PHASE.PRESENTING);
      schedule(() => {
        phaseRef.current = PHASE.VISIBLE;
        setPhase(PHASE.VISIBLE);
      }, 720);
    }, safeDelay);

    return clearTimers;
  }, [
    clearTimers,
    imagePaths.desktopPeek,
    imagePaths.mobilePeek,
    imagePaths.present,
    imagePaths.wave,
    isMobile,
    prefersReducedMotion,
    schedule,
    shouldSuppress,
    showDelay,
    storageKey,
    storageType,
  ]);

  useEffect(() => {
    if (!isMounted) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        dismiss({ callback: onClose });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dismiss, isMounted, onClose]);

  useEffect(() => {
    if (phase === PHASE.HIDDEN) {
      autoInitializedRef.current = false;
      configuredAutoDurationRef.current = autoCloseDuration;
      autoRemainingRef.current = autoCloseDuration;
      return;
    }

    const panelHasEntered =
      phase === PHASE.PRESENTING || phase === PHASE.VISIBLE;
    const durationChanged =
      configuredAutoDurationRef.current !== autoCloseDuration;

    if (panelHasEntered && (!autoInitializedRef.current || durationChanged)) {
      autoInitializedRef.current = true;
      configuredAutoDurationRef.current = autoCloseDuration;
      autoRemainingRef.current = autoCloseDuration;
    }
  }, [autoCloseDuration, phase]);

  useEffect(() => {
    if (
      (phase !== PHASE.PRESENTING && phase !== PHASE.VISIBLE) ||
      autoCloseDuration <= 0 ||
      (isHovered && !isMobile)
    ) {
      return undefined;
    }

    const remaining = Math.max(0, autoRemainingRef.current);
    autoStartedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      dismiss({ remember: false, callback: onAutoClose });
    }, remaining);

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - autoStartedAtRef.current;
      autoRemainingRef.current = Math.max(0, remaining - elapsed);
    };
  }, [autoCloseDuration, dismiss, isHovered, isMobile, onAutoClose, phase]);

  const poseSource = useMemo(() => {
    if (phase === PHASE.PEEK) {
      return isMobile ? imagePaths.mobilePeek : imagePaths.desktopPeek;
    }
    if (phase === PHASE.WAVE || phase === PHASE.LEAVING) return imagePaths.wave;
    return imagePaths.present;
  }, [imagePaths, isMobile, phase]);

  const fallbackPoseSource = useMemo(() => {
    if (!poseSource.endsWith(".webp")) return poseSource;
    return poseSource.replace(/\.webp$/i, ".png");
  }, [poseSource]);

  const renderedPoseSource = failedSources.has(poseSource)
    ? fallbackPoseSource
    : poseSource;

  const handleMascotError = useCallback(() => {
    setFailedSources((currentSources) => {
      if (currentSources.has(poseSource)) return currentSources;
      const nextSources = new Set(currentSources);
      nextSources.add(poseSource);
      return nextSources;
    });
  }, [poseSource]);

  const mascotInitial = useMemo(() => {
    if (prefersReducedMotion) return { opacity: 0 };
    if (phase === PHASE.PEEK) {
      return isMobile
        ? { opacity: 0, x: "105%", y: 0 }
        : { opacity: 0, x: 0, y: "110%" };
    }
    if (phase === PHASE.PRESENTING) {
      return isMobile
        ? { opacity: 0.75, x: "42%", y: 0 }
        : { opacity: 0.75, x: 0, y: "42%" };
    }
    return { opacity: 0.8, x: 0, y: 0, scale: 0.98 };
  }, [isMobile, phase, prefersReducedMotion]);

  const mascotAnimate = useMemo(() => {
    if (phase === PHASE.LEAVING) {
      return isMobile
        ? {
            opacity: [1, 1, 0],
            x: ["0%", "18%", "116%"],
            y: 0,
            rotate: [0, 18, 390],
            scale: [1, 0.96, 0.88],
          }
        : {
            opacity: [1, 1, 0],
            x: 0,
            y: ["0%", "14%", "122%"],
            rotate: [0, -18, -390],
            scale: [1, 0.96, 0.88],
          };
    }
    if (phase === PHASE.PEEK) {
      return isMobile
        ? { opacity: 1, x: "47%", y: 0 }
        : { opacity: 1, x: 0, y: "48%" };
    }
    if (phase === PHASE.VISIBLE && !prefersReducedMotion) {
      return isMobile
        ? {
            opacity: 1,
            x: [0, -2, 0, 2, 0],
            y: [0, -2, 0, -1, 0],
            rotate: [0, -1.5, 0.8, 1.5, 0],
            rotateY: [0, -8, 0, 8, 0],
            scale: [1, 1.02, 1, 1.015, 1],
          }
        : {
            opacity: 1,
            x: [0, -3, 0, 3, 0],
            y: [0, -5, 0, -2, 0],
            rotate: [0, -1.2, 0.8, 1.2, 0],
            rotateY: [0, -10, 0, 10, 0],
            scale: [1, 1.018, 1, 1.012, 1],
          };
    }
    if (phase === PHASE.WAVE && !prefersReducedMotion) {
      return {
        opacity: 1,
        x: 0,
        y: [0, -3, 0],
        rotate: [0, -4, 3, -2, 0],
        rotateY: [0, -14, 10, -6, 0],
        scale: [1, 1.03, 1],
      };
    }
    return { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
  }, [isMobile, phase, prefersReducedMotion]);

  const mascotTransition =
    phase === PHASE.VISIBLE && !prefersReducedMotion
      ? { duration: 3.2, repeat: Infinity, ease: "easeInOut", times: [0, 0.25, 0.5, 0.75, 1] }
      : {
          duration: phase === PHASE.LEAVING ? 0.78 : 0.68,
          ease: EASE_OUT,
        };

  const showPanel = phase === PHASE.PRESENTING || phase === PHASE.VISIBLE;

  if (!isMounted) return null;

  return (
    <motion.aside
          className={`penguin-popup ${className}`.trim()}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          data-phase={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.16 : 0.24 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="sync" initial={false}>
            <motion.img
              key={renderedPoseSource}
              className="penguin-popup__mascot"
              src={renderedPoseSource}
              alt=""
              aria-hidden="true"
              width="520"
              height="520"
              loading="eager"
              decoding="async"
              draggable="false"
              onError={handleMascotError}
              initial={mascotInitial}
              animate={mascotAnimate}
              exit={{ opacity: 0 }}
              transition={mascotTransition}
            />
          </AnimatePresence>

          <AnimatePresence>
            {showPanel && (
              <motion.section
                className="penguin-popup__panel"
                aria-label={title}
                initial={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, scale: 0.94, x: isMobile ? 16 : 0, y: isMobile ? 0 : 14 }
                }
                animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: prefersReducedMotion ? 0.16 : 0.42, ease: EASE_OUT }}
              >
                <button
                  type="button"
                  className="penguin-popup__close"
                  aria-label="Close popup"
                  onClick={() => dismiss({ callback: onClose })}
                >
                  <FaTimes aria-hidden="true" />
                </button>

                <div className="penguin-popup__heading">
                  {icon && <span className="penguin-popup__icon">{icon}</span>}
                  <div>
                    <h2>{title}</h2>
                    {description && <p>{description}</p>}
                  </div>
                </div>

                {informationRows.length > 0 && (
                  <ul className="penguin-popup__rows">
                    {informationRows.map((row, index) => {
                      const item = typeof row === "string" ? { label: row } : row;
                      return (
                        <li key={item.id || item.label || index}>
                          {item.icon && <span aria-hidden="true">{item.icon}</span>}
                          <span>{item.label}</span>
                          {item.value && <strong>{item.value}</strong>}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="penguin-popup__actions">
                  {actionLabel && (
                    <button
                      type="button"
                      className="penguin-popup__action penguin-popup__action--primary"
                      onClick={() => dismiss({ callback: onAction })}
                    >
                      <span>{actionLabel}</span>
                      <FaArrowRight aria-hidden="true" />
                    </button>
                  )}

                  {secondaryActions.map((action) => (
                    <button
                      type="button"
                      key={action.id || action.label}
                      className={`penguin-popup__action penguin-popup__action--secondary ${
                        action.iconOnly ? "penguin-popup__action--icon" : ""
                      }`.trim()}
                      onClick={() => dismiss({ callback: action.onAction })}
                      aria-label={action.ariaLabel || action.label}
                      title={action.title}
                    >
                      {action.icon && <span aria-hidden="true">{action.icon}</span>}
                      {!action.iconOnly && <span>{action.label}</span>}
                    </button>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
    </motion.aside>
  );
};

export default memo(PenguinPopup);
