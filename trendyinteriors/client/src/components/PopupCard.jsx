import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PopupCard.css";

const PopupCard = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

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

    const isExcluded = excludedRoutes.some((route) =>
      location.pathname.startsWith(route)
    );

    if (isExcluded) return;

    const showTimer = setTimeout(() => {
      setVisible(true);

      const hideTimer = setTimeout(() => {
        setClosing(true);

        setTimeout(() => {
          setVisible(false);
          setClosing(false);
        }, 400);
      }, 6000);

      return () => clearTimeout(hideTimer);
    }, 10000);

    return () => clearTimeout(showTimer);
  }, [location.pathname]);


  const handleEstimate = () => {
    setClosing(true);

    setTimeout(() => {
      navigate("/estimator");
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
        <p>
          🐧 <strong>Hey...</strong>
          <br />
          You've scrolled this far.
          <br />
          At this point we're basically friends. 🤝
          <br />
          So tell me...
          <br />
          Have you been planning your dream interior...
          <br />
          or just professionally procrastinating? 👀
          <br />
          Either way, let's see what it might cost! ✨
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