
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Profile {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  createdAt: number;
}

export interface Memory {
  content: string;
  tags: string[];
  updatedAt: number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider: {
    context_length: number;
    max_completion_tokens: number;
  };
}
