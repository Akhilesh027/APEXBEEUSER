import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntroStage } from "./useIntroController";
import { BeeWings } from "./BeeWings";
import { premiumEase } from "./introAnimations";

interface AnimatedBeeProps {
  stage: IntroStage;
  logoSrc: string;
}

interface TrailParticle {
  id: string;
  x: number;
  y: number;
}

export const AnimatedBee: React.FC<AnimatedBeeProps> = ({ stage, logoSrc }) => {
  const [trail, setTrail] = useState<TrailParticle[]>([]);
  const [navLogoPos, setNavLogoPos] = useState({ x: 0, y: 0, scale: 1 });

  // Calculate navbar logo position dynamically when transition starts
  useEffect(() => {
    if (stage === "homepage-transition") {
      const navLogoEl = document.querySelector('nav img[alt="logo"]') || document.querySelector('img[alt="logo"]');
      if (navLogoEl) {
        const rect = navLogoEl.getBoundingClientRect();
        
        // Hide the actual navbar logo during the flight transition
        (navLogoEl as HTMLElement).style.opacity = "0";

        // Calculate translation relative to screen center
        const targetX = rect.left + rect.width / 2 - window.innerWidth / 2;
        const targetY = rect.top + rect.height / 2 - window.innerHeight / 2;
        
        // Target scale relative to logo container size of 104px (welcome-message size)
        const targetScale = rect.width / 104;

        setNavLogoPos({ x: targetX, y: targetY, scale: targetScale });
      }
    }
  }, [stage]);

  // Clean up and restore actual logo visibility when AnimatedBee unmounts
  useEffect(() => {
    return () => {
      const navLogoEl = document.querySelector('nav img[alt="logo"]') || document.querySelector('img[alt="logo"]');
      if (navLogoEl) {
        (navLogoEl as HTMLElement).style.opacity = "1";
      }
    };
  }, []);

  // Generate flight trail particles during the entering stage
  useEffect(() => {
    if (stage !== "bee-entering") {
      setTrail([]);
      return;
    }

    let id = 0;
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now % 1700) / 1700; // loop-like estimate matching flight duration
      
      let px = 0;
      let py = 0;
      
      if (elapsed < 0.35) {
        const t = elapsed / 0.35;
        px = -60 + 40 * t; 
        py = 60 - 95 * t; 
      } else if (elapsed < 0.7) {
        const t = (elapsed - 0.35) / 0.35;
        px = -20 + 45 * t; 
        py = -35 + 20 * t; 
      } else {
        const t = (elapsed - 0.7) / 0.3;
        px = 25 - 25 * t; 
        py = -15 + 15 * t; 
      }

      setTrail((prev) => [
        ...prev.slice(-8), // Keep last 8 particles on screen
        {
          id: `trail-${id++}-${now}`,
          x: px,
          y: py,
        },
      ]);
    }, 120);

    return () => clearInterval(interval);
  }, [stage]);

  // Bezier coordinates relative to the screen center
  const flightVariants = {
    opening: {
      x: "-60vw",
      y: "60vh",
      rotate: 45,
      scale: 0.5,
      opacity: 0,
    },
    "bee-entering": {
      x: ["-60vw", "-20vw", "25vw", "0vw"],
      y: ["60vh", "-35vh", "-15vh", "0vh"],
      rotate: [45, -25, 15, 0],
      scale: [0.5, 0.8, 0.95, 1.0],
      opacity: 1,
      transition: {
        duration: 1.7, // 0.8s to 2.5s = 1.7s
        ease: premiumEase,
      },
    },
    "bee-hovering": {
      x: "0vw",
      y: ["0vh", "-2.2vh", "1vh", "0vh"],
      rotate: [0, -1.2, 1.2, 0],
      scale: 1,
      opacity: 1,
      transition: {
        y: { repeat: Infinity, duration: 2.0, ease: "easeInOut" },
        rotate: { repeat: Infinity, duration: 3.0, ease: "easeInOut" },
      },
    },
    "wings-spreading": { 
      x: "0vw", 
      y: "0vh", 
      scale: 1.15, 
      opacity: 1,
      transition: { duration: 1.0, ease: premiumEase } 
    },
    "welcome-message": { 
      x: "0vw", 
      y: "0vh", 
      scale: 1.15,
      opacity: 1,
    },
    "homepage-transition": { 
      x: `${navLogoPos.x}px`, 
      y: `${navLogoPos.y}px`, 
      scale: navLogoPos.scale, 
      opacity: [1, 1, 0.7, 0], 
      transition: { duration: 0.8, ease: premiumEase } 
    },
    completed: { x: `${navLogoPos.x}px`, y: `${navLogoPos.y}px`, scale: navLogoPos.scale, opacity: 0 },
  };

  const isWelcomeReveal = stage === "welcome-message" || stage === "homepage-transition" || stage === "completed";

  return (
    <>
      {/* Flight Trail Particles */}
      <AnimatePresence>
        {trail.map((pt) => (
          <motion.div
            key={pt.id}
            className="fixed top-1/2 left-1/2 pointer-events-none z-10 w-3 h-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            style={{
              x: `${pt.x}vw`,
              y: `${pt.y}vh`,
            }}
            initial={{ opacity: 0.5, scale: 0.7 }}
            animate={{ opacity: 0, scale: 0.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Elegant tiny glowing particle */}
            <div className="w-full h-full rounded-full bg-[#F5B82E]/50 shadow-[0_0_6px_#FF9D24]" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Bee */}
      <motion.div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center"
        variants={flightVariants}
        initial="opening"
        animate={stage}
      >
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Wings */}
          {stage !== "homepage-transition" && stage !== "completed" && (
            <BeeWings stage={stage} />
          )}

          {/* Geometric Bee Mascot Shell */}
          <motion.div 
            className="absolute w-28 h-28 flex items-center justify-center z-20"
            animate={{ 
              rotate: isWelcomeReveal ? 0 : [0, 0.5, -0.5, 0],
            }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            {/* SVG Geometric Mascot Shell (fades into background behind the logo) */}
            <motion.svg 
              className="absolute inset-0 w-full h-full text-yellow-500 drop-shadow-[0_0_15px_rgba(245,184,46,0.45)]"
              viewBox="0 0 120 120"
              fill="none"
              animate={{ opacity: isWelcomeReveal ? 0.35 : 1 }}
              transition={{ duration: 0.8 }}
            >
              {/* Antennae */}
              <path d="M 50 25 C 45 10, 30 15, 25 15" stroke="#F5B82E" strokeWidth="2" strokeLinecap="round" />
              <path d="M 70 25 C 75 10, 90 15, 95 15" stroke="#F5B82E" strokeWidth="2" strokeLinecap="round" />
              <circle cx="25" cy="15" r="2.5" fill="#FFF4D6" />
              <circle cx="95" cy="15" r="2.5" fill="#FFF4D6" />

              {/* Head */}
              <polygon points="50,25 70,25 74,38 46,38" fill="#0B1F35" stroke="#F5B82E" strokeWidth="1.5" />
              
              {/* Outer shell ring */}
              <circle cx="60" cy="65" r="30" stroke="#F5B82E" strokeWidth="2" fill="#061323" />
              
              {/* Stripes details */}
              <path d="M 35 65 L 85 65" stroke="#F5B82E" strokeWidth="1.5" strokeDasharray="3 3" />
              
              {/* Stinger */}
              <polygon points="57,95 63,95 60,108" fill="#F5B82E" />
            </motion.svg>

            {/* Core ApexBee Logo inside the bee shell */}
            <motion.div 
              className="absolute w-16 h-16 rounded-full overflow-hidden flex items-center justify-center bg-navy-dark border-2 border-yellow-500 z-30 shadow-[0_0_12px_rgba(245,184,46,0.6)]"
              animate={{ 
                scale: isWelcomeReveal ? 1.4 : 1.0,
                borderRadius: isWelcomeReveal ? "12px" : "9999px",
                width: isWelcomeReveal ? 104 : 64,
                height: isWelcomeReveal ? 104 : 64,
              }}
              transition={{ duration: 0.8, ease: premiumEase }}
            >
              <img 
                src={logoSrc} 
                alt="ApexBee Logo Core" 
                className="w-[90%] h-auto object-contain max-h-[90%]"
              />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};
