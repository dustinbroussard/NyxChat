
import { useState, useEffect } from 'react';
import { OpenRouterModel } from '@/types';

export const useOpenRouterModels = () => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('openrouter-api-key') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      setModels(data.data || []);
    } catch (err) {
      console.error('Error fetching OpenRouter models:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch models');
      
      // Fallback to default models if API fails
      setModels([
        {
          id: 'openai/gpt-4o',
          name: 'GPT-4o',
          description: 'OpenAI GPT-4o',
          context_length: 128000,
          pricing: { prompt: '0.000005', completion: '0.000015' },
          top_provider: { context_length: 128000, max_completion_tokens: 4096 }
        },
        {
          id: 'anthropic/claude-3-sonnet',
          name: 'Claude 3 Sonnet',
          description: 'Anthropic Claude 3 Sonnet',
          context_length: 200000,
          pricing: { prompt: '0.000003', completion: '0.000015' },
          top_provider: { context_length: 200000, max_completion_tokens: 4096 }
        },
        {
          id: 'google/gemini-pro',
          name: 'Gemini Pro',
          description: 'Google Gemini Pro',
          context_length: 32000,
          pricing: { prompt: '0.000001', completion: '0.000002' },
          top_provider: { context_length: 32000, max_completion_tokens: 2048 }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  return {
    models,
    isLoading,
    error,
    refetch: fetchModels,
  };
};
