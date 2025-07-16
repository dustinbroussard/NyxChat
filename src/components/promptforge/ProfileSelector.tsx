
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Profile {
  id: string;
  name: string;
  systemPrompt: string;
  model: string;
  temperature: number;
}

interface ProfileSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ value, onChange }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadProfiles();
    
    // Listen for storage changes to update profiles dynamically
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai-profiles') {
        loadProfiles();
      }
    };
    
    // Listen for custom events for same-window updates
    const handleProfileUpdate = () => {
      loadProfiles();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('modelSettingsUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('modelSettingsUpdated', handleProfileUpdate);
    };
  }, []);

  const loadProfiles = () => {
    const savedProfiles = localStorage.getItem('ai-profiles');
    if (savedProfiles) {
      const parsed = JSON.parse(savedProfiles);
      // Filter out any profiles with empty or invalid IDs
      const validProfiles = parsed.filter((profile: Profile) => profile.id && profile.id.trim() !== '');
      setProfiles(validProfiles);
    } else {
      // Create default profile if none exist
      const defaultProfile: Profile = {
        id: 'default',
        name: 'Default Assistant',
        systemPrompt: 'You are a helpful AI assistant. Be concise, accurate, and friendly.',
        model: 'openai/gpt-4o',
        temperature: 0.7
      };
      setProfiles([defaultProfile]);
      localStorage.setItem('ai-profiles', JSON.stringify([defaultProfile]));
    }
  };

  // Get the display name for the selected profile
  const getDisplayName = (profileId: string) => {
    if (profileId === 'global') return 'Global';
    const profile = profiles.find(p => p.id === profileId);
    return profile ? profile.name : 'Select Profile';
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full h-8 text-xs bg-background border-input">
        <SelectValue placeholder="Select Profile">
          <span className="truncate">{getDisplayName(value)}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="text-xs">
        <SelectItem value="global">Global</SelectItem>
        {profiles.map((profile) => (
          <SelectItem key={profile.id} value={profile.id}>
            <span className="truncate">{profile.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
