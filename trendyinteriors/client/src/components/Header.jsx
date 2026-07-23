import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaImages,
  FaInfoCircle,
  FaPhoneAlt,
  FaQuoteLeft,
  FaCalculator,
} from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDockOpen, setIsDockOpen] = useState(false);
  const [activeNavIndex, setActiveNavIndex] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLogoAnimating, setIsLogoAnimating] = useState(false);
  const [isHeaderIntroComplete, setIsHeaderIntroComplete] = useState(false);
  const wheelDeltaRef = useRef(0);
  const wheelLockRef = useRef(false);
  const navDockRef = useRef(null);
  const ignoreNextTriggerClickRef = useRef(false);
  const suppressFocusOpenRef = useRef(false);
  const touchLastYRef = useRef(null);
  const dockUserInteractedRef = useRef(false);
  const location = useLocation();
  const isMobileHeader = viewportWidth <= 768;

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);
  const isHomePage = location.pathname === '/';

  const navItems = useMemo(() => [
    { type: 'link', to: '/', label: 'Home', icon: <FaHome />, active: isActive('/') },
    { type: 'link', to: '/abouts', label: 'About Us', icon: <FaInfoCircle />, active: isActive('/abouts') },
    { type: 'link', to: '/estimator', label: 'Quote Interior Yourself', icon: <FaCalculator />, active: isActive('/estimator') },
    { type: 'project', to: '/projects', label: 'Project', icon: <FaImages />, active: location.pathname.includes('/projects') },
    { type: 'link', to: '/testimonials', label: 'Testimonial', icon: <FaQuoteLeft />, active: isActive('/testimonials') },
    { type: 'link', to: '/reachus', label: 'Reach Us', icon: <FaPhoneAlt />, active: isActive('/reachus') },
  ], [isActive, location.pathname]);

  const typedCharacters = useMemo(() => {
    if (!typedText) {
      return [];
    }

    return typedText.split('').map((char) => ({
      char,
      isAccent: char === 'T' || char === 'I' || char === 'S',
    }));
  }, [typedText]);

  const closeDock = useCallback(() => {
    setIsDockOpen(false);
  }, []);

  const rotateNav = useCallback((direction) => {
    setActiveNavIndex((currentIndex) => (
      currentIndex + direction + navItems.length
    ) % navItems.length);
  }, [navItems.length]);

  const processWheelDelta = useCallback((deltaY, threshold = 120, lockMs = 420) => {
    wheelDeltaRef.current += deltaY;

    if (wheelLockRef.current || Math.abs(wheelDeltaRef.current) < threshold) {
      return;
    }

    rotateNav(wheelDeltaRef.current > 0 ? 1 : -1);
    wheelDeltaRef.current = 0;
    wheelLockRef.current = true;

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, lockMs);
  }, [rotateNav]);

  const handleDockPointerEnter = (event) => {
    dockUserInteractedRef.current = true;
    if (event.pointerType === 'mouse' && viewportWidth > 768) {
      setIsDockOpen(true);
    }
  };

  const handleDockPointerLeave = (event) => {
    dockUserInteractedRef.current = true;
    if (event.pointerType === 'mouse' && viewportWidth > 768) {
      closeDock();
    }
  };

  const handleDockKeyDown = (event) => {
    dockUserInteractedRef.current = true;

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      rotateNav(1);
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      rotateNav(-1);
    }

    if (event.key === 'Escape') {
      closeDock();
    }
  };

  const handleDockFocus = (event) => {
    dockUserInteractedRef.current = true;

    if (suppressFocusOpenRef.current || event.target.classList.contains('nav-edge-trigger')) {
      return;
    }

    setIsDockOpen(true);
  };

  const arcNavItems = useMemo(() => {
    const isCompactDock = navItems.length > 0;
    const arcDegrees = isCompactDock ? 140 : 124;
    const radius = viewportWidth <= 480 ? 170 : viewportWidth <= 768 ? 184 : viewportWidth <= 1280 ? 214 : 198;
    const centerX = viewportWidth <= 480 ? -72 : viewportWidth <= 768 ? -80 : viewportWidth <= 1280 ? -96 : -68;
    const compactItemGap = viewportWidth <= 480 ? 76 : viewportWidth <= 768 ? 80 : 82;
    const maxOffset = Math.max(1, Math.floor(navItems.length / 2));
    const angleStep = isCompactDock && navItems.length > 1
      ? arcDegrees / navItems.length
      : navItems.length > 1
        ? arcDegrees / (navItems.length - 1)
        : 0;

    return navItems.map((item, index) => {
      let offset = index - activeNavIndex;

      if (offset > navItems.length / 2) {
        offset -= navItems.length;
      }

      if (offset < -navItems.length / 2) {
        offset += navItems.length;
      }

      const y = isCompactDock
        ? Math.max(-radius * 0.86, Math.min(radius * 0.86, offset * compactItemGap))
        : null;
      const angle = offset * angleStep;
      const radians = isCompactDock ? Math.asin(y / radius) : (angle * Math.PI) / 180;
      const distance = Math.min(Math.abs(offset), maxOffset);
      const isVisible = !isCompactDock || Math.abs(offset) <= 1;
      const emphasis = 1 - (distance / maxOffset);
      const scale = isCompactDock ? 0.86 + (emphasis * 0.14) : 0.78 + (emphasis * 0.24);
      const opacity = isVisible
        ? isCompactDock ? 0.5 + (emphasis * 0.5) : 0.36 + (emphasis * 0.64)
        : 0;
      const x = centerX + (Math.cos(radians) * radius);
      const arcY = isCompactDock ? y : Math.sin(radians) * radius;

      return {
        item,
        index,
        offset,
        isVisible,
        style: {
          '--arc-x': `${x.toFixed(2)}px`,
          '--arc-y': `${arcY.toFixed(2)}px`,
          '--arc-scale': scale.toFixed(3),
          '--arc-opacity': opacity.toFixed(3),
          '--arc-z': String(100 - distance),
        },
      };
    });
  }, [activeNavIndex, navItems, viewportWidth]);

  useEffect(() => {
    const currentRouteIndex = navItems.findIndex((item) => item.active);

    if (currentRouteIndex >= 0) {
      setActiveNavIndex(currentRouteIndex);
    }
  }, [navItems]);

  useEffect(() => {
    dockUserInteractedRef.current = false;

    if (viewportWidth <= 768) {
      setIsDockOpen(false);
      return undefined;
    }

    setIsDockOpen(true);

    const hideTimer = window.setTimeout(() => {
      if (!dockUserInteractedRef.current) {
        setIsDockOpen(false);
      }
    }, 3600);

    return () => window.clearTimeout(hideTimer);
  }, [location.pathname, viewportWidth]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fullLogoText = 'Trendy InterioS';
    const typingStartDelayMs = 180;
    const typingIntervalMs = 82;
    const mobileSettleDelayMs = 360;

    let startTimer = null;
    let typingTimer = null;
    let settleTimer = null;

    const clearAll = () => {
      if (startTimer) {
        window.clearTimeout(startTimer);
        startTimer = null;
      }
      if (typingTimer) {
        window.clearInterval(typingTimer);
        typingTimer = null;
      }
      if (settleTimer) {
        window.clearTimeout(settleTimer);
        settleTimer = null;
      }
    };

    setIsLogoAnimating(isMobileHeader);
    setIsTyping(true);
    setIsHeaderIntroComplete(false);
    setTypedText('');

    startTimer = window.setTimeout(() => {
      setIsLogoAnimating(false);

      let currentLength = 0;
      typingTimer = window.setInterval(() => {
        currentLength += 1;
        setTypedText(fullLogoText.slice(0, currentLength));

        if (currentLength >= fullLogoText.length) {
          window.clearInterval(typingTimer);
          typingTimer = null;
          setTypedText(fullLogoText);
          setIsTyping(false);

          if (isMobileHeader) {
            settleTimer = window.setTimeout(() => {
              setTypedText('');
              setIsHeaderIntroComplete(true);
            }, mobileSettleDelayMs);
          } else {
            setIsHeaderIntroComplete(true);
          }
        }
      }, typingIntervalMs);
    }, typingStartDelayMs);

    return () => {
      clearAll();
    };
  }, [location.pathname, isMobileHeader]);

  useEffect(() => {
    const navDock = navDockRef.current;
    if (!navDock) {
      return undefined;
    }

    const handleNativeDockWheel = (event) => {
      dockUserInteractedRef.current = true;
      event.preventDefault();
      event.stopPropagation();
      setIsDockOpen(true);
      processWheelDelta(event.deltaY);
    };

    const handleNativeDockTouchStart = (event) => {
      dockUserInteractedRef.current = true;
      if (viewportWidth > 768 || event.touches.length === 0) {
        return;
      }

      touchLastYRef.current = event.touches[0].clientY;
    };

    const handleNativeDockTouchMove = (event) => {
      if (viewportWidth > 768 || !isDockOpen || event.touches.length === 0) {
        return;
      }

      const nextY = event.touches[0].clientY;
      const lastY = touchLastYRef.current ?? nextY;
      const deltaY = lastY - nextY;

      event.preventDefault();
      event.stopPropagation();
      touchLastYRef.current = nextY;
      processWheelDelta(deltaY * 2.2, 54, 170);
    };

    const handleNativeDockTouchEnd = () => {
      touchLastYRef.current = null;
      wheelDeltaRef.current = 0;
    };

    navDock.addEventListener('wheel', handleNativeDockWheel, { passive: false });
    navDock.addEventListener('touchstart', handleNativeDockTouchStart, { passive: true });
    navDock.addEventListener('touchmove', handleNativeDockTouchMove, { passive: false });
    navDock.addEventListener('touchend', handleNativeDockTouchEnd);
    navDock.addEventListener('touchcancel', handleNativeDockTouchEnd);

    return () => {
      navDock.removeEventListener('wheel', handleNativeDockWheel);
      navDock.removeEventListener('touchstart', handleNativeDockTouchStart);
      navDock.removeEventListener('touchmove', handleNativeDockTouchMove);
      navDock.removeEventListener('touchend', handleNativeDockTouchEnd);
      navDock.removeEventListener('touchcancel', handleNativeDockTouchEnd);
    };
  }, [isDockOpen, processWheelDelta, viewportWidth]);

  useEffect(() => {
    if (viewportWidth <= 768) {
      return undefined;
    }

    const isElementInNavDock = (target) => {
      let element = target;

      while (element && element.nodeType !== 1) {
        element = element.parentElement;
      }

      return element?.closest('.nav-dock');
    };

    const handleGlobalWheel = (event) => {
      if (!isDockOpen) {
        return;
      }

      const isInNavDock = isElementInNavDock(event.target);

      event.preventDefault();

      if (isInNavDock) {
        processWheelDelta(event.deltaY);
      }
    };

    const handleGlobalTouchMove = (event) => {
      if (!isDockOpen) {
        return;
      }

      const isInNavDock = isElementInNavDock(event.target);

      if (!isInNavDock) {
        event.preventDefault();
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isDockOpen, processWheelDelta, viewportWidth]);

  useEffect(() => {
    if (viewportWidth > 768 || !isDockOpen) {
      return;
    }

    const handleOutsideClick = (event) => {
      const navDock = document.querySelector('.nav-dock');
      if (navDock && !navDock.contains(event.target)) {
        closeDock();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isDockOpen, viewportWidth, closeDock]);

  return (
    <>
      <div
        ref={navDockRef}
        className={`nav-dock ${isDockOpen ? 'is-open' : ''}`}
        onPointerEnter={handleDockPointerEnter}
        onPointerLeave={handleDockPointerLeave}
        onFocus={handleDockFocus}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            closeDock();
          }
        }}
        onKeyDown={handleDockKeyDown}
      >
        <button
          type="button"
          className="nav-edge-trigger"
          aria-label="Open navigation"
          onClick={(event) => {
            dockUserInteractedRef.current = true;
            event.stopPropagation();
            if (ignoreNextTriggerClickRef.current) {
              ignoreNextTriggerClickRef.current = false;
              return;
            }

            setIsDockOpen((open) => !open);
          }}
          onPointerDown={(event) => {
            dockUserInteractedRef.current = true;
            if (event.pointerType !== 'mouse') {
              ignoreNextTriggerClickRef.current = true;
              suppressFocusOpenRef.current = true;
              setIsDockOpen((open) => !open);
              window.setTimeout(() => {
                suppressFocusOpenRef.current = false;
              }, 0);
            }
          }}
        />

        <nav className="navigation" aria-label="Primary navigation">
          <div className="nav-orbit" aria-hidden="true" />
          <div className="nav-scroll" aria-live="polite">
            {arcNavItems.map(({ item, index, isVisible, style }) => {
              const itemClassName = `nav-link nav-arc-item ${index === activeNavIndex ? 'active' : ''} ${item.active ? 'route-active' : ''} ${isVisible ? '' : 'is-arc-hidden'}`;

              if (item.type === 'project') {
                return (
                  <Link
                    to={item.to}
                    className={itemClassName}
                    style={style}
                    onClick={closeDock}
                    key={item.label}
                    title="Project"
                    aria-hidden={!isVisible}
                    tabIndex={isVisible ? undefined : -1}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.label}</span>
                  </Link>
                );
              }

              return (
                <Link
                  to={item.to}
                  className={itemClassName}
                  style={style}
                  onClick={closeDock}
                  title={item.label}
                  key={item.to}
                  aria-hidden={!isVisible}
                  tabIndex={isVisible ? undefined : -1}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <header className={`header ${isScrolled ? 'scrolled' : ''} ${isHomePage ? 'transparent' : ''} ${isHeaderIntroComplete ? 'header-intro-complete' : 'header-intro-active'}`}>
        <div className="header-container">
          <div className="logo">
            <Link to="/">
              <div className={`logo-wrapper ${isLogoAnimating ? 'logo-animating' : ''}`}>
                <img src="/images/logo.png" alt="Trendy Interios Logo" className={`logo-image ${isLogoAnimating ? 'logo-spin' : ''}`} />
                <span className={`logo-text ${isTyping ? 'typing' : ''}`}>
                  {typedCharacters.map(({ char, isAccent }, index) => (
                    <span
                      key={`${char}-${index}`}
                      className={isAccent ? 'logo-accent' : 'logo-text-prefix'}
                    >
                      {char}
                    </span>
                  ))}
                  {isTyping ? <span className="typing-cursor" aria-hidden="true">|</span> : null}
                </span>
              </div>
            </Link>
          </div>
          <p
            className={`mobile-header-quote ${isHeaderIntroComplete ? 'is-visible' : ''}`}
            aria-hidden={!isHeaderIntroComplete}
          >
            {['Filling', 'the', 'hearts,', 'not', 'space'].map((word, index) => (
              <span
                className="header-quote-word"
                style={{ '--word-index': index }}
                key={word}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </header>
    </>
  );
};

export default Header;
