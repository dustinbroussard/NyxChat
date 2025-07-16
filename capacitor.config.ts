import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nyxchat.app',
  appName: 'NyxChat',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'DEFAULT',
      backgroundColor: '#000000',
      overlays: false
    },
    Keyboard: {
      resize: 'ionic',
      resizeOnFullScreen: true,
      style: 'dark'
    }
  },
  cordova: {
    preferences: {
      'KeyboardResize': 'body',
      'StatusBarOverlaysWebView': 'false'
    }
  }
};

export default config;
