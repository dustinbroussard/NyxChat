
import { useState, useCallback } from 'react';
import { Profile } from '@/types';
import { useConversations } from './useConversations';
import { contextService } from '@/services/contextService';
import { toast } from 'sonner';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface SendMessageParams {
  message: string;
  conversationId: string;
  profile: Profile;
  memory?: string;
}

export const useOpenRouter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addMessage } = useConversations();

  const getApiKey = (): string | null => {
    const key = localStorage.getItem('openrouter-api-key');
    if (!key) {
      toast.error('Please set your OpenRouter API key in settings');
      return null;
    }
    return key;
  };

  const getSavedMemories = (): string => {
    const saved = localStorage.getItem('nyx-saved-memories');
    if (!saved) return '';
    
    try {
      const memories = JSON.parse(saved);
      if (!Array.isArray(memories) || memories.length === 0) return '';
      
      return memories.map(memory => memory.content).join('\n\n');
    } catch (error) {
      console.error('Error parsing saved memories:', error);
      return '';
    }
  };

  const sendMessage = useCallback(async (params: SendMessageParams) => {
    const { message, conversationId, profile, memory } = params;
    const apiKey = getApiKey();
    
    if (!apiKey) return;

    console.log('🚀 SendMessage START:', { conversationId, role: 'user' });

    setIsLoading(true);

    try {
      // Add user message immediately
      console.log('📝 Adding user message...');
      addMessage(conversationId, {
        role: 'user',
        content: message,
      });

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));

      // Fetch context data
      let contextData;
      try {
        contextData = await contextService.fetchContextData();
      } catch (contextError) {
        console.warn('Context fetch failed, continuing without context:', contextError);
        contextData = null;
      }

      const contextPrompt = contextData ? contextService.formatContextForPrompt(contextData) : '';

      // Prepare system prompt
      let systemPrompt = profile.systemPrompt;
      
      if (contextPrompt) {
        systemPrompt = contextPrompt + '\n\n' + systemPrompt;
      }
      
      const savedMemories = getSavedMemories();
      if (savedMemories) {
        systemPrompt += `\n\nSaved Memories:\n${savedMemories}`;
      }
      
      if (memory?.trim()) {
        systemPrompt += `\n\nCurrent Context/Memory:\n${memory}`;
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ];

      console.log('🌐 Making API request...');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'NyxChat',
        },
        body: JSON.stringify({
          model: profile.model,
          messages,
          temperature: profile.temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText || `HTTP ${response.status}` } };
        }
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response content from AI model');
      }

      console.log('🤖 Adding assistant message...');
      addMessage(conversationId, {
        role: 'assistant',
        content: assistantMessage.trim(),
      });

      console.log('✅ SendMessage SUCCESS');

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('401') || errorMessage.includes('authentication')) {
        toast.error('Invalid API key. Please check your OpenRouter API key in settings.');
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('aborted')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error(`Failed to send message: ${errorMessage}`);
      }

      // Add error message to conversation
      addMessage(conversationId, {
        role: 'assistant',
        content: `Error: ${errorMessage}\n\nClick the retry button to try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const retryMessage = useCallback(async (params: SendMessageParams) => {
    console.log('🔄 Retrying message:', params.message);
    await sendMessage(params);
  }, [sendMessage]);

  return {
    sendMessage,
    retryMessage,
    isLoading,
  };
};
