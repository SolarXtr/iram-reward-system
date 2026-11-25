import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
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
  WORKFLOW_19_STEPS_DEF,
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

  const currentStepNumber = normalizeWorkflowStep(application?.currentStep ?? 1);
  const currentStepDef = getWorkflow19StepDef(currentStepNumber);
  const activePhase = currentStepDef?.phase || 1;

  // Auto-expand the phase containing the current step and scroll it into view when step changes
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
  }, [isOpen, application?.id, currentStepNumber, activePhase]);

  if (!isOpen || !application) return null;

  const isMyApp = Boolean(
    (currentUser?.email && application.email && application.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser?.name && application.applicantName && application.applicantName.toLowerCase() === currentUser.name.toLowerCase())
  );

  const isSameDept = isSameDepartment(currentUser?.department, application.department);

  const isRoleAuthorizedForCurrentStep = (step: number, role: UserRole): boolean => {
    if (role === 'admin') return true;
    if (role === 'finance') return step === 9 || step === 10 || step === 17 || step === 18;
    if (role === 'executive') return step === 11 || step === 16;
    if (role === 'coordinator') return (step >= 3 && step <= 12) || (step >= 14 && step <= 18);
    if (role === 'dept_secretary') {
      return (isSameDept || isMyApp) && (step === 1 || step === 2 || step === 5 || step === 6 || step === 13);
    }
    if (role === 'researcher') {
      return isMyApp && (step === 1 || step === 2 || step === 5 || step === 6 || step === 13 || step === 19);
    }
    return false;
  };

  const isAllowedToAdvance = canEdit && isRoleAuthorizedForCurrentStep(currentStepNumber, currentRole as UserRole);
  const isActuallyPaid =
    application.paymentStatus === 'transferred' ||
    (application.status === 'paid' && currentStepNumber >= 18);

  const handleNextStep = () => {
    if (currentStepNumber < 19 && isAllowedToAdvance) {
      const nextStep = (currentStepNumber + 1) as WorkflowStepId;
      onAdvanceStep(application.id, nextStep, officerNote.trim() || undefined);
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
      range: '1 - 4',
      steps: WORKFLOW_19_STEPS_DEF.filter((s) => s.phase === 1),
      accentClass: 'bg-sky-50/80 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 border-sky-200 dark:border-sky-800',
    },
    {
      phaseNumber: 2,
      title: 'ระยะที่ 2: การเสนอขออนุมัติหลักการและกรอบงบประมาณ',
      range: '5 - 12',
      steps: WORKFLOW_19_STEPS_DEF.filter((s) => s.phase === 2),
      accentClass: 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800',
    },
    {
      phaseNumber: 3,
      title: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
      range: '13 - 19',
      steps: WORKFLOW_19_STEPS_DEF.filter((s) => s.phase === 3),
      accentClass: 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800',
    },
  ];

  const togglePhase = (phaseNumber: number) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseNumber]: !prev[phaseNumber] }));
  };

  const progressPercent = Math.round((currentStepNumber / 19) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Compact Header */}
        <div className="bg-slate-900 px-4 sm:px-5 py-3.5 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                {application.trackingNo}
              </span>
              <span className="text-[11px] text-slate-400">ปีงบประมาณ {application.fiscalYear}</span>
              <span className="text-[11px] font-semibold text-amber-400">• ขั้นตอนที่ {currentStepNumber}/19</span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white font-prompt flex items-center gap-2 mt-1 truncate">
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">ไทม์ไลน์ติดตามกระบวนการ 19 ขั้นตอน</span>
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

          {/* Official Doc Badges (shown only if present) */}
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
                  {currentStepNumber}
                </span>
                <span className="font-bold text-slate-900 dark:text-white truncate font-prompt">
                  {currentStepDef?.title}
                </span>
                <span className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.2 rounded-full border font-medium shrink-0 ${getRoleBadgeStyle(currentStepDef?.roleKey || '')}`}>
                  {currentStepDef?.responsibleParty}
                </span>
              </div>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 shrink-0 ml-2">
                {progressPercent}% ({currentStepNumber}/19)
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

        {/* Scrollable 3-Phase Compact Timeline */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-3.5 space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
          {phases.map((phase) => {
            const isExpanded = Boolean(expandedPhases[phase.phaseNumber]);
            const passedInPhase = phase.steps.filter((s) => s.stepNumber < currentStepNumber).length;
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
                    ขั้นตอน {phase.range}
                  </span>
                </button>

                {/* Compact Step Rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {phase.steps.map((step) => {
                      const isPassed = step.stepNumber < currentStepNumber;
                      const isCurrent = step.stepNumber === currentStepNumber;
                      const stepRecord = application.timeline?.find((s) => s.stepNumber === step.stepNumber);

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
                            <div className="flex items-center gap-2.5 min-w-0">
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

                              {step.isFeedbackLoop && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 text-[9.5px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                                  <Repeat className="w-2.5 h-2.5" /> Loop
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
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

                          {/* Show description ONLY for current step to keep modal compact */}
                          {isCurrent && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 pl-7 leading-snug">
                              {step.description}
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

        {/* Sticky Footer: Officer Step-by-Step Advance Controls (Always visible, no scrolling needed) */}
        <div className="px-4 sm:px-5 py-3 bg-slate-100 dark:bg-slate-800/95 border-t border-slate-300 dark:border-slate-700 shrink-0 space-y-2">
          {canEdit && currentStepNumber < 19 ? (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-800 dark:text-white font-prompt flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                  <span>ส่วนงานเจ้าหน้าที่: ตรวจสอบและส่งต่องานตามลำดับ (Step-by-Step)</span>
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  สิทธิ์: <strong className="text-blue-900 dark:text-amber-400 uppercase">{currentRole}</strong>
                </span>
              </div>

              {!isAllowedToAdvance ? (
                <div className="px-3 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    ขั้นตอนที่ {currentStepNumber} ({currentStepDef?.title}) อยู่ในความรับผิดชอบของ <strong>{currentStepDef?.responsibleParty}</strong> (สิทธิ์ปัจจุบัน <strong className="uppercase">{currentRole}</strong> ไม่สามารถกดยืนยันขั้นตอนนี้ได้)
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder={`หมายเหตุสำหรับขั้นตอนที่ ${currentStepNumber} (ถ้ามี)...`}
                    value={officerNote}
                    onChange={(e) => setOfficerNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNextStep();
                    }}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 cursor-pointer"
                  >
                    <span>ผ่านขั้นตอนที่ {currentStepNumber} &rarr; ไปขั้นตอนที่ {currentStepNumber + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : currentStepNumber === 19 ? (
            <div className="flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-xs sm:text-sm font-prompt">
                  กระบวนการขอรับเงินรางวัลและค่าตีพิมพ์เสร็จสมบูรณ์แล้ว (19/19)
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
