
import { useState, useEffect } from 'react';

interface ViewportState {
  height: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
}

export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportState>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    isKeyboardOpen: false,
    keyboardHeight: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialHeight = window.innerHeight;
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      
      // Debounce to avoid too many updates
      timeoutId = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        
        // Consider keyboard open if height decreased by more than 150px
        const isKeyboardOpen = heightDifference > 150;
        const keyboardHeight = isKeyboardOpen ? heightDifference : 0;

        setViewport({
          height: currentHeight,
          isKeyboardOpen,
          keyboardHeight,
        });
      }, 100);
    };

    // Initial setup
    handleResize();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
      // Reset initial height on orientation change
      setTimeout(() => {
        initialHeight = window.innerHeight;
        handleResize();
      }, 500);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewport;
};
