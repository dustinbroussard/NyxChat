
import React from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Lightbulb,
  Brain,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface WelcomeScreenProps {
  onQuickPrompt: (prompt: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  isTyping: boolean;
}

const quickPrompts = [
  {
    icon: <Mail className="h-6 w-6" />,
    label: "Write Email",
    prompt: "Help me write a professional email to schedule a meeting"
  },
  {
    icon: <Lightbulb className="h-6 w-6" />,
    label: "Explain",
    prompt: "Explain a complex topic in simple, easy-to-understand terms"
  },
  {
    icon: <Brain className="h-6 w-6" />,
    label: "Brainstorm",
    prompt: "Help me brainstorm creative ideas for my project"
  },
  {
    icon: <Code className="h-6 w-6" />,
    label: "Code Review",
    prompt: "Review my code and suggest improvements for better performance and readability"
  }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  onQuickPrompt,
}) => {
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full px-4" style={{
      paddingBottom: 'env(safe-area-inset-bottom, 8px)'
    }}>
      {/* Logo Section - centered with more space */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex items-center justify-center h-[60vh]"
      >
        <div className="flex items-center justify-center">
          <img 
            src={theme === 'dark' ? '/lovable-uploads/ef071ded-72e2-42cb-a46b-47bf922f911f.png' : '/lovable-uploads/de22cf8d-553d-4c51-a283-91a089a844be.png'} 
            alt="NyxChat Logo" 
            className="w-56 h-56 md:w-72 md:h-72 drop-shadow-lg"
          />
        </div>
      </motion.div>

      {/* Quick Actions - positioned above footer */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-2 gap-3 md:gap-4 max-w-sm w-full mx-auto welcome-screen-buttons mb-20 md:mb-24"
      >
        {quickPrompts.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
            className="w-full"
          >
            <Button
              variant="outline"
              className="h-18 md:h-20 w-full flex flex-col items-center justify-center gap-2 bg-card/50 border-2 border-border/50 hover:bg-card/80 hover:border-primary/30 hover:shadow-lg rounded-2xl transition-all duration-300 hover:scale-105"
              onClick={() => onQuickPrompt(item.prompt)}
              title={item.prompt}
            >
              <div className="text-foreground">
                {item.icon}
              </div>
              <div className="text-sm font-medium text-foreground">
                {item.label}
              </div>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};
