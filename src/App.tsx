import React, { useState, useEffect } from 'react';
import { Header, UserRole, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { LineNotificationModal } from './components/LineNotificationModal';
import { SubmissionFormModal } from './components/SubmissionFormModal';
import { TimelineTrackerModal } from './components/TimelineTrackerModal';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { PaymentVerificationModal } from './components/PaymentVerificationModal';
import { UserProfileModal } from './components/UserProfileModal';
import { INITIAL_APPLICATIONS, OFFICIAL_WORKFLOW_STEPS_DEF } from './data/initialData';
import { ApplicationStatus, LineMilestoneType, LineNotificationRecord, ResearchApplication, UserProfile, WorkflowStepId } from './types';
import { generateNextTrackingNo } from './data/regulations';
import { getStoredUserProfile, saveStoredUserProfile } from './data/userProfile';
import { 
  LINE_BOT_CONFIG, 
  createLineRecordFromApp, 
  getStoredLineNotifications, 
  saveStoredLineNotifications 
} from './data/lineNotificationService';
import {
  fetchRewardApplicationsFromD1,
  createRewardApplicationInD1,
  updateRewardApplicationInD1,
  deleteRewardApplicationInD1
} from './services/rewardD1Service';
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

  // Current active navigation role & view
  const [currentRole, setCurrentRole] = useState<UserRole>('researcher');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active logged-in user profile (PDPA compliant)
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getStoredUserProfile());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Modals state
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [timelineApp, setTimelineApp] = useState<ResearchApplication | null>(null);
  const [printApp, setPrintApp] = useState<ResearchApplication | null>(null);
  const [paymentApp, setPaymentApp] = useState<ResearchApplication | null>(null);
  const [isLoadingD1, setIsLoadingD1] = useState(false);

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

  const handleSaveProfile = (updated: UserProfile) => {
    saveStoredUserProfile(updated);
    setCurrentUser(updated);
    showToast('บันทึกข้อมูลโปรไฟล์ตั้งต้นและมาตรการคุ้มครองข้อมูล PDPA เรียบร้อยแล้ว');
  };

  // 1. Submit New Application (Local State + Real Google Sheets Sync)
  const handleCreateSubmission = (appInput: Partial<ResearchApplication>) => {
    const finalId = appInput.id || `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const appFiscalYear = appInput.fiscalYear || 2570;
    const finalTrackingNo = appInput.trackingNo || generateNextTrackingNo(
      appFiscalYear, 
      applications.map((a) => a.trackingNo)
    );
    const today = new Date().toISOString().split('T')[0];

    const finalApp: ResearchApplication = {
      applicantName: currentUser.name,
      academicPosition: currentUser.academicPosition,
      department: currentUser.department,
      phone: currentUser.phone,
      email: currentUser.email,
      bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
      bankAccountNo: currentUser.bankAccountNo || '',
      idCardNo: currentUser.idCardNo || '',
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
      currentStep: 2,
      status: 'submitted',
      paymentStatus: 'unpaid',
      attachments: [],
      lineNotified: false,
      calendarSynced: false,
      timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
        ...s,
        status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
        completedAt: idx === 0 ? today : undefined,
      })),
      ...appInput,
      id: finalId,
      trackingNo: finalTrackingNo,
      createdAt: appInput.createdAt || today,
      updatedAt: appInput.updatedAt || today,
    };

    setApplications((prev) => [finalApp, ...prev]);
    setIsSubmissionModalOpen(false);
    triggerLineMilestoneNotification(finalApp, 'application_submitted');

    // Cloudflare D1 Database Sync
    createRewardApplicationInD1(finalApp)
      .then(() => {
        showToast(`✅ บันทึกคำขอ ${finalApp.trackingNo} ลง Cloudflare D1 สำเร็จเรียบร้อย!`);
      })
      .catch((err) => {
        console.error('D1 create error:', err);
        showToast(`⚠️ บันทึกข้อมูลในเครื่องแล้ว แต่การซิงก์เข้า Cloudflare D1 ขัดข้อง: ${err.message}`);
      });
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

    // Direct Sheets API sync for status update
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

        const updatedTimeline = app.timeline?.map((step) => {
          if (step.stepNumber === app.currentStep) {
            return {
              ...step,
              status: 'completed' as const,
              completedAt: new Date().toISOString().split('T')[0],
              notes: note || step.notes,
            };
          }
          if (step.stepNumber === nextStep) {
            return {
              ...step,
              status: 'in_progress' as const,
            };
          }
          return step;
        });

        return {
          ...app,
          currentStep: nextStep,
          status: newStatus,
          timeline: updatedTimeline,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );

    // Update the currently viewed app in the modal
    if (timelineApp && timelineApp.id === id) {
      setTimelineApp((prev) => (prev ? { ...prev, currentStep: nextStep } : null));
    }

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

    showToast(`เลื่อนขั้นตอนสำเร็จ &rarr; ขั้นตอนที่ ${nextStep}/12`);
  };

  // 5. Send LINE Notification Trigger
  const handleSendLineNotification = (trackingNo: string, message: string) => {
    showToast(`LINE OA [${LINE_BOT_CONFIG.botBasicId}]: ส่งแจ้งเตือนสำหรับ [${trackingNo}] สำเร็จ!`);
  };

  // Global search filtering
  const displayApplications = applications.filter((app) => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Universal Header */}
      <Header
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewSubmission={() => setIsSubmissionModalOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
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
            applications={displayApplications}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            onOpenNewSubmission={() => setIsSubmissionModalOpen(true)}
          />
        )}

        {/* Tab 2: Interactive Drag-and-Drop Kanban Board */}
        {activeTab === 'kanban' && (
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

        {/* Tab 3: Editable Table Grid for Personal Work */}
        {activeTab === 'table' && (
          <TableView
            applications={displayApplications}
            onSaveRow={handleSaveTableRow}
            onViewApplication={(app) => setTimelineApp(app)}
            onPrintApplication={(app) => setPrintApp(app)}
            onVerifyPayment={(app) => setPaymentApp(app)}
            currentUserEmail={currentUser.email}
            currentUserName={currentUser.name}
          />
        )}

        {/* Tab 4: Google Calendar View */}
        {activeTab === 'calendar' && (
          <CalendarView applications={applications} />
        )}

        {/* Tab 5: LINE OA Notification Center (iRAM-U Services @414jvrca) */}
        {activeTab === 'line_oa' && (
          <LineNotificationModal
            applications={applications}
            onSendNotification={handleSendLineNotification}
            notifications={lineNotifications}
            onTriggerMilestone={triggerLineMilestoneNotification}
          />
        )}



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
          onClose={() => setIsSubmissionModalOpen(false)}
          onSubmit={handleCreateSubmission}
          existingApplications={applications}
          currentUser={currentUser}
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
        currentUser={currentUser}
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
      {isProfileModalOpen && (
        <UserProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onSaveProfile={handleSaveProfile}
          onSwitchUser={(user) => {
            setCurrentUser(user);
            setCurrentRole(user.role);
            showToast(`สลับเข้าใช้งานบัญชี ${user.name} (${user.email}) เรียบร้อยแล้ว`);
          }}
        />
      )}

      {/* Cloudflare D1 Sync Active */}

    </div>
  );
}
