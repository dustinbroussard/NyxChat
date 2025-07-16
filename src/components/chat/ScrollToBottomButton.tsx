
import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToBottomButtonProps {
  show: boolean;
  onClick: () => void;
  keyboardHeight?: number;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({
  show,
  onClick,
  keyboardHeight = 0
}) => {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed right-4 z-30 h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-105"
      style={{
        bottom: keyboardHeight > 0 
          ? 'calc(56px + 1rem)' 
          : 'calc(56px + 1rem + env(safe-area-inset-bottom, 8px))', // Position above the footer with proper spacing
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
      }}
    >
      <ChevronDown className="h-5 w-5" />
    </Button>
  );
};
