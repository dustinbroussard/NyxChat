
import React, { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { WelcomeScreen } from "@/components/chat/WelcomeScreen";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatFooter } from "@/components/chat/ChatFooter";
import { ScrollToBottomButton } from "@/components/chat/ScrollToBottomButton";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { useChat } from "@/contexts/ChatContext";
import { useSidebar } from '@/components/ui/sidebar';
import "@/styles/mobile-keyboard.css";

interface ChatInterfaceProps {
  keyboardHeight: number;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ keyboardHeight }) => {
  const {
    currentConversation,
    isTyping,
    sendMessage,
  } = useChat();
  const { setOpenMobile } = useSidebar();

  const [inputValue, setInputValue] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() => currentConversation?.messages || [], [currentConversation]);
  const showWelcome = messages.length === 0;

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!showWelcome) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isTyping, showWelcome]);

  // Monitor scroll position for scroll-to-bottom button
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || showWelcome) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 3);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages.length, showWelcome]);

  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    const message = inputValue.trim();
    setInputValue("");

    await sendMessage(message);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      } else {
        e.preventDefault();
        handleSend();
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    setShowScrollToBottom(false);
  };

  return (
    <div className="chat-interface bg-gradient-to-br from-background to-background/95 overflow-hidden">
      <AppHeader isOnline={isOnline} />

      {/* Main Content - Fixed mobile layout */}
      <div className="chat-content pt-16">
        {showWelcome ? (
          <div className="flex-1 overflow-hidden" style={{ 
            paddingBottom: '56px',
            height: 'calc(100% - 56px)'
          }}>
            <WelcomeScreen 
              onQuickPrompt={handleQuickPrompt}
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              isTyping={isTyping}
            />
          </div>
        ) : (
          <div 
            ref={messagesContainerRef}
            className="messages-container scroll-smooth custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-6 px-4 py-4 pb-8">
              {messages.map((message, index) => (
                <div 
                  key={message.id}
                  className="opacity-100 transition-opacity duration-300"
                >
                  <ChatMessage
                    message={message}
                    index={index}
                  />
                </div>
              ))}
              {isTyping && (
                <div className="opacity-100 transition-opacity duration-300">
                  <TypingIndicator />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      <ScrollToBottomButton
        show={showScrollToBottom && !showWelcome}
        onClick={scrollToBottom}
        keyboardHeight={keyboardHeight}
      />

      <ChatFooter
        inputValue={inputValue}
        setInputValue={setInputValue}
        onSend={handleSend}
        onKeyDown={handleKeyDown}
        isTyping={isTyping}
        keyboardHeight={keyboardHeight}
      />

      <AppFooter />
      
      <SettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
};

export default ChatInterface;
