
import React, { createContext, useContext, useState, useEffect } from 'react';
import { dbManager } from '@/lib/indexedDB';
import { MemoryEntry } from '@/types/memory';

// Re-export MemoryEntry for components to use
export type { MemoryEntry };

interface MemoryContextType {
  memories: MemoryEntry[];
  addMemory: (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'lastAccessed'>) => Promise<void>;
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  clearAllMemories: () => Promise<void>;
  getRelevantMemories: (limit?: number) => MemoryEntry[];
  refreshMemories: () => Promise<void>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);

  const loadMemories = async () => {
    try {
      const loadedMemories = await dbManager.getMemoryEntries();
      setMemories(loadedMemories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const addMemory = async (entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'lastAccessed'>) => {
    const newMemory: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      lastAccessed: new Date(),
    };

    try {
      await dbManager.saveMemoryEntry(newMemory);
      setMemories(prev => [newMemory, ...prev]);
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  };

  const updateMemory = async (id: string, updates: Partial<MemoryEntry>) => {
    const existing = memories.find(m => m.id === id);
    if (!existing) return;

    const updated = { ...existing, ...updates, lastAccessed: new Date() };
    
    try {
      await dbManager.saveMemoryEntry(updated);
      setMemories(prev => prev.map(m => m.id === id ? updated : m));
    } catch (error) {
      console.error('Failed to update memory:', error);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await dbManager.deleteMemoryEntry(id);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const clearAllMemories = async () => {
    try {
      // Delete all memories from IndexedDB
      await Promise.all(memories.map(memory => dbManager.deleteMemoryEntry(memory.id)));
      setMemories([]);
    } catch (error) {
      console.error('Failed to clear all memories:', error);
    }
  };

  const getRelevantMemories = (limit = 10) => {
    return memories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  };

  const refreshMemories = async () => {
    await loadMemories();
  };

  return (
    <MemoryContext.Provider value={{
      memories,
      addMemory,
      updateMemory,
      deleteMemory,
      clearAllMemories,
      getRelevantMemories,
      refreshMemories,
    }}>
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  const context = useContext(MemoryContext);
  if (context === undefined) {
    throw new Error('useMemory must be used within a MemoryProvider');
  }
  return context;
}
