
import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

interface TTSSettings {
  engine: 'web' | 'google';
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

const DEFAULT_SETTINGS: TTSSettings = {
  engine: 'web',
  voice: '',
  rate: 0.9,
  pitch: 1.1,
  volume: 0.8,
  language: 'en-US'
};

export const useTTS = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<TTSSettings>(() => {
    const saved = localStorage.getItem('nyx-tts-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Initialize TTS
  const initTTS = useCallback(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
      console.log('TTS initialized successfully');
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = speechSynthesis.getVoices();
        setVoices(availableVoices);
        console.log('TTS voices loaded:', availableVoices.length);
      };
      
      loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
    } else {
      console.warn('Speech synthesis not supported');
      setIsSupported(false);
    }
  }, []);

  // Save settings
  const updateSettings = useCallback((newSettings: Partial<TTSSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('nyx-tts-settings', JSON.stringify(updated));
  }, [settings]);

  // Web Speech API implementation
  const speakWithWebAPI = useCallback((text: string, options: TTSOptions = {}) => {
    if (!isSupported || !text.trim()) {
      console.error('TTS not supported or empty text');
      options.onError?.();
      return;
    }

    // Cancel any existing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance.current = utterance;

    // Apply settings
    utterance.rate = options.rate || settings.rate;
    utterance.pitch = options.pitch || settings.pitch;
    utterance.volume = options.volume || settings.volume;
    utterance.lang = settings.language;

    // Find and set voice
    if (options.voice) {
      utterance.voice = options.voice;
    } else if (settings.voice) {
      const selectedVoice = voices.find(v => v.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    // Event handlers
    utterance.onstart = () => {
      console.log('TTS started');
      setIsSpeaking(true);
      options.onStart?.();
    };

    utterance.onend = () => {
      console.log('TTS ended');
      setIsSpeaking(false);
      currentUtterance.current = null;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('TTS error:', event.error);
      setIsSpeaking(false);
      currentUtterance.current = null;
      options.onError?.();
    };

    // Speak with retry mechanism
    try {
      speechSynthesis.speak(utterance);
      console.log('TTS speak command executed');
    } catch (error) {
      console.error('TTS speak failed:', error);
      setIsSpeaking(false);
      options.onError?.();
    }
  }, [isSupported, settings, voices]);

  // Google Cloud TTS implementation (placeholder for future)
  const speakWithGoogleAPI = useCallback(async (text: string, options: TTSOptions = {}) => {
    // This would be implemented when Google Cloud TTS is added
    console.log('Google Cloud TTS not yet implemented, falling back to Web API');
    speakWithWebAPI(text, options);
  }, [speakWithWebAPI]);

  // Main speak function
  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    console.log('TTS speak requested:', text.substring(0, 50) + '...');
    if (settings.engine === 'google') {
      speakWithGoogleAPI(text, options);
    } else {
      speakWithWebAPI(text, options);
    }
  }, [settings.engine, speakWithWebAPI, speakWithGoogleAPI]);

  // Cancel speech
  const cancel = useCallback(() => {
    if (isSupported && speechSynthesis.speaking) {
      console.log('TTS cancel requested');
      speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtterance.current = null;
    }
  }, [isSupported]);

  // Pause/Resume
  const pause = useCallback(() => {
    if (isSupported && speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (isSupported && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
  }, [isSupported]);

  // Initialize on mount
  useEffect(() => {
    initTTS();
  }, [initTTS]);

  return {
    speak,
    cancel,
    pause,
    resume,
    isSupported,
    isSpeaking,
    voices,
    settings,
    updateSettings,
    initTTS
  };
};
