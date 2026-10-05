import React, { useState } from 'react';
import { X, Calendar, DollarSign, CheckCircle2, User } from 'lucide-react';
import { NuDisbursementRecord } from '../types';

interface NuEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: NuDisbursementRecord | null;
  onSave: (updated: NuDisbursementRecord) => void;
}

export const NuEditModal: React.FC<NuEditModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
}) => {
  if (!isOpen || !record) return null;

  const [status, setStatus] = useState<string>(record.status || 'อยู่ระหว่างการจัดส่งเอกสาร');
  const [approvedDate, setApprovedDate] = useState<string>(record.approvedDate || '');
  const [paymentDate, setPaymentDate] = useState<string>(record.paymentDate || '');
  const [rewardAmount, setRewardAmount] = useState<number>(record.rewardAmount || 0);
  const [pageChargeAmount, setPageChargeAmount] = useState<number>(record.pageChargeAmount || 0);
  const [matchedFacultyTrackingNo, setMatchedFacultyTrackingNo] = useState<string>(record.matchedFacultyTrackingNo || '');
  const [notes, setNotes] = useState<string>(record.notes || '');

  const totalAmount = (Number(rewardAmount) || 0) + (Number(pageChargeAmount) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...record,
      status,
      approvedDate: approvedDate.trim() || undefined,
      paymentDate: paymentDate.trim() || undefined,
      rewardAmount: Number(rewardAmount) || 0,
      pageChargeAmount: Number(pageChargeAmount) || 0,
      totalAmount,
      matchedFacultyTrackingNo: matchedFacultyTrackingNo.trim() || undefined,
      notes: notes.trim() || undefined,
      updatedAt: new Date().toISOString().split('T')[0],
    });
    onClose();
  };

  const handleSetTodayApproved = () => {
    setApprovedDate(new Date().toISOString().split('T')[0]);
    if (status === 'อยู่ระหว่างการจัดส่งเอกสาร' || status === 'เข้าระบบ') {
      setStatus('อนุมัติแล้ว');
    }
  };

  const handleSetTodayPayment = () => {
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setStatus('จ่ายเงินแล้ว');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/30">
              🎓
            </div>
            <div>
              <h3 className="text-sm font-bold font-prompt">
                ปรับปรุงข้อมูลการเบิกจ่าย ม.นเรศวร (DRI NU)
              </h3>
              <p className="text-[11px] text-slate-400 font-sans">
                ระบุวันที่อนุมัติ วันที่จ่ายเงิน และจำนวนเงินรางวัล/ค่าตีพิมพ์
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Readonly Info Card */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{record.researcherName}</span>
            </div>
            <div className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">
              <strong>บทความ:</strong> {record.articleTitle}
            </div>
            <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
              <span>ยื่นเมื่อ: <strong className="text-slate-700 font-mono">{record.submissionDate}</strong></span>
              <span>ประเภท: <strong className="text-slate-700">{record.claimType}</strong></span>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              สถานะในระบบ มน.
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium text-slate-800"
            >
              <option value="อยู่ระหว่างการจัดส่งเอกสาร">🟡 อยู่ระหว่างการจัดส่งเอกสาร</option>
              <option value="เข้าระบบ">🟡 เข้าระบบ</option>
              <option value="อนุมัติแล้ว">🔵 อนุมัติแล้ว (กองการวิจัยฯ พิจารณาเห็นชอบ)</option>
              <option value="จ่ายเงินแล้ว">🟢 จ่ายเงินแล้ว (การเงินรวมศูนย์ สนอ. โอนเข้าบัญชีแล้ว)</option>
              <option value="ไม่อนุมัติ">🔴 ไม่อนุมัติ</option>
            </select>
          </div>

          {/* Dates: Approved Date & Payment Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>วันที่อนุมัติเบิก</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetTodayApproved}
                  className="text-[10px] text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
                >
                  ใส่วันนี้
                </button>
              </div>
              <input
                type="date"
                value={approvedDate}
                onChange={(e) => setApprovedDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>วันที่จ่ายเงิน (โอนเงิน)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSetTodayPayment}
                  className="text-[10px] text-emerald-600 hover:text-emerald-800 underline font-medium cursor-pointer"
                >
                  ใส่วันนี้
                </button>
              </div>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Financial Amounts: Reward, Page Charge, Total */}
          <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>จำนวนเงินสนับสนุนส่วนของ มน. (บาท)</span>
              </span>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full">
                รวม: {totalAmount.toLocaleString()} บาท
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  เงินรางวัล มน. (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={rewardAmount || ''}
                  onChange={(e) => setRewardAmount(Number(e.target.value))}
                  placeholder="เช่น 30000"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">
                  ค่าตีพิมพ์ / เพจชาร์จ มน. (บาท)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={pageChargeAmount || ''}
                  onChange={(e) => setPageChargeAmount(Number(e.target.value))}
                  placeholder="เช่น 45000"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Matched Faculty Tracking No & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                เลขคำขอของคณะแพทยฯ ที่ตรงกัน
              </label>
              <input
                type="text"
                value={matchedFacultyTrackingNo}
                onChange={(e) => setMatchedFacultyTrackingNo(e.target.value)}
                placeholder="เช่น AWP70-001"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น เลขที่ฎีกา มน. หรือบันทึกย่อ"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>บันทึกข้อมูล มน.</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
