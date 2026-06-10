import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./TourGuide.css";

const steps = [
  {
    selector: ".home-page",
    title: "Welcome to Trendy Interiors",
    text: "Here is a quick introduction to your website setup before we walk through key features."
  },
  {
    selector: ".tour-view-projects-btn",
    title: "View Projects",
    text: "Use this button to explore completed work and understand the design quality right away."
  },
  {
    selector: ".tour-estimator-btn",
    title: "Dream Interior",
    text: "Design your dream interior and get a quick estimate."
  },
  {
    selector: ".tour-projects",
    title: "Our Projects",
    text: "Explore some of our latest interior transformations."
  },
  {
    selector: ".tour-process",
    title: "Design Journey",
    text: "See how we bring your dream space to life."
  },
  {
    selector: ".tour-testimonials",
    title: "Client Reviews",
    text: "Hear from homeowners who trusted us."
  },
  {
    selector: ".tour-services",
    title: "Our Services",
    text: "Discover our complete interior solutions."
  },
  {
    selector: ".chatbot-toggle",
    title: "Need Instant Help?",
    text: "Tap the chatbot icon for quick answers and a smooth handoff."
  }
];

export default function TourGuide() {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [exitTargetRect, setExitTargetRect] = useState(null);
  const [placement, setPlacement] = useState("bottom");
  const [isExiting, setIsExiting] = useState(false);
  const [visible, setVisible] = useState(() => {
    return !sessionStorage.getItem("tourCompleted");
  });
  const [penguinState, setPenguinState] = useState("normal");
  const imageTimeoutRef = useRef(null);
  const clickActionRef = useRef(null);
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const clamp = useCallback((value, min, max) => {
    return Math.min(Math.max(value, min), max);
  }, []);

  const calculatePosition = useCallback(() => {
    const el = document.querySelector(steps[step].selector);

    if (!el) return;

    const rect = el.getBoundingClientRect();
    const guideHeight = 240;
    const topSpace = rect.top;
    const bottomSpace = window.innerHeight - rect.bottom;
    const enoughTopSpace = topSpace >= guideHeight + 32;
    const enoughBottomSpace = bottomSpace >= guideHeight + 32;

    let nextPlacement = "center";

    if (enoughTopSpace && topSpace >= bottomSpace) {
      nextPlacement = "top";
    } else if (enoughBottomSpace && bottomSpace >= topSpace) {
      nextPlacement = "bottom";
    }

    setViewport({
      width: window.innerWidth,
      height: window.innerHeight
    });
    setPlacement(nextPlacement);
    setTargetRect(rect);
  }, [step]);

  useEffect(() => {
    if (!visible) return;

    const el = document.querySelector(steps[step].selector);

    if (!el) return;

    const headerOffset = 140;

    window.scrollTo({
      top: window.scrollY + el.getBoundingClientRect().top - headerOffset,
      behavior: "smooth"
    });

    const timer = window.setTimeout(() => {
      calculatePosition();
    }, 700);

    window.addEventListener("resize", calculatePosition);
    window.addEventListener("scroll", calculatePosition);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculatePosition);
      window.removeEventListener("scroll", calculatePosition);
    };
  }, [step, visible, calculatePosition]);

  // Prefetch alternate penguin images and clear any pending timeouts on unmount
  useEffect(() => {
    const clickedImg = new Image();
    clickedImg.src = "/images/penguin-clicked.png";
    const angryImg = new Image();
    angryImg.src = "/images/penguin-angry.png";

    return () => {
      if (imageTimeoutRef.current) {
        clearTimeout(imageTimeoutRef.current);
        imageTimeoutRef.current = null;
      }
    };
  }, []);

  if (!visible || !targetRect) return null;

  const guideWidth = 520;
  const guideHeight = 240;
  const verticalGap = 74;
  const edgePadding = 120;

  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  const guideLeft = clamp(
    targetCenterX - guideWidth / 2,
    edgePadding,
    viewport.width - guideWidth - edgePadding
  );

  const guideTop = clamp(
    placement === "top"
      ? targetRect.top - guideHeight - verticalGap
      : placement === "bottom"
      ? targetRect.bottom + verticalGap
      : targetCenterY - guideHeight / 2,
    edgePadding,
    viewport.height - guideHeight - edgePadding
  );

  const isChatbotStep = step === steps.length - 1;

  const exitLeft = exitTargetRect
    ? clamp(
        exitTargetRect.left + exitTargetRect.width / 2 - guideWidth / 2,
        edgePadding,
        viewport.width - guideWidth - edgePadding
      )
    : guideLeft;

  const exitTop = exitTargetRect
    ? clamp(
        exitTargetRect.top + exitTargetRect.height / 2 - guideHeight / 2,
        edgePadding,
        viewport.height - guideHeight - edgePadding
      )
    : guideTop;

  const finishTour = () => {
    if (!isChatbotStep) {
      setStep((currentStep) => currentStep + 1);
      return;
    }

    const chatbotElement = document.querySelector(".chatbot-toggle");

    if (chatbotElement) {
      setExitTargetRect(chatbotElement.getBoundingClientRect());
    }

    setIsExiting(true);
    sessionStorage.setItem("tourCompleted", "true");

    window.setTimeout(() => {
      setVisible(false);
    }, 650);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div
          className="spotlight"
          style={{
            left: targetRect.left - 10,
            top: targetRect.top - 10,
            width: targetRect.width + 20,
            height: targetRect.height + 20
          }}
        />

        <motion.div
          className="tour-guide"
          data-placement={placement}
          animate={{
            left: isExiting ? exitLeft : guideLeft,
            top: isExiting ? exitTop : guideTop,
            scale: isExiting ? 0.18 : 1,
            opacity: isExiting ? 0 : 1
          }}
          transition={{
            type: "spring",
            stiffness: 85,
            damping: 15
          }}
          style={{
            transformOrigin: "center center",
            pointerEvents: isExiting ? "none" : "auto"
          }}
        >
          <motion.img
            src={
              penguinState === "angry"
                ? "/images/penguin-angry.png"
                : penguinState === "clicked"
                ? "/images/penguin-clicked.png"
                : "/images/penguin-normal.png"
            }
            alt="Penguin"
            className="tour-penguin" style={{ cursor: 'pointer' }}
            animate={isExiting ? { scale: 0.2, y: 0 } : { y: [0, -10, 0] }}
            onClick={() => {
              if (isExiting) return;
              if (clickActionRef.current) {
                clearTimeout(clickActionRef.current);
                clickActionRef.current = null;
              }
              clickActionRef.current = window.setTimeout(() => {
                if (imageTimeoutRef.current) {
                  clearTimeout(imageTimeoutRef.current);
                  imageTimeoutRef.current = null;
                }
                setPenguinState("clicked");
                imageTimeoutRef.current = window.setTimeout(() => {
                  setPenguinState("normal");
                  imageTimeoutRef.current = null;
                }, 1000);
                clickActionRef.current = null;
              }, 200);
            }}
            onDoubleClick={() => {
              if (isExiting) return;
              if (clickActionRef.current) {
                clearTimeout(clickActionRef.current);
                clickActionRef.current = null;
              }
              if (imageTimeoutRef.current) {
                clearTimeout(imageTimeoutRef.current);
                imageTimeoutRef.current = null;
              }
              setPenguinState("angry");
              imageTimeoutRef.current = window.setTimeout(() => {
                setPenguinState("normal");
                imageTimeoutRef.current = null;
              }, 1000);
            }}
            transition={
              isExiting
                ? { duration: 0.55, ease: "easeInOut" }
                : { duration: 2, repeat: Infinity }
            }
          />

          <motion.div
            className="tour-bubble"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <h3>{steps[step].title}</h3>

            <p>{steps[step].text}</p>

            <div className="tour-buttons">
              <button
                onClick={() => {
                  setStep(Math.max(0, step - 1));
                }}
                disabled={isExiting}
              >
                Prev
              </button>

              <button onClick={finishTour} disabled={isExiting}>
                {isChatbotStep ? "Finish Tour" : "Next"}
              </button>
            </div>

            <button
              className="tour-skip"
              onClick={() => {
                if (isChatbotStep) {
                  finishTour();
                } else {
                  setStep(steps.length - 1);
                }
              }}
              disabled={isExiting}
            >
              {isChatbotStep ? "Exit through chatbot" : "Skip to chatbot"}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}