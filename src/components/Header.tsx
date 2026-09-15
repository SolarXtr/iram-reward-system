import React from 'react';
import { 
  Building2, 
  FileText, 
  LayoutDashboard, 
  KanbanSquare, 
  TableProperties, 
  Calendar, 
  Code2, 
  Bell, 
  PlusCircle, 
  UserCheck, 
  Search,
  CheckCircle2,
  ShieldCheck,
  User,
  FileSpreadsheet
} from 'lucide-react';
import { UserProfile } from '../types';

export type UserRole = 'researcher' | 'coordinator' | 'finance';
export type ActiveTab = 'dashboard' | 'table' | 'kanban' | 'calendar' | 'appscript' | 'line_oa';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewSubmission: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadCount?: number;
  currentUser?: UserProfile;
  onOpenProfile?: () => void;
  onOpenGoogleSheetsSettings?: () => void;
  isSheetsConnected?: boolean;
  googleUser?: any;
  onGoogleSignIn?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  setCurrentRole,
  activeTab,
  setActiveTab,
  onOpenNewSubmission,
  searchQuery,
  setSearchQuery,
  unreadCount = 2,
  currentUser,
  onOpenProfile,
  onOpenGoogleSheetsSettings,
  isSheetsConnected = false,
  googleUser,
  onGoogleSignIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top Banner / Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-800/80">
          {/* Logo & University Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs tracking-wider uppercase font-semibold text-amber-400/90 font-prompt">
                  คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  ประกาศ พ.ศ. 2567
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-prompt">
                ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย
              </h1>
            </div>
          </div>

          {/* Quick Search & Actions */}
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative hidden md:block w-56 lg:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา AWP.., ชื่อ, วารสาร..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
              />
            </div>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/70 text-xs">
              <button
                onClick={() => setCurrentRole('researcher')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  currentRole === 'researcher'
                    ? 'bg-amber-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="มุมมองนักวิจัย (กรอกข้อมูล, ปริ้นเอกสาร, เช็คเงินโอน)"
              >
                <span>นักวิจัย</span>
              </button>
              <button
                onClick={() => setCurrentRole('coordinator')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  currentRole === 'coordinator'
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="มุมมองผู้ประสานงานวิจัย (ตรวจเอกสาร, บันทึกข้อความ, ไทม์ไลน์)"
              >
                <span>เจ้าหน้าที่วิจัย</span>
              </button>
              <button
                onClick={() => setCurrentRole('finance')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  currentRole === 'finance'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
                title="มุมมองงานการเงิน (จัดทำฎีกา, บันทึกการโอนเงิน)"
              >
                <span>งานการเงิน</span>
              </button>
            </div>

            {/* User Profile / SSO Account Button */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 transition-all text-xs"
              title="ดูโปรไฟล์บัญชีผู้ใช้และมาตรการคุ้มครองข้อมูล PDPA"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-[11px] border border-amber-400/40">
                {currentUser?.name ? currentUser.name.charAt(currentUser.name.indexOf(' ') > 0 ? currentUser.name.indexOf(' ') + 1 : 0) : 'T'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="font-semibold text-white leading-tight truncate max-w-[130px]">
                  {currentUser?.name || 'ดร.ทินกร หอมดี'}
                </div>
                <div className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[130px]">
                  {currentUser?.email || 'tinnakornh@nu.ac.th'}
                </div>
              </div>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </button>

            {/* Google Account / Sign in with Google Button */}
            {googleUser ? (
              <div 
                onClick={onOpenGoogleSheetsSettings}
                className="cursor-pointer hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 transition-all text-xs"
                title={`เข้าสู่ระบบด้วย Google: ${googleUser.email}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span className="text-slate-300 font-medium truncate max-w-[110px]">
                  {googleUser.displayName ? googleUser.displayName.split(' ')[0] : googleUser.email.split('@')[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
            ) : (
              <button
                onClick={onGoogleSignIn || onOpenGoogleSheetsSettings}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold shadow-xs transition-all border border-slate-200 active:scale-95"
                title="Sign in with Google เพื่อเชื่อมต่อ Google Sheets โดยตรง"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google</span>
              </button>
            )}

            {/* Google Sheets Sync Settings Button */}
            <button
              onClick={onOpenGoogleSheetsSettings}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all text-xs ${
                isSheetsConnected
                  ? 'bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border-emerald-700/60 shadow-sm'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-amber-300 border-amber-500/40'
              }`}
              title={isSheetsConnected ? 'Google Sheets: เชื่อมต่อแล้ว (คลิกเพื่อดูการตั้งค่า/ซิงก์ข้อมูล)' : 'ยังไม่ได้เชื่อมต่อ Google Sheets API (คลิกเพื่อตั้งค่า Web App URL)'}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="hidden sm:inline font-medium">Google Sheets</span>
              <span className={`w-2 h-2 rounded-full ${isSheetsConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
            </button>

            {/* Primary Action Button */}
            <button
              id="btn-new-submission"
              onClick={onOpenNewSubmission}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">ยื่นคำขอใหม่</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between overflow-x-auto py-2 scrollbar-none">
          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>แดชบอร์ดสรุปสถานะ</span>
            </button>

            <button
              onClick={() => setActiveTab('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'kanban'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <KanbanSquare className="w-4 h-4" />
              <span>ติดตามแบบลากวาง (Kanban)</span>
            </button>

            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'table'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <TableProperties className="w-4 h-4" />
              <span>ตารางแก้ไขข้อมูลตนเอง</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>ปฏิทินรอบเบิกจ่าย (Google Calendar)</span>
            </button>

            <button
              onClick={() => setActiveTab('line_oa')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'line_oa'
                  ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>LINE OA (@414jvrca)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                4 Triggers
              </span>
            </button>

            <button
              onClick={() => setActiveTab('appscript')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                activeTab === 'appscript'
                  ? 'bg-slate-800 text-amber-400 border border-slate-700'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>Google Apps Script Suite</span>
            </button>
          </nav>

          {/* Current User Role Badge */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>สิทธิ์ปัจจุบัน:</span>
            <span className="font-semibold text-slate-200">
              {currentRole === 'researcher' && 'อาจารย์/นักวิจัย (ขอรับทุน)'}
              {currentRole === 'coordinator' && 'ผู้ประสานงานวิจัย (ตรวจเอกสาร)'}
              {currentRole === 'finance' && 'เจ้าหน้าที่การเงิน (เบิกจ่าย)'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
