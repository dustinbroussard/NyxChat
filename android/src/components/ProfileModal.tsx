import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Profile } from '@/types';
import { Plus, Edit, Trash, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: Profile[];
  activeProfile: Profile | null;
  onCreateProfile: (data: Omit<Profile, 'id' | 'createdAt'>) => Profile;
  onUpdateProfile: (id: string, updates: Partial<Profile>) => void;
  onDeleteProfile: (id: string) => void;
  onSetActiveProfile: (profile: Profile) => void;
}

export const ProfileModal = ({
  isOpen,
  onClose,
  profiles,
  activeProfile,
  onCreateProfile,
  onUpdateProfile,
  onDeleteProfile,
  onSetActiveProfile,
}: ProfileModalProps) => {
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    systemPrompt: '',
    model: 'openai/gpt-4o',
    temperature: 0.7,
  });

  const { models, isLoading: modelsLoading } = useOpenRouterModels();

  // Check if a model is free (pricing of 0 or very low cost)
  const isFreeModel = (model: any) => {
    if (!model.pricing) return false;
    const promptCost = parseFloat(model.pricing.prompt || '0');
    const completionCost = parseFloat(model.pricing.completion || '0');
    return promptCost === 0 && completionCost === 0;
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
                         model.name.toLowerCase().includes(modelSearch.toLowerCase());
    const matchesFreeFilter = !showFreeOnly || isFreeModel(model);
    return matchesSearch && matchesFreeFilter;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      systemPrompt: '',
      model: 'openai/gpt-4o',
      temperature: 0.7,
    });
    setEditingProfile(null);
    setIsCreating(false);
    setModelSearch('');
    setShowFreeOnly(false);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      systemPrompt: '',
      model: 'openai/gpt-4o',
      temperature: 0.7,
    });
    setEditingProfile(null);
  };

  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      systemPrompt: profile.systemPrompt,
      model: profile.model,
      temperature: profile.temperature,
    });
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    if (!formData.systemPrompt.trim()) {
      toast.error('System prompt is required');
      return;
    }

    if (!formData.model.trim()) {
      toast.error('Model selection is required');
      return;
    }

    try {
      if (editingProfile) {
        onUpdateProfile(editingProfile.id, formData);
        toast.success('Profile updated');
      } else {
        const newProfile = onCreateProfile(formData);
        onSetActiveProfile(newProfile);
        toast.success('Profile created');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Profile save error:', error);
    }
  };

  const handleDelete = (profile: Profile) => {
    if (profiles.length === 1) {
      toast.error('Cannot delete the last profile');
      return;
    }

    if (confirm(`Delete profile "${profile.name}"?`)) {
      try {
        onDeleteProfile(profile.id);
        toast.success('Profile deleted');
      } catch (error) {
        toast.error('Failed to delete profile');
        console.error('Profile delete error:', error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            AI Profiles
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Profile List */}
          <div className="border-b border-border">
            <div className="flex items-center justify-between p-4 pb-2">
              <h3 className="font-medium text-sm">Your Profiles</h3>
              <Button onClick={handleCreate} size="sm" className="h-8">
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            </div>

            <ScrollArea className="h-32 px-4">
              <div className="space-y-2 pb-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-2 rounded-md border cursor-pointer transition-colors text-sm ${
                      activeProfile?.id === profile.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent'
                    }`}
                    onClick={() => onSetActiveProfile(profile)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">{profile.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile.model}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(profile);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(profile);
                          }}
                        >
                          <Trash className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Profile Editor */}
          <div className="flex-1 min-h-0">
            {(isCreating || editingProfile) ? (
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <h3 className="font-medium text-sm">
                    {editingProfile ? 'Edit Profile' : 'Create Profile'}
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="name" className="text-sm">Profile Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Creative Writer"
                        className="h-9 text-sm"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">AI Model</Label>
                      <Select 
                        value={formData.model} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent className="max-h-80">
                          <div className="p-2 space-y-2 border-b sticky top-0 bg-background">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                              <Input
                                placeholder="Search models..."
                                value={modelSearch}
                                onChange={(e) => setModelSearch(e.target.value)}
                                className="h-8 pl-7 text-xs"
                                onFocus={(e) => {
                                  // Prevent mobile keyboard from pushing content up
                                  setTimeout(() => {
                                    e.target.scrollIntoView({ 
                                      behavior: 'smooth', 
                                      block: 'center' 
                                    });
                                  }, 100);
                                }}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="free-only"
                                checked={showFreeOnly}
                                onCheckedChange={(checked) => setShowFreeOnly(checked === true)}
                              />
                              <Label 
                                htmlFor="free-only" 
                                className="text-xs text-muted-foreground cursor-pointer"
                              >
                                Free models only
                              </Label>
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {modelsLoading ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Loading models...
                              </div>
                            ) : filteredModels.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No models found
                              </div>
                            ) : (
                              filteredModels.map((model) => (
                                <SelectItem key={model.id} value={model.id} className="text-sm">
                                  <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{model.name}</span>
                                      {isFreeModel(model) && (
                                        <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                                          FREE
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{model.id}</span>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">
                        Temperature: {formData.temperature.toFixed(1)}
                      </Label>
                      <Slider
                        value={[formData.temperature]}
                        onValueChange={([value]) => setFormData(prev => ({ ...prev, temperature: value }))}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="systemPrompt" className="text-sm">System Prompt</Label>
                      <Textarea
                        id="systemPrompt"
                        value={formData.systemPrompt}
                        onChange={(e) => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                        placeholder="Define the AI's personality and behavior..."
                        rows={4}
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleSave} className="gradient-primary text-white h-9">
                      {editingProfile ? 'Update' : 'Create'} Profile
                    </Button>
                    <Button variant="outline" onClick={resetForm} className="h-9">
                      Cancel
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center h-full text-center p-4">
                <div>
                  <User className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Select a profile to edit or create a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
