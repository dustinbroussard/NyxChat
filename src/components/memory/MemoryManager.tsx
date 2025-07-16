import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, Edit3, X } from 'lucide-react';
import { useMemory, MemoryEntry } from '@/contexts/MemoryContext';
import { useToast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';

const getButtonSizeClass = (isMobile: boolean): string => {
  return isMobile ? 'h-8 w-8' : 'h-9 w-9';
};

const getIconSizeClass = (isMobile: boolean): string => {
  return isMobile ? 'h-4 w-4' : 'h-5 w-5';
};

export const MemoryManager = () => {
  const { memories, addMemory, updateMemory, deleteMemory, clearAllMemories } = useMemory();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const fromRoute = location.state?.from || '/chat';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMemory, setSelectedMemory] = useState<MemoryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewMemoryForm, setShowNewMemoryForm] = useState(false);
  
  const [newMemory, setNewMemory] = useState({
    content: '',
    category: 'other' as MemoryEntry['category'],
    importance: 5,
    tags: ''
  });

  const [editMemory, setEditMemory] = useState({
    content: '',
    category: 'other' as MemoryEntry['category'],
    importance: 5,
    tags: ''
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memoryToDelete, setMemoryToDelete] = useState<string | null>(null);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);

  useEffect(() => {
    // Load memories from local storage on component mount
    const storedMemories = localStorage.getItem('memories');
    if (storedMemories) {
      try {
        const parsedMemories = JSON.parse(storedMemories) as MemoryEntry[];
        // Ensure that the loaded memories are valid
        if (Array.isArray(parsedMemories)) {
          // Convert old format to new format if needed
          parsedMemories.forEach(memory => {
            if (!memory.category) {
              const convertedMemory = {
                content: memory.content,
                category: 'other' as MemoryEntry['category'],
                importance: memory.importance || 5,
                tags: memory.tags || []
              };
              addMemory(convertedMemory);
            }
          });
        } else {
          console.error('Invalid memories data in local storage:', parsedMemories);
        }
      } catch (error) {
        console.error('Error parsing memories from local storage:', error);
      }
    }
  }, [addMemory]);

  useEffect(() => {
    // Save memories to local storage whenever memories change
    localStorage.setItem('memories', JSON.stringify(memories));
  }, [memories]);

  const filteredMemories = memories.filter(memory =>
    memory.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (memory.tags && memory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleAddMemory = () => {
    if (!newMemory.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Content is required.",
        variant: "destructive"
      });
      return;
    }

    const tags = newMemory.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const memory: Omit<MemoryEntry, 'id' | 'createdAt' | 'lastAccessed'> = {
      content: newMemory.content,
      category: newMemory.category,
      importance: newMemory.importance,
      tags
    };

    addMemory(memory);
    setNewMemory({ content: '', category: 'other', importance: 5, tags: '' });
    setShowNewMemoryForm(false);
    
    toast({
      title: "Memory Added",
      description: "New memory has been saved successfully."
    });
  };

  const handleUpdateMemory = () => {
    if (!selectedMemory || !editMemory.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Content is required.",
        variant: "destructive"
      });
      return;
    }

    const tags = editMemory.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const updatedMemory: Partial<MemoryEntry> = {
      content: editMemory.content,
      category: editMemory.category,
      importance: editMemory.importance,
      tags
    };

    updateMemory(selectedMemory.id, updatedMemory);
    setSelectedMemory({ ...selectedMemory, ...updatedMemory } as MemoryEntry);
    setIsEditing(false);
    
    toast({
      title: "Memory Updated",
      description: "Memory has been updated successfully."
    });
  };

  const handleDeleteRequest = (memoryId: string) => {
    setMemoryToDelete(memoryId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (memoryToDelete) {
      deleteMemory(memoryToDelete);
      if (selectedMemory?.id === memoryToDelete) {
        setSelectedMemory(null);
        setIsEditing(false);
      }
      setDeleteDialogOpen(false);
      setMemoryToDelete(null);
      
      toast({
        title: "Memory Deleted",
        description: "Memory has been deleted successfully."
      });
    }
  };

  const handleClearAllRequest = () => {
    setClearAllDialogOpen(true);
  };

  const confirmClearAll = () => {
    clearAllMemories();
    setSelectedMemory(null);
    setIsEditing(false);
    setClearAllDialogOpen(false);
    
    toast({
      title: "All Memories Cleared",
      description: "All memories have been deleted successfully."
    });
  };

  const handleEditStart = (memory: MemoryEntry) => {
    setEditMemory({
      content: memory.content,
      category: memory.category,
      importance: memory.importance,
      tags: memory.tags?.join(', ') || ''
    });
    setIsEditing(true);
  };

  const categoryOptions = [
    { value: 'personal', label: 'Personal' },
    { value: 'preferences', label: 'Preferences' },
    { value: 'context', label: 'Context' },
    { value: 'knowledge', label: 'Knowledge' },
    { value: 'other', label: 'Other' }
  ] as const;

  return (
    <div className={`h-full flex flex-col no-horizontal-scroll ${isMobile ? 'p-3' : 'p-6'} bg-gradient-to-br from-background via-background to-background/95`}>
      {/* Header */}
      <div className="mb-4">
        <h1 className={`font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent ${isMobile ? 'text-xl' : 'text-3xl'}`}>
          Memory Manager
        </h1>
      </div>

      {/* Main Content */}
      <div className={`flex-1 ${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'} min-h-0`}>
        {/* Left Panel - Memory List */}
        <Card className="flex flex-col min-h-0 card-modern shadow-elegant-lg border-border/20 backdrop-blur-xl">
          <CardHeader className={isMobile ? 'pb-3 p-4' : 'pb-4'}>
            <div className="flex items-center justify-between">
              <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent`}>
                Memories ({filteredMemories.length})
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowNewMemoryForm(true)}
                  size={isMobile ? "sm" : "default"}
                  className={`${isMobile ? 'h-8 w-8 text-xs' : 'h-9 w-9'} rounded-xl transition-elegant hover:-translate-y-0.5 active:translate-y-0`}
                >
                  <Plus className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
                <Button
                  onClick={handleClearAllRequest}
                  variant="destructive"
                  size={isMobile ? "sm" : "default"}
                  className={`${isMobile ? 'h-8 text-xs' : 'h-9 text-sm'} rounded-xl transition-elegant hover:-translate-y-0.5 active:translate-y-0`}
                  disabled={memories.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/70 ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
              <Input
                placeholder="Search memories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${isMobile ? 'pl-8 h-8 text-xs' : 'pl-10 h-10'} rounded-xl border-2 border-border/30 focus:border-primary/60 transition-elegant bg-background/50 backdrop-blur-sm`}
              />
            </div>
          </CardHeader>

          <CardContent className={`flex-1 overflow-hidden ${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="h-full overflow-y-auto space-y-3 scrollbar-modern">
              {showNewMemoryForm && (
                <Card className="border-2 border-dashed border-border/50 card-modern shadow-elegant">
                  <CardContent className={`${isMobile ? 'p-4 space-y-3' : 'p-5 space-y-4'}`}>
                    <Textarea
                      placeholder="Memory content..."
                      value={newMemory.content}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, content: e.target.value }))}
                      className={`resize-none rounded-xl border-2 border-border/30 focus:border-primary/60 transition-elegant bg-background/50 ${isMobile ? 'min-h-16 text-xs' : 'min-h-20'}`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMemory.category}
                        onChange={(e) => setNewMemory(prev => ({ ...prev, category: e.target.value as MemoryEntry['category'] }))}
                        className={`border border-input bg-background px-2 py-1 rounded ${isMobile ? 'h-7 text-xs' : 'h-8'}`}
                      >
                        {categoryOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        placeholder="Importance (1-10)"
                        value={newMemory.importance}
                        onChange={(e) => setNewMemory(prev => ({ ...prev, importance: parseInt(e.target.value) || 5 }))}
                        className={isMobile ? 'h-7 text-xs' : 'h-8'}
                      />
                    </div>
                    <Input
                      placeholder="Tags (comma-separated)..."
                      value={newMemory.tags}
                      onChange={(e) => setNewMemory(prev => ({ ...prev, tags: e.target.value }))}
                      className={isMobile ? 'h-7 text-xs' : 'h-8'}
                    />
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddMemory}
                        size={isMobile ? "sm" : "default"}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'} ripple-button`}
                      >
                        Add
                      </Button>
                      <Button 
                        onClick={() => setShowNewMemoryForm(false)}
                        variant="outline"
                        size={isMobile ? "sm" : "default"}
                        className={`${isMobile ? 'h-7 text-xs' : 'h-8'} ripple-button`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredMemories.map((memory) => (
                <Card 
                  key={memory.id} 
                  className={`cursor-pointer transition-elegant hover:shadow-elegant-lg hover:-translate-y-1 card-modern ${
                    selectedMemory?.id === memory.id ? 'ring-2 ring-primary/50 shadow-elegant-lg' : ''
                  }`}
                  onClick={() => setSelectedMemory(memory)}
                >
                  <CardContent className={`${isMobile ? 'p-3' : 'p-4'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={isMobile ? 'text-xs px-1 py-0' : 'text-xs'}>
                            {memory.category}
                          </Badge>
                          <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
                            Importance: {memory.importance}
                          </span>
                        </div>
                        <p className={`text-foreground mt-1 line-clamp-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {memory.content}
                        </p>
                        {memory.tags && memory.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {memory.tags.map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="secondary" 
                                className={isMobile ? 'text-xs px-1 py-0' : 'text-xs'}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRequest(memory.id);
                        }}
                        variant="ghost"
                        size="icon"
                        className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'} ripple-button ml-2 flex-shrink-0`}
                      >
                        <Trash2 className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredMemories.length === 0 && (
                <div className="text-center py-8">
                  <p className={`text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
                    {searchTerm ? 'No memories found matching your search.' : 'No memories yet. Create your first memory!'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isMobile && (
          <Card className="flex flex-col min-h-0 card-modern shadow-elegant-lg border-border/20 backdrop-blur-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {selectedMemory ? (isEditing ? 'Edit Memory' : 'Memory Details') : 'Select a Memory'}
                </CardTitle>
                {selectedMemory && !isEditing && (
                  <Button
                    onClick={() => handleEditStart(selectedMemory)}
                    variant="outline"
                    size="sm"
                    className="h-8 ripple-button"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-6">
              {selectedMemory ? (
                <div className="h-full overflow-y-auto">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Memory content..."
                        value={editMemory.content}
                        onChange={(e) => setEditMemory(prev => ({ ...prev, content: e.target.value }))}
                        className="resize-none min-h-32"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editMemory.category}
                          onChange={(e) => setEditMemory(prev => ({ ...prev, category: e.target.value as MemoryEntry['category'] }))}
                          className="border border-input bg-background px-2 py-1 rounded h-8"
                        >
                          {categoryOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          placeholder="Importance (1-10)"
                          value={editMemory.importance}
                          onChange={(e) => setEditMemory(prev => ({ ...prev, importance: parseInt(e.target.value) || 5 }))}
                          className="h-8"
                        />
                      </div>
                      <Input
                        placeholder="Tags (comma-separated)..."
                        value={editMemory.tags}
                        onChange={(e) => setEditMemory(prev => ({ ...prev, tags: e.target.value }))}
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleUpdateMemory}
                          className="h-8 ripple-button"
                        >
                          Save Changes
                        </Button>
                        <Button 
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          className="h-8 ripple-button"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {selectedMemory.category}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Importance: {selectedMemory.importance}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Content</h3>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedMemory.content}
                        </p>
                      </div>
                      
                      {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                        <div>
                          <h3 className="font-medium mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedMemory.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="font-medium mb-2">Created</h3>
                        <p className="text-sm text-muted-foreground">
                          {selectedMemory.createdAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Select a memory to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Memory"
        description="Are you sure you want to delete this memory? This action cannot be undone."
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmationDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        title="Clear All Memories"
        description="Are you sure you want to delete all memories? This action cannot be undone."
        onConfirm={confirmClearAll}
        confirmText="Clear All"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};
