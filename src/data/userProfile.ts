import { UserProfile, UserRole } from '../types';

export const USER_PROFILE_STORAGE_KEY = 'med_nu_current_user_profile_v2';

/**
 * Default authenticated profile for the currently logged-in user
 * Strictly complies with PDPA - fictional/sanitized sample identifiers
 */
export const DEFAULT_LOGGED_IN_USER: UserProfile = {
  id: 'user-tinnakornh',
  name: 'ดร.ทินกร หอมดี',
  academicPosition: 'อาจารย์ ดร.',
  department: 'สถานวิทยาศาสตร์คลินิก',
  phone: '5588',
  email: 'tinnakornh@nu.ac.th',
  bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
  bankAccountNo: '346-1-00888-9',
  idCardNo: '1-6500-00888-99-0',
  role: 'researcher',
  isNuAccount: true,
};

export const MOCK_NU_USERS: UserProfile[] = [
  DEFAULT_LOGGED_IN_USER,
  {
    id: 'user-sommaiv',
    name: 'ผู้ช่วยศาสตราจารย์ ดร.สมหมาย วิจัยเจริญ',
    academicPosition: 'ผู้ช่วยศาสตราจารย์',
    department: 'ภาควิชาศัลยศาสตร์',
    phone: '5535',
    email: 'sommaiv@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00188-2',
    idCardNo: '1-6500-00214-55-1',
    role: 'researcher',
    isNuAccount: true,
  },
  {
    id: 'user-coordinator',
    name: 'คุณวราภรณ์ วิจัยบริบาล',
    academicPosition: 'นักวิชาการศึกษาชำนาญการ',
    department: 'หน่วยบริหารงานวิจัย คณะแพทยศาสตร์',
    phone: '5511',
    email: 'research_med@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00999-0',
    idCardNo: '1-6500-00999-00-1',
    role: 'coordinator',
    isNuAccount: true,
  },
  {
    id: 'user-finance',
    name: 'คุณวิลาสินี การคลังมั่นคง',
    academicPosition: 'นักวิชาการเงินและบัญชีชำนาญการ',
    department: 'หน่วยการเงินและบัญชี คณะแพทยศาสตร์',
    phone: '5522',
    email: 'finance_med@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00777-5',
    idCardNo: '1-6500-00777-77-2',
    role: 'finance',
    isNuAccount: true,
  },
];

export function getStoredUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we have all necessary fields
      return {
        ...DEFAULT_LOGGED_IN_USER,
        ...parsed,
        email: parsed.email || DEFAULT_LOGGED_IN_USER.email,
      };
    }
  } catch (e) {
    console.error('Error loading stored user profile:', e);
  }
  return DEFAULT_LOGGED_IN_USER;
}

export function saveStoredUserProfile(profile: Partial<UserProfile>): UserProfile {
  try {
    const current = getStoredUserProfile();
    const updated: UserProfile = {
      ...current,
      ...profile,
    };
    localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving stored user profile:', e);
    return DEFAULT_LOGGED_IN_USER;
  }
}
