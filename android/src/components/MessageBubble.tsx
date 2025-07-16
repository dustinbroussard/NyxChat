
import { useState } from 'react';
import { Message } from '@/types';
import { cn } from '@/lib/utils';
import { User, Bot, Copy, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
  isError?: boolean;
}

export const MessageBubble = ({ message, onRetry, isError = false }: MessageBubbleProps) => {
  const [isCopying, setIsCopying] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    if (isCopying) return;
    
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Message copied to clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Failed to copy message');
    } finally {
      setTimeout(() => setIsCopying(false), 1000);
    }
  };

  const handleRetry = async () => {
    if (isRetrying || !onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      toast.success('Retrying message...');
    } catch (error) {
      console.error('Retry failed:', error);
      toast.error('Failed to retry message');
    } finally {
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  // Enhanced text formatting with better line breaks and markdown-like formatting
  const formatText = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => (
        <span key={index}>
          {line}
          {index < text.split('\n').length - 1 && <br />}
        </span>
      ));
  };

  return (
    <div className={cn(
      "flex gap-4 max-w-4xl group animate-fade-in-up",
      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      <div className={cn(
        "flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200 hover:shadow-lg",
        isUser 
          ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground" 
          : "bg-gradient-to-br from-muted to-muted/80 glass-effect",
        isError && !isUser && "bg-gradient-to-br from-destructive/20 to-destructive/10 border border-destructive/30"
      )}>
        {isUser ? (
          <User className="w-5 h-5" />
        ) : isError ? (
          <AlertTriangle className="w-5 h-5 text-destructive" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      
      <div className={cn(
        "rounded-2xl px-5 py-3 max-w-[80%] relative shadow-lg transition-all duration-200 hover:shadow-xl",
        isUser 
          ? "message-user" 
          : isError 
            ? "bg-destructive/10 border border-destructive/30 text-destructive"
            : "message-ai"
      )}>
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {formatText(message.content)}
        </div>
        
        {isError && (
          <div className="text-xs text-destructive/70 mt-2 font-medium">
            Failed to send • Click retry to try again
          </div>
        )}
        
        <time className={cn(
          "text-xs opacity-60 mt-2 block font-medium",
          isError && "text-destructive/60"
        )}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </time>
        
        {/* Action buttons with improved states */}
        <div className={cn(
          "absolute -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0",
          isUser ? "-left-2" : "-right-2"
        )}>
          <Button
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0 rounded-xl shadow-lg hover:shadow-xl bg-background/90 backdrop-blur-sm border border-border/50 button-modern transition-all duration-200"
            onClick={handleCopy}
            disabled={isCopying}
          >
            <Copy className={cn("w-3.5 h-3.5", isCopying && "animate-pulse")} />
          </Button>
          {!isUser && onRetry && (
            <Button
              variant="secondary"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 rounded-xl shadow-lg hover:shadow-xl bg-background/90 backdrop-blur-sm border border-border/50 button-modern transition-all duration-200",
                isError && "border-destructive/30 hover:bg-destructive/10"
              )}
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RotateCcw className={cn("w-3.5 h-3.5", isRetrying && "animate-spin")} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
