
import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const TypingIndicator: React.FC = () => {
  return (
    <motion.div
      className="flex gap-3 justify-start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-primary" />
        </div>
      </div>

      <Card className="p-4 bg-muted/50 max-w-[200px]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
            />
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
            />
            <motion.div
              className="w-2 h-2 bg-primary/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
            />
          </div>
          <span className="text-xs text-muted-foreground">AI is thinking...</span>
        </div>
      </Card>
    </motion.div>
  );
};
