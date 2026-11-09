import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  User, 
  Building2, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Printer, 
  Banknote,
  Send,
  MessageSquare,
  RotateCcw,
  Layers,
  Repeat,
  Sparkles
} from 'lucide-react';
import { UserRole } from './Header';
import { ResearchApplication, UserProfile, WorkflowStepId } from '../types';
import { formatBaht } from '../data/regulations';
import { 
  WORKFLOW_19_STEPS_DEF, 
  WorkflowStep19, 
  getWorkflow19StepDef, 
  normalizeWorkflowStep 
} from '../data/workflow19Steps';
import { isSameDepartment } from '../utils/permissionUtils';

interface TimelineTrackerModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStep: (id: string, nextStep: WorkflowStepId, note?: string) => void;
  onPrint: (app: ResearchApplication) => void;
  onVerifyPayment: (app: ResearchApplication) => void;
  onReturnToDraft?: (app: ResearchApplication) => void;
  canEdit: boolean; // if staff/coordinator/finance/dept_secretary
  currentRole?: UserRole;
  currentUser?: UserProfile | null;
}

export const TimelineTrackerModal: React.FC<TimelineTrackerModalProps> = ({
  application,
  isOpen,
  onClose,
  onAdvanceStep,
  onPrint,
  onVerifyPayment,
  onReturnToDraft,
  canEdit,
  currentRole = 'coordinator',
  currentUser,
}) => {
  if (!isOpen || !application) return null;

  const [officerNote, setOfficerNote] = useState('');

  const currentStepNumber = normalizeWorkflowStep(application.currentStep);
  const currentStepDef = getWorkflow19StepDef(currentStepNumber);

  const isMyApp = Boolean(
    (currentUser?.email && application.email && application.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && application.applicantName && application.applicantName.toLowerCase() === currentUser.name.toLowerCase())
  );

  const isSameDept = isSameDepartment(currentUser?.department, application.department);

  // Determine if the current active role is authorized to advance the current step in the 19-step workflow
  const isRoleAuthorizedForCurrentStep = (step: number, role: UserRole): boolean => {
    // Admin has full authorization to manage and advance all 19 steps
    if (role === 'admin') {
      return true;
    }
    // Step 1: นักวิจัยเข้าสู่ระบบ (researcher, dept_secretary)
    // Step 2: ยื่นคำขอ / ร่างคำขอ (researcher, dept_secretary)
    // Step 3: เจ้าหน้าที่ตรวจสอบ (coordinator)
    // Step 4: ส่งคืนแก้ไข / แจ้งผลการตรวจสอบ (coordinator)
    // Step 5: นักวิจัยดาวน์โหลดเอกสารขออนุมัติเงินรางวัล (researcher, dept_secretary, coordinator)
    // Step 6: เสนอบันทึกข้อความพร้อมเอกสารแนบ (researcher, dept_secretary, coordinator)
    // Step 7: งานวิจัยตรวจความครบถ้วน (coordinator)
    // Step 8: งานวิจัยเสนอผู้บริหารอนุมัติรางวัล / ค่าตีพิมพ์ (coordinator)
    // Step 9: บันทึกข้อมูลงบประมาณ (coordinator, finance)
    // Step 10: ตรวจเช็คงบประมาณ (finance, coordinator)
    // Step 11: ผู้บริหารลงนามและอนุมัติตามลำดับ (executive, coordinator)
    // Step 12: แจ้งผลการอนุมัติ (coordinator)
    // Step 13: นักวิจัยดาวน์โหลดเอกสารขออนุมัติเบิกเงินรางวัล (researcher, dept_secretary, coordinator)
    // Step 14: งานวิจัยตรวจความครบถ้วน (coordinator)
    // Step 15: งานวิจัยเสนอผู้บริหารอนุมัติเบิกเงินรางวัล / ค่าตีพิมพ์ (coordinator)
    // Step 16: ผู้บริหารลงนามและอนุมัติตามลำดับ (executive, coordinator)
    // Step 17: จัดทำฎีกาส่งเบิกเงิน (finance, coordinator)
    // Step 18: โอนเงินเข้าบัญชีนักวิจัย (finance)
    // Step 19: ตรวจสอบผลการโอนเงิน (researcher, coordinator)

    if (role === 'finance') {
      return step === 9 || step === 10 || step === 17 || step === 18;
    }
    if (role === 'executive') {
      return step === 11 || step === 16;
    }
    if (role === 'coordinator') {
      return (step >= 3 && step <= 12) || (step >= 14 && step <= 18);
    }
    if (role === 'dept_secretary') {
      return (isSameDept || isMyApp) && (step === 1 || step === 2 || step === 5 || step === 6 || step === 13);
    }
    if (role === 'researcher') {
      return isMyApp && (step === 1 || step === 2 || step === 5 || step === 6 || step === 13 || step === 19);
    }
    return false;
  };

  const isAllowedToAdvance = canEdit && isRoleAuthorizedForCurrentStep(currentStepNumber, currentRole as UserRole);

  const handleNextStep = () => {
    if (currentStepNumber < 19 && isAllowedToAdvance) {
      const nextStep = (currentStepNumber + 1) as WorkflowStepId;
      onAdvanceStep(application.id, nextStep, officerNote);
      setOfficerNote('');
    }
  };

  const canReturnToDraft =
    Boolean(onReturnToDraft) &&
    application.status !== 'draft' &&
    application.status !== 'paid' &&
    (currentRole === 'admin' ||
      currentRole === 'coordinator' ||
      (currentRole === 'dept_secretary' && (isSameDept || isMyApp)) ||
      (currentRole === 'researcher' && isMyApp));

  const getRoleBadgeStyle = (roleKey: string) => {
    switch (roleKey) {
      case 'researcher':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'research-office':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'policy-plan':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
      case 'finance':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
      case 'executives':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const phases = [
    { 
      phaseNumber: 1, 
      title: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์', 
      range: 'ขั้นตอนที่ 1 - 4', 
      steps: WORKFLOW_19_STEPS_DEF.filter(s => s.phase === 1), 
      badgeBg: 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800' 
    },
    { 
      phaseNumber: 2, 
      title: 'ระยะที่ 2: การเสนอขออนุมัติหลักการและกรอบงบประมาณ', 
      range: 'ขั้นตอนที่ 5 - 12', 
      steps: WORKFLOW_19_STEPS_DEF.filter(s => s.phase === 2), 
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
    },
    { 
      phaseNumber: 3, 
      title: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี', 
      range: 'ขั้นตอนที่ 13 - 19', 
      steps: WORKFLOW_19_STEPS_DEF.filter(s => s.phase === 3), 
      badgeBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800' 
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                {application.trackingNo}
              </span>
              <span className="text-xs text-slate-400">ปีงบประมาณ {application.fiscalYear}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-prompt flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400 shrink-0" />
              <span>ไทม์ไลน์ติดตามกระบวนการ 19 ขั้นตอน (Official 19-Step Workflow Tracker)</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {canReturnToDraft && (
              <button
                onClick={() => {
                  if (window.confirm(`ต้องการส่งคืนคำขอ ${application.trackingNo} ย้อนกลับไปไว้ใน "รายการเตรียมเบิก" เพื่อแก้ไขหรือไม่?`)) {
                    onReturnToDraft?.(application);
                  }
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="ส่งคืนคำขอนี้กลับไปที่รายการเตรียมเบิกเพื่อแก้ไขข้อมูล"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ส่งคืนเพื่อแก้ไข</span>
              </button>
            )}

            <button
              onClick={() => onPrint(application)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 text-xs text-slate-800 dark:text-slate-100">
          
          {/* Project Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{application.applicantName}</div>
                <div className="text-slate-600 dark:text-slate-400">{application.department} • เบอร์ภายใน {application.phone || '5761'}</div>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-slate-500 dark:text-slate-400 text-[11px] block">ยอดเงินขออนุมัติ:</span>
                <span className="text-lg font-bold text-blue-900 dark:text-amber-400 font-prompt">
                  {formatBaht(application.totalClaimedAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400">บทความ: </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{application.articleTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">วารสาร: </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{application.journalName} ({application.quartile})</span>
              </div>
            </div>

            {/* Official Registration Numbers */}
            <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
              {application.internalDocNo && (
                <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">
                  เลขที่บันทึกขออนุมัติ: {application.internalDocNo}
                </span>
              )}
              {application.researchDocRecNo && (
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-300">
                  เลขรับงานวิจัย: {application.researchDocRecNo}
                </span>
              )}
              {application.financeDocRecNo && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded text-indigo-800 dark:text-indigo-300">
                  เลขรับการเงิน: {application.financeDocRecNo}
                </span>
              )}
              {application.disbursementVoucherNo && (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 font-bold">
                  เลขที่ฎีกา: {application.disbursementVoucherNo}
                </span>
              )}
            </div>
          </div>

          {/* Current Active Step Banner */}
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                {currentStepNumber}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-amber-950 dark:text-amber-200 text-sm sm:text-base font-prompt">
                    ขั้นตอนปัจจุบัน: {currentStepDef?.title}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-900 border border-amber-300">
                    {currentStepDef?.phaseTitle.split(':')[0]}
                  </span>
                  {currentStepDef?.actionNote && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      🎯 {currentStepDef.actionNote}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm">
                  ผู้รับผิดชอบหลัก: <strong className="text-slate-800 dark:text-slate-200">{currentStepDef?.responsibleParty}</strong> • {currentStepDef?.description}
                </p>
                {currentStepDef?.isFeedbackLoop && (
                  <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-900/40 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700 mt-0.5">
                    <Repeat className="w-3 h-3 text-amber-600" />
                    <span>จุดตัดสินใจ: หากเอกสารไม่สมบูรณ์เจ้าหน้าที่จะส่งคืนแก้ไข (Feedback Loop) ย้อนไปขั้นตอนที่ 2</span>
                  </div>
                )}
              </div>
            </div>

            {/* If paid, view transfer */}
            {application.status === 'paid' && (
              <button
                onClick={() => onVerifyPayment(application)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-colors cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>ดูหลักฐานโอนเงิน</span>
              </button>
            )}
          </div>

          {/* 19-Step Official Progress Timeline Grouped by 3 Phases */}
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base font-prompt border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>ความคืบหน้ากระบวนการ 19 ขั้นตอน</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-normal">
                  (5 ฝ่าย • 3 ระยะ • 1 วงรอบส่งคืน)
                </span>
              </span>
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                ขั้นตอนที่ {currentStepNumber} จาก 19
              </span>
            </h3>

            {phases.map((phase) => (
              <div key={phase.phaseNumber} className="space-y-3">
                {/* Phase Header */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${phase.badgeBg}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center font-bold text-[11px] shadow-2xs">
                      {phase.phaseNumber}
                    </span>
                    <span>{phase.title}</span>
                  </div>
                  <span className="text-[11px] font-normal opacity-85">{phase.range}</span>
                </div>

                {/* Steps in Phase */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {phase.steps.map((step) => {
                    const isPassed = step.stepNumber < currentStepNumber;
                    const isCurrent = step.stepNumber === currentStepNumber;

                    // Find step info from application timeline if available
                    const stepRecord = application.timeline?.find((s) => s.stepNumber === step.stepNumber);

                    return (
                      <div key={step.stepNumber} className="relative group">
                        {/* Step Circle Indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                            isPassed
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-amber-500 border-amber-600 text-slate-950 ring-4 ring-amber-100 dark:ring-amber-900/40 shadow-xs'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <span>{step.stepNumber}</span>
                          )}
                        </div>

                        {/* Step Card Content */}
                        <div
                          className={`p-3.5 rounded-xl border transition-all ${
                            isCurrent
                              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700 shadow-xs'
                              : isPassed
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              : 'bg-slate-50/50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  isCurrent 
                                    ? 'text-amber-950 dark:text-amber-200 font-prompt' 
                                    : isPassed 
                                    ? 'text-slate-900 dark:text-white' 
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {step.title}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${getRoleBadgeStyle(step.roleKey)}`}>
                                {step.responsibleParty}
                              </span>
                              {step.actionNote && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {step.actionNote}
                                </span>
                              )}
                              {step.isFeedbackLoop && (
                                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 flex items-center gap-1 font-semibold">
                                  <Repeat className="w-2.5 h-2.5" /> Loop
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px]">
                              {stepRecord?.completedAt ? (
                                <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{stepRecord.completedAt}</span>
                                </span>
                              ) : isCurrent ? (
                                <span className="text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>กำลังดำเนินการ</span>
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                            {step.description}
                          </p>

                          {stepRecord?.notes && (
                            <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>หมายเหตุ: {stepRecord.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Officer Advance Controls (for Authorized Roles) */}
          {canEdit && currentStepNumber < 19 && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-300 dark:border-slate-700 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white font-prompt flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>ส่วนงานเจ้าหน้าที่: ตรวจสอบและส่งต่องานตามลำดับ (Step-by-Step)</span>
                </div>
                <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                  สิทธิ์ผู้ใช้งานปัจจุบัน: <strong className="text-blue-900 dark:text-amber-400 uppercase">{currentRole}</strong>
                </span>
              </div>

              {!isAllowedToAdvance ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">จำกัดสิทธิ์ตามระเบียบ: </span>
                    <span>
                      ขั้นตอนที่ {currentStepNumber} ({currentStepDef?.title}) อยู่ในความรับผิดชอบของ <strong>{currentStepDef?.responsibleParty}</strong> ท่านเข้าสู่ระบบในบทบาท <strong className="uppercase">{currentRole}</strong> จึงไม่สามารถกดยืนยันขั้นตอนนี้ได้ (กรุณาสลับสิทธิ์มุมขวาบนให้ถูกต้อง)
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="บันทึกข้อความเพิ่มเติม หรือเลขรับเรื่อง..."
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                  <button
                    onClick={handleNextStep}
                    disabled={!isAllowedToAdvance}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                  >
                    <span>ผ่านขั้นตอนที่ {currentStepNumber} &rarr; ไปขั้นตอนที่ {currentStepNumber + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStepNumber === 19 && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-sm font-prompt">
                  กระบวนการขอรับเงินรางวัลและค่าตีพิมพ์เสร็จสมบูรณ์เรียบร้อยแล้ว (Complete)
                </span>
              </div>
              {application.status === 'paid' && (
                <button
                  onClick={() => onVerifyPayment(application)}
                  className="px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs hover:bg-emerald-800 transition-colors cursor-pointer"
                >
                  หลักฐานการโอนเงิน
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
