
import React from 'react';
import { Settings, Download, MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChat } from '@/contexts/ChatContext';
import { toast } from 'sonner';

export const AppFooter: React.FC = () => {
  const { currentConversation, conversations } = useChat();

  const handleExportChat = () => {
    if (!currentConversation) {
      toast.error('No conversation to export');
      return;
    }
    
    const jsonString = JSON.stringify(currentConversation, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentConversation.title}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Conversation exported');
  };

  const handleFeedback = () => {
    toast.info('Feedback feature coming soon!');
  };

  const handleSupport = () => {
    window.open('https://docs.lovable.dev', '_blank');
  };

  return (
    <footer className="hidden md:flex fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t shadow-lg">
      <div className="max-w-4xl mx-auto w-full flex items-center justify-center gap-2 px-4 py-2 min-h-[48px]">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportChat}
              disabled={!currentConversation || conversations.length === 0}
              className="h-8 px-3 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Download className="h-4 w-4 mr-1" />
              <span className="text-xs">Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Export current conversation</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFeedback}
              className="h-8 px-3 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">Feedback</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send feedback</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSupport}
              className="h-8 px-3 rounded-lg transition-all duration-200 hover:scale-105"
            >
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">Support</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Get help & support</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
};
