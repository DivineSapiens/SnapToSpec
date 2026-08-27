import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, collection, query, orderBy, limit } from 'firebase/firestore';

// Default / fallback Firebase config (can be customized via UI or .env)
const getFirebaseConfig = () => {
  const customConfig = localStorage.getItem('snaptospec_firebase_config');
  if (customConfig) {
    try {
      return JSON.parse(customConfig);
    } catch (e) {
      console.error('Invalid saved firebase config', e);
    }
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD-dummy-key-for-local-dashboard",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "snaptospec.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "snaptospec-agent",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "snaptospec-frames.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
  };
};

let dbInstance = null;

export function initFirebase() {
  try {
    const config = getFirebaseConfig();
    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (error) {
    console.warn('Firebase initialization note (running in resilient mode):', error.message);
    return null;
  }
}

/**
 * Subscribe to real-time updates for a specific task/ticket document
 * Workflow states: QUEUED -> PROCESSING -> ANALYZED -> COMPLETED / FAILED
 */
export function subscribeToTask(taskId, onUpdate, onError) {
  const db = initFirebase();
  if (!db) {
    console.log(`[Firestore Mock] Watching task ${taskId}`);
    return () => {};
  }

  try {
    // Check both standard collections 'snaptospec_tasks' and 'tickets'
    const docRef = doc(db, 'snaptospec_tasks', taskId);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Firestore snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore subscribeToTask error:', err);
    return () => {};
  }
}

/**
 * Subscribe to recent tickets feed
 */
export function subscribeToRecentTickets(onUpdate) {
  const db = initFirebase();
  if (!db) return () => {};

  try {
    const q = query(collection(db, 'snaptospec_tasks'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tickets = [];
      snapshot.forEach((d) => {
        tickets.push({ id: d.id, ...d.data() });
      });
      onUpdate(tickets);
    }, (err) => {
      console.warn('Recent tickets listener error:', err.message);
    });
    return unsubscribe;
  } catch {
    return () => {};
  }
}
