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
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
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
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('all');
  const [facultyStatusFilter, setFacultyStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'submissionDate' | 'articleTitle' | 'researcherName' | 'fiscalYear' | 'totalAmount' | 'facultyTotalAmount'>('submissionDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingRecord, setEditingRecord] = useState<NuDisbursementRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Toggle or change sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'submissionDate' || field === 'totalAmount' || field === 'facultyTotalAmount' ? 'desc' : 'asc');
    }
  };

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

  // Search, Filter & Sort
  const filteredAndSortedRecords = useMemo(() => {
    const list = scopedRecords.filter((r) => {
      // 1. Fiscal Year Filter
      if (fiscalYearFilter !== 'all') {
        const fy = r.fiscalYear ? String(r.fiscalYear) : '2570';
        if (fy !== fiscalYearFilter) return false;
      }

      // 2. NU Status Filter
      if (statusFilter !== 'all') {
        const isNuPaid = Boolean(r.status?.includes('จ่ายเงินแล้ว') || r.isNuPaidConfirmed);
        const isFacPaid = Boolean(r.facultyStatus === 'paid' || r.disbursementVoucherNo || r.fiscalYear === 2569);
        const hasNuClaim = (r.totalAmount || 0) > 0 || isNuPaid;
        const isNotEligibleNu = isFacPaid && !isNuPaid && !hasNuClaim;

        if (statusFilter === 'not_eligible' && !isNotEligibleNu) return false;
        if (statusFilter === 'paid' && !isNuPaid) return false;
        if (statusFilter === 'central_finance' && !r.status.includes('ส่งการเงินรวมศูนย์')) return false;
        if (statusFilter === 'approved' && !r.status.includes('อนุมัติแล้ว')) return false;
        if (statusFilter === 'shipping' && !r.status.includes('จัดส่งเอกสาร') && !r.status.includes('เข้าระบบ')) return false;
      }

      // 3. Faculty Status Filter
      if (facultyStatusFilter !== 'all') {
        const isFacPaid = Boolean(r.facultyStatus === 'paid' || r.disbursementVoucherNo || r.fiscalYear === 2569);
        if (facultyStatusFilter === 'paid' && !isFacPaid) return false;
        if (facultyStatusFilter === 'unpaid' && isFacPaid) return false;
      }

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.researcherName.toLowerCase().includes(q) ||
        r.articleTitle.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q) ||
        (r.disbursementVoucherNo && r.disbursementVoucherNo.toLowerCase().includes(q)) ||
        (r.nuDisbursementVoucherNo && r.nuDisbursementVoucherNo.toLowerCase().includes(q)) ||
        (r.matchedFacultyTrackingNo && r.matchedFacultyTrackingNo.toLowerCase().includes(q)) ||
        (r.facultyTrackingNo && r.facultyTrackingNo.toLowerCase().includes(q))
      );
    });

    // Interactive Sorting (Default: Latest NU submissionDate first)
    return list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'submissionDate') {
        const dateA = a.submissionDate ? new Date(a.submissionDate).getTime() : 0;
        const dateB = b.submissionDate ? new Date(b.submissionDate).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortField === 'fiscalYear') {
        comparison = (a.fiscalYear || 0) - (b.fiscalYear || 0);
      } else if (sortField === 'totalAmount') {
        comparison = (a.totalAmount || 0) - (b.totalAmount || 0);
      } else if (sortField === 'facultyTotalAmount') {
        comparison = (a.facultyTotalAmount || 0) - (b.facultyTotalAmount || 0);
      } else if (sortField === 'articleTitle') {
        comparison = a.articleTitle.localeCompare(b.articleTitle, 'th');
      } else if (sortField === 'researcherName') {
        comparison = a.researcherName.localeCompare(b.researcherName, 'th');
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [scopedRecords, fiscalYearFilter, statusFilter, facultyStatusFilter, searchQuery, sortField, sortDirection]);

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

  const getStatusBadge = (r: NuDisbursementRecord) => {
    const status = r.status || '';
    const isNuPaid = Boolean(status.includes('จ่ายเงินแล้ว') || r.isNuPaidConfirmed);
    const isFacPaid = Boolean(r.facultyStatus === 'paid' || r.disbursementVoucherNo || r.fiscalYear === 2569);
    const hasNuClaim = (r.totalAmount || 0) > 0 || isNuPaid;

    // กรณีมีเบิกจ่ายแค่ส่วนของคณะอย่างเดียว -> แสดงสถานะของ มน. เป็น "ไม่เข้าเกณฑ์ มน."
    if (isFacPaid && !isNuPaid && !hasNuClaim) {
      return (
        <span 
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300" 
          title="บทความนี้ขอรับเงินสนับสนุนเฉพาะส่วนของคณะแพทยศาสตร์ ไม่เข้าเกณฑ์หรือไม่ได้ยื่นเบิก มน."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          <span>ไม่เข้าเกณฑ์ มน.</span>
        </span>
      );
    }

    if (isNuPaid) {
      return (
        <div className="inline-flex flex-col items-center">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="ยืนยันการจ่ายเงินแล้วจากระบบ มน.">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>จ่ายเงินแล้ว</span>
          </span>
          {r.paymentDate && (
            <span className="text-[10px] text-emerald-800 font-mono font-semibold mt-0.5" title="วันที่โอน/จ่ายเงินของ มน.">
              ✓ {r.paymentDate}
            </span>
          )}
          {r.nuDisbursementVoucherNo && (
            <span className="text-[9px] text-slate-500 font-mono leading-tight" title="เลขที่ฎีกา/คำสั่งจ่ายของ มน.">
              {r.nuDisbursementVoucherNo}
            </span>
          )}
        </div>
      );
    }
    if (status.includes('ส่งการเงินรวมศูนย์')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300" title="ส่งการเงินรวมศูนย์เพื่อเบิกจ่าย">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
          <span>ส่งการเงินรวมศูนย์</span>
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

        {/* Fiscal Year Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">ปีงบฯ:</span>
          {[
            { id: 'all', label: 'ทุกปี' },
            { id: '2570', label: 'ปี 2570' },
            { id: '2569', label: 'ปี 2569' },
            { id: '2568', label: 'ปี 2568' },
          ].map(fy => (
            <button
              key={fy.id}
              onClick={() => setFiscalYearFilter(fy.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                fiscalYearFilter === fy.id
                  ? 'bg-amber-600 text-white font-semibold shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
              }`}
            >
              {fy.label}
            </button>
          ))}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] shrink-0 font-medium">สถานะ มน.:</span>
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'paid', label: 'จ่ายเงินแล้ว' },
            { id: 'approved', label: 'อนุมัติแล้ว' },
            { id: 'central_finance', label: 'ส่งการเงินรวมศูนย์' },
            { id: 'shipping', label: 'ยื่น/ส่งเอกสาร' },
            { id: 'not_eligible', label: 'ไม่เข้าเกณฑ์ มน.' },
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
                
                {/* Sortable: วันที่ยื่น มน. */}
                <th 
                  onClick={() => handleSort('submissionDate')}
                  className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="คลิกเพื่อจัดเรียงตามวันที่ยื่น มน."
                >
                  <div className="flex items-center gap-1">
                    <span>วันที่ยื่น มน.</span>
                    {sortField === 'submissionDate' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Sortable: ชื่อบทความ */}
                <th 
                  onClick={() => handleSort('articleTitle')}
                  className="py-3 px-3 min-w-[240px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="คลิกเพื่อจัดเรียงตามชื่อบทความ"
                >
                  <div className="flex items-center gap-1">
                    <span>ชื่อผลงาน / บทความวิจัย</span>
                    {sortField === 'articleTitle' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Sortable: อาจารย์นักวิจัย */}
                <th 
                  onClick={() => handleSort('researcherName')}
                  className="py-3 px-3 w-44 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="คลิกเพื่อจัดเรียงตามชื่ออาจารย์"
                >
                  <div className="flex items-center gap-1">
                    <span>อาจารย์นักวิจัย</span>
                    {sortField === 'researcherName' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-3 w-32 text-center">สถานะ มน.</th>

                {/* Sortable: ยอดรวม มน. */}
                <th 
                  onClick={() => handleSort('totalAmount')}
                  className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  title="คลิกเพื่อจัดเรียงตามยอดรวม มน."
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ยอดรวม มน.</span>
                    {sortField === 'totalAmount' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Sortable: ยอดรวม คณะฯ */}
                <th 
                  onClick={() => handleSort('facultyTotalAmount')}
                  className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors select-none text-purple-950 bg-purple-50/50"
                  title="คลิกเพื่อจัดเรียงตามยอดรวม คณะฯ"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ยอดรวม คณะฯ</span>
                    {sortField === 'facultyTotalAmount' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-purple-700" /> : <ArrowUp className="w-3.5 h-3.5 text-purple-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-3 w-36 text-center">สถานะ คณะฯ</th>
                {canEdit && <th className="py-3 px-3 w-16 text-center">จัดการ</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-slate-400">
                    <Info className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                    <span>ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</span>
                  </td>
                </tr>
              ) : (
                filteredAndSortedRecords.map((r, idx) => {
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
                        <div className="flex items-center gap-1.5 mb-1">
                          {r.fiscalYear && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              ปี {r.fiscalYear}
                            </span>
                          )}
                          {r.matchedFacultyTrackingNo && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              {r.matchedFacultyTrackingNo}
                            </span>
                          )}
                        </div>
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
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(r)}
                      </td>

                      {/* ยอดรวม มน. */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                        {r.totalAmount ? `฿${r.totalAmount.toLocaleString()}` : '-'}
                      </td>

                      {/* ยอดรวม คณะฯ */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-900 bg-purple-50/20 whitespace-nowrap">
                        {r.facultyTotalAmount && r.facultyTotalAmount > 0 
                          ? `฿${r.facultyTotalAmount.toLocaleString()}` 
                          : matchedFaculty?.totalClaimedAmount 
                          ? `฿${matchedFaculty.totalClaimedAmount.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {r.facultyStatus === 'paid' || r.disbursementVoucherNo ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>เบิกจ่ายแล้ว</span>
                            </span>
                            {r.disbursementVoucherNo && (
                              <span className="text-[10px] text-slate-600 font-mono mt-0.5" title="เลขที่ฎีกาเบิกจ่ายของคณะฯ">
                                {r.disbursementVoucherNo}
                              </span>
                            )}
                          </div>
                        ) : matchedFaculty ? (
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
