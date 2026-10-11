import React, { useState } from 'react';
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
  Sparkles,
  BookOpen,
  Menu,
  X,
  LayoutGrid,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import { UserProfile, UserRole } from '../types';
import { LINE_NOTIFICATION_SYSTEM_ENABLED } from '../data/lineNotificationService';

export type { UserRole };
export type ActiveTab = 'dashboard' | 'quota_planner' | 'article_table' | 'table' | 'kanban' | 'calendar' | 'line_oa' | 'user_management';

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
  isAdminMenuExpanded?: boolean;
  onToggleAdminMenu?: () => void;
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
  isAdminMenuExpanded = true,
  onToggleAdminMenu,
}) => {
  const isGuest = !currentUser;
  const userRoles: UserRole[] = currentUser?.roles && currentUser.roles.length > 0 
    ? currentUser.roles 
    : (currentUser?.role ? [currentUser.role] : ['researcher']);
  const isProfileAdmin = userRoles.includes('admin') || currentUser?.role === 'admin';

  // Nav Tabs Definition for all roles
  interface NavTabDef {
    id: ActiveTab;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
    roles: UserRole[];
  }

  const allNavTabs: NavTabDef[] = [
    {
      id: 'dashboard',
      label: currentRole === 'researcher' ? 'แดชบอร์ดคำขอของฉัน' :
             currentRole === 'coordinator' ? 'แดชบอร์ดภาพรวมคณะ' :
             currentRole === 'finance' ? 'แดชบอร์ดงานการเงิน' :
             currentRole === 'executive' ? 'แดชบอร์ดสรุปผู้บริหาร' : 'แดชบอร์ดสรุปสถานะ',
      shortLabel: 'แดชบอร์ด',
      description: 'ภาพรวมสถิติและสถานะคำขอรับทุนทั้งหมด',
      icon: LayoutDashboard,
      roles: ['researcher', 'coordinator', 'finance', 'executive', 'admin'],
    },
    {
      id: 'quota_planner',
      label: 'เตรียมเบิกรางวัล & วงเงิน',
      shortLabel: 'เตรียมเบิก & วงเงิน',
      description: 'วางแผนเบิกรางวัลและเช็คสิทธิ์ 24 เดือน',
      icon: Sparkles,
      badge: draftsCount > 0 ? `${draftsCount} ร่าง` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      roles: ['researcher', 'admin'],
    },
    {
      id: 'article_table',
      label: currentRole === 'researcher' ? 'ตารางบทความของฉัน' : 'ตารางบทความรวม (มน. & คณะ)',
      shortLabel: 'ตารางบทความรวม',
      description: 'ตารางบทความรวม 3 หมวด (มน. & คณะ)',
      icon: BookOpen,
      badge: 'ใหม่',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      roles: ['researcher', 'coordinator', 'finance', 'executive', 'admin'],
    },
    {
      id: 'kanban',
      label: 'ติดตามแบบลากวาง (Kanban)',
      shortLabel: 'ติดตามแบบ Kanban',
      description: 'กระดานติดตามงานและขั้นตอน 12 ระดับ',
      icon: KanbanSquare,
      roles: ['coordinator', 'admin'],
    },
    {
      id: 'table',
      label: currentRole === 'researcher' ? 'ตารางคำขอของฉัน' :
             currentRole === 'coordinator' ? 'ตารางข้อมูลรวมทั้งคณะ' :
             currentRole === 'finance' ? 'ตารางบันทึกเลขฎีกา/เงินโอน' :
             currentRole === 'executive' ? 'ตารางสรุปคำขอ' : 'ตารางแก้ไขข้อมูลทั้งหมด',
      shortLabel: 'ตารางข้อมูล',
      description: 'ตารางจัดการและส่งออกข้อมูลทั้งหมด',
      icon: TableProperties,
      roles: ['researcher', 'coordinator', 'finance', 'executive', 'admin'],
    },
    {
      id: 'calendar',
      label: currentRole === 'researcher' ? 'ปฏิทินรอบเงินโอน' : 'ปฏิทินรอบเบิกจ่าย (Google Calendar)',
      shortLabel: 'ปฏิทินรอบเบิกจ่าย',
      description: 'ปฏิทินรอบเบิกจ่ายและการเงิน',
      icon: Calendar,
      roles: ['researcher', 'coordinator', 'finance', 'executive', 'admin'],
    },
    {
      id: 'line_oa',
      label: 'LINE OA (@414jvrca)',
      shortLabel: 'LINE OA',
      description: 'ระบบแจ้งเตือนผ่าน LINE Official Account',
      icon: Bell,
      badge: '4 Triggers',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      roles: LINE_NOTIFICATION_SYSTEM_ENABLED ? ['coordinator', 'admin'] : [],
    },
    {
      id: 'user_management',
      label: 'จัดการผู้ใช้งาน (Users)',
      shortLabel: 'จัดการผู้ใช้งาน',
      description: 'ระบบจัดการบัญชีผู้ใช้งาน และกำหนดสิทธิ์ (Admin Console)',
      icon: Users,
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      roles: ['admin'],
    },
  ];

  const availableTabs = allNavTabs.filter(tab => tab.roles.includes(currentRole));
  const activeTabItem = availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-lg">
      {/* Top Banner / Identity Bar */}
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 transition-all ${
        currentRole === 'admin' && isAdminMenuExpanded ? 'max-w-[1720px]' : 'max-w-7xl'
      }`}>
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

                {/* Primary Action Button: Show for Researcher and Coordinator only (Hidden for Admin/Finance/Executive) */}
                {(currentRole === 'researcher' || currentRole === 'coordinator') && (
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
          <div className="py-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between gap-3 min-w-0">
              
              {/* Left Side: Active Page Context & Compact Role Pill */}
              <div className="flex items-center gap-2 min-w-0 shrink-0">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs shrink-0 shadow-xs">
                  {activeTabItem && (
                    <>
                      <activeTabItem.icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-slate-400 font-medium text-[11px] hidden sm:inline">หน้าปัจจุบัน:</span>
                      <span className="font-semibold text-amber-300 truncate max-w-[150px] sm:max-w-[240px]">
                        {activeTabItem.label}
                      </span>
                    </>
                  )}
                </div>

                {/* Role Status (Clean, Non-squished!) */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-400 text-[11px] border border-slate-800 shrink-0 whitespace-nowrap">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>สิทธิ์:</span>
                  <span className="font-semibold text-slate-200">
                    {currentRole === 'researcher' && 'นักวิจัย'}
                    {currentRole === 'coordinator' && 'เจ้าหน้าที่วิจัย'}
                    {currentRole === 'finance' && 'การเงิน'}
                    {currentRole === 'executive' && 'ผู้บริหาร'}
                    {currentRole === 'admin' && 'ผู้ดูแลระบบ (Admin)'}
                  </span>
                </div>
              </div>

              {/* Right Side: Tab Menu Controls */}
              <div className="flex items-center gap-1.5 ml-auto shrink-0 justify-end">
                
                {currentRole === 'admin' ? (
                  /* Admin Role: Show ONLY the Admin Menu button on the right (No duplicate tabs, No separate collapse button) */
                  <button
                    onClick={onToggleAdminMenu}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 shadow-sm cursor-pointer ${
                      isAdminMenuExpanded
                        ? 'bg-purple-600 text-white border border-purple-400 shadow-md ring-2 ring-purple-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-purple-200 border border-purple-500/40 hover:border-purple-400/70 hover:text-white'
                    }`}
                    title={isAdminMenuExpanded ? 'คลิกเพื่อย่อเมนูผู้ดูแลระบบ' : 'คลิกเพื่อขยายเมนูผู้ดูแลระบบ'}
                  >
                    <Menu className="w-4 h-4 text-purple-200 shrink-0" />
                    <span className="font-prompt">เมนูผู้ดูแลระบบ</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-950 text-purple-200 border border-purple-400/40 font-mono shrink-0">
                      {availableTabs.length}
                    </span>
                    <span className="text-[10px] text-purple-200 ml-0.5">
                      {isAdminMenuExpanded ? '▼' : '◀'}
                    </span>
                  </button>
                ) : (
                  /* Non-Admin Roles: Show normal tabs */
                  <nav className="flex items-center space-x-1 text-xs overflow-x-auto scrollbar-none py-0.5">
                    {availableTabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-slate-800 text-amber-400 border border-slate-700 shadow-xs font-semibold'
                              : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                          }`}
                          title={tab.label}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span>{tab.shortLabel}</span>
                          {tab.badge && (
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border shrink-0 ${tab.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                )}

              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
