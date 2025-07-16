
import { useState, useEffect } from 'react';
import { Profile } from '@/types';

const STORAGE_KEY = 'nyx-profiles';
const ACTIVE_KEY = 'nyx-active-profile';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfileState] = useState<Profile | null>(null);

  // Load profiles from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const loadedProfiles = JSON.parse(saved);
        setProfiles(loadedProfiles);
        
        // Set active profile from storage or first profile
        const activeId = localStorage.getItem(ACTIVE_KEY);
        const active = activeId 
          ? loadedProfiles.find((p: Profile) => p.id === activeId)
          : loadedProfiles[0];
        
        setActiveProfileState(active || null);
      } catch (error) {
        console.error('Failed to load profiles:', error);
      }
    } else {
      // Create default profile if none exist
      createDefaultProfile();
    }
  }, []);

  // Save profiles to localStorage
  useEffect(() => {
    if (profiles.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
    }
  }, [profiles]);

  const createDefaultProfile = () => {
    const defaultProfile: Profile = {
      id: 'default',
      name: 'Assistant',
      systemPrompt: 'You are a helpful, harmless, and honest AI assistant.',
      model: 'openai/gpt-4o',
      temperature: 0.7,
      createdAt: Date.now(),
    };

    setProfiles([defaultProfile]);
    setActiveProfileState(defaultProfile);
  };

  const setActiveProfile = (profile: Profile) => {
    setActiveProfileState(profile);
    localStorage.setItem(ACTIVE_KEY, profile.id);
  };

  const createProfile = (data: Omit<Profile, 'id' | 'createdAt'>): Profile => {
    const newProfile: Profile = {
      ...data,
      id: Date.now().toString(),
      createdAt: Date.now(),
    };

    setProfiles(prev => [...prev, newProfile]);
    return newProfile;
  };

  const updateProfile = (id: string, updates: Partial<Profile>) => {
    setProfiles(prev => prev.map(profile =>
      profile.id === id ? { ...profile, ...updates } : profile
    ));

    // Update active profile if it's the one being updated
    if (activeProfile?.id === id) {
      setActiveProfileState(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteProfile = (id: string) => {
    setProfiles(prev => {
      const filtered = prev.filter(profile => profile.id !== id);
      
      // If deleting active profile, switch to first remaining
      if (activeProfile?.id === id && filtered.length > 0) {
        setActiveProfile(filtered[0]);
      }
      
      return filtered;
    });
  };

  return {
    profiles,
    activeProfile,
    setActiveProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  };
};
