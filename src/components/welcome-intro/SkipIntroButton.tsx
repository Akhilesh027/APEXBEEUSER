import React from "react";
import { ChevronRight } from "lucide-react";

interface SkipIntroButtonProps {
  onSkip: () => void;
}

export const SkipIntroButton: React.FC<SkipIntroButtonProps> = ({ onSkip }) => {
  return (
    <button
      onClick={onSkip}
      className="fixed top-6 right-6 z-50 bg-navy-dark/70 hover:bg-navy-dark border border-yellow-500/30 hover:border-yellow-500/60 text-yellow-500 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-lg flex items-center gap-1 cursor-pointer pointer-events-auto backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
      aria-label="Skip welcome animation"
    >
      <span>Skip</span>
      <span className="hidden sm:inline text-[10px] opacity-60 ml-0.5">(Esc)</span>
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  );
};
