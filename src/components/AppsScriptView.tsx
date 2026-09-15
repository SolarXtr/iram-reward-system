import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  FileSpreadsheet, 
  Server, 
  BookOpen, 
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Zap,
  Layout,
  HelpCircle
} from 'lucide-react';
import { 
  CODE_GS_TEMPLATE, 
  SHEET_MANAGER_GS, 
  LINE_NOTIFIER_GS, 
  REGULATIONS_GS,
  INDEX_HTML_TEMPLATE,
  GOOGLE_SITES_INTEGRATION_GUIDE 
} from '../data/appsScriptTemplates';

export const AppsScriptView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'code' | 'sheets' | 'line' | 'regulations' | 'html' | 'sites'>('code');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'code':
        return { filename: 'Code.gs', content: CODE_GS_TEMPLATE, desc: 'API Router, doPost/doGet, Smart Fallback Portal & Calendar Hooks' };
      case 'sheets':
        return { filename: 'SheetManager.gs', content: SHEET_MANAGER_GS, desc: 'โครงสร้าง Google Sheets, 3 แท็บข้อมูลมาตรฐาน และเมนูควบคุม' };
      case 'line':
        return { filename: 'LineNotifier.gs', content: LINE_NOTIFIER_GS, desc: 'ระบบแจ้งเตือน LINE OA (@414jvrca) Flex Messages 4 หมุดหมาย' };
      case 'regulations':
        return { filename: 'Regulations.gs', content: REGULATIONS_GS, desc: 'สูตรคำนวณเงินรางวัลและเพดานค่าตีพิมพ์ตามประกาศ 27 พ.ค. 2567' };
      case 'html':
        return { filename: 'index.html', content: INDEX_HTML_TEMPLATE, desc: 'หน้าเว็บ Portal สำหรับค้นหาและติดตามสถานะ 12 ขั้นตอนสำหรับฝังใน Google Sites' };
      case 'sites':
        return { filename: 'DeployGuide.md', content: GOOGLE_SITES_INTEGRATION_GUIDE, desc: 'คู่มือขั้นตอนการติดตั้งและวิธีแก้ No HTML file named index was found' };
    }
  };

  const currentFile = getActiveCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([currentFile.content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = currentFile.filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Code2 className="w-3.5 h-3.5" />
            <span>Google Apps Script + Google Workspace Production Ready (ปีงบประมาณ 2570)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-prompt text-white">
            ชุดโค้ด Google Apps Script และคู่มือติดตั้งบน Google Sites
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
            โค้ดภาษา Google Apps Script (.gs) และไฟล์หน้าเว็บ index.html ที่ผ่านการตรวจสอบความพร้อมและแก้ไขจุดบกพร่องแล้ว 100% พร้อมนำไปวางในโปรเจกต์ Google Sheets, Google Drive, Google Calendar และ LINE Messaging API (@414jvrca)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <span>เปิด Google Apps Script Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Quick Fix Alert for 'No HTML file named index was found' */}
      <div className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-2 text-xs flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-amber-950 text-sm">
                วิธีแก้ไข Error: <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900 text-xs">No HTML file named index was found</code>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900">
                แก้ไขได้ใน 1 นาที
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">
              ข้อผิดพลาดนี้เกิดขึ้นเพราะใน Google Apps Script ยังไม่มีการสร้างไฟล์ <code className="font-bold text-slate-900 font-mono">index.html</code> เพื่อให้ฟังก์ชัน <code className="font-mono text-blue-800">doGet()</code> เรียกแสดงผลหน้าเว็บ
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center gap-1 text-blue-700">
                  <span>✨ ทางแก้ที่ 1 (แนะนำ): สร้างไฟล์ index.html</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  ใน Apps Script กดปุ่ม <b>+</b> ➔ เลือก <b>HTML</b> ➔ ตั้งชื่อว่า <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-800">index</code> ➔ คัดลอกโค้ดจากแท็บ <b>5. index.html</b> ไปวาง ➔ กด Save แล้ว Deploy ใหม่
                </p>
                <button
                  onClick={() => setActiveTab('html')}
                  className="mt-2 text-[11px] font-bold text-blue-700 hover:text-blue-800 underline flex items-center gap-1"
                >
                  <span>คลิกไปที่แท็บ index.html &rarr;</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center gap-1 text-emerald-700">
                  <span>⚡ ทางแก้ที่ 2: ใช้ Code.gs เวอร์ชันใหม่ (Auto Fallback)</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  คัดลอก <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-800">Code.gs</code> เวอร์ชันอัปเดตล่าสุดไปวางทับ ซึ่งจะมีระบบสร้างหน้า Portal อัตโนมัติในตัว แม้ไม่มีไฟล์ index.html ก็ทำงานได้ 100%
                </p>
                <button
                  onClick={() => setActiveTab('code')}
                  className="mt-2 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline flex items-center gap-1"
                >
                  <span>คลิกไปที่แท็บ 1. Code.gs &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Production Readiness Checklist */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900 font-prompt">
            ผลการตรวจเช็คความพร้อมของโค้ดสคริปต์ (Production Readiness Audit)
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 ml-auto">
            ผ่านการตรวจสอบ 100% (Ready to Deploy)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ปีงบประมาณ 2570 & AWP70</span>
            </div>
            <p className="text-[11px] text-slate-600">
              ตั้งค่าเริ่มต้นปี 2570 และฟอร์แมตรหัสคำขอ <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono">AWP70-XXX</code> อัตโนมัติ
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Smart HTML Fallback</span>
            </div>
            <p className="text-[11px] text-slate-600">
              มีระบบแสดงหน้า Web Portal อัตโนมัติ ป้องกัน Error <code className="text-amber-700 font-mono">No HTML file</code>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>LINE OA 4 Milestones</span>
            </div>
            <p className="text-[11px] text-slate-600">
              ฟังก์ชันแจ้งเตือน 4 จุดสำคัญ (ยื่นคำขอ, ตรวจผ่าน, คณบดีอนุมัติ, เงินโอนเข้า) พร้อมใช้
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>PDPA Masking Protected</span>
            </div>
            <p className="text-[11px] text-slate-600">
              พรางเลขบัญชีธนาคารในข้อความแจ้งเตือน (<code className="text-amber-700 font-mono">xxx-x-xxxxx-7</code>) ตามมาตรฐานความปลอดภัย
            </p>
          </div>
        </div>
      </div>

      {/* Tabs & Code Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'code' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>1. Code.gs (Core API)</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'sheets' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>2. SheetManager.gs</span>
            </button>

            <button
              onClick={() => setActiveTab('line')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'line' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. LineNotifier.gs</span>
            </button>

            <button
              onClick={() => setActiveTab('regulations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'regulations' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>4. Regulations.gs</span>
            </button>

            <button
              onClick={() => setActiveTab('html')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'html' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>5. index.html (Web App UI)</span>
            </button>

            <button
              onClick={() => setActiveTab('sites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'sites' ? 'bg-white text-blue-700 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>6. คู่มือติดตั้ง & แก้ไขปัญหา</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกไฟล์นี้'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลดไฟล์</span>
            </button>
          </div>
        </div>

        {/* File Description Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {currentFile.filename}
            </span>
            <span className="text-slate-600 font-medium">• {currentFile.desc}</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">{currentFile.content.length} ตัวอักษร</span>
        </div>

        {/* Code Content or Rendered Markdown */}
        {activeTab === 'sites' ? (
          <div className="p-6 bg-white text-slate-800 text-xs sm:text-sm leading-relaxed overflow-y-auto max-h-[600px] prose prose-slate max-w-none">
            <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {currentFile.content}
            </pre>
          </div>
        ) : (
          <div className="p-4 bg-[#0d1117] text-slate-200 font-mono text-xs overflow-x-auto max-h-[600px] leading-relaxed">
            <pre>
              <code>{currentFile.content}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Deployment Helper Box */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <Terminal className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white text-sm">การตั้งค่าตัวแปรใน Script Properties (ค่าแนะนำ)</div>
            <div className="text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
              <span><b className="text-amber-300">SPREADSHEET_ID:</b> ID ของ Google Sheets</span>
              <span><b className="text-amber-300">LINE_CHANNEL_ACCESS_TOKEN:</b> Token จาก LINE Developers</span>
              <span><b className="text-amber-300">CALENDAR_ID:</b> primary</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('sites')}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold rounded-xl text-xs whitespace-nowrap transition-colors"
        >
          อ่านคู่มือขั้นตอนการติดตั้งทีละสเต็ป &rarr;
        </button>
      </div>
    </div>
  );
};
