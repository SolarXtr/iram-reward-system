import React, { useState } from 'react';
import { 
  X, 
  User, 
  ShieldCheck, 
  Building2, 
  Phone, 
  Mail, 
  CreditCard, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  Info,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { UserProfile } from '../types';
import { 
  formatThaiCitizenId, 
  formatKrungsriAccountNo, 
  maskThaiCitizenId, 
  maskBankAccountNo 
} from '../data/regulations';
import { MOCK_NU_USERS } from '../data/userProfile';

interface UserProfileModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSaveProfile: (updated: UserProfile) => void;
  onSwitchUser?: (user: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  onClose,
  onSaveProfile,
  onSwitchUser,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...currentUser });
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleSelectAccount = (user: UserProfile) => {
    setFormData({ ...user });
    if (onSwitchUser) {
      onSwitchUser(user);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-base shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-prompt">
                  ข้อมูลโปรไฟล์ผู้ใช้งาน (NU Single Sign-On)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  PDPA Secured
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                ข้อมูลตั้งต้นสำหรับระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>บันทึกข้อมูลโปรไฟล์ตั้งต้นเรียบร้อยแล้ว</span>
            </div>
          )}

          {/* Account Selector Bar (Simulation of switching accounts) */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                บัญชีผู้ใช้งานที่เข้าสู่ระบบ (Active Account):
              </span>
              <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                NU Identity Provider (OAuth2/GSuite)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {MOCK_NU_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectAccount(user)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    formData.email === user.email
                      ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="font-bold truncate text-[11px]">{user.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{user.email}</div>
                  <div className="text-[9px] text-amber-700 font-medium mt-0.5">
                    {user.role === 'admin' 
                      ? 'ผู้ดูแลระบบ / วิจัย / ประสานงาน' 
                      : user.role === 'researcher' 
                        ? 'นักวิจัย' 
                        : user.role === 'coordinator' 
                          ? 'เจ้าหน้าที่วิจัย' 
                          : 'งานการเงิน'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm">
            <div className="sm:col-span-2 flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-xs font-prompt flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-600" />
                ข้อมูลส่วนบุคคลและสังกัด (Personal & Affiliation)
              </span>
              <span className="text-[10px] text-slate-400">ระบบจะใช้เป็นค่าตั้งต้นอัตโนมัติในแบบคำขอ</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ชื่อ - นามสกุล (พร้อมคำนำหน้า)*</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ตำแหน่งทางวิชาการ/ตำแหน่งงาน</label>
              <input
                type="text"
                value={formData.academicPosition}
                onChange={(e) => setFormData({ ...formData, academicPosition: e.target.value })}
                placeholder="เช่น เจ้าหน้าที่วิจัย, ผู้ช่วยศาสตราจารย์"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">ตำแหน่งบริหาร (ถ้ามี)</label>
              <input
                type="text"
                value={formData.administrativePosition || ''}
                onChange={(e) => setFormData({ ...formData, administrativePosition: e.target.value })}
                placeholder="เช่น ปฏิบัติหน้าที่ในตำแหน่งหัวหน้าหน่วยบริหารและจัดการงานวิจัย"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">ภาควิชา/หน่วยงานสังกัด*</label>
              <input
                type="text"
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ภายในมหาวิทยาลัย*</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 5588"
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-700 mb-1">อีเมลทางการของมหาวิทยาลัยนเรศวร (@nu.ac.th)*</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-8 pr-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sensitive Financial & ID Data with PDPA Masking */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700" />
                <span className="font-bold text-amber-950 text-xs font-prompt">
                  ข้อมูลอ่อนไหวตามระเบียบการเบิกจ่าย (PDPA Protected Information)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-medium text-[11px] bg-white px-2.5 py-1 rounded border border-blue-200 shadow-xs"
              >
                {showSensitiveData ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ซ่อนข้อมูล (Mask)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>แสดงข้อมูลจริง (Unmask)</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  เลขประจำตัวประชาชน (13 หลัก)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={17}
                    value={
                      showSensitiveData
                        ? formData.idCardNo
                        : maskThaiCitizenId(formData.idCardNo)
                    }
                    onChange={(e) => {
                      const val = formatThaiCitizenId(e.target.value);
                      setFormData({ ...formData, idCardNo: val });
                    }}
                    placeholder="x-xxxx-xxxxx-xx-x"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  เลขที่บัญชี ธ.กรุงศรีอยุธยา สาขา ม.นเรศวร
                </label>
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    maxLength={13}
                    value={
                      showSensitiveData
                        ? formData.bankAccountNo
                        : maskBankAccountNo(formData.bankAccountNo)
                    }
                    onChange={(e) => {
                      const val = formatKrungsriAccountNo(e.target.value);
                      setFormData({ ...formData, bankAccountNo: val });
                    }}
                    placeholder="xxx-x-xxxxx-x"
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PDPA Governance Statement */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>การปฏิบัติตามหลักการคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance)</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed text-slate-600">
              <li>
                <strong>Data Minimization:</strong> ระบบจัดเก็บและใช้งานเฉพาะข้อมูลที่จำเป็นต่อการตรวจสอบสิทธิ์และโอนเงินรางวัล
              </li>
              <li>
                <strong>Role-Based Access Control (RBAC):</strong> เฉพาะเจ้าหน้าที่การเงินและงานวิจัยที่ได้รับแต่งตั้งเท่านั้นที่มีสิทธิ์ตรวจดูเลขบัญชีและเลขประจำตัวประชาชนฉบับเต็ม
              </li>
              <li>
                <strong>Data Retention:</strong> ข้อมูลคำขอจะถูกเก็บรักษาไว้ตามระเบียบพัสดุและการคลัง 10 ปี เพื่อการตรวจสอบของ สตง.
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg text-xs"
            >
              ปิดหน้าต่าง
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg text-xs shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูลโปรไฟล์</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
