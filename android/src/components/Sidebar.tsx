
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageCircle, Sparkles, Settings, Brain, User, Plus, Search, MoreHorizontal, Edit, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation, Profile } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, title: string) => void;
  onDeleteConversation: (id: string) => void;
  onProfilesClick: () => void;
  onMemoryClick: () => void;
  onSettingsClick: () => void;
  profiles: Profile[];
  activeProfile: Profile | null;
  onProfileChange: (profile: Profile) => void;
}

export const Sidebar = ({
  isOpen,
  onClose,
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onProfilesClick,
  onMemoryClick,
  onSettingsClick,
  profiles,
  activeProfile,
  onProfileChange,
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartEdit = (conversation: Conversation) => {
    setEditingId(conversation.id);
    setEditTitle(conversation.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  return (
    <>
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  NyxChat
                </h1>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="lg:hidden"
              >
                ×
              </Button>
            </div>
            
            <Button
              onClick={onNewChat}
              className="w-full gradient-primary text-white hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
          </div>

          {/* Profile Selector */}
          <div className="p-4 border-b border-border">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Active Profile
              </label>
              {profiles.length > 0 ? (
                <Select
                  value={activeProfile?.id || ''}
                  onValueChange={(id) => {
                    const profile = profiles.find(p => p.id === id);
                    if (profile) onProfileChange(profile);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{profile.name}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {profile.model}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-xs text-muted-foreground">
                  No profiles available
                </div>
              )}
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-1">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start a new chat to begin</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50",
                      activeConversationId === conversation.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => onConversationSelect(conversation.id)}
                  >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    
                    {editingId === conversation.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        onBlur={handleSaveEdit}
                        className="flex-1 h-6 text-sm"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleStartEdit(conversation)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteConversation(conversation.id)}
                          className="text-destructive"
                        >
                          <Trash className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-border space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onProfilesClick}
            >
              <User className="w-4 h-4 mr-2" />
              Profiles
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onMemoryClick}
            >
              <Brain className="w-4 h-4 mr-2" />
              Memory
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={onSettingsClick}
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
