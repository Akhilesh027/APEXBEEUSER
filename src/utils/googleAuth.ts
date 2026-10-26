// Safe Capacitor bridge for Google Authentication
// Works seamlessly in Web browsers and Native Android/iOS WebViews without requiring
// @capacitor/core at build time on web servers.

interface GoogleAuthPlugin {
  initialize?(options: any): Promise<void>;
  signIn?(): Promise<{ idToken?: string; authentication?: { idToken?: string }; user?: any }>;
}

const getCapacitor = () => {
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return (window as any).Capacitor;
  }
  return null;
};

/**
 * Returns true if running inside a native mobile container (Capacitor Android/iOS).
 */
export const isNativePlatform = (): boolean => {
  const cap = getCapacitor();
  return Boolean(cap && typeof cap.isNativePlatform === 'function' && cap.isNativePlatform());
};

/**
 * Checks if a native Google Sign-In plugin is available in the current environment.
 */
export const isNativeGoogleAvailable = (): boolean => {
  const cap = getCapacitor();
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) {
    return false;
  }

  const hasPluginMethod = typeof cap.isPluginAvailable === 'function';
  const isSignInAvailable = hasPluginMethod && cap.isPluginAvailable('GoogleSignIn');
  const isAuthAvailable = hasPluginMethod && cap.isPluginAvailable('GoogleAuth');
  const plugins = cap.Plugins || {};

  return Boolean(isSignInAvailable || isAuthAvailable || plugins.GoogleSignIn || plugins.GoogleAuth);
};

/**
 * Triggers native Android/iOS Google Sign-In dialog via available Capacitor plugins.
 * Returns the Google ID token (JWT) to pass to /auth/google endpoint,
 * or null if native plugins are not registered on this device build.
 */
export const signInWithNativeGoogle = async (): Promise<string | null> => {
  const cap = getCapacitor();
  if (!cap || typeof cap.isNativePlatform !== 'function' || !cap.isNativePlatform()) {
    return null;
  }

  const webClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '716798071591-jrthopm7ggscqnfhl9tvb5teg9sbvg2r.apps.googleusercontent.com';
  const androidClientId =
    import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID ||
    '716798071591-888nf6hvugrcjg2vn9nu2lf3tpug7b4e.apps.googleusercontent.com';

  const plugins = cap.Plugins || {};
  let googleSignInPlugin: GoogleAuthPlugin | null = plugins.GoogleSignIn || null;
  let googleAuthPlugin: GoogleAuthPlugin | null = plugins.GoogleAuth || null;

  if (!googleSignInPlugin && typeof cap.registerPlugin === 'function') {
    try {
      googleSignInPlugin = cap.registerPlugin('GoogleSignIn');
    } catch {
      // plugin not found
    }
  }

  if (!googleAuthPlugin && typeof cap.registerPlugin === 'function') {
    try {
      googleAuthPlugin = cap.registerPlugin('GoogleAuth');
    } catch {
      // plugin not found
    }
  }

  // 1. Try GoogleSignIn plugin
  if (googleSignInPlugin && typeof googleSignInPlugin.signIn === 'function') {
    try {
      if (typeof googleSignInPlugin.initialize === 'function') {
        await googleSignInPlugin.initialize({
          clientId: androidClientId,
          serverClientId: webClientId,
        });
      }
      const res = await googleSignInPlugin.signIn();
      if (res?.idToken) return res.idToken;
    } catch (err: any) {
      console.warn('Native GoogleSignIn error:', err);
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

  // 2. Try GoogleAuth plugin
  if (googleAuthPlugin && typeof googleAuthPlugin.signIn === 'function') {
    try {
      if (typeof googleAuthPlugin.initialize === 'function') {
        await googleAuthPlugin.initialize({
          clientId: androidClientId,
          serverClientId: webClientId,
          scopes: ['profile', 'email'],
          grantOfflineAccess: false,
        });
      }
      const res = await googleAuthPlugin.signIn();
      const token = res?.authentication?.idToken || res?.idToken;
      if (token) return token;
    } catch (err: any) {
      console.warn('Native GoogleAuth error:', err);
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
