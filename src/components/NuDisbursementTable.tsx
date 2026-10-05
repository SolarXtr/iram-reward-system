import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Edit3, 
  Upload, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Award, 
  BookOpen, 
  ChevronRight,
  ShieldCheck,
  Info
} from 'lucide-react';
import { NuDisbursementRecord, ResearchApplication, UserProfile, UserRole } from '../types';
import { NuEditModal } from './NuEditModal';
import { NuImportModal } from './NuImportModal';

interface NuDisbursementTableProps {
  records: NuDisbursementRecord[];
  facultyApps: ResearchApplication[];
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onUpdateRecord: (updated: NuDisbursementRecord) => void;
  onImportRecords: (newRecords: NuDisbursementRecord[]) => void;
  onOpenFacultyDoc?: (app: ResearchApplication) => void;
}

export const NuDisbursementTable: React.FC<NuDisbursementTableProps> = ({
  records,
  facultyApps,
  currentUser,
  currentRole,
  onUpdateRecord,
  onImportRecords,
  onOpenFacultyDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingRecord, setEditingRecord] = useState<NuDisbursementRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // สิทธิ์การมองเห็นข้อมูลทั้งหมดของคณะแพทยศาสตร์ (Admin, Coordinator, Executive, Finance)
  const canViewAll = ['admin', 'coordinator', 'executive', 'finance'].includes(currentRole);

  // สิทธิ์การนำเข้าและแก้ไขข้อมูล (Admin และ Coordinator เท่านั้น)
  const canEdit = currentRole === 'admin' || currentRole === 'coordinator';

  // Role Scoping: Researcher sees only their own articles; Admin/Coordinator/Executive/Finance see all
  const scopedRecords = useMemo(() => {
    if (!currentUser) return [];
    if (canViewAll) return records;

    const myName = currentUser.name || '';
    const myFirstName = currentUser.firstNameTh || '';
    const myLastName = currentUser.lastNameTh || '';

    return records.filter((r) => {
      const recName = r.researcherName || '';
      if (myName && recName.includes(myName)) return true;
      if (myFirstName && myLastName && recName.includes(myFirstName) && recName.includes(myLastName)) return true;
      return false;
    });
  }, [records, currentUser, canViewAll]);

  // Search & Filter
  const filteredRecords = useMemo(() => {
    return scopedRecords.filter((r) => {
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid' && !r.status.includes('จ่ายเงินแล้ว')) return false;
        if (statusFilter === 'approved' && !r.status.includes('อนุมัติแล้ว')) return false;
        if (statusFilter === 'shipping' && !r.status.includes('จัดส่งเอกสาร') && !r.status.includes('เข้าระบบ')) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.researcherName.toLowerCase().includes(q) ||
        r.articleTitle.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.matchedFacultyTrackingNo && r.matchedFacultyTrackingNo.toLowerCase().includes(q))
      );
    });
  }, [scopedRecords, statusFilter, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = scopedRecords.length;
    const countPaid = scopedRecords.filter(r => r.status.includes('จ่ายเงินแล้ว')).length;
    const countApproved = scopedRecords.filter(r => r.status.includes('อนุมัติแล้ว')).length;
    const countPending = total - countPaid - countApproved;
    const sumTotalAmount = scopedRecords.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
    const sumPaidAmount = scopedRecords
      .filter(r => r.status.includes('จ่ายเงินแล้ว'))
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    return { total, countPaid, countApproved, countPending, sumTotalAmount, sumPaidAmount };
  }, [scopedRecords]);

  const getStatusBadge = (status: string) => {
    if (status.includes('จ่ายเงินแล้ว')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>จ่ายเงินแล้ว</span>
        </span>
      );
    }
    if (status.includes('อนุมัติแล้ว')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>อนุมัติแล้ว</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-900 border border-amber-300">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
        <span>{status || 'อยู่ระหว่างจัดส่งเอกสาร'}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6 font-sans">
      
      {/* 1. Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-prompt">
              DRI NU Tracker
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 font-prompt flex items-center gap-1.5">
              <span>ติดตามการเบิกจ่ายเงินรางวัล & ค่าตีพิมพ์ส่วนของ มหาวิทยาลัยนเรศวร</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {canViewAll
              ? 'ข้อมูลการขอรับการสนับสนุนจากกองการวิจัยและนวัตกรรม (ม.นเรศวร) ทั้งหมดของคณะแพทยศาสตร์'
              : 'รายการขอรับการสนับสนุนเงินรางวัลและค่าเพจชาร์จจากกองการวิจัยและนวัตกรรม (ม.นเรศวร) ของท่าน'}
          </p>
        </div>

        {/* Action Buttons: Import for Admin/Coordinator; Read-only badge for Executive/Finance */}
        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="นำเข้าไฟล์ ASPxGridView1.xlsx จากระบบ มน."
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>นำเข้า Excel (.xlsx)</span>
            </button>
          )}

          {!canEdit && canViewAll && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>โหมดตรวจสอบข้อมูลภาพรวม (อ่านอย่างเดียว)</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Quick KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
          <span className="text-[11px] text-slate-500 font-medium block">คำขอ มน. ทั้งหมด</span>
          <span className="text-lg font-bold text-slate-900 font-prompt">{metrics.total} <span className="text-xs font-normal text-slate-500">เรื่อง</span></span>
        </div>
        <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80">
          <span className="text-[11px] text-amber-800 font-medium block">อยู่ระหว่างดำเนินการ</span>
          <span className="text-lg font-bold text-amber-900 font-prompt">{metrics.countPending} <span className="text-xs font-normal text-amber-700">เรื่อง</span></span>
        </div>
        <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80">
          <span className="text-[11px] text-blue-800 font-medium block">อนุมัติแล้ว</span>
          <span className="text-lg font-bold text-blue-900 font-prompt">{metrics.countApproved} <span className="text-xs font-normal text-blue-700">เรื่อง</span></span>
        </div>
        <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
          <span className="text-[11px] text-emerald-800 font-medium block">โอนเงินสำเร็จแล้ว</span>
          <span className="text-lg font-bold text-emerald-900 font-prompt">{metrics.countPaid} <span className="text-xs font-normal text-emerald-700">เรื่อง</span></span>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่ออาจารย์, ชื่อบทความ, หรือสถานะ..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] shrink-0">กรอง:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'shipping', label: 'ยื่น/ส่งเอกสาร' },
            { id: 'approved', label: 'อนุมัติแล้ว' },
            { id: 'paid', label: 'จ่ายเงินแล้ว' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                statusFilter === f.id
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold uppercase tracking-wider text-[11px] font-prompt">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>
                <th className="py-3 px-3 w-28">วันที่ยื่น มน.</th>
                <th className="py-3 px-3 min-w-[240px]">ชื่อผลงาน / บทความวิจัย</th>
                <th className="py-3 px-3 w-44">อาจารย์นักวิจัย</th>
                <th className="py-3 px-3 w-36">ประเภทคำขอ</th>
                <th className="py-3 px-3 w-32 text-center">สถานะ มน.</th>
                <th className="py-3 px-3 w-28">วันที่อนุมัติ</th>
                <th className="py-3 px-3 w-28">วันที่จ่ายเงิน</th>
                <th className="py-3 px-3 w-28 text-right">ยอดรวม มน.</th>
                <th className="py-3 px-3 w-28 text-center">สถานะคณะฯ</th>
                {canEdit && <th className="py-3 px-3 w-16 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 11 : 10} className="py-8 text-center text-slate-400">
                    <Info className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <span>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</span>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, idx) => {
                  const matchedFaculty = facultyApps.find(
                    f => f.trackingNo === r.matchedFacultyTrackingNo
                  );

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        {r.submissionDate || '-'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 line-clamp-2 leading-snug">
                          {r.articleTitle}
                        </div>
                        {r.fileNote && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            📎 {r.fileNote}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium leading-tight">
                        {r.researcherName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                          {r.claimType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-blue-900">
                        {r.approvedDate ? (
                          <span className="font-semibold">✓ {r.approvedDate}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-emerald-900">
                        {r.paymentDate ? (
                          <span className="font-semibold">✓ {r.paymentDate}</span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {r.totalAmount ? `฿${r.totalAmount.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {matchedFaculty ? (
                          <button
                            type="button"
                            onClick={() => onOpenFacultyDoc && onOpenFacultyDoc(matchedFaculty)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 hover:bg-purple-200 transition-colors cursor-pointer"
                            title="คลิกเพื่อดูคำขอของคณะแพทยฯ"
                          >
                            <span>{matchedFaculty.trackingNo}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">ยังไม่ยื่นคณะ</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setEditingRecord(r)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="แก้ไข/ระบุวันอนุมัติ วันจ่ายเงิน และยอดเงิน มน."
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modals */}
      <NuEditModal
        isOpen={Boolean(editingRecord)}
        record={editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={(updated) => {
          onUpdateRecord(updated);
          setEditingRecord(null);
        }}
      />

      <NuImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        facultyApps={facultyApps}
        onImportSuccess={(newRecords) => {
          onImportRecords(newRecords);
          setIsImportModalOpen(false);
        }}
      />

    </div>
  );
};
