import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Brain,
  Settings,
  Mic,
  Plus,
  Trash2,
  User,
  Download,
  X
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarInput,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useChat, type Conversation } from '@/contexts/ChatContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMemory } from '@/contexts/MemoryContext';
import { MemoryManagerModal } from "@/components/memory/MemoryManagerModal";
import { ProfileSelector } from '@/components/promptforge/ProfileSelector';
import { LongPressContextMenu } from '@/components/ui/LongPressContextMenu';
import { toast } from "sonner";
import { useIsMobile } from '@/hooks/use-mobile';

const staticMenuItems = [
  { title: 'Memory', url: '/memory', icon: Brain },
  { title: 'Profiles', url: '/profiles', icon: User },
  { title: 'Voice', url: '/voice', icon: Mic },
  { title: 'Settings', url: '/settings', icon: Settings }
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const { conversations, currentConversation, newConversation, loadConversation, deleteConversation, currentProfile, setCurrentProfile } = useChat();
  const { memories, deleteMemory } = useMemory();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const [memoryModalOpen, setMemoryModalOpen] = useState(false);

  const [profiles, setProfiles] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem('ai-profiles');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfiles(parsed.map((p: any) => ({ id: p.id, name: p.name })));
    }
  }, []);

  const isCollapsed = state === 'collapsed';

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      toast.success('Conversation deleted');
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleDownloadConversation = (conversation: Conversation) => {
    const jsonString = JSON.stringify(conversation, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${conversation.title}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
  };

  const handleNewChat = () => {
    newConversation();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleClearAll = async () => {
    if (confirm('This will delete all conversations and memories. This action cannot be undone. Are you sure?')) {
      try {
        for (const conversation of conversations) {
          await deleteConversation(conversation.id);
        }

        for (const memory of memories) {
          await deleteMemory(memory.id);
        }

        newConversation();
        toast.success('All conversations and memories cleared successfully');
      } catch (error) {
        console.error('Error clearing data:', error);
        toast.error('Failed to clear all data');
      }
    }
  };

  const handleMemoryModalOpen = () => {
    setMemoryModalOpen(true);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleProfileChange = (profileId: string) => {
    setCurrentProfile(profileId);
    toast.success("Profile switched!");
  };

  const [search, setSearch] = useState('');
  const filteredConversations = search.trim().length === 0
    ? conversations
    : conversations.filter((c) =>
        c.title.toLowerCase().includes(search.trim().toLowerCase())
      );

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className={`z-50 bg-sidebar shadow group/sidebar ${isCollapsed ? 'w-14' : 'w-60'} transition-all duration-300 flex flex-col h-screen-dvh`}
>

        <SidebarContent className="flex flex-col h-full pt-safe-top">
          <div className="shrink-0 border-b border-sidebar-border">
            <div className="px-2 pt-2 pb-3">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start rounded-md ripple-button elegant-transition text-sm"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">New Chat</span>}
              </Button>
            </div>

            {!isCollapsed && (
              <>
                <div className="px-2 pb-2">
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800 ripple-button elegant-transition text-xs"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </div>

                <div className="px-2 pb-3">
                  <SidebarInput
                    placeholder="Search conversations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-md bg-background text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
            <SidebarGroup>
              <SidebarGroupLabel className="sidebar-mobile-title">Conversations</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredConversations.length === 0 ? (
                    <div className={`px-3 py-2 text-xs text-muted-foreground ${isCollapsed ? 'hidden' : ''}`}>
                      No conversations found.
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <SidebarMenuItem key={conversation.id}>
                        <LongPressContextMenu
                          onExport={() => handleDownloadConversation(conversation)}
                          onDelete={() => handleDeleteConversation(conversation.id)}
                          disabled={isCollapsed}
                        >
                          <SidebarMenuButton asChild>
                            <button
                              onClick={() => {
                                loadConversation(conversation.id);
                                if (isMobile) {
                                  setOpenMobile(false);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors w-full text-left group/item ripple-button elegant-transition text-sm ${
                                currentConversation?.id === conversation.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <MessageSquare className="h-4 w-4 flex-shrink-0" />
                              {!isCollapsed && (
                                <span className="truncate-mobile flex-1">{conversation.title}</span>
                              )}
                            </button>
                          </SidebarMenuButton>
                        </LongPressContextMenu>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>

          <div className="shrink-0 border-t border-sidebar-border pt-2 px-2 pb-safe-bottom bg-background/70">
            {!isCollapsed && (
              <div className="mb-2">
                <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-1">
                  Active Profile
                </SidebarGroupLabel>
                <div className="px-2">
                  <ProfileSelector value={currentProfile} onChange={handleProfileChange} />
                </div>
              </div>
            )}

            <SidebarMenu>
              {staticMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {item.title !== "Memory" ? (
                      <NavLink
                        to={item.url}
                        onClick={() => {
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ripple-button elegant-transition text-sm ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-accent hover:text-accent-foreground'
                          }`
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    ) : (
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground w-full ripple-button elegant-transition text-sm ${memoryModalOpen ? 'bg-primary text-primary-foreground' : ''}`}
                        onClick={handleMemoryModalOpen}
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarContent>
      </Sidebar>
      <MemoryManagerModal
        open={memoryModalOpen}
        onOpenChange={setMemoryModalOpen}
        profiles={profiles}
      />
    </>
  );
}
