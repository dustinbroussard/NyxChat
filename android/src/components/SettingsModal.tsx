import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ContextSettings } from '@/components/ContextSettings';
import { ContextPreview } from '@/components/ContextPreview';
import { QuickActionsSettings } from '@/components/QuickActionsSettings';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Key, Palette, Zap, Globe, Download, Bug } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Theme = 'amoled-dark' | 'default-light' | 'blue-dark' | 'blue-light' | 'red-dark' | 'red-light';

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { theme, setTheme } = useTheme();
  const [openRouterKey, setOpenRouterKey] = useState(() => 
    localStorage.getItem('openrouter-api-key') || ''
  );
  const [debugMode, setDebugMode] = useState(() => 
    localStorage.getItem('debug-mode') === 'true'
  );

  const handleOpenRouterKeyChange = (value: string) => {
    setOpenRouterKey(value);
    if (value) {
      localStorage.setItem('openrouter-api-key', value);
      toast.success('OpenRouter API key saved');
    } else {
      localStorage.removeItem('openrouter-api-key');
    }
  };

  const handleDebugModeChange = (enabled: boolean) => {
    setDebugMode(enabled);
    localStorage.setItem('debug-mode', enabled.toString());
    toast.success(`Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  };

  const exportData = () => {
    try {
      const data = {
        conversations: JSON.parse(localStorage.getItem('nyx-conversations') || '[]'),
        profiles: JSON.parse(localStorage.getItem('nyx-profiles') || '[]'),
        memory: JSON.parse(localStorage.getItem('nyx-memory') || '{"content":"","updatedAt":0}'),
        settings: {
          theme,
          contextSettings: JSON.parse(localStorage.getItem('context-settings') || '{}'),
          quickActions: JSON.parse(localStorage.getItem('nyx-quick-actions') || '[]')
        }
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nyxchat-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const themes: { value: Theme; label: string; description: string }[] = [
    { value: 'amoled-dark', label: 'AMOLED Dark', description: 'Pure black for OLED displays' },
    { value: 'default-light', label: 'Default Light', description: 'Clean white interface' },
    { value: 'blue-dark', label: 'Blue Dark', description: 'Deep blue nighttime theme' },
    { value: 'blue-light', label: 'Blue Light', description: 'Bright blue daytime theme' },
    { value: 'red-dark', label: 'Red Dark', description: 'Crimson dark theme' },
    { value: 'red-light', label: 'Red Light', description: 'Warm red theme' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="debug">Debug</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Configure your API keys for AI models and external services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                  <Input
                    id="openrouter-key"
                    type="password"
                    placeholder="Enter your OpenRouter API key"
                    value={openRouterKey}
                    onChange={(e) => handleOpenRouterKeyChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Get your API key at{' '}
                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      OpenRouter
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Data Management
                </CardTitle>
                <CardDescription>
                  Export your conversations, profiles, and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={exportData} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="context" className="space-y-6">
            <ContextSettings />
            <Separator />
            <ContextPreview />
          </TabsContent>

          <TabsContent value="themes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme Selection
                </CardTitle>
                <CardDescription>
                  Choose your preferred visual theme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themes.map((themeOption) => (
                    <div
                      key={themeOption.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        theme === themeOption.value 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setTheme(themeOption.value)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{themeOption.label}</h4>
                          <p className="text-sm text-muted-foreground">
                            {themeOption.description}
                          </p>
                        </div>
                        {theme === themeOption.value && (
                          <div className="w-4 h-4 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Customize your quick action buttons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <QuickActionsSettings />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="debug" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="w-5 h-5" />
                  Debug Mode
                </CardTitle>
                <CardDescription>
                  Enable additional logging and debugging features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="debug-mode">Enable Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Show detailed request/response logs in console
                    </p>
                  </div>
                  <Switch
                    id="debug-mode"
                    checked={debugMode}
                    onCheckedChange={handleDebugModeChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
