import React, { useState, useEffect, useRef } from 'react';
import { Header, UserRole, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { QuotaPlannerView } from './components/QuotaPlannerView';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { ArticleMasterTable } from './components/ArticleMasterTable';
import { AdminRightSideMenu } from './components/AdminRightSideMenu';
import { CalendarView } from './components/CalendarView';
import { LineNotificationModal } from './components/LineNotificationModal';
import { SubmissionFormModal } from './components/SubmissionFormModal';
import { TimelineTrackerModal } from './components/TimelineTrackerModal';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { PaymentVerificationModal } from './components/PaymentVerificationModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserManagementView } from './components/UserManagementView';
import { AuditLogView } from './components/AuditLogView';
import { UserGuideView } from './components/UserGuideView';
import { AboutView } from './components/AboutView';
import { LoginModal } from './components/LoginModal';
import { ResearcherActivationModal } from './components/ResearcherActivationModal';
import { OFFICIAL_WORKFLOW_STEPS_DEF } from './data/initialData';
import {
  generateTimelineFor19Steps,
  getActionStepFrom19,
  getStatusFor19Step,
  normalizeWorkflowStep,
  rebuildTimelineForStep,
  syncWorkflowFieldsForStatus,
} from './data/workflow19Steps';
import { ApplicationStatus, LineMilestoneType, LineNotificationRecord, PublicRewardSummary, ResearchApplication, UserProfile, WorkflowStepId, NuDisbursementRecord } from './types';
import { generateNextTrackingNo } from './data/regulations';
import { 
  DEFAULT_LOGGED_IN_USER,
  saveStoredUserProfile,
  getStoredUsersRegistry,
  saveStoredUsersRegistry,
  upsertRegisteredUser,
  deleteRegisteredUser
} from './data/userProfile';
import {
  getStoredNuDisbursements,
  saveStoredNuDisbursements,
  upsertNuDisbursement
} from './data/nuDisbursementData';
import { 
  getCurrentAuthUser, 
  setCurrentAuthUser, 
  logoutNuUser 
} from './services/authService';
import { 
  LINE_BOT_CONFIG, 
  createLineRecordFromApp, 
  getStoredLineNotifications, 
  saveStoredLineNotifications,
  IS_NOTIFICATION_SYSTEM_SUSPENDED,
  LINE_NOTIFICATION_SYSTEM_ENABLED
} from './data/lineNotificationService';
import {
  fetchPublicRewardSummary,
  fetchRewardApplicationsFromD1,
  createRewardApplicationInD1,
  updateRewardApplicationInD1,
  deleteRewardApplicationInD1
} from './services/rewardD1Service';
import {
  fetchUsersFromD1,
  updateUserProfileInD1,
  createUserInD1,
  deleteUserFromD1
} from './services/userService';
import { isSameDepartment, isResearcherOnlyUser } from './utils/permissionUtils';
import { trackPageView } from './services/analyticsService';
import { recordAuditLog } from './services/auditLogService';
import {
  fetchNuDisbursementsFromD1,
  bulkUpsertNuDisbursementsInD1,
  updateNuDisbursementInD1
} from './services/nuDisbursementD1Service';
import { ACTIVE_ROLE_STORAGE_KEY, UnauthorizedApiError } from './services/apiAuthHeaders';
import { Bell, CheckCircle2, RotateCcw, LogOut, ShieldAlert } from 'lucide-react';

export default function App() {
  const [applications, setApplications] = useState<ResearchApplication[]>([]);

  useEffect(() => {
    localStorage.removeItem('med_nu_research_apps_v1');
  }, []);

  // Active authenticated user profile (null = Guest Mode)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentAuthUser());
  const isGuest = !currentUser;

  // Registered users list in system (Single source of truth)
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => getStoredUsersRegistry());

  // Admin Impersonator State (จำตัวตนของผู้ดูแลระบบ/เลขาภาควิชาเดิมเมื่อสลับไปเป็น User อื่น เพื่อทดสอบหรือทำหน้าที่แทน)
  const [impersonatorAdmin, setImpersonatorAdmin] = useState<UserProfile | null>(() => {
    try {
      const saved = sessionStorage.getItem('med_nu_impersonator_admin_v1');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Current active navigation role & view
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const initialRole: UserRole =
      currentUser?.role === 'dept_secretary' ||
      (currentUser?.roles && currentUser.roles.includes('dept_secretary') && currentUser.role === 'researcher')
        ? 'dept_secretary'
        : currentUser?.role || 'researcher';
    try {
      sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, initialRole);
    } catch {}
    return initialRole;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, currentRole);
    } catch {}
  }, [currentRole]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [timelineApp, setTimelineApp] = useState<ResearchApplication | null>(null);
  const [printApp, setPrintApp] = useState<ResearchApplication | null>(null);
  const [paymentApp, setPaymentApp] = useState<ResearchApplication | null>(null);
  const [editingDraftApp, setEditingDraftApp] = useState<ResearchApplication | null>(null);
  const [isLoadingD1, setIsLoadingD1] = useState(false);
  const [publicRewardSummary, setPublicRewardSummary] = useState<PublicRewardSummary | null>(null);
  const [isLoadingPublicSummary, setIsLoadingPublicSummary] = useState(false);

  // Auto-open Researcher Activation Modal if logged-in user is in Pending Profile state
  useEffect(() => {
    if (currentUser?.isPendingProfile) {
      setIsActivationModalOpen(true);
    }
  }, [currentUser]);

  // Enforce Guest Mode to remain on dashboard tab
  useEffect(() => {
    if (!currentUser && activeTab !== 'dashboard' && activeTab !== 'user_guide' && activeTab !== 'about') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Automatically track page views in Cloudflare Analytics when activeTab changes
  useEffect(() => {
    const tabToPathMap: Record<ActiveTab, string> = {
      dashboard: '/',
      quota_planner: '/quota',
      article_table: '/articles',
      table: '/applications',
      kanban: '/pipeline',
      calendar: '/calendar',
      line_oa: '/line-oa',
      user_management: '/admin',
      audit_logs: '/audit-logs',
      user_guide: '/guide',
      about: '/about',
    };
    const path = tabToPathMap[activeTab] || '/';
    trackPageView(path);
  }, [activeTab]);

  // Load applications only for authenticated users; never cache personal records in localStorage.
  useEffect(() => {
    if (!currentUser) {
      setApplications([]);
      setIsLoadingD1(false);
      return;
    }

    let cancelled = false;
    const loadFromD1 = async () => {
      setIsLoadingD1(true);
      try {
        try {
          sessionStorage.setItem(ACTIVE_ROLE_STORAGE_KEY, currentRole);
        } catch {}
        const d1Data = await fetchRewardApplicationsFromD1();
        if (!cancelled && Array.isArray(d1Data)) {
          // Merge with any offline doc details cache from localStorage as fallback
          const merged = d1Data.map((app) => {
            const cached = localStorage.getItem(`iram_doc_details_${app.id}`);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                return { ...app, ...parsed };
              } catch (e) {
                return app;
              }
            }
            return app;
          });
          setApplications(merged);
        }
      } catch (err) {
        if (!cancelled && err instanceof UnauthorizedApiError) {
          console.warn('Session expired or missing Firebase token; prompting re-login.');
          setCurrentUser(null);
          setCurrentAuthUser(null);
          setImpersonatorAdmin(null);
          try {
            sessionStorage.removeItem('med_nu_impersonator_admin_v1');
          } catch {}
          setApplications([]);
          setIsLoginModalOpen(true);
          return;
        }
        console.warn('Failed to load applications from D1:', err);
      } finally {
        if (!cancelled) setIsLoadingD1(false);
      }
    };
    loadFromD1();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentRole]);

  useEffect(() => {
    if (currentUser) {
      setPublicRewardSummary(null);
      setIsLoadingPublicSummary(false);
      return;
    }

    let cancelled = false;
    setIsLoadingPublicSummary(true);
    fetchPublicRewardSummary()
      .then((summary) => {
        if (!cancelled) setPublicRewardSummary(summary);
      })
      .catch((error) => {
        console.warn('Public dashboard summary unavailable:', error);
        if (!cancelled) setPublicRewardSummary(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPublicSummary(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Load registered users from D1 only after authentication.
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    fetchUsersFromD1()
      .then((d1Users) => {
        if (!cancelled && Array.isArray(d1Users) && d1Users.length > 0) {
          setRegisteredUsers(d1Users);

          // Synchronize active currentUser with latest verified record from D1
          setCurrentUser((prev) => {
            if (!prev) return prev;
            const match = d1Users.find(
              (u) => (prev.id && u.id === prev.id) ||
                     (prev.name && u.name && prev.name.trim() === u.name.trim()) ||
                     (prev.email && u.email && prev.email.toLowerCase() === u.email.toLowerCase())
            );
            if (match) {
              const merged: UserProfile = { ...prev, ...match };
              setCurrentAuthUser(merged);
              saveStoredUserProfile(merged);
              if (!impersonatorAdmin && match.role && match.role !== currentRole) {
                const validRoles = Array.from(new Set([match.role, ...(match.roles || [])]));
                if (!validRoles.includes(currentRole)) {
                  const targetRole = (match.role === 'researcher' && match.roles?.includes('dept_secretary'))
                    ? 'dept_secretary'
                    : match.role;
                  setCurrentRole(targetRole);
                }
              }
              return merged;
            }
            return prev;
          });
        }
      })
      .catch((err) => console.warn('D1 users fetch warning:', err));
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  // Proactive Auto-Enrichment: Backfill empty profile bank details from application history
  const hasEnrichedHistoryRef = useRef(false);
  useEffect(() => {
    if (hasEnrichedHistoryRef.current) return;
    if (!applications || applications.length === 0 || !registeredUsers || registeredUsers.length === 0) return;

    let hasUpdates = false;
    const updatedUsers = [...registeredUsers];

    for (let i = 0; i < updatedUsers.length; i++) {
      const u = updatedUsers[i];
      if (!u.bankAccountNo || !u.idCardNo) {
        const matchingApp = applications
          .filter((a) =>
            (a.email && u.email && a.email.trim().toLowerCase() === u.email.trim().toLowerCase()) ||
            (a.applicantName && u.name && a.applicantName.trim() === u.name.trim())
          )
          .find((a) => a.bankAccountNo || a.idCardNo);

        if (matchingApp) {
          const newBankNo = u.bankAccountNo || matchingApp.bankAccountNo || '';
          const newBankName = u.bankName || matchingApp.bankName || 'ธนาคารกรุงไทย';
          const newIdCard = u.idCardNo || matchingApp.idCardNo || '';
          const newPhone = u.phone || matchingApp.phone || '';

          if ((newBankNo && newBankNo !== u.bankAccountNo) || (newIdCard && newIdCard !== u.idCardNo)) {
            hasUpdates = true;
            updatedUsers[i] = {
              ...u,
              bankAccountNo: newBankNo,
              bankName: newBankName,
              idCardNo: newIdCard,
              phone: newPhone,
            };
            // Sync to D1
            updateUserProfileInD1(u.id, {
              bankAccountNo: newBankNo,
              bankName: newBankName,
              idCardNo: newIdCard,
              phone: newPhone,
            }).catch((err) => console.warn('Background backfill user bank info to D1:', err));
          }
        }
      }
    }

    if (hasUpdates) {
      hasEnrichedHistoryRef.current = true;
      setRegisteredUsers(updatedUsers);
      saveStoredUsersRegistry(updatedUsers);
    }
  }, [applications.length, registeredUsers.length]);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // LINE OA Notification history log
  const [lineNotifications, setLineNotifications] = useState<LineNotificationRecord[]>(() => {
    return getStoredLineNotifications();
  });

  const triggerLineMilestoneNotification = (app: ResearchApplication, milestone: LineMilestoneType) => {
    // ระงับการใช้งานระบบแจ้งเตือน Line OA/Email ชั่วคราวตามนโยบาย
    if (IS_NOTIFICATION_SYSTEM_SUSPENDED || !LINE_NOTIFICATION_SYSTEM_ENABLED) {
      return;
    }

    const newRecord = createLineRecordFromApp(app, milestone);
    setLineNotifications((prev) => {
      const updated = [newRecord, ...prev];
      saveStoredLineNotifications(updated);
      return updated;
    });

    const milestoneLabels: Record<LineMilestoneType, string> = {
      application_submitted: '1. ยื่นคำขอสำเร็จ',
      document_verified: '2. ผ่านการตรวจเอกสารและฐานข้อมูล',
      dean_approved: '3. คณบดีลงนามอนุมัติเบิกจ่าย',
      payment_transferred: '4. งานการเงินโอนเงินเข้าบัญชีเรียบร้อย (Real-time)'
    };
    showToast(`LINE OA [${LINE_BOT_CONFIG.botBasicId}]: แจ้งเตือน "${milestoneLabels[milestone]}" (${app.trackingNo}) ส่งตรงถึงมือถือสำเร็จ!`);
  };

  // DRI NU Disbursement Tracking State (ม.นเรศวร) - Single Source of Truth on Cloudflare D1
  const [nuDisbursements, setNuDisbursements] = useState<NuDisbursementRecord[]>(() => getStoredNuDisbursements());

  // Sync NU Disbursements from Cloudflare D1 for authenticated users (with one-time safe migration from localStorage)
  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    const MIGRATION_FLAG = 'med_nu_disb_d1_migrated_v1';
    const canSyncNuToD1 =
      currentRole === 'admin' || currentRole === 'coordinator' || currentRole === 'finance';

    fetchNuDisbursementsFromD1()
      .then(async (d1Records) => {
        if (cancelled) return;
        const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';

        if ((d1Records.length === 0 || !alreadyMigrated) && (d1Records.length === 0 || canSyncNuToD1)) {
          const localRecords = getStoredNuDisbursements();
          // Merge D1 (priority) + any local-only records from this browser
          const mergedMap = new Map<string, NuDisbursementRecord>();
          for (const lr of localRecords) {
            mergedMap.set(lr.id, lr);
          }
          for (const dr of d1Records) {
            mergedMap.set(dr.id, dr);
          }
          const merged = Array.from(mergedMap.values());
          setNuDisbursements(merged);
          saveStoredNuDisbursements(merged);
          try {
            await bulkUpsertNuDisbursementsInD1(merged);
            localStorage.setItem(MIGRATION_FLAG, 'true');
          } catch (syncErr) {
            console.warn('Initial NU disbursements D1 migration warning:', syncErr);
          }
        } else {
          setNuDisbursements(d1Records);
          saveStoredNuDisbursements(d1Records);
        }
      })
      .catch((err) => {
        console.warn('D1 NU disbursements fetch unavailable, using local cache:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const handleUpdateNuRecord = (updated: NuDisbursementRecord) => {
    setNuDisbursements((prev) => upsertNuDisbursement(prev, updated));
    updateNuDisbursementInD1(updated).catch((err) => {
      console.warn('D1 update NU disbursement error:', err);
    });
    logActivity(
      'UPDATE_NU_DISBURSEMENT',
      'NU_DISBURSEMENT',
      updated.matchedFacultyTrackingNo || updated.id,
      `อัปเดตข้อมูลเบิกจ่าย มน.: ${updated.researcherName} (${updated.status}, ยอดรวม ${(updated.totalAmount || 0).toLocaleString()} บาท)`
    );
    showToast(`อัปเดตข้อมูลการเบิกจ่าย มน. (${updated.researcherName}) ลง D1 เรียบร้อยแล้ว`);
  };

  const handleImportNuRecords = (newRecords: NuDisbursementRecord[]) => {
    const recordsToSync: NuDisbursementRecord[] = [];
    setNuDisbursements((prev) => {
      const merged = [...prev];
      for (const nr of newRecords) {
        const idx = merged.findIndex(
          m => m.id === nr.id || (m.articleTitle && nr.articleTitle && m.articleTitle.trim().toLowerCase() === nr.articleTitle.trim().toLowerCase())
        );
        if (idx >= 0) {
          const updatedRec: NuDisbursementRecord = {
            ...merged[idx],
            ...nr,
            id: merged[idx].id, // preserve existing D1 primary key
            rewardAmount: merged[idx].rewardAmount || nr.rewardAmount,
            pageChargeAmount: merged[idx].pageChargeAmount || nr.pageChargeAmount,
            totalAmount: (merged[idx].rewardAmount || nr.rewardAmount || 0) + (merged[idx].pageChargeAmount || nr.pageChargeAmount || 0),
            updatedAt: new Date().toISOString().split('T')[0]
          };
          merged[idx] = updatedRec;
          recordsToSync.push(updatedRec);
        } else {
          merged.unshift(nr);
          recordsToSync.push(nr);
        }
      }
      saveStoredNuDisbursements(merged);
      return merged;
    });
    if (recordsToSync.length > 0) {
      bulkUpsertNuDisbursementsInD1(recordsToSync).catch((err) => {
        console.warn('D1 bulk import NU disbursements error:', err);
      });
    }
    logActivity(
      'IMPORT_NU_DISBURSEMENTS',
      'NU_DISBURSEMENT',
      `import-${newRecords.length}`,
      `นำเข้าข้อมูลการเบิกจ่ายจากระบบ มน. จำนวน ${newRecords.length} รายการ ลง Cloudflare D1`
    );
    showToast(`นำเข้าข้อมูลจากระบบ มน. ลง D1 สำเร็จ (${newRecords.length} รายการ)`);
  };

  // Audit Log Helper
  const logActivity = (
    action: string,
    targetType: string,
    targetId: string,
    details: string
  ) => {
    const actor = impersonatorAdmin || currentUser;
    recordAuditLog({
      userId: actor?.id || 'system',
      userName: impersonatorAdmin
        ? `${impersonatorAdmin.name} (ในนาม ${currentUser?.name || '-'})`
        : (currentUser?.name || 'ผู้ใช้งาน'),
      userRole: impersonatorAdmin ? impersonatorAdmin.role : currentRole,
      action,
      targetType,
      targetId,
      details,
    }).catch(() => {});
  };

  // User Management Handlers

  const handleSaveProfile = async (updated: UserProfile): Promise<boolean> => {
    try {
      // กรณี Admin กำลัง Impersonate user อื่น: Firebase session เป็นของ Admin
      // แต่ updated.id คือ targetUser → ส่ง _impersonatedBy เพื่อให้ backend ตรวจสอบสิทธิ์ Admin ได้
      const payload: UserProfile & { _impersonatedBy?: string } = impersonatorAdmin
        ? { ...updated, _impersonatedBy: impersonatorAdmin.id }
        : updated;

      await updateUserProfileInD1(updated.id, payload);
      saveStoredUserProfile(updated);
      setCurrentUser(updated);
      setCurrentAuthUser(updated);
      const nextUsers = upsertRegisteredUser(updated);
      setRegisteredUsers(nextUsers);
      showToast('บันทึกข้อมูลโปรไฟล์ลง Cloudflare D1 เรียบร้อยแล้ว');
      logActivity(
        'UPDATE_PROFILE',
        'USER',
        updated.id,
        `อัปเดตข้อมูลโปรไฟล์ส่วนตัว: ${updated.name} (${updated.email})`
      );
      return true;
    } catch (error) {
      console.error('Failed to save profile to D1:', error);
      const reason = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      showToast(`บันทึกโปรไฟล์ลง D1 ไม่สำเร็จ: ${reason}`);
      return false;
    }
  };

  const handleUpdateRegisteredUser = async (updatedUser: UserProfile): Promise<boolean> => {
    const isRealAdmin = currentUser?.role === 'admin' || (currentUser?.roles || []).includes('admin');
    const isSecretaryMode = !isRealAdmin && (currentRole === 'dept_secretary' || currentUser?.role === 'dept_secretary');
    if (isSecretaryMode) {
      const existingTarget = registeredUsers.find((u) => u.id === updatedUser.id);
      if (!existingTarget) {
        showToast('⚠️ ไม่พบบัญชีผู้ใช้งานที่ต้องการแก้ไข');
        return false;
      }
      if (!isSameDepartment(currentUser?.department, existingTarget.department)) {
        showToast('⚠️ เลขาภาควิชาสามารถแก้ไขได้เฉพาะบุคลากรในภาควิชาที่ตนเองสังกัดเท่านั้น');
        return false;
      }
      const isTargetAdmin = existingTarget.role === 'admin' || (existingTarget.roles || []).includes('admin');
      if (isTargetAdmin) {
        showToast('⚠️ เลขาภาควิชาไม่สามารถแก้ไขบัญชีผู้ดูแลระบบได้');
        return false;
      }
      // Preserve existing role and roles (cannot add or reduce roles)
      updatedUser = {
        ...updatedUser,
        role: existingTarget.role,
        roles: existingTarget.roles && existingTarget.roles.length > 0 ? existingTarget.roles : [existingTarget.role],
        department: existingTarget.department,
      };
    }
    try {
      await updateUserProfileInD1(updatedUser.id, updatedUser);
      const nextUsers = upsertRegisteredUser(updatedUser);
      setRegisteredUsers(nextUsers);
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
        setCurrentAuthUser(updatedUser);
        saveStoredUserProfile(updatedUser);
      }
      showToast(`อัปเดตข้อมูล ${updatedUser.name} ใน D1 เรียบร้อยแล้ว`);
      logActivity(
        'UPDATE_USER',
        'USER',
        updatedUser.id,
        `แก้ไขข้อมูลผู้ใช้: ${updatedUser.name} (${updatedUser.email}), สิทธิ์: ${updatedUser.role}, สถานะ: ${updatedUser.status || 'active'}, ภาควิชา: ${updatedUser.department}`
      );
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      showToast(`อัปเดตข้อมูลใน D1 ไม่สำเร็จ: ${reason}`);
      return false;
    }
  };

  const handleCreateRegisteredUser = async (newUser: UserProfile): Promise<boolean> => {
    const isRealAdmin = currentUser?.role === 'admin' || (currentUser?.roles || []).includes('admin');
    const isSecretaryMode = !isRealAdmin && (currentRole === 'dept_secretary' || currentUser?.role === 'dept_secretary');
    if (isSecretaryMode) {
      newUser = {
        ...newUser,
        role: 'researcher',
        roles: ['researcher'],
      };
    }
    try {
      const createdUser = await createUserInD1(newUser);
      const savedUser = { ...newUser, id: createdUser.id || newUser.id };
      const nextUsers = upsertRegisteredUser(savedUser);
      setRegisteredUsers(nextUsers);
      showToast(`เพิ่มผู้ใช้งาน ${savedUser.name} ลง D1 เรียบร้อยแล้ว`);
      recordAuditLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'ผู้ดูแลระบบ',
        userRole: currentRole,
        action: 'CREATE_USER',
        targetType: 'USER',
        targetId: savedUser.id,
        details: `เพิ่มบัญชีผู้ใช้ใหม่: ${savedUser.name} (${savedUser.email}), สิทธิ์: ${savedUser.role}, ภาควิชา: ${savedUser.department}`
      }).catch(() => {});
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      showToast(`เพิ่มผู้ใช้งานลง D1 ไม่สำเร็จ: ${reason}`);
      return false;
    }
  };

  const handleDeleteRegisteredUser = async (userId: string): Promise<boolean> => {
    const isRealAdmin = currentUser?.role === 'admin' || (currentUser?.roles || []).includes('admin');
    const isSecretaryMode = !isRealAdmin && (currentRole === 'dept_secretary' || currentUser?.role === 'dept_secretary');
    if (isSecretaryMode) {
      showToast('⚠️ เลขาภาควิชาไม่มีสิทธิ์ลบบัญชีผู้ใช้งานในระบบ');
      return false;
    }
    try {
      await deleteUserFromD1(userId);
      const userToDelete = registeredUsers.find((user) => user.id === userId);
      const nextUsers = deleteRegisteredUser(userId);
      setRegisteredUsers(nextUsers);
      showToast(`ลบผู้ใช้งาน ${userToDelete?.name || userId} จาก D1 เรียบร้อยแล้ว`);
      recordAuditLog({
        userId: currentUser?.id || 'admin',
        userName: currentUser?.name || 'ผู้ดูแลระบบ',
        userRole: currentRole,
        action: 'DELETE_USER',
        targetType: 'USER',
        targetId: userId,
        details: `ลบบัญชีผู้ใช้: ${userToDelete?.name || userId} (${userToDelete?.email || '-'})`
      }).catch(() => {});
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'ไม่ทราบสาเหตุ';
      showToast(`ลบผู้ใช้งานจาก D1 ไม่สำเร็จ: ${reason}`);
      return false;
    }
  };

  // Admin / Dept Secretary Impersonation: สลับไปเป็น user เป้าหมายด้วย id และสิทธิ์ของ user นั้นจริงๆ (ใช้ทดสอบระบบและทำหน้าที่แทน)
  const handleSwitchUser = (targetUser: UserProfile) => {
    // หากขณะนี้มีสิทธิ์ admin หรือ dept_secretary และยังไม่ได้จำผู้ดำเนินการ ให้จำตัวตนเดิมไว้
    if (
      !impersonatorAdmin &&
      (currentUser?.role === 'admin' ||
        currentUser?.roles?.includes('admin') ||
        currentUser?.role === 'dept_secretary' ||
        currentUser?.roles?.includes('dept_secretary'))
    ) {
      setImpersonatorAdmin(currentUser);
      try {
        sessionStorage.setItem('med_nu_impersonator_admin_v1', JSON.stringify(currentUser));
      } catch (e) {}
    }

    // เปลี่ยนเป็น id, email, name, role, roles ของ targetUser จริงๆ
    setCurrentUser(targetUser);
    setCurrentAuthUser(targetUser);
    saveStoredUserProfile(targetUser);
    setCurrentRole(targetUser.role || 'researcher');
    setActiveTab('dashboard');
    showToast(`🎭 สลับเข้าสู่โหมดตัวแทนของ "${targetUser.name}" (${targetUser.email}) ด้วยสิทธิ์: ${targetUser.role} สำเร็จ`);
    logActivity(
      'IMPERSONATE_USER',
      'USER',
      targetUser.id,
      `สลับตัวตนเข้าปฏิบัติหน้าที่แทน: ${targetUser.name} (${targetUser.email}) สิทธิ์: ${targetUser.role}`
    );
  };

  // Exit Impersonation: สลับกลับสู่ตัวตนผู้ดูแลระบบหรือเลขาภาควิชาเดิม
  const handleExitImpersonation = () => {
    if (!impersonatorAdmin) return;
    const origUser = impersonatorAdmin;
    const impersonatedName = currentUser?.name || '-';
    setCurrentUser(origUser);
    setCurrentAuthUser(origUser);
    saveStoredUserProfile(origUser);
    setCurrentRole(origUser.role || 'admin');
    setImpersonatorAdmin(null);
    try {
      sessionStorage.removeItem('med_nu_impersonator_admin_v1');
    } catch (e) {}
    showToast(`🛡️ สลับกลับสู่บัญชีเดิม (${origUser.name}) เรียบร้อยแล้ว`);
    recordAuditLog({
      userId: origUser.id,
      userName: origUser.name,
      userRole: origUser.role,
      action: 'EXIT_IMPERSONATION',
      targetType: 'USER',
      targetId: origUser.id,
      details: `ออกจากโหมดปฏิบัติหน้าที่แทน "${impersonatedName}" กลับสู่บัญชี ${origUser.name}`
    }).catch(() => {});
  };

  const handleSwitchUserFromConsole = (user: UserProfile) => {
    handleSwitchUser(user);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    const targetRole = (user.role === 'researcher' && user.roles?.includes('dept_secretary'))
      ? 'dept_secretary'
      : user.role;
    setCurrentRole(targetRole);
    setActiveTab('dashboard');
    recordAuditLog({
      userId: user.id || user.email,
      userName: user.name,
      userRole: targetRole,
      action: 'LOGIN',
      targetType: 'USER',
      targetId: user.id,
      details: `เข้าสู่ระบบสำเร็จในสิทธิ์ ${targetRole}`
    }).catch(() => {});
    if (user.isPendingProfile) {
      setIsActivationModalOpen(true);
      showToast(`ยินดีต้อนรับ ${user.name} กรุณากรอกข้อมูลส่วนบุคคลเพื่อเปิดสิทธิ์นักวิจัย`);
    } else {
      showToast(`ยินดีต้อนรับ ${user.name} (${user.email}) เข้าสู่ระบบในสิทธิ์: ${targetRole === 'dept_secretary' ? 'เลขาภาควิชา' : user.role}`);
    }
  };

  const handleLogout = async () => {
    logActivity('LOGOUT', 'USER', currentUser?.id || 'guest', `ออกจากระบบ (${currentUser?.name || '-'})`);
    await logoutNuUser();
    setCurrentUser(null);
    setImpersonatorAdmin(null);
    try {
      sessionStorage.removeItem('med_nu_impersonator_admin_v1');
    } catch (e) {}
    setIsActivationModalOpen(false);
    setCurrentRole('researcher');
    setActiveTab('dashboard');
    showToast('ออกจากระบบเรียบร้อยแล้ว เข้าสู่โหมดผู้เยี่ยมชมทั่วไป (Guest Mode)');
  };

  const handleActivateResearcher = async (updatedProfile: UserProfile) => {
    // 1. Save locally and update state
    const nextUsers = upsertRegisteredUser(updatedProfile);
    setRegisteredUsers(nextUsers);
    setCurrentUser(updatedProfile);
    setCurrentAuthUser(updatedProfile);
    saveStoredUserProfile(updatedProfile);
    setCurrentRole('researcher');
    setIsActivationModalOpen(false);

    // 2. Synchronize to Cloudflare D1
    try {
      await createUserInD1(updatedProfile);
      showToast(`✅ ยืนยันข้อมูลสังกัดและเปิดสิทธิ์นักวิจัยให้ ${updatedProfile.name} เรียบร้อยแล้ว!`);
      logActivity(
        'ACTIVATE_USER',
        'USER',
        updatedProfile.id,
        `ยืนยันข้อมูลสังกัดและเปิดสิทธิ์นักวิจัย: ${updatedProfile.name} (${updatedProfile.department})`
      );
    } catch (err: any) {
      console.warn('D1 user creation warning:', err);
      // Attempt profile update fallback if user already existed in D1
      try {
        await updateUserProfileInD1(updatedProfile.id, updatedProfile);
        showToast(`✅ อัปเดตข้อมูลสังกัดและเปิดสิทธิ์นักวิจัยลง Cloudflare D1 สำเร็จ`);
      } catch (err2) {
        console.error('D1 update fallback error:', err2);
        showToast(`บันทึกข้อมูลในระบบเรียบร้อยแล้ว (ออฟไลน์โหมด)`);
      }
    }
  };

  const handleOpenNewSubmission = () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      showToast('กรุณาเข้าสู่ระบบด้วย NU Account (@nu.ac.th) ก่อนยื่นคำขอรับทุน');
      return;
    }
    if (currentUser.isPendingProfile) {
      setIsActivationModalOpen(true);
      showToast('กรุณากรอกข้อมูลส่วนบุคคลและเปิดสิทธิ์นักวิจัยก่อนยื่นคำขอรับทุน');
      return;
    }
    setEditingDraftApp(null);
    setIsSubmissionModalOpen(true);
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (!currentUser && tab !== 'dashboard' && tab !== 'user_guide' && tab !== 'about') {
      setIsLoginModalOpen(true);
      showToast('กรุณาเข้าสู่ระบบด้วย NU Account (@nu.ac.th) เพื่อเข้าใช้งานเมนูนี้');
      return;
    }
    setActiveTab(tab);
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (!currentUser) return;
    setCurrentRole(newRole);
    const roleAllowedTabs: Record<UserRole, ActiveTab[]> = {
      researcher: ['dashboard', 'quota_planner', 'article_table', 'table', 'calendar', 'user_guide', 'about'],
      dept_secretary: ['dashboard', 'quota_planner', 'article_table', 'table', 'calendar', 'user_management', 'user_guide', 'about'],
      finance: ['dashboard', 'article_table', 'table', 'calendar', 'user_guide', 'about'],
      executive: ['dashboard', 'article_table', 'table', 'calendar', 'user_guide', 'about'],
      coordinator: ['dashboard', 'quota_planner', 'article_table', 'kanban', 'table', 'calendar', 'user_guide', 'about', ...(LINE_NOTIFICATION_SYSTEM_ENABLED ? ['line_oa' as ActiveTab] : [])],
      admin: ['dashboard', 'quota_planner', 'article_table', 'kanban', 'table', 'calendar', 'user_guide', 'about', ...(LINE_NOTIFICATION_SYSTEM_ENABLED ? ['line_oa' as ActiveTab] : []), 'user_management', 'audit_logs'],
    };
    const allowed = roleAllowedTabs[newRole] || ['dashboard'];
    if (!allowed.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  // 1. Submit or Save Draft Application (Local State + Cloudflare D1 Sync)
  const handleCreateSubmission = (appInput: Partial<ResearchApplication>, asDraft = false) => {
    const activeUser = currentUser || DEFAULT_LOGGED_IN_USER;
    const finalId = appInput.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const appFiscalYear = appInput.fiscalYear || 2570;
    const isActuallyDraft = asDraft || appInput.status === 'draft';

    // For drafts, assign unique draft tracking number so D1 UNIQUE constraint never fails
    const finalTrackingNo = isActuallyDraft
      ? (appInput.trackingNo && !appInput.trackingNo.startsWith('DRAFT')
          ? appInput.trackingNo
          : (appInput.trackingNo && appInput.trackingNo.startsWith('DRAFT-')
              ? appInput.trackingNo
              : `DRAFT-${appFiscalYear}-${finalId.slice(-6).toUpperCase()}`))
      : (appInput.trackingNo && !appInput.trackingNo.startsWith('DRAFT')
          ? appInput.trackingNo
          : generateNextTrackingNo(appFiscalYear, applications.map((a) => a.trackingNo)));

    const today = new Date().toISOString().split('T')[0];

    // Priority to appInput fields (critical when secretary records on behalf of a researcher)
    const targetApplicantName = appInput.applicantName || activeUser.name;
    const targetAcademicPosition = appInput.academicPosition !== undefined ? appInput.academicPosition : activeUser.academicPosition;
    const targetDepartment = appInput.department || activeUser.department;
    const targetPhone = appInput.phone !== undefined ? appInput.phone : activeUser.phone;
    const targetEmail = appInput.email || activeUser.email;
    const targetBankName = appInput.bankName || activeUser.bankName || 'ธนาคารกรุงไทย';
    const targetBankAccountNo = appInput.bankAccountNo !== undefined ? appInput.bankAccountNo : (activeUser.bankAccountNo || '');
    const targetIdCardNo = appInput.idCardNo !== undefined ? appInput.idCardNo : (activeUser.idCardNo || '');

    const finalApp: ResearchApplication = {
      applicantName: targetApplicantName,
      academicPosition: targetAcademicPosition,
      department: targetDepartment,
      phone: targetPhone,
      email: targetEmail,
      bankName: targetBankName,
      bankAccountNo: targetBankAccountNo,
      idCardNo: targetIdCardNo,
      pdpaConsentAccepted: true,
      pdpaConsentDate: today,
      requestType: 'both',
      articleTitle: '',
      journalName: '',
      journalScope: 'international',
      database: 'Scopus',
      quartile: 'Q1',
      authorRole: 'first_author',
      articleType: 'research_article',
      publishedDate: today,
      within24Months: true,
      notForGraduation: true,
      medNuAffiliationDeclared: true,
      claimedRewardAmount: 0,
      claimedPageChargeAmount: 0,
      approvedPageChargeAmount: 0,
      totalClaimedAmount: 0,
      fiscalYear: appFiscalYear,
      currentStep: isActuallyDraft ? 1 : 2,
      paymentStatus: 'unpaid',
      attachments: [],
      lineNotified: false,
      calendarSynced: false,
      timeline: generateTimelineFor19Steps(isActuallyDraft ? 1 : 2),
      ...appInput,
      id: finalId,
      trackingNo: finalTrackingNo,
      status: isActuallyDraft ? 'draft' : 'submitted',
      createdAt: appInput.createdAt || today,
      updatedAt: today,
    };

    const isExistingApp = applications.some((a) => a.id === finalId);

    setApplications((prev) => {
      const existingIdx = prev.findIndex((a) => a.id === finalId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = finalApp;
        return updated;
      }
      return [finalApp, ...prev];
    });

    setIsSubmissionModalOpen(false);
    setEditingDraftApp(null);

    // Automatically persist bank info and citizen ID back to researcher's profile in D1 & registeredUsers
    if (targetEmail && (targetBankAccountNo || targetIdCardNo || targetPhone)) {
      const targetUser = registeredUsers.find(
        (u) => (u.email && u.email.trim().toLowerCase() === targetEmail.trim().toLowerCase()) ||
               (u.name && targetApplicantName && u.name.trim() === targetApplicantName.trim())
      );

      const targetKey = targetUser ? targetUser.id : targetEmail;
      const needsProfileUpdate = targetUser
        ? Boolean(
            (targetBankAccountNo && targetUser.bankAccountNo !== targetBankAccountNo) ||
            (targetBankName && targetUser.bankName !== targetBankName) ||
            (targetIdCardNo && targetUser.idCardNo !== targetIdCardNo) ||
            (targetPhone && targetUser.phone !== targetPhone)
          )
        : true;

      if (needsProfileUpdate) {
        if (targetUser) {
          const updatedTargetUser: UserProfile = {
            ...targetUser,
            bankAccountNo: targetBankAccountNo || targetUser.bankAccountNo,
            bankName: targetBankName || targetUser.bankName,
            idCardNo: targetIdCardNo || targetUser.idCardNo,
            phone: targetPhone || targetUser.phone,
          };
          const nextUsers = upsertRegisteredUser(updatedTargetUser);
          setRegisteredUsers(nextUsers);

          if (currentUser && currentUser.email?.trim().toLowerCase() === targetEmail.trim().toLowerCase()) {
            setCurrentUser(updatedTargetUser);
            saveStoredUserProfile(updatedTargetUser);
          }
        }

        // Asynchronously update irUser in Cloudflare D1
        updateUserProfileInD1(targetKey, {
          bankAccountNo: targetBankAccountNo,
          bankName: targetBankName,
          idCardNo: targetIdCardNo,
          phone: targetPhone,
        }).catch((err) => {
          console.warn('Auto-sync researcher profile bank info to D1 failed:', err);
        });
      }
    }

    if (isActuallyDraft) {
      logActivity(
        isExistingApp ? 'UPDATE_APPLICATION' : 'CREATE_APPLICATION',
        'REWARD_APPLICATION',
        finalApp.trackingNo,
        `${isExistingApp ? 'แก้ไขร่างคำขอ' : 'สร้างร่างคำขอใหม่'}: "${finalApp.articleTitle || 'ฉบับร่าง'}" ของ ${finalApp.applicantName} ยอดรวม ${finalApp.totalClaimedAmount.toLocaleString()} บาท`
      );
      const d1DraftPromise = isExistingApp
        ? updateRewardApplicationInD1(finalId, finalApp)
        : createRewardApplicationInD1(finalApp);
      d1DraftPromise
        .then(() => {
          showToast(`💾 บันทึกร่างเตรียมเบิกรางวัล "${finalApp.articleTitle || 'ฉบับร่าง'}" ลงฐานข้อมูล D1 สำเร็จ!`);
        })
        .catch((e) => {
          console.warn('D1 draft sync error:', e);
          showToast(`⚠️ บันทึกร่างในเครื่องแล้ว แต่การซิงก์เข้า D1 ขัดข้อง: ${e.message}`);
        });
      return;
    }

    logActivity(
      isExistingApp ? 'UPDATE_APPLICATION' : 'CREATE_APPLICATION',
      'REWARD_APPLICATION',
      finalApp.trackingNo,
      `${isExistingApp ? 'แก้ไขและยื่นคำขอ' : 'ยื่นคำขอรับทุนใหม่'}: "${finalApp.articleTitle}" ของ ${finalApp.applicantName} ยอดรวม ${finalApp.totalClaimedAmount.toLocaleString()} บาท`
    );
    triggerLineMilestoneNotification(finalApp, 'application_submitted');

    // Cloudflare D1 Database Sync
    const d1Promise = isExistingApp
      ? updateRewardApplicationInD1(finalId, finalApp)
      : createRewardApplicationInD1(finalApp);

    d1Promise
      .then(() => {
        showToast(`✅ ยื่นคำขอ ${finalApp.trackingNo} ลง Cloudflare D1 สำเร็จเรียบร้อย!`);
      })
      .catch((err) => {
        console.error('D1 create/update error:', err);
        showToast(`⚠️ บันทึกข้อมูลในเครื่องแล้ว แต่การซิงก์เข้า Cloudflare D1 ขัดข้อง: ${err.message}`);
      });
  };

  // Draft Management Handlers
  const handleEditDraft = (draftApp: ResearchApplication) => {
    // Researchers can only edit their own draft applications
    if (currentRole === 'researcher') {
      const isMine =
        (currentUser?.email && draftApp.email && draftApp.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && draftApp.applicantName && draftApp.applicantName.toLowerCase() === currentUser.name.toLowerCase());
      if (!isMine) {
        showToast('⚠️ คุณสามารถแก้ไขได้เฉพาะคำขอของตนเองเท่านั้น');
        return;
      }
    } else if (currentRole === 'dept_secretary') {
      const isSameDept = isSameDepartment(currentUser?.department, draftApp.department);
      const isMine = Boolean(currentUser?.email && draftApp.email && draftApp.email.toLowerCase() === currentUser.email.toLowerCase());
      if (!isSameDept && !isMine) {
        showToast('⚠️ เลขาภาควิชาสามารถแก้ไขได้เฉพาะคำขอในภาควิชาที่สังกัดเท่านั้น');
        return;
      }
    }
    setEditingDraftApp(draftApp);
    setIsSubmissionModalOpen(true);
  };

  // Return submitted/in-progress application back to Draft in QuotaPlannerView
  const handleReturnToDraft = (app: ResearchApplication) => {
    // finance และ executive ไม่มีสิทธิ์ส่งคืน (ตาม sitemap P-05)
    if (currentRole === 'finance' || currentRole === 'executive') {
      showToast('⚠️ บทบาทของคุณไม่มีสิทธิ์ส่งคืนคำขอเพื่อแก้ไข');
      return;
    }

    if (currentRole === 'researcher') {
      const isMine =
        (currentUser?.email && app.email && app.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && app.applicantName && app.applicantName.toLowerCase() === currentUser.name.toLowerCase());
      if (!isMine) {
        showToast('⚠️ คุณสามารถส่งคืนเพื่อแก้ไขได้เฉพาะคำขอของตนเองเท่านั้น');
        return;
      }
      // researcher ส่งคืนได้เฉพาะสถานะ submitted เท่านั้น (ยังไม่ผ่านเจ้าหน้าที่)
      if (app.status !== 'submitted') {
        showToast('⚠️ ไม่สามารถส่งคืนได้ — คำขอผ่านการตรวจสอบเจ้าหน้าที่แล้ว กรุณาติดต่อผู้ประสานงานวิจัย');
        return;
      }
    } else if (currentRole === 'dept_secretary') {
      const isSameDept = isSameDepartment(currentUser?.department, app.department);
      const isMine =
        (currentUser?.email && app.email && app.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (currentUser?.name && app.applicantName && app.applicantName.toLowerCase() === currentUser.name.toLowerCase());
      if (!isSameDept && !isMine) {
        showToast('⚠️ เลขาภาควิชาสามารถส่งคืนเพื่อแก้ไขได้เฉพาะคำขอในภาควิชาที่สังกัดเท่านั้น');
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const updatedTimeline = (app.timeline || []).map((step, idx) => {
      if (idx === 0) {
        return {
          ...step,
          status: 'in_progress' as const,
          note: `ส่งคืนไปยังรายการเตรียมเบิกเพื่อแก้ไข (${today} โดย ${currentUser?.name || 'ผู้ใช้งาน'})`,
        };
      }
      return {
        ...step,
        status: 'pending' as const,
        completedAt: undefined,
      };
    });

    const returnedApp: ResearchApplication = {
      ...app,
      status: 'draft',
      currentStep: 1,
      updatedAt: today,
      timeline: updatedTimeline,
    };

    setApplications((prev) => prev.map((a) => (a.id === app.id ? returnedApp : a)));

    logActivity(
      'RETURN_TO_DRAFT',
      'REWARD_APPLICATION',
      app.trackingNo,
      `ส่งคืนคำขอ "${app.articleTitle}" กลับไปแก้ไขในรายการเตรียมเบิก`
    );

    // Sync status change to D1
    updateRewardApplicationInD1(app.id, {
      status: 'draft',
      currentStep: 1,
      updatedAt: today,
      timeline: updatedTimeline,
    }).catch((e) => console.warn('D1 return to draft error:', e));

    showToast(`↩️ ส่งคืนคำขอ ${app.trackingNo} ย้อนกลับไปไว้ใน "รายการเตรียมเบิก" เพื่อแก้ไขเรียบร้อยแล้ว`);

    if (timelineApp && timelineApp.id === app.id) {
      setTimelineApp(null);
    }
  };

  const handleSubmitDraft = (draftApp: ResearchApplication) => {
    const today = new Date().toISOString().split('T')[0];
    // Convert DRAFT tracking number to official sequential tracking number
    const targetTrackingNo =
      draftApp.trackingNo && !draftApp.trackingNo.startsWith('DRAFT')
        ? draftApp.trackingNo
        : generateNextTrackingNo(
            draftApp.fiscalYear,
            applications.map((a) => a.trackingNo)
          );

    const submittedApp: ResearchApplication = {
      ...draftApp,
      trackingNo: targetTrackingNo,
      status: 'submitted',
      currentStep: 2,
      updatedAt: today,
      timeline: draftApp.timeline.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
        completedAt: idx === 0 ? today : undefined,
      })),
    };

    setApplications((prev) =>
      prev.map((a) => (a.id === draftApp.id ? submittedApp : a))
    );

    logActivity(
      'SUBMIT_APPLICATION',
      'REWARD_APPLICATION',
      submittedApp.trackingNo,
      `ส่งเบิกคำขอจากร่าง: "${submittedApp.articleTitle}" ของ ${submittedApp.applicantName} ยอดรวม ${submittedApp.totalClaimedAmount.toLocaleString()} บาท`
    );

    triggerLineMilestoneNotification(submittedApp, 'application_submitted');
    updateRewardApplicationInD1(submittedApp.id, submittedApp)
      .catch(() => createRewardApplicationInD1(submittedApp))
      .then(() => {
        showToast(`🚀 ส่งเบิกคำขอสำเร็จ! รหัสติดตามงาน: ${submittedApp.trackingNo}`);
      })
      .catch((err) => {
        console.warn('D1 sync draft submit:', err);
        showToast(`🚀 ส่งเบิกคำขอสำเร็จในระบบท้องถิ่น (${submittedApp.trackingNo})`);
      });
  };

  const handleSubmitSelectedDrafts = (draftApps: ResearchApplication[]) => {
    if (draftApps.length === 0) return;
    const today = new Date().toISOString().split('T')[0];
    let currentTrackingList = applications.map((a) => a.trackingNo);

    const updatedDrafts: ResearchApplication[] = [];
    draftApps.forEach((draft) => {
      const nextTrackingNo =
        draft.trackingNo && !draft.trackingNo.startsWith('DRAFT')
          ? draft.trackingNo
          : generateNextTrackingNo(draft.fiscalYear, currentTrackingList);
      if (!currentTrackingList.includes(nextTrackingNo)) {
        currentTrackingList.push(nextTrackingNo);
      }

      const submitted: ResearchApplication = {
        ...draft,
        trackingNo: nextTrackingNo,
        status: 'submitted',
        currentStep: 2,
        updatedAt: today,
        timeline: draft.timeline.map((s, idx) => ({
          ...s,
          status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
          completedAt: idx === 0 ? today : undefined,
        })),
      };
      updatedDrafts.push(submitted);
      updateRewardApplicationInD1(submitted.id, submitted)
        .catch(() => createRewardApplicationInD1(submitted))
        .catch((e) => console.warn('D1 batch submit error:', e));
    });

    const updatedMap = new Map(updatedDrafts.map((d) => [d.id, d]));
    setApplications((prev) => prev.map((a) => updatedMap.get(a.id) || a));

    logActivity(
      'SUBMIT_APPLICATION',
      'REWARD_APPLICATION',
      updatedDrafts.map((d) => d.trackingNo).join(', '),
      `ส่งเบิกคำขอแบบกลุ่ม จำนวน ${draftApps.length} รายการ`
    );

    showToast(`🚀 ส่งเบิกคำขอที่เลือกเรียบร้อยแล้วทั้งหมด ${draftApps.length} รายการ!`);
  };

  // Soft Delete: ย้ายร่างคำขอไปไว้ในถังขยะ (สามารถกู้คืนได้)
  const handleSoftDeleteDraft = (id: string) => {
    const targetApp = applications.find((a) => a.id === id);
    const today = new Date().toISOString();
    const deletedBy = currentUser?.name || 'ผู้ใช้งาน';
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: 'trash',
          deletedAt: today,
          deletedBy,
          coordinatorNotes: `ย้ายไปถังขยะเมื่อ ${today.split('T')[0]} โดย ${deletedBy}`,
          updatedAt: today.split('T')[0],
        };
      })
    );
    updateRewardApplicationInD1(id, {
      status: 'trash',
      coordinatorNotes: `ย้ายไปถังขยะเมื่อ ${today.split('T')[0]} โดย ${deletedBy}`,
    }).catch((e) => console.warn('D1 soft delete error:', e));

    logActivity(
      'TRASH_APPLICATION',
      'REWARD_APPLICATION',
      targetApp?.trackingNo || id,
      `ย้ายร่างคำขอไปถังขยะ: "${targetApp?.articleTitle || '-'}" ของ ${targetApp?.applicantName || '-'}`
    );

    showToast('🗑️ ย้ายร่างคำขอไปไว้ในถังขยะเรียบร้อยแล้ว (สามารถกู้คืนได้)');
  };

  // Restore: กู้คืนร่างคำขอกลับสู่รายการเตรียมเบิก
  const handleRestoreDraft = (id: string) => {
    const targetApp = applications.find((a) => a.id === id);
    const today = new Date().toISOString();
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          status: 'draft',
          deletedAt: undefined,
          deletedBy: undefined,
          coordinatorNotes: undefined,
          updatedAt: today.split('T')[0],
        };
      })
    );
    updateRewardApplicationInD1(id, {
      status: 'draft',
      coordinatorNotes: '',
    }).catch((e) => console.warn('D1 restore draft error:', e));

    logActivity(
      'RESTORE_APPLICATION',
      'REWARD_APPLICATION',
      targetApp?.trackingNo || id,
      `กู้คืนร่างคำขอจากถังขยะ: "${targetApp?.articleTitle || '-'}"`
    );

    showToast('✨ กู้คืนรายการร่างสำเร็จ กลับสู่รายการเตรียมเบิกแล้ว');
  };

  // Permanent Delete: ลบถาวรออกจากระบบและฐานข้อมูล Cloudflare D1
  const handlePermanentDeleteDraft = (id: string) => {
    const targetApp = applications.find((a) => a.id === id);
    setApplications((prev) => prev.filter((a) => a.id !== id));
    deleteRewardApplicationInD1(id).catch((e) => console.warn('D1 permanent delete error:', e));
    showToast('🗑️ ลบรายการร่างออกจากระบบถาวรเรียบร้อยแล้ว');
    recordAuditLog({
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'ผู้ดูแลระบบ',
      userRole: currentRole,
      action: 'DELETE_APPLICATION',
      targetType: 'REWARD_APPLICATION',
      targetId: targetApp?.trackingNo || id,
      details: `ลบคำขอถาวร: ${targetApp?.trackingNo || id} บทความ: "${targetApp?.articleTitle || '-'}" ของ ${targetApp?.applicantName || '-'}`
    }).catch(() => {});
  };

  const handleCarryOverDraft = (id: string, targetFiscalYear: number) => {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          fiscalYear: targetFiscalYear,
          isCarryOverToNextYear: true,
          plannedFiscalYear: targetFiscalYear,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
    updateRewardApplicationInD1(id, { fiscalYear: targetFiscalYear }).catch((e) => console.warn('D1 carry over sync error:', e));
    showToast(`🗓️ เลื่อนรายการไปเตรียมเบิกในปีงบประมาณ ${targetFiscalYear} เรียบร้อยแล้ว`);
  };

  // Undo Carry-Over: ส่งคืน draft ที่เลื่อนปีกลับมาปีงบประมาณที่ระบุ (currentFiscalYear)
  const handleUndoCarryOver = (id: string, currentFiscalYear: number) => {
    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return {
          ...a,
          fiscalYear: currentFiscalYear,
          isCarryOverToNextYear: false,
          plannedFiscalYear: currentFiscalYear,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
    updateRewardApplicationInD1(id, { fiscalYear: currentFiscalYear }).catch((e) => console.warn('D1 undo carry over sync error:', e));
    showToast(`↩️ ย้ายรายการกลับมาเตรียมเบิกในปีงบประมาณ ${currentFiscalYear} เรียบร้อยแล้ว`);
  };

  // 2. Drag-and-Drop / Kanban status update (supports 1-step forward & 1-step backward)
  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus, nextStep: WorkflowStepId) => {
    const target = applications.find(a => a.id === id);
    const prev19Step = normalizeWorkflowStep(target?.currentStep || 1);
    const prevActionStep = getActionStepFrom19(prev19Step);
    const nextActionStep = getActionStepFrom19(nextStep);
    const isRevert = target ? nextStep < prev19Step : false;
    const todayIso = new Date().toISOString().split('T')[0];
    const todayThai = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const isNowPaid = newStatus === 'paid';
    const wasPaid = Boolean(target && (target.status === 'paid' || target.paymentStatus === 'transferred'));
    const nextPaymentStatus = isNowPaid ? 'transferred' : (wasPaid ? 'unpaid' : target?.paymentStatus);
    const nextPaymentDate = isNowPaid
      ? (target?.paymentDate || todayThai)
      : (wasPaid ? '' : target?.paymentDate);
    const nextVoucherNo = isNowPaid
      ? (target?.disbursementVoucherNo || `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70`)
      : target?.disbursementVoucherNo;
    const nextTimeline = target ? rebuildTimelineForStep(target.timeline, nextStep) : undefined;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const appWasPaid = app.status === 'paid' || app.paymentStatus === 'transferred';
        return {
          ...app,
          status: newStatus,
          currentStep: nextStep,
          paymentStatus: isNowPaid ? 'transferred' : (appWasPaid ? 'unpaid' : app.paymentStatus),
          paymentDate: isNowPaid
            ? (app.paymentDate || todayThai)
            : (appWasPaid ? '' : app.paymentDate),
          disbursementVoucherNo: isNowPaid
            ? (app.disbursementVoucherNo || nextVoucherNo)
            : app.disbursementVoucherNo,
          timeline: rebuildTimelineForStep(app.timeline, nextStep),
          updatedAt: todayIso,
        };
      })
    );

    showToast(
      isRevert
        ? `↩️ ย้อนกลับขั้นตอนสำเร็จ → ขั้นตอนที่ ${nextActionStep}/12 (อ้างอิงขั้น ${nextStep}/19)`
        : `อัปเดตสถานะสำเร็จ → ขั้นตอนที่ ${nextActionStep}/12 (อ้างอิงขั้น ${nextStep}/19)`
    );

    logActivity(
      isRevert ? 'REVERT_STEP' : 'UPDATE_STATUS',
      'REWARD_APPLICATION',
      target?.trackingNo || id,
      isRevert
        ? `ย้อนกลับขั้นตอนผ่าน Kanban จากขั้นที่ ${prevActionStep}/12 → ${nextActionStep}/12 (อ้างอิง ${nextStep}/19, สถานะ: ${newStatus}) บทความ: "${target?.articleTitle || '-'}"`
        : `เปลี่ยนสถานะผ่าน Kanban เป็น "${newStatus}" (ขั้นที่ ${nextActionStep}/12, อ้างอิง ${nextStep}/19) บทความ: "${target?.articleTitle || '-'}"`
    );

    // Cloudflare D1 sync for status update
    updateRewardApplicationInD1(id, {
      status: newStatus,
      currentStep: nextStep,
      paymentStatus: nextPaymentStatus,
      paymentDate: nextPaymentDate,
      disbursementVoucherNo: nextVoucherNo,
      timeline: nextTimeline,
    }).catch((e) => {
      console.warn('D1 update status error:', e);
      showToast(`⚠️ อัปเดตสถานะในหน้าจอแล้ว แต่ซิงก์เข้า Cloudflare D1 ไม่สำเร็จ: ${e.message}`);
    });

    // Automatic LINE Trigger on forward milestone status changes only (do NOT notify on revert)
    if (target && !isRevert) {
      if (newStatus === 'paid') {
        triggerLineMilestoneNotification({ 
          ...target, 
          status: 'paid', 
          currentStep: nextStep, 
          disbursementVoucherNo: nextVoucherNo || 'ฎีกา 3606/70'
        }, 'payment_transferred');
      } else if (newStatus === 'staff_verified') {
        triggerLineMilestoneNotification({ ...target, status: newStatus, currentStep: nextStep }, 'document_verified');
      } else if (newStatus === 'dean_approved') {
        triggerLineMilestoneNotification({ ...target, status: newStatus, currentStep: nextStep }, 'dean_approved');
      }
    }
  };

  // 3. Save edited row in Table view (with full status/step/payment sync & D1 confirmation)
  const handleSaveTableRow = async (updatedApp: ResearchApplication): Promise<boolean> => {
    const original = applications.find((a) => a.id === updatedApp.id);
    let cleanApp: ResearchApplication = { ...updatedApp };

    if (cleanApp.quartile === 'TCI_2' && cleanApp.database !== 'TCI Tier 2') {
      cleanApp.database = 'TCI Tier 2';
      cleanApp.databaseName = 'TCI Tier 2';
    } else if (cleanApp.quartile === 'TCI_1' && cleanApp.database !== 'TCI Tier 1') {
      cleanApp.database = 'TCI Tier 1';
      cleanApp.databaseName = 'TCI Tier 1';
    } else if (cleanApp.database && !cleanApp.databaseName) {
      cleanApp.databaseName = cleanApp.database;
    }

    const rewardAmt = Math.max(0, Number(cleanApp.claimedRewardAmount ?? 0) || 0);
    const pageChargeAmt = Math.max(0, Number(cleanApp.approvedPageChargeAmount ?? 0) || 0);
    cleanApp.claimedRewardAmount = rewardAmt;
    cleanApp.approvedPageChargeAmount = pageChargeAmt;
    cleanApp.totalClaimedAmount = rewardAmt + pageChargeAmt;

    if (original) {
      cleanApp = syncWorkflowFieldsForStatus(original, cleanApp);
    }

    // Optimistic UI update
    setApplications((prev) =>
      prev.map((a) => (a.id === cleanApp.id ? cleanApp : a))
    );

    try {
      await updateRewardApplicationInD1(cleanApp.id, cleanApp);
      showToast(`✅ บันทึกการแก้ไข ${cleanApp.trackingNo} ลงฐานข้อมูล D1 สำเร็จ`);
      logActivity(
        'UPDATE_APPLICATION',
        'REWARD_APPLICATION',
        cleanApp.trackingNo,
        `แก้ไขข้อมูลคำขอในตาราง: "${cleanApp.articleTitle}" ของ ${cleanApp.applicantName} สถานะ ${cleanApp.status} (ขั้น ${getActionStepFrom19(cleanApp.currentStep)}/12) ยอดรวม ${cleanApp.totalClaimedAmount.toLocaleString()} บาท`
      );
      return true;
    } catch (e: any) {
      console.error('D1 update row error:', e);
      // Rollback optimistic update so UI reflects actual persisted DB state
      if (original) {
        setApplications((prev) =>
          prev.map((a) => (a.id === original.id ? original : a))
        );
      }
      showToast(`⚠️ บันทึกการแก้ไข ${cleanApp.trackingNo} ลงฐานข้อมูล D1 ไม่สำเร็จ: ${e?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'}`);
      return false;
    }
  };

  // 3.1 Update Document Numbering & Online Review Details
  const handleUpdateDocDetails = (appId: string, updates: Partial<ResearchApplication>) => {
    // 1. Persist to localStorage cache
    try {
      const existingCache = localStorage.getItem(`iram_doc_details_${appId}`);
      const prevParsed = existingCache ? JSON.parse(existingCache) : {};
      localStorage.setItem(`iram_doc_details_${appId}`, JSON.stringify({ ...prevParsed, ...updates }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        const updated = {
          ...app,
          ...updates,
          updatedAt: new Date().toISOString().split('T')[0],
        };
        if (printApp && printApp.id === appId) {
          setPrintApp(updated);
        }
        return updated;
      })
    );

    updateRewardApplicationInD1(appId, updates).catch(e => console.warn('D1 update doc details error:', e));
    const docTarget = applications.find(a => a.id === appId);
    logActivity(
      'UPDATE_DOC_DETAILS',
      'REWARD_APPLICATION',
      docTarget?.trackingNo || appId,
      `บันทึกข้อมูลเลขที่หนังสือราชการ/ตรวจออนไลน์: ${JSON.stringify(updates).slice(0, 200)}`
    );
    showToast('บันทึกข้อมูลเลขที่หนังสือราชการและวันที่เรียบร้อย');
  };

  // 4. Advance or Revert timeline step by 1 action step
  const handleAdvanceTimelineStep = (id: string, nextStep: WorkflowStepId, note?: string) => {
    const target = applications.find(a => a.id === id);
    const prev19Step = normalizeWorkflowStep(target?.currentStep || 1);
    const prevActionStep = getActionStepFrom19(prev19Step);
    const actionStepNum = getActionStepFrom19(nextStep);
    const isRevert = target ? nextStep < prev19Step : false;
    const todayIso = new Date().toISOString().split('T')[0];
    const todayThai = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
    const isNowPaid = nextStep >= 18;
    const wasPaid = Boolean(target && (target.status === 'paid' || target.paymentStatus === 'transferred'));
    const nextPaymentStatus = isNowPaid ? 'transferred' : (wasPaid ? 'unpaid' : target?.paymentStatus);
    const nextPaymentDate = isNowPaid
      ? (target?.paymentDate || todayThai)
      : (wasPaid ? '' : target?.paymentDate);
    const nextVoucherNo = isNowPaid
      ? (target?.disbursementVoucherNo || `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70`)
      : target?.disbursementVoucherNo;
    const updatedTimelineForD1 = target ? rebuildTimelineForStep(target.timeline, nextStep, note) : undefined;

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const newStatus = getStatusFor19Step(nextStep, app.status);
        const updatedTimeline = rebuildTimelineForStep(app.timeline, nextStep, note);
        const appWasPaid = app.status === 'paid' || app.paymentStatus === 'transferred';

        return {
          ...app,
          currentStep: nextStep,
          status: newStatus,
          paymentStatus: isNowPaid ? 'transferred' : (appWasPaid ? 'unpaid' : app.paymentStatus),
          paymentDate: isNowPaid
            ? (app.paymentDate || todayThai)
            : (appWasPaid ? '' : app.paymentDate),
          disbursementVoucherNo: isNowPaid
            ? (app.disbursementVoucherNo || nextVoucherNo)
            : app.disbursementVoucherNo,
          updatedAt: todayIso,
          timeline: updatedTimeline,
        };
      })
    );

    // Cloudflare D1 sync
    if (target) {
      const calcStatus = getStatusFor19Step(nextStep, target.status);

      updateRewardApplicationInD1(id, {
        currentStep: nextStep,
        status: calcStatus,
        paymentStatus: nextPaymentStatus,
        paymentDate: nextPaymentDate,
        disbursementVoucherNo: nextVoucherNo,
        coordinatorNotes: note,
        timeline: updatedTimelineForD1,
      }).catch((e) => {
        console.warn('D1 advance/revert step error:', e);
        showToast(`⚠️ ปรับขั้นตอนในหน้าจอแล้ว แต่ซิงก์เข้า Cloudflare D1 ไม่สำเร็จ: ${e.message}`);
      });

      logActivity(
        isRevert ? 'REVERT_STEP' : 'ADVANCE_STEP',
        'REWARD_APPLICATION',
        target.trackingNo || id,
        isRevert
          ? `ย้อนกลับขั้นตอนจากขั้นที่ ${prevActionStep}/12 → ${actionStepNum}/12 (อ้างอิง ${nextStep}/19, สถานะ: ${calcStatus})${note ? ` หมายเหตุ: ${note}` : ''}`
          : `เลื่อนขั้นตอนเป็นขั้นที่ ${actionStepNum}/12 (อ้างอิง ${nextStep}/19, สถานะ: ${calcStatus})${note ? ` หมายเหตุ: ${note}` : ''}`
      );
    }

    // Automatic LINE Notification Triggers for Forward Milestones 2, 3, 4 ONLY (skip when reverting)
    if (target && !isRevert) {
      if (nextStep === 4) {
        triggerLineMilestoneNotification({ ...target, currentStep: nextStep }, 'document_verified');
      } else if (nextStep === 11 || nextStep === 12) {
        triggerLineMilestoneNotification({ ...target, currentStep: nextStep }, 'dean_approved');
      } else if (nextStep >= 18) {
        triggerLineMilestoneNotification({ 
          ...target, 
          currentStep: nextStep, 
          status: 'paid',
          disbursementVoucherNo: nextVoucherNo || `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70`,
          paymentDate: todayThai
        }, 'payment_transferred');
      }
    }

    showToast(
      isRevert
        ? `↩️ ย้อนกลับขั้นตอนสำเร็จ → ขั้นตอนที่ ${actionStepNum}/12 (อ้างอิงขั้น ${nextStep}/19)`
        : `เลื่อนขั้นตอนสำเร็จ → ขั้นตอนที่ ${actionStepNum}/12 (อ้างอิงขั้น ${nextStep}/19)`
    );
  };

  // 5. Send LINE Notification Trigger
  const handleSendLineNotification = (trackingNo: string, message: string) => {
    if (IS_NOTIFICATION_SYSTEM_SUSPENDED || !LINE_NOTIFICATION_SYSTEM_ENABLED) {
      showToast('ระบบแจ้งเตือน LINE OA / Email อยู่ระหว่างการระงับการใช้งานชั่วคราวตามนโยบาย');
      return;
    }
    showToast(`LINE OA [${LINE_BOT_CONFIG.botBasicId}]: ส่งแจ้งเตือนสำหรับ [${trackingNo}] สำเร็จ!`);
  };

  // Data isolation for researcher: strictly restrict to own applications 100%
  const isAppOwnedByUser = (app: ResearchApplication) => {
    if (!currentUser) return false;
    const userEmail = currentUser.email?.trim().toLowerCase();
    const applicationEmail = app.email?.trim().toLowerCase();
    return Boolean(userEmail && applicationEmail && applicationEmail === userEmail);
  };

  const roleScopedApplications = applications.filter((app) => {
    if (isGuest) return false;
    if (currentRole === 'researcher') {
      return isAppOwnedByUser(app);
    }
    if (currentRole === 'dept_secretary') {
      return isSameDepartment(currentUser?.department, app.department) || isAppOwnedByUser(app);
    }
    return true;
  });

  // Global search filtering
  const displayApplications = roleScopedApplications.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      app.trackingNo.toLowerCase().includes(q) ||
      app.applicantName.toLowerCase().includes(q) ||
      app.articleTitle.toLowerCase().includes(q) ||
      app.journalName.toLowerCase().includes(q) ||
      app.department.toLowerCase().includes(q)
    );
  });

  // Count drafts for current researcher / dept_secretary / staff
  const myDraftsCount = applications.filter((app) => {
    if (app.status !== 'draft') return false;
    if (isGuest) return false;
    if (currentRole === 'researcher') {
      return isAppOwnedByUser(app);
    }
    if (currentRole === 'dept_secretary') {
      return isSameDepartment(currentUser?.department, app.department) || isAppOwnedByUser(app);
    }
    return true;
  }).length;

  // Admin right-side docked menu expanded state
  const [isAdminMenuExpanded, setIsAdminMenuExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('iram_admin_menu_expanded');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // Default to expanded: "แสดงรายการเมนู แบบขยาย"
  });

  const handleToggleAdminMenu = () => {
    setIsAdminMenuExpanded(prev => {
      const next = !prev;
      try {
        localStorage.setItem('iram_admin_menu_expanded', String(next));
      } catch (e) {}
      return next;
    });
  };

  // Measure header height dynamically to ensure sticky right-side admin menu is NEVER covered by sticky header
  const [headerHeight, setHeaderHeight] = useState<number>(114);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    const headerEl = document.querySelector('header');
    let observer: ResizeObserver | null = null;
    if (headerEl && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(headerEl);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      if (observer) observer.disconnect();
    };
  }, [currentRole, isAdminMenuExpanded]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Admin / Dept Secretary Impersonation Active Banner */}
      {impersonatorAdmin && (
        <aside aria-label="โหมดปฏิบัติหน้าที่แทน" className="bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 border-b-2 border-purple-400 text-white px-4 py-2.5 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-sm text-xs">
              🎭
            </span>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-bold text-amber-300 font-prompt">โหมดปฏิบัติหน้าที่แทน (Impersonation Mode):</span>
              <span className="font-bold text-white underline underline-offset-2">{currentUser?.name}</span>
              <span className="text-purple-200 font-mono text-[11px]">({currentUser?.email})</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] bg-purple-800 text-purple-200 border border-purple-500 font-semibold">
                ID: {currentUser?.id} | สิทธิ์: {currentUser?.role}
              </span>
              <span className="text-[11px] text-purple-300 hidden md:inline">
                (ดำเนินการโดย: {impersonatorAdmin.name})
              </span>
            </div>
          </div>
          <button
            onClick={handleExitImpersonation}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all shrink-0 cursor-pointer font-prompt active:scale-95"
            title="คลิกเพื่อสลับกลับสู่บัญชีผู้ดำเนินการเดิมของคุณทันที"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>สลับกลับสู่บัญชีเดิม ({impersonatorAdmin.role === 'dept_secretary' ? 'เลขาภาควิชา' : 'ผู้ดูแลระบบ'})</span>
          </button>
        </aside>
      )}

      {/* Universal Header */}
      <Header
        currentRole={currentRole}
        setCurrentRole={handleRoleChange}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenNewSubmission={handleOpenNewSubmission}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        draftsCount={myDraftsCount}
        currentUser={currentUser}
        onOpenProfile={() => {
          if (!currentUser) {
            setIsLoginModalOpen(true);
          } else {
            setIsProfileModalOpen(true);
          }
        }}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isAdminMenuExpanded={isAdminMenuExpanded}
        onToggleAdminMenu={handleToggleAdminMenu}
        onOpenActivationModal={() => setIsActivationModalOpen(true)}
      />

      {/* Main Workspace Canvas (ขยายเต็มจออัตโนมัติเมื่อย่อ/ยุบเมนู) */}
      <main className="flex-1 w-full max-w-[1600px] xl:max-w-[1760px] 2xl:max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full transition-all duration-300">

            {/* Pending Researcher Verification Banner */}
            {currentUser?.isPendingProfile && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0 shadow-sm">
                    <Bell className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm font-prompt text-amber-950">
                      กรอกข้อมูลส่วนบุคคลให้ครบถ้วน / เปิดสิทธิ์ยื่นคำขอค่า page charge / เงินรางวัล
                    </h4>
                    <p className="text-xs text-amber-900/80 mt-0.5">
                      โปรดยืนยันสังกัดภาควิชาและข้อมูลติดต่อเพื่อเปิดสิทธิ์นักวิจัยในการสร้างคำขอและบันทึกร่าง
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => setIsActivationModalOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all font-prompt cursor-pointer"
                  >
                    เปิดใช้งานสิทธิ์นักวิจัย
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 border border-amber-300 text-amber-900 hover:bg-amber-100/60 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    ยกเลิก (ออกจากระบบ)
                  </button>
                </div>
              </div>
            )}
            
            {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <DashboardView
            applications={isGuest ? [] : displayApplications}
            statisticsApplications={isGuest ? [] : roleScopedApplications}
            publicSummary={publicRewardSummary}
            isLoadingPublicSummary={isLoadingPublicSummary}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            onOpenNewSubmission={handleOpenNewSubmission}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            currentRole={currentRole}
            nuDisbursements={nuDisbursements}
            onUpdateNuRecord={handleUpdateNuRecord}
            onImportNuRecords={handleImportNuRecords}
          />
        )}

        {/* Tab 1.5: Quota & 24-Month Expiry Planner View (Researcher, Dept Secretary, Coordinator & Admin ONLY — ไม่แสดงสำหรับ finance, executive) */}
        {activeTab === 'quota_planner' && !isGuest && currentRole !== 'finance' && currentRole !== 'executive' && (
          <QuotaPlannerView
            applications={applications}
            nuDisbursements={nuDisbursements}
            currentUser={currentUser}
            currentRole={currentRole}
            onOpenNewSubmission={handleOpenNewSubmission}
            onEditDraft={handleEditDraft}
            onSubmitDraft={handleSubmitDraft}
            onSubmitSelectedDrafts={handleSubmitSelectedDrafts}
            onDeleteDraft={handleSoftDeleteDraft}
            onRestoreDraft={handleRestoreDraft}
            onPermanentDeleteDraft={handlePermanentDeleteDraft}
            onCarryOverDraft={handleCarryOverDraft}
            onUndoCarryOver={handleUndoCarryOver}
          />
        )}

        {/* Tab 2: Interactive Drag-and-Drop Kanban Board (Coordinator, Finance, and Admin) */}
        {activeTab === 'kanban' && (currentRole === 'coordinator' || currentRole === 'finance' || currentRole === 'admin') && !isGuest && (
          <KanbanBoard
            applications={displayApplications}
            onUpdateStatus={handleUpdateStatus}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            onReturnToDraft={handleReturnToDraft}
            currentRole={currentRole}
            onShowAlert={showToast}
          />
        )}

        {/* Tab: Unified Article Master Table (All Roles) */}
        {activeTab === 'article_table' && !isGuest && (
          <ArticleMasterTable
            nuDisbursements={nuDisbursements}
            applications={applications}
            currentUser={currentUser}
            currentRole={currentRole}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onOpenNewSubmission={handleOpenNewSubmission}
            onUpdateNuRecord={handleUpdateNuRecord}
            onUpdateFacultyApp={handleSaveTableRow}
          />
        )}

        {/* Tab 3: Editable Table Grid for Personal / Department / Faculty Work */}
        {activeTab === 'table' && !isGuest && (
          <TableView
            applications={displayApplications}
            onSaveRow={handleSaveTableRow}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            onReturnToDraft={handleReturnToDraft}
            currentUserEmail={currentUser?.email || ''}
            currentUserName={currentUser?.name || ''}
            currentUserDept={currentUser?.department || ''}
            currentRole={currentRole}
          />
        )}

        {/* Tab 4: Google Calendar View */}
        {activeTab === 'calendar' && !isGuest && (
          <CalendarView applications={roleScopedApplications} />
        )}

        {/* Tab 5: LINE OA Notification Center (แสดงเฉพาะเมื่อเปิดใช้งานระบบ) */}
        {activeTab === 'line_oa' && LINE_NOTIFICATION_SYSTEM_ENABLED && (currentRole === 'coordinator' || currentRole === 'admin') && !isGuest && (
          <LineNotificationModal
            applications={applications}
            onSendNotification={handleSendLineNotification}
            notifications={lineNotifications}
            onTriggerMilestone={triggerLineMilestoneNotification}
          />
        )}
        {activeTab === 'line_oa' && !LINE_NOTIFICATION_SYSTEM_ENABLED && !isGuest && (
          <div className="bg-white rounded-2xl p-8 border border-amber-200 text-center max-w-lg mx-auto my-12 shadow-lg animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">⏸️</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 font-prompt mb-1.5">
              ระบบแจ้งเตือน LINE OA / Email ระงับการใช้งานชั่วคราว
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              ระบบแจ้งเตือนอัตโนมัติผ่าน LINE OA และ Email อยู่ระหว่างการระงับการใช้งานชั่วคราวตามนโยบาย ยังไม่เปิดให้บริการในขณะนี้
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
            >
              กลับสู่หน้าแดชบอร์ด
            </button>
          </div>
        )}

        {/* Tab 6: Admin & Department Secretary User Management Console */}
        {activeTab === 'user_management' && (currentRole === 'admin' || currentRole === 'dept_secretary') && !isGuest ? (
          <UserManagementView
            users={registeredUsers}
            currentLoggedInUser={currentUser || DEFAULT_LOGGED_IN_USER}
            currentRole={currentRole}
            onUpdateUser={handleUpdateRegisteredUser}
            onCreateUser={handleCreateRegisteredUser}
            onDeleteUser={handleDeleteRegisteredUser}
            onSwitchUser={handleSwitchUserFromConsole}
            onShowAlert={showToast}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        ) : activeTab === 'user_management' ? (
          <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center max-w-lg mx-auto my-12 shadow-lg animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-prompt">
              สิทธิ์การเข้าถึงไม่เพียงพอ (Access Denied)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              หน้าจอนี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) และเลขาภาควิชา (Department Secretary) เท่านั้น
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              กลับสู่หน้าหลัก (Dashboard)
            </button>
          </div>
        ) : null}

        {/* Tab 7: Admin Audit Log Console */}
        {activeTab === 'audit_logs' && currentRole === 'admin' && !isGuest ? (
          <AuditLogView
            currentUser={currentUser || DEFAULT_LOGGED_IN_USER}
            onShowAlert={showToast}
          />
        ) : activeTab === 'audit_logs' ? (
          <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center max-w-lg mx-auto my-12 shadow-lg animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-prompt">
              สิทธิ์การเข้าถึงไม่เพียงพอ (Access Denied)
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-prompt">
              หน้าจอนี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin Console) เท่านั้น
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors font-prompt"
            >
              กลับสู่หน้าหลัก (Dashboard)
            </button>
          </div>
        ) : null}

        {/* About Tab */}
        {activeTab === 'about' && (
          <AboutView
            onBackToDashboard={() => setActiveTab('dashboard')}
            onNavigate={handleTabChange}
            isGuest={isGuest}
          />
        )}

        {/* User Guide Tab */}
        {activeTab === 'user_guide' && (
          <UserGuideView
            onBackToDashboard={() => setActiveTab('dashboard')}
            onOpenNewSubmission={handleOpenNewSubmission}
            isAdmin={!isGuest && currentRole === 'admin'}
          />
        )}

          </div>

          {/* Right-Side Admin Menu (Docked side-by-side, NOT a floating modal) */}
          {currentRole === 'admin' && isAdminMenuExpanded && !isGuest && (
            <aside 
              className="w-72 xl:w-80 shrink-0 sticky top-[138px] self-start animate-in fade-in slide-in-from-right-3 duration-150 z-30"
              style={{
                top: `${headerHeight + 24}px`,
                maxHeight: `calc(100vh - ${headerHeight + 36}px)`,
              }}
            >
              <AdminRightSideMenu
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                draftsCount={myDraftsCount}
                currentUser={currentUser}
                onCollapse={handleToggleAdminMenu}
              />
            </aside>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">งานวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</span>
            <span>•</span>
            <span>หน่วยถ่ายทอดเทคโนโลยี (โทร. 0-5596-5761)</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Submission Form Modal */}
      {isSubmissionModalOpen && (
        <SubmissionFormModal
          isOpen={isSubmissionModalOpen}
          onClose={() => {
            setIsSubmissionModalOpen(false);
            setEditingDraftApp(null);
          }}
          onSubmit={handleCreateSubmission}
          existingApplications={applications}
          nuDisbursements={nuDisbursements}
          currentUser={currentUser || DEFAULT_LOGGED_IN_USER}
          currentRole={currentRole}
          registeredUsers={registeredUsers}
          initialData={editingDraftApp}
        />
      )}

      {/* MODAL 2: 19-Step SLA Timeline Tracker Modal */}
      <TimelineTrackerModal
        isOpen={!!timelineApp}
        application={timelineApp ? (applications.find((a) => a.id === timelineApp.id) || timelineApp) : null}
        onClose={() => setTimelineApp(null)}
        onAdvanceStep={handleAdvanceTimelineStep}
        onPrint={(app) => setPrintApp(app)}
        onVerifyPayment={(app) => setPaymentApp(app)}
        onReturnToDraft={handleReturnToDraft}
        canEdit={currentRole === 'coordinator' || currentRole === 'finance' || currentRole === 'admin' || currentRole === 'dept_secretary' || currentRole === 'executive'}
        currentRole={currentRole}
        currentUser={currentUser}
      />

      {/* MODAL 3: Official Printable Documents (AWP69 / Memo / Receipt) */}
      <OfficialPrintModal
        isOpen={!!printApp}
        application={printApp}
        currentUser={currentUser || DEFAULT_LOGGED_IN_USER}
        currentRole={currentRole}
        onClose={() => setPrintApp(null)}
        onSaveDocDetails={handleUpdateDocDetails}
      />

      {/* MODAL 4: Payment Verification & Transfer Slip Modal */}
      <PaymentVerificationModal
        isOpen={!!paymentApp}
        application={paymentApp}
        onClose={() => setPaymentApp(null)}
        onPrintSlip={() => {
          if (paymentApp) {
            setPrintApp(paymentApp);
          }
        }}
      />

      {/* MODAL 5: User Profile & PDPA Settings Modal */}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal
          currentUser={currentUser}
          users={registeredUsers}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleSaveProfile}
          onSwitchUser={handleSwitchUser}
          impersonatorAdmin={impersonatorAdmin}
          onExitImpersonation={handleExitImpersonation}
        />
      )}

      {/* MODAL 6: NU Account Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* MODAL 7: Researcher Activation Modal (Pending Approval / Self-Service Role) */}
      {isActivationModalOpen && currentUser && (
        <ResearcherActivationModal
          isOpen={isActivationModalOpen}
          currentUser={currentUser}
          onActivate={handleActivateResearcher}
          onLogout={handleLogout}
        />
      )}

    </div>
  );
}
