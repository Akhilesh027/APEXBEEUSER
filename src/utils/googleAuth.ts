import { Capacitor, registerPlugin } from '@capacitor/core';

interface GoogleSignInPlugin {
  initialize(options: { clientId: string }): Promise<void>;
  signIn(): Promise<{ idToken?: string; user?: any }>;
}

interface CodetrixGoogleAuthPlugin {
  initialize(options?: any): Promise<void>;
  signIn(): Promise<{ authentication?: { idToken?: string }; idToken?: string }>;
}

const NativeGoogleSignIn = registerPlugin<GoogleSignInPlugin>('GoogleSignIn');
const CodetrixGoogleAuth = registerPlugin<CodetrixGoogleAuthPlugin>('GoogleAuth');

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const isNativeGoogleAvailable = (): boolean => {
  return (
    Capacitor.isNativePlatform() &&
    (Capacitor.isPluginAvailable('GoogleSignIn') || Capacitor.isPluginAvailable('GoogleAuth'))
  );
};

/**
 * Triggers native Android/iOS Google Sign-In dialog via Capacitor plugins.
 * Returns the Google ID token (JWT) to pass to /auth/google endpoint,
 * or null if native plugins are not registered on this device build.
 */
export const signInWithNativeGoogle = async (): Promise<string | null> => {
  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '185984914727-6aif53v76n329lp8a1dbu15nu0hcrf6k.apps.googleusercontent.com';

  // 1. Try Capawesome Google Sign-In plugin
  if (Capacitor.isPluginAvailable('GoogleSignIn')) {
    try {
      await NativeGoogleSignIn.initialize({ clientId });
      const res = await NativeGoogleSignIn.signIn();
      if (res?.idToken) return res.idToken;
    } catch (err: any) {
      console.warn('Native GoogleSignIn attempt error:', err);
      if (
        err?.message?.toLowerCase().includes('cancel') ||
        err?.code === '12501' ||
        err?.message?.toLowerCase().includes('user cancelled')
      ) {
        throw new Error('Google sign-in was cancelled.');
      }
      throw err;
    }
  }

  // 2. Try Codetrix Google Auth plugin
  if (Capacitor.isPluginAvailable('GoogleAuth')) {
    try {
      await CodetrixGoogleAuth.initialize({
        clientId,
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      });
      const res = await CodetrixGoogleAuth.signIn();
      const token = res?.authentication?.idToken || res?.idToken;
      if (token) return token;
    } catch (err: any) {
      console.warn('Codetrix GoogleAuth attempt error:', err);
      if (
        err?.message?.toLowerCase().includes('cancel') ||
        err?.code === '12501' ||
        err?.message?.toLowerCase().includes('user cancelled')
      ) {
        throw new Error('Google sign-in was cancelled.');
      }
      throw err;
    }
  }

  return null;
};
