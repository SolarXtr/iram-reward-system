import React from 'react';
import {
  Info,
  Lightbulb,
  ListChecks,
  Wrench,
  BarChart3,
  FastForward,
  Database,
  GitBranch,
  Network,
  LayoutDashboard,
  BookOpen,
  Table2,
  CalendarDays,
  ShieldCheck,
  FileText,
  ExternalLink,
  User,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import type { ActiveTab } from './Header';

interface AboutViewProps {
  onBackToDashboard: () => void;
  onNavigate: (tab: ActiveTab) => void;
  isGuest: boolean;
  appVersion?: string;
}

const Card: React.FC<{ icon: LucideIcon; title: string; children: React.ReactNode }> = ({ icon: Icon, title, children }) => (
  <section className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
    <h2 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-slate-900 font-prompt pb-3 mb-4 border-b border-slate-100">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <span>{title}</span>
    </h2>
    {children}
  </section>
);

const Bullets: React.FC<{ items: { title: string; text: string }[] }> = ({ items }) => (
  <ul className="space-y-3 text-sm text-slate-600 leading-relaxed list-disc pl-5 marker:text-amber-500">
    {items.map((it) => (
      <li key={it.title}>
        <strong className="text-slate-800">{it.title}:</strong> {it.text}
      </li>
    ))}
  </ul>
);

const PHASES = [
  {
    badge: 'ระยะที่ 1',
    title: 'การวิเคราะห์ความต้องการและออกแบบระบบ (System Planning)',
    text: 'ศึกษาประกาศและข้อบังคับการจ่ายเงินรางวัลและค่าตีพิมพ์ของมหาวิทยาลัยนเรศวร สรุปเป็นกระบวนการมาตรฐาน 12 ขั้นตอน กำหนดบทบาทผู้ใช้งาน 7 กลุ่ม วงเงินตามไตรมาสควอร์ไทล์ และออกแบบโครงสร้างข้อมูลคำขอ',
  },
  {
    badge: 'ระยะที่ 2',
    title: 'การพัฒนาเว็บแอปพลิเคชัน (Frontend Development)',
    text: 'พัฒนาด้วย React + TypeScript + Vite และ Tailwind CSS ประกอบด้วย Dashboard, ผังติดตามสถานะ (Kanban), ตารางคำขอ, ปฏิทิน, ตัวคำนวณเงินรางวัล และแบบฟอร์มยื่นคำขอรองรับการยื่นแทน',
  },
  {
    badge: 'ระยะที่ 3',
    title: 'ฐานข้อมูลกลางและระบบหลังบ้าน (Cloudflare D1 & Worker API)',
    text: 'ย้ายการจัดเก็บคำขอ ผู้ใช้งาน และเลขที่หนังสือไปยัง Cloudflare D1 ผ่าน Worker API พร้อมระบบยืนยันตัวตนและกำหนดสิทธิ์ตามบทบาท เพื่อให้ข้อมูลคงอยู่ถาวรและใช้งานร่วมกันหลายผู้ใช้',
  },
  {
    badge: 'ระยะที่ 4',
    title: 'เอกสารราชการอัตโนมัติและการปรับปรุงต่อเนื่อง (Official Documents)',
    text: 'สร้างชุดเอกสารราชการอัตโนมัติ (บันทึกขออนุมัติ บันทึกเบิกเงิน ใบสำคัญรับเงิน แบบรับรอง AWP46 และ AWP Checklist) พร้อมส่งออก PDF/DOCX รองรับข้อมูลบัญชีธนาคารตามหลัก PDPA และคู่มือการใช้งานในระบบ',
  },
];

const TROUBLES = [
  { title: 'ข้อมูลการอนุมัติและเลขที่หนังสือหายเมื่อเปิดซ้ำ', text: 'แก้ไขให้บันทึกผลการตรวจ เลขที่หนังสือ และวันที่ลง Cloudflare D1 พร้อมสำรองใน localStorage และดึงกลับมาแสดงทุกครั้งที่เปิดคำขอ' },
  { title: 'ข้อมูลสิ่งพิมพ์ (Vol / No / Month / Year / Pages) ไม่แสดง', text: 'เพิ่มการแยกค่าอัตโนมัติจากข้อมูล volumeIssue เพื่อเติมลงช่องให้เจ้าหน้าที่ตรวจแก้ไขได้ทันที' },
  { title: 'การกรอกวันที่ในหนังสือราชการ', text: 'เพิ่มปุ่มปฏิทิน (Date Picker) ให้เลือกวันที่ได้ แทนการพิมพ์ด้วยมือ' },
  { title: 'ข้อมูลบัญชีธนาคารและบัตรประชาชนในการยื่นแทน', text: 'เพิ่มตัวเลือกธนาคารและจัดรูปแบบเลขบัญชี (xxx-x-xxxxx-x) และเลขบัตรประชาชน (x-xxxx-xxxxx-xx-x) อัตโนมัติ พร้อมบันทึกลง D1' },
  { title: 'ภาพครุฑและรูปแบบบันทึกข้อความ', text: 'ปรับใช้ภาพครุฑมาตรฐาน (SVG) และจัดข้อความท้ายบันทึกให้ถูกต้องตามแบบหนังสือราชการ' },
];

const OUTCOMES = [
  { title: 'กระบวนการมาตรฐาน', text: 'ครอบคลุมตลอด 12 ขั้นตอน ตั้งแต่การยื่นคำขอจนถึงการเบิกจ่าย พร้อมกำหนด SLA และผู้รับผิดชอบแต่ละขั้น' },
  { title: 'รองรับผู้ใช้งาน 7 กลุ่ม', text: 'ผู้ใช้ทั่วไป นักวิจัย เลขาภาควิชา เจ้าหน้าที่วิจัย การเงิน ผู้บริหาร และผู้ดูแลระบบ ด้วยสิทธิ์การมองเห็นและแก้ไขที่แตกต่างกัน' },
  { title: 'ลดงานเอกสาร', text: 'ระบบจัดทำเอกสารราชการ 5 ฉบับให้อัตโนมัติจากข้อมูลคำขอเดียว ลดการกรอกซ้ำและความคลาดเคลื่อน' },
  { title: 'ติดตามสถานะได้แบบเรียลไทม์', text: 'ผู้ยื่นและเจ้าหน้าที่ตรวจสอบความคืบหน้าและเส้นเวลาของคำขอได้ทุกขั้นตอน' },
];

const FUTURE = [
  { title: 'แจ้งเตือนผ่าน LINE (LINE OA Integration)', text: 'แจ้งเตือนการเปลี่ยนสถานะคำขอและงานค้างให้ผู้เกี่ยวข้องอัตโนมัติ' },
  { title: 'รายงานสรุปสำหรับผู้บริหาร', text: 'แดชบอร์ดสรุปงบประมาณคงเหลือ จำนวนคำขอ และระยะเวลาดำเนินการเฉลี่ยของแต่ละขั้นตอน' },
  { title: 'เชื่อมโยงกับระบบ MedNU Research Analytics', text: 'ดึงข้อมูลสิ่งตีพิมพ์และควอร์ไทล์วารสารจาก Scopus Dashboard เพื่อตรวจสอบสิทธิ์อัตโนมัติ' },
];

const STACK = [
  { title: 'Frontend', text: 'React, TypeScript, Vite, Tailwind CSS, Lucide Icons' },
  { title: 'Cloudflare Pages', text: 'โฮสต์เว็บแอปพลิเคชัน (Static SPA)' },
  { title: 'Cloudflare Worker + D1', text: 'API และฐานข้อมูลหลัก (Source of Truth) ของคำขอ ผู้ใช้งาน และเลขที่หนังสือ' },
  { title: 'การสร้างเอกสาร', text: 'พิมพ์/ส่งออก PDF และ DOCX ด้วยฟอนต์ TH Sarabun และตราครุฑมาตรฐาน' },
];

export const AboutView: React.FC<AboutViewProps> = ({ onBackToDashboard, onNavigate, isGuest, appVersion = '1.3.2' }) => {
  const nodes: { tab: ActiveTab; icon: LucideIcon; title: string; desc: string; guestOk?: boolean }[] = [
    { tab: 'dashboard', icon: LayoutDashboard, title: 'หน้าหลัก Dashboard', desc: 'ภาพรวมคำขอ สถานะ และงบประมาณ', guestOk: true },
    { tab: 'article_table', icon: FileText, title: 'ฐานข้อมูลบทความ', desc: 'รายการบทความและสิทธิ์การขอรับเงินรางวัล' },
    { tab: 'table', icon: Table2, title: 'รายการคำขอ', desc: 'ติดตามและจัดการคำขอรับเงินรางวัลทั้งหมด' },
    { tab: 'calendar', icon: CalendarDays, title: 'ปฏิทิน', desc: 'กำหนดการและกำหนดส่งของแต่ละขั้นตอน' },
    { tab: 'user_guide', icon: BookOpen, title: 'คู่มือการใช้งาน', desc: 'เกณฑ์ วิธียื่นคำขอ และกระบวนการ 12 ขั้นตอน', guestOk: true },
    { tab: 'about', icon: Info, title: 'เกี่ยวกับระบบ (หน้านี้)', desc: 'ความเป็นมา สถาปัตยกรรม และแนวทางพัฒนา', guestOk: true },
  ];
  const visible = nodes.filter((n) => !isGuest || n.guestOk);

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-prompt flex items-center gap-2">
            <Info className="w-6 h-6 text-amber-500" />
            เกี่ยวกับระบบเงินรางวัล (About iRAM)
          </h1>
          <p className="text-sm text-slate-500 mt-1">ประวัติการพัฒนา การแก้ปัญหา ผลการดำเนินการ และโครงสร้างระบบ</p>
        </div>
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าหลัก
        </button>
      </div>

      <Card icon={Lightbulb} title="การริเริ่มโครงการ (Initiation)">
        <p className="text-sm text-slate-600 leading-7">
          ระบบ <strong className="text-slate-800">iRAM (Intelligent Research Award Management)</strong> ริเริ่มขึ้นเพื่อบริหารจัดการการขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย
          ของคณาจารย์และนักวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ให้เป็นไปตามเกณฑ์ของมหาวิทยาลัยอย่างถูกต้อง โปร่งใส ตรวจสอบย้อนหลังได้
          ลดขั้นตอนการทำงานด้วยเอกสารกระดาษและการกรอกซ้ำของเจ้าหน้าที่ และช่วยให้ผู้ยื่นคำขอติดตามสถานะได้ด้วยตนเอง
        </p>
      </Card>

      <Card icon={ListChecks} title="ขั้นตอนการวางแผนและการพัฒนา (Planning & Development Timeline)">
        <ol className="relative border-l-2 border-amber-200 ml-2 space-y-5">
          {PHASES.map((p) => (
            <li key={p.badge} className="pl-5 relative">
              <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-400 border-2 border-white" />
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{p.badge}</span>
              <h3 className="text-sm font-bold text-slate-800 mt-1.5 font-prompt">{p.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mt-1">{p.text}</p>
            </li>
          ))}
        </ol>
      </Card>

      <Card icon={Wrench} title="การแก้ไขปัญหาสำคัญในระหว่างพัฒนา (Troubleshooting)">
        <Bullets items={TROUBLES} />
      </Card>

      <Card icon={BarChart3} title="ผลการดำเนินการปัจจุบัน (Project Outcomes)">
        <Bullets items={OUTCOMES} />
        <p className="text-sm text-slate-600 mt-3">
          เวอร์ชันปัจจุบัน: <strong className="text-slate-800">v{appVersion}</strong> — ซอร์สโค้ดจัดเก็บบน GitHub Repository
        </p>
      </Card>

      <Card icon={FastForward} title="แนวทางการพัฒนาต่อเนื่องในอนาคต (Future Developments)">
        <Bullets items={FUTURE} />
      </Card>

      <Card icon={Database} title="โครงสร้างระบบและแหล่งเชื่อมโยงข้อมูล (Architecture & Data)">
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded p-3 text-sm text-slate-700 mb-4">
          <strong>สถาปัตยกรรมหลัก:</strong> ข้อมูลคำขอ ผู้ใช้งาน และเลขที่หนังสือจัดเก็บใน <strong>Cloudflare D1 Database</strong> ผ่าน <strong>Worker API</strong> เป็นฐานข้อมูลหลัก (Source of Truth)
        </div>
        <Bullets items={STACK} />
        <div className="flex items-start gap-2 mt-4 text-xs text-slate-600 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>ข้อมูลส่วนบุคคล เช่น เลขบัตรประชาชนและบัญชีธนาคาร ถูกเก็บและแสดงตามสิทธิ์ของบทบาทผู้ใช้งานตามหลัก PDPA</span>
        </div>
      </Card>

      <Card icon={GitBranch} title="ระบบที่เกี่ยวข้อง (Related Systems)">
        <ul className="space-y-3 text-sm">
          <li>
            <a
              href="https://mednu-scopus-dashboard.pages.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:underline"
            >
              <ExternalLink className="w-4 h-4" /> MedNU Research Analytics
            </a>
            <p className="text-slate-600 mt-1">แดชบอร์ดวิเคราะห์ผลงานตีพิมพ์ของคณะแพทยศาสตร์ มน. จาก Scopus/PubMed ที่ใช้เป็นแหล่งอ้างอิงข้อมูลบทความ</p>
          </li>
        </ul>
      </Card>

      <Card icon={Network} title="แผนที่เว็บไซต์ (Site Map)">
        <p className="text-sm text-slate-500 mb-4">คลิกที่การ์ดเพื่อเข้าถึงหน้าต่างๆ ภายในระบบ:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((n) => {
            const Icon = n.icon;
            const isSelf = n.tab === 'about';
            return (
              <button
                key={n.tab}
                onClick={() => onNavigate(n.tab)}
                className={`text-left rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md ${
                  isSelf ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-800 mt-2 font-prompt">{n.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{n.desc}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="text-center text-xs text-slate-500 leading-6 py-4">
        Developed by Antigravity v{appVersion}
        <br />
        <User className="inline w-3 h-3 mr-1 -mt-0.5" />
        <a href="mailto:tinnakornh@gmail.com" className="text-blue-600 font-semibold hover:underline">TINNAKORNH</a>
      </div>
    </div>
  );
};
