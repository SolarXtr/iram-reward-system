import { LineMilestoneType, LineNotificationRecord, ResearchApplication } from '../types';
import { formatBaht, maskBankAccountNo } from './regulations';

export const LINE_BOT_CONFIG = {
  name: 'iRAM-U Services',
  botBasicId: '@414jvrca',
  addFriendUrl: 'https://line.me/R/ti/p/@414jvrca',
  organization: 'งานบริหารงานวิจัยและนวัตกรรม คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร',
  description: 'ระบบบริการและแจ้งเตือนอัตโนมัติ 4 ขั้นตอน: ยื่นคำขอ, ตรวจเอกสารผ่าน, คณบดีอนุมัติ, และโอนเงินเข้าบัญชี (Real-time)',
  // Sample long-lived token for display / webhook settings
  channelAccessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.iRAM_U_Services_ChannelToken_414jvrca_med_nu_th...',
};

export interface MilestoneMeta {
  type: LineMilestoneType;
  stepNumber: number;
  label: string;
  badgeLabel: string;
  headerTitle: string;
  subTitle: string;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  iconName: string;
  description: string;
  defaultMessage: (app: ResearchApplication) => {
    title: string;
    statusText: string;
    details: string;
    notes: string;
  };
}

export const LINE_MILESTONES: Record<LineMilestoneType, MilestoneMeta> = {
  application_submitted: {
    type: 'application_submitted',
    stepNumber: 1,
    label: '1. เมื่อยื่นคำขอ (Submitted)',
    badgeLabel: 'ยื่นคำขอใหม่',
    headerTitle: 'ยื่นคำขอรับเงินรางวัลและค่าตีพิมพ์สำเร็จ',
    subTitle: 'บันทึกข้อมูลเข้าสู่ระบบเรียบร้อยแล้ว',
    accentColor: '#1e40af', // blue-800
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    iconName: 'Send',
    description: 'แจ้งเตือนทันทีเมื่อนักวิจัยกรอกแบบคำขอและบันทึกเข้าระบบ หรือส่งข้อมูลผ่าน Google Forms / ระบบงานวิจัย',
    defaultMessage: (app) => ({
      title: `ยื่นคำขอรับรางวัลและค่าตีพิมพ์ [${app.trackingNo}]`,
      statusText: 'ยื่นคำขอสำเร็จ (ขั้นตอนที่ 1 &rarr; 2)',
      details: `บทความ: "${app.articleTitle}" | ฐานข้อมูล: ${app.database || 'Scopus'} (${app.quartile}) | ยอดขอรับรวม: ${formatBaht(app.totalClaimedAmount)}`,
      notes: `ระบบบันทึกคำขอเข้าสู่คิวงานตรวจสอบเอกสารและฐานข้อมูลสากล (SLA 3 วันทำการ)`
    }),
  },

  document_verified: {
    type: 'document_verified',
    stepNumber: 4,
    label: '2. ผ่านการตรวจเอกสาร (Verified)',
    badgeLabel: 'เอกสารถูกต้อง',
    headerTitle: 'ผ่านการตรวจสอบเอกสารและฐานข้อมูลแล้ว',
    subTitle: 'เจ้าหน้าที่งานวิจัยตรวจสอบความถูกต้องครบถ้วน',
    accentColor: '#4338ca', // indigo-700
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    iconName: 'FileCheck',
    description: 'แจ้งเตือนเมื่อผู้ประสานงาน/เจ้าหน้าที่งานวิจัยตรวจสอบเอกสารแนบ ตรวจฐานข้อมูล Scopus/WOS/TCI และ Quartile เรียบร้อย',
    defaultMessage: (app) => ({
      title: `ผ่านการตรวจเอกสารและฐานข้อมูล [${app.trackingNo}]`,
      statusText: 'ตรวจสอบเอกสารและเกณฑ์รางวัลผ่าน (ขั้นตอนที่ 4/12)',
      details: `ยืนยันจัดสรรเงินรางวัล ${formatBaht(app.claimedRewardAmount)} + ค่าตีพิมพ์ ${formatBaht(app.approvedPageChargeAmount || app.claimedPageChargeAmount)} รวม ${formatBaht(app.totalClaimedAmount)}`,
      notes: `เอกสารถูกจัดส่งเสนอคณะกรรมการกลั่นกรองและเสนอคณบดีลงนามอนุมัติเรียบร้อย`
    }),
  },

  dean_approved: {
    type: 'dean_approved',
    stepNumber: 7,
    label: '3. คณบดีลงนามอนุมัติ (Approved)',
    badgeLabel: 'คณบดีอนุมัติ',
    headerTitle: 'คณบดีลงนามอนุมัติเงินรางวัลเรียบร้อยแล้ว',
    subTitle: 'ผ่านความเห็นชอบและลงนามคำสั่งเบิกจ่าย',
    accentColor: '#b45309', // amber-700
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-900',
    iconName: 'CheckCircle2',
    description: 'แจ้งเตือนเมื่อคณบดีลงนามในบันทึกข้อความอนุมัติการจ่ายเงินรางวัลและส่งเรื่องต่องานคลังเพื่อตั้งฎีกาเบิกเงิน',
    defaultMessage: (app) => ({
      title: `คณบดีลงนามอนุมัติเบิกจ่าย [${app.trackingNo}]`,
      statusText: 'คณบดีลงนามอนุมัติเรียบร้อยแล้ว (ขั้นตอนที่ 7/12)',
      details: `อนุมัติจ่ายเงินตามประกาศ ม.นเรศวร ยอดรวม ${formatBaht(app.totalClaimedAmount)} บาท (เลขที่หนังสือรับเรื่อง: ${app.researchDocRecNo || 'หนังสือเสนอคณบดี'})`,
      notes: `ส่งเอกสารเรื่องต่องานคลังและพัสดุเพื่อจัดทำฎีกาเบิกจ่าย (กำหนดการโอนเงินภายใน 4 สัปดาห์)`
    }),
  },

  payment_transferred: {
    type: 'payment_transferred',
    stepNumber: 11,
    label: '4. งานการเงินโอนเงินแล้ว (Transferred)',
    badgeLabel: 'โอนเงินสำเร็จ',
    headerTitle: 'งานการเงินโอนเงินเข้าบัญชีธนาคารเรียบร้อยแล้ว',
    subTitle: 'โอนเงินเข้าบัญชี ธ.กรุงศรีอยุธยา แบบ Real-time',
    accentColor: '#047857', // emerald-700
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900',
    iconName: 'Banknote',
    description: 'แจ้งเตือนทันทีเมื่องานคลังและการเงินโอนเงินรางวัล/ค่าตีพิมพ์เข้าบัญชีธนาคาร พร้อมแจ้งเลขฎีกาและยอดเงินสุทธิ',
    defaultMessage: (app) => ({
      title: `โอนเงินรางวัลและค่าตีพิมพ์เข้าบัญชีแล้ว [${app.trackingNo}]`,
      statusText: 'โอนเงินสำเร็จเข้าบัญชี ธ.กรุงศรีอยุธยา (ขั้นตอนที่ 11-12/12)',
      details: `โอนเข้าบัญชี: ${maskBankAccountNo(app.bankAccountNo)} | วันที่โอน: ${app.paymentDate || 'วันนี้'} | เลขที่ฎีกา: ${app.disbursementVoucherNo || 'ฎีกา 3606/70'} | ยอดสุทธิ: ${formatBaht(app.actualPaidAmount || app.totalClaimedAmount)}`,
      notes: `ท่านสามารถคลิกปุ่มด้านล่างเพื่อเปิดดูหรือดาวน์โหลดสลิป/ใบรับเงินทางการของคณะแพทย์ได้ทันที`
    }),
  },
};

export const INITIAL_LINE_NOTIFICATION_LOG: LineNotificationRecord[] = [
  {
    id: 'notif-004',
    trackingNo: 'AWP69-051',
    milestone: 'payment_transferred',
    title: 'โอนเงินรางวัลและค่าตีพิมพ์เข้าบัญชีแล้ว [AWP69-051]',
    recipientName: 'ผศ.ดร.สมชาย ใจดี',
    recipientEmail: 'somchaij@nu.ac.th',
    amount: 55000,
    details: 'โอนเข้าบัญชี ธ.กรุงศรีอยุธยา xxx-x-xxxxx-7 ยอดสุทธิ 55,000 บาท (ฎีกา 3606/69)',
    timestamp: '2026-03-23 14:15:22',
    channel: '@414jvrca',
    status: 'delivered',
  },
  {
    id: 'notif-003',
    trackingNo: 'AWP69-052',
    milestone: 'dean_approved',
    title: 'คณบดีลงนามอนุมัติเบิกจ่าย [AWP69-052]',
    recipientName: 'รศ.พญ.พิมพา วัฒนากุล',
    recipientEmail: 'pimpaw@nu.ac.th',
    amount: 75000,
    details: 'คณบดีลงนามอนุมัติเงินรางวัลและค่าตีพิมพ์ ยอดรวม 75,000 บาท ส่งต่อคลัง',
    timestamp: '2026-03-24 10:45:00',
    channel: '@414jvrca',
    status: 'delivered',
  },
  {
    id: 'notif-002',
    trackingNo: 'AWP69-053',
    milestone: 'document_verified',
    title: 'ผ่านการตรวจเอกสารและฐานข้อมูล [AWP69-053]',
    recipientName: 'อ.ดร.กานต์ นิมิตโชคอนันต์',
    recipientEmail: 'karnn@nu.ac.th',
    amount: 15000,
    details: 'เจ้าหน้าที่งานวิจัยตรวจสอบบทความ Scopus Q2 ผ่านเกณฑ์ จัดเตรียมเสนอคณะกรรมการ',
    timestamp: '2026-03-25 09:30:15',
    channel: '@414jvrca',
    status: 'delivered',
  },
  {
    id: 'notif-001',
    trackingNo: 'AWP70-001',
    milestone: 'application_submitted',
    title: 'ยื่นคำขอรับรางวัลและค่าตีพิมพ์ [AWP70-001]',
    recipientName: 'ดร.ทินกร หอมดี',
    recipientEmail: 'tinnakornh@nu.ac.th',
    amount: 60000,
    details: 'ยื่นคำขอปีงบประมาณ 2570 เข้าสู่ระบบเรียบร้อย อยู่ระหว่างคิวตรวจเอกสาร',
    timestamp: '2026-04-01 11:20:00',
    channel: '@414jvrca',
    status: 'delivered',
  }
];

const NOTIF_STORAGE_KEY = 'med_nu_line_notif_log_v2';

export function getStoredLineNotifications(): LineNotificationRecord[] {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (!raw) return INITIAL_LINE_NOTIFICATION_LOG;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_LINE_NOTIFICATION_LOG;
  } catch (e) {
    return INITIAL_LINE_NOTIFICATION_LOG;
  }
}

export function saveStoredLineNotifications(records: LineNotificationRecord[]): void {
  try {
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save LINE notifications', e);
  }
}

export function createLineRecordFromApp(
  app: ResearchApplication,
  milestone: LineMilestoneType
): LineNotificationRecord {
  const meta = LINE_MILESTONES[milestone];
  const msg = meta.defaultMessage(app);
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    trackingNo: app.trackingNo,
    milestone,
    title: msg.title,
    recipientName: app.applicantName,
    recipientEmail: app.email,
    amount: app.totalClaimedAmount,
    details: msg.details,
    timestamp,
    channel: LINE_BOT_CONFIG.botBasicId,
    status: 'delivered',
  };
}
