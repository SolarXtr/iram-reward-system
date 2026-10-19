import { UserProfile, UserRole } from '../types';
import { 
  getStoredUsersRegistry, 
  upsertRegisteredUser, 
  MOCK_NU_USERS,
  DEFAULT_LOGGED_IN_USER
} from '../data/userProfile';
import { googleLogout } from './googleAuth';
import { 
  fetchUserProfileByEmailFromD1, 
  createUserInD1, 
  updateUserProfileInD1 
} from './userService';

export const AUTH_SESSION_KEY = 'med_nu_current_auth_session_v1';

/**
 * Get currently authenticated user from session.
 * Returns null if not logged in (Guest mode).
 */
export function getCurrentAuthUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.email) {
        return parsed as UserProfile;
      }
    }
  } catch (err) {
    console.error('Error reading current auth session:', err);
  }
  return null;
}

/**
 * Save authenticated user to session.
 */
export function setCurrentAuthUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(AUTH_SESSION_KEY);
    } else {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    }
  } catch (err) {
    console.error('Error setting current auth session:', err);
  }
}

/**
 * Process Google Sign-In user and enforce NU account domain policy (@nu.ac.th)
 * Checks Cloudflare D1 and local registry. Auto-provisions new users to D1 immediately.
 */
export async function processNuGoogleLogin(googleUser: {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
  if (!googleUser || !googleUser.email) {
    return {
      success: false,
      message: 'ไม่พบที่อยู่อีเมลจากบัญชี Google กรุณาลองใหม่อีกครั้ง',
    };
  }

  const cleanEmail = googleUser.email.trim().toLowerCase();
  
  // Enforce NU domain policy
  if (!cleanEmail.endsWith('@nu.ac.th')) {
    return {
      success: false,
      message: `อีเมล "${cleanEmail}" ไม่ใช่อีเมลมหาวิทยาลัยนเรศวร (@nu.ac.th) ระบบอนุญาตเฉพาะบุคลากร ม.นเรศวร เท่านั้น`,
    };
  }

  // 1. Check local registry first
  const registry = getStoredUsersRegistry();
  let existing = registry.find((u) => u.email.toLowerCase() === cleanEmail);

  // 2. If not found in local registry, check Cloudflare D1
  if (!existing) {
    try {
      const d1User = await fetchUserProfileByEmailFromD1(cleanEmail);
      if (d1User) {
        existing = d1User;
        upsertRegisteredUser(d1User);
      }
    } catch (e) {
      console.warn('D1 lookup during login warning:', e);
    }
  }

  if (existing) {
    if (existing.status === 'suspended') {
      return {
        success: false,
        message: 'บัญชีของท่านถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ',
      };
    }

    const updatedUser: UserProfile = {
      ...existing,
      lastLoginAt: new Date().toISOString(),
      name: existing.name || googleUser.displayName || cleanEmail.split('@')[0],
    };
    upsertRegisteredUser(updatedUser);
    setCurrentAuthUser(updatedUser);

    // Sync last login to D1 asynchronously
    updateUserProfileInD1(updatedUser.id, { lastLoginAt: updatedUser.lastLoginAt }).catch((err) => {
      console.warn('Sync lastLoginAt to D1 error:', err);
    });

    return {
      success: true,
      user: updatedUser,
    };
  }

  // 3. New User: Auto-provision new researcher user profile for first-time login
  const newUser: UserProfile = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: googleUser.displayName || cleanEmail.split('@')[0],
    academicPosition: 'อาจารย์ / นักวิจัย',
    administrativePosition: '',
    department: 'คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร',
    phone: '',
    email: cleanEmail,
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '',
    idCardNo: '',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
    isPendingProfile: true, // ผู้ใช้ใหม่ รอเปิดสิทธิ์และยืนยันข้อมูลสังกัด
    createdAt: new Date().toISOString().split('T')[0],
    lastLoginAt: new Date().toISOString(),
  };

  // Persist locally
  upsertRegisteredUser(newUser);
  setCurrentAuthUser(newUser);

  // Immediately save to Cloudflare D1 (irUser)
  try {
    await createUserInD1(newUser);
  } catch (d1Err) {
    console.warn('D1 auto-provisioning warning (will sync on activation):', d1Err);
  }

  return {
    success: true,
    user: newUser,
  };
}

/**
 * Log out user, clear session, and sign out of Firebase
 */
export async function logoutNuUser(): Promise<void> {
  setCurrentAuthUser(null);
  try {
    await googleLogout();
  } catch (err) {
    console.warn('Firebase signout warning:', err);
  }
}

/**
 * Demo Login Helper to quickly switch to any of the 5 roles during evaluation
 */
export function demoLoginAsRole(targetRole: UserRole): UserProfile {
  const registry = getStoredUsersRegistry();
  
  // Try to find matching user in registry first
  let targetUser = registry.find((u) => u.role === targetRole || (u.roles && u.roles.includes(targetRole)));

  if (!targetUser) {
    targetUser = MOCK_NU_USERS.find((u) => u.role === targetRole || (u.roles && u.roles.includes(targetRole))) || DEFAULT_LOGGED_IN_USER;
  }

  const activeProfile: UserProfile = {
    ...targetUser,
    role: targetRole,
    lastLoginAt: new Date().toISOString(),
  };

  setCurrentAuthUser(activeProfile);
  return activeProfile;
}
