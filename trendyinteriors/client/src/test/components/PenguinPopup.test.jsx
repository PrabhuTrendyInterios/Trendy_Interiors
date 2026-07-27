import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

let mockReducedMotion = true;

jest.mock("framer-motion", () => {
  const ReactModule = require("react");
  const motionComponent = (tag) =>
    ReactModule.forwardRef(
      (
        {
          initial,
          animate,
          exit,
          transition,
          whileHover,
          whileTap,
          ...props
        },
        ref
      ) => ReactModule.createElement(tag, { ...props, ref })
    );

  return {
    AnimatePresence: ({ children }) => <>{children}</>,
    motion: {
      aside: motionComponent("aside"),
      img: motionComponent("img"),
      section: motionComponent("section"),
    },
    useReducedMotion: () => mockReducedMotion,
  };
});

const PenguinPopup = require("../../components/PenguinPopup").default;
const PopupCardModule = require("../../components/PopupCard");
const PopupCard = PopupCardModule.default;
const { TRENDY_BOT_POPUP_CONFIG } = PopupCardModule;

describe("PenguinPopup", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReducedMotion = true;
    window.sessionStorage.clear();
    window.localStorage.clear();
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  const renderPopup = (props = {}) =>
    render(
      <PenguinPopup
        title="Quick Update"
        description="A compact project update."
        actionLabel="View Details"
        showDelay={1200}
        storageKey="penguin-test-v1"
        {...props}
      />
    );

  test("site configuration keeps the panel visible for five seconds", () => {
    expect(TRENDY_BOT_POPUP_CONFIG.autoCloseDuration).toBe(5000);
    expect(TRENDY_BOT_POPUP_CONFIG.inactivityDelay).toBe(10000);
    expect(TRENDY_BOT_POPUP_CONFIG.storageType).toBe("none");
  });

  test("site popup resets on activity and rearms after automatic close", () => {
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <PopupCard />
      </MemoryRouter>
    );

    act(() => jest.advanceTimersByTime(9999));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.pointerMove(window);
    act(() => jest.advanceTimersByTime(9999));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    act(() => jest.advanceTimersByTime(0));
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => jest.advanceTimersByTime(5000));
    act(() => jest.advanceTimersByTime(180));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(9999));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    act(() => jest.advanceTimersByTime(0));
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("holds the desktop bottom peek before revealing the information panel", () => {
    mockReducedMotion = false;
    const { container } = renderPopup({ showDelay: 0, storageType: "none" });

    act(() => jest.advanceTimersByTime(0));
    const popup = screen.getByRole("status");
    expect(popup).toHaveAttribute("data-phase", "peek");
    expect(container.querySelector(".penguin-popup__mascot")).toHaveAttribute(
      "src",
      "/assets/trendy-bot/trendy-bot-peek-desktop.webp"
    );
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1699));
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(popup).toHaveAttribute("data-phase", "presenting");
    expect(screen.getByText("Quick Update")).toBeInTheDocument();
    expect(container.querySelector(".penguin-popup__mascot")).toHaveAttribute(
      "src",
      "/assets/trendy-bot/trendy-bot-present.webp"
    );
  });

  test("uses the right-side peek pose on mobile", () => {
    mockReducedMotion = false;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    const { container } = renderPopup({ showDelay: 0, storageType: "none" });
    act(() => jest.advanceTimersByTime(0));

    expect(screen.getByRole("status")).toHaveAttribute("data-phase", "peek");
    expect(container.querySelector(".penguin-popup__mascot")).toHaveAttribute(
      "src",
      "/assets/trendy-bot/trendy-bot-peek-mobile.webp"
    );
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();
  });

  test("shows configurable content after the configured delay", () => {
    renderPopup();

    act(() => jest.advanceTimersByTime(1199));
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();

    act(() => jest.advanceTimersByTime(1));
    expect(screen.getByRole("heading", { name: "Quick Update" })).toBeInTheDocument();
    expect(screen.getByText("A compact project update.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Details" })).toBeInTheDocument();
  });

  test("remembers dismissal in session storage after the exit finishes", () => {
    const onClose = jest.fn();
    const { unmount } = renderPopup({ onClose });
    act(() => jest.advanceTimersByTime(1200));

    fireEvent.click(screen.getByRole("button", { name: "Close popup" }));
    expect(window.sessionStorage.getItem("penguin-test-v1")).toBe("dismissed");

    act(() => jest.advanceTimersByTime(180));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();

    unmount();
    renderPopup();
    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();
  });

  test("shows again when the storage key changes", () => {
    window.sessionStorage.setItem("penguin-test-v1", "dismissed");
    const { rerender } = renderPopup();

    act(() => jest.advanceTimersByTime(5000));
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();

    rerender(
      <PenguinPopup
        title="Quick Update"
        description="A compact project update."
        actionLabel="View Details"
        showDelay={1200}
        storageKey="penguin-test-v2"
      />
    );
    act(() => jest.advanceTimersByTime(1200));
    expect(screen.getByText("Quick Update")).toBeInTheDocument();
  });

  test("supports Escape dismissal without moving focus", () => {
    const onClose = jest.fn();
    renderPopup({ onClose });
    act(() => jest.advanceTimersByTime(1200));

    fireEvent.keyDown(window, { key: "Escape" });
    act(() => jest.advanceTimersByTime(180));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();
  });

  test("pauses an enabled auto-close timer while hovered on desktop", () => {
    renderPopup({ autoCloseDuration: 1000 });
    act(() => jest.advanceTimersByTime(1200));

    const popup = screen.getByRole("status");
    fireEvent.mouseEnter(popup);
    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByText("Quick Update")).toBeInTheDocument();

    fireEvent.mouseLeave(popup);
    act(() => jest.advanceTimersByTime(1000));
    act(() => jest.advanceTimersByTime(180));
    expect(screen.queryByText("Quick Update")).not.toBeInTheDocument();
  });
});
