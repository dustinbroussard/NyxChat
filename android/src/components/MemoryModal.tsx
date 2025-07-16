
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Memory } from '@/types';
import { Brain, Save, X, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  onUpdateMemory: (updates: Partial<Memory>) => void;
}

interface SavedMemory {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
}

export const MemoryModal = ({
  isOpen,
  onClose,
  memory,
  onUpdateMemory,
}: MemoryModalProps) => {
  const [content, setContent] = useState(memory.content);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(memory.tags);
  const [savedMemories, setSavedMemories] = useState<SavedMemory[]>(() => {
    const saved = localStorage.getItem('nyx-saved-memories');
    return saved ? JSON.parse(saved) : [];
  });
  const [editingMemory, setEditingMemory] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');

  const saveSavedMemories = (memories: SavedMemory[]) => {
    localStorage.setItem('nyx-saved-memories', JSON.stringify(memories));
    setSavedMemories(memories);
  };

  const handleSave = () => {
    onUpdateMemory({
      content: content.trim(),
      tags: tags.filter(tag => tag.trim()),
    });
    toast.success('Memory updated');
    onClose();
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags(prev => [...prev, newTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const saveMemoryItem = () => {
    if (!content.trim()) return;

    const title = content.trim().slice(0, 50) + (content.length > 50 ? '...' : '');
    const newMemory: SavedMemory = {
      id: Date.now().toString(),
      title,
      content: content.trim(),
      tags: [...tags],
      createdAt: Date.now(),
    };

    const updated = [...savedMemories, newMemory];
    saveSavedMemories(updated);
    
    // Clear the form
    setContent('');
    setTags([]);
    
    toast.success('Memory saved');
  };

  const deleteMemoryItem = (id: string) => {
    const updated = savedMemories.filter(m => m.id !== id);
    saveSavedMemories(updated);
    toast.success('Memory deleted');
  };

  const startEditing = (memory: SavedMemory) => {
    setEditingMemory(memory.id);
    setEditContent(memory.content);
    setEditTitle(memory.title);
  };

  const saveEdit = (id: string) => {
    const updated = savedMemories.map(m => 
      m.id === id 
        ? { ...m, content: editContent, title: editTitle || editContent.slice(0, 50) + (editContent.length > 50 ? '...' : '') }
        : m
    );
    saveSavedMemories(updated);
    setEditingMemory(null);
    toast.success('Memory updated');
  };

  const cancelEdit = () => {
    setEditingMemory(null);
    setEditContent('');
    setEditTitle('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Memory System
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto">
          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-2">How Memory Works</h3>
            <p className="text-sm text-muted-foreground">
              Memory content is automatically included in conversations to provide context about you, 
              your preferences, and important information the AI should remember.
            </p>
          </div>

          <div>
            <Label htmlFor="memory-content" className="text-base font-medium">
              Add New Memory
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add information about yourself, your preferences, work context, or anything you want the AI to remember.
            </p>
            <Textarea
              id="memory-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="e.g., I'm a software developer working on React applications. I prefer TypeScript and functional programming patterns. I work in the EST timezone..."
              rows={4}
              className="resize-none"
            />
          </div>

          <div>
            <Label htmlFor="tag-input" className="text-base font-medium">
              Tags
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Add tags to organize your memory content.
            </p>
            
            <div className="flex gap-2 mb-3">
              <Input
                id="tag-input"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag..."
                className="flex-1"
              />
              <Button onClick={handleAddTag} variant="outline" size="sm">
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            <Button onClick={saveMemoryItem} disabled={!content.trim()} className="w-full mb-4">
              <Save className="w-4 h-4 mr-2" />
              Save This Memory
            </Button>
          </div>

          {savedMemories.length > 0 && (
            <div>
              <Label className="text-base font-medium">Saved Memories</Label>
              <div className="space-y-3 mt-3">
                {savedMemories.map((memory) => (
                  <div key={memory.id} className="border rounded-lg p-3">
                    {editingMemory === memory.id ? (
                      <div className="space-y-2">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Memory title..."
                          className="font-medium"
                        />
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="resize-none"
                        />
                        <div className="flex gap-2">
                          <Button onClick={() => saveEdit(memory.id)} size="sm">
                            Save
                          </Button>
                          <Button onClick={cancelEdit} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{memory.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{memory.content}</p>
                            {memory.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {memory.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              onClick={() => startEditing(memory)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => deleteMemoryItem(memory.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Created: {new Date(memory.createdAt).toLocaleString()}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date(memory.updatedAt).toLocaleString()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="gradient-primary text-white">
                <Save className="w-4 h-4 mr-2" />
                Save Memory
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
