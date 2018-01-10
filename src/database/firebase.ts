import * as firebase from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

const fbConf: ServiceAccount = {
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID
};

firebase.initializeApp({
  credential: firebase.credential.cert(fbConf),
  databaseURL: process.env.FIREBASE_DB_URL,
});

export default firebase;
