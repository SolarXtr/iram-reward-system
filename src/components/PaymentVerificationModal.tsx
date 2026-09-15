import React from 'react';
import { 
  X, 
  CheckCircle2, 
  Printer, 
  Download, 
  Building, 
  Banknote, 
  Calendar, 
  CreditCard, 
  FileCheck, 
  Share2,
  ShieldAlert
} from 'lucide-react';
import { ResearchApplication } from '../types';
import { bahtText, formatBaht } from '../data/regulations';

interface PaymentVerificationModalProps {
  application: ResearchApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onPrintSlip: () => void;
}

export const PaymentVerificationModal: React.FC<PaymentVerificationModalProps> = ({
  application,
  isOpen,
  onClose,
  onPrintSlip,
}) => {
  if (!isOpen || !application) return null;

  const totalAmount = application.actualPaidAmount || application.totalClaimedAmount;
  const isPaid = application.status === 'paid' || application.paymentStatus === 'transferred';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-emerald-900 px-6 py-4 flex items-center justify-between text-white border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 rounded-xl">
              <Banknote className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="text-xs text-emerald-300 font-semibold font-prompt uppercase">
                คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • งานการเงินและพัสดุ
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-prompt">
                หลักฐานและสถานะการโอนเงิน (Payment Verification Slip)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          
          {/* Transfer Status Banner */}
          {isPaid ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-emerald-950 text-sm font-prompt block">
                    โอนเงินเข้าบัญชีเรียบร้อยแล้ว (สำเร็จ)
                  </span>
                  <span className="text-emerald-800 text-[11px]">
                    วันที่ทำรายการโอน: <strong>{application.paymentDate || '23 มีนาคม 2569'}</strong>
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 bg-emerald-200 text-emerald-900 font-bold rounded-full text-xs">
                โอนแล้ว
              </span>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-amber-950 text-sm font-prompt block">
                    อยู่ระหว่างจัดทำฎีกาเบิกเงิน (หน่วยการเงินและบัญชี)
                  </span>
                  <span className="text-amber-800 text-[11px]">
                    ระยะเวลาดำเนินการภายใน 4 สัปดาห์นับจากวันที่ได้รับอนุมัติ
                  </span>
                </div>
              </div>

              <span className="px-3 py-1 bg-amber-200 text-amber-900 font-bold rounded-full text-xs">
                รอการโอน
              </span>
            </div>
          )}

          {/* Realistic University Official Transfer Receipt Card (เหมือนหน้า 1 ตัวจริง) */}
          <div className="border-2 border-slate-300 rounded-xl p-6 bg-slate-50/50 space-y-4 font-sarabun text-slate-900 shadow-inner">
            <div className="text-center border-b border-slate-300 pb-3">
              <div className="font-bold text-sm">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</div>
              <div className="text-xs">ใบรับเอกสาร คณะฯ ไม่สำรองจ่าย (บุคลากรสำรองจ่ายเอง)</div>
              <div className="text-[11px] text-slate-500 mt-1">
                เลขที่คำขอ: <strong>{application.trackingNo}</strong> • วันที่ส่งเอกสาร: <strong>{application.paymentDate || application.createdAt}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-600">ข้าพเจ้า: </span>
                <span className="font-bold">{application.applicantName}</span>
              </div>
              <div>
                <span className="text-slate-600">หน่วยงาน: </span>
                <span className="font-bold">{application.department}</span>
              </div>
              <div>
                <span className="text-slate-600">ตำแหน่ง: </span>
                <span>{application.academicPosition || 'อาจารย์แพทย์'}</span>
              </div>
              <div>
                <span className="text-slate-600">เบอร์โทรศัพท์: </span>
                <span>{application.phone}</span>
              </div>
            </div>

            {/* Financial Breakdown Table */}
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-200/80">
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-12">ลำดับ</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center w-28">เลขรับการเงิน</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-left">รายการ</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-right w-28">จำนวนเงิน (บาท)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 px-2 py-1.5 text-center">1</td>
                  <td className="border border-slate-300 px-2 py-1.5 text-center font-mono font-bold text-emerald-800">
                    {application.disbursementVoucherNo || '3606/69'}
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5">
                    <div>ขออนุมัติเบิกเงินรางวัลตีพิมพ์ฯ {application.applicantName}</div>
                    <div className="text-[10px] text-slate-500">
                      (รางวัล {formatBaht(application.claimedRewardAmount)} + ค่าตีพิมพ์ {formatBaht(application.approvedPageChargeAmount)})
                    </div>
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right font-bold">
                    {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={3} className="border border-slate-300 px-2 py-1.5 text-right">
                    รวมค่าใช้จ่าย ({bahtText(totalAmount)})
                  </td>
                  <td className="border border-slate-300 px-2 py-1.5 text-right text-emerald-900 font-prompt">
                    {totalAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Bank Transfer Details */}
            <div className="bg-white p-3.5 rounded-lg border border-slate-300 space-y-2">
              <div className="font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>แบบฟอร์มยินยอมการโอนเงินเข้าบัญชีเงินฝากธนาคาร</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                ข้าพเจ้ามีความประสงค์ยินยอมให้งานการเงิน คณะแพทยศาสตร์ โอนเงินพร้อมหักค่าธรรมเนียมธนาคารเข้าบัญชีเงินฝาก:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div>
                  <span className="text-slate-500">ธนาคาร: </span>
                  <span className="font-bold text-slate-900">ธนาคารกรุงศรีอยุธยา</span>
                </div>
                <div>
                  <span className="text-slate-500">สาขา: </span>
                  <span className="font-bold text-slate-900">มหาวิทยาลัยนเรศวร</span>
                </div>
                <div>
                  <span className="text-slate-500">ชื่อบัญชี: </span>
                  <span className="font-bold text-slate-900">{application.applicantName}</span>
                </div>
                <div>
                  <span className="text-slate-500">เลขที่บัญชี: </span>
                  <span className="font-bold text-blue-900 font-mono text-sm">{application.bankAccountNo}</span>
                </div>
              </div>
            </div>

            {/* Government Official Signatures */}
            <div className="grid grid-cols-2 gap-4 pt-3 text-center text-xs">
              <div className="border-t border-slate-300 pt-2">
                <div className="font-medium">ลงชื่อ ผู้สำรองจ่าย / ผู้ส่งเอกสาร</div>
                <div className="font-bold text-slate-900 mt-1">({application.applicantName})</div>
                <div className="text-[10px] text-slate-500">ผู้ขอรับทุน/รางวัลตีพิมพ์</div>
              </div>

              <div className="border-t border-slate-300 pt-2">
                <div className="font-medium">ลงชื่อ ผู้รับเอกสาร / เจ้าหน้าที่การเงิน</div>
                <div className="font-bold text-slate-900 mt-1">(หน่วยการเงินและบัญชี)</div>
                <div className="text-[10px] text-slate-500">คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              * ข้อมูลอิงตามระบบการเงินและบัญชี คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={onPrintSlip}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบรับเอกสาร / สลิปโอนเงิน</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
