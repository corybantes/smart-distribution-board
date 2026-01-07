import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error("Missing Firebase Admin environment variables");
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

export const initAdmin = () => {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
  return getApp();
};

const app = initAdmin();
const adminDb = getFirestore(app);
const adminAuth = getAuth(app);
const adminRtdb = getDatabase(app);

export { adminDb, adminAuth, adminRtdb };
