import React from 'react';
import { 
  LayoutDashboard, 
  Sparkles, 
  BookOpen, 
  KanbanSquare, 
  TableProperties, 
  Calendar, 
  Bell, 
  Users, 
  ChevronRight, 
  PanelRightClose,
  ShieldCheck,
  Crown
} from 'lucide-react';
import { ActiveTab } from './Header';
import { UserProfile } from '../types';
import { LINE_NOTIFICATION_SYSTEM_ENABLED } from '../data/lineNotificationService';

interface AdminRightSideMenuProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  draftsCount?: number;
  currentUser?: UserProfile | null;
  onCollapse: () => void;
}

export const AdminRightSideMenu: React.FC<AdminRightSideMenuProps> = ({
  activeTab,
  setActiveTab,
  draftsCount = 0,
  currentUser,
  onCollapse,
}) => {
  const adminMenuItems: Array<{
    id: ActiveTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }> = [
    {
      id: 'dashboard',
      label: 'แดชบอร์ดสรุปสถานะ',
      description: 'ภาพรวมสถิติและสถานะคำขอรับทุนทั้งหมด',
      icon: LayoutDashboard,
    },
    {
      id: 'quota_planner',
      label: 'เตรียมเบิกรางวัล & วงเงิน',
      description: 'วางแผนเบิกรางวัลและเช็คสิทธิ์ 24 เดือน',
      icon: Sparkles,
      badge: draftsCount > 0 ? `${draftsCount} ร่าง` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'article_table',
      label: 'ตารางบทความรวม (มน. & คณะ)',
      description: 'ตารางบทความรวม 3 หมวด (มน. & คณะ)',
      icon: BookOpen,
      badge: 'ใหม่',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'kanban',
      label: 'ติดตามแบบลากวาง (Kanban)',
      description: 'กระดานติดตามงานและขั้นตอน 12 ระดับ',
      icon: KanbanSquare,
    },
    {
      id: 'table',
      label: 'ตารางแก้ไขข้อมูลทั้งหมด',
      description: 'ตารางจัดการและส่งออกข้อมูลทั้งหมด',
      icon: TableProperties,
    },
    {
      id: 'calendar',
      label: 'ปฏิทินรอบเบิกจ่าย (Calendar)',
      description: 'ปฏิทินรอบเบิกจ่ายและการเงิน',
      icon: Calendar,
    },
    ...(LINE_NOTIFICATION_SYSTEM_ENABLED ? [{
      id: 'line_oa' as ActiveTab,
      label: 'LINE OA (@414jvrca)',
      description: 'ระบบแจ้งเตือนผ่าน LINE Official Account',
      icon: Bell,
      badge: '4 Triggers',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    }] : []),
    {
      id: 'user_management',
      label: 'จัดการผู้ใช้งาน (Users)',
      description: 'ระบบจัดการบัญชีผู้ใช้งาน และกำหนดสิทธิ์ (Admin Console)',
      icon: Users,
      badge: 'Admin',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden font-sans text-white">
      {/* Header */}
      <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center p-0.5 shadow-sm">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-white font-prompt flex items-center gap-1.5">
              <span>เมนูผู้ดูแลระบบ</span>
            </h3>
            <span className="text-[10px] text-slate-400">
              ทั้งหมด {adminMenuItems.length} เมนูการทำงาน
            </span>
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={onCollapse}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-700 cursor-pointer"
          title="ย่อเมนูผู้ดูแลระบบ"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Menu List */}
      <div className="p-2 space-y-1 max-h-[calc(100vh-16rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        {adminMenuItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-purple-900/80 to-slate-800 border border-purple-500/50 text-white shadow-sm font-medium'
                  : 'bg-slate-900 hover:bg-slate-800/80 border border-transparent hover:border-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700'
                }`}>
                  <Icon className="w-4 h-4 shrink-0" />
                </div>
                <div className="min-w-0">
                  <div className={`text-xs truncate ${isActive ? 'text-amber-300 font-semibold font-prompt' : 'text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {item.description}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 ml-1.5">
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold border shrink-0 ${item.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer User Info */}
      {currentUser && (
        <div className="p-3 bg-slate-950/40 border-t border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 text-purple-300 font-bold flex items-center justify-center text-[11px] border border-purple-400/40 shrink-0">
              {currentUser.name ? currentUser.name.charAt(currentUser.name.indexOf(' ') > 0 ? currentUser.name.indexOf(' ') + 1 : 0) : 'น'}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-slate-200 text-xs truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                สิทธิ์: ผู้ดูแลระบบ (Admin)
              </div>
            </div>
          </div>
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 ml-1.5" />
        </div>
      )}
    </div>
  );
};
