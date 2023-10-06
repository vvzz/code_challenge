import { ServiceAccount } from "firebase-admin";
import * as admin from "firebase-admin";
import { defineSecret, projectID } from "firebase-functions/params";

const saPrivateKey = defineSecret("saPrivateKey");
const saClientEmail = defineSecret("saClientEmail");


const serviceAccount: ServiceAccount = {
  projectId: projectID.value(),
  privateKey: saPrivateKey.value(),
  clientEmail: saClientEmail.value(),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export { admin, db };
