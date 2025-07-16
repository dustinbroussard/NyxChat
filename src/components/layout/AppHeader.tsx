
import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppHeaderProps {
  isOnline?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ isOnline = true }) => {
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 border-b bg-card/95 backdrop-blur-md h-16 shadow-sm">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-accent/80"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img 
            src={theme === 'dark' ? './lovable-uploads/2fe14165-cccc-44c9-a268-7ab4c910b4d8.png' : './lovable-uploads/f1345f48-4cf9-47e5-960c-3b6d62925c7f.png'} 
            alt="NyxChat" 
            className="w-8 h-8 transition-all duration-200 drop-shadow-sm"
          />
          <h1 className={`font-semibold text-lg transition-colors duration-200 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            NyxChat
          </h1>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${
                isOnline ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
              }`}
              aria-label={isOnline ? "Online" : "Offline"}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{isOnline ? "Online" : "Offline"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 rounded-xl transition-all duration-200 hover:scale-105 hover:bg-accent/80"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
    </header>
  );
};
