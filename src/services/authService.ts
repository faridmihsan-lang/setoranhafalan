import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as fbSignOut,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserRole } from '../types';
import { FirebaseProfile, FirebaseInstitutionMembership, FirebaseInstitution } from '../types/firebase';

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    fullName?: string;
  };
}

export interface UserAuthContextData {
  profile: FirebaseProfile | null;
  memberships: (FirebaseInstitutionMembership & { institution?: FirebaseInstitution })[];
  activeMembership: (FirebaseInstitutionMembership & { institution?: FirebaseInstitution }) | null;
  effectiveRole: UserRole;
  isSuperAdmin: boolean;
  accountStatus: 'active' | 'inactive' | 'suspended' | 'pending';
}

export class AuthService {
  /**
   * Login with Google (Configured by Firebase Provisioning)
   */
  static async signInWithGoogle(): Promise<AuthResult> {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'Konfigurasi Firebase belum aktif di environment.'
      };
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Sync user profile to Firestore
      await this.ensureUserProfile(user);

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || user.email || 'Pengguna'
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: this.translateAuthError(err)
      };
    }
  }

  /**
   * Login with Email & Password via Firebase Auth
   */
  static async signIn(email: string, pass: string): Promise<AuthResult> {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'Firebase belum terhubung.'
      };
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      await this.ensureUserProfile(user);

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || user.email || 'Pengguna'
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: this.translateAuthError(err)
      };
    }
  }

  /**
   * Sign up with Email & Password
   */
  static async signUp(
    email: string,
    pass: string,
    fullName: string,
    phone?: string
  ): Promise<AuthResult> {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'Firebase belum terhubung.'
      };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const user = cred.user;

      const profileDocRef = doc(db, 'profiles', user.uid);
      const profileData: FirebaseProfile = {
        id: user.uid,
        fullName,
        email: user.email || '',
        phone: phone || '',
        isSuperAdmin: email === 'ponpestelagaalkautsar@gmail.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(profileDocRef, profileData, { merge: true });

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email || '',
          fullName
        }
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: this.translateAuthError(err)
      };
    }
  }

  /**
   * Send Password Recovery Email
   */
  static async resetPassword(email: string): Promise<AuthResult> {
    if (!isFirebaseConfigured) {
      return {
        success: false,
        error: 'Firebase belum terhubung.'
      };
    }

    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: unknown) {
      return {
        success: false,
        error: this.translateAuthError(err)
      };
    }
  }

  /**
   * Sign Out
   */
  static async signOut(): Promise<void> {
    if (isFirebaseConfigured) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Firebase sign out error:', err);
      }
    }
  }

  /**
   * Ensure user profile exists in Firestore `profiles/{uid}`
   */
  private static async ensureUserProfile(user: FirebaseUser): Promise<void> {
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const snapshot = await getDoc(profileRef);

      if (!snapshot.exists()) {
        const isSuperAdmin = user.email === 'ponpestelagaalkautsar@gmail.com';
        const newProfile: FirebaseProfile = {
          id: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Pengguna',
          email: user.email || '',
          phone: user.phoneNumber || '',
          isSuperAdmin,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await setDoc(profileRef, newProfile);
      }
    } catch (err) {
      console.warn('ensureUserProfile non-fatal warning:', err);
    }
  }

  /**
   * Fetch authenticated user context from Firestore
   */
  static async fetchUserContext(userId: string): Promise<UserAuthContextData | null> {
    if (!isFirebaseConfigured) return null;

    try {
      // 1. Fetch Profile
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);

      let profile: FirebaseProfile | null = null;
      if (profileSnap.exists()) {
        profile = profileSnap.data() as FirebaseProfile;
      } else {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === userId) {
          profile = {
            id: userId,
            fullName: currentUser.displayName || currentUser.email || 'Pengguna',
            email: currentUser.email || '',
            isSuperAdmin: currentUser.email === 'ponpestelagaalkautsar@gmail.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }

      if (!profile) return null;

      // Super admin bypass
      if (profile.isSuperAdmin || auth.currentUser?.email === 'ponpestelagaalkautsar@gmail.com') {
        return {
          profile: { ...profile, isSuperAdmin: true },
          memberships: [],
          activeMembership: null,
          effectiveRole: 'super_admin',
          isSuperAdmin: true,
          accountStatus: 'active'
        };
      }

      // Default role mapping
      return {
        profile,
        memberships: [],
        activeMembership: null,
        effectiveRole: 'admin_lembaga',
        isSuperAdmin: false,
        accountStatus: 'active'
      };
    } catch (err) {
      console.warn('fetchUserContext note:', err);
      return null;
    }
  }

  /**
   * Translate Firebase errors into polite Indonesian
   */
  private static translateAuthError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    const lower = msg.toLowerCase();

    if (lower.includes('user-not-found') || lower.includes('wrong-password') || lower.includes('invalid-credential')) {
      return 'Email atau kata sandi yang Anda masukkan salah.';
    }
    if (lower.includes('email-already-in-use')) {
      return 'Email ini sudah terdaftar. Silakan gunakan menu login atau reset sandi.';
    }
    if (lower.includes('weak-password')) {
      return 'Kata sandi minimal 6 karakter.';
    }
    if (lower.includes('popup-closed-by-user')) {
      return 'Jendela login Google ditutup sebelum otorisasi selesai.';
    }
    if (lower.includes('network-request-failed')) {
      return 'Gagal menghubungi server. Periksa koneksi internet Anda.';
    }
    return msg;
  }
}
