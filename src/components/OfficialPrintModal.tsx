import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  CheckSquare, 
  Award, 
  CreditCard, 
  FileCheck2, 
  HelpCircle,
  AlertCircle,
  FileType,
  Loader2
} from 'lucide-react';
import { ResearchApplication } from '../types';
import { bahtText, formatBaht, getTrackingPrefix } from '../data/regulations';
import { MED_NU_LOGO_URL } from '../services/medNuLogo';
import { TEMPLATE_CHECKLIST_LOGO_BASE64 } from '../services/templateChecklistLogo';
import { GARUDA_MONOCHROME_URL } from '../services/garudaBase64';
import {
  generateChecklistDocx,
  generateMemoRewardDocx,
  generateMemoDisbursementDocx,
  generateReceiptDocx,
  generateCertificationDocx,
  generateAllDocsDocx,
  getMemoSubject,
  formatCurrencyBaht,
  formatThaiDateOfficial
} from '../services/docxExportService';

interface OfficialPrintModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

// 5 Official Documents in Requested Sequence:
// 1. checklist: แบบตรวจสอบรายการ (AWP Checklist)
// 2. memo_reward: บันทึกข้อความขออนุมัติเงินรางวัล
// 3. memo_disbursement: บันทึกข้อความขออนุมัติเบิกเงินรางวัล
// 4. receipt: ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร
// 5. certification: ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน ข้อ 46)
export type FormDocType = 
  | 'checklist' 
  | 'memo_reward' 
  | 'memo_disbursement' 
  | 'receipt' 
  | 'certification';

const GARUDA_URL = GARUDA_MONOCHROME_URL;
const TEMPLATE_LOGO_DATA_URL = `data:image/png;base64,${TEMPLATE_CHECKLIST_LOGO_BASE64}`;

export const OfficialPrintModal: React.FC<OfficialPrintModalProps> = ({
  application,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !application) return null;

  const [activeDoc, setActiveDoc] = useState<FormDocType>('checklist');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const trackingPrefix = getTrackingPrefix(application.fiscalYear);
  const sequenceOnly = application.trackingNo
    ? application.trackingNo.replace(new RegExp(`^${trackingPrefix}-?|^AWP\\d{2}-?`, 'i'), '')
    : '';

  const totalAmount = application.totalClaimedAmount || 0;
  const rewardAmount = application.claimedRewardAmount || 0;
  const pageChargeAmount = application.approvedPageChargeAmount || 0;

  const formatAmountDisplay = (num: number) => {
    const hasDec = Math.abs(num % 1) > 0.001;
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: hasDec ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    let docName = 'เอกสารราชการ';
    if (activeDoc === 'checklist') docName = `1_แบบตรวจสอบรายการ_${trackingPrefix}`;
    else if (activeDoc === 'memo_reward') docName = '2_บันทึกข้อความ_ขออนุมัติเงินรางวัล';
    else if (activeDoc === 'memo_disbursement') docName = '3_บันทึกข้อความ_ขออนุมัติเบิกเงินรางวัล';
    else if (activeDoc === 'receipt') docName = '4_ใบสำคัญรับเงิน_มน';
    else if (activeDoc === 'certification') docName = '5_ใบสำคัญรับรองจ่าย_ข้อ46';
    
    const printElement = document.getElementById('printable-document');
    if (!printElement) {
      window.print();
      return;
    }

    // สร้าง iframe ชั่วคราวเพื่อพิมพ์เฉพาะเนื้อหาเอกสารเดี่ยว ป้องกันปัญหาหน้าเกิน
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const pri = iframe.contentWindow;
    if (!pri) {
      window.print();
      return;
    }

    // รวบรวมแท็กสไตล์และฟอนต์ทั้งหมดจากหน้าหลัก
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="th">
        <head>
          <meta charset="UTF-8" />
          <title>${docName}_${application.trackingNo.replace('/', '_')}</title>
          ${styles}
          <style>
            @font-face {
              font-family: 'TH Sarabun PSK';
              src: local('TH Sarabun PSK'), local('THSarabunPSK'), local('THSarabun'),
                   url('/fonts/THSarabunPSK.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'TH Sarabun PSK';
              src: local('TH Sarabun PSK Bold'), local('THSarabunPSK-Bold'), local('THSarabun Bold'),
                   url('/fonts/THSarabunPSK-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
            }
            @font-face {
              font-family: 'TH Sarabun New';
              src: local('TH Sarabun New'), local('THSarabunNew'),
                   url('/fonts/THSarabunNew.ttf') format('truetype');
              font-weight: normal;
              font-style: normal;
            }
            @font-face {
              font-family: 'TH Sarabun New';
              src: local('TH Sarabun New Bold'), local('THSarabunNew-Bold'),
                   url('/fonts/THSarabunNew-Bold.ttf') format('truetype');
              font-weight: bold;
              font-style: normal;
            }
            @page {
              size: A4 portrait;
              margin: 10mm 15mm 10mm 20mm;
            }
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              font-family: 'TH Sarabun PSK', 'THSarabunPSK', 'TH Sarabun New', 'Sarabun', serif, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .avoid-break, tr, td, th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            p, .text-justify-doc {
              text-align: left !important;
              word-break: break-word !important;
            }
            #printable-document {
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
            }
            #printable-document > div {
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
            }
          </style>
        </head>
        <body>
          <div id="printable-document">
            ${printElement.innerHTML}
          </div>
        </body>
      </html>
    `;

    pri.document.open();
    pri.document.write(printHtml);
    pri.document.close();

    // รอให้รูปและสไตล์โหลดครบก่อนสั่งพิมพ์
    setTimeout(() => {
      pri.focus();
      pri.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 400);
  };

  const handleDownloadCurrentDocx = async () => {
    try {
      setIsExportingDocx(true);
      if (activeDoc === 'checklist') {
        await generateChecklistDocx(application);
      } else if (activeDoc === 'memo_reward') {
        await generateMemoRewardDocx(application);
      } else if (activeDoc === 'memo_disbursement') {
        await generateMemoDisbursementDocx(application);
      } else if (activeDoc === 'receipt') {
        await generateReceiptDocx(application);
      } else if (activeDoc === 'certification') {
        await generateCertificationDocx(application);
      }
    } catch (err) {
      console.error('Failed to export DOCX:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadAllDocx = async () => {
    try {
      setIsExportingDocx(true);
      await generateAllDocsDocx(application);
    } catch (err) {
      console.error('Failed to export all DOCX:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX ทั้ง 5 ชุด');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Bar (No Print) */}
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white border-b border-slate-800 no-print">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase font-prompt flex items-center gap-1.5">
              <span>ระบบจัดพิมพ์และดาวน์โหลดเอกสาร Word (DOCX) • คณะแพทยศาสตร์ ม.นเรศวร</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-prompt flex items-center gap-2">
              <span>จัดชุดเอกสาร 5 รายการตามแบบฟอร์มคณะแพทย์</span>
              <span className="font-mono text-xs bg-slate-800 px-2.5 py-0.5 rounded text-amber-300 border border-slate-700">
                {application.trackingNo}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Download DOCX Button */}
            <button
              onClick={handleDownloadCurrentDocx}
              disabled={isExportingDocx}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลดแบบฟอร์มเอกสารนี้เป็นไฟล์ Word (.docx) เพื่อนำไปแก้ไขหรือปรับแต่งหน้าได้อิสระ"
            >
              {isExportingDocx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileType className="w-4 h-4 text-blue-200" />
              )}
              <span>โหลด Word (.docx) หน้านี้</span>
            </button>

            {/* Download ALL 5 DOCX */}
            <button
              onClick={handleDownloadAllDocx}
              disabled={isExportingDocx}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="ดาวน์โหลดครบทั้ง 5 ไฟล์เป็น .docx พร้อมกัน"
            >
              <span>โหลดครบ 5 ฟอร์ม (.docx)</span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="สั่งพิมพ์ออกเครื่องพิมพ์ หรือเลือก 'Save as PDF'"
            >
              <Download className="w-4 h-4" />
              <span>พิมพ์ / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Reordered Document Switcher Tabs (1 to 5) */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex flex-wrap gap-1.5 text-xs no-print">
          <button
            onClick={() => setActiveDoc('checklist')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeDoc === 'checklist'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>1. Checklist แบบตรวจสอบรายการ ({trackingPrefix})</span>
          </button>

          <button
            onClick={() => setActiveDoc('memo_reward')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeDoc === 'memo_reward'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>2. บันทึกข้อความขออนุมัติเงินรางวัล</span>
          </button>

          <button
            onClick={() => setActiveDoc('memo_disbursement')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeDoc === 'memo_disbursement'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. บันทึกข้อความขออนุมัติเบิกเงินรางวัล</span>
          </button>

          <button
            onClick={() => setActiveDoc('receipt')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeDoc === 'receipt'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>4. ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร</span>
          </button>

          <button
            onClick={() => setActiveDoc('certification')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              activeDoc === 'certification'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>5. ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน ข้อ 46)</span>
          </button>
        </div>

        {/* Guidance Tip Bar (No Print) */}
        <div className="bg-amber-50/80 px-6 py-2 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              💡 <strong>คำแนะนำการพิมพ์:</strong> ตั้งค่า Margin เป็น <strong>Default</strong> และติ๊กเลือก <strong>Background graphics</strong> เพื่อให้ตารางและตราครุฑคมชัดสวยงามตรงตามระเบียบงานสารบรรณ
            </span>
          </div>
          <span className="font-mono text-slate-500 text-[10px]">A4 Portrait • TH Sarabun PSK 16pt</span>
        </div>

        {/* Printable Paper Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-50 print:p-0 print:m-0 print:bg-white print:overflow-visible flex-1" id="printable-document">
          <div className="bg-white shadow-md print:shadow-none p-8 sm:p-12 max-w-[210mm] mx-auto min-h-[297mm] print:min-h-0 print:h-auto print:max-w-none print:w-full text-black font-sarabun text-[15pt] leading-normal border border-slate-200 print:border-none print:p-0">
            
            {/* ========================================================= */}
            {/* 1. CHECKLIST (แบบตรวจสอบรายการ AWP)                       */}
            {/* ตรงตามแม่แบบ "1.แบบตรวจสอบรายการ2026-09-10.docx" 100%    */}
            {/* ========================================================= */}
            {activeDoc === 'checklist' && (() => {
              const isReward = rewardAmount > 0;
              const isPage = pageChargeAmount > 0;
              const isResearch = application.articleType === 'research_article';
              const isOther = application.articleType === 'other_academic';
              const isFirst = application.authorRole === 'first_author';
              const isCorr = application.authorRole === 'corresponding_author';
              const isCo = application.authorRole === 'co_author';

              const dbLower = (application.database || '').toLowerCase();
              const isSJR = dbLower.includes('sjr');
              const isJCR = dbLower.includes('jcr') || dbLower.includes('wos');
              const isScopus = dbLower.includes('scopus') || (!isSJR && !isJCR && application.journalScope === 'international');

              const q = (application.quartile || '').toUpperCase();
              const isQ1Tier1 = q.includes('TIER 1') || q.includes('TOP 10%');
              const isQ1 = q.includes('Q1') && !isQ1Tier1;
              const isQ2 = q.includes('Q2');
              const isQ3 = q.includes('Q3');
              const isQ4 = q.includes('Q4');
              const isTCI1 = q.includes('TCI 1') || (application.journalScope === 'national' && q.includes('1'));
              const isTCI2 = q.includes('TCI 2') || (application.journalScope === 'national' && q.includes('2'));

              return (
                <div className="text-[11pt] leading-tight">
                  {/* Header ตาราง 3 คอลัมน์ ขอบล่างเส้นเดี่ยว ตรงตามแม่แบบ */}
                  <div className="grid grid-cols-12 items-center border-b border-black pb-0.5 mb-0.5">
                    {/* Col 1: Logo */}
                    <div className="col-span-2 flex justify-center items-center">
                      <img 
                        src={TEMPLATE_LOGO_DATA_URL} 
                        alt="Logo คณะแพทย์ มน." 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    {/* Col 2: Title ตัดเป็น 3 บรรทัด ตัวหนา 13pt ไม่ขีดเส้นใต้ */}
                    <div className="col-span-7 flex flex-col justify-center items-center text-center font-bold px-1 text-[13pt] leading-tight">
                      <div>แบบตรวจสอบรายการขอรับทุนสนับสนุนค่าตีพิมพ์</div>
                      <div>รางวัลตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ</div>
                      <div>คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</div>
                    </div>
                    {/* Col 3: Tracking No. ตัวหนา ในกล่องข้อความพอดีกับข้อความ */}
                    <div className="col-span-3 flex justify-center items-center">
                      <div className="border border-black px-1.5 py-0.5 font-bold text-[11pt] tracking-wide inline-block">
                        {application.trackingNo}
                      </div>
                    </div>
                  </div>

                  {/* ตาราง 1: หัวข้อ และ รายละเอียด */}
                  <table className="w-full border-collapse border border-black text-[11pt] mb-0.5">
                    <tbody>
                      <tr className="font-bold bg-slate-50/50">
                        <td className="border border-black px-1.5 py-0 text-center w-[25%]">หัวข้อ</td>
                        <td className="border border-black px-1.5 py-0 text-center" colSpan={2}>รายละเอียด</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">1. ชื่อผู้ขอรับทุน</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.applicantName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;หน่วยงานที่สังกัด</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.department} คณะแพทยศาสตร์</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">2. ประเภททุนสนับสนุน</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isReward && <span className="mr-4">☑ รางวัลตีพิมพ์</span>}
                          {isPage && <span>☑ ค่าตีพิมพ์</span>}
                          {!isReward && !isPage && <span>-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">3. ชื่อบทความ</td>
                        <td className="border border-black px-1.5 py-0 italic" colSpan={2}>{application.articleTitle}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;ประเภทบทความ</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isResearch && <div>☑ 1) บทความวิชาการ (Research Article, Review Article, หรือ Guidelines)</div>}
                          {isOther && <div>☑ 2) บทความวิชาการอื่น ๆ (เช่น Case report, Case series, Clinical picture, Clinical note, Technical note)</div>}
                          {!isResearch && !isOther && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">4. การมีส่วนร่วม</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isFirst && <div>☑ 1) ผู้เขียนชื่อแรก (First Author)</div>}
                          {isCorr && <div>☑ 1) ผู้เขียนชื่อหลัก (Corresponding Author)</div>}
                          {isCo && <div>☑ 2) ผู้ร่วมเขียน (Co-author)</div>}
                          {!isFirst && !isCorr && !isCo && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">5. ชื่อวารสาร</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.journalName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">6. ประเภทฐานข้อมูล</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {application.journalScope === 'national' ? (
                            <div>
                              <span className="font-bold mr-2">ระดับชาติ</span>
                              {isTCI1 && <span className="mr-2">☑ TCI 1</span>}
                              {isTCI2 && <span className="mr-2">☑ TCI 2</span>}
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold mr-2">ระดับนานาชาติ</span>
                              {isScopus && <span className="mr-2">☑ Scopus</span>}
                              {isJCR && <span className="mr-2">☑ JCR/WoS</span>}
                              {isSJR && <span className="mr-2">☑ SJR</span>}
                              {isQ1Tier1 && <span className="mr-2">☑ Q1 (Tier 1)</span>}
                              {isQ1 && <span className="mr-2">☑ Q1</span>}
                              {isQ2 && <span className="mr-2">☑ Q2</span>}
                              {isQ3 && <span className="mr-2">☑ Q3</span>}
                              {isQ4 && <span className="mr-2">☑ Q4</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0" colSpan={3}>
                          7. บทความที่ขอรับรางวัลตีพิมพ์เผยแพร่แล้ว ไม่เกิน 24 เดือน และไม่เป็นส่วนหนึ่งในการขอจบการศึกษาเพื่อปริญญา
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Header ตาราง 2 */}
                  <div className="font-bold text-[11pt] mb-0.5 pl-1">
                    เอกสารประกอบการรับทุนสนับสนุนค่าตีพิมพ์/เบิกเงินรางวัลตีพิมพ์
                  </div>

                  {/* ตาราง 2: รายการ 13 ข้อ + ลายเซ็นขวามือ */}
                  <table className="w-full border-collapse border border-black text-[11pt] mb-0.5">
                    <thead>
                      <tr className="font-bold bg-slate-50/50">
                        <th className="border border-black px-1 py-0 text-center" colSpan={2}>รายการ</th>
                        <th className="border border-black w-[12%] px-0.5 py-0 text-center leading-tight text-[10pt]">/ = มี<br />X = ไม่มี</th>
                        <th className="w-[22%] border-t-0 border-r-0 border-b-0"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* แถวที่ 1 (เงินรางวัล ข้อ 1) */}
                      <tr>
                        <td className="border border-black px-0.5 py-0 text-center font-bold align-middle w-[10%]" rowSpan={9}>
                          เงินรางวัล
                        </td>
                        <td className="border border-black px-1.5 py-0 w-[58%]">1. บันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์ รางวัลตีพิมพ์</td>
                        <td className="border border-black px-0.5 py-0 text-center font-bold w-[12%]">
                          {isReward ? '/' : 'X'}
                        </td>
                        <td className="border-0 px-1 py-0.5 text-center align-top w-[22%]" rowSpan={13}>
                          <div className="pt-0.5 text-[10pt] leading-relaxed">
                            <div>....................................................</div>
                            <div>({application.applicantName})</div>
                            <div className="font-bold">ผู้ขอรับทุน/รางวัลตีพิมพ์</div>
                            <div>วันที่...................................</div>
                          </div>
                        </td>
                      </tr>

                      {/* ข้อ 2-9: เงินรางวัล */}
                      {[
                        '2. แบบฟอร์มประกอบการอนุมัติงบประมาณ',
                        '3. บันทึกข้อความขออนุมัติเบิกเงิน',
                        '4. ใบสำคัญรับเงิน',
                        '5. สำเนาบัตรประชาชน (รับรองสำเนาถูกต้อง)',
                        '6. สำเนาหน้าบัญชีธนาคารสำหรับโอนเงิน',
                        '7. สำเนาบทความที่ได้รับการตีพิมพ์ (รับรองสำเนาถูกต้องทุกหน้า)',
                        '8. สำเนาหลักฐานอ้างอิงฐานข้อมูล JCR/SJR/Scopus/TCI',
                        '9. สำเนาประกาศหลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์',
                      ].map((item, idx) => (
                        <tr key={idx + 2}>
                          <td className="border border-black px-1.5 py-0">{item}</td>
                          <td className="border border-black px-0.5 py-0 text-center font-bold">
                            {isReward ? '/' : 'X'}
                          </td>
                        </tr>
                      ))}

                      {/* ข้อ 10-13: ค่าตีพิมพ์ */}
                      {[
                        '10. เอกสารแสดงการตอบรับตีพิมพ์จากวารสาร',
                        '11. ใบเรียกเก็บเงินค่าตีพิมพ์จากวารสารที่ระบุข้อมูลเชื่อมโยงกับหลักฐานในข้อ 10.',
                        '12. หลักฐานการจ่ายเงินหรือใบเสร็จรับเงินสกุลเงินบาท',
                        '13. ใบรับรองการจ่ายเงินค่า page change',
                      ].map((item, idx) => (
                        <tr key={idx + 10}>
                          {idx === 0 && (
                            <td className="border border-black px-0.5 py-0 text-center font-bold align-middle w-[10%]" rowSpan={4}>
                              ค่าตีพิมพ์
                            </td>
                          )}
                          <td className="border border-black px-1.5 py-0">{item}</td>
                          <td className="border border-black px-0.5 py-0 text-center font-bold">
                            {isPage ? '/' : 'X'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ท้ายหน้า: ข้อความรับรอง (10 เคาะ ช่องไฟปกติ ไม่ใช้ justify) + ลายเซ็นผู้ประสานงาน */}
                  <div className="text-[11pt] leading-snug space-y-0">
                    <div>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตรวจสอบความถูกต้องครบถ้วนของเอกสารตามเกณฑ์การรับทุนสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร และปรับปรุงข้อมูลในฐานข้อมูลเรียบร้อยแล้ว
                    </div>
                    <div className="flex justify-end pr-4">
                      <div className="text-center text-[10pt] leading-relaxed">
                        <div>.............................................................. ผู้ประสานงาน</div>
                        <div>(..........…….…………………………………………)</div>
                        <div>วันที่ ....................................................</div>
                      </div>
                    </div>

                    {/* ข้อความหมายเหตุ 3 บรรทัด */}
                    <div className="text-[8pt] text-slate-700 leading-tight pt-0.5 border-t border-slate-300 space-y-0">
                      <div>* ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ (ประกาศ ณ วันที่ 27 พฤษภาคม 2567)</div>
                      <div>** ปรับปรุงล่าสุด Version3.10 / 10 ก.ย. 69</div>
                      <div>*** สำหรับตรวจเช็คความครบถ้วนของเอกสารและความถูกต้องของข้อมูลเท่านั้น</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* 2. บันทึกข้อความ ขออนุมัติเงินรางวัล (ตามแบบฟอร์ม 2 & Version 4.0.0.25Sep2026) */}
            {/* ========================================================= */}
            {activeDoc === 'memo_reward' && (() => {
              const isReward = rewardAmount > 0 || application.requestType === 'reward_only' || application.requestType === 'both';
              const isPage = pageChargeAmount > 0 || application.requestType === 'page_charge_only' || application.requestType === 'both';
              const subject = getMemoSubject(application, false);
              const formattedDate = formatThaiDateOfficial(application.createdAt);
              const authorRoleText = application.authorRole === 'first_author'
                ? '(1)First author'
                : application.authorRole === 'corresponding_author'
                ? '(1)Corresponding author'
                : '(2)Co-author';
              const scopeText = application.journalScope === 'national' ? '(ข)ระดับชาติ' : '(ก)ระดับนานาชาติ';
              const articleTypeText = application.articleType === 'research_article' ? '1)Research Article' : '2)บทความวิชาการอื่นๆ';

              return (
                <div className="text-[15pt] text-black tracking-normal flex flex-col justify-between min-h-[250mm] print:min-h-0">
                  <div>
                    {/* Header: Garuda 1.5 cm left, บันทึกข้อความ 28pt bold center across page */}
                    <div className="grid grid-cols-12 items-end mb-1.5">
                      <div className="col-span-2 flex items-start">
                        <img 
                          src={GARUDA_URL} 
                          alt="Garuda" 
                          className="w-[54px] h-[54px] object-contain"
                        />
                      </div>
                      <div className="col-span-8 text-center font-bold text-[28pt] leading-none">
                        บันทึกข้อความ
                      </div>
                      <div className="col-span-2"></div>
                    </div>

                    {/* Header Meta Fields with Dotted Underlines (space before = 0/ after = 0, ระยะบรรทัด 0.9) */}
                    <div className="space-y-0 my-0" style={{ lineHeight: 0.9 }}>
                      {/* ส่วนราชการ */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ส่วนราชการ</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[16pt]">
                          คณะแพทยศาสตร์ ภาควิชา{application.department || ''} โทร. {application.phone || 'ภายในคณะ'}
                        </div>
                      </div>

                      {/* ที่ และ วันที่ */}
                      <div className="flex items-baseline w-full gap-4 my-0 py-0">
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                            {application.internalDocNo || 'อว 0603.10.    / '}
                          </div>
                        </div>
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">วันที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                            {formattedDate}
                          </div>
                        </div>
                      </div>

                      {/* เรื่อง */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">เรื่อง</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                          {subject}
                        </div>
                      </div>
                    </div>

                    {/* Salutation (space before = 6 / after = 6) */}
                    <div className="font-normal" style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      เรียน&nbsp;&nbsp;&nbsp;คณบดีคณะแพทยศาสตร์
                    </div>

                    {/* Body Paragraph 1 (เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 0.85) */}
                    <p className="text-left break-words my-0 py-0" style={{ marginTop: 0, marginBottom: 0, lineHeight: 0.85 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ข้าพเจ้า {application.applicantName} ตำแหน่ง {application.academicPosition || 'อาจารย์แพทย์'} สังกัด ภาควิชา{application.department || ''} คณะแพทยศาสตร์ มีความประสงค์{subject} ตามประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 ซึ่งมีรายละเอียดดังนี้
                    </p>

                    {/* Article Details (เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 0.85) */}
                    <div className="space-y-0 my-0 py-0" style={{ marginTop: 0, marginBottom: 0, lineHeight: 0.85 }}>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">ชื่อบทความที่ได้รับการตีพิมพ์ : </span>
                        <span className="italic">{application.articleTitle}</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">ชื่อวารสาร : </span>
                        <span>{application.journalName} จากฐานข้อมูล {application.database || 'Scopus'} จัดอยู่ใน Quartile {application.quartile || '-'}</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">วัน/เดือน/ปีที่พิมพ์ : </span>
                        <span>{application.volumeIssue || 'Vol...... No...... Month.......... Year..........'}</span>
                      </div>
                      {application.doi && (
                        <div>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">DOI : </span>
                          <span>{application.doi}</span>
                        </div>
                      )}
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">การมีส่วนในผลงาน : </span>
                        <span>{authorRoleText}</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">วารสารวิชาการ : </span>
                        <span>{scopeText}&nbsp;&nbsp;&nbsp;</span>
                        <span className="font-bold">บทความประเภท : </span>
                        <span>{articleTypeText}</span>
                      </div>
                    </div>

                    {/* Financial amounts (space before = 0/ after = 0, ระยะบรรทัด 0.85) */}
                    <div className="my-0 py-0" style={{ marginTop: 0, marginBottom: 0, lineHeight: 0.85 }}>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;โดยขออนุมัติ {isReward && isPage ? `เงินรางวัลตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmount)} (${bahtText(rewardAmount)})` : isReward ? `เงินรางวัลตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmount)} (${bahtText(rewardAmount)})` : `ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageChargeAmount)} (${bahtText(pageChargeAmount)})`}
                      </div>
                      {isReward && isPage && (
                        <div>
                          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน {formatCurrencyBaht(pageChargeAmount)} ({bahtText(pageChargeAmount)})
                        </div>
                      )}
                      <div className="font-bold">
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;รวมเป็นเงินทั้งสิ้น {formatCurrencyBaht(totalAmount)} ({bahtText(totalAmount)})
                      </div>
                    </div>

                    {/* Closing (เคาะ 10, space before = 6/ after = 6, ระยะบรรทัด 0.85) */}
                    <div style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </div>

                    {/* Applicant Signature Block (จัดชิดกั้นหลัง กึ่งกลางบล็อก, space before = 6/ after = 6, ระยะบรรทัด 0.85) */}
                    <div className="grid grid-cols-2 avoid-break" style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      <div></div>
                      <div className="text-center">
                        <div>ลงชื่อ.............................................................</div>
                        <div>({application.applicantName})</div>
                        <div>ผู้ขอรับรางวัล</div>
                      </div>
                    </div>

                    {/* Approvers Section (ด้านล่างซ้าย จัดกึ่งกลางในบล็อก, 14.5 pt, ระยะบรรทัด 0.85) */}
                    <div className="avoid-break grid grid-cols-12 text-[14.5pt]" style={{ lineHeight: 0.85 }}>
                      <div className="col-span-8">
                        <div style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                          <div className="font-bold">เรียน  คณบดีคณะแพทยศาสตร์</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ขอเบิกจ่ายจาก งบประมาณรายได้ปี ........................</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>
                        </div>

                        <div className="text-center" style={{ marginTop: '6pt' }}>
                          <div>ลงชื่อ....................................................</div>
                          <div>(นางสาวปรารถนา เอนกปัญญากุล)</div>
                          <div>รักษาการในตำแหน่งหัวหน้างานวิจัย</div>
                          <div>วันที่......../........./...........</div>
                        </div>

                        <div className="text-center" style={{ marginTop: '12pt' }}>
                          <div>ลงชื่อ....................................................</div>
                          <div>(รองศาสตราจารย์ นายแพทย์อาทิตย์ เหล่าเรืองธนา)</div>
                          <div>รองคณบดีฝ่ายวิจัยและถ่ายทอดเทคโนโลยี</div>
                          <div>วันที่......../........./...........</div>
                        </div>
                      </div>
                      <div className="col-span-4"></div>
                    </div>
                  </div>

                  {/* Version Footer (ท้ายกระดาษชิดกั้นหลัง) */}
                  <div className="mt-auto pt-2 text-right text-[9pt] text-slate-500 avoid-break">
                    Version 4.0.0.25Sep2026
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* 3. บันทึกข้อความ ขออนุมัติเบิกเงินรางวัล (ตามแบบฟอร์ม 3 & Version 4.0.0.25Sep2026) */}
            {/* ========================================================= */}
            {activeDoc === 'memo_disbursement' && (() => {
              const isReward = rewardAmount > 0 || application.requestType === 'reward_only' || application.requestType === 'both';
              const isPage = pageChargeAmount > 0 || application.requestType === 'page_charge_only' || application.requestType === 'both';
              const subject = getMemoSubject(application, true);
              const memoApprovalSubject = getMemoSubject(application, false);
              const formattedDate = formatThaiDateOfficial(application.createdAt);

              return (
                <div className="text-[15pt] text-black tracking-normal flex flex-col justify-between min-h-[250mm] print:min-h-0">
                  <div>
                    {/* Header: Garuda 1.5 cm left, บันทึกข้อความ 28pt bold center across page */}
                    <div className="grid grid-cols-12 items-end mb-1.5">
                      <div className="col-span-2 flex items-start">
                        <img 
                          src={GARUDA_URL} 
                          alt="Garuda" 
                          className="w-[54px] h-[54px] object-contain"
                        />
                      </div>
                      <div className="col-span-8 text-center font-bold text-[28pt] leading-none">
                        บันทึกข้อความ
                      </div>
                      <div className="col-span-2"></div>
                    </div>

                    {/* Header Meta Fields with Dotted Underlines (space before = 0/ after = 0, ระยะบรรทัด 0.9) */}
                    <div className="space-y-0 my-0" style={{ lineHeight: 0.9 }}>
                      {/* ส่วนราชการ */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ส่วนราชการ</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-[16pt]">
                          คณะแพทยศาสตร์ ภาควิชา{application.department || ''} โทร. {application.phone || 'ภายในคณะ'}
                        </div>
                      </div>

                      {/* ที่ และ วันที่ */}
                      <div className="flex items-baseline w-full gap-4 my-0 py-0">
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                            {application.internalDocNo || 'อว 0603.10.    / '}
                          </div>
                        </div>
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">วันที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                            {formattedDate}
                          </div>
                        </div>
                      </div>

                      {/* เรื่อง */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">เรื่อง</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0.5 text-[16pt]">
                          {subject}
                        </div>
                      </div>
                    </div>

                    {/* Salutation (space before = 6 / after = 6) */}
                    <div className="font-normal" style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      เรียน&nbsp;&nbsp;&nbsp;คณบดีคณะแพทยศาสตร์
                    </div>

                    {/* Reference text (เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 0.85) */}
                    <p className="text-left break-words my-0 py-0" style={{ marginTop: 0, marginBottom: 0, lineHeight: 0.85 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตามที่ ข้าพเจ้า {application.applicantName} ตำแหน่ง {application.academicPosition || 'อาจารย์แพทย์'} สังกัด ภาควิชา{application.department || ''} คณะแพทยศาสตร์ ได้ยื่นเรื่อง {memoApprovalSubject} บทความวิจัยเรื่อง “{application.articleTitle}” นั้น
                    </p>

                    {/* Request details (เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 0.85) */}
                    <p className="text-left break-words my-0 py-0" style={{ marginTop: 0, marginBottom: 0, lineHeight: 0.85 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ในการนี้ ข้าพเจ้าจึงขออนุมัติเบิกเงิน{isPage ? `ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageChargeAmount)} (${bahtText(pageChargeAmount)}) ` : ''}{isReward && isPage ? 'และ' : ''}{isReward ? `รางวัลตีพิมพ์ตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmount)} (${bahtText(rewardAmount)})` : ''} รวมเป็นเงินทั้งสิ้น {formatCurrencyBaht(totalAmount)} ({bahtText(totalAmount)}) รายละเอียดตามเอกสารแนบท้าย
                    </p>

                    {/* Closing (เคาะ 10, space before = 6/ after = 6, ระยะบรรทัด 0.85) */}
                    <div style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </div>

                    {/* Applicant Signature Block (จัดชิดกั้นหลัง กึ่งกลางบล็อก, space before = 6/ after = 6, ระยะบรรทัด 0.85) */}
                    {/* หมายเหตุ: ตัดข้อความส่วนของหัวหน้างานวิจัยและรองคณบดีออก 100% ตามที่ผู้ใช้ร้องขอ */}
                    <div className="grid grid-cols-2 avoid-break" style={{ marginTop: '6pt', marginBottom: '6pt', lineHeight: 0.85 }}>
                      <div></div>
                      <div className="text-center">
                        <div>ลงชื่อ.............................................................</div>
                        <div>({application.applicantName})</div>
                        <div>ผู้ขอรับรางวัล</div>
                      </div>
                    </div>
                  </div>

                  {/* Version Footer (ท้ายกระดาษชิดกั้นหลัง) */}
                  <div className="mt-auto pt-2 text-right text-[9pt] text-slate-500 avoid-break">
                    Version 4.0.0.25Sep2026
                  </div>
                </div>
              );
            })()}


            {/* ========================================================= */}
            {/* 4. ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร (ตามแบบฟอร์ม 4)       */}
            {/* ========================================================= */}
            {activeDoc === 'receipt' && (
              <div className="space-y-4 text-justify leading-relaxed">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xl sm:text-2xl">ใบสำคัญรับเงิน</div>
                  <div className="font-bold text-lg">มหาวิทยาลัยนเรศวร</div>
                  <div className="text-right text-sm pt-2">
                    วันที่............เดือน................................พ.ศ. {application.fiscalYear}
                  </div>
                </div>

                <div className="indent-8 text-base leading-relaxed pt-2">
                  ข้าพเจ้า <strong>{application.applicantName}</strong> ตำแหน่ง {application.academicPosition || 'อาจารย์'} ที่อยู่ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ตำบลท่าโพธิ์ อำเภอเมือง จังหวัดพิษณุโลก ได้รับเงินจากมหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้
                </div>

                <table className="w-full border border-black border-collapse text-xs sm:text-sm mt-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2 text-center w-12">ที่</th>
                      <th className="border border-black p-2 text-left">รายการ</th>
                      <th className="border border-black p-2 text-center w-20">จำนวน</th>
                      <th className="border border-black p-2 text-right w-28">หน่วยละ</th>
                      <th className="border border-black p-2 text-right w-28">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageChargeAmount > 0 && (
                      <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2">
                          เงินสนับสนุนค่าตีพิมพ์บทความ เรื่อง {application.articleTitle}
                        </td>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(pageChargeAmount)}</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(pageChargeAmount)}</td>
                      </tr>
                    )}
                    {rewardAmount > 0 && (
                      <tr>
                        <td className="border border-black p-2 text-center">{pageChargeAmount > 0 ? 2 : 1}</td>
                        <td className="border border-black p-2">
                          เงินรางวัลตีพิมพ์บทความ เรื่อง {application.articleTitle} ({application.journalName})
                        </td>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(rewardAmount)}</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(rewardAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="border border-black p-2 text-right">รวมเงินทั้งสิ้น</td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="font-bold text-right pt-2 text-base">
                  จำนวนเงิน (ตัวอักษร): {bahtText(totalAmount)}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 text-center avoid-break">
                  <div>
                    <div>ลงชื่อ..........................................................ผู้รับเงิน</div>
                    <div className="font-semibold mt-1">({application.applicantName})</div>
                    <div className="text-xs text-slate-600">ผู้ขอรับทุน / รางวัล</div>
                  </div>

                  <div>
                    <div>ลงชื่อ..........................................................ผู้จ่ายเงิน</div>
                    <div className="font-semibold mt-1">(หน่วยการเงินและบัญชี คณะแพทยศาสตร์)</div>
                    <div className="text-xs text-slate-600">ผู้จ่ายเงิน</div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน ข้อ 46)        */}
            {/* ========================================================= */}
            {activeDoc === 'certification' && (
              <div className="space-y-4 text-justify leading-relaxed">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xl sm:text-2xl">ใบรับรองการจ่ายเงิน</div>
                  <div className="font-bold text-lg">ส่วนราชการ มหาวิทยาลัยนเรศวร</div>
                  <div className="text-xs text-slate-600">(ตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลังฯ พ.ศ. 2562 ข้อ 46)</div>
                </div>

                <table className="w-full border border-black border-collapse text-xs sm:text-sm mt-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2 text-center w-28">วัน เดือน ปี</th>
                      <th className="border border-black p-2 text-left">รายละเอียดการจ่าย</th>
                      <th className="border border-black p-2 text-right w-28">จำนวนเงิน</th>
                      <th className="border border-black p-2 text-center w-24">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 text-center">{application.publishedDate || application.createdAt}</td>
                      <td className="border border-black p-2 space-y-1">
                        <div className="font-medium">ค่าสนับสนุนการตีพิมพ์ / รางวัลตีพิมพ์บทความวิจัย</div>
                        <div className="text-xs text-slate-700 italic">เรื่อง {application.articleTitle}</div>
                        <div className="text-xs font-semibold text-slate-800">
                          วารสาร {application.journalName} (Quartile: {application.quartile})
                        </div>
                      </td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                      <td className="border border-black p-2 text-center">จ่ายจริง</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="border border-black p-2 text-right">
                        รวมทั้งสิ้น ({bahtText(totalAmount)})
                      </td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="indent-8 text-base leading-relaxed pt-3 text-justify">
                  ข้าพเจ้า <strong>{application.applicantName}</strong> ตำแหน่ง {application.academicPosition || 'อาจารย์'} สังกัด {application.department} คณะแพทยศาสตร์ ขอรับรองว่า รายจ่ายข้างต้นนี้ ข้าพเจ้าได้จ่ายเงินไปโดยได้รับใบเสร็จรับเงินซึ่งมีรายการไม่ครบถ้วนตามหลักฐานการจ่ายเงินในข้อ 46 หรือซึ่งตามลักษณะไม่อาจเรียกใบเสร็จรับเงินจากผู้รับเงินได้ ซึ่งเป็นไปตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลัง พ.ศ. 2562
                </div>

                <div className="pt-10 text-center max-w-xs ml-auto avoid-break">
                  <div>ลงชื่อ..........................................................</div>
                  <div className="font-semibold mt-1">({application.applicantName})</div>
                  <div className="text-sm text-slate-600">ผู้รับรอง</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
