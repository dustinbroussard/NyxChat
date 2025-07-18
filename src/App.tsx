
import React, { useState, useEffect } from "react";
import SplashScreen from "@/components/ui/SplashScreen";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { MemoryProvider } from "@/contexts/MemoryContext";
import MainLayout from "@/components/layout/MainLayout";
import ChatInterface from "@/pages/ChatInterface";
import MemoryManager from "@/pages/MemoryManager";
import ProfileManager from "@/pages/ProfileManager";
import Settings from "@/pages/Settings";
import VoiceMode from "@/pages/VoiceMode";
import NotFound from "./pages/NotFound";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import "./animations.css";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const App: React.FC<void> = () => {
  const [isLoading, setIsLoading] = useState(true); // Start with splash screen visible
  useEffect(() => {
  const initCapacitorPlugins = async () => {
    interface CapacitorWindow extends Window {
      Capacitor?: {
        isNativePlatform: boolean;
      };
    }
    
    const isNative = !!(window as CapacitorWindow).Capacitor?.isNativePlatform;
    if (!isNative) return;

    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');

    // Prevent status bar overlap
    await StatusBar.setOverlaysWebView({ overlay: false });

    // Sync with current theme
    const updateStatusBarStyle = () => {
      const isDark = document.documentElement.classList.contains('dark');
      StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
    };

    updateStatusBarStyle();

    const observer = new MutationObserver(updateStatusBarStyle);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

// Keyboard resize fix - using Ionic mode for better keyboard handling
await Keyboard.setResizeMode({ mode: KeyboardResize.Ionic });
// Use Capacitor Keyboard events to track keyboard height natively
Keyboard.addListener('keyboardDidShow', info => setKeyboardHeight(info.keyboardHeight));
Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
};

  initCapacitorPlugins();
}, []);

  useEffect(() => {
    // Faster initialization without artificial delay
    const timer = setTimeout(() => setIsLoading(false), 500); // Increased delay to 500ms
    
    // Preload critical resources
    const preloadImages = [
      './icon-192.png',
      './icon-512.png',
      './lovable-uploads/2fe14165-cccc-44c9-a268-7ab4c910b4d8.png',
      './lovable-uploads/f1345f48-4cf9-47e5-960c-3b6d62925c7f.png'
    ];
    
    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
    
    return () => clearTimeout(timer);
  }, []);

  // Handle viewport height for mobile
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
const setVH = () => {
  const vh = Math.min(window.innerHeight, (window.innerHeight - keyboardHeight)) * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

    interface KeyboardEventDetail {
      keyboardHeight: number;
    }

const handleKeyboardShow = (e: CustomEvent<KeyboardEventDetail>) => {
  console.log('Keyboard will show:', e.detail.keyboardHeight);
  setKeyboardHeight(e.detail.keyboardHeight);
  document.documentElement.classList.add('keyboard-visible');
};

const handleKeyboardHide = () => {
  console.log('Keyboard will hide');
  setKeyboardHeight(0);
  document.documentElement.classList.remove('keyboard-visible');
};

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
// Keyboard height handled via Capacitor Keyboard plugin listeners
    window.addEventListener('keyboardWillShow', handleKeyboardShow);
    window.addEventListener('keyboardWillHide', handleKeyboardHide);
    
    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
      window.removeEventListener('keyboardWillShow', handleKeyboardShow);
      window.removeEventListener('keyboardWillHide', handleKeyboardHide);
    };
  }, [keyboardHeight]);

  const isAndroid = /android/i.test(navigator.userAgent);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MemoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ChatProvider>
                <div className={`min-h-screen bg-background transition-colors duration-300 ${isAndroid ? 'android' : ''}`} style={{ minHeight: 'calc(var(--vh, 1vh) * 100)' }}>
                  <SplashScreen className={isLoading ? '' : 'hidden'} />
                  <Routes>
                    <Route path="/" element={<MainLayout />}>
                      <Route index element={<ChatInterface keyboardHeight={keyboardHeight} />} />
                    <Route path="memory" element={<MemoryManager />} />
                    <Route path="profiles" element={<ProfileManager />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="voice" element={<VoiceMode />} />
                  </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <PWAInstallPrompt />
                </div>
              </ChatProvider>
            </BrowserRouter>
          </TooltipProvider>
        </MemoryProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
