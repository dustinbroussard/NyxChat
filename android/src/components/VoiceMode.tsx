import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Profile } from '@/types';
import { useOpenRouter } from '@/hooks/useOpenRouter';
import { Settings, ArrowLeft } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useTheme } from '@/hooks/useTheme';
import { useTTS } from '@/hooks/useTTS';
import { toast } from 'sonner';

interface VoiceModeProps {
  activeProfile: Profile | null;
  memory: any;
  onSettingsClick: () => void;
  onBackToChat: () => void;
}

type VoiceState = 'inactive' | 'listening' | 'processing' | 'speaking';

interface ThemeColors {
  inactive: string;
  listening: string;
  processing: string;
  speaking: string;
}

const THEME_COLORS: Record<string, ThemeColors> = {
  'amoled-dark': {
    inactive: '#1a1a1a',
    listening: '#10b981',
    processing: '#8b5cf6',
    speaking: '#f59e0b'
  },
  'default-light': {
    inactive: '#374151',
    listening: '#10b981',
    processing: '#8b5cf6',
    speaking: '#f59e0b'
  },
  'blue-dark': {
    inactive: '#1e3a8a',
    listening: '#06b6d4',
    processing: '#3b82f6',
    speaking: '#0ea5e9'
  },
  'blue-light': {
    inactive: '#1e40af',
    listening: '#0891b2',
    processing: '#2563eb',
    speaking: '#0284c7'
  },
  'red-dark': {
    inactive: '#7f1d1d',
    listening: '#f97316',
    processing: '#dc2626',
    speaking: '#ea580c'
  },
  'red-light': {
    inactive: '#991b1b',
    listening: '#ea580c',
    processing: '#dc2626',
    speaking: '#f97316'
  }
};

export const VoiceMode = ({ activeProfile, memory, onSettingsClick, onBackToChat }: VoiceModeProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [voiceState, setVoiceState] = useState<VoiceState>('inactive');
  const [recognition, setRecognition] = useState<any>(null);
  const [volume, setVolume] = useState(0);
  const [targetVolume, setTargetVolume] = useState(0);
  const [currentMoodColor, setCurrentMoodColor] = useState('#1a1a1a');
  const [targetMoodColor, setTargetMoodColor] = useState('#1a1a1a');
  const [pulseOffset, setPulseOffset] = useState(0);
  const [particles, setParticles] = useState<any[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  
  const { theme } = useTheme();
  const { sendMessage, isLoading } = useOpenRouter();
  const { addMessage, createConversation } = useConversations();
  const { speak, isSupported: isTTSSupported, cancel: cancelTTS, isSpeaking } = useTTS();

  // Create a dedicated voice conversation
  const [voiceConversationId, setVoiceConversationId] = useState<string | null>(null);

  // Initialize voice conversation on mount
  useEffect(() => {
    const voiceConv = createConversation();
    setVoiceConversationId(voiceConv.id);
    console.log('Created voice conversation:', voiceConv.id);
  }, []);

  // Get theme colors
  const themeColors = THEME_COLORS[theme] || THEME_COLORS['amoled-dark'];

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;

    constructor(x: number, y: number, intensity: number = 1) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 3 * intensity;
      this.vy = (Math.random() - 0.5) * 3 * intensity;
      this.life = 1.0;
      this.size = Math.random() * 4 + 1;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 0.006;
      this.vx *= 0.98;
      this.vy *= 0.98;
    }
    
    draw(ctx: CanvasRenderingContext2D) {
      const alpha = this.life;
      const size = Math.max(0, this.size * alpha); // Ensure size is never negative
      if (size <= 0) return;
      
      ctx.save();
      ctx.globalAlpha = alpha * 0.8;
      ctx.fillStyle = currentMoodColor;
      ctx.beginPath();
      ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const updateVoiceState = useCallback((newState: VoiceState) => {
    console.log('Voice state change:', voiceState, '->', newState);
    setVoiceState(newState);
    
    const colors = themeColors;
    switch(newState) {
      case 'inactive':
        setTargetMoodColor(colors.inactive);
        setTargetVolume(0);
        break;
      case 'listening':
        setTargetMoodColor(colors.listening);
        setTargetVolume(0.2);
        break;
      case 'processing':
        setTargetMoodColor(colors.processing);
        setTargetVolume(0.4);
        break;
      case 'speaking':
        setTargetMoodColor(colors.speaking);
        setTargetVolume(0.7);
        break;
    }
  }, [voiceState, themeColors]);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      setSilenceTimer(null);
    }
  }, [silenceTimer]);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    const timer = setTimeout(() => {
      console.log('Silence timeout - processing speech');
      if (recognition && isRecognitionActive && lastTranscript.trim()) {
        recognition.stop();
        processQuery(lastTranscript.trim());
      }
    }, 3000);
    setSilenceTimer(timer);
  }, [recognition, isRecognitionActive, lastTranscript]);

  const initSpeechRecognition = useCallback(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const newRecognition = new SpeechRecognition();
      
      newRecognition.continuous = true;
      newRecognition.interimResults = true;
      newRecognition.lang = 'en-US';
      newRecognition.maxAlternatives = 1;

      newRecognition.onstart = () => {
        console.log('Speech recognition started');
        setIsRecognitionActive(true);
        updateVoiceState('listening');
      };

      newRecognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript.trim()) {
          console.log('Final transcript:', finalTranscript);
          setLastTranscript(finalTranscript.trim());
          clearSilenceTimer();
          newRecognition.stop();
          processQuery(finalTranscript.trim());
        } else if (interimTranscript.trim()) {
          console.log('Interim transcript:', interimTranscript);
          setLastTranscript(interimTranscript.trim());
          startSilenceTimer();
        }
      };

      newRecognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecognitionActive(false);
        clearSilenceTimer();
        
        if (event.error === 'not-allowed') {
          handleTTSSpeak("Microphone access denied. Please allow microphone access and try again.");
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          handleTTSSpeak("Speech recognition error. Returning to listening mode.");
          setTimeout(() => startListening(), 2000);
        }
      };

      newRecognition.onend = () => {
        console.log('Speech recognition ended');
        setIsRecognitionActive(false);
        clearSilenceTimer();
        
        // Only restart if we're still in listening mode and not processing
        if (voiceState === 'listening' && !isLoading && !isSpeaking) {
          setTimeout(() => startListening(), 500);
        }
      };

      setRecognition(newRecognition);
    } else {
      console.warn('Speech recognition not supported');
      toast.error('Speech recognition is not supported in this browser.');
    }
  }, [voiceState, isLoading, isSpeaking, startSilenceTimer, clearSilenceTimer]);

  const startListening = useCallback(() => {
    if (recognition && !isRecognitionActive && voiceState !== 'processing' && !isSpeaking) {
      try {
        setLastTranscript('');
        recognition.start();
        console.log('Starting initial listening state');
      } catch (error) {
        console.error('Recognition start failed:', error);
      }
    }
  }, [recognition, isRecognitionActive, voiceState, isSpeaking]);

  const processQuery = async (query: string) => {
    if (!activeProfile || !voiceConversationId) {
      handleTTSSpeak("Please create a profile first");
      return;
    }

    console.log('Processing voice query:', query);
    updateVoiceState('processing');
    
    try {
      // Add user message to conversation
      addMessage(voiceConversationId, {
        role: 'user',
        content: query,
      });

      await sendMessage({
        message: query,
        conversationId: voiceConversationId,
        profile: activeProfile,
        memory: memory?.content || ''
      });
      
      // Get the latest message from the conversation to speak
      setTimeout(() => {
        const conversation = JSON.parse(localStorage.getItem('nyx-conversations') || '[]')
          .find((c: any) => c.id === voiceConversationId);
        
        if (conversation && conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          if (lastMessage.role === 'assistant') {
            handleTTSSpeak(lastMessage.content);
          }
        }
      }, 1000);
      
    } catch (error) {
      console.error('Voice processing error:', error);
      handleTTSSpeak("Sorry, I encountered an error processing your request.");
      updateVoiceState('listening');
      setTimeout(() => startListening(), 1000);
    }
  };

  const handleTTSSpeak = useCallback((text: string) => {
    if (!isTTSSupported) {
      console.error('TTS not supported');
      toast.error('Text-to-speech is not supported in this browser');
      updateVoiceState('listening');
      setTimeout(() => startListening(), 1000);
      return;
    }

    console.log('Speaking:', text);
    updateVoiceState('speaking');
    
    speak(text, {
      onStart: () => {
        console.log('TTS started');
        updateVoiceState('speaking');
      },
      onEnd: () => {
        console.log('TTS ended, returning to listening');
        updateVoiceState('listening');
        setTimeout(() => startListening(), 800);
      },
      onError: () => {
        console.error('TTS error, returning to listening');
        toast.error('Text-to-speech failed');
        updateVoiceState('listening');
        setTimeout(() => startListening(), 1000);
      }
    });
  }, [speak, isTTSSupported, startListening, updateVoiceState]);

  const drawOrb = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.12;
    const volumeRadius = volume * (baseRadius * 1.8);
    const pulseRadius = Math.sin(pulseOffset) * (baseRadius * 0.2);
    const radius = Math.max(10, baseRadius + volumeRadius + pulseRadius); // Ensure minimum radius

    const x = canvas.width / 2;
    const y = canvas.height / 2;

    // Outer glow with breathing effect
    const breathingIntensity = Math.sin(pulseOffset * 0.5) * 0.3 + 0.7;
    const outerGlow = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 3.5);
    outerGlow.addColorStop(0, `${currentMoodColor}${Math.floor(breathingIntensity * 80).toString(16).padStart(2, '0')}`);
    outerGlow.addColorStop(0.4, `${currentMoodColor}${Math.floor(breathingIntensity * 40).toString(16).padStart(2, '0')}`);
    outerGlow.addColorStop(0.8, `${currentMoodColor}${Math.floor(breathingIntensity * 20).toString(16).padStart(2, '0')}`);
    outerGlow.addColorStop(1, 'rgba(0,0,0,0)');
    
    ctx.beginPath();
    ctx.fillStyle = outerGlow;
    ctx.arc(x, y, radius * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Main orb
    const gradient = ctx.createRadialGradient(x, y, 10, x, y, radius);
    gradient.addColorStop(0, `${currentMoodColor}FF`);
    gradient.addColorStop(0.4, `${currentMoodColor}CC`);
    gradient.addColorStop(0.8, `${currentMoodColor}66`);
    gradient.addColorStop(1, `${currentMoodColor}22`);

    ctx.beginPath();
    ctx.fillStyle = gradient;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner core
    const coreIntensity = voiceState === 'speaking' ? 1.2 : voiceState === 'processing' ? 0.9 : 0.6;
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.5);
    coreGradient.addColorStop(0, `${currentMoodColor}FF`);
    coreGradient.addColorStop(0.6, `${currentMoodColor}${Math.floor(coreIntensity * 200).toString(16).padStart(2, '0')}`);
    coreGradient.addColorStop(1, `${currentMoodColor}${Math.floor(coreIntensity * 100).toString(16).padStart(2, '0')}`);
    
    ctx.beginPath();
    ctx.fillStyle = coreGradient;
    ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Draw particles
    particles.forEach(p => p.draw(ctx));
  }, [currentMoodColor, volume, pulseOffset, particles, voiceState]);

  const lerpColor = useCallback((color1: string, color2: string, factor: number) => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);
    
    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }, []);

  const animate = useCallback(() => {
    // Smooth transitions
    setVolume(prev => prev + (targetVolume - prev) * 0.1);
    setCurrentMoodColor(prev => lerpColor(prev, targetMoodColor, 0.05));
    
    // State-specific volume simulation
    if (voiceState === 'listening') {
      setTargetVolume(0.15 + Math.sin(Date.now() * 0.002) * 0.08);
    } else if (voiceState === 'speaking') {
      setTargetVolume(0.6 + Math.sin(Date.now() * 0.012) * 0.3);
    } else if (voiceState === 'processing') {
      setTargetVolume(0.35 + Math.sin(Date.now() * 0.006) * 0.15);
    }
    
    // Pulse animation
    const pulseSpeed = voiceState === 'processing' ? 0.2 : voiceState === 'speaking' ? 0.15 : 0.04;
    setPulseOffset(prev => prev + pulseSpeed);
    
    // Enhanced particle system
    if (volume > 0.05 || voiceState !== 'inactive') {
      const particleCount = voiceState === 'processing' ? 6 : voiceState === 'speaking' ? 4 : 2;
      const intensity = voiceState === 'speaking' ? 1.5 : voiceState === 'processing' ? 1.2 : 0.8;
      const newParticles = [];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 60 + Math.random() * 40;
        const px = (canvasRef.current?.width || 0) / 2 + Math.cos(angle) * distance;
        const py = (canvasRef.current?.height || 0) / 2 + Math.sin(angle) * distance;
        newParticles.push(new Particle(px, py, intensity));
      }
      
      setParticles(prev => [...prev, ...newParticles]);
    }

    setParticles(prev => prev.filter(p => p.life > 0).map(p => {
      p.update();
      return p;
    }));
    
    drawOrb();
    animationRef.current = requestAnimationFrame(animate);
  }, [targetVolume, targetMoodColor, voiceState, volume, lerpColor, drawOrb]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (voiceState === 'speaking') {
      // Interrupt speaking and return to listening
      cancelTTS();
      updateVoiceState('listening');
      setTimeout(() => startListening(), 600);
    } else if (voiceState === 'processing') {
      // Can't interrupt processing
      console.log('Cannot interrupt while processing');
    } else if (voiceState === 'listening') {
      // Toggle to inactive
      if (recognition && isRecognitionActive) {
        recognition.stop();
      }
      updateVoiceState('inactive');
    } else {
      // Start listening
      updateVoiceState('listening');
      setTimeout(() => startListening(), 300);
    }
  }, [voiceState, recognition, isRecognitionActive, cancelTTS, startListening, updateVoiceState]);

  // Initialize and start
  useEffect(() => {
    initSpeechRecognition();
    resizeCanvas();
    
    const handleResize = () => resizeCanvas();
    window.addEventListener('resize', handleResize);
    
    // Start animation loop
    animationRef.current = requestAnimationFrame(animate);
    
    // Auto-start listening after setup
    setTimeout(() => {
      updateVoiceState('listening');
      setTimeout(() => startListening(), 500);
    }, 1000);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (recognition && isRecognitionActive) {
        recognition.stop();
      }
      cancelTTS();
      clearSilenceTimer();
    };
  }, []);

  // Update colors when theme changes
  useEffect(() => {
    updateVoiceState(voiceState);
  }, [theme]);

  const getStatusText = () => {
    switch(voiceState) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return 'Tap to start';
    }
  };

  return (
    <div 
      className="fixed inset-0 text-white overflow-hidden transition-all duration-1000 ease-in-out"
      style={{
        background: `radial-gradient(circle, ${currentMoodColor}15 0%, black 85%)`
      }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none transition-opacity duration-500 cursor-pointer"
        onClick={handleCanvasClick}
      />
      
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out">
        <div className="text-center">
          <h1 className="text-2xl md:text-4xl font-bold tracking-wider mb-4 transition-all duration-300">
            N Y X C H A T
          </h1>
          <p className="text-sm opacity-60 transition-opacity duration-300">
            {getStatusText()}
          </p>
          {activeProfile && (
            <p className="text-xs opacity-40 mt-2 transition-opacity duration-300">
              Using {activeProfile.name} • {activeProfile.model}
            </p>
          )}
        </div>
      </div>

      <div className="absolute top-4 right-4 flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettingsClick}
          className="text-white hover:bg-white/20 transition-all duration-200 hover:scale-105"
        >
          <Settings className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onBackToChat}
          className="text-white hover:bg-white/20 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="absolute bottom-4 right-4 text-xs opacity-40 transition-opacity duration-300">
        {activeProfile ? `${activeProfile.name} Active` : 'No profile selected'}
      </div>

      <div className="absolute bottom-4 left-4 text-xs opacity-40 transition-opacity duration-300">
        Tap orb to control • Voice mode active
      </div>
    </div>
  );
};
