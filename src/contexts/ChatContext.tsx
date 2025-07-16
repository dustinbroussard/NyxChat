import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbManager, Conversation, Message } from '@/lib/indexedDB';
import { useMemory } from './MemoryContext';
import { useMemoryAutoSave } from '@/hooks/useMemoryAutoSave';
import { availableModels } from '@/constants/models';

export type { Conversation, Message };

interface ChatContextType {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  isLoading: boolean;
  isTyping: boolean;
  currentProfile: string;
  setCurrentProfile: (profileId: string) => void;
  sendMessage: (content: string, model?: string) => Promise<void>;
  retryMessage: () => Promise<void>;
  newConversation: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  refreshConversations: () => Promise<void>;
}

interface Profile {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
}

interface CustomModel {
  id: string;
  name: string;
  modelId: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentProfile, setCurrentProfile] = useState('global');
  const { getRelevantMemories } = useMemory();
  const { extractMemoryFromMessage } = useMemoryAutoSave();

  const loadConversations = async () => {
    try {
      const loadedConversations = await dbManager.getConversations();
      setConversations(loadedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      await loadConversations();
      const savedProfile = localStorage.getItem('current-profile');
      if (savedProfile) {
        setCurrentProfile(savedProfile);
      } else {
        setCurrentProfile('global');
      }
      const lastConversationId = localStorage.getItem('last-conversation-id');
      if (lastConversationId) {
        const loadedConversations = await dbManager.getConversations();
        const lastConvo = loadedConversations.find(c => c.id === lastConversationId);
        if (lastConvo) {
          setCurrentConversation(lastConvo);
        }
      }
    };
    initialize();
  }, []);

  const getAllAvailableModels = () => {
    const appSettings = localStorage.getItem('app-settings');
    const deletedDefaultModels = JSON.parse(localStorage.getItem('deleted-default-models') || '[]');
    
    // Get non-deleted default models
    const validDefaultModels = availableModels.filter(m => !deletedDefaultModels.includes(m.id));
    
    // Get custom models
    let customModels: CustomModel[] = [];
    if (appSettings) {
      const settings = JSON.parse(appSettings);
      if (settings.customModels && Array.isArray(settings.customModels)) {
        customModels = settings.customModels;
      }
    }
    
    // Combine all available model IDs
    const allModelIds = [
      ...validDefaultModels.map(m => m.id),
      ...customModels.map(m => m.modelId)
    ];
    
    return allModelIds;
  };

  const validateAndGetModel = (requestedModel: string): string => {
    const availableModelIds = getAllAvailableModels();
    
    // If the requested model is still available, use it
    if (availableModelIds.includes(requestedModel)) {
      return requestedModel;
    }
    
    console.warn(`Model ${requestedModel} is no longer available. Falling back to default.`);
    
    // Try to get global default first
    const appSettings = localStorage.getItem('app-settings');
    let fallbackModel = 'openai/gpt-4o'; // Ultimate fallback
    
    if (appSettings) {
      const settings = JSON.parse(appSettings);
      if (settings.selectedModel && availableModelIds.includes(settings.selectedModel)) {
        fallbackModel = settings.selectedModel;
      }
    }
    
    // If global default is also invalid, use first available model
    if (!availableModelIds.includes(fallbackModel) && availableModelIds.length > 0) {
      fallbackModel = availableModelIds[0];
    }
    
    console.log(`Using fallback model: ${fallbackModel}`);
    return fallbackModel;
  };

  const getCurrentProfile = (): Profile | null => {
    if (currentProfile === 'global') {
      return null; // Use global settings
    }
    
    const savedProfiles = localStorage.getItem('ai-profiles');
    if (savedProfiles) {
      const profiles = JSON.parse(savedProfiles);
      return profiles.find((p: Profile) => p.id === currentProfile) || null;
    }
    return null;
  };

  const getEffectiveSettings = () => {
    const profile = getCurrentProfile();
    if (profile) {
      return {
        systemPrompt: profile.systemPrompt,
        model: validateAndGetModel(profile.model), // Validate model here
        temperature: profile.temperature
      };
    }

    // Use global settings from app settings
    const appSettings = localStorage.getItem('app-settings');
    if (appSettings) {
      const settings = JSON.parse(appSettings);
      const requestedModel = settings.selectedModel || 'openai/gpt-4o';
      return {
        systemPrompt: settings.systemPrompt || 'You are a helpful AI assistant.',
        model: validateAndGetModel(requestedModel), // Validate model here too
        temperature: settings.temperature || 0.7
      };
    }

    return {
      systemPrompt: 'You are a helpful AI assistant.',
      model: validateAndGetModel('openai/gpt-4o'), // Validate fallback model
      temperature: 0.7
    };
  };

  const buildSystemPrompt = () => {
    const { systemPrompt } = getEffectiveSettings();
    const MAX_TOKENS = 800;
    let accumulated = 0;
    const memories = getRelevantMemories(40).filter(m => !!m.content);
    let selected = [];
    for (const m of memories) {
      accumulated += m.content.length;
      if (accumulated > MAX_TOKENS * 4) break;
      selected.push(m);
    }
    const memoryContext = selected.length > 0
      ? `\n\nContext about the user:\n${selected.map(m => `- ${m.content} (${m.type}${m.tags?.find(t => t.startsWith("profile:")) ? `, ${m.tags?.find(t => t.startsWith("profile:"))}` : ""})`).join('\n')}`
      : '';
    return systemPrompt + memoryContext;
  };

  const handleProfileChange = (profileId: string) => {
    setCurrentProfile(profileId);
    localStorage.setItem('current-profile', profileId);
  };
  
  useEffect(() => {
    if (currentConversation) {
      localStorage.setItem('last-conversation-id', currentConversation.id);
    } else {
      localStorage.removeItem('last-conversation-id');
    }
  }, [currentConversation]);

  const _fetchAndProcessResponse = async (conversation: Conversation) => {
    setIsTyping(true);

    try {
      const { model, temperature } = getEffectiveSettings();
      
      const systemPrompt = buildSystemPrompt();
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...conversation.messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
        }))
      ];

      const apiKey = localStorage.getItem('openrouter-api-key');
      if (!apiKey) {
        throw new Error('OpenRouter API key not found. Please set it in Settings.');
      }

      console.log('Making OpenRouter API call:', {
        model,
        temperature,
        messageCount: apiMessages.length,
        systemPromptLength: systemPrompt.length,
        profile: currentProfile
      });

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'NyxChat AI Assistant',
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.error?.message || `${response.status} ${response.statusText}`;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content;

      if (!assistantContent) {
        throw new Error('No response content received from API');
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
      };

      const finalMessages = [...conversation.messages, assistantMessage];
      const finalConversation = {
        ...conversation,
        messages: finalMessages,
      };

      setCurrentConversation(finalConversation);
      await dbManager.saveConversation(finalConversation);
      await loadConversations();

      // Auto-extract memories from the conversation
      const userMessage = conversation.messages[conversation.messages.length - 1];
      if (userMessage && userMessage.role === 'user') {
        console.log('Extracting memories from conversation...');
        const extractedCount = await extractMemoryFromMessage(
          userMessage.content,
          assistantContent,
          currentProfile !== 'global' && currentProfile !== 'default' ? currentProfile : undefined
        );
        console.log(`Extracted ${extractedCount} new memories`);
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        error: true,
      };

      const errorConversation = {
        ...conversation,
        messages: [...conversation.messages, errorMessage],
      };

      setCurrentConversation(errorConversation);
      await dbManager.saveConversation(errorConversation);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    let conversationToUpdate = currentConversation;
    if (!conversationToUpdate) {
      conversationToUpdate = {
        id: crypto.randomUUID(),
        title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const updatedMessages = [...conversationToUpdate.messages, userMessage];
    const updatedConversation = {
      ...conversationToUpdate,
      messages: updatedMessages,
      title: conversationToUpdate.messages.length === 0 ? (content.substring(0, 30) + (content.length > 30 ? '...' : '')) : conversationToUpdate.title,
      updatedAt: new Date(),
    };

    setCurrentConversation(updatedConversation);
    await _fetchAndProcessResponse(updatedConversation);
  };
  
  const retryMessage = async () => {
    if (!currentConversation) return;

    const messagesWithoutError = currentConversation.messages.filter(m => !m.error);
    const conversationToRetry = {
      ...currentConversation,
      messages: messagesWithoutError,
    };
    
    setCurrentConversation(conversationToRetry);
    await _fetchAndProcessResponse(conversationToRetry);
  };

  const newConversation = () => {
    setCurrentConversation(null);
  };

  const loadConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setCurrentConversation(conversation);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await dbManager.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const refreshConversations = async () => {
    await loadConversations();
  };

  return (
    <ChatContext.Provider value={{
      currentConversation,
      conversations,
      isLoading,
      isTyping,
      currentProfile,
      setCurrentProfile: handleProfileChange,
      sendMessage,
      retryMessage,
      newConversation,
      loadConversation,
      deleteConversation,
      refreshConversations,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
