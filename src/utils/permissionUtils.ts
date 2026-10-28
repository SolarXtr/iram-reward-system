import { UserProfile, ResearchApplication, UserRole } from '../types';

/**
 * Normalizes department strings for robust comparison
 * e.g., trims whitespace, handles variations like 'ภาควิชาอายุรศาสตร์'
 */
export function normalizeDeptName(dept?: string | null): string {
  if (!dept || typeof dept !== 'string') return '';
  return dept.trim().toLowerCase();
}

/**
 * Thai ↔ English department aliases. Order matters: more specific entries come first.
 * Each entry maps a canonical key to Thai/English keywords found in department strings.
 */
const DEPARTMENT_ALIASES: { key: string; keywords: string[] }[] = [
  { key: 'orthopaedics', keywords: ['ออร์โธปิดิกส์', 'ออร์โธปิดิกซ์', 'orthopaedic', 'orthopedic'] },
  { key: 'obgyn', keywords: ['สูติศาสตร์', 'นรีเวช', 'obstetric', 'gynecolog', 'gynaecolog', 'ob-gyn', 'obgyn'] },
  { key: 'family_medicine', keywords: ['เวชศาสตร์ครอบครัว', 'family medicine'] },
  { key: 'preventive_medicine', keywords: ['เวชศาสตร์ป้องกัน', 'เวชศาสตร์ชุมชน', 'preventive', 'community medicine', 'social medicine'] },
  { key: 'rehabilitation', keywords: ['เวชศาสตร์ฟื้นฟู', 'rehabilitation', 'physical medicine'] },
  { key: 'emergency', keywords: ['เวชศาสตร์ฉุกเฉิน', 'emergency medicine'] },
  { key: 'forensic', keywords: ['นิติเวช', 'forensic'] },
  { key: 'ent', keywords: ['โสต ศอ นาสิก', 'โสต ศอ นาสิกวิทยา', 'otolaryngolog', 'otorhinolaryngolog'] },
  { key: 'ophthalmology', keywords: ['จักษุ', 'ophthalmolog'] },
  { key: 'psychiatry', keywords: ['จิตเวช', 'psychiatr'] },
  { key: 'radiology', keywords: ['รังสีวิทยา', 'radiolog'] },
  { key: 'anesthesiology', keywords: ['วิสัญญี', 'anesthesi', 'anaesthesi'] },
  { key: 'pediatrics', keywords: ['กุมารเวช', 'pediatric', 'paediatric'] },
  { key: 'pathology', keywords: ['พยาธิวิทยา', 'pathology'] },
  { key: 'anatomy', keywords: ['กายวิภาค', 'anatomy'] },
  { key: 'physiology', keywords: ['สรีรวิทยา', 'physiology'] },
  { key: 'biochemistry', keywords: ['ชีวเคมี', 'biochemistry'] },
  { key: 'microbiology', keywords: ['จุลชีววิทยา', 'microbiology'] },
  { key: 'parasitology', keywords: ['ปรสิต', 'parasitolog'] },
  { key: 'pharmacology', keywords: ['เภสัชวิทยา', 'pharmacology'] },
  { key: 'surgery', keywords: ['ศัลยศาสตร์', 'surgery', 'surgical'] },
  { key: 'internal_medicine', keywords: ['อายุรศาสตร์', 'internal medicine', 'department of medicine', 'dept. of medicine', 'dept of medicine'] },
];

/**
 * Resolves a department string (Thai or English) to a canonical key.
 * Returns '' when no known department keyword is found.
 */
export function canonicalDepartmentKey(dept?: string | null): string {
  const norm = normalizeDeptName(dept).replace(/\s+/g, ' ');
  if (!norm) return '';
  const padded = `${norm} `;
  for (const entry of DEPARTMENT_ALIASES) {
    if (entry.keywords.some((kw) => padded.includes(kw.toLowerCase()))) {
      return entry.key;
    }
  }
  return '';
}

/**
 * Checks if two department names are identical or equivalent
 * (supports Thai/English naming variants, e.g. 'ภาควิชาอายุรศาสตร์' ≡ 'Department of Internal Medicine')
 */
export function isSameDepartment(deptA?: string | null, deptB?: string | null): boolean {
  const normA = normalizeDeptName(deptA);
  const normB = normalizeDeptName(deptB);
  if (!normA || !normB) return false;
  if (normA === normB || normA.includes(normB) || normB.includes(normA)) return true;
  const keyA = canonicalDepartmentKey(normA);
  const keyB = canonicalDepartmentKey(normB);
  return Boolean(keyA && keyB && keyA === keyB);
}

/**
 * Checks if a user strictly holds ONLY the 'researcher' status/role
 * and has no elevated/administrative roles (admin, executive, coordinator, finance, dept_secretary).
 */
export function isResearcherOnlyUser(user?: UserProfile | null): boolean {
  if (!user) return false;
  const primaryIsResearcher = !user.role || user.role === 'researcher';
  const hasElevatedRole = Array.isArray(user.roles) && user.roles.some((r) => r !== 'researcher');
  return primaryIsResearcher && !hasElevatedRole;
}

/**
 * Determines if the current user can access/view a target user's profile
 * - Admin & Faculty Coordinator: full access across faculty
 * - Department Secretary: users belonging to the same department (researcher, executive, coordinator, finance, dept_secretary; excluding admin)
 * - Others: only self
 */
export function canAccessUserProfile(
  currentUser: UserProfile | null | undefined,
  targetUser: UserProfile | null | undefined,
  activeRole: UserRole = 'researcher'
): boolean {
  if (!currentUser || !targetUser) return false;
  if (activeRole === 'admin' || activeRole === 'coordinator') return true;

  if (activeRole === 'dept_secretary') {
    const isTargetAdmin = targetUser.role === 'admin' || (targetUser.roles || []).includes('admin');
    return !isTargetAdmin && isSameDepartment(currentUser.department, targetUser.department);
  }

  // researcher or others: only self
  return (
    currentUser.id === targetUser.id ||
    Boolean(currentUser.email && targetUser.email && currentUser.email.toLowerCase() === targetUser.email.toLowerCase())
  );
}

/**
 * Determines if the current user can edit/update a target user's profile
 * - Admin: can edit anyone
 * - Department Secretary: can edit users in the same department (excluding admin), but cannot alter roles
 * - Target user: can edit self
 */
export function canEditUserProfile(
  currentUser: UserProfile | null | undefined,
  targetUser: UserProfile | null | undefined,
  activeRole: UserRole = 'researcher'
): boolean {
  if (!currentUser || !targetUser) return false;
  if (activeRole === 'admin') return true;

  if (activeRole === 'dept_secretary') {
    const isTargetAdmin = targetUser.role === 'admin' || (targetUser.roles || []).includes('admin');
    return !isTargetAdmin && isSameDepartment(currentUser.department, targetUser.department);
  }

  return (
    currentUser.id === targetUser.id ||
    Boolean(currentUser.email && targetUser.email && currentUser.email.toLowerCase() === targetUser.email.toLowerCase())
  );
}

/**
 * Determines if the current user can view a research application
 * - Admin, Faculty Coordinator, Finance, Executive: full faculty access
 * - Department Secretary: only applications belonging to researchers in the same department
 * - Researcher: only their own applications
 */
export function canAccessApplication(
  currentUser: UserProfile | null | undefined,
  app: ResearchApplication | null | undefined,
  activeRole: UserRole = 'researcher'
): boolean {
  if (!currentUser || !app) return false;
  if (activeRole === 'admin' || activeRole === 'coordinator' || activeRole === 'finance' || activeRole === 'executive') {
    return true;
  }

  if (activeRole === 'dept_secretary') {
    return isSameDepartment(currentUser.department, app.department);
  }

  // researcher: check email or applicant name match
  const userEmail = (currentUser.email || '').trim().toLowerCase();
  const userName = (currentUser.name || '').trim().toLowerCase();
  const lastName = userName.split(' ').pop();

  const appEmail = (app.email || '').trim().toLowerCase();
  const appName = (app.applicantName || '').trim().toLowerCase();

  return Boolean(
    (userEmail && appEmail && userEmail === appEmail) ||
    (userName && appName && (appName.includes(userName) || userName.includes(appName))) ||
    (lastName && lastName.length > 2 && appName.includes(lastName))
  );
}

/**
 * Determines if the current user can edit a draft application
 * - Admin & Faculty Coordinator: can edit any draft
 * - Department Secretary: can edit any draft in their department
 * - Researcher: can only edit their own draft
 */
export function canEditDraftApplication(
  currentUser: UserProfile | null | undefined,
  draftApp: ResearchApplication | null | undefined,
  activeRole: UserRole = 'researcher'
): boolean {
  if (!currentUser || !draftApp) return false;
  if (activeRole === 'admin' || activeRole === 'coordinator') return true;

  if (activeRole === 'dept_secretary') {
    return isSameDepartment(currentUser.department, draftApp.department);
  }

  return canAccessApplication(currentUser, draftApp, activeRole);
}
