
// IndexedDB utility for persistent storage
const DB_NAME = 'VivicaDB';
const DB_VERSION = 1;
const STORES = {
  CONVERSATIONS: 'conversations',
  MEMORY: 'memory',
  PROMPTS: 'prompts',
  SETTINGS: 'settings'
};

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  error?: boolean;
}

// Import and re-export the unified MemoryEntry type
export type { MemoryEntry } from '@/types/memory';

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Conversations store
        if (!db.objectStoreNames.contains(STORES.CONVERSATIONS)) {
          const conversationStore = db.createObjectStore(STORES.CONVERSATIONS, { keyPath: 'id' });
          conversationStore.createIndex('createdAt', 'createdAt');
        }

        // Memory store
        if (!db.objectStoreNames.contains(STORES.MEMORY)) {
          const memoryStore = db.createObjectStore(STORES.MEMORY, { keyPath: 'id' });
          memoryStore.createIndex('category', 'category');
          memoryStore.createIndex('importance', 'importance');
          memoryStore.createIndex('lastAccessed', 'lastAccessed');
        }

        // Prompts store
        if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
          const promptStore = db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' });
          promptStore.createIndex('name', 'name');
          promptStore.createIndex('createdAt', 'createdAt');
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      };
    });
  }

  // Conversation methods
  async saveConversation(conversation: Conversation): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.CONVERSATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.CONVERSATIONS);
    await store.put(conversation);
  }

  async getConversations(): Promise<Conversation[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.CONVERSATIONS], 'readonly');
    const store = transaction.objectStore(STORES.CONVERSATIONS);
    const index = store.index('createdAt');
    const request = index.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result.reverse());
      request.onerror = () => reject(request.error);
    });
  }

  async deleteConversation(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.CONVERSATIONS], 'readwrite');
    const store = transaction.objectStore(STORES.CONVERSATIONS);
    await store.delete(id);
  }

  // Memory methods
  async saveMemoryEntry(entry: import('@/types/memory').MemoryEntry): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.MEMORY], 'readwrite');
    const store = transaction.objectStore(STORES.MEMORY);
    await store.put(entry);
  }

  async getMemoryEntries(limit?: number): Promise<import('@/types/memory').MemoryEntry[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.MEMORY], 'readonly');
    const store = transaction.objectStore(STORES.MEMORY);
    const index = store.index('importance');
    const request = index.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result
          .sort((a, b) => b.importance - a.importance)
          .slice(0, limit);
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMemoryEntry(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.MEMORY], 'readwrite');
    const store = transaction.objectStore(STORES.MEMORY);
    await store.delete(id);
  }

  // Prompt methods
  async savePrompt(prompt: PromptTemplate): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.PROMPTS], 'readwrite');
    const store = transaction.objectStore(STORES.PROMPTS);
    await store.put(prompt);
  }

  async getPrompts(): Promise<PromptTemplate[]> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.PROMPTS], 'readonly');
    const store = transaction.objectStore(STORES.PROMPTS);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePrompt(id: string): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([STORES.PROMPTS], 'readwrite');
    const store = transaction.objectStore(STORES.PROMPTS);
    await store.delete(id);
  }
}

export const dbManager = new IndexedDBManager();
