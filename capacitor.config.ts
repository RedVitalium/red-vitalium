/// <reference types="@capacitor/background-runner" />

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.redvitalium.app',
  appName: 'Red Vitalium',
  webDir: 'dist',
  plugins: {
    BackgroundRunner: {
      label: 'mx.redvitalium.background',
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
