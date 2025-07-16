
import { useState, useEffect, useCallback } from 'react';
import { Conversation, Message } from '@/types';

const STORAGE_KEY = 'nyx-conversations';
const ACTIVE_KEY = 'nyx-active-conversation';

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load conversations from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        let loadedConversations: Conversation[] = [];
        
        if (saved) {
          loadedConversations = JSON.parse(saved);
          console.log('📚 Loaded conversations from storage:', loadedConversations.length);
        }
        
        const activeId = localStorage.getItem(ACTIVE_KEY);
        console.log('🎯 Loaded active conversation ID:', activeId);
        
        // Set conversations first
        setConversations(loadedConversations);
        
        // Then set active conversation if it exists in the loaded conversations
        if (activeId && loadedConversations.find(c => c.id === activeId)) {
          setActiveConversationId(activeId);
        } else if (loadedConversations.length > 0) {
          // If active conversation doesn't exist, use the first one
          setActiveConversationId(loadedConversations[0].id);
          localStorage.setItem(ACTIVE_KEY, loadedConversations[0].id);
        }
        
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load conversations:', error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (isLoaded && conversations.length > 0) {
      console.log('💾 Saving conversations to storage:', conversations.length);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    }
  }, [conversations, isLoaded]);

  // Save active conversation
  useEffect(() => {
    if (isLoaded && activeConversationId) {
      console.log('💾 Saving active conversation ID:', activeConversationId);
      localStorage.setItem(ACTIVE_KEY, activeConversationId);
    }
  }, [activeConversationId, isLoaded]);

  const createConversation = useCallback((): Conversation => {
    const newConversation: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    console.log('✨ Creating new conversation:', newConversation.id);
    
    setConversations(prev => {
      const updated = [newConversation, ...prev];
      console.log('📝 Updated conversations list:', updated.length);
      return updated;
    });
    
    return newConversation;
  }, []);

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    console.log('💬 Adding message to conversation:', conversationId, newMessage.role);

    setConversations(prev => {
      const updated = prev.map(conv => {
        if (conv.id === conversationId) {
          const updatedConv = {
            ...conv,
            messages: [...conv.messages, newMessage],
            updatedAt: Date.now(),
          };

          // Auto-generate title from first user message
          if (conv.messages.length === 0 && message.role === 'user') {
            updatedConv.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
          }

          console.log('📨 Updated conversation messages count:', updatedConv.messages.length);
          return updatedConv;
        }
        return conv;
      });
      
      console.log('🔄 State updated, total conversations:', updated.length);
      return updated;
    });

    return newMessage;
  }, []);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    console.log('🔧 Updating conversation:', id);
    setConversations(prev => prev.map(conv =>
      conv.id === id ? { ...conv, ...updates, updatedAt: Date.now() } : conv
    ));
  }, []);

  const updateConversationTitle = useCallback((id: string, title: string) => {
    updateConversation(id, { title });
  }, [updateConversation]);

  const deleteConversation = useCallback((id: string) => {
    console.log('🗑️ Deleting conversation:', id);
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      // If we deleted the active conversation, set a new active one
      if (activeConversationId === id) {
        const newActiveId = filtered.length > 0 ? filtered[0].id : null;
        setActiveConversationId(newActiveId);
        if (newActiveId) {
          localStorage.setItem(ACTIVE_KEY, newActiveId);
        } else {
          localStorage.removeItem(ACTIVE_KEY);
        }
      }
      return filtered;
    });
  }, [activeConversationId]);

  return {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    addMessage,
    updateConversation,
    updateConversationTitle,
    deleteConversation,
    isLoaded,
  };
};
