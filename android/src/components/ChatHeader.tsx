
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Menu, Palette, Mic } from 'lucide-react';
import { Profile } from '@/types';
import { useTheme } from '@/hooks/useTheme';

interface ChatHeaderProps {
  conversationTitle: string;
  activeProfile: Profile | null;
  onMenuToggle: () => void;
  onVoiceModeToggle: () => void;
}

export const ChatHeader = ({
  conversationTitle,
  activeProfile,
  onMenuToggle,
  onVoiceModeToggle,
}: ChatHeaderProps) => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'amoled-dark', label: 'AMOLED Dark', logo: '/lovable-uploads/9fdbd587-62ac-4cb6-bff1-d122be91c1d7.png' },
    { value: 'default-light', label: 'Default Light', logo: '/lovable-uploads/a0bdba19-1d4b-4eee-8119-6b5033ad249a.png' },
    { value: 'blue-dark', label: 'Blue Dark', logo: '/lovable-uploads/91f2b05e-1f27-47bd-816a-59408c5553cb.png' },
    { value: 'blue-light', label: 'Blue Light', logo: '/lovable-uploads/d78b2b3d-8ca5-42e2-a1b2-fdaf4ef10f1b.png' },
    { value: 'red-dark', label: 'Red Dark', logo: '/lovable-uploads/25eadb39-d074-4f60-bbdb-ebf3b7d3cee1.png' },
    { value: 'red-light', label: 'Red Light', logo: '/lovable-uploads/2d1a2967-f71a-4e49-9113-ca962dbfe942.png' },
  ];

  const currentTheme = themes.find(t => t.value === theme);

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 md:px-6">
      {/* Left Side */}
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {currentTheme?.logo && (
            <img 
              src={currentTheme.logo} 
              alt="NyxChat Logo" 
              className="w-8 h-8 flex-shrink-0" 
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-lg font-semibold truncate">
              {conversationTitle}
            </h1>
            {activeProfile && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                Using {activeProfile.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Voice Mode Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onVoiceModeToggle}
          className="text-primary hover:bg-primary/10"
          title="Voice Mode"
        >
          <Mic className="w-4 h-4" />
        </Button>

        {/* Theme Selector */}
        <Select value={theme} onValueChange={setTheme}>
          <SelectTrigger className="w-auto border-none bg-transparent p-2">
            <Palette className="w-4 h-4" />
          </SelectTrigger>
          <SelectContent>
            {themes.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                <div className="flex items-center gap-2">
                  <img 
                    src={t.logo} 
                    alt={t.label} 
                    className="w-4 h-4" 
                  />
                  <span className="hidden sm:inline">{t.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};
