import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  ShieldCheck,
  Printer,
  Banknote,
  MessageSquare,
  RotateCcw,
  Layers,
  Repeat,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { UserRole } from './Header';
import { ResearchApplication, UserProfile, WorkflowStepId } from '../types';
import { formatBaht } from '../data/regulations';
import {
  WORKFLOW_12_ACTION_STEPS_DEF,
  getActionStepFrom19,
  getCanonical19StepForAction,
  getActionStepDef,
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
  canEdit: boolean;
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
  const [officerNote, setOfficerNote] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });
  const activeStepRef = useRef<HTMLDivElement | null>(null);

  const ref19Step = normalizeWorkflowStep(application?.currentStep ?? 1);
  const currentActionStep = getActionStepFrom19(ref19Step);
  const currentStepDef = getActionStepDef(currentActionStep);
  const activePhase = currentStepDef.phase;

  // Auto-expand the phase containing the current action step and scroll it into view when step changes
  useEffect(() => {
    if (!isOpen || !application) return;
    setExpandedPhases({
      1: activePhase === 1,
      2: activePhase === 2,
      3: activePhase === 3,
    });
    const timer = setTimeout(() => {
      activeStepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
    return () => clearTimeout(timer);
  }, [isOpen, application?.id, currentActionStep, activePhase]);

  if (!isOpen || !application) return null;

  const isMyApp = Boolean(
    (currentUser?.email && application.email && application.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && application.applicantName && application.applicantName.toLowerCase() === currentUser.name.toLowerCase())
  );

  const isSameDept = isSameDepartment(currentUser?.department, application.department);

  // Role authorization mapped to the 12 Action Steps
  const isRoleAuthorizedForActionStep = (actionStep: number, role: UserRole): boolean => {
    if (role === 'admin') return true;
    // Action 1 (1-2): ยื่นคำขอ (researcher, dept_secretary)
    // Action 2 (3-4): งานวิจัยตรวจสอบ (coordinator)
    // Action 3 (5-6): นักวิจัยพิมพ์และนำส่งเอกสารขออนุมัติ (researcher, dept_secretary, coordinator)
    // Action 4 (7-8): งานวิจัยตรวจรับแฟ้มและส่งต่อแผน (coordinator)
    // Action 5 (9): จนท. นโยบายและแผนบันทึกงบ (coordinator, finance)
    // Action 6 (10): การเงินตรวจเช็คงบประมาณ (finance, coordinator)
    // Action 7 (11-12): ผู้บริหารอนุมัติหลักการ (executive, coordinator)
    // Action 8 (13): นักวิจัยจัดทำชุดเอกสารขอเบิก (researcher, dept_secretary, coordinator)
    // Action 9 (14-15): งานวิจัยตรวจเอกสารเบิกและเสนอผู้บริหาร (coordinator)
    // Action 10 (16): ผู้บริหารลงนามอนุมัติเบิกจ่าย (executive, coordinator)
    // Action 11 (17): การเงินจัดทำฎีกาส่งเบิกเงิน (finance, coordinator)
    // Action 12 (18-19): โอนเงินเข้าบัญชีนักวิจัยและปิดงาน (finance)
    if (role === 'finance') return actionStep === 5 || actionStep === 6 || actionStep === 11 || actionStep === 12;
    if (role === 'executive') return actionStep === 7 || actionStep === 10;
    if (role === 'coordinator') return actionStep >= 2 && actionStep <= 11;
    if (role === 'dept_secretary') {
      return (isSameDept || isMyApp) && (actionStep === 1 || actionStep === 3 || actionStep === 8);
    }
    if (role === 'researcher') {
      return isMyApp && (actionStep === 1 || actionStep === 3 || actionStep === 8 || actionStep === 12);
    }
    return false;
  };

  // Role authorization for stepping BACKWARD by 1 action step
  const isRoleAuthorizedToRevertActionStep = (actionStep: number, role: UserRole): boolean => {
    if (actionStep <= 1) return false;
    if (role === 'admin') return true;
    if (role === 'finance') {
      // เจ้าหน้าที่การเงิน: ย้อนกลับได้ตามสิทธิ์ของงานการเงิน (ขั้น 5, 6, 11, 12 และย้อนจาก 7 กลับ 6 หากเพิ่งผ่านขั้น 6)
      return actionStep === 5 || actionStep === 6 || actionStep === 7 || actionStep === 11 || actionStep === 12;
    }
    if (role === 'coordinator') {
      // เจ้าหน้าที่งานวิจัย: ย้อนกลับได้ในช่วงขั้น 2..11 (ไม่อนุญาตให้ย้อนขั้น 12 โอนเงินแล้ว ซึ่งเป็นสิทธิ์งานการเงิน/ผู้ดูแลระบบ)
      return actionStep >= 2 && actionStep <= 11;
    }
    if (role === 'executive') {
      return actionStep === 7 || actionStep === 8 || actionStep === 10 || actionStep === 11;
    }
    if (role === 'dept_secretary') {
      return (isSameDept || isMyApp) && (actionStep === 2 || actionStep === 4 || actionStep === 9);
    }
    return false;
  };

  const isAllowedToAdvance = canEdit && currentActionStep < 12 && isRoleAuthorizedForActionStep(currentActionStep, currentRole as UserRole);
  const isAllowedToRevert = canEdit && currentActionStep > 1 && isRoleAuthorizedToRevertActionStep(currentActionStep, currentRole as UserRole);
  const prevStepDef = currentActionStep > 1 ? getActionStepDef(currentActionStep - 1) : null;
  const isActuallyPaid =
    application.paymentStatus === 'transferred' ||
    (application.status === 'paid' && ref19Step >= 18);

  const handleNextStep = () => {
    if (currentActionStep < 12 && isAllowedToAdvance) {
      const nextCanonical19Step = getCanonical19StepForAction(currentActionStep + 1);
      onAdvanceStep(application.id, nextCanonical19Step, officerNote.trim() || undefined);
      setOfficerNote('');
    }
  };

  const handlePrevStep = () => {
    if (currentActionStep > 1 && isAllowedToRevert && prevStepDef) {
      const confirmMsg =
        currentActionStep === 12
          ? `ต้องการย้อนกลับขั้นตอนจาก "ขั้นที่ 12/12 (${currentStepDef.title})" กลับไปยัง "ขั้นที่ 11/12 (${prevStepDef.title})" และปรับสถานะการโอนเงินกลับเป็นรอโอน ใช่หรือไม่?`
          : `ต้องการย้อนกลับ 1 ขั้นตอน จาก "ขั้นที่ ${currentActionStep}/12 (${currentStepDef.title})" กลับไปยัง "ขั้นที่ ${currentActionStep - 1}/12 (${prevStepDef.title})" ใช่หรือไม่?`;
      if (!window.confirm(confirmMsg)) return;
      const prevCanonical19Step = getCanonical19StepForAction(currentActionStep - 1);
      onAdvanceStep(application.id, prevCanonical19Step, officerNote.trim() || undefined);
      setOfficerNote('');
    }
  };

  const canReturnToDraft =
    Boolean(onReturnToDraft) &&
    application.status !== 'draft' &&
    !isActuallyPaid &&
    (currentRole === 'admin' ||
      currentRole === 'coordinator' ||
      (currentRole === 'dept_secretary' && (isSameDept || isMyApp)) ||
      (currentRole === 'researcher' && isMyApp));

  const getRoleBadgeStyle = (roleKey: string) => {
    switch (roleKey) {
      case 'researcher':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'research-office':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'policy-plan':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
      case 'finance':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800';
      case 'executives':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const phases = [
    {
      phaseNumber: 1,
      title: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์',
      range: 'ขั้นที่ 1–2/12 (อ้างอิง 1–4)',
      steps: WORKFLOW_12_ACTION_STEPS_DEF.filter((s) => s.phase === 1),
      accentClass: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    },
    {
      phaseNumber: 2,
      title: 'ระยะที่ 2: การเสนอขออนุมัติหลักการและกรอบงบประมาณ',
      range: 'ขั้นที่ 3–7/12 (อ้างอิง 5–12)',
      steps: WORKFLOW_12_ACTION_STEPS_DEF.filter((s) => s.phase === 2),
      accentClass: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    },
    {
      phaseNumber: 3,
      title: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
      range: 'ขั้นที่ 8–12/12 (อ้างอิง 13–19)',
      steps: WORKFLOW_12_ACTION_STEPS_DEF.filter((s) => s.phase === 3),
      accentClass: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    },
  ];

  const togglePhase = (phaseNumber: number) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseNumber]: !prev[phaseNumber] }));
  };

  const progressPercent = Math.round((currentActionStep / 12) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Compact Header */}
        <div className="bg-slate-900 px-4 sm:px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                {application.trackingNo}
              </span>
              <span className="text-[11px] text-slate-400">ปีงบประมาณ {application.fiscalYear}</span>
              <span className="text-[11px] font-semibold text-amber-400">
                • ขั้นตอนที่ {currentActionStep}/12 (อ้างอิง 19 ขั้นตอน: {currentStepDef.refSteps})
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white font-prompt flex items-center gap-2 mt-1 truncate">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">ไทม์ไลน์ติดตามกระบวนการ 12 ขั้นตอนปฏิบัติงาน (อ้างอิง 1–19)</span>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canReturnToDraft && (
              <button
                onClick={() => {
                  if (window.confirm(`ต้องการส่งคืนคำขอ ${application.trackingNo} ย้อนกลับไปไว้ใน "รายการเตรียมเบิก" เพื่อแก้ไขหรือไม่?`)) {
                    onReturnToDraft?.(application);
                  }
                }}
                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-sm transition-colors cursor-pointer"
                title="ส่งคืนคำขอนี้กลับไปที่รายการเตรียมเบิกเพื่อแก้ไขข้อมูล"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ส่งคืนแก้ไข</span>
              </button>
            )}

            <button
              onClick={() => onPrint(application)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Compact Top Summary & Progress Bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-2.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
            <div className="min-w-0">
              <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                {application.applicantName}
                <span className="font-normal text-xs text-slate-500 dark:text-slate-400 ml-2">
                  ({application.department})
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                {application.articleTitle} • <span className="font-medium">{application.journalName} ({application.quartile})</span>
              </div>
            </div>
            <div className="flex items-center sm:flex-col sm:items-end justify-between shrink-0">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">ยอดเงินขออนุมัติ</span>
              <span className="text-base font-bold text-blue-900 dark:text-amber-400 font-prompt">
                {formatBaht(application.totalClaimedAmount)}
              </span>
            </div>
          </div>

          {/* Official Doc Badges */}
          {(application.internalDocNo || application.researchDocRecNo || application.financeDocRecNo || application.disbursementVoucherNo) && (
            <div className="flex flex-wrap gap-1.5 text-[10px]">
              {application.internalDocNo && (
                <span className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-slate-700 dark:text-slate-300">
                  บันทึก: {application.internalDocNo}
                </span>
              )}
              {application.researchDocRecNo && (
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded text-blue-800 dark:text-blue-300">
                  รับงานวิจัย: {application.researchDocRecNo}
                </span>
              )}
              {application.financeDocRecNo && (
                <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded text-indigo-800 dark:text-indigo-300">
                  รับการเงิน: {application.financeDocRecNo}
                </span>
              )}
              {application.disbursementVoucherNo && (
                <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-800 dark:text-emerald-300 font-bold">
                  ฎีกา: {application.disbursementVoucherNo}
                </span>
              )}
            </div>
          )}

          {/* Progress Bar + Active Step Pill */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] shrink-0">
                  {currentActionStep}
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate font-prompt">
                  {currentStepDef.title}
                </span>
                <span className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded-full border font-medium shrink-0 ${getRoleBadgeStyle(currentStepDef.roleKey)}`}>
                  {currentStepDef.responsibleParty}
                </span>
                <span className="hidden md:inline-flex text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono shrink-0">
                  SLA: {currentStepDef.slaDays}
                </span>
              </div>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0 ml-2">
                {progressPercent}% ({currentActionStep}/12)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isActuallyPaid ? 'bg-emerald-600' : 'bg-amber-500'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable 3-Phase Compact 12-Step Timeline */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
          {phases.map((phase) => {
            const isExpanded = Boolean(expandedPhases[phase.phaseNumber]);
            const passedInPhase = phase.steps.filter((s) => s.stepNumber < currentActionStep).length;
            const isPhaseDone = passedInPhase === phase.steps.length;
            const hasCurrent = phase.phaseNumber === activePhase;

            return (
              <div
                key={phase.phaseNumber}
                className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
              >
                {/* Collapsible Phase Header */}
                <button
                  type="button"
                  onClick={() => togglePhase(phase.phaseNumber)}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left border-b transition-colors cursor-pointer ${
                    isExpanded ? 'border-slate-200 dark:border-slate-800' : 'border-transparent'
                  } ${phase.accentClass}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 shrink-0 opacity-75" />
                    ) : (
                      <ChevronRight className="w-4 h-4 shrink-0 opacity-75" />
                    )}
                    <span className="font-bold truncate font-prompt">{phase.title}</span>
                    {hasCurrent && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[10px] font-bold shrink-0">
                        กำลังดำเนินการ
                      </span>
                    )}
                    {isPhaseDone && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-semibold shrink-0">
                        ครบแล้ว
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono opacity-80 shrink-0 ml-2">
                    {phase.range}
                  </span>
                </button>

                {/* Compact Step Rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {phase.steps.map((step) => {
                      const isPassed = step.stepNumber < currentActionStep;
                      const isCurrent = step.stepNumber === currentActionStep;
                      const stepRecord = application.timeline?.find((s) => s.stepNumber === step.canonical19Step);

                      return (
                        <div
                          key={step.stepNumber}
                          ref={isCurrent ? activeStepRef : undefined}
                          className={`px-3 py-2 transition-colors ${
                            isCurrent
                              ? 'bg-amber-50/90 dark:bg-amber-950/30 border-l-4 border-l-amber-500'
                              : isPassed
                              ? 'bg-white dark:bg-slate-900'
                              : 'bg-slate-50/40 dark:bg-slate-900/40 opacity-65'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isPassed
                                    ? 'bg-emerald-600 text-white'
                                    : isCurrent
                                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-200 dark:ring-amber-900'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }`}
                              >
                                {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.stepNumber}
                              </div>

                              <span
                                className={`truncate ${
                                  isCurrent
                                    ? 'font-bold text-amber-950 dark:text-amber-200 font-prompt'
                                    : isPassed
                                    ? 'font-medium text-slate-800 dark:text-slate-200'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {step.title}
                              </span>

                              <span className="hidden md:inline-flex text-[9.5px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">
                                อ้างอิง {step.refSteps}
                              </span>

                              {step.isFeedbackLoop && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                  <Repeat className="w-2.5 h-2.5" /> Loop
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="hidden lg:inline-flex text-[10px] text-slate-500 font-mono">
                                {step.slaDays}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full border font-medium ${getRoleBadgeStyle(step.roleKey)}`}>
                                {step.responsibleParty}
                              </span>
                              {stepRecord?.completedAt ? (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono hidden sm:inline-flex items-center gap-0.5">
                                  <Calendar className="w-3 h-3" />
                                  {stepRecord.completedAt}
                                </span>
                              ) : isCurrent ? (
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold hidden sm:inline-flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  ปัจจุบัน
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {isCurrent && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-7 leading-snug">
                              {step.description} <span className="text-slate-500 font-mono">(SLA: {step.slaDays})</span>
                            </p>
                          )}

                          {stepRecord?.notes && (
                            <div className="mt-1 ml-7 px-2 py-1 bg-slate-100/80 dark:bg-slate-800 rounded text-[10.5px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <MessageSquare className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>หมายเหตุ: {stepRecord.notes}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky Footer: Officer Step-by-Step Advance & 1-Step Revert Controls */}
        <div className="px-4 sm:px-5 py-3 bg-slate-100 dark:bg-slate-800/95 border-t border-slate-300 dark:border-slate-700 shrink-0 space-y-2">
          {canEdit && currentActionStep < 12 ? (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 dark:text-white font-prompt flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>ส่วนงานเจ้าหน้าที่: ปรับขั้นตอนทีละ 1 ขั้นตอน (เดินหน้า / ย้อนกลับตามสิทธิ์)</span>
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  สิทธิ์: <strong className="text-blue-900 dark:text-amber-400 uppercase">{currentRole}</strong>
                </span>
              </div>

              {!isAllowedToAdvance && (
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    ขั้นตอนที่ {currentActionStep}/12 ({currentStepDef.title}) อยู่ในความรับผิดชอบของ <strong>{currentStepDef.responsibleParty}</strong> (สิทธิ์ปัจจุบัน <strong className="uppercase">{currentRole}</strong> ไม่สามารถกดยืนยันไปขั้นถัดไปได้{isAllowedToRevert ? ' — แต่สามารถย้อนกลับ 1 ขั้นตอนได้' : ''})
                  </span>
                </div>
              )}

              {(isAllowedToAdvance || isAllowedToRevert) && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder={`หมายเหตุสำหรับขั้นตอนที่ ${currentActionStep}/12 (ถ้ามี)...`}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && isAllowedToAdvance) handleNextStep();
                    }}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    {isAllowedToRevert && (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-xs transition-colors shrink-0 cursor-pointer"
                        title={`ย้อนกลับ 1 ขั้นตอนไปยังขั้นตอนที่ ${currentActionStep - 1}/12 (${prevStepDef?.title || ''})`}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>ย้อนกลับขั้นที่ {currentActionStep - 1}</span>
                      </button>
                    )}
                    {isAllowedToAdvance && (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                      >
                        <span>ผ่านขั้นตอนที่ {currentActionStep} &rarr; ไปขั้นตอนที่ {currentActionStep + 1}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : currentActionStep === 12 ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm font-prompt">
                    กระบวนการขอรับเงินรางวัลและค่าตีพิมพ์เสร็จสมบูรณ์แล้ว (12/12 • อ้างอิง 18–19/19)
                  </span>
                </div>
                {isActuallyPaid && (
                  <button
                    type="button"
                    onClick={() => onVerifyPayment(application)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>ดูหลักฐานโอนเงิน</span>
                  </button>
                )}
              </div>

              {isAllowedToRevert && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <input
                    type="text"
                    placeholder="ระบุเหตุผลในการย้อนกลับขั้นตอนที่ 12 → 11 (ถ้ามี)..."
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-700 shadow-xs transition-colors shrink-0 cursor-pointer"
                    title="ย้อนกลับ 1 ขั้นตอนไปยังขั้นตอนที่ 11/12 (การเงินจัดทำฎีกาส่งเบิกเงิน)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>ย้อนกลับขั้นที่ 12 &rarr; ขั้นที่ 11</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>ดูรายละเอียดความคืบหน้า (สิทธิ์ผู้ชมเท่านั้น)</span>
              {isActuallyPaid && (
                <button
                  type="button"
                  onClick={() => onVerifyPayment(application)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>ดูหลักฐานโอนเงิน</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
