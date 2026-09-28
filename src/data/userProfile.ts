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
    roles: ['finance', 'coordinator'],
    isNuAccount: true,
    status: 'active',
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
    status: 'active',
  },
  {
    id: 'user-pararthana',
    name: 'นางสาวปรารถนา เอนกปัญญากุล',
    academicPosition: 'เจ้าหน้าที่บริหารงานวิจัย',
    administrativePosition: 'รักษาการในตำแหน่งหัวหน้างานวิจัย',
    department: 'งานวิจัย คณะแพทยศาสตร์',
    phone: '5580',
    email: 'pararthanaa@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00555-1',
    idCardNo: '1-6500-00555-55-9',
    role: 'coordinator',
    roles: ['coordinator'],
    isNuAccount: true,
    status: 'active',
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
    status: 'active',
  },
  {
    id: 'user-supawadees',
    name: 'รองศาสตราจารย์ ดร.แพทย์หญิง สุภาวดี ศิริพงษ์',
    academicPosition: 'รองศาสตราจารย์',
    department: 'ภาควิชาอายุรศาสตร์',
    phone: '5540',
    email: 'supawadees@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00204-9',
    idCardNo: '1-6500-00188-72-4',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
  },
  {
    id: 'user-pattarapholw',
    name: 'อาจารย์ นายแพทย์ ภัทรพล วงศ์สว่าง',
    academicPosition: 'อาจารย์',
    department: 'ภาควิชากุมารเวชศาสตร์',
    phone: '5562',
    email: 'pattarapholw@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00910-3',
    idCardNo: '1-6500-00391-10-8',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
  },
  {
    id: 'user-napassawanr',
    name: 'ผู้ช่วยศาสตราจารย์ แพทย์หญิง นภัสวรรณ รัตนชัย',
    academicPosition: 'ผู้ช่วยศาสตราจารย์',
    department: 'ภาควิชาพยาธิวิทยา',
    phone: '5570',
    email: 'napassawanr@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00219-5',
    idCardNo: '1-6500-00451-22-3',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
  },
  {
    id: 'user-vorapojt',
    name: 'ศาสตราจารย์ นายแพทย์ วรพจน์ ธนสารสมบัติ',
    academicPosition: 'ศาสตราจารย์',
    department: 'ภาควิชาออร์โธปิดิกส์',
    phone: '5520',
    email: 'vorapojt@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00109-1',
    idCardNo: '1-6500-00102-19-9',
    role: 'researcher',
    roles: ['researcher'],
    isNuAccount: true,
    status: 'active',
  },
  {
    id: 'user-arthitl',
    name: 'รองศาสตราจารย์ นายแพทย์อาทิตย์ เหล่าเรืองธนา',
    academicPosition: 'รองศาสตราจารย์',
    administrativePosition: 'รองคณบดีฝ่ายวิจัยและถ่ายทอดเทคโนโลยี',
    department: 'ภาควิชาออร์โธปิดิกส์ / ฝ่ายวิจัย คณะแพทยศาสตร์',
    phone: '5502',
    email: 'arthitl@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00333-8',
    idCardNo: '1-6500-00333-33-7',
    role: 'executive',
    roles: ['executive', 'researcher'],
    isNuAccount: true,
    status: 'active',
  },
  {
    id: 'user-dean',
    name: 'ศาสตราจารย์ ดร.แพทย์หญิง ศิรินันท์ สิทธิเกรียงไกร',
    academicPosition: 'ศาสตราจารย์',
    administrativePosition: 'คณบดีคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร',
    department: 'สำนักงานคณบดี คณะแพทยศาสตร์',
    phone: '5501',
    email: 'dean_med@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00111-4',
    idCardNo: '1-6500-00111-11-2',
    role: 'executive',
    roles: ['executive'],
    isNuAccount: true,
    status: 'active',
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

export const USERS_REGISTRY_STORAGE_KEY = 'med_nu_users_registry_v1';

export function getStoredUsersRegistry(): UserProfile[] {
  try {
    const saved = localStorage.getItem(USERS_REGISTRY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored users registry:', e);
  }
  // Initialize with MOCK_NU_USERS if not yet stored
  try {
    localStorage.setItem(USERS_REGISTRY_STORAGE_KEY, JSON.stringify(MOCK_NU_USERS));
  } catch (e) {
    console.error('Error initializing users registry:', e);
  }
  return MOCK_NU_USERS;
}

export function saveStoredUsersRegistry(users: UserProfile[]): void {
  try {
    localStorage.setItem(USERS_REGISTRY_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error persisting users registry:', e);
  }
}

export function upsertRegisteredUser(user: UserProfile): UserProfile[] {
  const currentUsers = getStoredUsersRegistry();
  const index = currentUsers.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
  let updatedUsers: UserProfile[];
  if (index >= 0) {
    updatedUsers = [...currentUsers];
    updatedUsers[index] = {
      ...updatedUsers[index],
      ...user,
      id: updatedUsers[index].id,
    };
  } else {
    updatedUsers = [
      {
        ...user,
        id: user.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        createdAt: user.createdAt || new Date().toISOString().split('T')[0],
        status: user.status || 'active',
      },
      ...currentUsers,
    ];
  }
  saveStoredUsersRegistry(updatedUsers);
  return updatedUsers;
}

export function deleteRegisteredUser(userId: string): UserProfile[] {
  const currentUsers = getStoredUsersRegistry();
  const updatedUsers = currentUsers.filter((u) => u.id !== userId);
  saveStoredUsersRegistry(updatedUsers);
  return updatedUsers;
}
