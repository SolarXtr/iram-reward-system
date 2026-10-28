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
 * Checks if two department names are identical or equivalent
 */
export function isSameDepartment(deptA?: string | null, deptB?: string | null): boolean {
  const normA = normalizeDeptName(deptA);
  const normB = normalizeDeptName(deptB);
  if (!normA || !normB) return false;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
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
 * - Department Secretary: only users with 'researcher' status in the same department
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
    return isResearcherOnlyUser(targetUser) && isSameDepartment(currentUser.department, targetUser.department);
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
 * - Department Secretary: can edit only 'researcher' status users in the same department
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
    return isResearcherOnlyUser(targetUser) && isSameDepartment(currentUser.department, targetUser.department);
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
