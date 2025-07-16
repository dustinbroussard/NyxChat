
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/contexts/ThemeContext';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange
}) => {
  const { theme, toggleTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  const [autoSave, setAutoSave] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const handleReset = () => {
    setFontSize(16);
    setAutoSave(true);
    setSoundEnabled(false);
    toast.success('Settings reset to defaults');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl border-2 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Settings</DialogTitle>
          <DialogDescription>
            Customize your NyxChat experience
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme Settings */}
          <div className="space-y-3">
            <h4 className="font-medium">Appearance</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="text-sm">
                Dark Mode
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="space-y-3">
            <h4 className="font-medium">Text & Display</h4>
            <div className="space-y-2">
              <Label className="text-sm">Font Size: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                onValueChange={(value) => setFontSize(value[0])}
                max={24}
                min={12}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          {/* Chat Settings */}
          <div className="space-y-3">
            <h4 className="font-medium">Chat Behavior</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-save" className="text-sm">
                Auto-save conversations
              </Label>
              <Switch
                id="auto-save"
                checked={autoSave}
                onCheckedChange={setAutoSave}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="text-sm">
                Sound notifications
              </Label>
              <Switch
                id="sound"
                checked={soundEnabled}
                onCheckedChange={setSoundEnabled}
              />
            </div>
          </div>

          <Separator />

          {/* Reset */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleReset}
              className="rounded-xl"
            >
              Reset to Defaults
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
