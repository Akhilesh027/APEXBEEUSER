import React from "react";
import { motion } from "framer-motion";
import { IntroStage } from "./useIntroController";

interface BeeWingsProps {
  stage: IntroStage;
}

export const BeeWings: React.FC<BeeWingsProps> = ({ stage }) => {
  // Determine wing state based on the current stage
  const isFlying = stage === "bee-entering";
  const isHovering = stage === "bee-hovering";
  const isSpreading = 
    stage === "wings-spreading" || 
    stage === "ecosystem-reveal" || 
    stage === "business-journey" ||
    stage === "brand-reveal";

  // Animation values for left wing
  const leftWingVariants = {
    flying: {
      rotateY: [0, 75, 0],
      rotateZ: [-5, 10, -5],
      transition: {
        repeat: Infinity,
        duration: 0.12,
        ease: "linear"
      }
    },
    hovering: {
      rotateY: [0, 60, 0],
      rotateZ: [-2, 8, -2],
      transition: {
        repeat: Infinity,
        duration: 0.25,
        ease: "easeInOut"
      }
    },
    spreading: {
      rotateY: 20,
      rotateZ: -45,
      scale: 1.15,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    default: {
      rotateY: 0,
      rotateZ: 0,
      scale: 1
    }
  };

  // Animation values for right wing
  const rightWingVariants = {
    flying: {
      rotateY: [0, 75, 0],
      rotateZ: [5, -10, 5],
      transition: {
        repeat: Infinity,
        duration: 0.12,
        ease: "linear"
      }
    },
    hovering: {
      rotateY: [0, 60, 0],
      rotateZ: [2, -8, 2],
      transition: {
        repeat: Infinity,
        duration: 0.25,
        ease: "easeInOut"
      }
    },
    spreading: {
      rotateY: -20,
      rotateZ: 45,
      scale: 1.15,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    },
    default: {
      rotateY: 0,
      rotateZ: 0,
      scale: 1
    }
  };

  const getWingState = () => {
    if (isFlying) return "flying";
    if (isHovering) return "hovering";
    if (isSpreading) return "spreading";
    return "default";
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex justify-center items-center z-10">
      {/* Container for both wings */}
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Left Wing */}
        <motion.div
          className="absolute right-[51%] bottom-[50%] w-24 h-16 origin-right-bottom"
          variants={leftWingVariants}
          animate={getWingState()}
          style={{ perspective: 600 }}
        >
          <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(245,184,46,0.6)]" viewBox="0 0 100 60" fill="none">
            {/* Elegant semi-transparent wing shape */}
            <path
              d="M 100 60 C 85 45, 60 10, 10 5 C 2 3, 2 12, 15 22 C 30 32, 70 50, 100 60 Z"
              fill="url(#left-wing-grad)"
              fillOpacity="0.45"
              stroke="#F5B82E"
              strokeWidth="1.2"
            />
            {/* Wing veins */}
            <path d="M 100 60 C 75 42, 50 25, 20 18" stroke="#F5B82E" strokeWidth="0.6" strokeOpacity="0.7" />
            <path d="M 100 60 C 80 48, 65 38, 45 35" stroke="#F5B82E" strokeWidth="0.6" strokeOpacity="0.6" />
            <path d="M 65 38 C 50 30, 35 25, 25 24" stroke="#F5B82E" strokeWidth="0.4" strokeOpacity="0.5" />
            
            <defs>
              <linearGradient id="left-wing-grad" x1="100%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#FFF4D6" />
                <stop offset="70%" stopColor="#F5B82E" />
                <stop offset="100%" stopColor="#FF9D24" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Right Wing */}
        <motion.div
          className="absolute left-[51%] bottom-[50%] w-24 h-16 origin-left-bottom"
          variants={rightWingVariants}
          animate={getWingState()}
          style={{ perspective: 600 }}
        >
          <svg className="w-full h-full drop-shadow-[0_0_8px_rgba(245,184,46,0.6)]" viewBox="0 0 100 60" fill="none">
            {/* Elegant semi-transparent wing shape */}
            <path
              d="M 0 60 C 15 45, 40 10, 90 5 C 98 3, 98 12, 85 22 C 70 32, 30 50, 0 60 Z"
              fill="url(#right-wing-grad)"
              fillOpacity="0.45"
              stroke="#F5B82E"
              strokeWidth="1.2"
            />
            {/* Wing veins */}
            <path d="M 0 60 C 25 42, 50 25, 80 18" stroke="#F5B82E" strokeWidth="0.6" strokeOpacity="0.7" />
            <path d="M 0 60 C 20 48, 35 38, 55 35" stroke="#F5B82E" strokeWidth="0.6" strokeOpacity="0.6" />
            <path d="M 35 38 C 50 30, 65 25, 75 24" stroke="#F5B82E" strokeWidth="0.4" strokeOpacity="0.5" />

            <defs>
              <linearGradient id="right-wing-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFF4D6" />
                <stop offset="70%" stopColor="#F5B82E" />
                <stop offset="100%" stopColor="#FF9D24" stopOpacity="0.2" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>
    </div>
  );
};
