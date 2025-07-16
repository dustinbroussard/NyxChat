
import React, { useState, useRef, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Download, Trash2 } from 'lucide-react';

interface LongPressContextMenuProps {
  children: React.ReactNode;
  onExport?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const LongPressContextMenu: React.FC<LongPressContextMenuProps> = ({
  children,
  onExport,
  onDelete,
  disabled = false
}) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    
    touchStartTimeRef.current = Date.now();
    setIsLongPress(false);
    
    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
      // Stronger haptic feedback for long press
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }, 500);
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    const touchDuration = Date.now() - touchStartTimeRef.current;
    if (touchDuration < 500) {
      setIsLongPress(false);
    }
  }, []);

  const handleMouseDown = useCallback(() => {
    if (disabled) return;
    
    setIsLongPress(false);
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPress(true);
    }, 500);
  }, [disabled]);

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setIsLongPress(false);
  }, []);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className={`transition-all duration-200 ${isLongPress ? 'scale-95 opacity-80' : ''}`}
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 animate-in fade-in duration-200">
        {onExport && (
          <ContextMenuItem 
            onClick={onExport}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export
          </ContextMenuItem>
        )}
        {onDelete && (
          <ContextMenuItem 
            onClick={onDelete}
            className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
