import { useState, useEffect } from "react";

/**
 * Hook that prevents "carry-over clicks" by enabling interactions
 * only after a specified delay when an overlay/sheet/dialog opens.
 * 
 * @param isOpen - Whether the overlay is currently open
 * @param delayMs - Delay in milliseconds before enabling interactions (default: 350ms)
 * @returns boolean indicating if interactions are enabled
 */
export const useInteractionDelay = (isOpen: boolean, delayMs: number = 350): boolean => {
  const [interactionEnabled, setInteractionEnabled] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInteractionEnabled(false);
      const timer = setTimeout(() => {
        setInteractionEnabled(true);
      }, delayMs);
      return () => clearTimeout(timer);
    } else {
      setInteractionEnabled(false);
    }
  }, [isOpen, delayMs]);

  return interactionEnabled;
};
