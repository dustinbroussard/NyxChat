
import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { availableModels } from '@/constants/models';
import { useSidebar } from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface CustomModel {
  id: string;
  name: string;
  modelId: string;
}

interface ModelSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  showDeleteIcons?: boolean;
  onModelDelete?: (modelId: string, isCustom: boolean) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  value, 
  onChange, 
  className = "",
  showDeleteIcons = false,
  onModelDelete
}) => {
  const [availableModelOptions, setAvailableModelOptions] = useState<Array<{id: string, name: string, isCustom?: boolean}>>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteModel, setPendingDeleteModel] = useState<{id: string, name: string, isCustom: boolean} | null>(null);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Long press functionality
  const [longPressModel, setLongPressModel] = useState<string | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressActiveRef = useRef(false);

  const loadAvailableModels = () => {
    const appSettings = localStorage.getItem('app-settings');
    const deletedDefaultModels = JSON.parse(localStorage.getItem('deleted-default-models') || '[]');
    
    // Get non-deleted default models
    const validDefaultModels = availableModels.filter(m => !deletedDefaultModels.includes(m.id));
    
    // Get custom models
    let customModels: CustomModel[] = [];
    if (appSettings) {
      const settings = JSON.parse(appSettings);
      if (settings.customModels && Array.isArray(settings.customModels)) {
        customModels = settings.customModels;
      }
    }
    
    // Combine all available models
    const allModels = [
      ...validDefaultModels.map(m => ({ id: m.id, name: m.name, isCustom: false })),
      ...customModels.map(m => ({ id: m.modelId, name: m.name, isCustom: true }))
    ];
    
    setAvailableModelOptions(allModels);
  };

  useEffect(() => {
    loadAvailableModels();
    
    // Listen for storage changes to update models dynamically
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app-settings' || e.key === 'deleted-default-models') {
        loadAvailableModels();
      }
    };
    
    // Listen for custom events for same-window updates
    const handleCustomStorageUpdate = () => {
      loadAvailableModels();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('modelSettingsUpdated', handleCustomStorageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('modelSettingsUpdated', handleCustomStorageUpdate);
    };
  }, []);

  const getDisplayName = (modelId?: string) => {
    if (!modelId) return 'Select Model';
    const model = availableModelOptions.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };

  const handleLongPressStart = (modelId: string, modelName: string, isCustom: boolean) => {
    longPressActiveRef.current = true;
    setLongPressModel(modelId);
    
    // Trigger haptic feedback on mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    longPressTimerRef.current = setTimeout(() => {
      if (longPressActiveRef.current) {
        // Stronger haptic feedback for long press
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
        
        // Trigger long press action
        setPendingDeleteModel({ id: modelId, name: modelName, isCustom });
        setDeleteDialogOpen(true);
        setLongPressModel(null);
      }
    }, 500);
  };

  const handleLongPressEnd = () => {
    longPressActiveRef.current = false;
    setLongPressModel(null);
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const confirmDelete = () => {
    if (!pendingDeleteModel) return;
    
    const { id, isCustom } = pendingDeleteModel;
    
    if (isCustom) {
      // Delete custom model
      const appSettings = localStorage.getItem('app-settings');
      if (appSettings) {
        const settings = JSON.parse(appSettings);
        if (settings.customModels) {
          settings.customModels = settings.customModels.filter((m: CustomModel) => m.modelId !== id);
          localStorage.setItem('app-settings', JSON.stringify(settings));
        }
      }
      toast.success('Custom model deleted successfully');
    } else {
      // Delete default model by adding to deleted list
      const deletedModels = JSON.parse(localStorage.getItem('deleted-default-models') || '[]');
      const updatedDeleted = [...deletedModels, id];
      localStorage.setItem('deleted-default-models', JSON.stringify(updatedDeleted));
      toast.success('Default model removed from selection');
    }

    // If the deleted model is currently selected, switch to first available
    if (value === id) {
      loadAvailableModels();
      const remainingModels = availableModelOptions.filter(m => m.id !== id);
      if (remainingModels.length > 0) {
        onChange(remainingModels[0].id);
      }
    }

    if (onModelDelete) {
      onModelDelete(id, isCustom);
    }

    // Trigger custom event for same-window updates
    window.dispatchEvent(new CustomEvent('modelSettingsUpdated'));
    
    setDeleteDialogOpen(false);
    setPendingDeleteModel(null);
  };

  if (isCollapsed && !showDeleteIcons) {
    return null; // Hide in collapsed state when used in sidebar
  }

  return (
    <>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className={`w-full bg-background border-input text-sm ${className}`}>
          <SelectValue placeholder="Select Model">
            <span className="truncate">{getDisplayName(value)}</span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="z-50 bg-popover border border-border text-sm">
          {availableModelOptions.map((model) => (
            <SelectItem 
              key={model.id} 
              value={model.id} 
              className={`text-sm transition-all duration-200 ${longPressModel === model.id ? 'scale-95 opacity-70' : ''}`}
              onTouchStart={() => handleLongPressStart(model.id, model.name, model.isCustom || false)}
              onTouchEnd={handleLongPressEnd}
              onMouseDown={() => handleLongPressStart(model.id, model.name, model.isCustom || false)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
            >
              <div className="flex items-center w-full">
                <span className="truncate">
                  {model.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Model"
        description={`Are you sure you want to delete "${pendingDeleteModel?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
};
