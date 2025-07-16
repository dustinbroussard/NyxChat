
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone, Monitor, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installSource, setInstallSource] = useState<'browser' | 'ios' | 'android'>('browser');
  const [sessionDismissed, setSessionDismissed] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone === true ||
          document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    const detectPlatform = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setInstallSource('ios');
      } else if (/android/.test(userAgent)) {
        setInstallSource('android');
      } else {
        setInstallSource('browser');
      }
    };

    if (checkInstalled()) return;
    detectPlatform();

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show prompt after delay to avoid interfering with initial layout
      setTimeout(() => {
        if (!isInstalled && !sessionDismissed && !localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 15000); // Increased delay
    };

    const handleAppInstalled = () => {
      console.log('PWA: App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled, sessionDismissed]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Manual installation instructions
      if (installSource === 'ios') {
        alert('To install NyxChat on iOS:\n\n1. Tap the Share button (↗️)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\nEnjoy your native NyxChat experience!');
      } else {
        alert('To install NyxChat:\n\n1. Look for the install icon in your browser\'s address bar\n2. Or check your browser\'s menu for "Install App"\n3. Follow the prompts to install\n\nEnjoy your native NyxChat experience!');
      }
      return;
    }

    try {
      console.log('PWA: Prompting user for installation');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log(`PWA: User ${outcome} the install prompt`);
      
      if (outcome === 'accepted') {
        localStorage.removeItem('pwa-install-dismissed');
      } else {
        setSessionDismissed(true);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA: Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setSessionDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleNeverShow = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'never');
  };

  const getInstallText = () => {
    switch (installSource) {
      case 'ios':
        return 'Add to Home Screen';
      case 'android':
        return 'Install App';
      default:
        return 'Install NyxChat';
    }
  };

  const getInstallIcon = () => {
    switch (installSource) {
      case 'ios':
        return <Smartphone className="h-4 w-4" />;
      case 'android':
        return <Download className="h-4 w-4" />;
      default:
        return <Chrome className="h-4 w-4" />;
    }
  };

  // Don't show if installed, dismissed permanently, or on profiles page
  if (isInstalled || !showPrompt || localStorage.getItem('pwa-install-dismissed') === 'never') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-4 right-4 z-[100] md:left-auto md:right-4 md:max-w-sm"
        style={{ bottom: '80px' }} // Fixed positioning above footer
      >
        <Card className="border border-primary/20 bg-card/95 backdrop-blur-md shadow-xl rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 text-primary bg-primary/10 p-1.5 rounded-lg">
                {getInstallIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm mb-1">Install NyxChat</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Get instant access and work offline
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleInstallClick}
                    size="sm"
                    className="flex-1 h-8 text-xs font-medium rounded-lg"
                  >
                    {getInstallText()}
                  </Button>
                  <Button 
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-lg"
                    title="Dismiss"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <button
                  onClick={handleNeverShow}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                >
                  Don't show again
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
