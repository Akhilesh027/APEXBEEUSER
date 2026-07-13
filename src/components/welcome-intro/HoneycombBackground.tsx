import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { IntroStage } from "./useIntroController";

interface HoneycombBackgroundProps {
  stage: IntroStage;
}

export const HoneycombBackground: React.FC<HoneycombBackgroundProps> = ({ stage }) => {
  // Generate a grid of hexagons based on typical screen size
  const hexGrid = useMemo(() => {
    const hexWidth = 90;
    const hexHeight = 78; // hexWidth * sqrt(3)/2
    const cols = 22;
    const rows = 14;
    const list = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Offset alternate columns for honeycomb layout
        const x = c * (hexWidth * 0.75);
        const y = r * hexHeight + (c % 2 === 0 ? 0 : hexHeight / 2);
        
        // Calculate coordinate relative to center to light up specific regions
        const dx = x - (cols * hexWidth * 0.75) / 2;
        const dy = y - (rows * hexHeight) / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);

        list.push({
          id: `${r}-${c}`,
          x,
          y,
          dist,
          // Probability of this cell glowing
          glowChance: Math.random() > 0.8,
        });
      }
    }
    return list;
  }, []);

  const getCellOpacity = (cell: typeof hexGrid[0]) => {
    if (stage === "opening" || stage === "bee-entering") {
      // Glow a few random cells at low opacity
      return cell.glowChance ? 0.08 : 0.02;
    }
    if (stage === "bee-hovering" || stage === "wings-spreading") {
      // Light up from center outwards
      return cell.dist < 300 ? 0.12 : 0.04;
    }
    if (stage === "ecosystem-reveal" || stage === "business-journey") {
      // General pulse or network wave
      return cell.glowChance ? 0.14 : 0.05;
    }
    if (stage === "brand-reveal" || stage === "homepage-transition") {
      // Fading back
      return 0.03;
    }
    return 0.01;
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="golden-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F5B82E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#061323" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Honeycomb grid */}
        <g>
          {hexGrid.map((cell) => (
            <motion.path
              key={cell.id}
              d={`M ${cell.x + 22.5} ${cell.y} 
                 L ${cell.x + 67.5} ${cell.y} 
                 L ${cell.x + 90} ${cell.y + 39} 
                 L ${cell.x + 67.5} ${cell.y + 78} 
                 L ${cell.x + 22.5} ${cell.y + 78} 
                 L ${cell.x} ${cell.y + 39} Z`}
              fill="none"
              stroke="#F5B82E"
              strokeWidth="0.8"
              initial={{ opacity: 0.02 }}
              animate={{ opacity: getCellOpacity(cell) }}
              transition={{ duration: 1.2 }}
            />
          ))}
        </g>

        {/* Golden ambient lighting from center/sides */}
        <motion.circle
          cx="50%"
          cy="50%"
          r="40%"
          fill="url(#golden-pulse)"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: stage === "wings-spreading" || stage === "ecosystem-reveal" ? 1 : 0.4 
          }}
          transition={{ duration: 1.5 }}
        />
      </svg>
    </div>
  );
};
