import * as firebase from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { FirebaseApp, FirebaseOptions } from '@firebase/app-types';
import { FirebaseDatabase } from '@firebase/database-types';

const fbConf: ServiceAccount = {
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    projectId: process.env.FIREBASE_PROJECT_ID
};

const appOptions: FirebaseOptions = {
  credential: firebase.credential.cert(fbConf),
  databaseURL: process.env.FIREBASE_DB_URL,
};

export const defaultApp: FirebaseApp = firebase.initializeApp(appOptions);

const database: FirebaseDatabase = firebase.database();

export default database;