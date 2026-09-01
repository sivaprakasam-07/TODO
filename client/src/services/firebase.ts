import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  FirebaseStorage,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Checks whether valid Firebase environment variables are provided.
 */
export function isFirebaseConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return Boolean(
    apiKey &&
      apiKey.trim() !== '' &&
      apiKey !== 'your_api_key_here' &&
      projectId &&
      projectId.trim() !== '' &&
      projectId !== 'your_project_id'
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;
let firebaseStorage: FirebaseStorage | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    firebaseStorage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
  }
}

export { auth, googleProvider, firebaseStorage };

/**
 * Initiates Google Sign-In via popup.
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error(
      'Firebase is not configured. Please set your VITE_FIREBASE_* credentials in client/.env'
    );
  }

  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * Signs out the currently authenticated user.
 */
export async function signOutUser(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Uploads a profile picture to Firebase Storage and returns its download URL.
 * Storage path: profilePictures/{uid}/profile.jpg
 */
export async function uploadProfilePicture(uid: string, file: File): Promise<string> {
  if (!firebaseStorage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Please select a valid image (JPG, PNG, or WEBP).');
  }

  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error('Image must be smaller than 5MB.');
  }

  // Sanitized storage path per user UID
  const storageRef = ref(firebaseStorage, `profilePictures/${uid}/profile.jpg`);
  
  // Upload with explicit content type
  const metadata = {
    contentType: file.type,
  };

  await uploadBytes(storageRef, file, metadata);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Updates Firebase Auth profile for display name and/or photo URL.
 */
export async function updateFirebaseUserProfile(
  user: FirebaseUser,
  updates: { displayName?: string; photoURL?: string }
): Promise<void> {
  await updateProfile(user, updates);
  await user.reload();
}
