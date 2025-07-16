

export interface MemoryEntry {
  id: string;
  content: string;
  category: 'personal' | 'preferences' | 'context' | 'knowledge' | 'other';
  importance: number;
  createdAt: Date;
  lastAccessed: Date;
  tags?: string[];
}

