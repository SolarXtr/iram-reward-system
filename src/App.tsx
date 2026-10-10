import React, { useState, useEffect } from 'react';
import { Header, UserRole, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { QuotaPlannerView } from './components/QuotaPlannerView';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { ArticleMasterTable } from './components/ArticleMasterTable';
import { CalendarView } from './components/CalendarView';
import { LineNotificationModal } from './components/LineNotificationModal';
import { SubmissionFormModal } from './components/SubmissionFormModal';
import { TimelineTrackerModal } from './components/TimelineTrackerModal';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { PaymentVerificationModal } from './components/PaymentVerificationModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UserManagementView } from './components/UserManagementView';
import { LoginModal } from './components/LoginModal';
import { INITIAL_APPLICATIONS, OFFICIAL_WORKFLOW_STEPS_DEF } from './data/initialData';
import { ApplicationStatus, LineMilestoneType, LineNotificationRecord, ResearchApplication, UserProfile, WorkflowStepId, NuDisbursementRecord } from './types';
import { generateNextTrackingNo } from './data/regulations';
import { 
  DEFAULT_LOGGED_IN_USER,
  saveStoredUserProfile,
  getStoredUsersRegistry,
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
  fetchRewardApplicationsFromD1,
  createRewardApplicationInD1,
  updateRewardApplicationInD1,
  deleteRewardApplicationInD1
} from './services/rewardD1Service';
import {
  fetchUsersFromD1,
  updateUserProfileInD1,
  createUserInD1
} from './services/userService';
import { Bell, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'med_nu_research_apps_v1';

export default function App() {
  // Load applications from localStorage or fallback to INITIAL_APPLICATIONS
  const [applications, setApplications] = useState<ResearchApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const seenIds = new Set<string>();
          return parsed.map((app: any, index: number) => {
            let id = app && typeof app.id === 'string' && app.id.trim() ? app.id : null;
            if (!id || seenIds.has(id)) {
              id = `app-saved-${index + 1}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(id);
            return {
              ...app,
              id,
              trackingNo: app.trackingNo || `AWP69-${String(60 + index).padStart(3, '0')}`,
            };
          });
        }
      }
    } catch (e) {
      console.error('Failed to load saved applications:', e);
    }
    return INITIAL_APPLICATIONS;
  });

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    } catch (e) {
      console.error('Failed to persist applications:', e);
    }
  }, [applications]);

  // Active authenticated user profile (null = Guest Mode)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCurrentAuthUser());
  const isGuest = !currentUser;

  // Current active navigation role & view
  const [currentRole, setCurrentRole] = useState<UserRole>(() => currentUser?.role || 'researcher');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [timelineApp, setTimelineApp] = useState<ResearchApplication | null>(null);
  const [printApp, setPrintApp] = useState<ResearchApplication | null>(null);
  const [paymentApp, setPaymentApp] = useState<ResearchApplication | null>(null);
  const [editingDraftApp, setEditingDraftApp] = useState<ResearchApplication | null>(null);
  const [isLoadingD1, setIsLoadingD1] = useState(false);

  // Enforce Guest Mode to remain on dashboard tab
  useEffect(() => {
    if (!currentUser && activeTab !== 'dashboard') {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab]);

  // Load applications from Cloudflare D1 on mount
  useEffect(() => {
    const loadFromD1 = async () => {
      setIsLoadingD1(true);
      try {
        const d1Data = await fetchRewardApplicationsFromD1();
        if (Array.isArray(d1Data) && d1Data.length > 0) {
          setApplications(d1Data);
        }
      } catch (err) {
        console.warn('Using local applications cache, D1 fetch error:', err);
      } finally {
        setIsLoadingD1(false);
      }
    };
    loadFromD1();
  }, []);

  // Load registered users from Cloudflare D1 (irUser) on mount
  useEffect(() => {
    fetchUsersFromD1()
      .then((d1Users) => {
        if (Array.isArray(d1Users) && d1Users.length > 0) {
          setRegisteredUsers(d1Users);
        }
      })
      .catch((err) => console.warn('D1 users fetch warning:', err));
  }, []);

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

  // DRI NU Disbursement Tracking State (ม.นเรศวร)
  const [nuDisbursements, setNuDisbursements] = useState<NuDisbursementRecord[]>(() => getStoredNuDisbursements());

  const handleUpdateNuRecord = (updated: NuDisbursementRecord) => {
    setNuDisbursements((prev) => upsertNuDisbursement(prev, updated));
    showToast(`อัปเดตข้อมูลการเบิกจ่าย มน. (${updated.researcherName}) เรียบร้อยแล้ว`);
  };

  const handleImportNuRecords = (newRecords: NuDisbursementRecord[]) => {
    setNuDisbursements((prev) => {
      const merged = [...prev];
      for (const nr of newRecords) {
        const idx = merged.findIndex(
          m => m.id === nr.id || (m.articleTitle && nr.articleTitle && m.articleTitle.trim().toLowerCase() === nr.articleTitle.trim().toLowerCase())
        );
        if (idx >= 0) {
          merged[idx] = { 
            ...merged[idx], 
            ...nr, 
            rewardAmount: merged[idx].rewardAmount || nr.rewardAmount,
            pageChargeAmount: merged[idx].pageChargeAmount || nr.pageChargeAmount,
            totalAmount: (merged[idx].rewardAmount || nr.rewardAmount || 0) + (merged[idx].pageChargeAmount || nr.pageChargeAmount || 0),
            updatedAt: new Date().toISOString().split('T')[0] 
          };
        } else {
          merged.unshift(nr);
        }
      }
      saveStoredNuDisbursements(merged);
      return merged;
    });
    showToast(`นำเข้าข้อมูลจากระบบ มน. สำเร็จ (${newRecords.length} รายการ)`);
  };

  // User Management Registry state & handlers
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => getStoredUsersRegistry());

  const handleSaveProfile = async (updated: UserProfile) => {
    saveStoredUserProfile(updated);
    setCurrentUser(updated);
    setCurrentAuthUser(updated);
    const nextUsers = upsertRegisteredUser(updated);
    setRegisteredUsers(nextUsers);
    showToast('บันทึกข้อมูลโปรไฟล์ตั้งต้นและมาตรการคุ้มครองข้อมูล PDPA เรียบร้อยแล้ว');

    // Cloudflare D1 Cloud Sync
    try {
      await updateUserProfileInD1(updated.id, updated);
      showToast('✅ ซิงก์ข้อมูลโปรไฟล์ขึ้น Cloudflare D1 (irUser) เรียบร้อยแล้ว');
    } catch (e: any) {
      console.warn('D1 profile sync warning:', e);
    }
  };

  const handleUpdateRegisteredUser = async (updatedUser: UserProfile) => {
    const nextUsers = upsertRegisteredUser(updatedUser);
    setRegisteredUsers(nextUsers);
    if (currentUser && (currentUser.id === updatedUser.id || currentUser.email.toLowerCase() === updatedUser.email.toLowerCase())) {
      setCurrentUser(updatedUser);
      setCurrentAuthUser(updatedUser);
      saveStoredUserProfile(updatedUser);
    }
    showToast(`อัปเดตข้อมูลผู้ใช้งาน ${updatedUser.name} เรียบร้อยแล้ว`);

    // Cloudflare D1 Cloud Sync
    try {
      await updateUserProfileInD1(updatedUser.id, updatedUser);
      showToast(`✅ อัปเดตข้อมูล ${updatedUser.name} ลง Cloudflare D1 (irUser) เรียบร้อย`);
    } catch (e: any) {
      console.warn('D1 update user warning:', e);
    }
  };

  const handleCreateRegisteredUser = async (newUser: UserProfile) => {
    const nextUsers = upsertRegisteredUser(newUser);
    setRegisteredUsers(nextUsers);
    showToast(`เพิ่มผู้ใช้งาน ${newUser.name} เข้าสู่ระบบเรียบร้อยแล้ว`);

    // Cloudflare D1 Cloud Sync
    try {
      await createUserInD1(newUser);
      showToast(`✅ เพิ่มผู้ใช้งาน ${newUser.name} เข้าสู่ Cloudflare D1 (irUser) สำเร็จ`);
    } catch (e: any) {
      console.warn('D1 create user warning:', e);
    }
  };

  const handleDeleteRegisteredUser = (userId: string) => {
    const userToDelete = registeredUsers.find((u) => u.id === userId);
    const nextUsers = deleteRegisteredUser(userId);
    setRegisteredUsers(nextUsers);
    showToast(`ลบผู้ใช้งาน ${userToDelete?.name || userId} เรียบร้อยแล้ว`);
  };

  const handleSwitchUserFromConsole = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    saveStoredUserProfile(user);
    setCurrentRole(user.role);
    showToast(`สลับเข้าใช้งานบัญชี ${user.name} (${user.email}) สิทธิ์: ${user.role} สำเร็จ`);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentAuthUser(user);
    setCurrentRole(user.role);
    setActiveTab('dashboard');
    showToast(`ยินดีต้อนรับ ${user.name} (${user.email}) เข้าสู่ระบบในสิทธิ์: ${user.role}`);
  };

  const handleLogout = async () => {
    await logoutNuUser();
    setCurrentUser(null);
    setCurrentRole('researcher');
    setActiveTab('dashboard');
    showToast('ออกจากระบบเรียบร้อยแล้ว เข้าสู่โหมดผู้เยี่ยมชมทั่วไป (Guest Mode)');
  };

  const handleOpenNewSubmission = () => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      showToast('กรุณาเข้าสู่ระบบด้วย NU Account (@nu.ac.th) ก่อนยื่นคำขอรับทุน');
      return;
    }
    setEditingDraftApp(null);
    setIsSubmissionModalOpen(true);
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (!currentUser && tab !== 'dashboard') {
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
      researcher: ['dashboard', 'quota_planner', 'article_table', 'table', 'calendar'],
      finance: ['dashboard', 'article_table', 'table', 'calendar'],
      executive: ['dashboard', 'article_table', 'table', 'calendar'],
      coordinator: ['dashboard', 'article_table', 'kanban', 'table', 'calendar', ...(LINE_NOTIFICATION_SYSTEM_ENABLED ? ['line_oa' as ActiveTab] : [])],
      admin: ['dashboard', 'quota_planner', 'article_table', 'kanban', 'table', 'calendar', ...(LINE_NOTIFICATION_SYSTEM_ENABLED ? ['line_oa' as ActiveTab] : []), 'user_management'],
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

    // For drafts, do not consume sequential tracking numbers
    const finalTrackingNo = isActuallyDraft
      ? (appInput.trackingNo && appInput.trackingNo !== 'DRAFT' ? appInput.trackingNo : 'DRAFT')
      : (appInput.trackingNo && appInput.trackingNo !== 'DRAFT'
          ? appInput.trackingNo
          : generateNextTrackingNo(appFiscalYear, applications.map((a) => a.trackingNo)));

    const today = new Date().toISOString().split('T')[0];

    const finalApp: ResearchApplication = {
      applicantName: activeUser.name,
      academicPosition: activeUser.academicPosition,
      department: activeUser.department,
      phone: activeUser.phone,
      email: activeUser.email,
      bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
      bankAccountNo: activeUser.bankAccountNo || '',
      idCardNo: activeUser.idCardNo || '',
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
      timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
        ...s,
        status: idx === 0 ? (isActuallyDraft ? 'in_progress' : 'completed') : 'pending',
        completedAt: idx === 0 && !isActuallyDraft ? today : undefined,
      })),
      ...appInput,
      id: finalId,
      trackingNo: finalTrackingNo,
      status: isActuallyDraft ? 'draft' : 'submitted',
      createdAt: appInput.createdAt || today,
      updatedAt: today,
    };

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

    if (isActuallyDraft) {
      showToast(`💾 บันทึกร่างเตรียมเบิกรางวัล "${finalApp.articleTitle || 'ฉบับร่าง'}" สำเร็จ! ตรวจสอบได้ที่เมนู "เตรียมเบิกรางวัล & วงเงิน"`);
      return;
    }

    triggerLineMilestoneNotification(finalApp, 'application_submitted');

    // Cloudflare D1 Database Sync
    createRewardApplicationInD1(finalApp)
      .then(() => {
        showToast(`✅ ยื่นคำขอ ${finalApp.trackingNo} ลง Cloudflare D1 สำเร็จเรียบร้อย!`);
      })
      .catch((err) => {
        console.error('D1 create error:', err);
        showToast(`⚠️ บันทึกข้อมูลในเครื่องแล้ว แต่การซิงก์เข้า Cloudflare D1 ขัดข้อง: ${err.message}`);
      });
  };

  // Draft Management Handlers
  const handleEditDraft = (draftApp: ResearchApplication) => {
    setEditingDraftApp(draftApp);
    setIsSubmissionModalOpen(true);
  };

  const handleSubmitDraft = (draftApp: ResearchApplication) => {
    const today = new Date().toISOString().split('T')[0];
    const newTrackingNo = generateNextTrackingNo(
      draftApp.fiscalYear,
      applications.map((a) => a.trackingNo)
    );

    const submittedApp: ResearchApplication = {
      ...draftApp,
      trackingNo: newTrackingNo,
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

    triggerLineMilestoneNotification(submittedApp, 'application_submitted');
    createRewardApplicationInD1(submittedApp)
      .then(() => {
        showToast(`🚀 ส่งเบิกคำขอสำเร็จ! รหัสติดตามงานใหม่: ${submittedApp.trackingNo}`);
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
      const nextTrackingNo = generateNextTrackingNo(draft.fiscalYear, currentTrackingList);
      currentTrackingList.push(nextTrackingNo);

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
      createRewardApplicationInD1(submitted).catch((e) => console.warn('D1 batch submit error:', e));
    });

    const updatedMap = new Map(updatedDrafts.map((d) => [d.id, d]));
    setApplications((prev) => prev.map((a) => updatedMap.get(a.id) || a));

    showToast(`🚀 ส่งเบิกคำขอที่เลือกเรียบร้อยแล้วทั้งหมด ${draftApps.length} รายการ!`);
  };

  const handleDeleteDraft = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    deleteRewardApplicationInD1(id).catch((e) => console.warn('D1 delete draft error:', e));
    showToast('🗑️ ลบรายการร่างเตรียมเบิกเรียบร้อยแล้ว');
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
    showToast(`🗓️ เลื่อนรายการไปเตรียมเบิกในปีงบประมาณ ${targetFiscalYear} เรียบร้อยแล้ว`);
  };

  // 2. Drag-and-Drop / Kanban status update
  const handleUpdateStatus = (id: string, newStatus: ApplicationStatus, nextStep: WorkflowStepId) => {
    const target = applications.find(a => a.id === id);
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        const isNowPaid = newStatus === 'paid';
        return {
          ...app,
          status: newStatus,
          currentStep: nextStep,
          paymentStatus: isNowPaid ? 'transferred' : app.paymentStatus,
          paymentDate: isNowPaid && !app.paymentDate ? new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : app.paymentDate,
          disbursementVoucherNo: isNowPaid && !app.disbursementVoucherNo ? `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70` : app.disbursementVoucherNo,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
    showToast(`อัปเดตสถานะโครงการเป็น "${newStatus}" (ขั้นตอนที่ ${nextStep}) เรียบร้อย`);

    // Cloudflare D1 sync for status update
    updateRewardApplicationInD1(id, {
      status: newStatus,
      currentStep: nextStep,
      paymentStatus: newStatus === 'paid' ? 'transferred' : undefined,
      paymentDate: newStatus === 'paid' ? new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined,
      disbursementVoucherNo: newStatus === 'paid' ? (target?.disbursementVoucherNo || `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70`) : undefined,
    }).catch(e => console.warn('D1 update status error:', e));

    // Automatic LINE Trigger on milestone status changes
    if (target) {
      if (newStatus === 'paid') {
        triggerLineMilestoneNotification({ 
          ...target, 
          status: 'paid', 
          currentStep: nextStep, 
          disbursementVoucherNo: target.disbursementVoucherNo || 'ฎีกา 3606/70'
        }, 'payment_transferred');
      } else if (newStatus === 'staff_verified') {
        triggerLineMilestoneNotification({ ...target, status: newStatus, currentStep: nextStep }, 'document_verified');
      } else if (newStatus === 'dean_approved') {
        triggerLineMilestoneNotification({ ...target, status: newStatus, currentStep: nextStep }, 'dean_approved');
      }
    }
  };

  // 3. Save edited row in Table view
  const handleSaveTableRow = (updatedApp: ResearchApplication) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === updatedApp.id ? updatedApp : a))
    );
    showToast(`บันทึกการแก้ไข ${updatedApp.trackingNo} สำเร็จ`);

    // Cloudflare D1 sync
    updateRewardApplicationInD1(updatedApp.id, updatedApp)
      .catch(e => console.warn('D1 update row error:', e));
  };

  // 3.1 Update Document Numbering & Online Review Details
  const handleUpdateDocDetails = (appId: string, updates: Partial<ResearchApplication>) => {
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
    showToast('บันทึกข้อมูลเลขที่หนังสือราชการและวันที่เรียบร้อย');
  };

  // 4. Advance timeline step
  const handleAdvanceTimelineStep = (id: string, nextStep: WorkflowStepId, note?: string) => {
    const target = applications.find(a => a.id === id);
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== id) return app;
        let newStatus = app.status;
        if (nextStep >= 3 && nextStep <= 4) newStatus = 'staff_verified';
        else if (nextStep >= 5 && nextStep <= 8) newStatus = 'dean_approved';
        else if (nextStep >= 9 && nextStep <= 10) newStatus = 'finance_processing';
        else if (nextStep >= 11) newStatus = 'paid';

        const updatedTimeline = app.timeline.map((step) => {
          if (step.stepNumber < nextStep) {
            return { ...step, status: 'completed' as const, completedAt: step.completedAt || new Date().toISOString().split('T')[0] };
          }
          if (step.stepNumber === nextStep) {
            return { ...step, status: 'in_progress' as const, notes: note || step.notes };
          }
          return { ...step, status: 'pending' as const };
        });

        const isNowPaid = nextStep >= 11;

        return {
          ...app,
          currentStep: nextStep,
          status: newStatus,
          paymentStatus: isNowPaid ? 'transferred' : app.paymentStatus,
          paymentDate: isNowPaid && !app.paymentDate ? new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : app.paymentDate,
          disbursementVoucherNo: isNowPaid && !app.disbursementVoucherNo ? `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70` : app.disbursementVoucherNo,
          updatedAt: new Date().toISOString().split('T')[0],
          timeline: updatedTimeline,
        };
      })
    );

    // Cloudflare D1 sync
    if (target) {
      let calcStatus = target.status;
      if (nextStep >= 3 && nextStep <= 4) calcStatus = 'staff_verified';
      else if (nextStep >= 5 && nextStep <= 8) calcStatus = 'dean_approved';
      else if (nextStep >= 9 && nextStep <= 10) calcStatus = 'finance_processing';
      else if (nextStep >= 11) calcStatus = 'paid';

      updateRewardApplicationInD1(id, {
        currentStep: nextStep,
        status: calcStatus,
        coordinatorNotes: note
      }).catch(e => console.warn('D1 advance step error:', e));
    }

    // Automatic LINE Notification Triggers for Milestones 2, 3, 4
    if (target) {
      if (nextStep === 4) {
        // Milestone 2: Document Verified
        triggerLineMilestoneNotification({ ...target, currentStep: nextStep }, 'document_verified');
      } else if (nextStep === 7 || nextStep === 8) {
        // Milestone 3: Dean Approved
        triggerLineMilestoneNotification({ ...target, currentStep: nextStep }, 'dean_approved');
      } else if (nextStep >= 11) {
        // Milestone 4: Payment Transferred (Real-time)
        triggerLineMilestoneNotification({ 
          ...target, 
          currentStep: nextStep, 
          status: 'paid',
          disbursementVoucherNo: target.disbursementVoucherNo || `ฎีกา ${Math.floor(3000 + Math.random() * 1000)}/70`,
          paymentDate: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
        }, 'payment_transferred');
      }
    }

    showToast(`เลื่อนขั้นตอนสำเร็จ → ขั้นตอนที่ ${nextStep}/12`);
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
    if (currentUser.email && app.email && app.email.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (currentUser.name && app.applicantName && app.applicantName.toLowerCase().includes(currentUser.name.toLowerCase())) return true;
    return false;
  };

  const roleScopedApplications = applications.filter((app) => {
    if (isGuest) {
      return true;
    }
    if (currentRole === 'researcher') {
      return isAppOwnedByUser(app);
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

  // Count drafts for current researcher
  const myDraftsCount = applications.filter((app) => {
    if (app.status !== 'draft') return false;
    if (isGuest) return false;
    if (currentRole === 'researcher') {
      return isAppOwnedByUser(app);
    }
    return true;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
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
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
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
            applications={isGuest ? applications : displayApplications}
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
            onNavigateToPlanner={() => setActiveTab('quota_planner')}
          />
        )}

        {/* Tab 1.5: Quota & 24-Month Expiry Planner View (Researcher & Admin) */}
        {activeTab === 'quota_planner' && !isGuest && (
          <QuotaPlannerView
            applications={applications}
            nuDisbursements={nuDisbursements}
            currentUser={currentUser}
            onOpenNewSubmission={handleOpenNewSubmission}
            onEditDraft={handleEditDraft}
            onSubmitDraft={handleSubmitDraft}
            onSubmitSelectedDrafts={handleSubmitSelectedDrafts}
            onDeleteDraft={handleDeleteDraft}
            onCarryOverDraft={handleCarryOverDraft}
          />
        )}

        {/* Tab 2: Interactive Drag-and-Drop Kanban Board (Coordinator and Admin ONLY) */}
        {activeTab === 'kanban' && (currentRole === 'coordinator' || currentRole === 'admin') && !isGuest && (
          <KanbanBoard
            applications={displayApplications}
            onUpdateStatus={handleUpdateStatus}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
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
          />
        )}

        {/* Tab 3: Editable Table Grid for Personal Work */}
        {activeTab === 'table' && !isGuest && (
          <TableView
            applications={displayApplications}
            onSaveRow={handleSaveTableRow}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            currentUserEmail={currentUser?.email || ''}
            currentUserName={currentUser?.name || ''}
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

        {/* Tab 6: Admin User Management Console */}
        {activeTab === 'user_management' && currentRole === 'admin' && !isGuest ? (
          <UserManagementView
            users={registeredUsers}
            currentLoggedInUser={currentUser || DEFAULT_LOGGED_IN_USER}
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
              หน้าจอนี้สงวนไว้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น กรุณาสลับบทบาทเป็นผู้ดูแลระบบและยืนยันตัวตน
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              กลับสู่หน้าหลัก (Dashboard)
            </button>
          </div>
        ) : null}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</span>
            <span>•</span>
            <span>งานวิจัยและบริการวิชาการ (โทร. 0-5596-7844)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>ประกาศฯ ลงวันที่ 27 พฤษภาคม พ.ศ. 2567</span>
            <span>•</span>
            <span>เชื่อมต่อ Cloudflare D1 & LINE OA</span>
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
          initialData={editingDraftApp}
        />
      )}

      {/* MODAL 2: 12-Step SLA Timeline Tracker Modal */}
      <TimelineTrackerModal
        isOpen={!!timelineApp}
        application={timelineApp}
        onClose={() => setTimelineApp(null)}
        onAdvanceStep={handleAdvanceTimelineStep}
        onPrint={(app) => setPrintApp(app)}
        onVerifyPayment={(app) => setPaymentApp(app)}
        canEdit={currentRole === 'coordinator' || currentRole === 'finance' || currentRole === 'admin'}
        currentRole={currentRole}
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
          onSwitchUser={(user) => {
            setCurrentUser(user);
            setCurrentAuthUser(user);
            setCurrentRole(user.role);
            showToast(`สลับเข้าใช้งานบัญชี ${user.name} (${user.email}) เรียบร้อยแล้ว`);
          }}
        />
      )}

      {/* MODAL 6: NU Account Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
