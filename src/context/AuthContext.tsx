import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole, UserProfile, Lembaga } from '../types';
import { MOCK_USERS, MOCK_LEMBAGA_LIST } from '../lib/mockData';
import { auth, isFirebaseConfigured, getFirebaseConfigStatus, testFirestoreConnection } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { AuthService, UserAuthContextData } from '../services/authService';

export type AppPage = 
  | 'login' 
  | 'forgot_password' 
  | 'register_lembaga' 
  | 'dashboard' 
  | 'profile' 
  | 'security_audit' 
  | 'not_found';

interface AuthContextType {
  currentUser: UserProfile | null;
  activeRole: UserRole;
  activeLembaga: Lembaga | null;
  currentPage: AppPage;
  isAuthenticated: boolean;
  isSessionLoading: boolean;
  isFirebaseConnected: boolean;
  authError: string | null;
  login: (role?: UserRole) => void;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => void;
  setCurrentPage: (page: AppPage) => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;
  firebaseStatus: {
    isConfigured: boolean;
    projectId: string;
    databaseId: string;
    authDomain: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [activeRole, setActiveRole] = useState<UserRole>('admin_lembaga');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(MOCK_USERS['admin_lembaga']);
  const [activeLembaga, setActiveLembaga] = useState<Lembaga | null>(MOCK_LEMBAGA_LIST[0]);
  const [currentPage, setCurrentPage] = useState<AppPage>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const firebaseStatus = getFirebaseConfigStatus();

  // Load session on startup and subscribe to Firebase auth state
  useEffect(() => {
    let isMounted = true;

    async function initializeFirebase() {
      setIsSessionLoading(true);
      if (isFirebaseConfigured) {
        try {
          await testFirestoreConnection();
        } catch (err) {
          console.warn('Firestore initial probe warning:', err);
        }
      }

      if (isMounted) {
        setIsSessionLoading(false);
      }
    }

    initializeFirebase();

    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (!isMounted) return;

      if (user) {
        setIsSessionLoading(true);
        try {
          const userContext = await AuthService.fetchUserContext(user.uid);
          if (userContext && isMounted) {
            const mappedUser: UserProfile = {
              id: user.uid,
              nama: userContext.profile?.fullName || user.displayName || user.email || 'Pengguna',
              email: user.email || '',
              telepon: userContext.profile?.phone || '',
              role: userContext.effectiveRole,
              lembagaId: MOCK_LEMBAGA_LIST[0].id,
              lembagaNama: MOCK_LEMBAGA_LIST[0].nama
            };

            setCurrentUser(mappedUser);
            setActiveRole(userContext.effectiveRole);
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.warn('User context load error:', err);
        } finally {
          setIsSessionLoading(false);
        }
      } else {
        // No live Firebase session, keep demo user state or navigate to login
        setIsSessionLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Quick Demo Login Switcher
  const login = useCallback((role: UserRole = 'admin_lembaga') => {
    setActiveRole(role);
    setCurrentUser(MOCK_USERS[role]);
    setIsAuthenticated(true);
    setAuthError(null);
    setCurrentPage('dashboard');
  }, []);

  // Login with Google (Popup)
  const loginWithGoogle = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    setIsSessionLoading(true);
    const res = await AuthService.signInWithGoogle();
    setIsSessionLoading(false);

    if (res.success && res.user) {
      const isSuper = res.user.email === 'ponpestelagaalkautsar@gmail.com';
      const role: UserRole = isSuper ? 'super_admin' : 'admin_lembaga';
      setActiveRole(role);
      setCurrentUser({
        id: res.user.id,
        nama: res.user.fullName || res.user.email,
        email: res.user.email,
        telepon: '',
        role,
        lembagaId: MOCK_LEMBAGA_LIST[0].id,
        lembagaNama: MOCK_LEMBAGA_LIST[0].nama
      });
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      return { success: true };
    }

    setAuthError(res.error || 'Gagal masuk dengan Google.');
    return { success: false, error: res.error };
  }, []);

  // Login with Email & Password
  const loginWithEmail = useCallback(async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsSessionLoading(true);
    const res = await AuthService.signIn(email, pass);
    setIsSessionLoading(false);

    if (res.success && res.user) {
      const isSuper = res.user.email === 'ponpestelagaalkautsar@gmail.com';
      const role: UserRole = isSuper ? 'super_admin' : 'admin_lembaga';
      setActiveRole(role);
      setCurrentUser({
        id: res.user.id,
        nama: res.user.fullName || res.user.email,
        email: res.user.email,
        telepon: '',
        role,
        lembagaId: MOCK_LEMBAGA_LIST[0].id,
        lembagaNama: MOCK_LEMBAGA_LIST[0].nama
      });
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      return { success: true };
    }

    setAuthError(res.error || 'Autentikasi gagal.');
    return { success: false, error: res.error };
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await AuthService.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPage('login');
  }, []);

  // Switch Role
  const switchRole = useCallback((role: UserRole) => {
    setActiveRole(role);
    setCurrentUser(MOCK_USERS[role]);
  }, []);

  // Update Profile
  const updateUserProfile = useCallback((data: Partial<UserProfile>) => {
    setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole,
        activeLembaga,
        currentPage,
        isAuthenticated,
        isSessionLoading,
        isFirebaseConnected: isFirebaseConfigured,
        authError,
        login,
        loginWithGoogle,
        loginWithEmail,
        logout,
        switchRole,
        setCurrentPage,
        updateUserProfile,
        firebaseStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider');
  }
  return context;
}
