import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface User {
  id: string; // Firebase UID
  staffId: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Staff';
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (staffId: string, name: string, pass: string, email?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              staffId: data.staffId || 'TBD',
              name: data.name || firebaseUser.displayName || 'Unknown',
              role: data.role || 'Staff',
              email: firebaseUser.email || '',
            });
          }
        } catch (err) {
          console.error("Error setting up user:", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (identifier: string, pass: string) => {
    let email = identifier;
    
    // If identifier is not an email (no @), look up staffId in Firestore
    if (!identifier.includes('@')) {
      const q = query(collection(db, 'users'), where('staffId', '==', identifier));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error('User with this Staff ID not found.');
      }
      const userData = snapshot.docs[0].data();
      email = userData.email;
      if (!email) throw new Error('No email associated with this Staff ID.');
    }

    await signInWithEmailAndPassword(auth, email, pass);
  };

  /**
   * NOTE: The authentication flows below use standard Email/Password methods.
   * These are NOT affected by the Firebase Dynamic Links (FDL) deprecation.
   */

  const registerUser = async (staffId: string, name: string, pass: string, providedEmail?: string) => {
    // 1. Check if staffId is already taken
    const q = query(collection(db, 'users'), where('staffId', '==', staffId));
    const snapshot = await getDocs(q);
    
    let existingRole: 'Admin' | 'Manager' | 'Staff' | undefined;
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      // If this user already has a userId (Auth UID), then they are already registered.
      if (data.userId) {
        throw new Error('This Staff ID is already registered.');
      }
      existingRole = data.role;
    }

    // 2. Determine email (use provided or generate)
    const email = providedEmail || `${staffId.toLowerCase().replace(/\s+/g, '_')}@taskflow.local`;
    
    // 3. Create Firebase Auth user
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    // 4. Determine role (use existing if found, otherwise apply defaults)
    let role: 'Admin' | 'Manager' | 'Staff' = 'Staff';
    if (existingRole) {
      role = existingRole;
    } else {
      const isAdmin = email === 'ilifekidstab7@gmail.com' || 
                      staffId.toUpperCase() === 'ADMIN001' || 
                      staffId === '1234';
      const isManager = staffId.toUpperCase().startsWith('MGR');
      role = isAdmin ? 'Admin' : (isManager ? 'Manager' : 'Staff');
    }
    
    // 5. Create Firestore profile
    await setDoc(doc(db, 'users', cred.user.uid), {
      userId: cred.user.uid,
      staffId: staffId,
      name: name,
      role: role,
      email: email,
      createdAt: new Date().toISOString()
    });

    setUser({
      id: cred.user.uid,
      staffId: staffId,
      name: name,
      role: role,
      email: email
    });
  };

  const logoutUser = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login: loginWithEmail, register: registerUser, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


