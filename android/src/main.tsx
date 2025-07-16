
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enhanced service worker registration for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('SW registered successfully:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available');
              // Optionally show update notification
            }
          });
        }
      });
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60000); // Check every minute
      
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
