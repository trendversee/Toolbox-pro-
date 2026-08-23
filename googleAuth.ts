import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  Auth
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton safely
let auth: Auth | null = null;
try {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase initialization warning:', e);
}

export { auth };

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.metadata.readonly'
];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account'
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

export const initGoogleAuth = (
  onAuthChange: (state: AuthState) => void
) => {
  if (!auth) {
    onAuthChange({
      user: null,
      accessToken: null,
      isAuthenticated: false
    });
    return () => {};
  }

  try {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          onAuthChange({
            user,
            accessToken: cachedAccessToken,
            isAuthenticated: true
          });
        } else if (!isSigningIn) {
          // User is logged in to Firebase but token is in-memory only; require explicit sign-in click or re-auth
          onAuthChange({
            user,
            accessToken: null,
            isAuthenticated: false
          });
        }
      } else {
        cachedAccessToken = null;
        onAuthChange({
          user: null,
          accessToken: null,
          isAuthenticated: false
        });
      }
    });
  } catch (err) {
    console.warn('onAuthStateChanged error:', err);
    onAuthChange({
      user: null,
      accessToken: null,
      isAuthenticated: false
    });
    return () => {};
  }
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string }> => {
  if (!auth) {
    throw new Error('Google Authentication service is not initialized.');
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token. Please verify permissions.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const signOutGoogle = async () => {
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
  }
  cachedAccessToken = null;
};

