import React, { useState, useEffect } from 'react';
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
  Loader2,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Save,
  Check,
  Calendar,
  Building,
  Info,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import { ResearchApplication, UserProfile } from '../types';
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
  formatThaiDateOfficial,
  formatThaiDateShort,
  getApplicantSignRoleTitle,
  formatJournalDatabaseQuartile,
  formatPublicationVolumeIssue
} from '../services/docxExportService';
import { formatInternalDocNo, getDepartmentCode, DEPARTMENT_LIST } from '../data/departmentCodes';

interface OfficialPrintModalProps {
  application: ResearchApplication | null;
  currentUser?: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSaveDocDetails?: (appId: string, updates: Partial<ResearchApplication>) => void;
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
  currentUser,
  isOpen,
  onClose,
  onSaveDocDetails,
}) => {
  if (!isOpen || !application) return null;

  const [activeDoc, setActiveDoc] = useState<FormDocType>('checklist');
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setZoomLevel(100);
  const trackingPrefix = getTrackingPrefix(application.fiscalYear);
  const sequenceOnly = application.trackingNo
    ? application.trackingNo.replace(new RegExp(`^${trackingPrefix}-?|^AWP\\d{2}-?`, 'i'), '')
    : '';

  // Online Review Progress 100% Gatekeeper
  const [isOnlineReviewComplete, setIsOnlineReviewComplete] = useState<boolean>(() => {
    if (application.isOnlineReviewComplete !== undefined) {
      return application.isOnlineReviewComplete;
    }
    return ['dean_approved', 'paid', 'finance_processing'].includes(application.status) || application.currentStep >= 8;
  });

  // Department code (10.xx): default from logged-in user or application
  const [deptCode, setDeptCode] = useState<string>(() => {
    return application.deptCode || getDepartmentCode(currentUser?.department || application.department);
  });

  // Running number (xxx)
  const [docRunningNo, setDocRunningNo] = useState<string>(() => {
    return application.docRunningNo || '';
  });

  // Official date (วันที่)
  const [officialDocDate, setOfficialDocDate] = useState<string>(() => {
    return application.officialDocDate || '';
  });

  // Publication & Database fields for memo
  const [databaseYear, setDatabaseYear] = useState<string>(() => {
    return application.databaseYear || '2025';
  });
  const [vol, setVol] = useState<string>(() => {
    return application.vol || '';
  });
  const [no, setNo] = useState<string>(() => {
    return application.no || '';
  });
  const [publishMonth, setPublishMonth] = useState<string>(() => {
    return application.publishMonth || '';
  });
  const [publishYear, setPublishYear] = useState<string>(() => {
    if (application.publishYear) return application.publishYear;
    if (application.publishedDate) {
      const parsedYear = new Date(application.publishedDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1900) return parsedYear.toString();
    }
    return '2026';
  });
  const [pages, setPages] = useState<string>(() => {
    return application.pages || '';
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (application) {
      setIsOnlineReviewComplete(
        application.isOnlineReviewComplete !== undefined 
          ? application.isOnlineReviewComplete 
          : (['dean_approved', 'paid', 'finance_processing'].includes(application.status) || application.currentStep >= 8)
      );
      setDeptCode(application.deptCode || getDepartmentCode(currentUser?.department || application.department));
      setDocRunningNo(application.docRunningNo || '');
      setOfficialDocDate(application.officialDocDate || '');
      setDatabaseYear(application.databaseYear || '2025');
      setVol(application.vol || '');
      setNo(application.no || '');
      setPublishMonth(application.publishMonth || '');
      setPublishYear(
        application.publishYear || 
        (application.publishedDate ? new Date(application.publishedDate).getFullYear().toString() : '2026')
      );
      setPages(application.pages || '');
    }
  }, [application.id, currentUser?.department]);

  // Download / Print is allowed ONLY when 100% complete AND both runningNo and date are properly filled!
  const isDocReady = isOnlineReviewComplete && Boolean(docRunningNo.trim()) && Boolean(officialDocDate.trim());

  const previewDocNo = isDocReady 
    ? formatInternalDocNo(deptCode, docRunningNo) 
    : formatInternalDocNo(deptCode, '');

  const previewDate = isDocReady 
    ? formatThaiDateOfficial(officialDocDate) 
    : '...................................................';

  const appWithDocDetails: ResearchApplication = {
    ...application,
    deptCode,
    docRunningNo: isDocReady ? docRunningNo.trim() : undefined,
    officialDocDate: isDocReady ? officialDocDate.trim() : undefined,
    isOnlineReviewComplete,
    internalDocNo: previewDocNo,
    databaseYear: databaseYear.trim(),
    vol: vol.trim(),
    no: no.trim(),
    publishMonth: publishMonth.trim(),
    publishYear: publishYear.trim(),
    pages: pages.trim(),
  };

  const handleSaveNumbering = () => {
    if (onSaveDocDetails) {
      onSaveDocDetails(application.id, {
        deptCode,
        docRunningNo: docRunningNo.trim(),
        officialDocDate: officialDocDate.trim(),
        isOnlineReviewComplete,
        internalDocNo: previewDocNo,
        databaseYear: databaseYear.trim(),
        vol: vol.trim(),
        no: no.trim(),
        publishMonth: publishMonth.trim(),
        publishYear: publishYear.trim(),
        pages: pages.trim(),
      });
    }
    setSaveSuccessMsg('บันทึกข้อมูลเรียบร้อยแล้ว');
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  const handleSetToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setOfficialDocDate(formatThaiDateOfficial(today));
  };

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
              margin: ${activeDoc === 'checklist' ? '10mm 15mm 10mm 15mm' : '20mm 20mm 15mm 30mm'};
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
            #printable-document,
            #printable-document > div,
            #printable-document > div > div {
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              max-width: 100% !important;
              min-height: 0 !important;
              height: auto !important;
            }
            ${(activeDoc === 'memo_reward' || activeDoc === 'memo_disbursement') ? `
            #printable-document .memo-print-page {
              min-height: 260mm !important;
              height: 260mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              box-sizing: border-box !important;
            }
            #printable-document .memo-print-page .version-footer {
              margin-top: auto !important;
              padding-top: 0 !important;
              page-break-inside: avoid !important;
            }
            ` : `
            .version-footer {
              margin-top: 4px !important;
              padding-top: 0 !important;
              page-break-inside: avoid !important;
            }
            `}
            ${activeDoc === 'checklist' ? `
            #printable-document .checklist-print-page {
              min-height: 268mm !important;
              height: 268mm !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              box-sizing: border-box !important;
            }
            #printable-document .checklist-print-page .checklist-remarks {
              margin-top: auto !important;
              padding-top: 4px !important;
            }
            ` : ''}
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
        await generateChecklistDocx(appWithDocDetails);
      } else if (activeDoc === 'memo_reward') {
        await generateMemoRewardDocx(appWithDocDetails);
      } else if (activeDoc === 'memo_disbursement') {
        await generateMemoDisbursementDocx(appWithDocDetails);
      } else if (activeDoc === 'receipt') {
        await generateReceiptDocx(appWithDocDetails);
      } else if (activeDoc === 'certification') {
        await generateCertificationDocx(appWithDocDetails);
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
      await generateAllDocsDocx(appWithDocDetails);
    } catch (err) {
      console.error('Failed to export all DOCX:', err);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์ DOCX ทั้ง 5 ชุด');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center print:p-0 ${
      isFullscreen 
        ? 'p-0 w-screen h-screen bg-slate-950' 
        : 'p-2 sm:p-4 overflow-hidden bg-slate-950/75 backdrop-blur-sm'
    }`}>
      <div className={`bg-white flex flex-col shadow-2xl overflow-hidden transition-all duration-200 print:max-h-none print:shadow-none print:border-none print:rounded-none ${
        isFullscreen 
          ? 'w-full h-full rounded-none border-none' 
          : 'w-full max-w-[98vw] 2xl:max-w-[1600px] h-[95vh] rounded-2xl border border-slate-200'
      }`}>
        
        {/* Modal Top Bar (No Print) */}
        <div className="bg-slate-900 px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 text-white border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-3 min-w-0">
            {/* Toggle Sidebar Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isSidebarOpen 
                  ? 'bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700 border border-slate-700' 
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              }`}
              title={isSidebarOpen ? "ซ่อนแผงควบคุมด้านซ้ายเพื่อดูเอกสารพรีวิวแบบเต็มตา" : "แสดงแผงควบคุมด้านซ้าย"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4 text-amber-400" />}
              <span className="hidden md:inline">{isSidebarOpen ? 'ซ่อนแผงควบคุม' : 'แสดงแผงควบคุม'}</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white font-prompt truncate">
                  ระบบจัดพิมพ์และดาวน์โหลดเอกสาร (Word / PDF)
                </h2>
                <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-amber-300 border border-slate-700 shrink-0 hidden sm:inline-block">
                  {application.trackingNo}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 hidden md:inline-block ${
                  isDocReady ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isDocReady ? 'ฉบับสมบูรณ์' : 'ฉบับร่าง'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Icons in Top Bar: Zoom Controls + Fullscreen Button + Close Button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden lg:flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-slate-300">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:text-white hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                title="ย่อขนาด (-10%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleZoomReset}
                className="px-2 py-0.5 text-[11px] font-mono hover:text-white transition-colors cursor-pointer"
                title="รีเซ็ตขนาด 100%"
              >
                {zoomLevel}%
              </button>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:text-white hover:bg-slate-700/60 rounded transition-colors cursor-pointer"
                title="ขยายขนาด (+10%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isFullscreen
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title={isFullscreen ? "ออกจากโหมดเต็มจอ" : "ขยายเต็มจอ (Fullscreen Mode ⛶)"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">ย่อจอ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-slate-300" />
                  <span className="hidden sm:inline">เต็มจอ (⛶)</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Split View Body: Left Sidebar (Controls) + Right Canvas (Paper Preview) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: แผงควบคุมเอกสาร (30% หรือ ซ่อนได้)             */}
          {/* ========================================================= */}
          {isSidebarOpen && (
            <aside className="w-full lg:w-[340px] xl:w-[380px] 2xl:w-[420px] shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col h-full overflow-y-auto no-print">
              <div className="p-3.5 sm:p-4 space-y-3.5">
                
                {/* 1. ปุ่มดาวน์โหลด Word และปุ่มพิมพ์ (Action Buttons) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-prompt">
                      ดาวน์โหลด & สั่งพิมพ์
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isDocReady ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {isDocReady ? 'ฉบับสมบูรณ์' : 'ฉบับร่าง (Draft)'}
                    </span>
                  </div>

                  {/* Single Word DOCX */}
                  <button
                    onClick={handleDownloadCurrentDocx}
                    disabled={isExportingDocx}
                    className={`w-full py-2.5 px-3 font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                      isDocReady && !isExportingDocx
                        ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white'
                        : 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 border border-slate-700'
                    }`}
                    title={isDocReady ? "ดาวน์โหลดแบบฟอร์มเอกสารนี้เป็นไฟล์ Word (.docx) ฉบับสมบูรณ์" : "ดาวน์โหลดแบบฟอร์มเอกสารนี้เป็นไฟล์ Word (.docx) ฉบับร่างเพื่อตรวจทาน"}
                  >
                    {isExportingDocx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isDocReady ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <FileType className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{isDocReady ? 'ดาวน์โหลด Word ฉบับสมบูรณ์ (.docx)' : 'ดาวน์โหลด Word (ร่าง) (.docx)'}</span>
                  </button>

                  {/* All 5 DOCX */}
                  <button
                    onClick={handleDownloadAllDocx}
                    disabled={isExportingDocx}
                    className={`w-full py-2 px-3 font-semibold rounded-lg text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      isDocReady && !isExportingDocx
                        ? 'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-amber-300 border-slate-700 shadow-sm'
                        : 'bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                    title={isDocReady ? "ดาวน์โหลดครบทั้ง 5 ไฟล์เป็น .docx ฉบับสมบูรณ์พร้อมกัน" : "ดาวน์โหลดครบทั้ง 5 ไฟล์เป็น .docx ฉบับร่างพร้อมกัน"}
                  >
                    {isDocReady ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{isDocReady ? 'โหลดครบ 5 ฟอร์ม (ฉบับสมบูรณ์)' : 'โหลดครบ 5 ฟอร์ม (ร่าง)'}</span>
                  </button>

                  {/* Print / PDF Button */}
                  <button
                    onClick={handlePrint}
                    className={`w-full py-2.5 px-3 font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 shadow transition-all cursor-pointer ${
                      isDocReady
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                    }`}
                    title={isDocReady ? "สั่งพิมพ์ออกเครื่องพิมพ์ หรือเลือก 'Save as PDF' ฉบับสมบูรณ์" : "สั่งพิมพ์ออกเครื่องพิมพ์ หรือเลือก 'Save as PDF' ฉบับร่าง"}
                  >
                    {isDocReady ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Download className="w-4 h-4 text-slate-950" />}
                    <span>{isDocReady ? 'พิมพ์ / บันทึก PDF (ฉบับสมบูรณ์)' : 'พิมพ์ / บันทึก PDF (ฉบับร่าง)'}</span>
                  </button>
                </div>

                {/* 2. สลับแท็บเอกสาร 1 - 5 (Vertical Switcher) */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2 font-prompt flex items-center justify-between">
                    <span>รายการเอกสาร (1 - 5)</span>
                    <span className="text-[10px] text-slate-400 font-normal">คลิกเพื่อสลับดู</span>
                  </div>

                  {[
                    {
                      id: 'checklist',
                      num: '1',
                      title: 'แบบตรวจสอบรายการ',
                      sub: `AWP Checklist (${trackingPrefix})`,
                      icon: CheckSquare,
                    },
                    {
                      id: 'memo_reward',
                      num: '2',
                      title: 'บันทึกขออนุมัติเงินรางวัล',
                      sub: 'ถึง คณบดีคณะแพทยศาสตร์',
                      icon: Award,
                    },
                    {
                      id: 'memo_disbursement',
                      num: '3',
                      title: 'บันทึกขออนุมัติเบิกเงินรางวัล',
                      sub: 'ถึง อธิการบดีมหาวิทยาลัยนเรศวร',
                      icon: FileText,
                    },
                    {
                      id: 'receipt',
                      num: '4',
                      title: 'ใบสำคัญรับเงิน ม.นเรศวร',
                      sub: 'หลักฐานการรับเงินรางวัล/ค่าตีพิมพ์',
                      icon: CreditCard,
                    },
                    {
                      id: 'certification',
                      num: '5',
                      title: 'ใบสำคัญรับรองจ่าย (ข้อ 46)',
                      sub: 'ใบรับรองการจ่ายเงินตามระเบียบ',
                      icon: FileCheck2,
                    },
                  ].map((doc) => {
                    const Icon = doc.icon;
                    const isActive = activeDoc === doc.id;
                    return (
                      <button
                        key={doc.id}
                        onClick={() => setActiveDoc(doc.id as FormDocType)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 cursor-pointer border ${
                          isActive
                            ? 'bg-blue-50/80 border-blue-500 text-blue-950 font-bold shadow-sm'
                            : 'bg-white border-transparent hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md mt-0.5 shrink-0 ${
                          isActive ? 'bg-blue-700 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="leading-snug truncate">
                            {doc.num}. {doc.title}
                          </div>
                          <div className={`text-[10px] truncate ${isActive ? 'text-blue-700 font-medium' : 'text-slate-400 font-normal'}`}>
                            {doc.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 3. ระบบออกเลขที่หนังสือ & วันที่ (Online Review & Numbering) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-prompt">
                      การตรวจและลงเลขที่
                    </span>
                    <button
                      onClick={() => setIsOnlineReviewComplete(!isOnlineReviewComplete)}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        isOnlineReviewComplete
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      }`}
                      title={isOnlineReviewComplete ? "สลับกลับเป็นสถานะแบบร่าง" : "ยืนยันตรวจครบ 100% หรือเจ้าหน้าที่อนุญาตให้ออกเลข"}
                    >
                      {isOnlineReviewComplete ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>สลับร่าง</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          <span>อนุญาต 100%</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Status Indicator */}
                  <div className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    isOnlineReviewComplete 
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                      : 'bg-blue-50/80 border-blue-200 text-blue-950'
                  }`}>
                    {isOnlineReviewComplete ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    )}
                    <div className="text-[11px] leading-relaxed">
                      {isOnlineReviewComplete ? (
                        <span><strong>ตรวจครบ 100%:</strong> กรุณากรอกเลขลำดับและวันที่ แล้วกดบันทึกเพื่อออกฉบับสมบูรณ์</span>
                      ) : (
                        <span><strong>อยู่ระหว่างตรวจ (ฉบับร่าง):</strong> โหลดและพิมพ์ฉบับร่างได้ทันที ช่องกรอกเลขที่จะเปิดเมื่อตรวจครบ 100%</span>
                      )}
                    </div>
                  </div>

                  {/* Numbering Form (Enabled if 100%) */}
                  {isOnlineReviewComplete ? (
                    <div className="space-y-2.5 pt-1 border-t border-slate-100">
                      {/* Dept Code */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>รหัสหน่วยงาน (10.xx)</span>
                          <span className="text-[10px] text-blue-600 font-normal">แก้ไขได้</span>
                        </label>
                        <div className="flex items-center">
                          <span className="px-2 py-1.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-xs font-mono font-bold text-slate-600 shrink-0">
                            อว 0603.10.
                          </span>
                          <input
                            type="text"
                            value={deptCode}
                            onChange={(e) => setDeptCode(e.target.value)}
                            placeholder="01(9)"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-r-lg text-xs font-mono font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            list="dept-code-suggestions"
                          />
                          <datalist id="dept-code-suggestions">
                            {DEPARTMENT_LIST.map((d) => (
                              <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                            ))}
                          </datalist>
                        </div>
                      </div>

                      {/* Running No */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>เลขลำดับ (xxx)*</span>
                          <span className="text-[10px] text-emerald-600 font-normal">จำเป็น</span>
                        </label>
                        <div className="flex items-center">
                          <span className="px-2 py-1.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-xs font-mono font-bold text-slate-600 shrink-0">
                            /
                          </span>
                          <input
                            type="text"
                            value={docRunningNo}
                            onChange={(e) => setDocRunningNo(e.target.value)}
                            placeholder="เช่น 066"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-r-lg text-xs font-mono font-bold bg-white text-slate-900 border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Official Date */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center justify-between">
                          <span>วันที่ในหนังสือ*</span>
                          <span className="text-[10px] text-emerald-600 font-normal">จำเป็น</span>
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={officialDocDate}
                            onChange={(e) => setOfficialDocDate(e.target.value)}
                            placeholder="เช่น 26 มกราคม 2569"
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={handleSetToday}
                            className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-semibold shrink-0 cursor-pointer"
                            title="ใส่วันที่ปัจจุบัน"
                          >
                            วันนี้
                          </button>
                        </div>
                      </div>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={handleSaveNumbering}
                        className="w-full mt-1 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกเลขที่ & วันที่</span>
                      </button>

                      {/* Feedback message */}
                      {saveSuccessMsg && (
                        <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{saveSuccessMsg}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                      รหัสหน่วยงาน: {deptCode ? `อว 0603.10.${deptCode}` : 'อว 0603.10.xx'}
                    </div>
                  )}
                </div>

                {/* 4. ข้อมูลสิ่งพิมพ์ในบันทึกข้อความ (Publication Details for Memo) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider font-prompt">
                      ข้อมูลสิ่งพิมพ์ในบันทึก
                    </span>
                    <span className="text-[10px] text-blue-600 font-normal">แก้ไข & แสดงผลทันที</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ปีของฐานข้อมูล (Database Year)
                    </label>
                    <input
                      type="text"
                      value={databaseYear}
                      onChange={(e) => setDatabaseYear(e.target.value)}
                      placeholder="เช่น 2025"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Vol (เล่มที่)
                      </label>
                      <input
                        type="text"
                        value={vol}
                        onChange={(e) => setVol(e.target.value)}
                        placeholder="เช่น 29 หรือ -"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        No (ฉบับที่)
                      </label>
                      <input
                        type="text"
                        value={no}
                        onChange={(e) => setNo(e.target.value)}
                        placeholder="เช่น 1 หรือ -"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Month (เดือน)
                      </label>
                      <input
                        type="text"
                        value={publishMonth}
                        onChange={(e) => setPublishMonth(e.target.value)}
                        placeholder="เช่น Jan หรือ -"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Year (ปี ค.ศ.)
                      </label>
                      <input
                        type="text"
                        value={publishYear}
                        onChange={(e) => setPublishYear(e.target.value)}
                        placeholder="เช่น 2026"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Pages (เลขหน้า เช่น 123-130 หรือ -)
                    </label>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="เช่น 123-130 หรือ -"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  {/* Quick Save button for publication fields */}
                  <button
                    type="button"
                    onClick={handleSaveNumbering}
                    className="w-full mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>บันทึกข้อมูลสิ่งพิมพ์</span>
                  </button>
                </div>

                {/* 5. คำแนะนำการพิมพ์ (Guidance Tip) */}
                <div className="bg-amber-50/90 p-3 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>คำแนะนำการพิมพ์ราชการ</span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-amber-900/90">
                    {activeDoc === 'checklist' ? (
                      <>
                        สำหรับแบบตรวจสอบรายการ (Checklist): ขอบกระดาษตั้งค่าเป็น <strong>ซ้าย 1.5 ซม. ขวา 1.5 ซม. บน 1.0 ซม. ล่าง 1.0 ซม.</strong> (พอดี 1 หน้ากระดาษ)
                      </>
                    ) : (
                      <>
                        ตั้งค่า Margin เป็น <strong>Default</strong> และติ๊กเลือก <strong>Background graphics</strong> เพื่อให้กั้นหน้า 3 ซม. กั้นหลัง 2 ซม. คมชัดตรงตามระเบียบสารบรรณ
                      </>
                    )}
                  </p>
                </div>

              </div>
            </aside>
          )}

          {/* ========================================================= */}
          {/* RIGHT PREVIEW CANVAS: แสดงกระดาษ A4 พรีวิวขนาดใหญ่ 70%-100%   */}
          {/* ========================================================= */}
          <main className="flex-1 h-full bg-slate-300/80 p-3 sm:p-6 lg:p-8 overflow-y-auto flex flex-col items-center justify-start print:p-0 print:m-0 print:bg-white print:overflow-visible relative">
            
            {/* Floating button to restore sidebar when hidden */}
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="absolute top-4 left-4 z-20 bg-slate-900/95 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xl backdrop-blur flex items-center gap-1.5 transition-all no-print cursor-pointer border border-slate-700 hover:border-amber-400"
                title="เปิดแผงควบคุมด้านซ้าย"
              >
                <PanelLeftOpen className="w-4 h-4 text-amber-400" />
                <span>แสดงแผงควบคุม</span>
              </button>
            )}

            {/* Dynamic @page margins based on active document */}
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: ${activeDoc === 'checklist' ? '10mm 15mm 10mm 15mm' : '20mm 20mm 15mm 30mm'} !important;
                }
                ${(activeDoc === 'memo_reward' || activeDoc === 'memo_disbursement') ? `
                #printable-document .memo-print-page {
                  min-height: 257mm !important;
                  height: 257mm !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  box-sizing: border-box !important;
                }
                #printable-document .memo-print-page .version-footer {
                  margin-top: auto !important;
                  padding-top: 0 !important;
                }
                ` : ''}
              }
            `}</style>

            {/* Paper Preview Sheet A4 */}
            <div 
              id="printable-document" 
              style={{
                transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out'
              }}
              className={`bg-white shadow-2xl print:shadow-none max-w-[210mm] w-full min-h-[297mm] print:min-h-0 print:h-auto print:max-w-none print:w-full text-black font-sarabun text-[15pt] leading-normal border border-slate-300 print:border-none print:p-0 my-2 ${
                activeDoc === 'checklist'
                  ? 'pt-[10mm] pb-[10mm] pl-[15mm] pr-[15mm]'
                  : 'pt-[20mm] pb-[20mm] pl-[30mm] pr-[20mm]'
              }`}
            >
            
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
                <div className="checklist-print-page text-[14pt] leading-tight flex flex-col justify-between min-h-[268mm]">
                  <div>
                    {/* Header ตาราง 3 คอลัมน์ ขอบล่างเส้นเดี่ยว ตรงตามแม่แบบ */}
                  <div className="grid grid-cols-12 items-center border-b border-black pb-1 mb-1.5">
                    {/* Col 1: Logo */}
                    <div className="col-span-2 flex justify-center items-center">
                      <img 
                        src={TEMPLATE_LOGO_DATA_URL} 
                        alt="Logo คณะแพทย์ มน." 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    {/* Col 2: Title ตัดเป็น 3 บรรทัด ตัวหนา 14pt ไม่ขีดเส้นใต้ จัดกึ่งกลาง */}
                    <div className="col-span-8 flex flex-col justify-center items-center text-center font-bold px-1 text-[14pt] leading-snug">
                      <div>แบบตรวจสอบรายการขอรับทุนสนับสนุนค่าตีพิมพ์</div>
                      <div>รางวัลตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ</div>
                      <div>คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</div>
                    </div>
                    {/* Col 3: Tracking No. ตัวหนา ในกล่องข้อความพอดีกับข้อความ */}
                    <div className="col-span-2 flex justify-center items-center">
                      <div className="border border-black px-2 py-0.5 font-bold text-[12pt] tracking-wide inline-block">
                        {application.trackingNo}
                      </div>
                    </div>
                  </div>

                  {/* ตาราง 1: หัวข้อ และ รายละเอียด */}
                  <table className="w-full border-collapse border border-black text-[13pt] mb-1">
                    <tbody>
                      <tr className="font-bold bg-slate-50/50">
                        <td className="border border-black px-2 py-0.5 text-center w-[25%]">หัวข้อ</td>
                        <td className="border border-black px-2 py-0.5 text-center" colSpan={2}>รายละเอียด</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">1. ชื่อผู้ขอรับทุน</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>{application.applicantName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;หน่วยงานที่สังกัด</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>{application.department} คณะแพทยศาสตร์</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">2. ประเภททุนสนับสนุน</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>
                          {isReward && <span className="mr-4">☑ รางวัลตีพิมพ์</span>}
                          {isPage && <span>☑ ค่าตีพิมพ์</span>}
                          {!isReward && !isPage && <span>-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">3. ชื่อบทความ</td>
                        <td className="border border-black px-2 py-0.5 italic" colSpan={2}>{application.articleTitle}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;ประเภทบทความ</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>
                          {isResearch && <div>☑ 1) บทความวิชาการ (Research Article, Review Article, หรือ Guidelines)</div>}
                          {isOther && <div>☑ 2) บทความวิชาการอื่น ๆ (เช่น Case report, Case series, Clinical picture, Clinical note, Technical note)</div>}
                          {!isResearch && !isOther && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">4. การมีส่วนร่วม</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>
                          {isFirst && <div>☑ 1) ผู้เขียนชื่อแรก (First Author)</div>}
                          {isCorr && <div>☑ 1) ผู้เขียนชื่อหลัก (Corresponding Author)</div>}
                          {isCo && <div>☑ 2) ผู้ร่วมเขียน (Co-author)</div>}
                          {!isFirst && !isCorr && !isCo && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">5. ชื่อวารสาร</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>{application.journalName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-bold">6. ประเภทฐานข้อมูล</td>
                        <td className="border border-black px-2 py-0.5" colSpan={2}>
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
                        <td className="border border-black px-2 py-0.5" colSpan={3}>
                          7. บทความที่ขอรับรางวัลตีพิมพ์เผยแพร่แล้ว ไม่เกิน 24 เดือน และไม่เป็นส่วนหนึ่งในการขอจบการศึกษาเพื่อปริญญา
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Header ตาราง 2 */}
                  <div className="font-bold text-[13pt] mb-0.5 pl-1">
                    เอกสารประกอบการรับทุนสนับสนุนค่าตีพิมพ์/เบิกเงินรางวัลตีพิมพ์
                  </div>

                  {/* ตาราง 2: รายการ 13 ข้อ + ลายเซ็นขวามือ ชิดด้านล่าง */}
                  <table className="w-full border-collapse border border-black text-[12pt] mb-1">
                    <thead>
                      <tr className="font-bold bg-slate-50/50">
                        <th className="border border-black px-1.5 py-0.5 text-center" colSpan={2}>รายการ</th>
                        <th className="border border-black px-1 py-0.5 text-center leading-tight text-[11pt]" colSpan={2}>
                          / = มี&nbsp;&nbsp;&nbsp;&nbsp;X = ไม่มี
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* แถวที่ 1 (เงินรางวัล ข้อ 1) */}
                      <tr>
                        <td className="border border-black px-1 py-0.5 text-center font-bold align-middle w-[10%]" rowSpan={9}>
                          เงินรางวัล
                        </td>
                        <td className="border border-black px-2 py-0.5 w-[56%]">1. บันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์ รางวัลตีพิมพ์</td>
                        <td className="border border-black px-1 py-0.5 text-center font-bold w-[12%]">
                          {isReward ? '/' : 'X'}
                        </td>
                        <td className="border-0 px-2 py-1 text-center align-bottom w-[24%]" rowSpan={13}>
                          <div className="text-[11pt] leading-relaxed pb-1">
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
                          <td className="border border-black px-2 py-0.5">{item}</td>
                          <td className="border border-black px-1 py-0.5 text-center font-bold">
                            {isReward ? '/' : 'X'}
                          </td>
                        </tr>
                      ))}

                      {/* ข้อ 10-13: ค่าตีพิมพ์ */}
                      {[
                        '10. เอกสารแสดงการตอบรับตีพิมพ์จากวารสาร',
                        '11. ใบเรียกเก็บเงินค่าตีพิมพ์จากวารสารที่ระบุข้อมูลเชื่อมโยงกับหลักฐานในข้อ 10.',
                        '12. หลักฐานการจ่ายเงินหรือใบเสร็จรับเงินสกุลเงินบาท',
                        '13. ใบรับรองการจ่ายเงินค่า page charge',
                      ].map((item, idx) => (
                        <tr key={idx + 10}>
                          {idx === 0 && (
                            <td className="border border-black px-1 py-0.5 text-center font-bold align-middle w-[10%]" rowSpan={4}>
                              ค่าตีพิมพ์
                            </td>
                          )}
                          <td className="border border-black px-2 py-0.5">{item}</td>
                          <td className="border border-black px-1 py-0.5 text-center font-bold">
                            {isPage ? '/' : 'X'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ท้ายหน้า: ข้อความรับรอง (10 เคาะ เต็มบรรทัดไม่ถ่าง) + ลายเซ็นผู้ประสานงาน จัดกึ่งกลางชิดขวา */}
                  <div className="text-[12pt] leading-normal space-y-1">
                    <div className="text-justify [text-align-last:left] break-words">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ตรวจสอบความถูกต้องครบถ้วนของเอกสารตามเกณฑ์การรับทุนสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร และปรับปรุงข้อมูลในฐานข้อมูลเรียบร้อยแล้ว
                    </div>
                    <div className="flex justify-end pr-2 pt-0.5">
                      <div className="text-center text-[11pt] leading-relaxed">
                        <div>.............................................................. ผู้ประสานงาน</div>
                        <div>(..........…….…………………………………………)</div>
                        <div>วันที่ ....................................................</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ข้อความหมายเหตุ 3 บรรทัด ใส่ในท้ายกระดาษ ชิดซ้าย */}
                <div className="checklist-remarks text-[9.5pt] text-slate-700 leading-tight pt-1 border-t border-slate-300 space-y-0.5 text-left mt-auto">
                    <div>* ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ (ประกาศ ณ วันที่ 27 พฤษภาคม 2567)</div>
                    <div>** ปรับปรุงล่าสุด Version3.10 / 10 ก.ย. 69</div>
                    <div>*** สำหรับตรวจเช็คความครบถ้วนของเอกสารและความถูกต้องของข้อมูลเท่านั้น</div>
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
                <div className="memo-print-page text-[15pt] leading-[1.2] text-black tracking-normal flex flex-col justify-between min-h-[257mm]">
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

                    {/* Header Meta Fields with Dotted Underlines (space before = 0/ after = 0, ระยะบรรทัดปกติ) */}
                    <div className="space-y-0 my-0">
                      {/* ส่วนราชการ */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ส่วนราชการ</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] overflow-hidden text-ellipsis whitespace-nowrap text-[16pt]">
                          คณะแพทยศาสตร์ {application.department || ''} โทร. {application.phone || 'ภายในคณะ'}
                        </div>
                      </div>

                      {/* ที่ และ วันที่ (ขยับวันที่ให้ตรงกับคำว่า 'ข้อ' ของแถวบันทึกข้อความ) */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <div className="flex items-baseline pr-3 box-border" style={{ width: 'calc(50% - 8.92pt)' }}>
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                            {previewDocNo}
                          </div>
                        </div>
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">วันที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                            {previewDate}
                          </div>
                        </div>
                      </div>

                      {/* เรื่อง */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">เรื่อง</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                          {subject}
                        </div>
                      </div>
                    </div>

                    {/* Salutation (space before = 6 / after = 6) */}
                    <div className="font-normal" style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                      เรียน&nbsp;&nbsp;&nbsp;คณบดีคณะแพทยศาสตร์
                    </div>

                    {/* Body Paragraph 1 (เคาะ 10, space before = 0/ after = 0) */}
                    <p className="text-left break-words my-0 py-0" style={{ marginTop: 0, marginBottom: 0 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ข้าพเจ้า {application.applicantName} ตำแหน่ง {application.academicPosition || 'อาจารย์แพทย์'} สังกัด {application.department || ''} คณะแพทยศาสตร์ มีความประสงค์{subject} ตามประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 ซึ่งมีรายละเอียดดังนี้
                    </p>

                    {/* Article Details (เคาะ 10, space before = 0/ after = 0) */}
                    <div className="space-y-0 my-0 py-0" style={{ marginTop: 0, marginBottom: 0 }}>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">ชื่อบทความที่ได้รับการตีพิมพ์ : </span>
                        <span className="italic">{application.articleTitle}</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">ชื่อวารสาร : </span>
                        <span>{formatJournalDatabaseQuartile(appWithDocDetails)}</span>
                      </div>
                      <div>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="font-bold">วัน/เดือน/ปีที่พิมพ์ : </span>
                        <span>{formatPublicationVolumeIssue(appWithDocDetails)}</span>
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

                    {/* Financial amounts (space before = 0/ after = 0) */}
                    <div className="my-0 py-0" style={{ marginTop: 0, marginBottom: 0 }}>
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

                    {/* Closing (เคาะ 10, space before = 6/ after = 6) */}
                    <div style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </div>

                    {/* Applicant Signature Block (จัดชิดกั้นหลัง กึ่งกลางบล็อก, space before = 6/ after = 6) */}
                    <div className="grid grid-cols-2 avoid-break" style={{ marginTop: '4pt', marginBottom: '2pt' }}>
                      <div></div>
                      <div className="text-center leading-tight">
                        <div>ลงชื่อ.............................................................</div>
                        <div>({application.applicantName})</div>
                        <div>{getApplicantSignRoleTitle(appWithDocDetails)}</div>
                      </div>
                    </div>

                    {/* Approvers Section (ด้านล่างซ้าย จัดกึ่งกลางในบล็อก, 14.5 pt) */}
                    <div className="avoid-break grid grid-cols-12 text-[14.5pt]">
                      <div className="col-span-8">
                        <div className="leading-tight" style={{ marginTop: '4pt', marginBottom: '2pt' }}>
                          <div className="font-bold">เรียน  คณบดีคณะแพทยศาสตร์</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ขอเบิกจ่ายจาก งบประมาณรายได้ปี ........................</div>
                          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ</div>
                        </div>

                        <div className="text-center leading-tight" style={{ marginTop: '4pt' }}>
                          <div>ลงชื่อ....................................................</div>
                          <div>(นางสาวปรารถนา เอนกปัญญากุล)</div>
                          <div>รักษาการในตำแหน่งหัวหน้างานวิจัย</div>
                          <div>วันที่......../........./...........</div>
                        </div>

                        <div className="text-center leading-tight" style={{ marginTop: '6pt' }}>
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
                  <div className="version-footer mt-auto pt-1 text-right text-[9pt] text-slate-500 print:mt-2">
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
                <div className="memo-print-page text-[15.5pt] text-black tracking-normal flex flex-col justify-between min-h-[257mm]">
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

                    {/* Header Meta Fields with Dotted Underlines (space before = 0/ after = 0, ระยะบรรทัดปกติ) */}
                    <div className="space-y-0 my-0">
                      {/* ส่วนราชการ */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ส่วนราชการ</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] overflow-hidden text-ellipsis whitespace-nowrap text-[16pt]">
                          คณะแพทยศาสตร์ {application.department || ''} โทร. {application.phone || 'ภายในคณะ'}
                        </div>
                      </div>

                      {/* ที่ และ วันที่ (ขยับวันที่ให้ตรงกับคำว่า 'ข้อ' ของแถวบันทึกข้อความ) */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <div className="flex items-baseline pr-3 box-border" style={{ width: 'calc(50% - 8.92pt)' }}>
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">ที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                            {previewDocNo}
                          </div>
                        </div>
                        <div className="flex items-baseline flex-1">
                          <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">วันที่</span>
                          <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                            {previewDate}
                          </div>
                        </div>
                      </div>

                      {/* เรื่อง */}
                      <div className="flex items-baseline w-full my-0 py-0">
                        <span className="font-bold text-[20pt] shrink-0 mr-2 leading-none">เรื่อง</span>
                        <div className="flex-1 border-b border-dotted border-black pb-0 leading-[1.0] text-[16pt]">
                          {subject}
                        </div>
                      </div>
                    </div>

                    {/* Salutation (space before = 6 / after = 6) */}
                    <div className="font-normal" style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                      เรียน&nbsp;&nbsp;&nbsp;คณบดีคณะแพทยศาสตร์
                    </div>

                    {/* Reference text (อ้างถึงหนังสือคณะแพทยศาสตร์... เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 1.25 เพื่อไม่ให้อึดอัด) */}
                    <p className="text-left break-words my-0 py-0 leading-[1.25]" style={{ marginTop: 0, marginBottom: 0 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;อ้างถึงหนังสือคณะแพทยศาสตร์ ที่ {previewDocNo} ลงวันที่ {previewDate} เรื่อง {memoApprovalSubject} บทความวิจัยเรื่อง “{application.articleTitle}” นั้น
                    </p>

                    {/* Request details (เคาะ 10, space before = 0/ after = 0, ระยะบรรทัด 1.25 เพื่อไม่ให้อึดอัด) */}
                    <p className="text-left break-words my-0 py-0 leading-[1.25]" style={{ marginTop: 0, marginBottom: 0 }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ในการนี้ ข้าพเจ้าจึงขออนุมัติเบิกเงิน{isPage ? `ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageChargeAmount)} (${bahtText(pageChargeAmount)}) ` : ''}{isReward && isPage ? 'และ' : ''}{isReward ? `รางวัลตีพิมพ์ตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmount)} (${bahtText(rewardAmount)})` : ''} รวมเป็นเงินทั้งสิ้น {formatCurrencyBaht(totalAmount)} ({bahtText(totalAmount)}) รายละเอียดตามเอกสารแนบท้าย
                    </p>

                    {/* Closing (เคาะ 10, space before = 6/ after = 6) */}
                    <div style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </div>

                    {/* Applicant Signature Block (จัดชิดกั้นหลัง กึ่งกลางบล็อก, space before = 6/ after = 6) */}
                    {/* หมายเหตุ: ตัดข้อความส่วนของหัวหน้างานวิจัยและรองคณบดีออก 100% ตามที่ผู้ใช้ร้องขอ */}
                    <div className="grid grid-cols-2 avoid-break" style={{ marginTop: '6pt', marginBottom: '6pt' }}>
                      <div></div>
                      <div className="text-center leading-snug space-y-1">
                        <div>ลงชื่อ.............................................................</div>
                        <div>({application.applicantName})</div>
                        <div>{getApplicantSignRoleTitle(appWithDocDetails)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Version Footer (ท้ายกระดาษชิดกั้นหลัง) */}
                  <div className="version-footer mt-auto pt-1 text-right text-[9pt] text-slate-500">
                    Version 4.0.0.25Sep2026
                  </div>
                </div>
              );
            })()}


            {/* ========================================================= */}
            {/* 4. ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร (ตามแบบฟอร์ม 4 & media_1790149942514.png) */}
            {/* ========================================================= */}
            {activeDoc === 'receipt' && (
              <div className="space-y-3 leading-relaxed text-[15pt]">
                <div className="text-center space-y-0.5">
                  <div className="font-bold text-2xl">ใบสำคัญรับเงิน</div>
                  <div className="font-bold text-lg text-right">มหาวิทยาลัยนเรศวร</div>
                  <div className="text-right text-[15pt]">
                    วันที่............เดือน................................พ.ศ. .........
                  </div>
                </div>

                <div className="text-left break-words leading-relaxed pt-1">
                  ข้าพเจ้า <span className="font-bold">{application.applicantName}</span> ที่อยู่คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                  <br />
                  ตำบล ท่าโพธิ์&nbsp;&nbsp;อำเภอ เมือง&nbsp;&nbsp;จังหวัด พิษณุโลก
                  <br />
                  ได้รับเงินจากมหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้
                </div>

                <table className="w-full border border-black border-collapse text-[14pt] mt-2">
                  <thead>
                    <tr className="bg-slate-50/50 font-bold">
                      <th className="border border-black p-1 text-center w-12">ที่</th>
                      <th className="border border-black p-1 text-center">รายการ</th>
                      <th className="border border-black p-1 text-center w-20">จำนวน</th>
                      <th className="border border-black p-1 text-center w-28">หน่วยละ</th>
                      <th className="border border-black p-1 text-center w-28">จำนวนเงิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageChargeAmount > 0 && (
                      <tr>
                        <td className="border-l border-r border-black px-2 py-1.5 text-center align-top">1</td>
                        <td className="border-r border-black px-4 py-1.5 align-top">
                          <div>เงินสนับสนุนค่าตีพิมพ์บทความ</div>
                          <div>เรื่อง {application.articleTitle}</div>
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center align-top">1</td>
                        <td className="border-r border-black px-3 py-1.5 text-right align-top">{formatAmountDisplay(pageChargeAmount)}</td>
                        <td className="border-r border-black px-3 py-1.5 text-right align-top">{formatAmountDisplay(pageChargeAmount)}</td>
                      </tr>
                    )}
                    {rewardAmount > 0 && (
                      <tr>
                        <td className="border-l border-r border-black px-2 py-1.5 text-center align-top">{pageChargeAmount > 0 ? 2 : 1}</td>
                        <td className="border-r border-black px-4 py-1.5 align-top">
                          <div>เงินรางวัลตีพิมพ์บทความ</div>
                          <div>เรื่อง {application.articleTitle}</div>
                        </td>
                        <td className="border-r border-black px-2 py-1.5 text-center align-top">1</td>
                        <td className="border-r border-black px-3 py-1.5 text-right align-top">{formatAmountDisplay(rewardAmount)}</td>
                        <td className="border-r border-black px-3 py-1.5 text-right align-top">{formatAmountDisplay(rewardAmount)}</td>
                      </tr>
                    )}
                    {/* แถวว่าง: 5 แถวเมื่อมี 1 รายการ, 1 แถวเมื่อมี 2 รายการ (ไม่ให้เกิน 1 หน้า A4) */}
                    {[...Array((pageChargeAmount > 0 ? 1 : 0) + (rewardAmount > 0 ? 1 : 0) >= 2 ? 1 : 5)].map((_, idx) => (
                      <tr key={`empty-row-${idx}`} className="h-6">
                        <td className="border-l border-r border-black px-2 py-1">&nbsp;</td>
                        <td className="border-r border-black px-4 py-1">&nbsp;</td>
                        <td className="border-r border-black px-2 py-1">&nbsp;</td>
                        <td className="border-r border-black px-3 py-1">&nbsp;</td>
                        <td className="border-r border-black px-3 py-1">&nbsp;</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-50/50 font-bold">
                      <td colSpan={4} className="border-t border-b border-l border-r border-black px-3 py-1 text-center">รวม</td>
                      <td className="border-t border-b border-r border-black px-3 py-1 text-right">{formatAmountDisplay(totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="font-normal text-left pt-1 text-[15pt]">
                  จำนวนเงิน&nbsp;&nbsp;<span className="font-bold">{bahtText(totalAmount)}</span>
                </div>

                {/* ส่วนลงนาม 2 ฝ่าย จัดกึ่งกลางชิดขวา */}
                <div className="flex justify-end pt-6 avoid-break">
                  <div className="w-80 text-center space-y-6 text-[14pt]">
                    <div>
                      <div>ลงชื่อ..........................................................ผู้รับเงิน</div>
                      <div className="mt-1">({application.applicantName})</div>
                    </div>
                    <div>
                      <div>ลงชื่อ..........................................................ผู้จ่ายเงิน</div>
                      <div className="mt-1">(........................................................)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน ข้อ 46 & media_1790149973030.png) */}
            {/* ========================================================= */}
            {activeDoc === 'certification' && (() => {
              const certAmt = application.claimedPageChargeAmount || application.approvedPageChargeAmount || pageChargeAmount || 0;
              const isOver70k = certAmt > 70000;
              const part1 = Math.min(certAmt, 30000);
              const part2 = Math.min(Math.max(0, certAmt - 30000), 40000);
              const bahtPart = Math.floor(certAmt).toLocaleString('th-TH');
              const satangNum = Math.round((certAmt % 1) * 100);
              const satangPart = satangNum === 0 ? '-' : satangNum.toString().padStart(2, '0');
              const paidDateShort = formatThaiDateShort(application.pageChargePaidDate || application.publishedDate || application.createdAt) || '29 ต.ค. 68';

              return (
                <div className="space-y-3 leading-relaxed text-[15pt]">
                  <div className="text-center space-y-0.5">
                    <div className="font-bold text-2xl">ใบรับรองการจ่ายเงิน</div>
                    <div className="font-bold text-lg">ส่วนราชการ มหาวิทยาลัยนเรศวร</div>
                  </div>

                  <table className="w-full border border-black border-collapse text-[13.5pt] mt-2">
                    <thead>
                      <tr className="bg-slate-50/50 font-bold">
                        <th className="border border-black p-1 text-center w-[18%]">วัน เดือน ปี</th>
                        <th className="border border-black p-1 text-center w-[52%]">รายละเอียดการจ่าย</th>
                        <th className="border border-black p-1 text-center w-[20%]" colSpan={2}>จำนวนเงิน</th>
                        <th className="border border-black p-1 text-center w-[10%]">หมายเหตุ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black p-2 text-center align-top font-sarabun">
                          {paidDateShort}
                        </td>
                        <td className="border border-black p-2 align-top text-left break-words">
                          <div className="pl-1 font-medium">ค่าตีพิมพ์ {application.articleTitle}</div>
                          
                          {/* รายละเอียดการแบ่งจ่ายตามเงื่อนไข เกิน 70,000 หรือ ไม่เกิน 70,000 */}
                          <div className="mt-3 space-y-1 text-[12.5pt]">
                            {isOver70k ? (
                              <>
                                <div className="pl-1 font-semibold text-slate-900 text-justify">
                                  ขอเบิกจ่ายเพียง 70,000.00 (เจ็ดหมื่นบาทถ้วน)
                                </div>
                                <div className="pl-1 leading-snug text-justify">
                                  - ฉบับจริงใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ จำนวนเงิน 30,000.00 (สามหมื่นบาทถ้วน)
                                </div>
                                <div className="pl-1 leading-snug text-justify">
                                  - ฉบับสำเนาใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ จำนวนเงิน 40,000.00 (สี่หมื่นบาทถ้วน)
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="pl-1 leading-snug text-justify">
                                  - ฉบับจริงใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ จำนวนเงิน {formatAmountDisplay(part1)} ({bahtText(part1)})
                                </div>
                                {part2 > 0 && (
                                  <div className="pl-1 leading-snug text-justify">
                                    - ฉบับสำเนาใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ จำนวนเงิน {formatAmountDisplay(part2)} ({bahtText(part2)})
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                        <td className="border border-black pr-1 pl-1 text-right align-top w-[14%]">
                          {bahtPart}
                        </td>
                        <td className="border border-black pr-1 pl-1 text-left align-top w-[6%]">
                          {satangPart}
                        </td>
                        <td className="border border-black p-2 text-center align-top">
                          {/* หมายเหตุ: ไม่ต้องระบุ จ่ายจริง (เว้นว่างไว้) */}
                        </td>
                      </tr>
                      <tr className="bg-slate-50/50 font-bold">
                        <td colSpan={2} className="border border-black p-1 text-center">
                          รวมทั้งสิ้น
                        </td>
                        <td className="border border-black pr-1 pl-1 text-right">
                          {bahtPart}
                        </td>
                        <td className="border border-black pr-1 pl-1 text-left">
                          {satangPart}
                        </td>
                        <td className="border border-black p-1"></td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="font-normal text-left pt-1 text-[15pt]">
                    รวมทั้งสิ้น (ตัวอักษร)&nbsp;&nbsp;&nbsp;<span className="font-bold underline">{bahtText(certAmt)}</span>
                  </div>

                  {/* ข้อความรับรองตามระเบียบกระทรวงการคลัง (text-justify เต็มบรรทัด ไม่ถ่างตัวอักษร) */}
                  <div className="pt-3 text-justify break-words leading-relaxed text-[15pt]">
                    ข้าพเจ้า <span className="font-bold underline">{application.applicantName}</span>&nbsp;&nbsp;ตำแหน่ง&nbsp;&nbsp;<span className="underline">{application.academicPosition || 'อาจารย์แพทย์'}</span>
                    <br />
                    สังกัด <span className="underline">{application.department} คณะแพทยศาสตร์</span> ขอรับรองว่า รายจ่ายข้างต้นนี้ ข้าพเจ้าได้จ่ายเงินไปโดยได้รับใบเสร็จรับเงินซึ่งมีรายการไม่ครบถ้วนตามหลักฐานการจ่ายเงินในข้อ 46 หรือซึ่งตามลักษณะไม่อาจเรียกใบเสร็จรับเงินจากผู้รับเงินได้ ซึ่งเป็นไปตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลัง การรับเงิน การจ่ายเงิน การเก็บรักษาเงิน และการนำเงินส่งคลัง พ.ศ. 2562
                  </div>

                  {/* ส่วนลงนาม จัดกึ่งกลางชิดขวา */}
                  <div className="flex justify-end pt-6 avoid-break">
                    <div className="w-80 text-center space-y-2 text-[14pt]">
                      <div>(ลงชื่อ).......................................................................</div>
                      <div>({application.applicantName})</div>
                      <div>วันที่ ...................................................................</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
