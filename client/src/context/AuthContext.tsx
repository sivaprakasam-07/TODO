import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  isFirebaseConfigured,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOutUser as firebaseSignOutUser,
  uploadProfilePicture,
  updateFirebaseUserProfile,
} from '../services/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (updates: { displayName?: string; photoFile?: File | null }) => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      (error) => {
        console.error('[AuthContext] Auth state change error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [configured]);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      setLoading(true);
      await firebaseSignInWithGoogle();
    } catch (err: unknown) {
      const error = err as Error & { code?: string };
      console.error('[AuthContext] Google sign-in failed:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed before completing.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setAuthError('Sign-in request was cancelled.');
      } else {
        setAuthError(error.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    try {
      setLoading(true);
      await firebaseSignOutUser();
      setUser(null);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('[AuthContext] Sign-out failed:', error);
      setAuthError(error.message || 'Failed to sign out.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(
    async (updates: { displayName?: string; photoFile?: File | null }) => {
      if (!auth?.currentUser) {
        throw new Error('No authenticated user.');
      }

      let downloadURL: string | undefined;
      if (updates.photoFile) {
        downloadURL = await uploadProfilePicture(auth.currentUser.uid, updates.photoFile);
      }

      const profilePayload: { displayName?: string; photoURL?: string } = {};
      if (typeof updates.displayName === 'string') {
        profilePayload.displayName = updates.displayName.trim();
      }
      if (downloadURL) {
        profilePayload.photoURL = downloadURL;
      }

      if (Object.keys(profilePayload).length > 0) {
        await updateFirebaseUserProfile(auth.currentUser, profilePayload);
        // Clone current user state so React triggers immediate re-renders across all consumers
        setUser({ ...(auth.currentUser as FirebaseUser) });
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: configured,
        authError,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
