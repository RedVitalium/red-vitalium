/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.redvitalium.app',
  appName: 'Red Vitalium',
  webDir: 'dist',
  android: {
    adjustMarginsForEdgeToEdge: 'force',
    captureInput: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    },
    SystemBars: {
      insetsHandling: 'disable',
    },
    EdgeToEdge: {
      statusBarColor: '#ffffff',
      backgroundColor: '#ffffff',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: false,
    },
  },
};

export default config;