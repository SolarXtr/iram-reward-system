import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Phone, 
  CreditCard, 
  Lock, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';

interface ResearcherActivationModalProps {
  isOpen: boolean;
  currentUser: UserProfile;
  onActivate: (updatedProfile: UserProfile) => Promise<void>;
  onLogout: () => void;
}

export const MED_DEPARTMENTS = [
  'ภาควิชาศัลยศาสตร์',
  'ภาควิชาอายุรศาสตร์',
  'ภาควิชากุมารเวชศาสตร์',
  'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
  'ภาควิชาออร์โธปิดิกส์',
  'ภาควิชาพยาธิวิทยา',
  'ภาควิชารังสีวิทยา',
  'ภาควิชาวิสัญญีวิทยา',
  'ภาควิชาจักษุวิทยา',
  'ภาควิชาโสต ศอ นาสิกวิทยา',
  'ภาควิชาจิตเวชศาสตร์',
  'ภาควิชาเวชศาสตร์ชุมชน',
  'ภาควิชาเวชศาสตร์ครอบครัว',
  'ภาควิชากายวิภาคศาสตร์',
  'ภาควิชาสรีรวิทยา',
  'ภาควิชาชีวเคมี',
  'ภาควิชาเภสัชวิทยา',
  'ภาควิชาจุลชีววิทยาและปรสิตวิทยา',
  'หน่วยบริหารและจัดการงานวิจัย งานวิจัย คณะแพทยศาสตร์',
  'งานวิจัย คณะแพทยศาสตร์',
  'งานคลัง สำนักงานเลขานุการ คณะแพทยศาสตร์',
  'สำนักงานเลขานุการ คณะแพทยศาสตร์',
  'สถานวิทยาศาสตร์คลินิก',
  'สถานวิทยาศาสตร์พรีคลินิก',
  'ฝ่ายการพยาบาล โรงพยาบาลมหาวิทยาลัยนเรศวร',
  'โรงพยาบาลมหาวิทยาลัยนเรศวร'
];

export const ACADEMIC_POSITIONS = [
  'อาจารย์',
  'อาจารย์ ดร.',
  'อาจารย์ นพ.',
  'อาจารย์ พญ.',
  'ผู้ช่วยศาสตราจารย์',
  'ผู้ช่วยศาสตราจารย์ ดร.',
  'ผู้ช่วยศาสตราจารย์ นพ.',
  'ผู้ช่วยศาสตราจารย์ พญ.',
  'รองศาสตราจารย์',
  'รองศาสตราจารย์ ดร.',
  'รองศาสตราจารย์ นพ.',
  'รองศาสตราจารย์ พญ.',
  'ศาสตราจารย์',
  'ศาสตราจารย์ ดร.',
  'ศาสตราจารย์ นพ.',
  'ศาสตราจารย์ พญ.',
  'เจ้าหน้าที่วิจัย',
  'นักวิทยาศาสตร์',
  'นักวิชาการศึกษา',
  'พยาบาลวิชาชีพ',
  'แพทย์เพิ่มพูนทักษะ',
  'แพทย์ประจำบ้าน',
  'นิสิตแพทย์ / นิสิตบัณฑิตศึกษา'
];

export const ResearcherActivationModal: React.FC<ResearcherActivationModalProps> = ({
  isOpen,
  currentUser,
  onActivate,
  onLogout,
}) => {
  const [step, setStep] = useState<'notice' | 'form'>('notice');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form states
  const [name, setName] = useState(currentUser.name || '');
  const [academicPosition, setAcademicPosition] = useState(
    currentUser.academicPosition && currentUser.academicPosition !== 'อาจารย์ / นักวิจัย'
      ? currentUser.academicPosition 
      : 'อาจารย์ ดร.'
  );
  const [department, setDepartment] = useState(
    currentUser.department && currentUser.department !== 'คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร'
      ? currentUser.department 
      : MED_DEPARTMENTS[0]
  );
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [idCardNo, setIdCardNo] = useState(currentUser.idCardNo || '');
  const [bankName] = useState('ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร');
  const [bankAccountNo, setBankAccountNo] = useState(currentUser.bankAccountNo || '');
  const [pdpaConsent, setPdpaConsent] = useState(true);

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('กรุณาระบุชื่อ-นามสกุล พร้อมคำนำหน้า');
      return;
    }
    if (!academicPosition.trim()) {
      setErrorMessage('กรุณาเลือกหรือระบุตำแหน่งทางวิชาการ/ตำแหน่งงาน');
      return;
    }
    if (!department.trim() || department === '-') {
      setErrorMessage('กรุณาเลือกภาควิชา/หน่วยงานต้นสังกัดในคณะแพทยศาสตร์');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('กรุณาระบุเบอร์โทรศัพท์ภายในหรือเบอร์มือถือสำหรับติดต่อ');
      return;
    }
    if (!idCardNo.trim()) {
      setErrorMessage('กรุณาระบุเลขประจำตัวประชาชน 13 หลัก สำหรับยืนยันตัวตนตามระเบียบการเงิน');
      return;
    }
    if (!pdpaConsent) {
      setErrorMessage('กรุณาให้ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: UserProfile = {
        ...currentUser,
        name: name.trim(),
        academicPosition: academicPosition.trim(),
        department: department.trim(),
        phone: phone.trim(),
        idCardNo: idCardNo.trim(),
        bankName,
        bankAccountNo: bankAccountNo.trim(),
        role: 'researcher',
        roles: Array.from(new Set([...(currentUser.roles || []), 'researcher' as const])),
        isNuAccount: true,
        status: 'active',
        isPendingProfile: false,
      };

      await onActivate(updated);
    } catch (err: any) {
      console.error('Failed to activate researcher role:', err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh] text-xs"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-indigo-900/40 relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-400/90 tracking-wider uppercase font-prompt block">
                คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white font-prompt leading-snug">
                {step === 'notice' 
                  ? 'กรอกข้อมูลส่วนบุคคลให้ครบถ้วน / เปิดสิทธิ์ยื่นคำขอค่า page charge / เงินรางวัล' 
                  : 'แบบฟอร์มยืนยันสังกัดและข้อมูลติดต่อ (เปิดสิทธิ์นักวิจัย)'}
              </h3>
            </div>
          </div>
        </div>

        {/* STEP 1: NOTICE & PENDING STATE VIEW */}
        {step === 'notice' && (
          <div className="p-6 sm:p-7 overflow-y-auto space-y-5">
            {/* Status Highlight Banner */}
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <div className="font-bold text-amber-950 text-sm font-prompt">
                  กรอกข้อมูลส่วนบุคคลให้ครบถ้วน / เปิดสิทธิ์ยื่นคำขอค่า page charge / เงินรางวัล
                </div>
                <p className="text-amber-900/80 leading-relaxed text-xs">
                  ระบบตรวจสอบพบว่าท่านได้เข้าสู่ระบบด้วยบัญชี <strong className="font-mono text-amber-950">{currentUser.email}</strong> เป็นครั้งแรก หรือยังไม่ได้ลงทะเบียนสังกัดภาควิชาในฐานข้อมูลคณะแพทยศาสตร์
                </p>
              </div>
            </div>

            {/* Explanation List */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-3">
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>มาตรการตรวจสอบความเป็นบุคลากรคณะแพทยศาสตร์</span>
              </div>
              <ul className="space-y-2 text-slate-600 leading-relaxed text-[11px]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>สงวนสิทธิ์การยื่นคำขอรับทุนและเงินรางวัลเฉพาะคณาจารย์ แพทย์ และบุคลากรสังกัดคณะแพทยศาสตร์ ม.นเรศวร เท่านั้น</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>เมื่อยืนยันภาควิชาและข้อมูลติดต่อ ระบบจะ<strong>เปิดสิทธิ์นักวิจัย (Researcher Role) ให้ทันทีอัตโนมัติ</strong> เพื่อให้ท่านสามารถสร้างคำขอ บันทึกร่าง และใช้งานระบบได้ทันที</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>เลขที่บัญชีธนาคารกรุงศรีอยุธยา <strong>สามารถกรอกตอนนี้หรือเว้นไว้กรอกภายหลังก่อนเบิกจ่ายได้</strong></span>
                </li>
              </ul>
            </div>

            {/* Current SSO Account Card */}
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name ? currentUser.name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[11px] text-blue-700 font-mono">{currentUser.email}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                NU SSO Authenticated
              </span>
            </div>

            {/* Buttons: Activate vs Logout */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] font-prompt cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>เปิดใช้งานสิทธิ์นักวิจัย</span>
                <ChevronRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="w-full sm:w-auto py-3 px-5 border border-slate-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 hover:border-rose-200 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>ยกเลิก (ออกจากระบบ)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE CONFIRMATION & ACTIVATION FORM */}
        {step === 'form' && (
          <form onSubmit={handleSubmitForm} className="p-6 sm:p-7 overflow-y-auto space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setStep('notice')}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium text-xs transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
              <span className="text-[11px] text-amber-700 font-medium">
                * ระบุข้อมูลที่จำเป็นเพื่อเปิดสิทธิ์
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  คำนำหน้า และชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ผู้ช่วยศาสตราจารย์ นายแพทย์สมชาย ใจดี"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-slate-50/50"
                />
              </div>

              {/* Academic Position */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ตำแหน่งทางวิชาการ / ตำแหน่งงาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  list="academic-positions-list"
                  value={academicPosition}
                  onChange={(e) => setAcademicPosition(e.target.value)}
                  placeholder="เลือกหรือพิมพ์ตำแหน่ง เช่น อาจารย์ ดร., ผศ.นพ."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white"
                />
                <datalist id="academic-positions-list">
                  {ACADEMIC_POSITIONS.map((pos) => (
                    <option key={pos} value={pos} />
                  ))}
                </datalist>
              </div>

              {/* Department */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  ภาควิชา / สังกัดในคณะแพทยศาสตร์ <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-medium"
                >
                  {MED_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ภายใน / มือถือ <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="เช่น 5502 หรือ 081-xxx-xxxx"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white"
                  />
                </div>
              </div>

              {/* National ID Card (13 digits) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={17}
                    value={idCardNo}
                    onChange={(e) => setIdCardNo(e.target.value)}
                    placeholder="x-xxxx-xxxxx-xx-x"
                    className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono bg-white"
                  />
                </div>
                <span className="text-[10px] text-slate-400">ใช้สำหรับยืนยันตัวตนและการเงิน</span>
              </div>

              {/* Email (Readonly from SSO) */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  อีเมลทางการมหาวิทยาลัยนเรศวร (@nu.ac.th)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-500 bg-slate-100 cursor-not-allowed"
                />
              </div>

              {/* Bank Account Number (OPTIONAL: กรอกหรือยังไม่กรอกก็ได้) */}
              <div className="sm:col-span-2 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-amber-950 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>เลขที่บัญชีธนาคารกรุงศรีอยุธยา (สาขามหาวิทยาลัยนเรศวร)</span>
                  </label>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                    กรอกหรือยังไม่กรอกก็ได้ (ไม่บังคับ)
                  </span>
                </div>
                <input
                  type="text"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  placeholder="เช่น 346-1-xxxxx-x (สามารถเว้นว่างไว้กรอกภายหลังก่อนทำเรื่องเบิกจ่ายได้)"
                  className="w-full px-3 py-2 border border-amber-300/80 rounded-xl text-xs font-mono focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white"
                />
                <p className="text-[10px] text-amber-800/80">
                  💡 หากยังไม่มีหรือจำไม่ได้ สามารถเว้นว่างไว้และมาอัปเดตในหน้าโปรไฟล์ภายหลังได้
                </p>
              </div>

              {/* PDPA Checkbox */}
              <div className="sm:col-span-2 pt-1">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={pdpaConsent}
                    onChange={(e) => setPdpaConsent(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mt-0.5"
                  />
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    ข้าพเจ้ายินยอมให้คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร เก็บรวบรวมและใช้ข้อมูลส่วนบุคคลข้างต้นเพื่อวัตถุประสงค์ในการตรวจสอบสิทธิ์ การบริหารจัดการทุนวิจัย และการเบิกจ่ายเงินรางวัลตามระเบียบของทางราชการ (PDPA Compliant)
                  </div>
                </label>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.99] font-prompt disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>กำลังบันทึกข้อมูลและเปิดสิทธิ์...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>ยืนยันข้อมูลและเปิดสิทธิ์นักวิจัยทันที</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-4 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
