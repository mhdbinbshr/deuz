
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  getFirestore, 
  doc, 
  getDocFromServer,
  Firestore,
  setLogLevel
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Silence non-fatal offline/reconnection diagnostic warnings
try {
  setLogLevel('silent');
} catch (e) {}

// Prevent transient connection notice from triggering false alarm error in console
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    if (args.some(a => typeof a === 'string' && (a.includes('Could not reach Cloud Firestore backend') || a.includes("Backend didn't respond within 10 seconds")))) {
      console.debug(...args);
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const databaseId = (firebaseConfig as any).firestoreDatabaseId;

let firestoreInstance: Firestore;
try {
  firestoreInstance = databaseId
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, databaseId)
    : initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
} catch (e) {
  firestoreInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = firestoreInstance;

export default app;
