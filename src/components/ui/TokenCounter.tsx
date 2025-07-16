
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TokenCounterProps {
  tokens: number;
  maxTokens?: number;
  className?: string;
}

export const TokenCounter: React.FC<TokenCounterProps> = ({
  tokens,
  maxTokens = 4000,
  className = ""
}) => {
  const percentage = (tokens / maxTokens) * 100;
  
  const getVariant = () => {
    if (percentage > 90) return 'destructive';
    if (percentage > 70) return 'secondary';
    return 'outline';
  };

  return (
    <Badge variant={getVariant()} className={`text-xs font-mono ${className}`}>
      {tokens.toLocaleString()}{maxTokens && `/${maxTokens.toLocaleString()}`}
    </Badge>
  );
};
