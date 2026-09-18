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
  generateAllDocsDocx
} from '../services/docxExportService';

interface OfficialPrintModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

// 5 Official Documents in Requested Sequence:
// 1. checklist: à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£ (AWP Checklist)
// 2. memo_reward: à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥
// 3. memo_disbursement: à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥
// 4. receipt: à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£
// 5. certification: à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¸£à¸­à¸‡à¸ˆà¹ˆà¸²à¸¢ (à¹ƒà¸šà¸£à¸±à¸šà¸£à¸­à¸‡à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™ à¸‚à¹‰à¸­ 46)
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
    let docName = 'à¹€à¸­à¸à¸ªà¸²à¸£à¸£à¸²à¸Šà¸à¸²à¸£';
    if (activeDoc === 'checklist') docName = `1_à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£_${trackingPrefix}`;
    else if (activeDoc === 'memo_reward') docName = '2_à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡_à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥';
    else if (activeDoc === 'memo_disbursement') docName = '3_à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡_à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥';
    else if (activeDoc === 'receipt') docName = '4_à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™_à¸¡à¸™';
    else if (activeDoc === 'certification') docName = '5_à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¸£à¸­à¸‡à¸ˆà¹ˆà¸²à¸¢_à¸‚à¹‰à¸­46';
    
    const printElement = document.getElementById('printable-document');
    if (!printElement) {
      window.print();
      return;
    }

    // à¸ªà¸£à¹‰à¸²à¸‡ iframe à¸Šà¸±à¹ˆà¸§à¸„à¸£à¸²à¸§à¹€à¸žà¸·à¹ˆà¸­à¸žà¸´à¸¡à¸žà¹Œà¹€à¸‰à¸žà¸²à¸°à¹€à¸™à¸·à¹‰à¸­à¸«à¸²à¹€à¸­à¸à¸ªà¸²à¸£à¹€à¸”à¸µà¹ˆà¸¢à¸§ à¸›à¹‰à¸­à¸‡à¸à¸±à¸™à¸›à¸±à¸à¸«à¸²à¸«à¸™à¹‰à¸²à¹€à¸à¸´à¸™ 3 à¸«à¸™à¹‰à¸²
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

    // à¸£à¸§à¸šà¸£à¸§à¸¡à¹à¸—à¹‡à¸à¸ªà¹„à¸•à¸¥à¹Œà¹à¸¥à¸°à¸Ÿà¸­à¸™à¸•à¹Œà¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸ˆà¸²à¸à¸«à¸™à¹‰à¸²à¸«à¸¥à¸±à¸
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
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 20mm;
            }
            html, body {
              background: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              font-family: 'Sarabun', 'Prompt', serif, sans-serif !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .avoid-break, tr, td, th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            p, .text-justify-doc {
              text-align: justify !important;
              text-justify: inter-cluster !important;
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

    // à¸£à¸­à¹ƒà¸«à¹‰à¸£à¸¹à¸›à¹à¸¥à¸°à¸ªà¹„à¸•à¸¥à¹Œà¹‚à¸«à¸¥à¸”à¸„à¸£à¸šà¸à¹ˆà¸­à¸™à¸ªà¸±à¹ˆà¸‡à¸žà¸´à¸¡à¸žà¹Œ
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
      alert('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸ªà¸£à¹‰à¸²à¸‡à¹„à¸Ÿà¸¥à¹Œ DOCX');
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
      alert('à¹€à¸à¸´à¸”à¸‚à¹‰à¸­à¸œà¸´à¸”à¸žà¸¥à¸²à¸”à¹ƒà¸™à¸à¸²à¸£à¸ªà¸£à¹‰à¸²à¸‡à¹„à¸Ÿà¸¥à¹Œ DOCX à¸—à¸±à¹‰à¸‡ 5 à¸Šà¸¸à¸”');
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
              <span>à¸£à¸°à¸šà¸šà¸ˆà¸±à¸”à¸žà¸´à¸¡à¸žà¹Œà¹à¸¥à¸°à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”à¹€à¸­à¸à¸ªà¸²à¸£ Word (DOCX) â€¢ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸¡.à¸™à¹€à¸£à¸¨à¸§à¸£</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-prompt flex items-center gap-2">
              <span>à¸ˆà¸±à¸”à¸Šà¸¸à¸”à¹€à¸­à¸à¸ªà¸²à¸£ 5 à¸£à¸²à¸¢à¸à¸²à¸£à¸•à¸²à¸¡à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¹Œ</span>
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
              title="à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¹€à¸­à¸à¸ªà¸²à¸£à¸™à¸µà¹‰à¹€à¸›à¹‡à¸™à¹„à¸Ÿà¸¥à¹Œ Word (.docx) à¹€à¸žà¸·à¹ˆà¸­à¸™à¸³à¹„à¸›à¹à¸à¹‰à¹„à¸‚à¸«à¸£à¸·à¸­à¸›à¸£à¸±à¸šà¹à¸•à¹ˆà¸‡à¸«à¸™à¹‰à¸²à¹„à¸”à¹‰à¸­à¸´à¸ªà¸£à¸°"
            >
              {isExportingDocx ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileType className="w-4 h-4 text-blue-200" />
              )}
              <span>à¹‚à¸«à¸¥à¸” Word (.docx) à¸«à¸™à¹‰à¸²à¸™à¸µà¹‰</span>
            </button>

            {/* Download ALL 5 DOCX */}
            <button
              onClick={handleDownloadAllDocx}
              disabled={isExportingDocx}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              title="à¸”à¸²à¸§à¸™à¹Œà¹‚à¸«à¸¥à¸”à¸„à¸£à¸šà¸—à¸±à¹‰à¸‡ 5 à¹„à¸Ÿà¸¥à¹Œà¹€à¸›à¹‡à¸™ .docx à¸žà¸£à¹‰à¸­à¸¡à¸à¸±à¸™"
            >
              <span>à¹‚à¸«à¸¥à¸”à¸„à¸£à¸š 5 à¸Ÿà¸­à¸£à¹Œà¸¡ (.docx)</span>
            </button>

            {/* Print / PDF Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="à¸ªà¸±à¹ˆà¸‡à¸žà¸´à¸¡à¸žà¹Œà¸­à¸­à¸à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡à¸žà¸´à¸¡à¸žà¹Œ à¸«à¸£à¸·à¸­à¹€à¸¥à¸·à¸­à¸ 'Save as PDF'"
            >
              <Download className="w-4 h-4" />
              <span>à¸žà¸´à¸¡à¸žà¹Œ / PDF</span>
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
            <span>1. Checklist à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£ ({trackingPrefix})</span>
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
            <span>2. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥</span>
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
            <span>3. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥</span>
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
            <span>4. à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™</span>
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
            <span>5. à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¸£à¸­à¸‡à¸ˆà¹ˆà¸²à¸¢</span>
          </button>
        </div>

        {/* Guidance Tip Bar (No Print) */}
        <div className="bg-amber-50/80 px-6 py-2 border-b border-amber-200/60 text-[11px] text-amber-900 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ðŸ’¡ <strong>à¸„à¸³à¹à¸™à¸°à¸™à¸³à¸à¸²à¸£à¸žà¸´à¸¡à¸žà¹Œ:</strong> à¸•à¸±à¹‰à¸‡à¸„à¹ˆà¸² Margin à¹€à¸›à¹‡à¸™ <strong>Default</strong> à¹à¸¥à¸°à¸•à¸´à¹Šà¸à¹€à¸¥à¸·à¸­à¸ <strong>Background graphics</strong> à¹€à¸žà¸·à¹ˆà¸­à¹ƒà¸«à¹‰à¸•à¸²à¸£à¸²à¸‡à¹à¸¥à¸°à¸•à¸£à¸²à¸„à¸£à¸¸à¸‘à¸„à¸¡à¸Šà¸±à¸”à¸ªà¸§à¸¢à¸‡à¸²à¸¡à¸•à¸£à¸‡à¸•à¸²à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸‡à¸²à¸™à¸ªà¸²à¸£à¸šà¸£à¸£à¸“
            </span>
          </div>
          <span className="font-mono text-slate-500 text-[10px]">A4 Portrait â€¢ TH Sarabun PSK 16pt</span>
        </div>

        {/* Printable Paper Area */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-50 print:p-0 print:m-0 print:bg-white print:overflow-visible flex-1" id="printable-document">
          <div className="bg-white shadow-md print:shadow-none p-8 sm:p-12 max-w-[210mm] mx-auto min-h-[297mm] print:min-h-0 print:h-auto print:max-w-none print:w-full text-black font-sarabun text-[15pt] leading-normal border border-slate-200 print:border-none print:p-0">
            
            {/* ========================================================= */}
            {/* 1. CHECKLIST (à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£ AWP)                       */}
            {/* à¸•à¸£à¸‡à¸•à¸²à¸¡à¹à¸¡à¹ˆà¹à¸šà¸š "1.à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£2026-09-10.docx" 100%    */}
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

              const sq = application.trackingNo.split('/').pop() || '';

              return (
                <div className="text-[11pt] leading-tight">
                  {/* Header à¸•à¸²à¸£à¸²à¸‡ 3 à¸„à¸­à¸¥à¸±à¸¡à¸™à¹Œ à¸‚à¸­à¸šà¸¥à¹ˆà¸²à¸‡à¹€à¸ªà¹‰à¸™à¹€à¸”à¸µà¹ˆà¸¢à¸§ à¸•à¸£à¸‡à¸•à¸²à¸¡à¹à¸¡à¹ˆà¹à¸šà¸š */}
                  <div className="grid grid-cols-12 items-center border-b border-black pb-0.5 mb-0.5">
                    {/* Col 1: Logo */}
                    <div className="col-span-2 flex justify-center items-center">
                      <img 
                        src={TEMPLATE_LOGO_DATA_URL} 
                        alt="Logo à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¹Œ à¸¡à¸™." 
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                    {/* Col 2: Title à¸•à¸±à¸”à¹€à¸›à¹‡à¸™ 3 à¸šà¸£à¸£à¸—à¸±à¸” à¸•à¸±à¸§à¸«à¸™à¸² 13pt à¹„à¸¡à¹ˆà¸‚à¸µà¸”à¹€à¸ªà¹‰à¸™à¹ƒà¸•à¹‰ */}
                    <div className="col-span-7 flex flex-col justify-center items-center text-center font-bold px-1 text-[13pt] leading-tight">
                      <div>à¹à¸šà¸šà¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸£à¸²à¸¢à¸à¸²à¸£à¸‚à¸­à¸£à¸±à¸šà¸—à¸¸à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ</div>
                      <div>à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸£à¸°à¸”à¸±à¸šà¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´à¹à¸¥à¸°à¸£à¸°à¸”à¸±à¸šà¸Šà¸²à¸•à¸´</div>
                      <div>à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£</div>
                    </div>
                    {/* Col 3: Tracking No. à¸•à¸±à¸§à¸«à¸™à¸² à¹ƒà¸™à¸à¸¥à¹ˆà¸­à¸‡à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸žà¸­à¸”à¸µà¸à¸±à¸šà¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ */}
                    <div className="col-span-3 flex justify-center items-center">
                      <div className="border border-black px-1.5 py-0.5 font-bold text-[11pt] tracking-wide inline-block">
                        {application.trackingNo}
                      </div>
                    </div>
                  </div>

                  {/* à¸•à¸²à¸£à¸²à¸‡ 1: à¸«à¸±à¸§à¸‚à¹‰à¸­ à¹à¸¥à¸° à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸” */}
                  <table className="w-full border-collapse border border-black text-[11pt] mb-0.5">
                    <tbody>
                      <tr className="font-bold bg-slate-50/50">
                        <td className="border border-black px-1.5 py-0 text-center w-[25%]">à¸«à¸±à¸§à¸‚à¹‰à¸­</td>
                        <td className="border border-black px-1.5 py-0 text-center" colSpan={2}>à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">1. à¸Šà¸·à¹ˆà¸­à¸œà¸¹à¹‰à¸‚à¸­à¸£à¸±à¸šà¸—à¸¸à¸™</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.applicantName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;à¸«à¸™à¹ˆà¸§à¸¢à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸ªà¸±à¸‡à¸à¸±à¸”</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.department} à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">2. à¸›à¸£à¸°à¹€à¸ à¸—à¸—à¸¸à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isReward && <span className="mr-4">â˜‘ à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ</span>}
                          {isPage && <span>â˜‘ à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ</span>}
                          {!isReward && !isPage && <span>-</span>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">3. à¸Šà¸·à¹ˆà¸­à¸šà¸—à¸„à¸§à¸²à¸¡</td>
                        <td className="border border-black px-1.5 py-0 italic" colSpan={2}>{application.articleTitle}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">&nbsp;&nbsp;&nbsp;&nbsp;à¸›à¸£à¸°à¹€à¸ à¸—à¸šà¸—à¸„à¸§à¸²à¸¡</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isResearch && <div>â˜‘ 1) à¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸Šà¸²à¸à¸²à¸£ (Research Article, Review Article, à¸«à¸£à¸·à¸­ Guidelines)</div>}
                          {isOther && <div>â˜‘ 2) à¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸­à¸·à¹ˆà¸™ à¹† (à¹€à¸Šà¹ˆà¸™ Case report, Case series, Clinical picture, Clinical note, Technical note)</div>}
                          {!isResearch && !isOther && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">4. à¸à¸²à¸£à¸¡à¸µà¸ªà¹ˆà¸§à¸™à¸£à¹ˆà¸§à¸¡</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {isFirst && <div>â˜‘ 1) à¸œà¸¹à¹‰à¹€à¸‚à¸µà¸¢à¸™à¸Šà¸·à¹ˆà¸­à¹à¸£à¸ (First Author)</div>}
                          {isCorr && <div>â˜‘ 1) à¸œà¸¹à¹‰à¹€à¸‚à¸µà¸¢à¸™à¸Šà¸·à¹ˆà¸­à¸«à¸¥à¸±à¸ (Corresponding Author)</div>}
                          {isCo && <div>â˜‘ 2) à¸œà¸¹à¹‰à¸£à¹ˆà¸§à¸¡à¹€à¸‚à¸µà¸¢à¸™ (Co-author)</div>}
                          {!isFirst && !isCorr && !isCo && <div>-</div>}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">5. à¸Šà¸·à¹ˆà¸­à¸§à¸²à¸£à¸ªà¸²à¸£</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>{application.journalName}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0 font-bold">6. à¸›à¸£à¸°à¹€à¸ à¸—à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥</td>
                        <td className="border border-black px-1.5 py-0" colSpan={2}>
                          {application.journalScope === 'national' ? (
                            <div>
                              <span className="font-bold mr-2">à¸£à¸°à¸”à¸±à¸šà¸Šà¸²à¸•à¸´</span>
                              {isTCI1 && <span className="mr-2">â˜‘ TCI 1</span>}
                              {isTCI2 && <span className="mr-2">â˜‘ TCI 2</span>}
                            </div>
                          ) : (
                            <div>
                              <span className="font-bold mr-2">à¸£à¸°à¸”à¸±à¸šà¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´</span>
                              {isScopus && <span className="mr-2">â˜‘ Scopus</span>}
                              {isJCR && <span className="mr-2">â˜‘ JCR/WoS</span>}
                              {isSJR && <span className="mr-2">â˜‘ SJR</span>}
                              {isQ1Tier1 && <span className="mr-2">â˜‘ Q1 (Tier 1)</span>}
                              {isQ1 && <span className="mr-2">â˜‘ Q1</span>}
                              {isQ2 && <span className="mr-2">â˜‘ Q2</span>}
                              {isQ3 && <span className="mr-2">â˜‘ Q3</span>}
                              {isQ4 && <span className="mr-2">â˜‘ Q4</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-black px-1.5 py-0" colSpan={3}>
                          7. à¸šà¸—à¸„à¸§à¸²à¸¡à¸—à¸µà¹ˆà¸‚à¸­à¸£à¸±à¸šà¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¹€à¸œà¸¢à¹à¸žà¸£à¹ˆà¹à¸¥à¹‰à¸§ à¹„à¸¡à¹ˆà¹€à¸à¸´à¸™ 24 à¹€à¸”à¸·à¸­à¸™ à¹à¸¥à¸°à¹„à¸¡à¹ˆà¹€à¸›à¹‡à¸™à¸ªà¹ˆà¸§à¸™à¸«à¸™à¸¶à¹ˆà¸‡à¹ƒà¸™à¸à¸²à¸£à¸‚à¸­à¸ˆà¸šà¸à¸²à¸£à¸¨à¸¶à¸à¸©à¸²à¹€à¸žà¸·à¹ˆà¸­à¸›à¸£à¸´à¸à¸à¸²
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Header à¸•à¸²à¸£à¸²à¸‡ 2 */}
                  <div className="font-bold text-[11pt] mb-0.5 pl-1">
                    à¹€à¸­à¸à¸ªà¸²à¸£à¸›à¸£à¸°à¸à¸­à¸šà¸à¸²à¸£à¸£à¸±à¸šà¸—à¸¸à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ/à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ
                  </div>

                  {/* à¸•à¸²à¸£à¸²à¸‡ 2: à¸£à¸²à¸¢à¸à¸²à¸£ 13 à¸‚à¹‰à¸­ + à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸‚à¸§à¸²à¸¡à¸·à¸­ */}
                  <table className="w-full border-collapse border border-black text-[11pt] mb-0.5">
                    <thead>
                      <tr className="font-bold bg-slate-50/50">
                        <th className="border border-black px-1 py-0 text-center" colSpan={2}>à¸£à¸²à¸¢à¸à¸²à¸£</th>
                        <th className="border border-black w-[12%] px-0.5 py-0 text-center leading-tight text-[10pt]">/ = à¸¡à¸µ<br />X = à¹„à¸¡à¹ˆà¸¡à¸µ</th>
                        <th className="w-[22%] border-t-0 border-r-0 border-b-0"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* à¹à¸–à¸§à¸—à¸µà¹ˆ 1 (à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ à¸‚à¹‰à¸­ 1) */}
                      <tr>
                        <td className="border border-black px-0.5 py-0 text-center font-bold align-middle w-[10%]" rowSpan={9}>
                          à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥
                        </td>
                        <td className="border border-black px-1.5 py-0 w-[58%]">1. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸‚à¸­à¸£à¸±à¸šà¸—à¸¸à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ</td>
                        <td className="border border-black px-0.5 py-0 text-center font-bold w-[12%]">
                          {isReward ? '/' : 'X'}
                        </td>
                        <td className="border-0 px-1 py-0.5 text-center align-top w-[22%]" rowSpan={13}>
                          <div className="pt-0.5 text-[10pt] leading-relaxed">
                            <div>....................................................</div>
                            <div>({application.applicantName})</div>
                            <div className="font-bold">à¸œà¸¹à¹‰à¸‚à¸­à¸£à¸±à¸šà¸—à¸¸à¸™/à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ</div>
                            <div>à¸§à¸±à¸™à¸—à¸µà¹ˆ...................................</div>
                          </div>
                        </td>
                      </tr>

                      {/* à¸‚à¹‰à¸­ 2-9: à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ */}
                      {[
                        '2. à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡à¸›à¸£à¸°à¸à¸­à¸šà¸à¸²à¸£à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“',
                        '3. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™',
                        '4. à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™',
                        '5. à¸ªà¸³à¹€à¸™à¸²à¸šà¸±à¸•à¸£à¸›à¸£à¸°à¸Šà¸²à¸Šà¸™ (à¸£à¸±à¸šà¸£à¸­à¸‡à¸ªà¸³à¹€à¸™à¸²à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡)',
                        '6. à¸ªà¸³à¹€à¸™à¸²à¸«à¸™à¹‰à¸²à¸šà¸±à¸à¸Šà¸µà¸˜à¸™à¸²à¸„à¸²à¸£à¸ªà¸³à¸«à¸£à¸±à¸šà¹‚à¸­à¸™à¹€à¸‡à¸´à¸™',
                        '7. à¸ªà¸³à¹€à¸™à¸²à¸šà¸—à¸„à¸§à¸²à¸¡à¸—à¸µà¹ˆà¹„à¸”à¹‰à¸£à¸±à¸šà¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ (à¸£à¸±à¸šà¸£à¸­à¸‡à¸ªà¸³à¹€à¸™à¸²à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸—à¸¸à¸à¸«à¸™à¹‰à¸²)',
                        '8. à¸ªà¸³à¹€à¸™à¸²à¸«à¸¥à¸±à¸à¸à¸²à¸™à¸­à¹‰à¸²à¸‡à¸­à¸´à¸‡à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ JCR/SJR/Scopus/TCI',
                        '9. à¸ªà¸³à¹€à¸™à¸²à¸›à¸£à¸°à¸à¸²à¸¨à¸«à¸¥à¸±à¸à¹€à¸à¸“à¸‘à¹Œà¸à¸²à¸£à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸£à¸²à¸‡à¸§à¸±à¸¥à¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ',
                      ].map((item, idx) => (
                        <tr key={idx + 2}>
                          <td className="border border-black px-1.5 py-0">{item}</td>
                          <td className="border border-black px-0.5 py-0 text-center font-bold">
                            {isReward ? '/' : 'X'}
                          </td>
                        </tr>
                      ))}

                      {/* à¸‚à¹‰à¸­ 10-13: à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ */}
                      {[
                        '10. à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸ªà¸”à¸‡à¸à¸²à¸£à¸•à¸­à¸šà¸£à¸±à¸šà¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸ˆà¸²à¸à¸§à¸²à¸£à¸ªà¸²à¸£',
                        '11. à¹ƒà¸šà¹€à¸£à¸µà¸¢à¸à¹€à¸à¹‡à¸šà¹€à¸‡à¸´à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸ˆà¸²à¸à¸§à¸²à¸£à¸ªà¸²à¸£à¸—à¸µà¹ˆà¸£à¸°à¸šà¸¸à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸Šà¸·à¹ˆà¸­à¸¡à¹‚à¸¢à¸‡à¸à¸±à¸šà¸«à¸¥à¸±à¸à¸à¸²à¸™à¹ƒà¸™à¸‚à¹‰à¸­ 10.',
                        '12. à¸«à¸¥à¸±à¸à¸à¸²à¸™à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™à¸«à¸£à¸·à¸­à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¸ªà¸à¸¸à¸¥à¹€à¸‡à¸´à¸™à¸šà¸²à¸—',
                        '13. à¹ƒà¸šà¸£à¸±à¸šà¸£à¸­à¸‡à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™à¸„à¹ˆà¸² page change',
                      ].map((item, idx) => (
                        <tr key={idx + 10}>
                          {idx === 0 && (
                            <td className="border border-black px-0.5 py-0 text-center font-bold align-middle w-[10%]" rowSpan={4}>
                              à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ
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

                  {/* à¸—à¹‰à¸²à¸¢à¸«à¸™à¹‰à¸²: à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸£à¸±à¸šà¸£à¸­à¸‡ (10 à¹€à¸„à¸²à¸° à¸Šà¹ˆà¸­à¸‡à¹„à¸Ÿà¸›à¸à¸•à¸´ à¹„à¸¡à¹ˆà¹ƒà¸Šà¹‰ justify) + à¸¥à¸²à¸¢à¹€à¸‹à¹‡à¸™à¸œà¸¹à¹‰à¸›à¸£à¸°à¸ªà¸²à¸™à¸‡à¸²à¸™ */}
                  <div className="text-[11pt] leading-snug space-y-0">
                    <div>
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸„à¸£à¸šà¸–à¹‰à¸§à¸™à¸‚à¸­à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¸•à¸²à¸¡à¹€à¸à¸“à¸‘à¹Œà¸à¸²à¸£à¸£à¸±à¸šà¸—à¸¸à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸£à¸²à¸‡à¸§à¸±à¸¥à¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸£à¸°à¸”à¸±à¸šà¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´à¹à¸¥à¸°à¸£à¸°à¸”à¸±à¸šà¸Šà¸²à¸•à¸´ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ à¹à¸¥à¸°à¸›à¸£à¸±à¸šà¸›à¸£à¸¸à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹ƒà¸™à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸£à¸µà¸¢à¸šà¸£à¹‰à¸­à¸¢à¹à¸¥à¹‰à¸§
                    </div>
                    <div className="flex justify-end pr-4">
                      <div className="text-center text-[10pt] leading-relaxed">
                        <div>.............................................................. à¸œà¸¹à¹‰à¸›à¸£à¸°à¸ªà¸²à¸™à¸‡à¸²à¸™</div>
                        <div>(..........â€¦â€¦.â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦â€¦)</div>
                        <div>à¸§à¸±à¸™à¸—à¸µà¹ˆ ....................................................</div>
                      </div>
                    </div>

                    {/* à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸ 3 à¸šà¸£à¸£à¸—à¸±à¸” */}
                    <div className="text-[8pt] text-slate-700 leading-tight pt-0.5 border-t border-slate-300 space-y-0">
                      <div>* à¸›à¸£à¸°à¸à¸²à¸¨à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ à¹€à¸£à¸·à¹ˆà¸­à¸‡ à¸«à¸¥à¸±à¸à¹€à¸à¸“à¸‘à¹Œà¸à¸²à¸£à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸£à¸²à¸‡à¸§à¸±à¸¥à¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸£à¸°à¸”à¸±à¸šà¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´ à¹à¸¥à¸°à¸£à¸°à¸”à¸±à¸šà¸Šà¸²à¸•à¸´ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ (à¸›à¸£à¸°à¸à¸²à¸¨ à¸“ à¸§à¸±à¸™à¸—à¸µà¹ˆ 27 à¸žà¸¤à¸©à¸ à¸²à¸„à¸¡ 2567)</div>
                      <div>** à¸›à¸£à¸±à¸šà¸›à¸£à¸¸à¸‡à¸¥à¹ˆà¸²à¸ªà¸¸à¸” Version3.10 / 10 à¸.à¸¢. 69</div>
                      <div>*** à¸ªà¸³à¸«à¸£à¸±à¸šà¸•à¸£à¸§à¸ˆà¹€à¸Šà¹‡à¸„à¸„à¸§à¸²à¸¡à¸„à¸£à¸šà¸–à¹‰à¸§à¸™à¸‚à¸­à¸‡à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸¥à¸°à¸„à¸§à¸²à¸¡à¸–à¸¹à¸à¸•à¹‰à¸­à¸‡à¸‚à¸­à¸‡à¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¹€à¸—à¹ˆà¸²à¸™à¸±à¹‰à¸™</div>
                    </div>
                  </div>
                </div>
              );
            })()}



            {/* ========================================================= */}
            {/* 2. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ (à¸•à¸²à¸¡à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡ 2)      */}
            {/* ========================================================= */}
            {activeDoc === 'memo_reward' && (
              <div className="space-y-4 text-justify leading-relaxed">
                
                {/* Garuda Header */}
                <div className="flex items-start justify-between relative mb-2">
                  <div className="w-16">
                    <img 
                      src={GARUDA_URL} 
                      alt="Garuda" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center font-bold text-2xl tracking-tight pr-14 pt-2">
                    à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡
                  </div>
                </div>

                {/* Header Meta Fields */}
                <div className="border-b-2 border-black pb-2 space-y-1 text-base">
                  <div>
                    <strong>à¸ªà¹ˆà¸§à¸™à¸£à¸²à¸Šà¸à¸²à¸£: </strong> 
                    à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸ à¸²à¸„à¸§à¸´à¸Šà¸² {application.department} à¹‚à¸—à¸£. {application.phone || 'à¸ à¸²à¸¢à¹ƒà¸™à¸„à¸“à¸°'}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <strong>à¸—à¸µà¹ˆ: </strong> {application.internalDocNo || 'à¸­à¸§ 0603.10.    /'}
                    </div>
                    <div>
                      <strong>à¸§à¸±à¸™à¸—à¸µà¹ˆ: </strong> {application.createdAt || '...................................................'}
                    </div>
                  </div>
                  <div>
                    <strong>à¹€à¸£à¸·à¹ˆà¸­à¸‡: </strong> 
                    à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£
                  </div>
                </div>

                {/* Salutation */}
                <div className="pt-2 text-base">
                  <strong>à¹€à¸£à¸µà¸¢à¸™ </strong> à¸„à¸“à¸šà¸”à¸µà¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ
                </div>

                {/* Body Paragraph 1 */}
                <p className="indent-8 text-base">
                  à¸‚à¹‰à¸²à¸žà¹€à¸ˆà¹‰à¸² {application.applicantName} à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡ {application.academicPosition || 'à¸­à¸²à¸ˆà¸²à¸£à¸¢à¹Œà¹à¸žà¸—à¸¢à¹Œ'} à¸ªà¸±à¸‡à¸à¸±à¸” {application.department} à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸¡à¸µà¸„à¸§à¸²à¸¡à¸›à¸£à¸°à¸ªà¸‡à¸„à¹Œà¸‚à¸­à¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£ à¸•à¸²à¸¡à¸›à¸£à¸°à¸à¸²à¸¨à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ à¹€à¸£à¸·à¹ˆà¸­à¸‡ à¸«à¸¥à¸±à¸à¹€à¸à¸“à¸‘à¹Œà¸à¸²à¸£à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ à¹à¸¥à¸°à¸£à¸²à¸‡à¸§à¸±à¸¥à¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸£à¸°à¸”à¸±à¸šà¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´ à¹à¸¥à¸°à¸£à¸°à¸”à¸±à¸šà¸Šà¸²à¸•à¸´ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸›à¸£à¸°à¸à¸²à¸¨ à¸“ à¸§à¸±à¸™à¸—à¸µà¹ˆ 27 à¸žà¸¤à¸©à¸ à¸²à¸„à¸¡ 2567 à¸‹à¸¶à¹ˆà¸‡à¸¡à¸µà¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸”à¸±à¸‡à¸™à¸µà¹‰
                </p>

                {/* Itemized Info */}
                <div className="pl-6 space-y-1 text-base">
                  <div>
                    <strong>à¸Šà¸·à¹ˆà¸­à¸šà¸—à¸„à¸§à¸²à¸¡à¸—à¸µà¹ˆà¹„à¸”à¹‰à¸£à¸±à¸šà¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ: </strong> {application.articleTitle}
                  </div>
                  <div>
                    <strong>à¸Šà¸·à¹ˆà¸­à¸§à¸²à¸£à¸ªà¸²à¸£: </strong> {application.journalName} à¸ˆà¸²à¸à¸à¸²à¸™à¸‚à¹‰à¸­à¸¡à¸¹à¸¥ {application.database || 'Scopus'}
                  </div>
                  <div>
                    <strong>à¸ˆà¸±à¸”à¸­à¸¢à¸¹à¹ˆà¹ƒà¸™: </strong> Quartile {application.quartile}
                  </div>
                  <div>
                    <strong>à¸§à¸±à¸™/à¹€à¸”à¸·à¸­à¸™/à¸›à¸µ à¸—à¸µà¹ˆà¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ: </strong> {application.volumeIssue || 'Vol...... No...... Month.......... Year..........'} pages ...................
                  </div>
                  {application.doi && (
                    <div>
                      <strong>DOI: </strong> {application.doi}
                    </div>
                  )}
                  <div>
                    <strong>à¸à¸²à¸£à¸¡à¸µà¸ªà¹ˆà¸§à¸™à¸£à¹ˆà¸§à¸¡à¹ƒà¸™à¸œà¸¥à¸‡à¸²à¸™: </strong> 
                    {application.authorRole === 'first_author' && 'First Author (à¸œà¸¹à¹‰à¹€à¸‚à¸µà¸¢à¸™à¸Šà¸·à¹ˆà¸­à¹à¸£à¸)'}
                    {application.authorRole === 'corresponding_author' && 'Corresponding Author (à¸œà¸¹à¹‰à¹€à¸‚à¸µà¸¢à¸™à¸Šà¸·à¹ˆà¸­à¸«à¸¥à¸±à¸)'}
                    {application.authorRole === 'co_author' && 'Co-author (à¸œà¸¹à¹‰à¸£à¹ˆà¸§à¸¡à¹€à¸‚à¸µà¸¢à¸™)'}
                  </div>
                  <div>
                    <strong>à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£: </strong> à¸£à¸°à¸”à¸±à¸š{application.journalScope === 'international' ? 'à¸™à¸²à¸™à¸²à¸Šà¸²à¸•à¸´' : 'à¸Šà¸²à¸•à¸´'} &nbsp;&nbsp; 
                    <strong>à¸šà¸—à¸„à¸§à¸²à¸¡à¸›à¸£à¸°à¹€à¸ à¸—: </strong> {application.articleType === 'research_article' ? 'à¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸ˆà¸±à¸¢ (Research Article/Review)' : 'à¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸Šà¸²à¸à¸²à¸£à¸­à¸·à¹ˆà¸™à¹†'}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="pl-6 pt-2 space-y-1.5 text-base">
                  <div><strong>à¹‚à¸”à¸¢à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´: </strong></div>
                  <div className="pl-4">
                    - à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸²à¸¡à¹€à¸à¸“à¸‘à¹Œà¸‚à¹‰à¸­ 8 à¹€à¸›à¹‡à¸™à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ {formatBaht(rewardAmount)} ({bahtText(rewardAmount)})
                  </div>
                  {pageChargeAmount > 0 && (
                    <div className="pl-4">
                      - à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸•à¸²à¸¡à¹€à¸à¸“à¸‘à¹Œà¸‚à¹‰à¸­ 9 à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ {formatBaht(pageChargeAmount)} ({bahtText(pageChargeAmount)})
                    </div>
                  )}
                  <div className="pl-4 font-bold text-base pt-1">
                    à¸£à¸§à¸¡à¹€à¸›à¹‡à¸™à¹€à¸‡à¸´à¸™à¸—à¸±à¹‰à¸‡à¸ªà¸´à¹‰à¸™ {formatBaht(totalAmount)} ({bahtText(totalAmount)})
                  </div>
                </div>

                <p className="indent-8 text-base pt-2">
                  à¸ˆà¸¶à¸‡à¹€à¸£à¸µà¸¢à¸™à¸¡à¸²à¹€à¸žà¸·à¹ˆà¸­à¹‚à¸›à¸£à¸”à¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´
                </p>

                {/* Sign-off Signature */}
                <div className="pt-8 text-center max-w-xs ml-auto avoid-break">
                  <div className="h-10"></div>
                  <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                  <div className="font-semibold text-base">({application.applicantName})</div>
                  <div className="text-sm text-slate-600">à¸œà¸¹à¹‰à¸‚à¸­à¸£à¸±à¸šà¸£à¸²à¸‡à¸§à¸±à¸¥</div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* 3. à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡ à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ (à¸•à¸²à¸¡à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡ 3)  */}
            {/* ========================================================= */}
            {activeDoc === 'memo_disbursement' && (
              <div className="space-y-4 text-justify leading-relaxed">
                
                {/* Garuda Header */}
                <div className="flex items-start justify-between relative mb-2">
                  <div className="w-16">
                    <img 
                      src={GARUDA_URL} 
                      alt="Garuda" 
                      className="w-14 h-14 object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center font-bold text-2xl tracking-tight pr-14 pt-2">
                    à¸šà¸±à¸™à¸—à¸¶à¸à¸‚à¹‰à¸­à¸„à¸§à¸²à¸¡
                  </div>
                </div>

                {/* Header Meta Fields */}
                <div className="border-b-2 border-black pb-2 space-y-1 text-base">
                  <div>
                    <strong>à¸ªà¹ˆà¸§à¸™à¸£à¸²à¸Šà¸à¸²à¸£: </strong> 
                    à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸ à¸²à¸„à¸§à¸´à¸Šà¸² {application.department} à¹‚à¸—à¸£. {application.phone || 'à¸ à¸²à¸¢à¹ƒà¸™à¸„à¸“à¸°'}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <strong>à¸—à¸µà¹ˆ: </strong> {application.internalDocNo || 'à¸­à¸§ 0603.10.    /'}
                    </div>
                    <div>
                      <strong>à¸§à¸±à¸™à¸—à¸µà¹ˆ: </strong> {application.createdAt || '...................................................'}
                    </div>
                  </div>
                  <div>
                    <strong>à¹€à¸£à¸·à¹ˆà¸­à¸‡: </strong> 
                    à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£
                  </div>
                </div>

                {/* Salutation */}
                <div className="pt-2 text-base">
                  <strong>à¹€à¸£à¸µà¸¢à¸™ </strong> à¸„à¸“à¸šà¸”à¸µà¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ
                </div>

                {/* Reference text (à¸­à¹‰à¸²à¸‡à¸–à¸¶à¸‡) */}
                <div className="indent-8 text-base">
                  à¸­à¹‰à¸²à¸‡à¸–à¸¶à¸‡à¸«à¸™à¸±à¸‡à¸ªà¸·à¸­à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸—à¸µà¹ˆ {application.internalDocNo || 'à¸­à¸§ 0603.10..........................'} à¸¥à¸‡à¸§à¸±à¸™à¸—à¸µà¹ˆ {application.createdAt || '.............................'}
                </div>
                <div className="indent-8 text-base">
                  à¹€à¸£à¸·à¹ˆà¸­à¸‡ à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸‡à¸´à¸™à¸šà¸—à¸„à¸§à¸²à¸¡à¹ƒà¸™à¸§à¸²à¸£à¸ªà¸²à¸£à¸§à¸´à¸Šà¸²à¸à¸²à¸£ à¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸ˆà¸±à¸¢à¹€à¸£à¸·à¹ˆà¸­à¸‡ â€œ<strong>{application.articleTitle}</strong>â€ à¸™à¸±à¹‰à¸™
                </div>

                {/* Request details */}
                <p className="indent-8 text-base pt-2">
                  à¹ƒà¸™à¸à¸²à¸£à¸™à¸µà¹‰ à¸‚à¹‰à¸²à¸žà¹€à¸ˆà¹‰à¸²à¸ˆà¸¶à¸‡à¸‚à¸­à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™{pageChargeAmount > 0 ? `à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸•à¸²à¸¡à¹€à¸à¸“à¸‘à¹Œà¸‚à¹‰à¸­ 9 à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ ${formatBaht(pageChargeAmount)} (${bahtText(pageChargeAmount)}) à¹à¸¥à¸°` : ''}à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸•à¸²à¸¡à¹€à¸à¸“à¸‘à¹Œà¸‚à¹‰à¸­ 8 à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥ {formatBaht(rewardAmount)} ({bahtText(rewardAmount)}) à¸£à¸§à¸¡à¹€à¸›à¹‡à¸™à¹€à¸‡à¸´à¸™à¸—à¸±à¹‰à¸‡à¸ªà¸´à¹‰à¸™ {formatBaht(totalAmount)} ({bahtText(totalAmount)}) à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸•à¸²à¸¡à¹€à¸­à¸à¸ªà¸²à¸£à¹à¸™à¸šà¸—à¹‰à¸²à¸¢
                </p>

                <p className="indent-8 text-base pt-2">
                  à¸ˆà¸¶à¸‡à¹€à¸£à¸µà¸¢à¸™à¸¡à¸²à¹€à¸žà¸·à¹ˆà¸­à¹‚à¸›à¸£à¸”à¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´
                </p>

                {/* Sign-offs: Applicant and Head of Department */}
                <div className="grid grid-cols-2 gap-8 pt-8 avoid-break text-center">
                  <div className="space-y-1">
                    <div className="h-10"></div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                    <div className="font-semibold text-base">({application.applicantName})</div>
                    <div className="text-sm text-slate-600">à¸œà¸¹à¹‰à¸‚à¸­à¸£à¸±à¸šà¸£à¸²à¸‡à¸§à¸±à¸¥</div>
                  </div>

                  <div className="space-y-1">
                    <div className="h-10"></div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                    <div className="font-semibold text-base">(.........................................................)</div>
                    <div className="text-sm text-slate-600">à¸«à¸±à¸§à¸«à¸™à¹‰à¸²à¸ à¸²à¸„à¸§à¸´à¸Šà¸²à¸«à¸£à¸·à¸­à¸«à¸±à¸§à¸«à¸™à¹‰à¸²à¸ªà¹ˆà¸§à¸™à¸‡à¸²à¸™</div>
                  </div>
                </div>

                {/* Approval endorsement box */}
                <div className="border border-black p-3 rounded mt-8 avoid-break text-xs grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="font-bold">à¹€à¸£à¸µà¸¢à¸™ à¸„à¸“à¸šà¸”à¸µà¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ</div>
                    <div>à¹€à¸žà¸·à¹ˆà¸­à¹‚à¸›à¸£à¸”à¸žà¸´à¸ˆà¸²à¸£à¸“à¸²à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´à¹€à¸šà¸´à¸à¸ˆà¹ˆà¸²à¸¢à¸ˆà¸²à¸à¸‡à¸šà¸›à¸£à¸°à¸¡à¸²à¸“à¸£à¸²à¸¢à¹„à¸”à¹‰ à¸à¸­à¸‡à¸—à¸¸à¸™à¸§à¸´à¸ˆà¸±à¸¢</div>
                    <div className="h-8"></div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                    <div>(à¸£à¸­à¸‡à¸„à¸“à¸šà¸”à¸µà¸à¹ˆà¸²à¸¢à¸§à¸´à¸ˆà¸±à¸¢à¹à¸¥à¸°à¸™à¸§à¸±à¸•à¸à¸£à¸£à¸¡)</div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-bold">à¸„à¸³à¸ªà¸±à¹ˆà¸‡à¸„à¸“à¸šà¸”à¸µ</div>
                    <div>[&nbsp;&nbsp;] à¸­à¸™à¸¸à¸¡à¸±à¸•à¸´ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [&nbsp;&nbsp;] à¹„à¸¡à¹ˆà¸­à¸™à¸¸à¸¡à¸±à¸•à¸´</div>
                    <div className="h-8"></div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                    <div>(à¸„à¸“à¸šà¸”à¸µà¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ)</div>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================= */}
            {/* 4. à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ (à¸•à¸²à¸¡à¹à¸šà¸šà¸Ÿà¸­à¸£à¹Œà¸¡ 4)       */}
            {/* ========================================================= */}
            {activeDoc === 'receipt' && (
              <div className="space-y-4 text-justify leading-relaxed">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xl sm:text-2xl">à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¹€à¸‡à¸´à¸™</div>
                  <div className="font-bold text-lg">à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£</div>
                  <div className="text-right text-sm pt-2">
                    à¸§à¸±à¸™à¸—à¸µà¹ˆ............à¹€à¸”à¸·à¸­à¸™................................à¸ž.à¸¨. {application.fiscalYear}
                  </div>
                </div>

                <div className="indent-8 text-base leading-relaxed pt-2">
                  à¸‚à¹‰à¸²à¸žà¹€à¸ˆà¹‰à¸² <strong>{application.applicantName}</strong> à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡ {application.academicPosition || 'à¸­à¸²à¸ˆà¸²à¸£à¸¢à¹Œ'} à¸—à¸µà¹ˆà¸­à¸¢à¸¹à¹ˆ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ à¸•à¸³à¸šà¸¥à¸—à¹ˆà¸²à¹‚à¸žà¸˜à¸´à¹Œ à¸­à¸³à¹€à¸ à¸­à¹€à¸¡à¸·à¸­à¸‡ à¸ˆà¸±à¸‡à¸«à¸§à¸±à¸”à¸žà¸´à¸©à¸“à¸¸à¹‚à¸¥à¸ à¹„à¸”à¹‰à¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¸ˆà¸²à¸à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£ à¸”à¸±à¸‡à¸£à¸²à¸¢à¸à¸²à¸£à¸•à¹ˆà¸­à¹„à¸›à¸™à¸µà¹‰
                </div>

                <table className="w-full border border-black border-collapse text-xs sm:text-sm mt-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2 text-center w-12">à¸—à¸µà¹ˆ</th>
                      <th className="border border-black p-2 text-left">à¸£à¸²à¸¢à¸à¸²à¸£</th>
                      <th className="border border-black p-2 text-center w-20">à¸ˆà¸³à¸™à¸§à¸™</th>
                      <th className="border border-black p-2 text-right w-28">à¸«à¸™à¹ˆà¸§à¸¢à¸¥à¸°</th>
                      <th className="border border-black p-2 text-right w-28">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageChargeAmount > 0 && (
                      <tr>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2">
                          à¹€à¸‡à¸´à¸™à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸„à¹ˆà¸²à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡ à¹€à¸£à¸·à¹ˆà¸­à¸‡ {application.articleTitle}
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
                          à¹€à¸‡à¸´à¸™à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡ à¹€à¸£à¸·à¹ˆà¸­à¸‡ {application.articleTitle} ({application.journalName})
                        </td>
                        <td className="border border-black p-2 text-center">1</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(rewardAmount)}</td>
                        <td className="border border-black p-2 text-right">{formatAmountDisplay(rewardAmount)}</td>
                      </tr>
                    )}
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={4} className="border border-black p-2 text-right">à¸£à¸§à¸¡à¹€à¸‡à¸´à¸™à¸—à¸±à¹‰à¸‡à¸ªà¸´à¹‰à¸™</td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="font-bold text-right pt-2 text-base">
                  à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™ (à¸•à¸±à¸§à¸­à¸±à¸à¸©à¸£): {bahtText(totalAmount)}
                </div>

                <div className="grid grid-cols-2 gap-8 pt-10 text-center avoid-break">
                  <div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................à¸œà¸¹à¹‰à¸£à¸±à¸šà¹€à¸‡à¸´à¸™</div>
                    <div className="font-semibold mt-1">({application.applicantName})</div>
                    <div className="text-xs text-slate-600">à¸œà¸¹à¹‰à¸‚à¸­à¸£à¸±à¸šà¸—à¸¸à¸™ / à¸£à¸²à¸‡à¸§à¸±à¸¥</div>
                  </div>

                  <div>
                    <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................à¸œà¸¹à¹‰à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™</div>
                    <div className="font-semibold mt-1">(à¸«à¸™à¹ˆà¸§à¸¢à¸à¸²à¸£à¹€à¸‡à¸´à¸™à¹à¸¥à¸°à¸šà¸±à¸à¸Šà¸µ à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ)</div>
                    <div className="text-xs text-slate-600">à¸œà¸¹à¹‰à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™</div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 5. à¹ƒà¸šà¸ªà¸³à¸„à¸±à¸à¸£à¸±à¸šà¸£à¸­à¸‡à¸ˆà¹ˆà¸²à¸¢ (à¹ƒà¸šà¸£à¸±à¸šà¸£à¸­à¸‡à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™ à¸‚à¹‰à¸­ 46)        */}
            {/* ========================================================= */}
            {activeDoc === 'certification' && (
              <div className="space-y-4 text-justify leading-relaxed">
                <div className="text-center space-y-1">
                  <div className="font-bold text-xl sm:text-2xl">à¹ƒà¸šà¸£à¸±à¸šà¸£à¸­à¸‡à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™</div>
                  <div className="font-bold text-lg">à¸ªà¹ˆà¸§à¸™à¸£à¸²à¸Šà¸à¸²à¸£ à¸¡à¸«à¸²à¸§à¸´à¸—à¸¢à¸²à¸¥à¸±à¸¢à¸™à¹€à¸£à¸¨à¸§à¸£</div>
                  <div className="text-xs text-slate-600">(à¸•à¸²à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸à¸£à¸°à¸—à¸£à¸§à¸‡à¸à¸²à¸£à¸„à¸¥à¸±à¸‡ à¸§à¹ˆà¸²à¸”à¹‰à¸§à¸¢à¸à¸²à¸£à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸ˆà¸²à¸à¸„à¸¥à¸±à¸‡à¸¯ à¸ž.à¸¨. 2562 à¸‚à¹‰à¸­ 46)</div>
                </div>

                <table className="w-full border border-black border-collapse text-xs sm:text-sm mt-3">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-black p-2 text-center w-28">à¸§à¸±à¸™ à¹€à¸”à¸·à¸­à¸™ à¸›à¸µ</th>
                      <th className="border border-black p-2 text-left">à¸£à¸²à¸¢à¸¥à¸°à¹€à¸­à¸µà¸¢à¸”à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢</th>
                      <th className="border border-black p-2 text-right w-28">à¸ˆà¸³à¸™à¸§à¸™à¹€à¸‡à¸´à¸™</th>
                      <th className="border border-black p-2 text-center w-24">à¸«à¸¡à¸²à¸¢à¹€à¸«à¸•à¸¸</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-2 text-center">{application.publishedDate || application.createdAt}</td>
                      <td className="border border-black p-2 space-y-1">
                        <div className="font-medium">à¸„à¹ˆà¸²à¸ªà¸™à¸±à¸šà¸ªà¸™à¸¸à¸™à¸à¸²à¸£à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œ / à¸£à¸²à¸‡à¸§à¸±à¸¥à¸•à¸µà¸žà¸´à¸¡à¸žà¹Œà¸šà¸—à¸„à¸§à¸²à¸¡à¸§à¸´à¸ˆà¸±à¸¢</div>
                        <div className="text-xs text-slate-700 italic">à¹€à¸£à¸·à¹ˆà¸­à¸‡ {application.articleTitle}</div>
                        <div className="text-xs font-semibold text-slate-800">
                          à¸§à¸²à¸£à¸ªà¸²à¸£ {application.journalName} (Quartile: {application.quartile})
                        </div>
                      </td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                      <td className="border border-black p-2 text-center">à¸ˆà¹ˆà¸²à¸¢à¸ˆà¸£à¸´à¸‡</td>
                    </tr>
                    <tr className="bg-slate-50 font-bold">
                      <td colSpan={2} className="border border-black p-2 text-right">
                        à¸£à¸§à¸¡à¸—à¸±à¹‰à¸‡à¸ªà¸´à¹‰à¸™ ({bahtText(totalAmount)})
                      </td>
                      <td className="border border-black p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                      <td className="border border-black p-2"></td>
                    </tr>
                  </tbody>
                </table>

                <div className="indent-8 text-base leading-relaxed pt-3 text-justify">
                  à¸‚à¹‰à¸²à¸žà¹€à¸ˆà¹‰à¸² <strong>{application.applicantName}</strong> à¸•à¸³à¹à¸«à¸™à¹ˆà¸‡ {application.academicPosition || 'à¸­à¸²à¸ˆà¸²à¸£à¸¢à¹Œ'} à¸ªà¸±à¸‡à¸à¸±à¸” {application.department} à¸„à¸“à¸°à¹à¸žà¸—à¸¢à¸¨à¸²à¸ªà¸•à¸£à¹Œ à¸‚à¸­à¸£à¸±à¸šà¸£à¸­à¸‡à¸§à¹ˆà¸² à¸£à¸²à¸¢à¸ˆà¹ˆà¸²à¸¢à¸‚à¹‰à¸²à¸‡à¸•à¹‰à¸™à¸™à¸µà¹‰ à¸‚à¹‰à¸²à¸žà¹€à¸ˆà¹‰à¸²à¹„à¸”à¹‰à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™à¹„à¸›à¹‚à¸”à¸¢à¹„à¸”à¹‰à¸£à¸±à¸šà¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¸‹à¸¶à¹ˆà¸‡à¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£à¹„à¸¡à¹ˆà¸„à¸£à¸šà¸–à¹‰à¸§à¸™à¸•à¸²à¸¡à¸«à¸¥à¸±à¸à¸à¸²à¸™à¸à¸²à¸£à¸ˆà¹ˆà¸²à¸¢à¹€à¸‡à¸´à¸™à¹ƒà¸™à¸‚à¹‰à¸­ 46 à¸«à¸£à¸·à¸­à¸‹à¸¶à¹ˆà¸‡à¸•à¸²à¸¡à¸¥à¸±à¸à¸©à¸“à¸°à¹„à¸¡à¹ˆà¸­à¸²à¸ˆà¹€à¸£à¸µà¸¢à¸à¹ƒà¸šà¹€à¸ªà¸£à¹‡à¸ˆà¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¸ˆà¸²à¸à¸œà¸¹à¹‰à¸£à¸±à¸šà¹€à¸‡à¸´à¸™à¹„à¸”à¹‰ à¸‹à¸¶à¹ˆà¸‡à¹€à¸›à¹‡à¸™à¹„à¸›à¸•à¸²à¸¡à¸£à¸°à¹€à¸šà¸µà¸¢à¸šà¸à¸£à¸°à¸—à¸£à¸§à¸‡à¸à¸²à¸£à¸„à¸¥à¸±à¸‡ à¸§à¹ˆà¸²à¸”à¹‰à¸§à¸¢à¸à¸²à¸£à¹€à¸šà¸´à¸à¹€à¸‡à¸´à¸™à¸ˆà¸²à¸à¸„à¸¥à¸±à¸‡ à¸ž.à¸¨. 2562
                </div>

                <div className="pt-10 text-center max-w-xs ml-auto avoid-break">
                  <div>à¸¥à¸‡à¸Šà¸·à¹ˆà¸­..........................................................</div>
                  <div className="font-semibold mt-1">({application.applicantName})</div>
                  <div className="text-sm text-slate-600">à¸œà¸¹à¹‰à¸£à¸±à¸šà¸£à¸­à¸‡</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
