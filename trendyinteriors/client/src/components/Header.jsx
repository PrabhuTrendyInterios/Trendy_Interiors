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
  const wheelDeltaRef = useRef(0);
  const wheelLockRef = useRef(false);
  const navDockRef = useRef(null);
  const ignoreNextTriggerClickRef = useRef(false);
  const location = useLocation();

  const isActive = useCallback((path) => location.pathname === path, [location.pathname]);
  const isHomePage = location.pathname === '/';

  const navItems = useMemo(() => [
    { type: 'link', to: '/', label: 'Home', icon: <FaHome />, active: isActive('/') },
    { type: 'link', to: '/abouts', label: 'About Us', icon: <FaInfoCircle />, active: isActive('/abouts') },
    {type: 'link', to: '/estimators', label: 'Estimators', icon: <FaCalculator />, active: isActive('/estimators') },
    { type: 'project', to: '/projects', label: 'Project', icon: <FaImages />, active: location.pathname.includes('/projects') },
    { type: 'link', to: '/testimonials', label: 'Testimonial', icon: <FaQuoteLeft />, active: isActive('/testimonials') },
    { type: 'link', to: '/reachus', label: 'Reach Us', icon: <FaPhoneAlt />, active: isActive('/reachus') },
  ], [isActive, location.pathname]);

  const typedCharacters = useMemo(() => {
    if (!typedText) {
      return [];
    }

    const firstSpaceIndex = typedText.indexOf(' ');

    return typedText.split('').map((char, index) => ({
      char,
      isAccent: firstSpaceIndex >= 0 && index > firstSpaceIndex,
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

  const processWheelDelta = useCallback((deltaY) => {
    wheelDeltaRef.current += deltaY;

    if (wheelLockRef.current || Math.abs(wheelDeltaRef.current) < 120) {
      return;
    }

    rotateNav(wheelDeltaRef.current > 0 ? 1 : -1);
    wheelDeltaRef.current = 0;
    wheelLockRef.current = true;

    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 420);
  }, [rotateNav]);

  const handleDockPointerEnter = (event) => {
    if (event.pointerType === 'mouse' && viewportWidth > 768) {
      setIsDockOpen(true);
    }
  };

  const handleDockPointerLeave = (event) => {
    if (event.pointerType === 'mouse' && viewportWidth > 768) {
      closeDock();
    }
  };

  const handleDockKeyDown = (event) => {
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

  const arcNavItems = useMemo(() => {
    const arcDegrees = viewportWidth <= 768 ? 112 : viewportWidth <= 1024 ? 118 : 124;
    const radius = viewportWidth <= 768 ? 158 : viewportWidth <= 1024 ? 178 : 198;
    const centerX = viewportWidth <= 768 ? -48 : viewportWidth <= 1024 ? -58 : -68;
    const maxOffset = Math.max(1, Math.floor(navItems.length / 2));
    const angleStep = navItems.length > 1 ? arcDegrees / (navItems.length - 1) : 0;

    return navItems.map((item, index) => {
      let offset = index - activeNavIndex;

      if (offset > navItems.length / 2) {
        offset -= navItems.length;
      }

      if (offset < -navItems.length / 2) {
        offset += navItems.length;
      }

      const angle = offset * angleStep;
      const radians = (angle * Math.PI) / 180;
      const distance = Math.min(Math.abs(offset), maxOffset);
      const emphasis = 1 - (distance / maxOffset);
      const scale = 0.78 + (emphasis * 0.24);
      const opacity = 0.36 + (emphasis * 0.64);
      const x = centerX + (Math.cos(radians) * radius);
      const y = Math.sin(radians) * radius;

      return {
        item,
        index,
        offset,
        style: {
          '--arc-x': `${x.toFixed(2)}px`,
          '--arc-y': `${y.toFixed(2)}px`,
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
    const fullLogoText = 'Trendy Interios';
    // shorter spin so typing begins sooner, and slightly faster typing
    const spinDuration = 600; // ms
    const typingIntervalMs = 80; // ms per character
    const postCycleDelay = 900; // wait after typing before next cycle

    let spinTimer = null;
    let typingTimer = null;
    let loopTimer = null;

    const clearAll = () => {
      if (spinTimer) {
        window.clearTimeout(spinTimer);
        spinTimer = null;
      }
      if (typingTimer) {
        window.clearInterval(typingTimer);
        typingTimer = null;
      }
      if (loopTimer) {
        window.clearTimeout(loopTimer);
        loopTimer = null;
      }
    };

    const startCycle = () => {
      // ensure any previous timers are cleared before starting
      clearAll();

      setIsLogoAnimating(true);
      setIsTyping(false);
      setTypedText('');

      spinTimer = window.setTimeout(() => {
        setIsLogoAnimating(false);
        setIsTyping(true);

        let currentLength = 0;
        typingTimer = window.setInterval(() => {
          currentLength += 1;
          setTypedText(fullLogoText.slice(0, currentLength));

          if (currentLength >= fullLogoText.length) {
            // typing complete
            if (typingTimer) {
              window.clearInterval(typingTimer);
              typingTimer = null;
            }
            setIsTyping(false);

            // schedule next cycle after a short pause
            loopTimer = window.setTimeout(() => {
              startCycle();
            }, postCycleDelay);
          }
        }, typingIntervalMs);
      }, spinDuration);
    };

    // kick off the first cycle
    startCycle();

    return () => {
      clearAll();
    };
  }, []);

  useEffect(() => {
    const navDock = navDockRef.current;
    if (!navDock) {
      return undefined;
    }

    const handleNativeDockWheel = (event) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDockOpen(true);
      processWheelDelta(event.deltaY);
    };

    navDock.addEventListener('wheel', handleNativeDockWheel, { passive: false });
    return () => navDock.removeEventListener('wheel', handleNativeDockWheel);
  }, [processWheelDelta]);

  useEffect(() => {
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

      if (isInNavDock) {
        event.preventDefault();
      } else {
        event.preventDefault();
      }
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
    };
  }, [isDockOpen, processWheelDelta]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    if (isDockOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = originalOverflow || '';
      document.body.style.touchAction = originalTouchAction || '';
    }

    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.style.touchAction = originalTouchAction || '';
    };
  }, [isDockOpen]);

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
        onFocus={() => setIsDockOpen(true)}
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
            event.stopPropagation();
            if (ignoreNextTriggerClickRef.current) {
              ignoreNextTriggerClickRef.current = false;
              return;
            }

            setIsDockOpen((open) => !open);
          }}
          onPointerDown={(event) => {
            if (event.pointerType !== 'mouse') {
              ignoreNextTriggerClickRef.current = true;
              setIsDockOpen((open) => !open);
            }
          }}
        />

        <nav className="navigation" aria-label="Primary navigation">
          <div className="nav-orbit" aria-hidden="true" />
          <div className="nav-scroll" aria-live="polite">
            {arcNavItems.map(({ item, index, style }) => {
              const itemClassName = `nav-link nav-arc-item ${index === activeNavIndex ? 'active' : ''} ${item.active ? 'route-active' : ''}`;

              if (item.type === 'project') {
                return (
                  <Link
                    to={item.to}
                    className={itemClassName}
                    style={style}
                    onClick={closeDock}
                    key={item.label}
                    title="Project"
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
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      <header className={`header ${isScrolled ? 'scrolled' : ''} ${isHomePage ? 'transparent' : ''}`}>
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
        </div>
      </header>
    </>
  );
};

export default Header;
