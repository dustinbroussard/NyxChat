
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

interface QuickAction {
  id: string;
  name: string;
  prompt: string;
  icon: string;
}

interface WelcomeScreenProps {
  onQuickAction?: (prompt: string) => void;
}

export const WelcomeScreen = ({ onQuickAction }: WelcomeScreenProps) => {
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const { theme } = useTheme();
  const [pulseOffset, setPulseOffset] = useState(0);

  const themes = [
    { value: 'amoled-dark', logo: '/lovable-uploads/9fdbd587-62ac-4cb6-bff1-d122be91c1d7.png' },
    { value: 'default-light', logo: '/lovable-uploads/a0bdba19-1d4b-4eee-8119-6b5033ad249a.png' },
    { value: 'blue-dark', logo: '/lovable-uploads/91f2b05e-1f27-47bd-816a-59408c5553cb.png' },
    { value: 'blue-light', logo: '/lovable-uploads/d78b2b3d-8ca5-42e2-a1b2-fdaf4ef10f1b.png' },
    { value: 'red-dark', logo: '/lovable-uploads/25eadb39-d074-4f60-bbdb-ebf3b7d3cee1.png' },
    { value: 'red-light', logo: '/lovable-uploads/2d1a2967-f71a-4e49-9113-ca962dbfe942.png' },
  ];

  const currentTheme = themes.find(t => t.value === theme);

  useEffect(() => {
    const saved = localStorage.getItem('nyx-quick-actions');
    if (saved) {
      setQuickActions(JSON.parse(saved));
    } else {
      const defaults = [
        { id: '1', name: 'Write Email', prompt: 'Help me write a professional email', icon: 'fas fa-envelope' },
        { id: '2', name: 'Explain', prompt: 'Explain a complex concept', icon: 'fas fa-lightbulb' },
        { id: '3', name: 'Brainstorm', prompt: 'Help me brainstorm ideas', icon: 'fas fa-brain' },
        { id: '4', name: 'Code Review', prompt: 'Review my code', icon: 'fas fa-code' }
      ];
      setQuickActions(defaults);
      localStorage.setItem('nyx-quick-actions', JSON.stringify(defaults));
    }
  }, []);

  useEffect(() => {
    const animate = () => {
      setPulseOffset(prev => prev + 0.05);
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleQuickAction = (prompt: string) => {
    console.log('Quick action clicked:', prompt);
    if (onQuickAction) {
      onQuickAction(prompt);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <div className="mb-8">
          <div className="w-48 h-48 mx-auto mb-6 relative flex items-center justify-center">
            {/* Animated gradient orb */}
            <div 
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: `radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)`,
                transform: `scale(${1 + Math.sin(pulseOffset) * 0.1})`,
                filter: 'blur(2px)'
              }}
            />
            <div 
              className="relative w-32 h-32 rounded-full flex items-center justify-center"
              style={{
                background: `radial-gradient(circle, var(--accent-primary) 0%, var(--accent-secondary) 50%, transparent 100%)`,
                boxShadow: `0 0 30px var(--accent-glow)`
              }}
            >
              {currentTheme?.logo ? (
                <img 
                  src={currentTheme.logo} 
                  alt="NyxChat Logo" 
                  className="w-28 h-28" 
                  style={{
                    filter: 'drop-shadow(0 0 10px var(--accent-glow))'
                  }}
                />
              ) : (
                <div 
                  className="w-24 h-24 rounded-full"
                  style={{
                    background: 'var(--text-primary)',
                    opacity: 0.8
                  }}
                />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to NyxChat</h1>
          <p className="text-muted-foreground">
            Your AI-powered assistant is ready to help. Start a conversation or try one of these quick actions.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className="h-20 flex-col gap-2 hover:bg-accent"
              onClick={() => handleQuickAction(action.prompt)}
            >
              <i className={`${action.icon} text-lg`} />
              <span className="text-sm">{action.name}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
