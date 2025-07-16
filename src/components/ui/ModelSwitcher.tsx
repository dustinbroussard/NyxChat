
import React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface ModelSwitcherProps {
  currentModel: string;
  models: Array<{ id: string; name: string; description?: string }>;
  onModelChange: (modelId: string) => void;
}

export const ModelSwitcher: React.FC<ModelSwitcherProps> = ({
  currentModel,
  models,
  onModelChange
}) => {
  const selectedModel = models.find(m => m.id === currentModel);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="h-9 px-3 rounded-xl border-2 hover:border-primary/50 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedModel?.name || 'Model'}
            </Badge>
            <ChevronDown className="h-3 w-3" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-card/95 backdrop-blur-md border-2 shadow-xl rounded-xl"
      >
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange(model.id)}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/80 transition-colors duration-200"
          >
            <div className="flex flex-col">
              <span className="font-medium">{model.name}</span>
              {model.description && (
                <span className="text-xs text-muted-foreground">{model.description}</span>
              )}
            </div>
            {currentModel === model.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
