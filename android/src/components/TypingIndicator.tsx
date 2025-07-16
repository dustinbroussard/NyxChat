
import { useEffect, useState } from 'react';
import { Bot } from 'lucide-react';

export const TypingIndicator = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay visibility to prevent flash for quick responses
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="flex gap-4 max-w-4xl mr-auto animate-fade-in">
      <div className="flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-muted to-muted/80 glass-effect shadow-md">
        <Bot className="w-5 h-5 animate-pulse" />
      </div>
      
      <div className="rounded-2xl px-5 py-4 bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm border border-border/30 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div 
              className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" 
              style={{ animationDelay: '0ms', animationDuration: '1.2s' }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" 
              style={{ animationDelay: '200ms', animationDuration: '1.2s' }} 
            />
            <div 
              className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" 
              style={{ animationDelay: '400ms', animationDuration: '1.2s' }} 
            />
          </div>
          <span className="text-xs text-muted-foreground ml-2 animate-pulse">
            Thinking...
          </span>
        </div>
      </div>
    </div>
  );
};
