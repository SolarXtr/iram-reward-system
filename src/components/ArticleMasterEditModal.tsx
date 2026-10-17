import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Award, 
  Calendar, 
  DollarSign, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Sparkles,
  Zap
} from 'lucide-react';
import { NuDisbursementRecord, ResearchApplication, ApplicationStatus } from '../types';
import { UnifiedArticleRow } from './ArticleMasterTable';

interface ArticleMasterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: UnifiedArticleRow | null;
  onSaveNu: (updated: NuDisbursementRecord) => void;
  onSaveFaculty: (updated: ResearchApplication) => void;
}

export const ArticleMasterEditModal: React.FC<ArticleMasterEditModalProps> = ({
  isOpen,
  onClose,
  article,
  onSaveNu,
  onSaveFaculty,
}) => {
  if (!isOpen || !article) return null;

  // 1. NU State
  const initialNuStatus = article.nuStatus === 'ยังไม่ได้เบิกจ่าย มน.' || article.nuStatus === 'ยังไม่ได้ยื่น มน.' 
    ? 'อยู่ระหว่างการจัดส่งเอกสาร' 
    : article.nuStatus;

  const [nuStatus, setNuStatus] = useState<string>(initialNuStatus);
  const [nuApprovedDate, setNuApprovedDate] = useState<string>(article.rawNuRecord?.approvedDate || '');
  const [nuPaymentDate, setNuPaymentDate] = useState<string>(article.nuPaymentDate || '');
  const [nuVoucherNo, setNuVoucherNo] = useState<string>(article.nuVoucherNo || '');
  const [nuRewardAmount, setNuRewardAmount] = useState<number>(article.nuRewardAmount || 0);
  const [nuPageChargeAmount, setNuPageChargeAmount] = useState<number>(article.nuPageChargeAmount || 0);

  // 2. Faculty State
  // Determine standard key for faculty status
  const getInitialFacStatusKey = (): ApplicationStatus => {
    if (article.isFacultyPaid || article.facultyStatus === 'จ่ายเงินแล้ว') return 'paid';
    if (article.rawApp?.status) return article.rawApp.status;
    if (article.facultyStatus.includes('การเงิน') || article.facultyStatus.includes('ฎีกา')) return 'finance_processing';
    if (article.facultyStatus.includes('คณบดี')) return 'dean_approved';
    if (article.facultyStatus.includes('ตรวจ')) return 'staff_verified';
    if (article.facultyStatus === 'เตรียมเบิก') return 'draft';
    return 'submitted';
  };

  const [facultyStatus, setFacultyStatus] = useState<ApplicationStatus>(getInitialFacStatusKey());
  const [facultyVoucherNo, setFacultyVoucherNo] = useState<string>(article.facultyVoucherNo || '');
  const [facultyPaymentDate, setFacultyPaymentDate] = useState<string>(article.facultyPaymentDate || '');
  const [facultyRewardAmount, setFacultyRewardAmount] = useState<number>(article.facultyRewardAmount || 0);
  const [facultyPageChargeAmount, setFacultyPageChargeAmount] = useState<number>(article.facultyPageChargeAmount || 0);

  // Calculations
  const calculatedNuTotal = (Number(nuRewardAmount) || 0) + (Number(nuPageChargeAmount) || 0);
  const calculatedFacultyTotal = (Number(facultyRewardAmount) || 0) + (Number(facultyPageChargeAmount) || 0);
  const calculatedGrandTotal = calculatedNuTotal + calculatedFacultyTotal;

  const todayStr = new Date().toISOString().split('T')[0];

  // Quick Action: Mark both as paid today
  const handleMarkBothPaidToday = () => {
    setNuStatus('จ่ายเงินแล้ว');
    setNuPaymentDate(todayStr);
    setFacultyStatus('paid');
    setFacultyPaymentDate(todayStr);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Process NU updates
    const isNuPaid = nuStatus.includes('จ่ายเงินแล้ว') || Boolean(nuPaymentDate.trim());
    
    if (article.rawNuRecord) {
      const updatedNu: NuDisbursementRecord = {
        ...article.rawNuRecord,
        status: nuStatus,
        approvedDate: nuApprovedDate.trim() || undefined,
        paymentDate: nuPaymentDate.trim() || undefined,
        nuDisbursementVoucherNo: nuVoucherNo.trim() || undefined,
        rewardAmount: Number(nuRewardAmount) || 0,
        pageChargeAmount: Number(nuPageChargeAmount) || 0,
        totalAmount: calculatedNuTotal,
        isNuPaidConfirmed: isNuPaid,
        // If this record has no rawApp, store faculty info directly on rawNuRecord
        facultyStatus: facultyStatus === 'paid' ? 'paid' : facultyStatus,
        disbursementVoucherNo: facultyVoucherNo.trim() || undefined,
        facultyPaymentDate: facultyPaymentDate.trim() || undefined,
        facultyRewardAmount: Number(facultyRewardAmount) || 0,
        facultyPageChargeAmount: Number(facultyPageChargeAmount) || 0,
        facultyTotalAmount: calculatedFacultyTotal,
        updatedAt: todayStr,
      };
      onSaveNu(updatedNu);
    } else {
      // Create new NU Record if none existed
      const createdNu: NuDisbursementRecord = {
        id: `nu-auto-${Date.now()}`,
        researcherName: article.researcherName,
        articleTitle: article.articleTitle,
        department: article.department,
        submissionDate: todayStr,
        claimType: 'รางวัลการตีพิมพ์และ Page Charge',
        status: nuStatus,
        approvedDate: nuApprovedDate.trim() || undefined,
        paymentDate: nuPaymentDate.trim() || undefined,
        nuDisbursementVoucherNo: nuVoucherNo.trim() || undefined,
        rewardAmount: Number(nuRewardAmount) || 0,
        pageChargeAmount: Number(nuPageChargeAmount) || 0,
        totalAmount: calculatedNuTotal,
        fiscalYear: article.fiscalYear,
        matchedFacultyTrackingNo: article.facultyTrackingNo,
        facultyTrackingNo: article.facultyTrackingNo,
        facultyStatus: facultyStatus === 'paid' ? 'paid' : facultyStatus,
        disbursementVoucherNo: facultyVoucherNo.trim() || undefined,
        facultyPaymentDate: facultyPaymentDate.trim() || undefined,
        facultyRewardAmount: Number(facultyRewardAmount) || 0,
        facultyPageChargeAmount: Number(facultyPageChargeAmount) || 0,
        facultyTotalAmount: calculatedFacultyTotal,
        isNuPaidConfirmed: isNuPaid,
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      onSaveNu(createdNu);
    }

    // 2. Process Faculty updates
    if (article.rawApp) {
      const stepMap: Partial<Record<ApplicationStatus, number>> = {
        paid: 12,
        finance_processing: 10,
        dean_approved: 8,
        staff_verified: 4,
        submitted: 2,
        draft: 1,
        rejected: 1,
      };

      const updatedApp: ResearchApplication = {
        ...article.rawApp,
        status: facultyStatus,
        currentStep: stepMap[facultyStatus] || article.rawApp.currentStep,
        paymentStatus: facultyStatus === 'paid' ? 'transferred' : (facultyPaymentDate.trim() ? 'transferred' : article.rawApp.paymentStatus),
        paymentDate: facultyPaymentDate.trim() || article.rawApp.paymentDate,
        disbursementVoucherNo: facultyVoucherNo.trim() || article.rawApp.disbursementVoucherNo,
        claimedRewardAmount: Number(facultyRewardAmount) || 0,
        approvedPageChargeAmount: Number(facultyPageChargeAmount) || 0,
        totalClaimedAmount: calculatedFacultyTotal,
        updatedAt: todayStr,
      };
      onSaveFaculty(updatedApp);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-lg border border-amber-500/30 font-bold">
              ✏️
            </div>
            <div>
              <h3 className="text-base font-bold font-prompt flex items-center gap-2">
                <span>แก้ไขข้อมูลการเบิกจ่าย (สถานะ มน. และ คณะฯ)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-slate-950">
                  สิทธิ์ผู้ดูแลระบบ
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                ปีงบประมาณ {article.fiscalYear} • ปรับปรุงสถานะ เลขฎีกา วันที่โอน และยอดเงินสนับสนุน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">

          {/* Article Summary Box */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                ปี {article.fiscalYear}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                {article.categoryLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                {article.fundingSourceLabel}
              </span>
              {article.facultyTrackingNo && (
                <span className="text-[11px] font-mono text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {article.facultyTrackingNo}
                </span>
              )}
            </div>

            <div className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2">
              {article.articleTitle}
            </div>

            <div className="text-xs text-slate-600 flex flex-wrap gap-4 pt-1 border-t border-slate-200/80">
              <span><strong>อาจารย์ผู้วิจัย:</strong> {article.researcherName}</span>
              <span><strong>หน่วยงาน:</strong> {article.department}</span>
              {article.quartile && <span><strong>ระดับ:</strong> {article.quartile}</span>}
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/80 text-amber-900">
            <div className="flex items-center gap-1.5 font-medium text-xs">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>ปุ่มอำนวยความสะดวก:</span>
            </div>
            <button
              type="button"
              onClick={handleMarkBothPaidToday}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-md transition-colors text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ทำเครื่องหมาย "จ่ายเงินแล้ววันนี้" ทั้ง มน. และ คณะฯ</span>
            </button>
          </div>

          {/* 2-Column Grid: NU vs Faculty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Column 1: ม.นเรศวร (DRI NU) */}
            <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-200 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                <span className="font-bold text-blue-950 text-sm flex items-center gap-1.5 font-prompt">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>ส่วน ม.นเรศวร (DRI NU)</span>
                </span>
                <span className="text-xs font-mono font-bold text-blue-900">
                  รวม: ฿{calculatedNuTotal.toLocaleString()}
                </span>
              </div>

              {/* สถานะ มน. */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานะการเบิกจ่าย มน. <span className="text-red-500">*</span>
                </label>
                <select
                  value={nuStatus}
                  onChange={(e) => setNuStatus(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="จ่ายเงินแล้ว">✅ จ่ายเงินแล้ว</option>
                  <option value="ส่งการเงินรวมศูนย์เพื่อเบิกจ่าย">🏦 ส่งการเงินรวมศูนย์เพื่อเบิกจ่าย</option>
                  <option value="อนุมัติแล้ว">📄 อนุมัติแล้ว</option>
                  <option value="อยู่ระหว่างการจัดส่งเอกสาร">📬 อยู่ระหว่างการจัดส่งเอกสาร</option>
                  <option value="เข้าระบบ">📥 เข้าระบบ</option>
                  <option value="ไม่เข้าเกณฑ์ มน.">❌ ไม่เข้าเกณฑ์ มน.</option>
                  <option value="ยังไม่ได้ยื่น มน.">⏳ ยังไม่ได้ยื่น มน.</option>
                </select>
              </div>

              {/* วันที่อนุมัติ มน. */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">วันที่อนุมัติ มน.</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNuApprovedDate(todayStr);
                      if (nuStatus === 'อยู่ระหว่างการจัดส่งเอกสาร' || nuStatus === 'เข้าระบบ') {
                        setNuStatus('อนุมัติแล้ว');
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    ตั้งเป็นวันนี้
                  </button>
                </div>
                <input
                  type="date"
                  value={nuApprovedDate}
                  onChange={(e) => setNuApprovedDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* วันที่จ่ายเงิน มน. */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">วันที่จ่ายเงิน / โอนเงิน มน.</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNuPaymentDate(todayStr);
                      setNuStatus('จ่ายเงินแล้ว');
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    ตั้งเป็นวันนี้ & จ่ายแล้ว
                  </button>
                </div>
                <input
                  type="date"
                  value={nuPaymentDate}
                  onChange={(e) => {
                    setNuPaymentDate(e.target.value);
                    if (e.target.value && nuStatus !== 'จ่ายเงินแล้ว') {
                      setNuStatus('จ่ายเงินแล้ว');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* เลขคำสั่งจ่าย มน. */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลขที่คำสั่งจ่าย / ฎีกา มน.
                </label>
                <input
                  type="text"
                  value={nuVoucherNo}
                  onChange={(e) => setNuVoucherNo(e.target.value)}
                  placeholder="เช่น PV0204069110037 หรือ AP020..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* ยอดเงิน มน. */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200/60">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">เงินรางวัล มน. (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={nuRewardAmount}
                    onChange={(e) => setNuRewardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-right font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">เพจชาร์จ มน. (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={nuPageChargeAmount}
                    onChange={(e) => setNuPageChargeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-right font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: คณะแพทยศาสตร์ */}
            <div className="bg-purple-50/30 rounded-xl p-4 border border-purple-200 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-purple-200">
                <span className="font-bold text-purple-950 text-sm flex items-center gap-1.5 font-prompt">
                  <Award className="w-4 h-4 text-purple-700" />
                  <span>ส่วน คณะแพทยศาสตร์</span>
                </span>
                <span className="text-xs font-mono font-bold text-purple-900">
                  รวม: ฿{calculatedFacultyTotal.toLocaleString()}
                </span>
              </div>

              {/* สถานะ คณะฯ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  สถานะการเบิกจ่าย คณะฯ <span className="text-red-500">*</span>
                </label>
                <select
                  value={facultyStatus}
                  onChange={(e) => setFacultyStatus(e.target.value as ApplicationStatus)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                >
                  <option value="paid">✅ จ่ายเงินแล้ว (โอนเข้าบัญชีแล้ว)</option>
                  <option value="finance_processing">🏦 งานการเงินจัดทำฎีกา / รอโอนเงิน</option>
                  <option value="dean_approved">✍️ คณบดีลงนามอนุมัติแล้ว</option>
                  <option value="staff_verified">🔎 เจ้าหน้าที่ตรวจสอบเอกสารแล้ว</option>
                  <option value="submitted">📥 ยื่นคำขอแล้ว (รอดำเนินการ)</option>
                  <option value="draft">📝 เตรียมเบิก / แบบร่าง</option>
                </select>
              </div>

              {/* เลขที่ฎีกา คณะฯ */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลขที่ฎีกา คณะฯ
                </label>
                <input
                  type="text"
                  value={facultyVoucherNo}
                  onChange={(e) => setFacultyVoucherNo(e.target.value)}
                  placeholder="เช่น ฎีกา 2203/69 หรือ ฎีกา 3606/70"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-purple-950 font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* วันที่โอนเงิน คณะฯ */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">วันที่โอนเงิน คณะฯ</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFacultyPaymentDate(todayStr);
                      setFacultyStatus('paid');
                    }}
                    className="text-[10px] text-purple-600 hover:text-purple-800 underline font-medium"
                  >
                    ตั้งเป็นวันนี้ & จ่ายแล้ว
                  </button>
                </div>
                <input
                  type="date"
                  value={facultyPaymentDate}
                  onChange={(e) => {
                    setFacultyPaymentDate(e.target.value);
                    if (e.target.value && facultyStatus !== 'paid') {
                      setFacultyStatus('paid');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* ยอดเงิน คณะฯ */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-200/60">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">เงินรางวัล คณะฯ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={facultyRewardAmount}
                    onChange={(e) => setFacultyRewardAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-right font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">เพจชาร์จ คณะฯ (บาท)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={facultyPageChargeAmount}
                    onChange={(e) => setFacultyPageChargeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 font-mono text-right font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Application Link Note */}
              <div className="text-[10px] text-slate-500 bg-white/80 p-2 rounded-lg border border-purple-100 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span>
                  {article.rawApp 
                    ? `เชื่อมโยงกับคำขอ ${article.rawApp.trackingNo} ในระบบคณะฯ (ซิงก์ Cloudflare D1 อัตโนมัติ)`
                    : 'รายการนำเข้าประวัติ (บันทึกข้อมูลฝั่งคณะฯ ลงในตารางประวัติเบิกจ่าย)'}
                </span>
              </div>
            </div>

          </div>

          {/* Grand Total Summary Banner */}
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-300 flex items-center justify-between text-xs font-prompt">
            <div>
              <span className="font-bold text-amber-950 block">ยอดรวมเงินสนับสนุนทั้งสิ้น (มน. + คณะ):</span>
              <span className="text-[11px] text-amber-800">
                มน. ฿{calculatedNuTotal.toLocaleString()} + คณะฯ ฿{calculatedFacultyTotal.toLocaleString()}
              </span>
            </div>
            <span className="text-xl font-bold text-amber-950 font-mono">
              ฿{calculatedGrandTotal.toLocaleString()}
            </span>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไขข้อมูล</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
