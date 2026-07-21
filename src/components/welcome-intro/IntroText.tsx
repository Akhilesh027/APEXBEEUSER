import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntroStage } from "./useIntroController";
import { slideUpFadeVariants } from "./introAnimations";

interface IntroTextProps {
  stage: IntroStage;
}

export const IntroText: React.FC<IntroTextProps> = ({ stage }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center z-30 p-6 md:p-12">
      {/* Top spacing */}
      <div className="h-16" />

      {/* Middle Text Area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl md:max-w-2xl px-4">
        <AnimatePresence mode="wait">
          {stage === "opening" && (
            <motion.div
              key="opening-text"
              variants={slideUpFadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-2"
            >
              <h2 className="text-xl md:text-3xl font-light text-[#FFF4D6] tracking-[0.2em] leading-relaxed drop-shadow-sm font-sans">
                A new journey begins…
              </h2>
            </motion.div>
          )}
          {stage === "bee-entering" && (
            <motion.div
              key="entering-text"
              variants={slideUpFadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-2"
            >
              <h2 className="text-xl md:text-2xl font-light text-[#F5B82E] tracking-[0.15em] leading-relaxed drop-shadow-sm font-sans">
                Gathering local strengths…
              </h2>
            </motion.div>
          )}
          {stage === "bee-hovering" && (
            <motion.div
              key="hovering-text"
              variants={slideUpFadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-2"
            >
              <h2 className="text-xl md:text-2xl font-medium text-[#FFF4D6] tracking-[0.15em] leading-relaxed drop-shadow-sm font-sans">
                Connecting vendors & communities…
              </h2>
            </motion.div>
          )}
          {stage === "wings-spreading" && (
            <motion.div
              key="spreading-text"
              variants={slideUpFadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-2"
            >
              <h2 className="text-xl md:text-2xl font-bold text-[#FF9D24] tracking-[0.15em] leading-relaxed drop-shadow-sm font-sans">
                Empowering the ecosystem!
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Welcome Message below the central logo */}
      <div className="absolute top-[62%] left-1/2 -translate-x-1/2 flex flex-col items-center text-center w-full px-4 max-w-xl md:max-w-2xl">
        <AnimatePresence>
          {(stage === "welcome-message" || stage === "homepage-transition") && (
            <motion.div
              key="welcome-text"
              variants={slideUpFadeVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              <div className="space-y-2">
                <h1 className="text-3xl md:text-5xl font-black text-[#F8FAFC] tracking-wider drop-shadow-lg">
                  Welcome to <span className="text-[#F5B82E]">ApexBee</span>
                </h1>
                <p className="text-xs md:text-sm text-[#AAB8CC] font-bold tracking-[0.22em] uppercase">
                  India’s Connected Business Ecosystem
                </p>
              </div>

              {/* Glowing decorative indicator */}
              <div className="w-48 h-0.5 mx-auto bg-[#F5B82E]/25 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#F5B82E] to-[#FF9D24]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </div>

              <h2 className="text-base md:text-xl text-[#FFD76A] font-extrabold tracking-[0.3em] uppercase drop-shadow-sm">
                Discover. Connect. Grow.
              </h2>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom text */}
      <div className="h-16 flex items-center justify-center">
        {stage === "opening" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 0.3 }}
            className="text-[9px] text-[#AAB8CC] tracking-[0.25em] uppercase font-bold"
          >
            Powered by ApexBee
          </motion.p>
        )}
      </div>
    </div>
  );
};
