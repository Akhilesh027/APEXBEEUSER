import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useIntroController, IntroStage } from "./useIntroController";
import { HoneycombBackground } from "./HoneycombBackground";
import { AnimatedBee } from "./AnimatedBee";
import { IntroText } from "./IntroText";
import { SkipIntroButton } from "./SkipIntroButton";
import { fadeInVariants } from "./introAnimations";

interface ApexBeeWelcomeIntroProps {
  logoSrc: string;
  onComplete: () => void;
  enableSound?: boolean;
}

export const ApexBeeWelcomeIntro: React.FC<ApexBeeWelcomeIntroProps> = ({
  logoSrc,
  onComplete,
  enableSound = false,
}) => {
  // Mobile check
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsCompact(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Intro controller hook
  const { stage, completeImmediately } = useIntroController(onComplete);

  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(enableSound);

  // Focus and Scroll Lock Restoration
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      
      // Accessibility focus shift to main-content
      setTimeout(() => {
        document.querySelector<HTMLElement>("#main-content")?.focus({
          preventScroll: true,
        });
      }, 50);
    };
  }, []);

  // Keyboard accessibility: Escape skips intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        completeImmediately();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [completeImmediately]);

  // Tab visibility change: instantly complete to avoid timeline drift
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        completeImmediately();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [completeImmediately]);

  // Synth chime player
  const playGoldChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);
        
        gain.gain.setValueAtTime(0.0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startDelay + duration);
        
        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      playTone(659.25, 0, 1.2); 
      playTone(880.00, 0.15, 1.0); 
    } catch (err) {
      // Autoplay blocked
    }
  };

  // Play chimes during wing-spreading moment
  useEffect(() => {
    if (stage === "wings-spreading" && soundEnabled) {
      playGoldChime();
    }
  }, [stage, soundEnabled]);

  if (stage === "completed") {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-[#061323] select-none flex flex-col justify-center items-center overflow-hidden"
        style={{
          background: "radial-gradient(circle at center, #0B1F35 0%, #061323 100%)"
        }}
        variants={fadeInVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Repeating glowing honeycomb grid */}
        <HoneycombBackground stage={stage} />

        {/* Skip button overlay */}
        <SkipIntroButton onSkip={completeImmediately} />

        {/* Optional sound controls button */}
        <button
          onClick={() => setSoundEnabled((prev) => !prev)}
          className="fixed top-6 left-6 z-50 bg-navy-dark/70 hover:bg-navy-dark border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 hover:text-white p-2 rounded-full shadow-lg transition-all duration-200 cursor-pointer pointer-events-auto backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          aria-label={soundEnabled ? "Mute welcome intro sound" : "Unmute welcome intro sound"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Central mascot bee with wings and logo core */}
        <AnimatedBee stage={stage} logoSrc={logoSrc} />

        {/* Welcome messages & tagline */}
        <IntroText stage={stage} />
      </motion.div>
    </AnimatePresence>
  );
};
