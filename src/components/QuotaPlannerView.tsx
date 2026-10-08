import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Award, 
  Banknote, 
  ArrowRight, 
  PlusCircle, 
  Edit3, 
  Send, 
  Trash2, 
  Sparkles, 
  CalendarDays, 
  HelpCircle, 
  TrendingUp, 
  FileText, 
  Check, 
  ChevronRight,
  ShieldCheck,
  Building,
  RotateCcw
} from 'lucide-react';
import { ResearchApplication, UserProfile, NuDisbursementRecord } from '../types';
import { formatBaht, checkPublication24MonthExpiry, getTrackingPrefix } from '../data/regulations';

interface QuotaPlannerViewProps {
  applications: ResearchApplication[];
  nuDisbursements: NuDisbursementRecord[];
  currentUser?: UserProfile | null;
  onOpenNewSubmission: () => void;
  onEditDraft: (draftApp: ResearchApplication) => void;
  onSubmitDraft: (draftApp: ResearchApplication) => void;
  onSubmitSelectedDrafts: (draftApps: ResearchApplication[]) => void;
  onDeleteDraft: (id: string) => void;
  onCarryOverDraft: (id: string, targetFiscalYear: number) => void;
}

export const QuotaPlannerView: React.FC<QuotaPlannerViewProps> = ({
  applications,
  nuDisbursements,
  currentUser,
  onOpenNewSubmission,
  onEditDraft,
  onSubmitDraft,
  onSubmitSelectedDrafts,
  onDeleteDraft,
  onCarryOverDraft,
}) => {
  // Selected fiscal year for quota planning (Default: 2570)
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(2570);
  const [selectedDraftIds, setSelectedDraftIds] = useState<Set<string>>(new Set());

  // Filter applications for current researcher (excluding drafts for submitted stats)
  const userLastName = currentUser?.name.trim().split(' ').pop()?.toLowerCase() || '';
  const userEmail = currentUser?.email?.toLowerCase() || '';

  const isMyApplication = (a: ResearchApplication) => {
    const matchesEmail = userEmail && a.email && a.email.toLowerCase() === userEmail;
    const matchesName = userLastName && a.applicantName && a.applicantName.toLowerCase().includes(userLastName);
    return Boolean(matchesEmail || matchesName);
  };

  // 1. Submitted/Official Applications of this researcher (status !== 'draft')
  const mySubmittedApps = useMemo(() => {
    return applications.filter((a) => isMyApplication(a) && a.status !== 'draft');
  }, [applications, userEmail, userLastName]);

  // Submitted apps for the selected fiscal year
  const mySubmittedInYear = useMemo(() => {
    return mySubmittedApps.filter((a) => (a.fiscalYear || 2570) === selectedFiscalYear);
  }, [mySubmittedApps, selectedFiscalYear]);

  // Faculty Quota calculations (Max 150,000 THB)
  const MAX_FACULTY_QUOTA = 150000;
  const facultyPaid = mySubmittedInYear
    .filter((a) => a.status === 'paid')
    .reduce((sum, a) => sum + (a.actualPaidAmount || a.totalClaimedAmount || 0), 0);

  const facultyPending = mySubmittedInYear
    .filter((a) => a.status !== 'paid' && a.status !== 'rejected')
    .reduce((sum, a) => sum + (a.totalClaimedAmount || 0), 0);

  const facultyUsed = facultyPaid + facultyPending;
  const facultyRemaining = Math.max(0, MAX_FACULTY_QUOTA - facultyUsed);

  // 2. DRI NU Tracker calculations (Max 100,000 THB)
  const MAX_NU_QUOTA = 100000;
  const myNuRecords = useMemo(() => {
    return nuDisbursements.filter((r) => {
      const matchesName = userLastName && r.researcherName && r.researcherName.toLowerCase().includes(userLastName);
      return Boolean(matchesName);
    });
  }, [nuDisbursements, userLastName]);

  const nuPaid = myNuRecords
    .filter((r) => r.status === 'จ่ายเงินแล้ว')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const nuPending = myNuRecords
    .filter((r) => r.status !== 'จ่ายเงินแล้ว' && r.status !== 'ไม่อนุมัติ')
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const nuUsed = nuPaid + nuPending;
  const nuRemaining = Math.max(0, MAX_NU_QUOTA - nuUsed);

  // 3. Draft/Prepared applications (status === 'draft')
  // STRICT REQUIREMENT: Only show drafts! (Never show submitted applications here)
  const myDraftApps = useMemo(() => {
    const drafts = applications.filter((a) => isMyApplication(a) && a.status === 'draft');
    // SORTING: Oldest publishedDate first (highest 24-month urgency!)
    return drafts.sort((a, b) => {
      const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
      const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [applications, userEmail, userLastName]);

  // Selected drafts for simulation
  const selectedDraftsList = useMemo(() => {
    return myDraftApps.filter((d) => selectedDraftIds.has(d.id));
  }, [myDraftApps, selectedDraftIds]);

  const simulatedSelectedTotal = useMemo(() => {
    return selectedDraftsList.reduce((sum, d) => sum + (d.totalClaimedAmount || 0), 0);
  }, [selectedDraftsList]);

  const netRemainingAfterSelected = facultyRemaining - simulatedSelectedTotal;
  const isSelectedExceedingQuota = simulatedSelectedTotal > facultyRemaining;

  // Toggle selection for simulation
  const handleToggleSelectDraft = (id: string) => {
    setSelectedDraftIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllDrafts = () => {
    if (selectedDraftIds.size === myDraftApps.length) {
      setSelectedDraftIds(new Set());
    } else {
      setSelectedDraftIds(new Set(myDraftApps.map((d) => d.id)));
    }
  };

  // Auto-Select by 24-Month Urgency within remaining quota
  const handleAutoRecommendSelection = () => {
    let currentSum = 0;
    const recommended = new Set<string>();

    for (const draft of myDraftApps) {
      const draftAmount = draft.totalClaimedAmount || 0;
      if (currentSum + draftAmount <= facultyRemaining) {
        recommended.add(draft.id);
        currentSum += draftAmount;
      }
    }

    setSelectedDraftIds(recommended);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Context & Goals */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>เครื่องมือวางแผนและจัดสรรวงเงิน (Strategy & Quota Planner)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-prompt text-white tracking-tight">
              เตรียมบทความและตรวจสอบวงเงินประจำปีงบประมาณ
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ช่วยอาจารย์ตรวจสอบและตรวจเลือกบทความวิจัยที่จะส่งเบิกรางวัลในแต่ละปีงบประมาณ เพื่อให้ได้ประโยชน์สูงสุดตามกรอบวงเงิน 
              <strong className="text-amber-300"> 150,000 บาท (คณะฯ)</strong> และ 
              <strong className="text-blue-300"> 100,000 บาท (ม.นเรศวร)</strong> 
              พร้อมจัดลำดับความเร่งด่วนตามกฎการขอรับรางวัลภายใน 
              <strong className="text-emerald-300"> 24 เดือนหลังตีพิมพ์</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Fiscal Year Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-xl p-1 text-xs">
              {[2569, 2570, 2571].map((fy) => (
                <button
                  key={fy}
                  onClick={() => setSelectedFiscalYear(fy)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    selectedFiscalYear === fy
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  ปีงบ {fy}
                </button>
              ))}
            </div>

            <button
              onClick={onOpenNewSubmission}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all transform active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>บันทึกเตรียมเบิกบทความใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Dual Quota Tracking (Faculty 150k + DRI NU 100k) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Faculty of Medicine Quota (150,000 THB) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-prompt">
                  วงเงินคณะแพทยศาสตร์ (ประจำปีงบ {selectedFiscalYear})
                </h3>
                <span className="text-[11px] text-slate-500">
                  ตามประกาศคณะฯ ข้อ 12: ไม่เกิน 150,000 บาท/คน/ปีงบประมาณ
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold font-prompt">
              เพดาน 150,000 บ.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">โอนจ่ายแล้ว</span>
              <span className="text-base font-bold text-emerald-700 font-prompt">
                {formatBaht(facultyPaid)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">อยู่ระหว่างเบิก</span>
              <span className="text-base font-bold text-amber-700 font-prompt">
                {formatBaht(facultyPending)}
              </span>
            </div>
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100">
              <span className="text-[11px] text-purple-900 font-semibold block">วงเงินคงเหลือ</span>
              <span className="text-base font-bold text-purple-700 font-prompt">
                {formatBaht(facultyRemaining)}
              </span>
            </div>
          </div>

          {/* Faculty Quota Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                ใช้ไปแล้ว {formatBaht(facultyUsed)} จาก {formatBaht(MAX_FACULTY_QUOTA)}
              </span>
              <span className="font-bold text-slate-700">
                {Math.round((facultyUsed / MAX_FACULTY_QUOTA) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300" 
                style={{ width: `${(facultyPaid / MAX_FACULTY_QUOTA) * 100}%` }}
                title="จ่ายแล้ว"
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-300" 
                style={{ width: `${(facultyPending / MAX_FACULTY_QUOTA) * 100}%` }}
                title="อยู่ระหว่างเบิก"
              />
            </div>
          </div>

          {/* Simulation Result if drafts are selected */}
          {selectedDraftIds.size > 0 && (
            <div className={`p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
              isSelectedExceedingQuota 
                ? 'bg-rose-50 border-rose-200 text-rose-900' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2">
                {isSelectedExceedingQuota ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <div>
                  <span className="font-semibold block">
                    {isSelectedExceedingQuota 
                      ? `⚠️ ยอดที่เลือกเกินวงเงินคงเหลือ ${formatBaht(Math.abs(netRemainingAfterSelected))}`
                      : `✅ ยอดที่เลือก (${formatBaht(simulatedSelectedTotal)}) สามารถเบิกได้ครบถ้วน`}
                  </span>
                  <span className="text-[11px] opacity-80">
                    คงเหลือสุทธิหลังส่งเบิก: {formatBaht(Math.max(0, netRemainingAfterSelected))}
                  </span>
                </div>
              </div>
              <span className="font-bold font-prompt text-sm">
                {selectedDraftIds.size} เรื่อง
              </span>
            </div>
          )}
        </div>

        {/* Card 2: DRI NU Quota (100,000 THB) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-prompt">
                  กองการวิจัยและนวัตกรรม ม.นเรศวร (DRI NU)
                </h3>
                <span className="text-[11px] text-slate-500">
                  ตามประกาศ มน.: สนับสนุนไม่เกิน 100,000 บาท/คน/ปีงบประมาณ
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold font-prompt">
              เพดาน 100,000 บ.
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">จ่ายเงิน มน. แล้ว</span>
              <span className="text-base font-bold text-emerald-700 font-prompt">
                {formatBaht(nuPaid)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">ยื่นคำร้อง มน. แล้ว</span>
              <span className="text-base font-bold text-amber-700 font-prompt">
                {formatBaht(nuPending)}
              </span>
            </div>
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100">
              <span className="text-[11px] text-blue-900 font-semibold block">วงเงินคงเหลือ มน.</span>
              <span className="text-base font-bold text-blue-700 font-prompt">
                {formatBaht(nuRemaining)}
              </span>
            </div>
          </div>

          {/* NU Quota Progress Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">
                เบิก มน. แล้ว {formatBaht(nuUsed)} จาก {formatBaht(MAX_NU_QUOTA)}
              </span>
              <span className="font-bold text-slate-700">
                {Math.round((nuUsed / MAX_NU_QUOTA) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300" 
                style={{ width: `${(nuPaid / MAX_NU_QUOTA) * 100}%` }}
                title="มน. จ่ายแล้ว"
              />
              <div 
                className="bg-amber-400 h-full transition-all duration-300" 
                style={{ width: `${(nuPending / MAX_NU_QUOTA) * 100}%` }}
                title="มน. อยู่ระหว่างเบิก"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>ติดตามคำขอส่วนของ มน. ใน DRI NU Tracker:</span>
            </div>
            <span className="font-semibold text-slate-800 font-prompt">
              พบ {myNuRecords.length} รายการของท่าน
            </span>
          </div>
        </div>
      </div>

      {/* Drafts & Prepared Articles Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Section Header & Strategy Bar */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 font-prompt flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>รายการบทความที่บันทึกไว้ก่อนส่งเบิก (Prepared Articles)</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 font-prompt">
                {myDraftApps.length} เรื่อง
              </span>
            </div>
            <p className="text-xs text-slate-500">
              เรียงลำดับตาม <strong className="text-slate-700">วันที่ตีพิมพ์เผยแพร่ (เก่าสุดขึ้นก่อน)</strong> เพื่อให้ท่านเลือกลำดับบทความที่ใกล้ครบ 24 เดือนก่อน โดยรายการที่ส่งเบิกแล้วจะไม่แสดงในหน้านี้
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {myDraftApps.length > 0 && (
              <>
                <button
                  onClick={handleAutoRecommendSelection}
                  title="ระบบคำนวณและเลือกบทความที่ใกล้หมดอายุ 24 เดือนให้อัตโนมัติภายใต้วงเงินคงเหลือ"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>แนะนำบทความที่ควรเบิกก่อน</span>
                </button>

                <button
                  onClick={handleSelectAllDrafts}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {selectedDraftIds.size === myDraftApps.length ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
              </>
            )}

            {selectedDraftIds.size > 0 && (
              <button
                onClick={() => onSubmitSelectedDrafts(selectedDraftsList)}
                disabled={isSelectedExceedingQuota}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                  isSelectedExceedingQuota
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                    : 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer active:scale-95'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่งเบิกที่เลือก ({selectedDraftIds.size} เรื่อง - {formatBaht(simulatedSelectedTotal)})</span>
              </button>
            )}
          </div>
        </div>

        {/* Prepared Articles Table */}
        {myDraftApps.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-800 font-prompt">
                ยังไม่มีบทความที่บันทึกเตรียมเบิกไว้
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                อาจารย์สามารถกรอกข้อมูลบทความที่ตีพิมพ์ในปี 2026 แล้วกดปุ่ม <strong>"บันทึกร่างเตรียมเบิก"</strong> เพื่อนำมาวางแผนจัดสรรวงเงินและตรวจสอบอายุ 24 เดือนได้ล่วงหน้า
              </p>
            </div>
            <button
              onClick={onOpenNewSubmission}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>บันทึกเตรียมเบิกบทความแรก</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedDraftIds.size === myDraftApps.length && myDraftApps.length > 0}
                      onChange={handleSelectAllDrafts}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-3 px-3">ลำดับ</th>
                  <th className="py-3 px-4 min-w-[140px]">วันที่ตีพิมพ์ & อายุ 24 เดือน</th>
                  <th className="py-3 px-4 min-w-[280px]">ชื่อบทความวิจัย / วารสาร</th>
                  <th className="py-3 px-3">Quartile</th>
                  <th className="py-3 px-3 text-right">เงินรางวัล</th>
                  <th className="py-3 px-3 text-right">ค่าเพจชาร์จ</th>
                  <th className="py-3 px-3 text-right">รวมที่จะได้รับ</th>
                  <th className="py-3 px-3 text-center">ปีงบที่วางแผน</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {myDraftApps.map((draft, idx) => {
                  const isSelected = selectedDraftIds.has(draft.id);
                  const expiryInfo = checkPublication24MonthExpiry(draft.publishedDate);

                  return (
                    <tr 
                      key={draft.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      {/* Checkbox for simulation */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectDraft(draft.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-3 text-slate-500 font-mono text-center">
                        {idx + 1}
                      </td>

                      {/* Publication Date & 24-Month Urgency Badge */}
                      <td className="py-3 px-4 space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{draft.publishedDate || '-'}</span>
                        </div>
                        <div>
                          {expiryInfo.urgency === 'urgent' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              {expiryInfo.label}
                            </span>
                          )}
                          {expiryInfo.urgency === 'warning' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {expiryInfo.label}
                            </span>
                          )}
                          {expiryInfo.urgency === 'safe' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {expiryInfo.label}
                            </span>
                          )}
                          {expiryInfo.urgency === 'expired' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                              {expiryInfo.label}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          หมดสิทธิ์: {expiryInfo.expiryDateStr}
                        </span>
                      </td>

                      {/* Article Title & Journal */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {draft.articleTitle}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="italic">{draft.journalName}</span>
                          {draft.doi && (
                            <span className="font-mono text-slate-400 text-[10px]">DOI: {draft.doi}</span>
                          )}
                        </div>
                      </td>

                      {/* Quartile Badge */}
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          draft.quartile === 'Q1' || draft.quartile === 'Q1_Tier1'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : draft.quartile === 'Q2'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {draft.quartile}
                        </span>
                      </td>

                      {/* Financial Amounts */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatBaht(draft.claimedRewardAmount || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatBaht(draft.approvedPageChargeAmount || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-prompt">
                        {formatBaht(draft.totalClaimedAmount || 0)}
                      </td>

                      {/* Planned Fiscal Year with Carry-over button */}
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          ปี {draft.fiscalYear || selectedFiscalYear}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Submit Now */}
                          <button
                            onClick={() => onSubmitDraft(draft)}
                            title="ส่งคำขอออนไลน์เข้าระบบตรวจเอกสารทันที"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Draft */}
                          <button
                            onClick={() => onEditDraft(draft)}
                            title="แก้ไขข้อมูลบทความนี้"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Carry-over to Next Fiscal Year */}
                          <button
                            onClick={() => onCarryOverDraft(draft.id, (draft.fiscalYear || selectedFiscalYear) + 1)}
                            title={`เลื่อนไปเบิกปีงบประมาณถัดไป (${(draft.fiscalYear || selectedFiscalYear) + 1})`}
                            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors cursor-pointer"
                          >
                            <CalendarDays className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Draft */}
                          <button
                            onClick={() => onDeleteDraft(draft.id)}
                            title="ลบร่างบทความนี้"
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regulation Guidance Box */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2">
        <div className="font-bold flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-700" />
          <span>คำแนะนำในการบริหารวงเงินและรักษาสิทธิ์ขอรับรางวัล (กฎ 24 เดือน)</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
          <li>
            <strong>สิทธิ์ขอรับรางวัลภายใน 24 เดือน:</strong> บทความสามารถยื่นขอรับเงินรางวัลได้ภายใน 2 ปี นับจากวันที่ได้รับการเผยแพร่ (Published Date)
          </li>
          <li>
            <strong>กรณีมีบทความหลายเรื่องในปี 2026:</strong> หากยอดรวมเกิน 150,000 บาท แนะนำให้เลือกส่งเบิกบทความที่ได้รับการเผยแพร่ก่อน (ใกล้ครบ 24 เดือนก่อน) ส่วนบทความที่เพิ่งตีพิมพ์สามารถกดปุ่ม <strong className="text-amber-800">เลื่อนไปเบิกปีงบประมาณถัดไป (Carry-over)</strong> ได้โดยไม่เสียสิทธิ์
          </li>
          <li>
            <strong>1 บทความขอได้ทั้ง 2 แหล่งทุน:</strong> สามารถขอรับการสนับสนุนได้ทั้งจาก ม.นเรศวร (100,000 บาท) และคณะแพทยศาสตร์ (150,000 บาท) ควบคู่กัน
          </li>
        </ul>
      </div>
    </div>
  );
};
