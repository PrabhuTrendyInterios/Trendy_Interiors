import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaComments, FaHome, FaImages, FaRulerCombined } from "react-icons/fa";
import PenguinPopup from "./PenguinPopup";

const EXCLUDED_ROUTES = [
  "/admin",
  "/login",
  "/register",
  "/estimator",
  "/quotation",
];

// Edit this object to change the site-wide popup copy or timing.
export const PENGUIN_POPUP_CONFIG = {
  title: "Bring your dream interior to life",
  description: "Explore completed spaces or build a personalized interior quote in minutes.",
  actionLabel: "Quote Interior Yourself",
  inactivityDelay: 10000,
  showDelay: 0,
  autoCloseDuration: 5000,
  storageKey: "trendy-interiors-penguin-popup-v5",
  storageType: "none",
};

const PopupCard = () => {
  const [popupCycle, setPopupCycle] = useState(null);
  const inactivityTimerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isExcluded = EXCLUDED_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );

  const finishCycle = useCallback(() => {
    setPopupCycle(null);
  }, []);

  useEffect(() => {
    const clearInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };

    if (isExcluded || popupCycle !== null) {
      clearInactivityTimer();
      return clearInactivityTimer;
    }

    const armInactivityTimer = () => {
      clearInactivityTimer();
      inactivityTimerRef.current = window.setTimeout(() => {
        inactivityTimerRef.current = null;
        setPopupCycle(Date.now());
      }, PENGUIN_POPUP_CONFIG.inactivityDelay);
    };

    const activityEvents = [
      "pointermove",
      "pointerdown",
      "touchstart",
      "scroll",
      "keydown",
    ];

    activityEvents.forEach((eventName) =>
      window.addEventListener(eventName, armInactivityTimer, { passive: true })
    );
    armInactivityTimer();

    return () => {
      clearInactivityTimer();
      activityEvents.forEach((eventName) =>
        window.removeEventListener(eventName, armInactivityTimer)
      );
    };
  }, [isExcluded, popupCycle]);

  const informationRows = useMemo(
    () => [
      { id: "quote", icon: <FaRulerCombined />, label: "Personalized design quote" },
      { id: "projects", icon: <FaImages />, label: "Completed interior projects" },
    ],
    []
  );

  const secondaryActions = useMemo(
    () => [
      {
        id: "projects",
        label: "View Projects",
        icon: <FaImages />,
        onAction: () => {
          finishCycle();
          navigate("/projects");
        },
      },
      {
        id: "chat",
        label: "Chat",
        ariaLabel: "Open chatbot",
        title: "Chat with us",
        icon: <FaComments />,
        iconOnly: true,
        onAction: () => {
          finishCycle();
          window.dispatchEvent(new Event("open-chatbot"));
        },
      },
    ],
    [finishCycle, navigate]
  );

  if (isExcluded || popupCycle === null) return null;

  return (
    <PenguinPopup
      key={popupCycle}
      {...PENGUIN_POPUP_CONFIG}
      icon={<FaHome />}
      informationRows={informationRows}
      secondaryActions={secondaryActions}
      onAction={() => {
        finishCycle();
        navigate("/estimator");
      }}
      onClose={finishCycle}
      onAutoClose={finishCycle}
    />
  );
};

export default PopupCard;
