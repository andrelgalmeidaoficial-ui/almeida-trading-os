import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getFirestore, onSnapshot, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBzrwiianeCybG4Ez6QgEdVzcXq7-_BTGU',
  authDomain: 'almeida-capital-pro.firebaseapp.com',
  projectId: 'almeida-capital-pro',
  storageBucket: 'almeida-capital-pro.firebasestorage.app',
  messagingSenderId: '139760939666',
  appId: '1:139760939666:web:35b533887cb050b16d6c4b'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const localWriteFingerprints = new Map();

function rememberLocalWrite(uid, state) {
  const fingerprints = localWriteFingerprints.get(uid) || [];
  fingerprints.push(JSON.stringify(state));
  localWriteFingerprints.set(uid, fingerprints.slice(-20));
}

function isLocalWrite(uid, state) {
  return (localWriteFingerprints.get(uid) || []).includes(JSON.stringify(state));
}

function stateDocument(uid) {
  // Sprint 12 deliberately preserves the production document path.
  return doc(db, 'users', uid, 'foundation', 'state');
}

export const authentication = {
  subscribe: callback => onAuthStateChanged(auth, callback),
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),
  signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
  resetPassword: email => sendPasswordResetEmail(auth, email),
  logout: () => signOut(auth)
};

export const tradingStateStorage = {
  subscribe(uid, { onData, onMissing, onError }) {
    return onSnapshot(stateDocument(uid), snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (!isLocalWrite(uid, data)) onData(data);
      }
      else onMissing();
    }, onError);
  },

  create(uid, initialState) {
    rememberLocalWrite(uid, initialState);
    return setDoc(stateDocument(uid), initialState);
  },

  save(uid, state) {
    rememberLocalWrite(uid, state);
    return setDoc(stateDocument(uid), state, { merge: true });
  }
};
