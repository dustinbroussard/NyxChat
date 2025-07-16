
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToBottomButtonProps {
  visible: boolean;
  onClick: () => void;
}

export const ScrollToBottomButton = ({ visible, onClick }: ScrollToBottomButtonProps) => {
  if (!visible) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Button
        size="icon"
        onClick={onClick}
        className="h-10 w-10 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground animate-fade-in"
      >
        <ChevronDown className="h-5 w-5" />
      </Button>
    </div>
  );
};
