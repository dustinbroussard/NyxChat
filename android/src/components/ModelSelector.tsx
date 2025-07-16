
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { OpenRouterModel } from '@/types';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';

interface ModelSelectorProps {
  selectedModel: string;
  onModelSelect: (modelId: string) => void;
}

export const ModelSelector = ({ selectedModel, onModelSelect }: ModelSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { models, isLoading, error } = useOpenRouterModels();

  const filteredModels = useMemo(() => {
    if (!searchQuery) return models;
    
    const query = searchQuery.toLowerCase();
    return models.filter(model => 
      model.id.toLowerCase().includes(query) ||
      model.name.toLowerCase().includes(query) ||
      (model.description && model.description.toLowerCase().includes(query))
    );
  }, [models, searchQuery]);

  const groupedModels = useMemo(() => {
    const groups: { [key: string]: OpenRouterModel[] } = {};
    
    filteredModels.forEach(model => {
      const provider = model.id.split('/')[0];
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });
    
    return groups;
  }, [filteredModels]);

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading models...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-destructive">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-64 border rounded-md">
        <div className="p-2 space-y-2">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider} className="space-y-1">
              <h4 className="text-sm font-medium text-muted-foreground capitalize px-2">
                {provider}
              </h4>
              {providerModels.map(model => (
                <div
                  key={model.id}
                  className={`p-2 rounded-md cursor-pointer transition-colors hover:bg-accent ${
                    selectedModel === model.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onModelSelect(model.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{model.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {model.id}
                      </p>
                      {model.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {model.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 text-xs text-muted-foreground">
                      {Math.round(model.context_length / 1000)}K
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
