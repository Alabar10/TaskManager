// firebase.js  (single source of truth)
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDg5KK4VQUTf916vx7NsdcH5OO-eo5dWsc',
  authDomain: 'taskmanager-33720.firebaseapp.com',
  projectId: 'taskmanager-33720',
  storageBucket: 'taskmanager-33720.appspot.com',  
  messagingSenderId: '543975650719',
  appId: '1:543975650719:web:ff77087d45da61481839aa',
  // measurementId not needed in RN
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
