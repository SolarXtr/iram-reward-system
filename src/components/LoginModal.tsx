import React, { useState } from 'react';
import { 
  Building2, 
  LogIn, 
  ShieldCheck, 
  AlertCircle, 
  X, 
  GraduationCap, 
  Briefcase, 
  DollarSign, 
  Award, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { googleSignIn } from '../services/googleAuth';
import { processNuGoogleLogin, demoLoginAsRole } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (!res || !res.user) {
        throw new Error('ไม่สามารถเข้าสู่ระบบ Google ได้ กรุณาลองใหม่อีกครั้ง');
      }

      const outcome = processNuGoogleLogin({
        email: res.user.email,
        displayName: res.user.displayName,
        photoURL: res.user.photoURL,
      });

      if (!outcome.success || !outcome.user) {
        setErrorMessage(outcome.message || 'อีเมลนี้ไม่ได้รับอนุญาตให้เข้าใช้งาน');
        return;
      }

      onLoginSuccess(outcome.user);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-in exception:', err);
      // Format friendly error
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('หน้าต่างเข้าสู่ระบบถูกปิดก่อนทำรายการสำเร็จ');
      } else {
        setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sign-in');
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setErrorMessage(null);
    const user = demoLoginAsRole(role);
    onLoginSuccess(user);
    onClose();
  };

  const DEMO_ACCOUNTS = [
    {
      role: 'researcher' as UserRole,
      title: 'อาจารย์ / นักวิจัย',
      name: 'ผศ.ดร.สมหมาย วิจัยเจริญ',
      email: 'sommaiv@nu.ac.th',
      dept: 'ภาควิชาศัลยศาสตร์',
      icon: GraduationCap,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      btnHover: 'hover:border-amber-400 hover:bg-amber-50/50',
    },
    {
      role: 'coordinator' as UserRole,
      title: 'เจ้าหน้าที่บริหารงานวิจัย',
      name: 'คุณปรารถนา เอนกปัญญากุล',
      email: 'pararthanaa@nu.ac.th',
      dept: 'หน่วยบริหารและจัดการงานวิจัย',
      icon: Briefcase,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      btnHover: 'hover:border-blue-400 hover:bg-blue-50/50',
    },
    {
      role: 'finance' as UserRole,
      title: 'งานการเงินและบัญชี',
      name: 'คุณวิลาสินี การคลังมั่นคง',
      email: 'finance_med@nu.ac.th',
      dept: 'งานคลัง คณะแพทยศาสตร์',
      icon: DollarSign,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnHover: 'hover:border-emerald-400 hover:bg-emerald-50/50',
    },
    {
      role: 'executive' as UserRole,
      title: 'ผู้บริหาร (รองคณบดีฝ่ายวิจัย)',
      name: 'รศ.นพ.อาทิตย์ เหล่าเรืองธนา',
      email: 'arthitl@nu.ac.th',
      dept: 'ภาควิชาออร์โธปิดิกส์ / ฝ่ายวิจัย',
      icon: Award,
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      btnHover: 'hover:border-indigo-400 hover:bg-indigo-50/50',
    },
    {
      role: 'admin' as UserRole,
      title: 'ผู้ดูแลระบบ (Admin Console)',
      name: 'นายทินกรณ์ หาญณรงค์',
      email: 'tinnakornh@nu.ac.th',
      dept: 'หัวหน้าหน่วยบริหารและจัดการงานวิจัย',
      icon: Shield,
      badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
      btnHover: 'hover:border-purple-400 hover:bg-purple-50/50',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Building2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider font-prompt">
                  คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  @nu.ac.th
                </span>
              </div>
              <h2 className="text-lg font-bold text-white font-prompt">
                เข้าสู่ระบบด้วย NU Account
              </h2>
            </div>
          </div>

          <p className="mt-3 text-xs text-slate-300 leading-relaxed">
            ระบบคัดกรองการเข้าถึงเฉพาะอาจารย์และบุคลากร มหาวิทยาลัยนเรศวร เพื่อคุ้มครองข้อมูลส่วนบุคคลและข้อมูลทางการเงิน (PDPA)
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Error Message Box */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Primary Action: Official Google Workspace (@nu.ac.th) */}
          <div className="space-y-3">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoadingGoogle}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold rounded-2xl shadow-lg shadow-slate-900/10 border border-slate-700 flex items-center justify-center gap-3 transition-all text-sm group"
            >
              {isLoadingGoogle ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span className="font-prompt">
                {isLoadingGoogle ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google Workspace (@nu.ac.th)'}
              </span>
            </button>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>ตรวจรับรองโดเมน @nu.ac.th และสร้างสิทธิ์ให้อัตโนมัติ</span>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              หรือ ทดสอบตามบทบาท (Demo Login)
            </span>
          </div>

          {/* Demo Role Switcher Section */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              สำหรับกรรมการและผู้ตรวจประเมิน เลือกล็อกอินเพื่อทดสอบมุมมองตามสิทธิ์:
            </p>

            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((acc) => {
                const IconComponent = acc.icon;
                return (
                  <button
                    key={acc.role}
                    onClick={() => handleDemoLogin(acc.role)}
                    className={`w-full p-2.5 rounded-xl border border-slate-200/90 text-left flex items-center justify-between transition-all ${acc.btnHover} group`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-white group-hover:shadow-sm">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900 text-xs font-prompt">
                            {acc.title}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${acc.badgeColor}`}>
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <span>{acc.name}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px] text-slate-400">{acc.email}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>มาตรฐาน PDPA คณะแพทยศาสตร์</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
