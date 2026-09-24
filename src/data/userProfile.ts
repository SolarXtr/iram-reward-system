import { UserProfile, UserRole } from '../types';

export const USER_PROFILE_STORAGE_KEY = 'med_nu_current_user_profile_v2';

/**
 * Default authenticated profile for the currently logged-in user
 * นายทินกรณ์ หาญณรงค์ (เจ้าหน้าที่วิจัย / ปฏิบัติหน้าที่ในตำแหน่งหัวหน้าหน่วยบริหารและจัดการงานวิจัย)
 * สถานะ: เจ้าหน้าที่วิจัย, ผู้ประสานงาน, และผู้ดูแลระบบ
 */
export const DEFAULT_LOGGED_IN_USER: UserProfile = {
  id: 'user-tinnakornh',
  name: 'นายทินกรณ์ หาญณรงค์',
  academicPosition: 'เจ้าหน้าที่วิจัย',
  administrativePosition: 'ปฏิบัติหน้าที่ในตำแหน่งหัวหน้าหน่วยบริหารและจัดการงานวิจัย',
  department: 'งานวิจัย คณะแพทยศาสตร์',
  phone: '5588',
  email: 'tinnakornh@nu.ac.th',
  bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
  bankAccountNo: '346-1-00888-9',
  idCardNo: '1-6500-00888-99-0',
  role: 'admin',
  roles: ['researcher', 'coordinator', 'admin'],
  isNuAccount: true,
};

export const MOCK_NU_USERS: UserProfile[] = [
  DEFAULT_LOGGED_IN_USER,
  {
    id: 'user-iram',
    name: 'iRAM งานวิจัยและบริการวิชาการ',
    academicPosition: 'เจ้าหน้าที่การเงินและวิจัย',
    department: 'หน่วยบริหารและจัดการงานวิจัย งานวิจัย คณะแพทยศาสตร์',
    phone: '5511',
    email: 'research.med@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00999-0',
    idCardNo: '1-6500-00999-00-1',
    role: 'finance',
    roles: ['finance'],
    isNuAccount: true,
  },
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
    roles: ['researcher'],
    isNuAccount: true,
  },
  {
    id: 'user-finance',
    name: 'คุณวิลาสินี การคลังมั่นคง',
    academicPosition: 'นักวิชาการเงินและบัญชีชำนาญการ',
    department: 'งานคลัง สำนักงานเลขานุการ คณะแพทยศาสตร์',
    phone: '5522',
    email: 'finance_med@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00777-5',
    idCardNo: '1-6500-00777-77-2',
    role: 'finance',
    roles: ['finance'],
    isNuAccount: true,
  },
];

export function getStoredUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Auto-migrate if old profile name is detected or old administrativePosition
      if (
        parsed.name === 'ดร.ทินกร หอมดี' || 
        parsed.email === 'tinnakornh@nu.ac.th' || 
        !parsed.administrativePosition ||
        parsed.administrativePosition.includes('รักษาการ')
      ) {
        const migrated: UserProfile = {
          ...DEFAULT_LOGGED_IN_USER,
          ...parsed,
          name: parsed.name === 'ดร.ทินกร หอมดี' ? DEFAULT_LOGGED_IN_USER.name : (parsed.name || DEFAULT_LOGGED_IN_USER.name),
          academicPosition: (parsed.academicPosition === 'อาจารย์ ดร.' || !parsed.academicPosition) ? DEFAULT_LOGGED_IN_USER.academicPosition : parsed.academicPosition,
          administrativePosition: DEFAULT_LOGGED_IN_USER.administrativePosition,
          department: (parsed.department === 'สถานวิทยาศาสตร์คลินิก' || !parsed.department) ? DEFAULT_LOGGED_IN_USER.department : parsed.department,
          roles: DEFAULT_LOGGED_IN_USER.roles,
        };
        localStorage.setItem(USER_PROFILE_STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
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
