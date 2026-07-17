import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaComments, FaHome, FaImages, FaTimes } from "react-icons/fa";
import "./PopupCard.css";

const PopupCard = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [entranceStage, setEntranceStage] = useState("idle");
  const inactivityTimerRef = React.useRef(null);
  const revealTimerRef = React.useRef(null);
  const hideTimerRef = React.useRef(null);
  const closeTimerRef = React.useRef(null);
  const visibleRef = React.useRef(false);
  const closingRef = React.useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const excludedRoutes = [
      "/admin",
      "/login",
      "/register",
      "/estimator",
      "/quotation",
    ];

    const clearTimer = (timerRef) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const finishClosing = () => {
      visibleRef.current = false;
      closingRef.current = false;
      setVisible(false);
      setClosing(false);
      setEntranceStage("idle");
    };

    const showPopup = () => {
      if (visibleRef.current || closingRef.current) return;

      visibleRef.current = true;
      setVisible(true);
      setClosing(false);
      setEntranceStage("peeking");

      revealTimerRef.current = setTimeout(() => {
        setEntranceStage("holding");

        hideTimerRef.current = setTimeout(() => {
          closingRef.current = true;
          setClosing(true);
          closeTimerRef.current = setTimeout(finishClosing, 520);
        }, 8500);
      }, 900);
    };

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }

      if (visibleRef.current || closingRef.current) return;

      inactivityTimerRef.current = setTimeout(() => {
        showPopup();
      }, 10000);
    };

    const isExcluded = excludedRoutes.some((route) =>
      location.pathname.startsWith(route)
    );

    if (isExcluded) {
      clearTimer(inactivityTimerRef);
      clearTimer(revealTimerRef);
      clearTimer(hideTimerRef);
      clearTimer(closeTimerRef);
      finishClosing();
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
      clearTimer(revealTimerRef);
      clearTimer(hideTimerRef);
      clearTimer(closeTimerRef);
    };
  }, [location.pathname]);

  const closePopup = (onClosed) => {
    [revealTimerRef, hideTimerRef, closeTimerRef].forEach((timerRef) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    });

    closingRef.current = true;
    setClosing(true);

    closeTimerRef.current = setTimeout(() => {
      visibleRef.current = false;
      closingRef.current = false;
      setVisible(false);
      setClosing(false);
      setEntranceStage("idle");
      onClosed?.();
    }, 520);
  };

  const handleEstimate = () => {
    closePopup(() => navigate("/estimator"));
  };
  const handleViewProjects = () => {
    closePopup(() => navigate("/projects"));
  };
  const handleChatbot = () => {
    closePopup(() => {
      window.dispatchEvent(new Event("open-chatbot"));
    });
  };

  const handleCancel = () => {
    closePopup();
  };

  if (!visible) return null;

  return (
    <div
      className={`popup-container popup-${entranceStage} ${
        closing ? "popup-closing" : ""
      }`}
      aria-live="polite"
    >

      <div className="penguin-wrapper">
        <img
          src="/images/penguin.png"
          alt="Penguin Buddy"
          className="penguin-image"
        />
      </div>

      <aside className="speech-bubble" aria-label="Interior design offer">
        <button
          className="popup-close"
          onClick={handleCancel}
          aria-label="Close popup"
        >
          <FaTimes aria-hidden="true" />
        </button>

        <div className="popup-copy">
          <span className="popup-lead">
            <FaHome aria-hidden="true" />
            <strong>Bring your dream interior to life</strong>
          </span>
          <p>
            Explore completed spaces or create a personalized quote in minutes.
          </p>
        </div>

        <div className="popup-actions">
          <button
            className="popup-estimate-btn popup-secondary-btn"
            onClick={handleViewProjects}
          >
            <FaImages aria-hidden="true" />
            View Projects
          </button>
          <button
            className="popup-estimate-btn"
            onClick={handleEstimate}
          >
            <FaHome aria-hidden="true" />
            Quote Interior Yourself
          </button>
          <button
            className="popup-chat-btn"
            onClick={handleChatbot}
            aria-label="Open chatbot"
            title="Chat with us"
          >
            <FaComments aria-hidden="true" />
          </button>
        </div>
      </aside>
    </div>
  );
};

export default PopupCard;
