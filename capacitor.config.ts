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
      clientId: '716798071591-888nf6hvugrcjg2vn9nu2lf3tpug7b4e.apps.googleusercontent.com',
      serverClientId: '716798071591-jrthopm7ggscqnfhl9tvb5teg9sbvg2r.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
    GoogleSignIn: {
      clientId: '716798071591-888nf6hvugrcjg2vn9nu2lf3tpug7b4e.apps.googleusercontent.com',
      serverClientId: '716798071591-jrthopm7ggscqnfhl9tvb5teg9sbvg2r.apps.googleusercontent.com',
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
