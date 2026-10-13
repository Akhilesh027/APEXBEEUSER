import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.apexbee.app',
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
      'api.postalpincode.in',
      'accounts.google.com',
      '*.google.com',
      '*.googleapis.com'
    ]
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    GoogleSignIn: {
      clientId: '185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com',
      serverClientId: '185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com',
    },
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
