import { useState, useEffect, useRef, useCallback } from "react";

export type IntroStage =
  | "opening"
  | "bee-entering"
  | "bee-hovering"
  | "wings-spreading"
  | "welcome-message"
  | "homepage-transition"
  | "completed";

interface TimelineStep {
  stage: IntroStage;
  at: number;
}

export const WELCOME_TIMELINE: TimelineStep[] = [
  { stage: "opening", at: 0 },
  { stage: "bee-entering", at: 800 },
  { stage: "bee-hovering", at: 2500 },
  { stage: "wings-spreading", at: 3300 },
  { stage: "welcome-message", at: 4300 },
  { stage: "homepage-transition", at: 5800 },
  { stage: "completed", at: 6800 },
];

export const useIntroController = (onComplete: () => void) => {
  const [stage, setStage] = useState<IntroStage>("opening");
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  const completeIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearAllTimers();
    setStage("completed");
    onComplete();
  }, [clearAllTimers, onComplete]);

  useEffect(() => {
    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setStage("welcome-message");
      const timer = window.setTimeout(() => {
        completeIntro();
      }, 1000);
      timersRef.current.push(timer);
      return () => {
        clearAllTimers();
      };
    }

    // Schedule each stage
    WELCOME_TIMELINE.forEach(({ stage: s, at }) => {
      const timer = window.setTimeout(() => {
        setStage(s);
        if (s === "completed") {
          completeIntro();
        }
      }, at);
      timersRef.current.push(timer);
    });

    // Emergency final safety timeout (8.5s)
    const safetyTimer = window.setTimeout(() => {
      completeIntro();
    }, 8500);
    timersRef.current.push(safetyTimer);

    return () => {
      clearAllTimers();
    };
  }, [completeIntro, clearAllTimers]);

  return {
    stage,
    completeImmediately: completeIntro,
  };
};
