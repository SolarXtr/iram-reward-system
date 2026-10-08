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
  Database,
  Users,
  Lock,
  LogOut,
  LogIn,
  Sparkles
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { LINE_NOTIFICATION_SYSTEM_ENABLED } from '../data/lineNotificationService';

export type { UserRole };
export type ActiveTab = 'dashboard' | 'quota_planner' | 'table' | 'kanban' | 'calendar' | 'line_oa' | 'user_management';

interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewSubmission: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  unreadCount?: number;
  draftsCount?: number;
  currentUser?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
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
  draftsCount = 0,
  currentUser,
  onOpenProfile,
  onOpenLoginModal,
  onLogout,
  onOpenGoogleSheetsSettings,
  isSheetsConnected = false,
  googleUser,
  onGoogleSignIn,
}) => {
  const isGuest = !currentUser;
  const userRoles: UserRole[] = currentUser?.roles && currentUser.roles.length > 0 
    ? currentUser.roles 
    : (currentUser?.role ? [currentUser.role] : ['researcher']);
  const isProfileAdmin = userRoles.includes('admin') || currentUser?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top Banner / Identity Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-16 ${!isGuest ? 'border-b border-slate-800/80' : ''}`}>
          {/* Logo & University Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <span className="text-xs tracking-wider uppercase font-semibold text-amber-400/90 font-prompt block">
                คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
              </span>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5 font-prompt">
                ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย
              </h1>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* GUEST MODE: Header right bar is kept clean (login action is in content) */}
            {isGuest ? null : (
              /* AUTHENTICATED MODE: Role switcher, Profile, D1, Submission, Logout */
              <>
                {/* Search input: Show for coordinator, finance, executive, admin (hide for researcher to keep clean) */}
                {currentRole !== 'researcher' && (
                  <div className="relative hidden md:block w-48 lg:w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="ค้นหา AWP.., ชื่อ, วารสาร..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                    />
                  </div>
                )}

                {/* Role Switcher: Only display if account has multiple roles or is Admin */}
                {(userRoles.length > 1 || isProfileAdmin) && (
                  <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/70 text-xs">
                    {(isProfileAdmin || userRoles.includes('researcher')) && (
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
                    )}

                    {(isProfileAdmin || userRoles.includes('coordinator')) && (
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
                    )}

                    {(isProfileAdmin || userRoles.includes('finance')) && (
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
                    )}

                    {(isProfileAdmin || userRoles.includes('executive')) && (
                      <button
                        onClick={() => setCurrentRole('executive')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                          currentRole === 'executive'
                            ? 'bg-indigo-600 text-white font-medium shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                        title="มุมมองผู้บริหาร (หัวหน้าภาควิชา / รองคณบดี / คณบดี)"
                      >
                        <span>ผู้บริหาร</span>
                      </button>
                    )}

                    {isProfileAdmin && (
                      <button
                        onClick={() => setCurrentRole('admin')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                          currentRole === 'admin'
                            ? 'bg-purple-600 text-white font-medium shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                        }`}
                        title="มุมมองผู้ดูแลระบบ (Admin - ตรวจสอบและจัดการได้ทุกขั้นตอน)"
                      >
                        <span>ผู้ดูแลระบบ</span>
                      </button>
                    )}
                  </div>
                )}

                {/* User Profile / SSO Account Button */}
                <button
                  onClick={onOpenProfile}
                  className="flex items-center gap-2 px-2.5 py-1 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/80 transition-all text-xs"
                  title="ดูโปรไฟล์บัญชีผู้ใช้และมาตรการคุ้มครองข้อมูล PDPA"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-[11px] border border-amber-400/40">
                    {currentUser?.name ? currentUser.name.charAt(currentUser.name.indexOf(' ') > 0 ? currentUser.name.indexOf(' ') + 1 : 0) : 'น'}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="font-semibold text-white leading-tight truncate max-w-[140px]">
                      {currentUser?.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight truncate max-w-[140px]">
                      {currentUser?.email}
                    </div>
                  </div>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </button>

                {/* Cloudflare D1 Database Connection Status: Show ONLY for Admin */}
                {currentRole === 'admin' && (
                  <div
                    className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-emerald-950/70 text-emerald-300 border-emerald-700/60 shadow-sm text-xs"
                    title="เชื่อมต่อฐานข้อมูล Cloudflare D1 (iram-db) เรียบร้อยแล้ว"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-medium">Cloudflare D1</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                  </div>
                )}

                {/* Primary Action Button: Show for Researcher, Coordinator, Admin (Hide for Finance & Executive) */}
                {(currentRole === 'researcher' || currentRole === 'coordinator' || currentRole === 'admin') && (
                  <button
                    id="btn-new-submission"
                    onClick={onOpenNewSubmission}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all transform active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span className="hidden sm:inline">ยื่นคำขอใหม่</span>
                  </button>
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 bg-slate-800/80 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 rounded-lg border border-slate-700/70 transition-colors"
                  title="ออกจากระบบ (Logout)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Tabs Bar: Only rendered for authenticated users */}
        {!isGuest && (
          <div className="flex items-center justify-between overflow-x-auto py-2 scrollbar-none">
            <nav className="flex items-center space-x-1 sm:space-x-2 text-xs">
              {/* Tab 1: Dashboard (All Roles) */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>
                  {currentRole === 'researcher' && 'แดชบอร์ดคำขอของฉัน'}
                  {currentRole === 'coordinator' && 'แดชบอร์ดภาพรวมคณะ'}
                  {currentRole === 'finance' && 'แดชบอร์ดงานการเงิน'}
                  {currentRole === 'executive' && 'แดชบอร์ดสรุปผู้บริหาร'}
                  {currentRole === 'admin' && 'แดชบอร์ดสรุปสถานะ'}
                </span>
              </button>

              {/* Tab: Quota Planner (เตรียมเบิกรางวัล & ตรวจสอบวงเงิน - Researcher & Admin) */}
              {(currentRole === 'researcher' || currentRole === 'admin') && (
                <button
                  onClick={() => setActiveTab('quota_planner')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'quota_planner'
                      ? 'bg-slate-800 text-amber-400 border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>เตรียมเบิกรางวัล & วงเงิน</span>
                  {draftsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {draftsCount} ร่าง
                    </span>
                  )}
                </button>
              )}

              {/* Tab 2: Kanban (Coordinator and Admin ONLY) */}
              {(currentRole === 'coordinator' || currentRole === 'admin') && (
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
              )}

              {/* Tab 3: Table View (All Roles) */}
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'table'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <TableProperties className="w-4 h-4" />
                <span>
                  {currentRole === 'researcher' && 'ตารางคำขอของฉัน'}
                  {currentRole === 'coordinator' && 'ตารางข้อมูลรวมทั้งคณะ'}
                  {currentRole === 'finance' && 'ตารางบันทึกเลขฎีกา/เงินโอน'}
                  {currentRole === 'executive' && 'ตารางสรุปคำขอ'}
                  {currentRole === 'admin' && 'ตารางแก้ไขข้อมูลทั้งหมด'}
                </span>
              </button>

              {/* Tab 4: Calendar (All Roles) */}
              <button
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'bg-slate-800 text-amber-400 border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>
                  {currentRole === 'researcher' ? 'ปฏิทินรอบเงินโอน' : 'ปฏิทินรอบเบิกจ่าย (Google Calendar)'}
                </span>
              </button>

              {/* Tab 5: LINE OA (Coordinator and Admin ONLY - แสดงเฉพาะเมื่อเปิดใช้งานระบบ) */}
              {(LINE_NOTIFICATION_SYSTEM_ENABLED && (currentRole === 'coordinator' || currentRole === 'admin')) && (
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
              )}

              {/* Tab 6: User Management (Admin ONLY) */}
              {currentRole === 'admin' && (
                <button
                  onClick={() => setActiveTab('user_management')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'user_management'
                      ? 'bg-slate-800 text-purple-400 border border-purple-500/50'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                  title="ระบบจัดการบัญชีผู้ใช้งาน และกำหนดสิทธิ์ (Admin Console)"
                >
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>จัดการผู้ใช้งาน (Users)</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin
                  </span>
                </button>
              )}
            </nav>

            {/* Current User Role Badge */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 pl-4 border-l border-slate-800">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>สิทธิ์ปัจจุบัน:</span>
              <span className="font-semibold text-slate-200">
                {currentRole === 'researcher' && 'เจ้าหน้าที่วิจัย/นักวิจัย (ขอรับทุน)'}
                {currentRole === 'coordinator' && 'ผู้ประสานงานวิจัย (ตรวจเอกสาร)'}
                {currentRole === 'finance' && 'เจ้าหน้าที่การเงิน (เบิกจ่าย)'}
                {currentRole === 'executive' && 'ผู้บริหาร (หัวหน้าภาค / รองคณบดี / คณบดี)'}
                {currentRole === 'admin' && 'ผู้ดูแลระบบ (Admin - ตรวจสอบและบริหารจัดการทุกสิทธิ์)'}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
