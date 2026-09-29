/**
 * Cloudflare D1 User Profile & Registry Service for Med NU Research Reward System
 * Communicates with backend at https://iram-backend.tinnakornh.workers.dev/api/users
 * Extending the central `irUser` table in Cloudflare D1 as Single Source of Truth
 */

import { UserProfile } from '../types';
import { 
  getStoredUsersRegistry, 
  saveStoredUsersRegistry, 
  upsertRegisteredUser,
  getStoredUserProfile,
  saveStoredUserProfile
} from '../data/userProfile';

const API_BASE_URL = 'https://iram-backend.tinnakornh.workers.dev/api/users';

/**
 * Fetch all users from Cloudflare D1 (irUser + irResearcherProfile)
 * Fallback to localStorage if offline.
 */
export async function fetchUsersFromD1(): Promise<UserProfile[]> {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: HTTP ${response.status}`);
    }
    const data: UserProfile[] = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      // Cache to localStorage for offline-first resilience
      saveStoredUsersRegistry(data);
      return data;
    }
  } catch (error) {
    console.warn('Error fetching users from D1, using local registry cache:', error);
  }
  return getStoredUsersRegistry();
}

/**
 * Fetch a single user profile from D1 by email
 */
export async function fetchUserProfileByEmailFromD1(email: string): Promise<UserProfile | null> {
  if (!email) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(email.trim().toLowerCase())}`);
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: HTTP ${response.status}`);
    }
    const user: UserProfile = await response.json();
    return user;
  } catch (error) {
    console.warn(`Error fetching profile for ${email} from D1:`, error);
    const local = getStoredUsersRegistry().find((u) => u.email.toLowerCase() === email.toLowerCase());
    return local || null;
  }
}

/**
 * Update an existing user profile in Cloudflare D1 (irUser + irResearcherProfile)
 */
export async function updateUserProfileInD1(userId: string, updates: Partial<UserProfile>): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: HTTP ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile in D1:', error);
    throw error;
  }
}

/**
 * Create or Upsert user in Cloudflare D1 (irUser)
 */
export async function createUserInD1(user: Partial<UserProfile>): Promise<{ id: string; email: string }> {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(user),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || `HTTP error ${response.status}`);
    }

    return result;
  } catch (error) {
    console.error('Failed to create user in D1:', error);
    throw error;
  }
}
