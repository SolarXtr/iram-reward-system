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
  MessageSquare
} from 'lucide-react';
import { UserRole } from './Header';
import { ResearchApplication, WorkflowStepId } from '../types';
import { formatBaht } from '../data/regulations';
import { OFFICIAL_WORKFLOW_STEPS_DEF } from '../data/initialData';

interface TimelineTrackerModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStep: (id: string, nextStep: WorkflowStepId, note?: string) => void;
  onPrint: (app: ResearchApplication) => void;
  onVerifyPayment: (app: ResearchApplication) => void;
  canEdit: boolean; // if staff/coordinator/finance
  currentRole?: UserRole;
}

export const TimelineTrackerModal: React.FC<TimelineTrackerModalProps> = ({
  application,
  isOpen,
  onClose,
  onAdvanceStep,
  onPrint,
  onVerifyPayment,
  canEdit,
  currentRole = 'coordinator',
}) => {
  if (!isOpen || !application) return null;

  const [officerNote, setOfficerNote] = useState('');

  const currentStepDef = OFFICIAL_WORKFLOW_STEPS_DEF.find(
    (s) => s.stepNumber === application.currentStep
  );

  // Determine if the current active role is authorized to advance the current step
  const isRoleAuthorizedForCurrentStep = (step: number, role: UserRole): boolean => {
    // Admin has full authorization to manage and advance all 12 steps
    if (role === 'admin') {
      return true;
    }
    // Step 1: Researcher (Submit)
    // Step 2, 4, 6, 9, 12: Coordinator
    // Step 3: Researcher (Sign & Attach) - coordinator can assist/advance
    // Step 5, 8: Admin/Dean - coordinator advances on their behalf
    // Step 7: Planning/Finance (budget check) - coordinator or finance
    // Step 10, 11: Finance
    if (role === 'finance') {
      return step === 7 || step === 10 || step === 11;
    }
    if (role === 'coordinator') {
      return step >= 2 && step <= 9; // steps managed by coordinator
    }
    if (role === 'researcher') {
      return step === 1 || step === 3;
    }
    return false;
  };

  const isAllowedToAdvance = canEdit && isRoleAuthorizedForCurrentStep(application.currentStep, currentRole as UserRole);

  const handleNextStep = () => {
    if (application.currentStep < 12 && isAllowedToAdvance) {
      const nextStep = (application.currentStep + 1) as WorkflowStepId;
      onAdvanceStep(application.id, nextStep, officerNote);
      setOfficerNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                {application.trackingNo}
              </span>
              <span className="text-xs text-slate-400">ปีงบประมาณ {application.fiscalYear}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
              ไทม์ไลน์ติดตามกระบวนการ 12 ขั้นตอน (Online SLA Tracker)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrint(application)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์เอกสาร</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          
          {/* Project Summary Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-amber-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
              <div>
                <div className="font-bold text-slate-900 text-sm">{application.applicantName}</div>
                <div className="text-slate-600">{application.department} • เบอร์ภายใน {application.phone}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px] block">ยอดเงินขออนุมัติ:</span>
                <span className="text-lg font-bold text-blue-900 font-prompt">
                  {formatBaht(application.totalClaimedAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">บทความ: </span>
                <span className="font-medium text-slate-800">{application.articleTitle}</span>
              </div>
              <div>
                <span className="text-slate-500">วารสาร: </span>
                <span className="font-medium text-slate-800">{application.journalName} ({application.quartile})</span>
              </div>
            </div>

            {/* Official Registration Numbers */}
            <div className="flex flex-wrap gap-2 pt-1 text-[10px]">
              {application.internalDocNo && (
                <span className="px-2 py-0.5 bg-white border border-slate-300 rounded font-mono text-slate-700">
                  {application.internalDocNo}
                </span>
              )}
              {application.researchDocRecNo && (
                <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-blue-800">
                  {application.researchDocRecNo}
                </span>
              )}
              {application.financeDocRecNo && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded text-indigo-800">
                  {application.financeDocRecNo}
                </span>
              )}
              {application.disbursementVoucherNo && (
                <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 font-bold">
                  {application.disbursementVoucherNo}
                </span>
              )}
            </div>
          </div>

          {/* Current Active Step Banner */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {application.currentStep}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950 text-sm font-prompt">
                    ขั้นตอนปัจจุบัน: {currentStepDef?.title}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-200 text-amber-900">
                    SLA {currentStepDef?.slaDays} วันทำการ
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  ผู้รับผิดชอบ: <strong>{currentStepDef?.responsibleParty}</strong> • {currentStepDef?.description}
                </p>
              </div>
            </div>

            {/* If paid, view transfer */}
            {application.status === 'paid' && (
              <button
                onClick={() => onVerifyPayment(application)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-colors"
              >
                <Banknote className="w-4 h-4" />
                <span>ดูหลักฐานโอนเงิน</span>
              </button>
            )}
          </div>

          {/* 12-Step Official Progress Timeline (Vertical Stepper) */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm font-prompt border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>บันทึกความคืบหน้ารายขั้นตอน (ตาม Flowchart ประกาศ ม.นเรศวร)</span>
              <span className="text-xs font-normal text-slate-500">รวม 12 ขั้นตอน</span>
            </h3>

            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {OFFICIAL_WORKFLOW_STEPS_DEF.map((step) => {
                const isPassed = step.stepNumber < application.currentStep;
                const isCurrent = step.stepNumber === application.currentStep;
                const isUpcoming = step.stepNumber > application.currentStep;

                // Find step info from application timeline if available
                const stepRecord = application.timeline?.find((s) => s.stepNumber === step.stepNumber);

                return (
                  <div key={step.stepNumber} className="relative group">
                    {/* Step Circle Indicator */}
                    <div
                      className={`absolute -left-6 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                        isPassed
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                          : isCurrent
                          ? 'bg-amber-500 border-amber-600 text-slate-950 ring-4 ring-amber-100'
                          : 'bg-white border-slate-300 text-slate-400'
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
                          ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                          : isPassed
                          ? 'bg-white border-slate-200/80 hover:border-slate-300'
                          : 'bg-slate-50/50 border-slate-200 text-slate-500'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isCurrent ? 'text-amber-950 font-prompt' : isPassed ? 'text-slate-900' : 'text-slate-600'
                            }`}
                          >
                            {step.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                            {step.responsibleParty}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px]">
                          {stepRecord?.completedAt ? (
                            <span className="text-emerald-700 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{stepRecord.completedAt}</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>กำหนด SLA: {step.slaDays} วันทำการ</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-600 mt-1">{step.description}</p>

                      {stepRecord?.notes && (
                        <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-700 flex items-center gap-1.5">
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

          {/* Officer Advance Controls (for Coordinator & Finance) */}
          {canEdit && application.currentStep < 12 && (
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-300 space-y-3">
              <div className="font-bold text-slate-900 font-prompt flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700" />
                  <span>ส่วนงานเจ้าหน้าที่: ตรวจสอบและส่งต่องานตามลำดับ (Step-by-Step)</span>
                </div>
                <span className="text-[11px] font-normal text-slate-600">
                  สิทธิ์ผู้ใช้งานปัจจุบัน: <strong className="text-blue-900 uppercase">{currentRole}</strong>
                </span>
              </div>

              {!isAllowedToAdvance ? (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">จำกัดสิทธิ์ตามระเบียบ: </span>
                    <span>
                      ขั้นตอนที่ {application.currentStep} ({currentStepDef?.title}) อยู่ในความรับผิดชอบของ <strong>{currentStepDef?.responsibleParty}</strong> ท่านเข้าสู่ระบบในบทบาท <strong className="uppercase">{currentRole}</strong> จึงไม่สามารถกดยืนยันขั้นตอนนี้ได้ (กรุณาสลับสิทธิ์มุมขวาบนให้ถูกต้อง)
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
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleNextStep}
                    disabled={!isAllowedToAdvance}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0"
                  >
                    <span>ผ่านขั้นตอนที่ {application.currentStep} &rarr; ไปขั้นตอนที่ {application.currentStep + 1}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
