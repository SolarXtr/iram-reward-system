import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  FileText, 
  Printer, 
  Eye, 
  ArrowRight, 
  Sparkles, 
  User, 
  Building2, 
  Banknote,
  Send
} from 'lucide-react';
import { UserRole } from './Header';
import { ApplicationStatus, ResearchApplication, WorkflowStepId } from '../types';
import { formatBaht } from '../data/regulations';

interface KanbanBoardProps {
  applications: ResearchApplication[];
  onUpdateStatus: (id: string, newStatus: ApplicationStatus, nextStep: WorkflowStepId) => void;
  onViewApplication: (app: ResearchApplication) => void;
  onPrintApplication: (app: ResearchApplication) => void;
  onVerifyPayment: (app: ResearchApplication) => void;
  currentRole?: UserRole;
  onShowAlert?: (msg: string) => void;
}

interface KanbanLane {
  id: string;
  order: number;
  title: string;
  statuses: ApplicationStatus[];
  badgeColor: string;
  headerBg: string;
  stepRange: string;
  allowedRole: UserRole[];
}

const KANBAN_LANES: KanbanLane[] = [
  {
    id: 'lane-submitted',
    order: 1,
    title: '1. ยื่นคำขอใหม่',
    statuses: ['submitted', 'draft'],
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    headerBg: 'border-t-4 border-blue-500',
    stepRange: 'ขั้นตอนที่ 1 - 2',
    allowedRole: ['researcher', 'coordinator'],
  },
  {
    id: 'lane-verify',
    order: 2,
    title: '2. ตรวจสอบ & ลงนาม',
    statuses: ['staff_verified', 'researcher_signed'],
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    headerBg: 'border-t-4 border-amber-500',
    stepRange: 'ขั้นตอนที่ 3 - 4',
    allowedRole: ['coordinator'],
  },
  {
    id: 'lane-approval',
    order: 3,
    title: '3. เสนอผู้บริหาร & คณบดี',
    statuses: ['admin_review', 'budget_verified', 'dean_approved'],
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    headerBg: 'border-t-4 border-indigo-500',
    stepRange: 'ขั้นตอนที่ 5 - 8',
    allowedRole: ['coordinator'],
  },
  {
    id: 'lane-finance',
    order: 4,
    title: '4. งานการเงินทำฎีกาเบิกจ่าย',
    statuses: ['finance_processing'],
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    headerBg: 'border-t-4 border-purple-500',
    stepRange: 'ขั้นตอนที่ 9 - 10',
    allowedRole: ['finance'],
  },
  {
    id: 'lane-transferred',
    order: 5,
    title: '5. โอนเงินเรียบร้อย & ปิดงาน',
    statuses: ['paid', 'closed'],
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    headerBg: 'border-t-4 border-emerald-500',
    stepRange: 'ขั้นตอนที่ 11 - 12',
    allowedRole: ['finance'],
  },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  applications,
  onUpdateStatus,
  onViewApplication,
  onPrintApplication,
  onVerifyPayment,
  currentRole = 'coordinator',
  onShowAlert,
}) => {
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetLane: KanbanLane) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedAppId;
    if (!id) return;

    const targetApp = applications.find((a) => a.id === id);
    if (!targetApp) return;

    // Find source lane of this application
    const sourceLane = KANBAN_LANES.find((l) => l.statuses.includes(targetApp.status)) || KANBAN_LANES[0];

    // Check 1: Dropping in the same lane
    if (sourceLane.id === targetLane.id) {
      setDraggedAppId(null);
      return;
    }

    // Check 2: Sequential advancement rule - only forward by exactly 1 lane
    if (targetLane.order !== sourceLane.order + 1) {
      const msg = targetLane.order < sourceLane.order
        ? '⚠️ ไม่อนุญาตให้ย้อนสถานะงานกลับทางกระดาน'
        : `⚠️ ห้ามเลื่อนข้ามขั้นตอน! ต้องดำเนินการตามลำดับจาก "${sourceLane.title}" ไปยังช่องถัดไปเท่านั้น`;
      if (onShowAlert) onShowAlert(msg);
      else alert(msg);
      setDraggedAppId(null);
      return;
    }

    // Check 3: Role authorization rule
    if (!targetLane.allowedRole.includes(currentRole as UserRole)) {
      const msg = `⚠️ สิทธิ์ไม่เพียงพอ! ช่อง "${targetLane.title}" กำหนดให้เฉพาะบทบาท [${targetLane.allowedRole.join(', ')}] เป็นผู้ดำเนินการเท่านั้น (ปัจจุบันท่านอยู่ในบทบาท: ${currentRole})`;
      if (onShowAlert) onShowAlert(msg);
      else alert(msg);
      setDraggedAppId(null);
      return;
    }

    let nextStatus: ApplicationStatus = 'submitted';
    let nextStep: WorkflowStepId = 1;

    if (targetLane.id === 'lane-verify') {
      nextStatus = 'staff_verified';
      nextStep = 3;
    } else if (targetLane.id === 'lane-approval') {
      nextStatus = 'dean_approved';
      nextStep = 8;
    } else if (targetLane.id === 'lane-finance') {
      nextStatus = 'finance_processing';
      nextStep = 10;
    } else if (targetLane.id === 'lane-transferred') {
      nextStatus = 'paid';
      nextStep = 12;
    }

    onUpdateStatus(id, nextStatus, nextStep);
    setDraggedAppId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-prompt flex items-center gap-2">
            <span>กระดานติดตามสถานะแบบลากวาง (Interactive Kanban Flow)</span>
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              ลากการ์ดเพื่อเลื่อนขั้นตอน
            </span>
          </h2>
          <p className="text-xs text-slate-500">
            จำแนกตาม 5 ช่วงการดำเนินงานหลัก พร้อมแจ้งเตือนไปยัง LINE OA นักวิจัยอัตโนมัติ
          </p>
        </div>
      </div>

      {/* 5 Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {KANBAN_LANES.map((lane) => {
          const laneApps = applications.filter((app) => lane.statuses.includes(app.status));
          const totalLaneAmount = laneApps.reduce((sum, a) => sum + (a.totalClaimedAmount || 0), 0);

          return (
            <div
              key={lane.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, lane)}
              className={`bg-slate-100/80 rounded-xl p-3 border border-slate-200 shadow-sm flex flex-col min-h-[600px] transition-colors ${lane.headerBg}`}
            >
              {/* Lane Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-slate-800 font-prompt">{lane.title}</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${lane.badgeColor}`}>
                    {laneApps.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                  <span>{lane.stepRange}</span>
                  <span className="font-semibold text-slate-700">{formatBaht(totalLaneAmount)}</span>
                </div>
              </div>

              {/* Cards List in Lane */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                {laneApps.length === 0 ? (
                  <div className="h-32 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-400">
                    วางการ์ดที่นี่เพื่อเลื่อนขั้น
                  </div>
                ) : (
                  laneApps.map((app, idx) => {
                    const cardKey = app.id || `kanban-${lane.id}-${app.trackingNo || 'app'}-${idx}`;
                    return (
                      <div
                        key={cardKey}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id || cardKey)}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2.5 text-xs text-slate-800 group"
                      >
                      {/* Top Bar with Tracking & Quartile */}
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                          {app.trackingNo}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                          {app.quartile === 'Q1_Tier1' ? 'Q1 Tier 1' : app.quartile}
                        </span>
                      </div>

                      {/* Researcher & Dept */}
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{app.applicantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 pl-4.5">{app.department}</div>
                      </div>

                      {/* Article Title */}
                      <p className="text-[11px] text-slate-700 font-medium line-clamp-2 leading-relaxed" title={app.articleTitle}>
                        {app.articleTitle}
                      </p>

                      {/* Financial Amount */}
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500">ยอดเงินอนุมัติ:</span>
                        <span className="font-bold text-slate-900 font-prompt text-xs">
                          {formatBaht(app.totalClaimedAmount)}
                        </span>
                      </div>

                      {/* Voucher or SLA Indicator */}
                      {app.disbursementVoucherNo && (
                        <div className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex items-center gap-1">
                          <Banknote className="w-3 h-3 text-emerald-600" />
                          <span>{app.disbursementVoucherNo}</span>
                        </div>
                      )}

                      {/* Card Action Toolbar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <button
                          onClick={() => onViewApplication(app)}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>ไทม์ไลน์</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onPrintApplication(app)}
                            className="p-1 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title="ปริ้นแบบฟอร์ม"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {app.status === 'paid' && (
                            <button
                              onClick={() => onVerifyPayment(app)}
                              className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                              title="สลิปโอนเงิน"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
