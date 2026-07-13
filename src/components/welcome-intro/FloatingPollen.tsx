import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { IntroStage } from "./useIntroController";

interface FloatingPollenProps {
  stage: IntroStage;
}

interface Particle {
  id: number;
  x: number; // percentage width 0-100
  y: number; // percentage height 0-100
  size: number; // px
  delay: number; // s
  duration: number; // s
  driftX: number; // distance to drift horizontally (vw)
  driftY: number; // distance to drift vertically (vh)
  blur: boolean; // depth of field blur
  opacity: number;
}

export const FloatingPollen: React.FC<FloatingPollenProps> = ({ stage }) => {
  const count = 35; // Perfect density without causing lag

  // Pre-calculate stable random values for the particles
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = Math.random() * 3 + 1; // 1px to 4px
      return {
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        delay: Math.random() * -20, // Negative delay so animations are pre-warmed
        duration: Math.random() * 15 + 15, // Slow drifting duration: 15s to 30s
        driftX: (Math.random() - 0.5) * 8, // Drift range: -4vw to +4vw
        driftY: (Math.random() - 0.5) * 8, // Drift range: -4vh to +4vh
        blur: size > 2.5 && Math.random() > 0.5,
        opacity: Math.random() * 0.4 + 0.15, // Subtle glow opacity: 0.15 to 0.55
      };
    });
  }, []);

  // Hide particles completely when welcome transition is finished
  const isTransitioning = stage === "homepage-transition" || stage === "completed";
  const isActive = stage !== "completed";

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => {
        // React physically to different animation stages
        let scaleFactor = 1.0;
        let opacityFactor = 1.0;

        if (stage === "bee-entering") {
          // Fast movement as the bee flies in
          scaleFactor = 1.15;
          opacityFactor = 1.1;
        } else if (stage === "wings-spreading" || stage === "welcome-message") {
          // Settle down and glow brighter with the mascot expansion
          scaleFactor = 1.35;
          opacityFactor = 1.25;
        } else if (isTransitioning) {
          // Fade away with the screen transition
          opacityFactor = 0;
        }

        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-gradient-to-br from-[#F5B82E] to-[#FF9D24] shadow-[0_0_8px_rgba(245,184,46,0.5)]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              filter: p.blur ? "blur(1px)" : "none",
            }}
            animate={{
              x: [0, `${p.driftX}vw`, 0],
              y: [0, `${p.driftY}vh`, 0],
              opacity: isTransitioning ? 0 : [p.opacity * opacityFactor, p.opacity * 0.3 * opacityFactor, p.opacity * opacityFactor],
              scale: isTransitioning ? 0.2 : scaleFactor,
            }}
            transition={{
              x: {
                repeat: Infinity,
                duration: p.duration,
                ease: "easeInOut",
                delay: p.delay,
              },
              y: {
                repeat: Infinity,
                duration: p.duration * 1.2,
                ease: "easeInOut",
                delay: p.delay,
              },
              opacity: {
                repeat: isTransitioning ? undefined : Infinity,
                duration: isTransitioning ? 0.5 : p.duration * 0.8,
                ease: "easeInOut",
                delay: isTransitioning ? undefined : p.delay,
              },
              scale: {
                duration: isTransitioning ? 0.5 : 0.6,
                ease: "easeOut",
              },
            }}
          />
        );
      })}
    </div>
  );
};
