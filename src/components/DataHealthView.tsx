import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Link2,
  RefreshCw,
  CheckCircle2,
  Wrench,
  Eye,
  Clock,
  Users,
  FileWarning,
  Banknote,
  GitCompare
} from 'lucide-react';
import { NuDisbursementRecord, ResearchApplication, UserProfile } from '../types';
import { formatBaht } from '../data/regulations';
import { evaluateApplicationSla } from '../utils/slaUtils';
import { getStatusFor19Step, normalizeWorkflowStep, syncWorkflowFieldsForStatus } from '../data/workflow19Steps';
import { reconcileRewardUserIdsInD1 } from '../services/rewardD1Service';

interface DataHealthViewProps {
  applications: ResearchApplication[];
  nuDisbursements: NuDisbursementRecord[];
  users: UserProfile[];
  onSaveApplication: (updated: ResearchApplication) => Promise<boolean | void> | void;
  onUpdateNuRecord: (updated: NuDisbursementRecord) => void;
  onViewApplication: (app: ResearchApplication) => void;
  onReloadApplications?: () => void;
  onShowAlert?: (msg: string) => void;
}

type IssueCategory = 'all' | 'identity_fk' | 'nu_mismatch' | 'finance_missing' | 'state_drift' | 'sla_overdue';

interface HealthIssue {
  id: string;
  category: Exclude<IssueCategory, 'all'>;
  severity: 'high' | 'medium' | 'low';
  trackingNo: string;
  title: string;
  description: string;
  fixLabel?: string;
  onFix?: () => Promise<void> | void;
  app?: ResearchApplication;
}

export const DataHealthView: React.FC<DataHealthViewProps> = ({
  applications,
  nuDisbursements,
  users,
  onSaveApplication,
  onUpdateNuRecord,
  onViewApplication,
  onReloadApplications,
  onShowAlert,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory>('all');
  const [isReconcilingFk, setIsReconcilingFk] = useState(false);
  const [fixingId, setFixingId] = useState<string | null>(null);

  const activeApps = useMemo(
    () => applications.filter((a) => a.status !== 'draft' && a.status !== 'trash'),
    [applications]
  );

  const userByEmail = useMemo(() => {
    const map = new Map<string, UserProfile>();
    users.forEach((u) => {
      if (u.email) map.set(u.email.trim().toLowerCase(), u);
    });
    return map;
  }, [users]);

  const userById = useMemo(() => {
    const map = new Map<string, UserProfile>();
    users.forEach((u) => {
      if (u.id) map.set(u.id, u);
    });
    return map;
  }, [users]);

  const issues = useMemo<HealthIssue[]>(() => {
    const list: HealthIssue[] = [];

    for (const app of activeApps) {
      const cleanEmail = (app.email || '').trim().toLowerCase();
      const matchedUser =
        (app.applicantUserId && userById.get(app.applicantUserId)) ||
        (cleanEmail ? userByEmail.get(cleanEmail) : undefined) ||
        users.find((u) => u.name.trim().toLowerCase() === (app.applicantName || '').trim().toLowerCase());

      // 1. Identity / FK / Name mismatch vs irUser
      if (!app.applicantUserId && matchedUser) {
        list.push({
          id: `fk-${app.id}`,
          category: 'identity_fk',
          severity: 'medium',
          trackingNo: app.trackingNo,
          title: `คำขอยังไม่ได้ผูก Foreign Key (applicantUserId) กับทะเบียน irUser`,
          description: `ผู้ขอ: "${app.applicantName}" ตรงกับบัญชี "${matchedUser.name}" (${matchedUser.email}) รหัส ${matchedUser.id}`,
          fixLabel: 'ผูก applicantUserId',
          app,
          onFix: async () => {
            await onSaveApplication({
              ...app,
              applicantUserId: matchedUser.id,
              email: app.email || matchedUser.email,
            });
          },
        });
      } else if (!matchedUser) {
        list.push({
          id: `unmatched-user-${app.id}`,
          category: 'identity_fk',
          severity: 'high',
          trackingNo: app.trackingNo,
          title: `ไม่พบบัญชีผู้ขอรับทุนในทะเบียนผู้ใช้งานกลาง (irUser)`,
          description: `ผู้ขอในคำขอ: "${app.applicantName}" (${app.email || 'ไม่ระบุอีเมล'}) — แนะนำให้ตรวจสอบหรือเพิ่มบัญชีในเมนูจัดการผู้ใช้งาน`,
          app,
        });
      } else if (matchedUser.name.trim() !== app.applicantName.trim()) {
        list.push({
          id: `name-diff-${app.id}`,
          category: 'identity_fk',
          severity: 'low',
          trackingNo: app.trackingNo,
          title: `ชื่อ-คำนำหน้าในคำขอไม่ตรงกับโปรไฟล์ปัจจุบันใน irUser`,
          description: `ในคำขอ: "${app.applicantName}" ↔ ในทะเบียนผู้ใช้: "${matchedUser.name}"`,
          fixLabel: 'ซิงก์ชื่อตาม irUser',
          app,
          onFix: async () => {
            await onSaveApplication({
              ...app,
              applicantUserId: matchedUser.id,
              applicantName: matchedUser.name,
            });
          },
        });
      }

      // 2. Finance / Paid completeness check
      const isPaid = app.status === 'paid' || app.paymentStatus === 'transferred';
      if (isPaid && (!app.disbursementVoucherNo || !app.paymentDate)) {
        list.push({
          id: `paid-missing-doc-${app.id}`,
          category: 'finance_missing',
          severity: 'high',
          trackingNo: app.trackingNo,
          title: `สถานะโอนเงินแล้ว แต่ข้อมูลหลักฐานการจ่ายไม่ครบถ้วน`,
          description: `${!app.disbursementVoucherNo ? '• ยังไม่ระบุเลขที่ฎีกา ' : ''}${!app.paymentDate ? '• ยังไม่ระบุวันที่โอนเงิน' : ''} (ยอด ${formatBaht(app.totalClaimedAmount)})`,
          app,
        });
      }

      if (!isPaid && (!app.bankAccountNo || app.bankAccountNo.replace(/\D/g, '').length < 10)) {
        list.push({
          id: `missing-bank-${app.id}`,
          category: 'finance_missing',
          severity: 'medium',
          trackingNo: app.trackingNo,
          title: `เลขที่บัญชีธนาคารสำหรับรับโอนเงินยังไม่ครบ 10 หลัก`,
          description: `ผู้ขอ: ${app.applicantName} • เลขบัญชีที่บันทึกไว้: "${app.bankAccountNo || 'ว่าง'}"`,
          app,
        });
      }

      // 3. State / Financial Sum Drift
      const expectedSum = (Number(app.claimedRewardAmount) || 0) + (Number(app.approvedPageChargeAmount) || 0);
      const sumDrift = Math.abs((Number(app.totalClaimedAmount) || 0) - expectedSum) > 0.01;
      const step19 = normalizeWorkflowStep(app.currentStep || 1);
      const expectedStatus = getStatusFor19Step(step19, app.status);
      const paidFlagDrift =
        (app.status === 'paid' && (step19 < 18 || app.paymentStatus !== 'transferred')) ||
        (app.status !== 'paid' && app.paymentStatus === 'transferred');

      if (sumDrift || paidFlagDrift || (expectedStatus !== app.status && !['researcher_signed', 'admin_review', 'budget_verified'].includes(app.status))) {
        list.push({
          id: `drift-${app.id}`,
          category: 'state_drift',
          severity: 'high',
          trackingNo: app.trackingNo,
          title: `สถานะโครงการ / ขั้นตอน / ยอดรวมไม่สอดคล้องกัน`,
          description: `สถานะ="${app.status}", ขั้น=${step19}/19, การโอน="${app.paymentStatus}", ยอดรวม=${formatBaht(app.totalClaimedAmount)} (คำนวณจริง ${formatBaht(expectedSum)})`,
          fixLabel: 'ซ่อมความสอดคล้องอัตโนมัติ',
          app,
          onFix: async () => {
            const synced = syncWorkflowFieldsForStatus({ ...app, status: 'submitted' }, {
              ...app,
              totalClaimedAmount: expectedSum,
            });
            await onSaveApplication({
              ...synced,
              totalClaimedAmount: expectedSum,
            });
          },
        });
      }

      // 4. SLA Overdue check
      const sla = evaluateApplicationSla(app);
      if (sla.isOverdue) {
        list.push({
          id: `sla-${app.id}`,
          category: 'sla_overdue',
          severity: sla.overdueDays >= 5 ? 'high' : 'medium',
          trackingNo: app.trackingNo,
          title: `คำขอค้างดำเนินการเกินเกณฑ์ SLA (${sla.label})`,
          description: `อัปเดตล่าสุดเมื่อ ${app.updatedAt || app.createdAt} (ใช้เวลาแล้ว ${sla.elapsedDays} วันทำการ จากเกณฑ์ ${sla.maxDays} วันทำการ)`,
          app,
        });
      }
    }

    // 5. NU Disbursement vs Faculty Application Mismatches
    const appByTracking = new Map<string, ResearchApplication>();
    activeApps.forEach((a) => appByTracking.set(a.trackingNo.trim().toUpperCase(), a));

    for (const nu of nuDisbursements) {
      if (!nu.matchedFacultyTrackingNo) continue;
      const matchedApp = appByTracking.get(nu.matchedFacultyTrackingNo.trim().toUpperCase());
      if (!matchedApp) continue;

      const nuName = (nu.researcherName || '').trim();
      const facName = (matchedApp.applicantName || '').trim();
      if (nuName.toLowerCase() !== facName.toLowerCase()) {
        list.push({
          id: `nu-name-${nu.id}`,
          category: 'nu_mismatch',
          severity: 'medium',
          trackingNo: matchedApp.trackingNo,
          title: `ชื่อผู้ขอในตาราง DRI NU Tracker ไม่ตรงกับเจ้าของคำขอฝั่งคณะฯ`,
          description: `ฝั่งคณะฯ (${matchedApp.trackingNo}): "${facName}" ↔ ฝั่ง มน.: "${nuName}" (บทความ: ${nu.articleTitle.slice(0, 65)}...)`,
          fixLabel: 'ปรับชื่อฝั่ง มน. ให้ตรงกับคณะฯ',
          app: matchedApp,
          onFix: () => {
            onUpdateNuRecord({
              ...nu,
              researcherUserId: matchedApp.applicantUserId,
              researcherName: matchedApp.applicantName,
              department: matchedApp.department || nu.department,
              updatedAt: new Date().toISOString().split('T')[0],
            });
          },
        });
      }
    }

    return list;
  }, [activeApps, nuDisbursements, users, userByEmail, userById, onSaveApplication, onUpdateNuRecord]);

  const filteredIssues = useMemo(
    () => (selectedCategory === 'all' ? issues : issues.filter((i) => i.category === selectedCategory)),
    [issues, selectedCategory]
  );

  const fkLinkedCount = activeApps.filter((a) => Boolean(a.applicantUserId)).length;
  const fkCoveragePct = activeApps.length > 0 ? Math.round((fkLinkedCount / activeApps.length) * 100) : 100;
  const highSeverityCount = issues.filter((i) => i.severity === 'high').length;
  const healthScore = Math.max(0, Math.min(100, 100 - highSeverityCount * 6 - (issues.length - highSeverityCount) * 2));

  const handleBulkReconcileFk = async () => {
    try {
      setIsReconcilingFk(true);
      const res = await reconcileRewardUserIdsInD1();
      if (onShowAlert) {
        onShowAlert(
          `🔗 เชื่อมโยง Foreign Key สำเร็จ: คำขอคณะฯ ${res.linkedApplications} รายการ และรายการ มน. ${res.linkedNuDisbursements} รายการ`
        );
      }
      if (onReloadApplications) onReloadApplications();
    } catch (err: any) {
      if (onShowAlert) onShowAlert(`⚠️ เชื่อมโยง Foreign Key ไม่สำเร็จ: ${err.message}`);
    } finally {
      setIsReconcilingFk(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-sm shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold font-prompt text-slate-900">
                ตรวจสอบสุขภาพและความสอดคล้องของข้อมูล (Data Health Inspector)
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full">
                Admin Governance
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              สแกนตรวจสอบการผูก Foreign Key (`applicantUserId`), ความตรงกันระหว่างข้อมูล มน. กับคณะฯ, ความครบถ้วนของเลขฎีกา และรายการค้างเกิน SLA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleBulkReconcileFk}
            disabled={isReconcilingFk}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            <Link2 className={`w-4 h-4 ${isReconcilingFk ? 'animate-spin' : ''}`} />
            <span>{isReconcilingFk ? 'กำลังเชื่อมโยง FK...' : 'เชื่อมโยง applicantUserId ทั้งฐานข้อมูล'}</span>
          </button>
          {onReloadApplications && (
            <button
              onClick={onReloadApplications}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 border border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>รีเฟรช</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium">คะแนนสุขภาพข้อมูล (Data Health Score)</div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-prompt ${healthScore >= 90 ? 'text-emerald-600' : healthScore >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
              {healthScore}%
            </span>
            <span className="text-xs text-slate-500">จาก {activeApps.length} คำขอทางการ</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>ความครอบคลุม Foreign Key (`irUser.id`)</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-prompt text-blue-900">{fkCoveragePct}%</span>
            <span className="text-xs text-slate-500">({fkLinkedCount}/{activeApps.length} รายการ)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>ประเด็นที่ควรตรวจสอบทั้งหมด</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-prompt text-slate-900">{issues.length}</span>
            <span className="text-xs text-rose-600 font-semibold">(สำคัญสูง {highSeverityCount} รายการ)</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>รายการค้างเกินกำหนด SLA</span>
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-prompt text-amber-700">
              {issues.filter((i) => i.category === 'sla_overdue').length}
            </span>
            <span className="text-xs text-slate-500">รายการ</span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'all', label: `ทั้งหมด (${issues.length})`, icon: FileWarning },
          { id: 'identity_fk', label: `ตัวตน & Foreign Key (${issues.filter((i) => i.category === 'identity_fk').length})`, icon: Users },
          { id: 'nu_mismatch', label: `เทียบข้อมูล มน. (${issues.filter((i) => i.category === 'nu_mismatch').length})`, icon: GitCompare },
          { id: 'finance_missing', label: `ฎีกา & เลขบัญชี (${issues.filter((i) => i.category === 'finance_missing').length})`, icon: Banknote },
          { id: 'state_drift', label: `สถานะ & ยอดเงิน (${issues.filter((i) => i.category === 'state_drift').length})`, icon: Wrench },
          { id: 'sla_overdue', label: `ค้างเกิน SLA (${issues.filter((i) => i.category === 'sla_overdue').length})`, icon: Clock },
        ] as const).map((tab) => {
          const Icon = tab.icon;
          const active = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                active
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Issues List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {filteredIssues.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="font-bold text-slate-900 font-prompt text-sm">
              ไม่พบความผิดปกติของข้อมูลในหมวดหมู่นี้
            </div>
            <p className="text-xs text-slate-500">
              ข้อมูลคำขอ สถานะการเบิกจ่าย และการเชื่อมโยงผู้ใช้งานมีความสอดคล้องสมบูรณ์
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {issue.trackingNo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        issue.severity === 'high'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : issue.severity === 'medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {issue.severity === 'high' ? 'สำคัญสูง' : issue.severity === 'medium' ? 'ปานกลาง' : 'ข้อแนะนำ'}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900 font-prompt">
                      {issue.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{issue.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {issue.onFix && issue.fixLabel && (
                    <button
                      onClick={async () => {
                        try {
                          setFixingId(issue.id);
                          await issue.onFix?.();
                        } finally {
                          setFixingId(null);
                        }
                      }}
                      disabled={fixingId === issue.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{fixingId === issue.id ? 'กำลังปรับปรุง...' : issue.fixLabel}</span>
                    </button>
                  )}
                  {issue.app && (
                    <button
                      onClick={() => onViewApplication(issue.app!)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 border border-slate-200 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ดูคำขอ</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
