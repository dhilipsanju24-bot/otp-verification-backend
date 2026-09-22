import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "../firebase-service-account.json";

const firebaseApp = initializeApp({
  credential: cert(serviceAccount as any),
});

export const db = getFirestore(firebaseApp);
