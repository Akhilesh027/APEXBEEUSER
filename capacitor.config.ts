import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apexbee.app',
  appName: 'ApexBee',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      '*.razorpay.com',
      'api.razorpay.com',
      'checkout.razorpay.com',
      'server.apexbee.in',
      '*.apexbee.in',
      'api.bigdatacloud.net',
      'nominatim.openstreetmap.org',
      'api.postalpincode.in'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A1128',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A1128',
    },
  },
};

export default config;
