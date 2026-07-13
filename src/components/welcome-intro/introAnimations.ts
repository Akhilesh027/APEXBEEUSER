export const premiumEase = [0.22, 1, 0.36, 1];
export const softEase = [0.16, 1, 0.3, 1];

export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.6, ease: premiumEase } 
  },
  exit: { 
    opacity: 0, 
    transition: { duration: 0.4, ease: softEase } 
  }
};

export const slideUpFadeVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.7, ease: premiumEase } 
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.5, ease: softEase } 
  }
};

export const nodeVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: premiumEase
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.4, ease: softEase }
  }
};

export const lineDrawVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 0.6,
    transition: {
      pathLength: { delay: i * 0.15, duration: 0.6, ease: premiumEase },
      opacity: { delay: i * 0.15, duration: 0.3 }
    }
  }),
  exit: {
    pathLength: 0,
    opacity: 0,
    transition: { duration: 0.4, ease: softEase }
  }
};

export const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.3, 0.6, 0.3],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};
