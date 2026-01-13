/// <reference types="@capacitor/background-runner" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.4f0dcdedef7541a2917bb2433032ca64',
  appName: 'Vitalium',
  webDir: 'dist',
  server: {
    url: 'https://4f0dcded-ef75-41a2-917b-b2433032ca64.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BackgroundRunner: {
      label: 'app.lovable.vitalium.background',
      src: 'runners/background.js',
      event: 'syncHealthData',
      repeat: true,
      interval: 60, // Every 60 minutes
      autoStart: true,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#6366f1',
    },
  },
};

export default config;
