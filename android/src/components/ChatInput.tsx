
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useViewport } from '@/hooks/useViewport';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSendMessage, disabled, placeholder }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isKeyboardOpen } = useViewport();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Focus management for mobile
  useEffect(() => {
    if (isKeyboardOpen && textareaRef.current) {
      textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isKeyboardOpen]);

  return (
    <div 
      className={`border-t border-border/30 bg-background/95 backdrop-blur-sm transition-all duration-200 ${
        isKeyboardOpen ? 'pb-2' : 'pb-6'
      }`}
      style={{
        position: isKeyboardOpen ? 'relative' : 'sticky',
        bottom: 0,
        zIndex: 10,
      }}
    >
      <div className="p-6 pt-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || "Type your message..."}
              disabled={disabled}
              className="min-h-[52px] max-h-[120px] resize-none rounded-2xl border-2 border-border/20 bg-background/50 backdrop-blur-sm focus:border-primary/40 focus:bg-background/80 transition-all duration-200 pr-12"
              rows={1}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              <span className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg">
                Enter to send • Shift+Enter for new line
              </span>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon"
            disabled={!message.trim() || disabled}
            className="flex-shrink-0 h-[52px] w-[52px] rounded-2xl shadow-lg hover:shadow-xl"
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};
