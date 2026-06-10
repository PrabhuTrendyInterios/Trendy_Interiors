import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PopupCard.css";

const PopupCard = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const inactivityTimerRef = React.useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      // Only show popup if not already visible and not closing
      if (!visible && !closing) {
        setVisible(true);

        const hideTimer = setTimeout(() => {
          setClosing(true);

          setTimeout(() => {
            setVisible(false);
            setClosing(false);
          }, 400);
        }, 6000);

        return () => clearTimeout(hideTimer);
      }
    }, 10000); // 10 seconds of inactivity
  };

  useEffect(() => {
    const excludedRoutes = [
      "/admin",
      "/login",
      "/register",
      "/estimator",
      "/quotation",
    ];

    const isExcluded = excludedRoutes.some((route) =>
      location.pathname.startsWith(route)
    );

    if (isExcluded) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    // Track user activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners for user activity
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keypress", handleActivity);
    window.addEventListener("touchstart", handleActivity);

    // Initialize the inactivity timer
    resetInactivityTimer();

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [location.pathname, visible, closing, resetInactivityTimer]);


  const handleEstimate = () => {
    setClosing(true);

    setTimeout(() => {
      navigate("/estimator");
    }, 400);
  };

  const handleCancel = () => {
    setClosing(true);

    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`popup-container ${
        closing ? "popup-closing" : ""
      }`}
    >

      <div className="penguin-wrapper">
        <img
          src="/images/penguin.png"
          alt="Penguin Buddy"
          className="penguin-image"
        />
      </div>

      <div className="speech-bubble">
        <button
          className="popup-close"
          onClick={handleCancel}
          aria-label="Close popup"
        >
          x
        </button>

        <p>
          🐧 <strong>Still thinking?</strong>
          <br />
          Looks like you've gone quiet for a bit! 🤔
          <br />
          Sometimes the perfect design needs a moment to sink in. ✨
          <br />
          Ready to see what your dream interior might cost?
          <br />
          Let's turn that inspiration into reality! 🏡
        </p>

        <button
          className="popup-estimate-btn"
          onClick={handleEstimate}
        >
          🏡 Show Me The Estimate
        </button>
      </div>
    </div>
  );
};

export default PopupCard;