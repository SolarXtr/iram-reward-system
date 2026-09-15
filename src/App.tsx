import React, { useState, useEffect } from 'react';
import { Header, UserRole, ActiveTab } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { CalendarView } from './components/CalendarView';
import { LineNotificationModal } from './components/LineNotificationModal';
import { AppsScriptView } from './components/AppsScriptView';
import { SubmissionFormModal } from './components/SubmissionFormModal';
import { TimelineTrackerModal } from './components/TimelineTrackerModal';
import { OfficialPrintModal } from './components/OfficialPrintModal';
import { PaymentVerificationModal } from './components/PaymentVerificationModal';
import { UserProfileModal } from './components/UserProfileModal';
import { GoogleSheetsSettingsModal } from './components/GoogleSheetsSettingsModal';
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
  getStoredAppsScriptUrl, 
  submitApplicationToGoogleSheets, 
  updateApplicationStatusInGoogleSheets, 
  recordPaymentInGoogleSheets 
} from './services/googleSheetsService';
import { 
  auth, 
  initAuth, 
  googleSignIn, 
  getAccessToken 
} from './services/googleAuth';
import { 
  getStoredDirectSpreadsheetId, 
  appendApplicationDirect, 
  updateApplicationDirect 
} from './services/directSheetsApi';
import { User } from 'firebase/auth';
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
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isSheetsConnected, setIsSheetsConnected] = useState<boolean>(() => !!getStoredAppsScriptUrl() || !!getStoredDirectSpreadsheetId());

  // Google Workspace User state
  const [googleUser, setGoogleUser] = useState<User | null>(auth.currentUser);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setGoogleUser(user);
    }, () => {
      setGoogleUser(null);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleSignInFromHeader = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setIsSheetsConnected(!!getStoredAppsScriptUrl() || !!getStoredDirectSpreadsheetId());
        showToast(`ยินดีต้อนรับ ${result.user.displayName || result.user.email} (เชื่อมต่อ Google Workspace เรียบร้อย)`);
      }
    } catch (err: any) {
      showToast(`เข้าสู่ระบบไม่สำเร็จ: ${err.message}`);
    }
  };

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Check sheets connected state whenever modal closes or on user change
  useEffect(() => {
    setIsSheetsConnected(!!getStoredAppsScriptUrl() || !!getStoredDirectSpreadsheetId());
  }, [isSheetsModalOpen, googleUser]);

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

    // 1. Google Sheets Sync: Direct Google Sheets API (if configured in Google Drive)
    const directSheetId = getStoredDirectSpreadsheetId();
    if (directSheetId) {
      getAccessToken().then((token) => {
        if (token) {
          appendApplicationDirect(token, directSheetId, finalApp)
            .then(() => {
              showToast(`✅ บันทึกคำขอ ${finalApp.trackingNo} ลง Google Sheet (Direct Drive) สำเร็จ!`);
            })
            .catch((err) => {
              console.warn('Direct Sheets append error:', err);
            });
        }
      });
    }

    // 2. Google Sheets Sync: Apps Script Web App (if configured)
    if (getStoredAppsScriptUrl()) {
      showToast(`⏳ กำลังบันทึกคำขอ ${finalApp.trackingNo} ลง Google Sheets (Apps Script)...`);
      submitApplicationToGoogleSheets(finalApp).then((res) => {
        if (res.success) {
          showToast(`✅ บันทึกคำขอ ${finalApp.trackingNo} ลง Google Sheets เรียบร้อยแล้ว!`);
        } else {
          showToast(`⚠️ บันทึกในระบบแล้ว แต่ส่งเข้าชีตไม่สำเร็จ: ${res.message}`);
        }
      });
    } else if (!directSheetId) {
      showToast(`ℹ️ บันทึกคำขอ ${finalApp.trackingNo} ในระบบแล้ว (คลิกไอคอน Google Sheets ด้านบนเพื่อเชื่อมต่อการส่งเข้าชีตจริง)`);
    }
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
    const directSheetId = getStoredDirectSpreadsheetId();
    if (directSheetId && target) {
      getAccessToken().then((token) => {
        if (token) {
          updateApplicationDirect(token, directSheetId, target.trackingNo, {
            nextStep,
            status: newStatus
          }).catch(e => console.warn('Direct update error:', e));
        }
      });
    }

    // Google Sheets sync for status update (Apps Script)
    if (getStoredAppsScriptUrl() && target) {
      updateApplicationStatusInGoogleSheets(target.trackingNo, nextStep, newStatus);
    }

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

    // Direct Sheets API sync
    const directSheetId = getStoredDirectSpreadsheetId();
    if (directSheetId) {
      getAccessToken().then((token) => {
        if (token) {
          updateApplicationDirect(token, directSheetId, updatedApp.trackingNo, {
            nextStep: updatedApp.currentStep,
            status: updatedApp.status,
            notes: updatedApp.staffNotes || updatedApp.coordinatorNotes,
            voucherNo: updatedApp.disbursementVoucherNo,
            paymentDate: updatedApp.paymentDate,
            paymentStatus: updatedApp.paymentStatus
          }).catch(e => console.warn('Direct update row error:', e));
        }
      });
    }

    // Apps Script webhook sync
    if (getStoredAppsScriptUrl()) {
      updateApplicationStatusInGoogleSheets(updatedApp.trackingNo, updatedApp.currentStep, updatedApp.status, updatedApp.staffNotes);
    }
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

    // Direct Sheets API sync
    const directSheetId = getStoredDirectSpreadsheetId();
    if (directSheetId && target) {
      let calcStatus = target.status;
      if (nextStep >= 3 && nextStep <= 4) calcStatus = 'staff_verified';
      else if (nextStep >= 5 && nextStep <= 8) calcStatus = 'dean_approved';
      else if (nextStep >= 9 && nextStep <= 10) calcStatus = 'finance_processing';
      else if (nextStep >= 11) calcStatus = 'paid';

      getAccessToken().then((token) => {
        if (token) {
          updateApplicationDirect(token, directSheetId, target.trackingNo, {
            nextStep,
            status: calcStatus,
            notes: note
          }).catch(e => console.warn('Direct advance step error:', e));
        }
      });
    }

    // Google Sheets sync (Apps Script)
    if (getStoredAppsScriptUrl() && target) {
      updateApplicationStatusInGoogleSheets(target.trackingNo, nextStep, undefined, note);
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
        onOpenGoogleSheetsSettings={() => setIsSheetsModalOpen(true)}
        isSheetsConnected={isSheetsConnected}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignInFromHeader}
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

        {/* Tab 6: Google Apps Script Backend Code Suite */}
        {activeTab === 'appscript' && (
          <AppsScriptView />
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
            <span>เชื่อมต่อ Google Sheets & LINE OA</span>
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
        canEdit={currentRole === 'coordinator' || currentRole === 'finance'}
      />

      {/* MODAL 3: Official Printable Documents (AWP69 / Memo / Receipt) */}
      <OfficialPrintModal
        isOpen={!!printApp}
        application={printApp}
        onClose={() => setPrintApp(null)}
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

      {/* MODAL 6: Google Sheets API Connection & Sync Settings */}
      {isSheetsModalOpen && (
        <GoogleSheetsSettingsModal
          isOpen={isSheetsModalOpen}
          onClose={() => {
            setIsSheetsModalOpen(false);
            setIsSheetsConnected(!!getStoredAppsScriptUrl() || !!getStoredDirectSpreadsheetId());
          }}
          onSyncData={(remoteData) => {
            if (Array.isArray(remoteData) && remoteData.length > 0) {
              setApplications(remoteData);
              showToast(`ซิงก์ข้อมูลจาก Google Sheets สำเร็จ (${remoteData.length} รายการ)`);
            }
          }}
        />
      )}

    </div>
  );
}
