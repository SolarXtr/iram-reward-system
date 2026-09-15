import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  FileText, 
  CheckSquare, 
  Download, 
  Check, 
  Building2 
} from 'lucide-react';
import { ResearchApplication } from '../types';
import { bahtText, formatBaht, getTrackingPrefix } from '../data/regulations';

interface OfficialPrintModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
}

type FormDocType = 'memo' | 'awp' | 'receipt' | 'certification';

export const OfficialPrintModal: React.FC<OfficialPrintModalProps> = ({
  application,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !application) return null;

  const [activeDoc, setActiveDoc] = useState<FormDocType>('memo');
  const trackingPrefix = getTrackingPrefix(application.fiscalYear);
  const sequenceOnly = application.trackingNo
    ? application.trackingNo.replace(new RegExp(`^${trackingPrefix}-?|^AWP\\d{2}-?`, 'i'), '')
    : '';

  const totalAmount = application.totalClaimedAmount;

  const formatAmountDisplay = (num: number) => {
    const hasDec = Math.abs(num % 1) > 0.001;
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: hasDec ? 2 : 0,
      maximumFractionDigits: 2,
    });
  };

  const handlePrint = () => {
    // Set document title temporarily to ensure the PDF saves with a meaningful filename
    const originalTitle = document.title;
    let docName = 'เอกสารราชการ';
    if (activeDoc === 'memo') docName = 'บันทึกข้อความ_ขออนุมัติเบิกเงิน';
    else if (activeDoc === 'awp') docName = `แบบตรวจสอบรายการ_${trackingPrefix}`;
    else if (activeDoc === 'receipt') docName = 'ใบสำคัญรับเงิน';
    else if (activeDoc === 'certification') docName = 'ใบรับรองการจ่ายเงิน';
    
    document.title = `${docName}_${application.trackingNo.replace('/', '_')}`;
    
    window.print();
    
    // Restore original title
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Top Bar */}
        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-white border-b border-slate-800 no-print">
          <div>
            <div className="text-xs text-amber-400 font-semibold uppercase font-prompt">
              ระบบสร้างเอกสาร PDF / พิมพ์เอกสารราชการ • คณะแพทยศาสตร์ ม.นเรศวร
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white font-prompt flex items-center gap-2">
              <span>แบบฟอร์มเสนอผู้บริหารและเบิกจ่ายเงินรางวัล ({trackingPrefix})</span>
              <span className="font-mono text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {application.trackingNo}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-md transition-all"
              title="ระบบจะตั้งชื่อไฟล์ให้อัตโนมัติ กรุณาเลือก Destination เป็น 'Save as PDF' ในหน้าต่าง Print"
            >
              <Download className="w-4 h-4" />
              <span>บันทึกเป็น PDF / พิมพ์</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Switcher Tabs (No Print) */}
        <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex flex-wrap gap-2 text-xs no-print">
          <button
            onClick={() => setActiveDoc('memo')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'memo'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            1. บันทึกข้อความ (ขออนุมัติเบิกเงิน)
          </button>

          <button
            onClick={() => setActiveDoc('awp')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'awp'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            2. แบบตรวจสอบรายการ {trackingPrefix}
          </button>

          <button
            onClick={() => setActiveDoc('receipt')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'receipt'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            3. ใบสำคัญรับเงิน ม.นเรศวร
          </button>

          <button
            onClick={() => setActiveDoc('certification')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeDoc === 'certification'
                ? 'bg-blue-700 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            4. ใบรับรองการจ่ายเงิน (ส่วนราชการ)
          </button>
        </div>

        {/* Printable Area */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-white" id="printable-document">
          
          {/* ========================================================= */}
          {/* DOC 1: บันทึกข้อความ ขออนุมัติเบิกเงิน (MEMORANDUM)       */}
          {/* ========================================================= */}
          {activeDoc === 'memo' && (
            <div className="font-sarabun text-slate-900 max-w-3xl mx-auto space-y-4 leading-relaxed text-sm">
              
              {/* Garuda Emblem & Header */}
              <div className="flex items-start justify-between">
                <div className="w-16">
                  {/* Official Thai Garuda Emblem */}
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Garuda_of_Thailand.svg/200px-Garuda_of_Thailand.svg.png" 
                    alt="Garuda" 
                    className="w-14 h-14 object-contain"
                  />
                </div>
                <div className="flex-1 text-center font-bold text-xl tracking-tight pr-14 pt-2">
                  บันทึกข้อความ
                </div>
              </div>

              {/* Official Header Fields */}
              <div className="border-b border-slate-900 pb-2 space-y-1 text-sm pt-2">
                <div>
                  <strong>ส่วนราชการ: </strong> 
                  คณะแพทยศาสตร์ {application.department} โทร. {application.phone}
                </div>
                <div className="flex justify-between">
                  <div>
                    <strong>ที่: </strong> {application.internalDocNo || 'อว 0603.10.10/066'}
                  </div>
                  <div>
                    <strong>วันที่: </strong> {application.createdAt || '26 มกราคม 2569'}
                  </div>
                </div>
                <div>
                  <strong>เรื่อง: </strong> 
                  ขออนุมัติเบิกเงินค่าตีพิมพ์และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับ{application.journalScope === 'international' ? 'นานาชาติ' : 'ชาติ'}
                </div>
              </div>

              {/* Salutation */}
              <div className="pt-1">
                <strong>เรียน </strong> คณบดีคณะแพทยศาสตร์
              </div>

              {/* Body Text */}
              <div className="space-y-3 indent-8 text-justify">
                <p>
                  ข้าพเจ้า {application.applicantName} ตำแหน่ง {application.academicPosition || 'อาจารย์แพทย์'} สังกัด {application.department} คณะแพทยศาสตร์ มีความประสงค์ขอรับเงินค่าตีพิมพ์และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับ{application.journalScope === 'international' ? 'นานาชาติ' : 'ชาติ'} ตามประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 ซึ่งมีรายละเอียดดังนี้
                </p>

                <div className="indent-0 pl-6 space-y-1.5 text-xs sm:text-sm">
                  <div>
                    <strong>ชื่อบทความที่ได้รับการตีพิมพ์: </strong> {application.articleTitle}
                  </div>
                  <div>
                    <strong>ชื่อวารสาร: </strong> {application.journalName} จากฐานข้อมูล {application.database} จัดอยู่ใน Quartile {application.quartile}
                  </div>
                  <div>
                    <strong>วัน/เดือน/ปี ที่ตีพิมพ์: </strong> {application.volumeIssue || 'Vol 18 No 1'} วันที่ {application.publishedDate}
                  </div>
                  {application.doi && (
                    <div>
                      <strong>DOI: </strong> {application.doi}
                    </div>
                  )}
                  <div>
                    <strong>การมีส่วนร่วมในผลงาน: </strong> 
                    {application.authorRole === 'first_author' && '1) First Author (ผู้เขียนชื่อแรก)'}
                    {application.authorRole === 'corresponding_author' && '2) Corresponding Author (ผู้เขียนชื่อหลัก)'}
                    {application.authorRole === 'co_author' && '3) Co-author (ผู้ร่วมเขียน)'}
                  </div>
                  <div>
                    <strong>วารสารวิชาการ: </strong> ระดับ{application.journalScope === 'international' ? 'นานาชาติ' : 'ชาติ'} ({application.articleType === 'research_article' ? 'Research Article / Review' : 'บทความวิชาการอื่นๆ'})
                  </div>
                </div>

                <div className="indent-0 pl-6 pt-1 space-y-1">
                  <div><strong>โดยขออนุมัติ: </strong></div>
                  <div className="pl-4">
                    - เงินรางวัลตามเกณฑ์ ข้อ 8 เป็นเงิน {formatBaht(application.claimedRewardAmount)} ({bahtText(application.claimedRewardAmount)})
                  </div>
                  {application.approvedPageChargeAmount > 0 && (
                    <div className="pl-4">
                      - ค่าตีพิมพ์ตามเกณฑ์ ข้อ 9 เป็นเงิน {formatBaht(application.approvedPageChargeAmount)} ({bahtText(application.approvedPageChargeAmount)})
                      {application.claimedPageChargeAmount > application.approvedPageChargeAmount && (
                        <span className="text-slate-600 text-xs ml-1">
                          (จากค่าตีพิมพ์จ่ายจริงตามใบเสร็จ {formatBaht(application.claimedPageChargeAmount)})
                        </span>
                      )}
                    </div>
                  )}
                  <div className="pl-4 font-bold text-slate-900 pt-1">
                    รวมเป็นเงินทั้งสิ้น {formatBaht(totalAmount)} ({bahtText(totalAmount)})
                  </div>
                </div>

                <p>
                  จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                </p>
              </div>

              {/* Signatures: Applicant & Head of Department */}
              <div className="grid grid-cols-2 gap-6 pt-6">
                <div className="text-center space-y-1">
                  <div className="h-10"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="font-semibold">({application.applicantName})</div>
                  <div className="text-xs text-slate-600">ผู้ขอรับรางวัล</div>
                </div>

                <div className="text-center space-y-1">
                  <div className="h-10"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div className="font-semibold">(หัวหน้าภาควิชา)</div>
                  <div className="text-xs text-slate-600">{application.department}</div>
                </div>
              </div>

              {/* Management Chain Signatures (Approval block) */}
              <div className="border-t border-slate-300 pt-4 mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div className="font-bold">เรียน คณบดีคณะแพทยศาสตร์</div>
                  <div className="text-slate-700">ขอเบิกจ่ายจาก งบประมาณรายได้ กองทุนวิจัย ปี {application.fiscalYear}</div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div>(ผู้ช่วยศาสตราจารย์ นายแพทย์จุฑาวัชย์ หอวรรณภากร)</div>
                  <div className="text-slate-500">รองคณบดีฝ่ายคุณภาพและวิจัย</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2">
                  <div className="font-bold">คำสั่งคณบดี</div>
                  <div className="flex gap-4">
                    <span>(&nbsp;&nbsp;) อนุมัติ</span>
                    <span>(&nbsp;&nbsp;) ไม่อนุมัติ</span>
                  </div>
                  <div className="h-6"></div>
                  <div>ลงชื่อ..........................................................</div>
                  <div>(ผู้ช่วยศาสตราจารย์ แพทย์หญิงพิริยา นฤขัตรพิชัย)</div>
                  <div className="text-slate-500">คณบดีคณะแพทยศาสตร์</div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* DOC 2: แบบตรวจสอบรายการ (AWP Tracking Prefix)              */}
          {/* ========================================================= */}
          {activeDoc === 'awp' && (
            <div className="font-sarabun text-slate-900 max-w-3xl mx-auto space-y-4 text-xs leading-normal">
              <div className="flex justify-between items-start border-b border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 border border-slate-800 rounded-full flex items-center justify-center font-bold text-xs">
                    MED
                  </div>
                  <div>
                    <div className="font-bold text-sm">แบบตรวจสอบรายการขอรับทุนสนับสนุนค่าตีพิมพ์ ({trackingPrefix})</div>
                    <div className="text-xs">รางวัลตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ (ประจำปีงบประมาณ พ.ศ. {application.fiscalYear})</div>
                    <div className="text-[11px] text-slate-500">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</div>
                  </div>
                </div>

                <div className="border border-slate-800 p-1.5 text-center min-w-[70px]">
                  <div className="font-bold text-xs">{trackingPrefix}</div>
                  <div className="font-mono text-base font-bold text-blue-900">{sequenceOnly || application.trackingNo}</div>
                </div>
              </div>

              {/* Table of Criteria */}
              <table className="w-full border border-slate-400 border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 p-2 text-center w-36">หัวข้อ</th>
                    <th className="border border-slate-400 p-2 text-left">รายละเอียด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">1. ชื่อผู้ขอรับทุน</td>
                    <td className="border border-slate-400 p-2 font-semibold">{application.applicantName}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">หน่วยงานที่สังกัด</td>
                    <td className="border border-slate-400 p-2">{application.department} คณะแพทยศาสตร์</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">2. ประเภททุนสนับสนุน</td>
                    <td className="border border-slate-400 p-2 space-x-4">
                      <span>[&nbsp;{application.claimedRewardAmount > 0 ? '✓' : ' '}&nbsp;] รางวัลตีพิมพ์ ({formatBaht(application.claimedRewardAmount)})</span>
                      <span>[&nbsp;{application.approvedPageChargeAmount > 0 ? '✓' : ' '}&nbsp;] ค่าตีพิมพ์ ({formatBaht(application.approvedPageChargeAmount)})</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">3. ชื่อบทความ</td>
                    <td className="border border-slate-400 p-2 font-medium">{application.articleTitle}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">ประเภทบทความ</td>
                    <td className="border border-slate-400 p-2 space-x-4">
                      <span>[&nbsp;{application.articleType === 'research_article' ? '✓' : ' '}&nbsp;] 1) บทความวิจัย (Research Article, Review, Guidelines)</span>
                      <span>[&nbsp;{application.articleType === 'other_academic' ? '✓' : ' '}&nbsp;] 2) บทความวิชาการอื่นๆ (Case report, Clinical picture)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">4. การมีส่วนร่วม</td>
                    <td className="border border-slate-400 p-2 space-x-3">
                      <span>[&nbsp;{application.authorRole === 'first_author' ? '✓' : ' '}&nbsp;] ผู้เขียนชื่อแรก (First Author)</span>
                      <span>[&nbsp;{application.authorRole === 'corresponding_author' ? '✓' : ' '}&nbsp;] ผู้เขียนชื่อหลัก (Corresponding Author)</span>
                      <span>[&nbsp;{application.authorRole === 'co_author' ? '✓' : ' '}&nbsp;] ผู้ร่วมเขียน (Co-author)</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">5. ชื่อวารสาร</td>
                    <td className="border border-slate-400 p-2">{application.journalName}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">6. ประเภทฐานข้อมูล</td>
                    <td className="border border-slate-400 p-2">
                      <div>ระดับนานาชาติ: [&nbsp;✓&nbsp;] {application.database} Quartile: <strong>{application.quartile}</strong></div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">7. อายุการเผยแพร่</td>
                    <td className="border border-slate-400 p-2">เผยแพร่มาแล้วไม่เกิน 24 เดือน (ผ่านเกณฑ์)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-2 font-bold">8. ไม่เป็นส่วนหนึ่งของการจบการศึกษา</td>
                    <td className="border border-slate-400 p-2">ไม่เป็นส่วนหนึ่งของการศึกษาเพื่อปริญญา (ผ่านเกณฑ์)</td>
                  </tr>
                </tbody>
              </table>

              {/* Checklist Table */}
              <div className="font-bold text-xs pt-1">เอกสารประกอบการขอรับทุนสนับสนุนค่าตีพิมพ์/เบิกเงินรางวัลตีพิมพ์</div>
              <table className="w-full border border-slate-400 border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border border-slate-400 p-1.5 text-left">รายการเอกสาร</th>
                    <th className="border border-slate-400 p-1.5 text-center w-12">มี</th>
                    <th className="border border-slate-400 p-1.5 text-center w-12">ไม่มี</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-1.5">1. บันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์ รางวัลตีพิมพ์</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">2. ใบสำคัญรับเงิน</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">3. สำเนาบัตรประจำตัวประชาชน (รับรองสำเนาถูกต้อง)</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">4. สำเนาหน้าบัญชีธนาคารสำหรับโอนเงิน (ธนาคารกรุงศรีอยุธยา)</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">5. สำเนาบทความ Reprint (รับรองสำเนาถูกต้องทุกหน้า)</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">6. สำเนาหลักฐานอ้างอิงฐานข้อมูล JCR/SJR/Scopus/TCI</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">7. ใบเสร็จรับเงินหรือใบแจ้งหนี้ค่าตีพิมพ์ (Invoice)</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 p-1.5">8. ใบรับรองการจ่ายเงิน page charge</td>
                    <td className="border border-slate-400 p-1.5 text-center font-bold">✓</td>
                    <td className="border border-slate-400 p-1.5 text-center"></td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-2 text-[10px] text-slate-500 bg-slate-50 border border-slate-200 rounded p-1.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700">การคุ้มครองข้อมูลส่วนบุคคล (PDPA): </span>
                  <span>บันทึกความยินยอมประมวลผลข้อมูลส่วนบุคคลและข้อมูลการเงินเพื่อการเบิกจ่ายตามระเบียบ ม.นเรศวร</span>
                </div>
                <div className="font-mono font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  PDPA Consent: Verified
                </div>
              </div>

              <div className="pt-3 flex justify-between items-end">
                <div className="text-[11px] text-slate-500">
                  * ปรับปรุงล่าสุด Version 2.20 คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
                </div>

                <div className="text-center space-y-1">
                  <div>ลงชื่อ..........................................................</div>
                  <div className="font-semibold">({application.applicantName})</div>
                  <div className="text-[11px] text-slate-500">ผู้ขอรับทุน / รางวัลตีพิมพ์</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOC 3: ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร                   */}
          {/* ========================================================= */}
          {activeDoc === 'receipt' && (
            <div className="font-sarabun text-slate-900 max-w-3xl mx-auto space-y-4 text-xs sm:text-sm leading-normal">
              <div className="text-center space-y-1">
                <div className="font-bold text-base sm:text-lg">ใบสำคัญรับเงิน</div>
                <div className="font-semibold">มหาวิทยาลัยนเรศวร</div>
                <div className="text-right text-xs pt-2">
                  วันที่............เดือน................................พ.ศ. {application.fiscalYear}
                </div>
              </div>

              <div className="indent-8 text-justify leading-relaxed">
                ข้าพเจ้า <strong>{application.applicantName}</strong> ที่อยู่ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ตำบลท่าโพธิ์ อำเภอเมือง จังหวัดพิษณุโลก ได้รับเงินจากมหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้
              </div>

              <table className="w-full border border-slate-400 border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-2 text-center w-12">ที่</th>
                    <th className="border border-slate-400 p-2 text-left">รายการ</th>
                    <th className="border border-slate-400 p-2 text-center w-20">จำนวน</th>
                    <th className="border border-slate-400 p-2 text-right w-28">หน่วยละ</th>
                    <th className="border border-slate-400 p-2 text-right w-28">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody>
                  {application.approvedPageChargeAmount > 0 && (
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">1</td>
                      <td className="border border-slate-400 p-2">
                        เงินสนับสนุนค่าตีพิมพ์บทความ เรื่อง {application.articleTitle}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">1</td>
                      <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(application.approvedPageChargeAmount)}</td>
                      <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(application.approvedPageChargeAmount)}</td>
                    </tr>
                  )}
                  {application.claimedRewardAmount > 0 && (
                    <tr>
                      <td className="border border-slate-400 p-2 text-center">{application.approvedPageChargeAmount > 0 ? 2 : 1}</td>
                      <td className="border border-slate-400 p-2">
                        เงินรางวัลตีพิมพ์บทความ เรื่อง {application.articleTitle}
                      </td>
                      <td className="border border-slate-400 p-2 text-center">1</td>
                      <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(application.claimedRewardAmount)}</td>
                      <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(application.claimedRewardAmount)}</td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={4} className="border border-slate-400 p-2 text-right">รวม</td>
                    <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(totalAmount)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="font-bold text-right pt-1">
                จำนวนเงิน: {bahtText(totalAmount)}
              </div>

              <div className="grid grid-cols-2 gap-8 pt-10 text-center">
                <div>
                  <div>ลงชื่อ..........................................................ผู้รับเงิน</div>
                  <div className="font-semibold mt-1">({application.applicantName})</div>
                </div>

                <div>
                  <div>ลงชื่อ..........................................................ผู้จ่ายเงิน</div>
                  <div className="font-semibold mt-1">(หน่วยการเงินและบัญชี คณะแพทยศาสตร์)</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* DOC 4: ใบรับรองการจ่ายเงิน                                */}
          {/* ========================================================= */}
          {activeDoc === 'certification' && (
            <div className="font-sarabun text-slate-900 max-w-3xl mx-auto space-y-4 text-xs sm:text-sm leading-normal">
              <div className="text-center space-y-1">
                <div className="font-bold text-base sm:text-lg">ใบรับรองการจ่ายเงิน</div>
                <div className="font-semibold">ส่วนราชการ มหาวิทยาลัยนเรศวร</div>
              </div>

              <table className="w-full border border-slate-400 border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-400 p-2 text-center w-28">วัน เดือน ปี</th>
                    <th className="border border-slate-400 p-2 text-left">รายละเอียดการจ่าย</th>
                    <th className="border border-slate-400 p-2 text-right w-28">จำนวนเงิน</th>
                    <th className="border border-slate-400 p-2 text-center w-24">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 p-2 text-center">{application.publishedDate}</td>
                    <td className="border border-slate-400 p-2 space-y-2">
                      <div>ค่าตีพิมพ์ เรื่อง {application.articleTitle}</div>
                      <div className="font-semibold text-slate-700">ขอเบิกจ่ายตามประกาศคณะแพทยศาสตร์ จำนวนเงิน {formatBaht(totalAmount)}</div>
                    </td>
                    <td className="border border-slate-400 p-2 text-right font-mono">{formatAmountDisplay(totalAmount)}</td>
                    <td className="border border-slate-400 p-2 text-center">จ่ายจริง</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td colSpan={2} className="border border-slate-400 p-2 text-right">รวมทั้งสิ้น ({bahtText(totalAmount)})</td>
                    <td className="border border-slate-400 p-2 text-right">{formatAmountDisplay(totalAmount)}</td>
                    <td className="border border-slate-400 p-2"></td>
                  </tr>
                </tbody>
              </table>

              <div className="indent-8 text-justify leading-relaxed pt-2">
                ข้าพเจ้า {application.applicantName} ตำแหน่ง {application.academicPosition} สังกัดคณะแพทยศาสตร์ ขอรับรองว่า รายจ่ายข้างต้นนี้ ข้าพเจ้าได้จ่ายเงินไปโดยได้รับใบเสร็จรับเงินซึ่งมีรายการไม่ครบถ้วนตามหลักฐานการจ่ายเงินในข้อ 46 หรือซึ่งตามลักษณะไม่อาจเรียกใบเสร็จรับเงินจากผู้รับเงินได้ ซึ่งเป็นไปตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลัง พ.ศ. 2562
              </div>

              <div className="pt-8 text-center max-w-xs ml-auto">
                <div>(ลงชื่อ)..........................................................</div>
                <div className="font-semibold mt-1">({application.applicantName})</div>
                <div className="text-xs text-slate-500">ผู้รับรอง</div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
