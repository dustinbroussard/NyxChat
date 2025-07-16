
import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as any).standalone ||
          document.referrer.includes('android-app://')) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay if not dismissed this session
      if (!sessionStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('App installed');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        console.log('Triggering native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log(`User ${outcome} the install prompt`);
        
        if (outcome === 'dismissed') {
          sessionStorage.setItem('pwa-prompt-dismissed', 'true');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
    } else {
      // Only show manual instructions if no native prompt is available
      console.log('No deferred prompt available, hiding install prompt');
      sessionStorage.setItem('pwa-prompt-dismissed', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  // Only show if we have a deferred prompt (native install available)
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-in-up">
      <Card className="p-3 bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/20 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-primary/20 flex-shrink-0">
            <Smartphone className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">Install NyxChat</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Get faster access and offline features by installing our app
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="flex-1 h-8 text-xs rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Download className="w-3 h-3 mr-1" />
                Install
              </Button>
              <Button 
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-xl flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
