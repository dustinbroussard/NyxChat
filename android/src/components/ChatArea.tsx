
import { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ScrollToBottomButton } from './ScrollToBottomButton';
import { Download, Trash2 } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useViewport } from '@/hooks/useViewport';
import { toast } from 'sonner';

interface ChatAreaProps {
  conversation: Conversation | undefined;
  isLoading: boolean;
  onRetryMessage?: (messageId: string) => void;
}

export const ChatArea = ({ conversation, isLoading, onRetryMessage }: ChatAreaProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const { updateConversation } = useConversations();
  const { height: viewportHeight, isKeyboardOpen, keyboardHeight } = useViewport();

  // Force scroll to bottom - using useLayoutEffect for immediate DOM update
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100;
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Handle scroll events to show/hide scroll button
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;
    
    const isAtBottom = checkIfAtBottom();
    setShowScrollButton(!isAtBottom);
    
    if (!isAtBottom) {
      setIsUserScrolling(true);
    } else {
      setIsUserScrolling(false);
    }
  }, [checkIfAtBottom]);

  // Auto-scroll when new messages arrive - using useLayoutEffect for immediate response
  useLayoutEffect(() => {
    if (!conversation?.messages.length) return;
    
    // Always scroll to bottom for new messages unless user is actively scrolling up
    if (!isUserScrolling) {
      // Use instant scroll for first message, smooth for subsequent
      const behavior = conversation.messages.length === 1 ? 'instant' : 'smooth';
      scrollToBottom(behavior);
    }
  }, [conversation?.messages, isUserScrolling, scrollToBottom]);

  // Reset user scrolling state when conversation changes
  useEffect(() => {
    if (!conversation?.messages.length) {
      setIsUserScrolling(false);
      setShowScrollButton(false);
    }
  }, [conversation?.id]);

  // Handle scroll to bottom button click
  const handleScrollToBottom = useCallback(() => {
    setIsUserScrolling(false);
    scrollToBottom('smooth');
  }, [scrollToBottom]);

  // Dynamic height calculation based on viewport and keyboard
  const chatContainerStyle = {
    height: isKeyboardOpen 
      ? `${viewportHeight - keyboardHeight - 140}px` // Account for header + footer
      : 'calc(100vh - 140px)',
    maxHeight: isKeyboardOpen 
      ? `${viewportHeight - keyboardHeight - 140}px`
      : 'calc(100vh - 140px)',
  };

  const exportChat = () => {
    if (!conversation) return;
    
    try {
      const chatData = {
        title: conversation.title,
        createdAt: new Date(conversation.createdAt).toISOString(),
        messages: conversation.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString()
        }))
      };
      
      const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Chat exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export chat');
    }
  };

  const clearChat = () => {
    if (!conversation) return;
    
    if (window.confirm('Are you sure you want to clear this conversation? This action cannot be undone.')) {
      updateConversation(conversation.id, { messages: [] });
      toast.success('Chat cleared');
    }
  };

  if (!conversation || conversation.messages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Chat Actions */}
      <div className="flex justify-end gap-2 p-4 border-b border-border/30 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={exportChat}
          className="flex items-center gap-2 hover:bg-accent/50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          className="flex items-center gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </Button>
      </div>

      {/* Scrollable Chat Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth min-h-0"
        style={chatContainerStyle}
        onScroll={handleScroll}
      >
        <div className="space-y-6 p-6 pb-8 min-h-full">
          {conversation.messages.map((message, index) => (
            <div 
              key={`${message.id}-${message.timestamp}-${index}`}
              className="animate-fade-in-up"
              style={{ 
                animationDelay: `${Math.min(index * 0.05, 0.3)}s`,
                animationFillMode: 'both'
              }}
            >
              <MessageBubble 
                message={message}
                onRetry={message.role === 'assistant' ? () => onRetryMessage?.(message.id) : undefined}
              />
            </div>
          ))}
          {isLoading && (
            <div className="animate-scale-in" style={{ animationFillMode: 'both' }}>
              <TypingIndicator />
            </div>
          )}
          {/* Scroll anchor */}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      <ScrollToBottomButton 
        visible={showScrollButton}
        onClick={handleScrollToBottom}
      />
    </div>
  );
};
