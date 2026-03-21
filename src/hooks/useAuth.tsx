import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(currentUser);
      
      if (currentUser) {
        // Listen to profile changes
        const profileRef = doc(db, 'users', currentUser.uid);
        unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          try {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              const admins = ['paradisehotandcoldpoint643@gmail.com', 'guptasachin2698@gmail.com'];
              const isAdmin = currentUser.email ? admins.includes(currentUser.email) : false;
              
              // Auto-upgrade to admin if email matches but role is different
              if (isAdmin && data.role !== 'admin') {
                console.log('Upgrading user to admin role based on email...');
                try {
                  await setDoc(profileRef, { ...data, role: 'admin' }, { merge: true });
                } catch (err) {
                  console.error('Failed to upgrade user to admin:', err);
                  handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
                }
              } else {
                setProfile(data);
                setLoading(false);
              }
            } else {
              // Create initial profile if it doesn't exist
              console.log('Creating initial profile for user...');
              const admins = ['paradisehotandcoldpoint643@gmail.com', 'guptasachin2698@gmail.com'];
              const isAdmin = currentUser.email ? admins.includes(currentUser.email) : false;
              const newProfile: UserProfile = {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Guest User',
                email: currentUser.email || '',
                phone: '',
                address: '',
                role: isAdmin ? 'admin' : 'customer',
                totalOrders: 0,
                totalReviews: 0,
                createdAt: Date.now()
              };
              try {
                await setDoc(profileRef, newProfile);
                setProfile(newProfile);
                setLoading(false);
              } catch (err) {
                console.error('Failed to create initial profile:', err);
                handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
              }
            }
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }
        }, (err) => {
          // Only report if we still have a user (prevents noise on logout)
          if (auth.currentUser) {
            handleFirestoreError(err, OperationType.GET, `users/${currentUser.uid}`);
          }
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
