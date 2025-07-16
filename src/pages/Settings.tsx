import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from "@/components/ui/slider";
import { LightbulbOff, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ModelSelector } from '@/components/ui/ModelSelector';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { availableModels } from '@/constants/models';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

interface CustomModel {
  id: string;
  name: string;
  modelId: string;
}

interface AppSettings {
  selectedModel: string;
  customModels: CustomModel[];
  systemPrompt: string;
  maxContextLength: number;
  apiKey: string;
  temperature: number;
}

const Settings = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AppSettings>({
    selectedModel: 'openai/gpt-4o',
    customModels: [],
    systemPrompt: '',
    maxContextLength: 20,
    apiKey: '',
    temperature: 0.7
  });

  const [customModelForm, setCustomModelForm] = useState({
    name: '',
    modelId: ''
  });

  const [deletedDefaultModels, setDeletedDefaultModels] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteModel, setPendingDeleteModel] = useState<{id: string, name: string, isCustom: boolean} | null>(null);

  useEffect(() => {
    loadSettings();
    loadDeletedDefaultModels();
  }, []);

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({
        ...prev,
        ...parsed,
        temperature: parsed?.temperature ?? 0.7,
      }));
    } else {
      setSettings(prev => ({ ...prev, temperature: 0.7 }));
    }

    // Load API key separately for security
    const apiKey = localStorage.getItem('openrouter-api-key') || '';
    setSettings(prev => ({ ...prev, apiKey }));
  };

  const loadDeletedDefaultModels = () => {
    const deleted = localStorage.getItem('deleted-default-models');
    if (deleted) {
      setDeletedDefaultModels(JSON.parse(deleted));
    }
  };

  const saveSettings = (updatedSettings: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updatedSettings };
    setSettings(newSettings);

    // Save most settings except for apiKey
    const { apiKey, ...settingsToSave } = newSettings;
    localStorage.setItem('app-settings', JSON.stringify(settingsToSave));

    // Save API key separately
    if (apiKey) {
      localStorage.setItem('openrouter-api-key', apiKey);
    }

    // Trigger custom event for same-window updates
    window.dispatchEvent(new CustomEvent('modelSettingsUpdated'));

    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully."
    });
  };

  const saveDeletedDefaultModels = (deletedIds: string[]) => {
    localStorage.setItem('deleted-default-models', JSON.stringify(deletedIds));
    setDeletedDefaultModels(deletedIds);
    
    // Trigger custom event for same-window updates
    window.dispatchEvent(new CustomEvent('modelSettingsUpdated'));
  };

  const addCustomModel = () => {
    if (!customModelForm.name.trim() || !customModelForm.modelId.trim()) {
      toast({
        title: "Validation Error",
        description: "Both name and model ID are required for custom models.",
        variant: "destructive"
      });
      return;
    }

    const newModel: CustomModel = {
      id: crypto.randomUUID(),
      name: customModelForm.name.trim(),
      modelId: customModelForm.modelId.trim(),
    };

    const updatedCustomModels = [...settings.customModels, newModel];
    saveSettings({ customModels: updatedCustomModels });

    setCustomModelForm({ name: '', modelId: '' });

    toast({
      title: "Custom Model Added",
      description: `Model "${newModel.name}" has been added successfully.`
    });
  };

  const handleModelDeleteRequest = (modelId: string, isCustom: boolean) => {
    const modelName = isCustom 
      ? settings.customModels.find(m => m.modelId === modelId)?.name || modelId
      : availableModels.find(m => m.id === modelId)?.name || modelId;
    
    setPendingDeleteModel({ id: modelId, name: modelName, isCustom });
    setDeleteDialogOpen(true);
  };

  const confirmModelDelete = () => {
    if (!pendingDeleteModel) return;
    
    const { id: modelId, isCustom } = pendingDeleteModel;
    
    if (isCustom) {
      // Delete custom model
      const updatedCustomModels = settings.customModels.filter(m => m.modelId !== modelId);
      saveSettings({ customModels: updatedCustomModels });
      
      toast({
        title: "Custom Model Deleted",
        description: "Custom model has been removed successfully."
      });
    } else {
      // Delete default model
      const newDeleted = [...deletedDefaultModels, modelId];
      saveDeletedDefaultModels(newDeleted);

      // If the deleted model is selected, auto-switch to first available
      if (settings.selectedModel === modelId) {
        const allDefaults = availableModels.filter(d => !newDeleted.includes(d.id));
        const newSelected =
          allDefaults.length > 0
            ? allDefaults[0].id
            : settings.customModels[0]?.modelId || 'openai/gpt-4o';
        setSettings(prev => ({ ...prev, selectedModel: newSelected }));
        saveSettings({ selectedModel: newSelected });
      }

      toast({
        title: "Default Model Deleted",
        description: "Default model has been removed from the selection list."
      });
    }
    
    setDeleteDialogOpen(false);
    setPendingDeleteModel(null);
  };

  const handleSaveSettings = () => {
    saveSettings(settings);
  };

  return (
    <div className={`h-full flex flex-col no-horizontal-scroll ${isMobile ? 'p-2' : 'p-6'}`}>
      {/* Header with close button */}
      <div className="flex items-center justify-between mb-3">
        <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>Settings</h1>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className={`${isMobile ? 'h-7 w-7' : 'h-8 w-8'} ripple-button`}
        >
          <X className={`${isMobile ? 'h-4 w-4' : 'h-4 w-4'}`} />
        </Button>
      </div>

      <Card className={`flex-1`}>
        <CardContent className={`${isMobile ? 'p-2 space-y-2' : 'p-3 space-y-3'}`}>
          {/* Instructional/Tips Area */}
          <div className={`rounded-md bg-muted/30 px-2 py-1 text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} flex items-center gap-2 select-none`}>
            <LightbulbOff className={`${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            <span>
              Tip: Use <kbd className={`px-1 py-0.5 bg-muted rounded ${isMobile ? 'text-xs' : 'text-xs'}`}>Enter</kbd> to send, <kbd className={`px-1 py-0.5 bg-muted rounded ${isMobile ? 'text-xs' : 'text-xs'}`}>Shift+Enter</kbd> for new line.
            </span>
          </div>

          {/* AI Model Selection */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>AI Model Selection</h3>
            <ModelSelector
              value={settings.selectedModel}
              onChange={(value) => setSettings(prev => ({ ...prev, selectedModel: value }))}
              className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
              showDeleteIcons={true}
              onModelDelete={handleModelDeleteRequest}
            />
          </div>

          {/* Custom Model Management */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>Add Custom Model</h3>
            <div className={`${isMobile ? 'space-y-1' : 'grid grid-cols-1 md:grid-cols-2 gap-2'}`}>
              <Input
                placeholder="Model Name (e.g. Meta)"
                value={customModelForm.name}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, name: e.target.value }))}
                className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
              />
              <Input
                placeholder="Model ID (e.g. meta-llama/llama-3.3-70b-instruct:free)"
                value={customModelForm.modelId}
                onChange={(e) => setCustomModelForm(prev => ({ ...prev, modelId: e.target.value }))}
                className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
              />
            </div>
            <Button 
              onClick={addCustomModel}
              disabled={!customModelForm.name.trim() || !customModelForm.modelId.trim()}
              className={`${isMobile ? 'h-7 text-xs' : 'h-8 text-sm'} ripple-button elegant-transition`}
              size={isMobile ? "sm" : "default"}
            >
              Add Model
            </Button>
          </div>

          {/* System Prompt Configuration */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>System Prompt Configuration</h3>
            <Textarea
              placeholder="Enter system prompt to customize AI behavior..."
              value={settings.systemPrompt}
              onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
              className={`${isMobile ? 'min-h-12 text-xs' : 'min-h-16 text-sm'} resize-none`}
            />
          </div>

          {/* Temperature Control */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>Model Creativity (Temperature)</h3>
            <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Temperature: {settings.temperature.toFixed(2)}</label>
            <Slider
              value={[settings.temperature]}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  temperature: value[0],
                }))
              }
              max={1}
              min={0}
              step={0.01}
              className="mt-1"
            />
            <div className={`flex justify-between ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1`}>
              <span>More Predictable</span>
              <span>More Creative</span>
            </div>
          </div>

          {/* Context Settings */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>Context Settings</h3>
            <div>
              <label className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>Max Context Length</label>
              <Input
                type="number"
                min="1"
                max="50"
                value={settings.maxContextLength}
                onChange={(e) => setSettings(prev => ({ ...prev, maxContextLength: parseInt(e.target.value) || 20 }))}
                className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
              />
            </div>
          </div>

          {/* API Configuration */}
          <div className={`${isMobile ? 'space-y-1' : 'space-y-2'}`}>
            <h3 className={`${isMobile ? 'text-sm font-medium' : 'text-base font-medium'}`}>API Configuration</h3>
            <Input
              type="password"
              placeholder="Enter your API key..."
              value={settings.apiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
              className={isMobile ? 'h-7 text-xs' : 'h-8 text-sm'}
            />
          </div>

          {/* Save Button */}
          <div className={`flex gap-2 ${isMobile ? 'pt-1' : 'pt-2'}`}>
            <Button 
              onClick={handleSaveSettings}
              className={`${isMobile ? 'h-7 text-xs' : 'h-8 text-sm'} ripple-button elegant-transition`}
              size={isMobile ? "sm" : "default"}
            >
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Model"
        description={`Are you sure you want to delete "${pendingDeleteModel?.name}"? This action cannot be undone.`}
        onConfirm={confirmModelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default Settings;
