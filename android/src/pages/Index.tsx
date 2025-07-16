
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatArea } from '@/components/ChatArea';
import { ChatInput } from '@/components/ChatInput';
import { ProfileModal } from '@/components/ProfileModal';
import { MemoryModal } from '@/components/MemoryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { VoiceMode } from '@/components/VoiceMode';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { useConversations } from '@/hooks/useConversations';
import { useProfiles } from '@/hooks/useProfiles';
import { useMemory } from '@/hooks/useMemory';
import { useOpenRouter } from '@/hooks/useOpenRouter';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  
  const { theme } = useTheme();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversationId, 
    createConversation,
    updateConversationTitle,
    deleteConversation,
    isLoaded
  } = useConversations();
  
  const { 
    profiles, 
    activeProfile, 
    setActiveProfile, 
    createProfile, 
    updateProfile, 
    deleteProfile 
  } = useProfiles();
  
  const { memory, updateMemory } = useMemory();
  const { sendMessage, retryMessage, isLoading } = useOpenRouter();

  // Find active conversation
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (profileModalOpen) setProfileModalOpen(false);
        if (memoryModalOpen) setMemoryModalOpen(false);
        if (settingsModalOpen) setSettingsModalOpen(false);
        if (sidebarOpen) setSidebarOpen(false);
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            handleNewChat();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profileModalOpen, memoryModalOpen, settingsModalOpen, sidebarOpen]);

  const handleSendMessage = async (message: string) => {
    if (!isLoaded) {
      console.log('Data not loaded yet, waiting...');
      return;
    }

    if (!activeProfile) {
      toast.error('Please create a profile first');
      return;
    }

    setHasStartedChat(true);

    let conversationId = activeConversationId;
    
    // Create new conversation if needed
    if (!conversationId || !conversations.find(c => c.id === conversationId)) {
      const newConversation = createConversation();
      conversationId = newConversation.id;
      setActiveConversationId(conversationId);
    }

    try {
      await sendMessage({
        message,
        conversationId: conversationId!,
        profile: activeProfile,
        memory: memory.content
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    if (!activeConversation || !activeProfile) {
      toast.error('Unable to retry: missing conversation or profile');
      return;
    }
    
    const messageIndex = activeConversation.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) {
      toast.error('Message not found for retry');
      return;
    }
    
    const userMessage = activeConversation.messages
      .slice(0, messageIndex)
      .reverse()
      .find(m => m.role === 'user');
    
    if (userMessage) {
      try {
        await retryMessage({
          message: userMessage.content,
          conversationId: activeConversation.id,
          profile: activeProfile,
          memory: memory.content
        });
      } catch (error) {
        console.error('Retry failed:', error);
        toast.error('Retry failed. Please try again.');
      }
    } else {
      toast.error('No user message found to retry');
    }
  };

  const handleNewChat = () => {
    const newConversation = createConversation();
    setActiveConversationId(newConversation.id);
    setSidebarOpen(false);
    setHasStartedChat(false);
  };

  const handleQuickAction = (prompt: string) => {
    handleSendMessage(prompt);
  };

  // Improved welcome screen logic
  const showWelcomeScreen = isLoaded && (
    !hasStartedChat && 
    (!activeConversation || activeConversation.messages.length === 0) &&
    !isLoading
  );

  // Show loading spinner only when data is not loaded
  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-background text-foreground items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading NyxChat...</p>
        </div>
      </div>
    );
  }

  // Voice mode
  if (voiceModeOpen) {
    return (
      <VoiceMode
        activeProfile={activeProfile}
        memory={memory}
        onSettingsClick={() => setSettingsModalOpen(true)}
        onBackToChat={() => setVoiceModeOpen(false)}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onConversationSelect={(id) => {
          setActiveConversationId(id);
          setSidebarOpen(false);
          setHasStartedChat(true);
        }}
        onNewChat={handleNewChat}
        onRenameConversation={updateConversationTitle}
        onDeleteConversation={deleteConversation}
        onProfilesClick={() => setProfileModalOpen(true)}
        onMemoryClick={() => setMemoryModalOpen(true)}
        onSettingsClick={() => setSettingsModalOpen(true)}
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChange={setActiveProfile}
      />

      {/* Main Content - Proper flex layout for chat */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0">
          <ChatHeader
            conversationTitle={activeConversation?.title || 'NyxChat'}
            activeProfile={activeProfile}
            onMenuToggle={() => setSidebarOpen(true)}
            onVoiceModeToggle={() => setVoiceModeOpen(true)}
          />
        </div>

        {/* Chat Content Area - Flexible height */}
        <div className="flex-1 flex flex-col min-h-0">
          {showWelcomeScreen ? (
            <div className="flex-1 animate-fade-in-up">
              <WelcomeScreen onQuickAction={handleQuickAction} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 animate-slide-in-left">
              <ChatArea
                conversation={activeConversation}
                isLoading={isLoading}
                onRetryMessage={handleRetryMessage}
              />
            </div>
          )}
        </div>

        {/* Footer - Fixed height */}
        <div className="flex-shrink-0">
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={isLoading || !activeProfile}
            placeholder={
              !activeProfile 
                ? "Please create a profile first..." 
                : isLoading
                  ? "AI is responding..."
                  : "Type your message..."
            }
          />
        </div>
      </div>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Modals */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profiles={profiles}
        activeProfile={activeProfile}
        onCreateProfile={createProfile}
        onUpdateProfile={updateProfile}
        onDeleteProfile={deleteProfile}
        onSetActiveProfile={setActiveProfile}
      />

      <MemoryModal
        isOpen={memoryModalOpen}
        onClose={() => setMemoryModalOpen(false)}
        memory={memory}
        onUpdateMemory={updateMemory}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          tabIndex={0}
          role="button"
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
};

export default Index;
