import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  Settings, 
  ExternalLink, 
  MessageSquare, 
  QrCode, 
  Sparkles,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  UserCheck,
  FileCheck,
  Banknote,
  Award,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { LineMilestoneType, LineNotificationRecord, ResearchApplication } from '../types';
import { formatBaht, maskBankAccountNo } from '../data/regulations';
import { 
  LINE_BOT_CONFIG, 
  LINE_MILESTONES, 
  getStoredLineNotifications, 
  saveStoredLineNotifications,
  createLineRecordFromApp 
} from '../data/lineNotificationService';

interface LineNotificationModalProps {
  applications: ResearchApplication[];
  onSendNotification?: (trackingNo: string, message: string) => void;
  notifications?: LineNotificationRecord[];
  onTriggerMilestone?: (app: ResearchApplication, milestone: LineMilestoneType) => void;
}

export const LineNotificationModal: React.FC<LineNotificationModalProps> = ({
  applications,
  onSendNotification,
  notifications: propNotifications,
  onTriggerMilestone,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  const [activeMilestone, setActiveMilestone] = useState<LineMilestoneType>('payment_transferred');
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'admin' | 'user'>('admin');

  // Local notifications log
  const [notificationLogs, setNotificationLogs] = useState<LineNotificationRecord[]>(() => {
    return propNotifications || getStoredLineNotifications();
  });

  const targetApp = applications.find(a => a.id === selectedAppId) || applications[0];
  const currentMeta = LINE_MILESTONES[activeMilestone];
  const activeMessage = targetApp ? currentMeta.defaultMessage(targetApp) : null;

  const handleSimulateSend = () => {
    if (!targetApp) return;

    // Create record
    const newRecord = createLineRecordFromApp(targetApp, activeMilestone);
    const updated = [newRecord, ...notificationLogs];
    setNotificationLogs(updated);
    saveStoredLineNotifications(updated);

    if (onTriggerMilestone) {
      onTriggerMilestone(targetApp, activeMilestone);
    }
    if (onSendNotification) {
      onSendNotification(targetApp.trackingNo, activeMessage?.statusText || currentMeta.label);
    }

    setSentSuccess(true);
    setTimeout(() => setSentSuccess(false), 3500);
  };

  const handleCopyBotId = () => {
    navigator.clipboard.writeText(LINE_BOT_CONFIG.botBasicId);
    setCopiedBotId(true);
    setTimeout(() => setCopiedBotId(false), 2000);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(LINE_BOT_CONFIG.channelAccessToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Official LINE Developers Console Header Bar (As seen in the uploaded console screenshot) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Breadcrumb line */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
          <span className="hover:text-slate-800 cursor-pointer">TOP</span>
          <span>&gt;</span>
          <span className="hover:text-slate-800 cursor-pointer">RAM-U Service & Support</span>
          <span>&gt;</span>
          <span className="text-slate-800 font-semibold">iRAM-U Services</span>
          <span>&gt;</span>
          <span className="text-emerald-700 font-bold">Messaging API</span>
        </div>

        {/* Profile Card Header */}
        <div className="p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-600 to-emerald-500 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex flex-col items-center justify-center text-white">
                <span className="font-extrabold text-base tracking-tighter text-blue-400">iRAM</span>
                <span className="text-[9px] text-emerald-400 font-bold -mt-1">Services</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-prompt">
                  {LINE_BOT_CONFIG.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Admin
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Messaging API</span>
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-xl">
                {LINE_BOT_CONFIG.organization} • {LINE_BOT_CONFIG.description}
              </p>
            </div>
          </div>

          {/* Quick Add Friend / Bot Info Badge */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
            <div className="w-14 h-14 bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
              {/* Vector representation of official QR code */}
              <div className="w-full h-full bg-slate-900 p-1 rounded flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-3 h-3 bg-white border border-slate-900" />
                  <div className="w-3 h-3 bg-white border border-slate-900" />
                </div>
                <div className="text-[7px] text-white text-center font-mono font-bold leading-none">LINE</div>
                <div className="flex justify-between">
                  <div className="w-3 h-3 bg-white border border-slate-900" />
                  <div className="w-1.5 h-1.5 bg-emerald-400 self-center" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">Bot basic ID</div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                  {LINE_BOT_CONFIG.botBasicId}
                </span>
                <button
                  onClick={handleCopyBotId}
                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-slate-200 rounded transition-colors"
                  title="คัดลอก Bot basic ID"
                >
                  {copiedBotId ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <a
                href={LINE_BOT_CONFIG.addFriendUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <span>เปิดแอดเพื่อนใน LINE</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Tab Navigation in Console style */}
        <div className="flex border-t border-slate-200 px-6 bg-slate-50/50 text-xs font-medium">
          <span className="py-3 px-4 text-slate-500 hover:text-slate-800 cursor-pointer">Basic settings</span>
          <span className="py-3 px-4 text-emerald-700 border-b-2 border-emerald-600 font-bold bg-white -mb-px">
            Messaging API
          </span>
          <span className="py-3 px-4 text-slate-500 hover:text-slate-800 cursor-pointer">LIFF</span>
          <span className="py-3 px-4 text-slate-500 hover:text-slate-800 cursor-pointer">Security</span>
          <span className="py-3 px-4 text-slate-500 hover:text-slate-800 cursor-pointer">Roles</span>
        </div>
      </div>

      {/* 2. 4 Automated Milestones Selector (Feature Spotlight) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-slate-900 font-prompt">
                4 ขั้นตอนการแจ้งเตือนอัตโนมัติ (Automated LINE Milestones)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              ระบบเชื่อมต่อ Hook อัตโนมัติจากเวิร์กโฟลว์ 12 ขั้นตอน แจ้งเตือนผู้ขอรับทุนและผู้เกี่ยวข้องโดยไม่ต้องพิมพ์ส่งเอง
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold self-start sm:self-auto">
            4-Trigger Active
          </span>
        </div>

        {/* Milestone Buttons Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.keys(LINE_MILESTONES) as LineMilestoneType[]).map((mKey) => {
            const m = LINE_MILESTONES[mKey];
            const isSelected = activeMilestone === mKey;
            return (
              <button
                key={mKey}
                onClick={() => setActiveMilestone(mKey)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/50'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : `${m.badgeBg} ${m.badgeText}`
                  }`}>
                    {m.badgeLabel}
                  </span>
                  <span className={`text-[10px] font-mono ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                    ขั้นตอน {m.stepNumber}
                  </span>
                </div>

                <div className="font-bold text-xs line-clamp-1 font-prompt">
                  {m.label}
                </div>
                <div className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  {m.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Testing Playground & Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left 7 cols: Test Trigger Controls & Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-prompt flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>จำลองการส่งแจ้งเตือน (LINE Messaging API Dispatcher)</span>
              </span>
              <span className="text-xs font-mono font-medium text-slate-500">
                Channel: {LINE_BOT_CONFIG.botBasicId}
              </span>
            </h3>

            <div className="space-y-4 text-xs">
              {/* Project selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  เลือกโครงการคำขอเพื่อทดสอบส่งแจ้งเตือน:
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {applications.map((app, idx) => (
                    <option key={app.id || idx} value={app.id}>
                      {app.trackingNo} - {app.applicantName} ({formatBaht(app.totalClaimedAmount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Milestone Details Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-800 font-prompt">
                    {currentMeta.headerTitle}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    SLA Triggers อัตโนมัติ
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">ผู้รับข้อความ:</span>
                    <span className="font-bold text-slate-800">{targetApp?.applicantName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">อีเมลที่ผูก:</span>
                    <span className="font-mono text-slate-800">{targetApp?.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">เลขที่คำขอ:</span>
                    <span className="font-mono font-bold text-blue-900">{targetApp?.trackingNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ยอดเงินเบิกจ่าย:</span>
                    <span className="font-bold text-emerald-700">{formatBaht(targetApp?.totalClaimedAmount)}</span>
                  </div>
                </div>

                <div className="text-[11px] bg-white p-2.5 rounded border border-slate-200 space-y-1">
                  <span className="text-slate-500 font-medium block">ตัวอย่างข้อความสถานะที่จะส่ง:</span>
                  <p className="font-semibold text-slate-800">
                    {activeMessage?.statusText}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {activeMessage?.details}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  * ข้อความส่งตรงผ่าน LINE Push Message API ในรูปแบบ Flex Message
                </span>

                <button
                  onClick={handleSimulateSend}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>ยิงแจ้งเตือนผ่าน {LINE_BOT_CONFIG.name} ทันที</span>
                </button>
              </div>

              {sentSuccess && (
                <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    ส่งข้อความแจ้งเตือนขั้นตอน <strong>"{currentMeta.badgeLabel}"</strong> สำหรับ {targetApp?.trackingNo} ไปยัง LINE OA เรียบร้อยแล้ว!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* LINE Webhook & Token Configuration */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 font-prompt flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-700" />
                <span>การเชื่อมต่อ LINE Developers Console ({LINE_BOT_CONFIG.botBasicId})</span>
              </span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Active & Verified
              </span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Channel Access Token (Long-lived):
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    readOnly
                    value={LINE_BOT_CONFIG.channelAccessToken}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-700 text-[11px]"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-300 flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedToken ? 'คัดลอกแล้ว' : 'คัดลอก Token'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>มาตรการความปลอดภัยและ PDPA:</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  ระบบทำการ Mask ข้อมูลบัญชีธนาคาร (เช่น {maskBankAccountNo('346-1-48984-7')}) 
                  และไม่เปิดเผยเลขประจำตัวประชาชนใน Flex Message เพื่อปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคลอย่างเคร่งครัด
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Smartphone Screen Simulator showing Authentic LINE Flex Message */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="text-center mb-2">
            <span className="text-xs font-semibold text-slate-600">
              ตัวอย่างการแจ้งเตือนจริงบนมือถือผู้ใช้ (Mobile Preview)
            </span>
          </div>

          <div className="w-full max-w-[350px] bg-slate-900 rounded-[42px] p-3.5 shadow-2xl border-4 border-slate-800">
            {/* Phone Speaker & Camera Notch */}
            <div className="flex justify-center mb-2">
              <div className="w-24 h-4 bg-slate-800 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2" />
                <div className="w-8 h-1 bg-slate-700 rounded-full" />
              </div>
            </div>

            {/* Simulated Phone Screen */}
            <div className="bg-[#8c9bab] rounded-[30px] overflow-hidden flex flex-col h-[580px] shadow-inner text-xs">
              
              {/* LINE Header */}
              <div className="bg-[#243342] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-[10px] text-white shadow-sm">
                    RAM
                  </div>
                  <div>
                    <div className="font-bold text-xs truncate font-prompt">
                      {LINE_BOT_CONFIG.name}
                    </div>
                    <div className="text-[9px] text-emerald-400 font-mono">
                      {LINE_BOT_CONFIG.botBasicId}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">14:15</span>
              </div>

              {/* Chat Canvas */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                <div className="text-center text-[10px] text-white/70">วันนี้</div>

                {/* Authentic LINE Flex Message Bubble */}
                {targetApp && (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 transition-all">
                    {/* Card Header with Dynamic Milestone Color */}
                    <div 
                      className="text-white p-3.5 space-y-1"
                      style={{ backgroundColor: currentMeta.accentColor }}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-amber-300 uppercase tracking-wider font-mono">
                          {LINE_BOT_CONFIG.name} ({LINE_BOT_CONFIG.botBasicId})
                        </span>
                        <span className="px-1.5 py-0.2 bg-white/20 rounded text-[9px] font-bold">
                          ขั้นตอนที่ {currentMeta.stepNumber}
                        </span>
                      </div>
                      <div className="font-bold text-xs sm:text-sm font-prompt leading-tight">
                        {currentMeta.headerTitle}
                      </div>
                      <div className="text-[10px] text-white/80">
                        {currentMeta.subTitle}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 space-y-2.5 bg-white text-slate-800">
                      
                      {/* Project Header Row */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900 font-mono block">
                            {targetApp.trackingNo}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {targetApp.applicantName}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {targetApp.quartile}
                        </span>
                      </div>

                      {/* Milestone Status Highlight Box */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 block">
                          สถานะความคืบหน้า:
                        </span>
                        <span className="text-xs font-bold text-slate-900 block font-prompt">
                          {activeMessage?.statusText}
                        </span>
                      </div>

                      {/* Key-Value Breakdown */}
                      <div className="space-y-1.5 text-[11px] pt-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">บทความ:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[150px] text-right">
                            {targetApp.articleTitle}
                          </span>
                        </div>

                        {activeMilestone === 'payment_transferred' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500">เลขฎีกาเบิกจ่าย:</span>
                              <span className="font-mono font-bold text-emerald-800">
                                {targetApp.disbursementVoucherNo || 'ฎีกา 3606/70'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">โอนเข้า ธ.กรุงศรี:</span>
                              <span className="font-mono text-slate-700">
                                {maskBankAccountNo(targetApp.bankAccountNo)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">วันที่ทำรายการ:</span>
                              <span className="text-slate-700">
                                {targetApp.paymentDate || '23 มีนาคม 2569'}
                              </span>
                            </div>
                          </>
                        ) : activeMilestone === 'dean_approved' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500">เลขรับงานคลัง:</span>
                              <span className="font-mono text-indigo-800">
                                {targetApp.financeDocRecNo || 'เลขรับงานคลัง 2154/70'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">สถานะคำสั่ง:</span>
                              <span className="font-bold text-amber-800">
                                คณบดีลงนามอนุมัติแล้ว
                              </span>
                            </div>
                          </>
                        ) : activeMilestone === 'document_verified' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ฐานข้อมูล:</span>
                              <span className="text-slate-800 font-medium">
                                {targetApp.journalDb} ({targetApp.quartile})
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">ผลตรวจเอกสาร:</span>
                              <span className="text-emerald-700 font-bold">
                                ผ่านเกณฑ์ครบถ้วน 100%
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between">
                            <span className="text-slate-500">กำหนด SLA ตรวจ:</span>
                            <span className="text-blue-800 font-medium">
                              ภายใน 3 วันทำการ
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">
                            {activeMilestone === 'payment_transferred' ? 'ยอดเงินโอนสุทธิ:' : 'ยอดเงินอนุมัติ:'}
                          </span>
                          <span className="font-bold text-emerald-700 text-sm font-prompt">
                            {formatBaht(targetApp.totalClaimedAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Footer Notes */}
                      <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
                        {activeMessage?.notes}
                      </p>

                      {/* Flex Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="w-full py-1.5 bg-[#06c755] hover:bg-[#05b34c] text-white font-bold text-center rounded-lg text-[11px] shadow-sm cursor-pointer transition-colors">
                          {activeMilestone === 'payment_transferred' 
                            ? 'เปิดดูใบเสร็จและสลิปโอนเงิน' 
                            : 'ติดตามสถานะคำขอ (SLA 12 ขั้นตอน)'}
                        </div>
                        <div className="text-[9px] text-slate-400 text-center">
                          Powered by iRAM-U Services • คณะแพทยศาสตร์ มน.
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Fake Message Input Bar */}
              <div className="bg-white p-2 border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  placeholder="สอบถามข้อมูลงานวิจัยเพิ่มเติม..."
                  className="flex-1 px-3 py-1 bg-slate-100 rounded-full text-[10px] text-slate-400 outline-none"
                />
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px]">
                  ➤
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* 4. Live Notification Event Logs (ประวัติการส่งแจ้งเตือนอัตโนมัติ) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 font-prompt text-sm sm:text-base">
              ประวัติการส่งแจ้งเตือนผ่าน LINE OA อัตโนมัติ (Live Dispatch Logs)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            ทั้งหมด {notificationLogs.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="py-2.5 px-3 font-semibold">วัน-เวลา</th>
                <th className="py-2.5 px-3 font-semibold">เลขที่คำขอ</th>
                <th className="py-2.5 px-3 font-semibold">ขั้นตอน / Milestone</th>
                <th className="py-2.5 px-3 font-semibold">ผู้ขอรับทุน</th>
                <th className="py-2.5 px-3 font-semibold">ยอดเงิน</th>
                <th className="py-2.5 px-3 font-semibold">ช่องทาง</th>
                <th className="py-2.5 px-3 font-semibold text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {notificationLogs.map((log) => {
                const meta = LINE_MILESTONES[log.milestone] || LINE_MILESTONES.payment_transferred;
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                      {log.trackingNo}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${meta.badgeBg} ${meta.badgeText}`}>
                        {meta.badgeLabel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-800">{log.recipientName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.recipientEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-800 font-prompt">
                      {formatBaht(log.amount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                      {log.channel || LINE_BOT_CONFIG.botBasicId}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Comprehensive Documentation Section (คู่มือและขั้นตอนสำหรับ Admin และ ผู้ใช้) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header with Switcher Tabs */}
        <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold font-prompt text-white">
                คู่มือและขั้นตอนการแจ้งเตือน LINE OA (Official Guide)
              </h2>
            </div>
            <p className="text-xs text-slate-300">
              คำอธิบายขั้นตอนการทำงาน วิธีการตั้งค่าสำหรับผู้ดูแลระบบ และคู่มือการใช้งานสำหรับอาจารย์/นักวิจัย
            </p>
          </div>

          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 shrink-0">
            <button
              onClick={() => setActiveDocTab('admin')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDocTab === 'admin'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              สำหรับ Admin / เจ้าหน้าที่
            </button>
            <button
              onClick={() => setActiveDocTab('user')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeDocTab === 'user'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              สำหรับผู้ใช้ (อาจารย์/นักวิจัย)
            </button>
          </div>
        </div>

        {/* Tab 1: Admin Guide */}
        {activeDocTab === 'admin' && (
          <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Step 1 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-prompt text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>การตั้งค่า LINE Developers Console ({LINE_BOT_CONFIG.botBasicId})</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  1. เข้าสู่ระบบ <a href="https://developers.line.biz" target="_blank" rel="noreferrer" className="text-blue-600 underline font-semibold">developers.line.biz</a> ด้วยบัญชีของคณะแพทย์<br />
                  2. เลือก Provider <strong>"RAM-U Service & Support"</strong> &rarr; Channel <strong>"iRAM-U Services"</strong><br />
                  3. ในแถบ <strong>Messaging API</strong> ออกค่า <em>Channel access token (long-lived)</em><br />
                  4. นำ Token และ Webhook URL ไปใส่ใน Script Properties ของ Google Apps Script หรือระบบหลัก
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-prompt text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>กลไกการส่งแจ้งเตือน 4 เหตุการณ์สำคัญ (Trigger Architecture)</span>
                </div>
                <ul className="text-slate-600 text-[11px] list-disc list-inside space-y-1">
                  <li><strong>Trigger 1 (ยื่นคำขอ):</strong> ระบบเรียก <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-900">notifyApplicationSubmitted()</code> ทันทีที่มีการบันทึกคำขอใหม่</li>
                  <li><strong>Trigger 2 (ตรวจเอกสารผ่าน):</strong> เมื่อเจ้าหน้าที่เลื่อนสเต็ป 4/12 ผ่าน ระบบส่งแจ้งเตือนอัตโนมัติ</li>
                  <li><strong>Trigger 3 (คณบดีอนุมัติ):</strong> เมื่อคณบดีลงนามบันทึกข้อความ (สเต็ป 7/12) ส่งแจ้งเตือนพร้อมส่งเรื่องต่องานคลัง</li>
                  <li><strong>Trigger 4 (โอนเงินสำเร็จ):</strong> งานการเงินบันทึกเลขฎีกา/ยืนยันการโอนเงิน (สเต็ป 11/12) ยิง Push Message แบบ Real-time ทันที</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-prompt text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>การเชื่อมโยง Google Apps Script & Google Sheets</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  เจ้าหน้าที่สามารถคัดลอกโค้ดจากแท็บ <strong>"Google Apps Script"</strong> ไฟล์ <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">LineNotifier.gs</code> ไปวางใน Script Editor ของ Google Sheet คำขอรับเงินรางวัล โดยโค้ดจะดักจับเหตุการณ์การเปลี่ยนแปลงสถานะในเซลล์ชีตแล้วส่ง LINE Push อัตโนมัติทันที
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold font-prompt text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">
                    4
                  </span>
                  <span>มาตรการคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance)</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  ระบบจะ<strong>ไม่เปิดเผยเลขบัตรประชาชน 13 หลัก</strong> และจะ<strong>พรางเลขที่บัญชีธนาคาร (Bank Masking)</strong> ในข้อความ LINE เสมอ เช่น <span className="font-mono font-bold text-slate-800">xxx-x-xxxxx-7</span> เพื่อป้องกันการรั่วไหลของข้อมูลความลับทางการเงินของผู้ขอรับทุน
                </p>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: User Guide */}
        {activeDocTab === 'user' && (
          <div className="p-6 sm:p-8 space-y-6 text-xs text-slate-700 leading-relaxed animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                  1
                </div>
                <h4 className="font-bold text-slate-900 font-prompt text-sm">
                  แอดเพื่อน LINE OA
                </h4>
                <p className="text-slate-600 text-[11px]">
                  สแกน QR Code หรือค้นหา LINE ID: <strong className="text-emerald-700 font-mono">{LINE_BOT_CONFIG.botBasicId}</strong> เพื่อเพิ่มเพื่อนบัญชี <strong>"{LINE_BOT_CONFIG.name}"</strong> ของงานวิจัย คณะแพทยศาสตร์
                </p>
                <div className="pt-1">
                  <a
                    href={LINE_BOT_CONFIG.addFriendUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>คลิกเพื่อเพิ่มเพื่อนทันที &rarr;</span>
                  </a>
                </div>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                  2
                </div>
                <h4 className="font-bold text-slate-900 font-prompt text-sm">
                  ผูกบัญชีอีเมล @nu.ac.th
                </h4>
                <p className="text-slate-600 text-[11px]">
                  เมื่อยื่นคำขอรับทุนในระบบด้วยอีเมลมหาวิทยาลัยนเรศวร ระบบจะผูกข้อมูลคำขอเข้ากับบัญชี LINE ของท่านโดยอัตโนมัติ เพื่อส่งการแจ้งเตือนส่วนตัว (Private Push) มายังมือถือของท่านโดยตรง
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                  3
                </div>
                <h4 className="font-bold text-slate-900 font-prompt text-sm">
                  รับ 4 แจ้งเตือนสำคัญแบบ Real-time
                </h4>
                <p className="text-slate-600 text-[11px]">
                  ท่านจะได้รับการแจ้งเตือนทั้ง 4 ขั้นตอนสำคัญ: <strong>1) ยื่นคำขอสำเร็จ</strong>, <strong>2) ตรวจเอกสารผ่าน</strong>, <strong>3) คณบดีอนุมัติ</strong>, และ <strong>4) เงินโอนเข้าบัญชีเรียบร้อย</strong> พร้อมปุ่มกดดูใบเสร็จทันที
                </p>
              </div>

            </div>

            {/* Quick summary table for user */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-2">
              <div className="font-bold font-prompt text-sm flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>ประโยชน์ที่นักวิจัยจะได้รับ:</span>
              </div>
              <ul className="text-[11px] text-emerald-900 list-disc list-inside space-y-0.5">
                <li>ไม่ต้องคอยโทรถามเจ้าหน้าที่หรือเดินทางมาตรวจสอบเอกสารที่คณะ</li>
                <li>ทราบทันทีเมื่อคณบดีอนุมัติ และทราบกำหนดเวลาที่เงินจะโอนเข้าบัญชีภายใน 4 สัปดาห์</li>
                <li>เมื่อเงินเข้าบัญชีกรุงศรีอยุธยา จะมีแจ้งเตือนระบุเลขที่ฎีกาและยอดเงินสุทธิ พร้อมลิงก์ดาวน์โหลดสลิปทางการได้ทันที</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
