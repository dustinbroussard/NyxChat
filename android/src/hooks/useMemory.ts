
import { useState, useEffect } from 'react';
import { Memory } from '@/types';

const STORAGE_KEY = 'nyx-memory';

export const useMemory = () => {
  const [memory, setMemory] = useState<Memory>({
    content: '',
    tags: [],
    updatedAt: Date.now(),
  });

  // Load memory from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setMemory(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load memory:', error);
      }
    }
  }, []);

  // Save memory to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }, [memory]);

  const updateMemory = (updates: Partial<Memory>) => {
    setMemory(prev => ({
      ...prev,
      ...updates,
      updatedAt: Date.now(),
    }));
  };

  return {
    memory,
    updateMemory,
  };
};
