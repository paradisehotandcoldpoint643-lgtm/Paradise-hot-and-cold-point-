import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
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
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to profile changes
        const profileRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const isAdmin = currentUser.email === 'paradisehotandcoldpoint643@gmail.com';
            
            // Auto-upgrade to admin if email matches but role is different
            if (isAdmin && data.role !== 'admin') {
              await setDoc(profileRef, { ...data, role: 'admin' }, { merge: true });
              // The next snapshot will have the updated data
            } else {
              setProfile(data);
              setLoading(false);
            }
          } else {
            // Create initial profile if it doesn't exist
            const isAdmin = currentUser.email === 'paradisehotandcoldpoint643@gmail.com';
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
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
            setLoading(false);
          }
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
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
