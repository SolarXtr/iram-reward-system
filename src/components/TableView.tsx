import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Edit2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Printer, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet,
  Building2,
  UserCheck,
  ShieldCheck
} from 'lucide-react';
import { ApplicationStatus, ResearchApplication } from '../types';
import { 
  formatBaht, 
  formatKrungsriAccountNo, 
  getTrackingPrefix,
  maskBankAccountNo,
  maskThaiCitizenId 
} from '../data/regulations';

interface TableViewProps {
  applications: ResearchApplication[];
  onSaveRow: (updatedApp: ResearchApplication) => void;
  onViewApplication: (app: ResearchApplication) => void;
  onPrintApplication: (app: ResearchApplication) => void;
  onVerifyPayment: (app: ResearchApplication) => void;
  currentUserEmail?: string;
  currentUserName?: string;
}

export const TableView: React.FC<TableViewProps> = ({
  applications,
  onSaveRow,
  onViewApplication,
  onPrintApplication,
  onVerifyPayment,
  currentUserEmail = 'tinnakornh@nu.ac.th',
  currentUserName = 'ดร.ทินกร หอมดี',
}) => {
  const [filterScope, setFilterScope] = useState<'all' | 'my_jobs'>('all');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedQuartile, setSelectedQuartile] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');
  const [maskSensitiveData, setMaskSensitiveData] = useState<boolean>(true);

  // Extract available fiscal years dynamically
  const availableFiscalYears = useMemo(() => {
    const years = new Set<number>();
    applications.forEach((a) => {
      if (a.fiscalYear) years.add(a.fiscalYear);
    });
    years.add(2569);
    years.add(2570);
    return Array.from(years).sort((a, b) => b - a);
  }, [applications]);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ResearchApplication>>({});

  const startEdit = (app: ResearchApplication) => {
    setEditingId(app.id);
    setEditForm({ ...app });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (!editingId) return;
    const original = applications.find((a) => a.id === editingId);
    if (!original) return;

    const updated = { ...original, ...editForm, updatedAt: new Date().toISOString().split('T')[0] };
    onSaveRow(updated);
    setEditingId(null);
  };

  // Filtering
  const filteredApps = applications.filter((app) => {
    if (filterScope === 'my_jobs') {
      const isMyJob = 
        (currentUserEmail && app.email.toLowerCase() === currentUserEmail.toLowerCase()) ||
        (currentUserName && app.applicantName.toLowerCase().includes(currentUserName.toLowerCase()));
      if (!isMyJob) return false;
    }

    if (selectedFiscalYear !== 'all' && String(app.fiscalYear) !== selectedFiscalYear) {
      return false;
    }

    if (selectedStatus !== 'all' && app.status !== selectedStatus) {
      return false;
    }

    if (selectedQuartile !== 'all') {
      if (selectedQuartile === 'Q1_Tier1' && app.quartile !== 'Q1_Tier1') return false;
      if (selectedQuartile === 'Q1' && app.quartile !== 'Q1') return false;
      if (selectedQuartile === 'Q2' && app.quartile !== 'Q2') return false;
      if (selectedQuartile === 'Q3' && app.quartile !== 'Q3') return false;
      if (selectedQuartile === 'Q4' && app.quartile !== 'Q4') return false;
      if (selectedQuartile === 'TCI' && !app.quartile.includes('TCI')) return false;
    }

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      const matchTrack = app.trackingNo.toLowerCase().includes(q);
      const matchName = app.applicantName.toLowerCase().includes(q);
      const matchTitle = app.articleTitle.toLowerCase().includes(q);
      const matchJournal = app.journalName.toLowerCase().includes(q);
      const matchDept = app.department.toLowerCase().includes(q);
      if (!matchTrack && !matchName && !matchTitle && !matchJournal && !matchDept) {
        return false;
      }
    }

    return true;
  });

  const exportToCsv = () => {
    const headers = [
      'TrackingNo',
      'FiscalYear',
      'ApplicantName',
      'Department',
      'ArticleTitle',
      'JournalName',
      'Quartile',
      'RewardAmount',
      'PageChargeAmount',
      'TotalClaimed',
      'Status',
      'CurrentStep',
      'VoucherNo',
      'PaymentDate'
    ];

    const rows = filteredApps.map((a) => [
      `"${a.trackingNo}"`,
      a.fiscalYear,
      `"${a.applicantName}"`,
      `"${a.department}"`,
      `"${a.articleTitle.replace(/"/g, '""')}"`,
      `"${a.journalName.replace(/"/g, '""')}"`,
      a.quartile,
      a.claimedRewardAmount,
      a.approvedPageChargeAmount,
      a.totalClaimedAmount,
      a.status,
      a.currentStep,
      `"${a.disbursementVoucherNo || ''}"`,
      `"${a.paymentDate || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `med_nu_rewards_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        
        {/* Left: View Filter (My jobs vs All) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
            <button
              onClick={() => setFilterScope('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                filterScope === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              โครงการทั้งหมด ({applications.length})
            </button>
            <button
              onClick={() => setFilterScope('my_jobs')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                filterScope === 'my_jobs'
                  ? 'bg-white text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>งานของตนเอง</span>
            </button>
          </div>

          {/* Fiscal Year Filter */}
          <select
            value={selectedFiscalYear}
            onChange={(e) => setSelectedFiscalYear(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกปีงบประมาณ</option>
            {availableFiscalYears.map((fy) => (
              <option key={fy} value={String(fy)}>
                ปีงบฯ {fy} ({getTrackingPrefix(fy)}-XXX)
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="submitted">ยื่นคำขอใหม่</option>
            <option value="staff_verified">เจ้าหน้าที่ตรวจแล้ว</option>
            <option value="dean_approved">คณบดีอนุมัติแล้ว</option>
            <option value="finance_processing">งานการเงินจัดทำฎีกา</option>
            <option value="paid">โอนเงินเข้าบัญชีแล้ว</option>
          </select>

          {/* Quartile Filter */}
          <select
            value={selectedQuartile}
            onChange={(e) => setSelectedQuartile(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุก Quartile / ฐานข้อมูล</option>
            <option value="Q1_Tier1">Q1 Tier 1 (Top 10%)</option>
            <option value="Q1">Quartile 1</option>
            <option value="Q2">Quartile 2</option>
            <option value="Q3">Quartile 3</option>
            <option value="Q4">Quartile 4</option>
            <option value="TCI">TCI ระดับชาติ</option>
          </select>
        </div>

        {/* Right: Search & Export CSV */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="ค้นหาในตาราง..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setMaskSensitiveData(!maskSensitiveData)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
              maskSensitiveData
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title="สลับโหมดพรางข้อมูลอ่อนไหวตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{maskSensitiveData ? 'PDPA Mask: เปิด (ซ่อนเลขบัญชี)' : 'PDPA Mask: ปิด (แสดงเต็ม)'}</span>
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 transition-colors shrink-0"
            title="ส่งออกเป็นไฟล์ CSV สำหรับ Google Sheets / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-3 py-3 text-left">เลขที่คำขอ</th>
                <th className="px-3 py-3 text-left">นักวิจัย / ภาควิชา</th>
                <th className="px-3 py-3 text-left">ชื่อบทความ / วารสาร</th>
                <th className="px-3 py-3 text-left">ระดับ / Quartile</th>
                <th className="px-3 py-3 text-right">เงินรางวัล</th>
                <th className="px-3 py-3 text-right">ค่าตีพิมพ์</th>
                <th className="px-3 py-3 text-right">รวมเงิน (บาท)</th>
                <th className="px-3 py-3 text-left">บัญชีรับโอน / เลขฎีกา</th>
                <th className="px-3 py-3 text-center">สถานะ</th>
                <th className="px-3 py-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                    ไม่พบรายการตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredApps.map((app, idx) => {
                  const isEditing = editingId === app.id;
                  const isPaid = app.status === 'paid';
                  const rowKey = app.id || `table-app-${app.trackingNo || 'row'}-${idx}`;

                  return (
                    <tr key={rowKey} className="hover:bg-slate-50/70 transition-colors">
                      {/* Col 1: Tracking */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.trackingNo || ''}
                            onChange={(e) => setEditForm({ ...editForm, trackingNo: e.target.value })}
                            className="px-2 py-1 border border-blue-400 rounded text-xs font-mono font-bold w-28"
                          />
                        ) : (
                          <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-mono">
                            {app.trackingNo}
                          </span>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          <span className="font-medium text-amber-700 bg-amber-50 px-1 rounded mr-1">ปี {app.fiscalYear}</span>
                          <span>{app.createdAt}</span>
                        </div>
                      </td>

                      {/* Col 2: Researcher */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.applicantName || ''}
                            onChange={(e) => setEditForm({ ...editForm, applicantName: e.target.value })}
                            className="px-2 py-1 border border-blue-400 rounded text-xs w-36"
                          />
                        ) : (
                          <>
                            <div className="font-semibold text-slate-900">{app.applicantName}</div>
                            <div className="text-[11px] text-slate-500">{app.department}</div>
                          </>
                        )}
                      </td>

                      {/* Col 3: Title */}
                      <td className="px-3 py-3 max-w-xs">
                        {isEditing ? (
                          <textarea
                            value={editForm.articleTitle || ''}
                            onChange={(e) => setEditForm({ ...editForm, articleTitle: e.target.value })}
                            className="px-2 py-1 border border-blue-400 rounded text-xs w-full h-14"
                          />
                        ) : (
                          <>
                            <div className="font-medium text-slate-800 line-clamp-1" title={app.articleTitle}>
                              {app.articleTitle}
                            </div>
                            <div className="text-[11px] text-slate-500 italic line-clamp-1">
                              {app.journalName}
                            </div>
                          </>
                        )}
                      </td>

                      {/* Col 4: Quartile */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {app.quartile === 'Q1_Tier1' ? 'Q1 Tier 1' : app.quartile}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{app.database}</div>
                      </td>

                      {/* Col 5: Reward Amount */}
                      <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-slate-700">
                        {formatBaht(app.claimedRewardAmount)}
                      </td>

                      {/* Col 6: Page Charge */}
                      <td className="px-3 py-3 whitespace-nowrap text-right font-medium text-slate-700">
                        {formatBaht(app.approvedPageChargeAmount)}
                      </td>

                      {/* Col 7: Total Amount */}
                      <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-slate-900 font-prompt">
                        {formatBaht(app.totalClaimedAmount)}
                      </td>

                      {/* Col 8: Bank & Voucher */}
                      <td className="px-3 py-3 whitespace-nowrap">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="xxx-x-xxxxx-x"
                              maxLength={13}
                              value={editForm.bankAccountNo || ''}
                              onChange={(e) => setEditForm({ ...editForm, bankAccountNo: formatKrungsriAccountNo(e.target.value) })}
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs font-mono w-28 block"
                            />
                            <input
                              type="text"
                              placeholder="เลขฎีกาเบิกเงิน"
                              value={editForm.disbursementVoucherNo || ''}
                              onChange={(e) => setEditForm({ ...editForm, disbursementVoucherNo: e.target.value })}
                              className="px-1.5 py-0.5 border border-blue-400 rounded text-xs font-mono w-28 block"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-mono text-[11px] text-slate-700">
                              {maskSensitiveData ? maskBankAccountNo(app.bankAccountNo) : app.bankAccountNo}
                            </div>
                            {app.disbursementVoucherNo && (
                              <span className="inline-block mt-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {app.disbursementVoucherNo}
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Col 9: Status */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {isEditing ? (
                          <select
                            value={editForm.status || app.status}
                            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as ApplicationStatus })}
                            className="px-2 py-1 border border-blue-400 rounded text-xs font-medium"
                          >
                            <option value="submitted">ยื่นคำขอใหม่</option>
                            <option value="staff_verified">เจ้าหน้าที่ตรวจแล้ว</option>
                            <option value="dean_approved">คณบดีอนุมัติ</option>
                            <option value="finance_processing">งานการเงินทำฎีกา</option>
                            <option value="paid">โอนเงินแล้ว</option>
                          </select>
                        ) : isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>โอนเงินแล้ว</span>
                          </span>
                        ) : app.status === 'dean_approved' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <span>คณบดีอนุมัติแล้ว</span>
                          </span>
                        ) : app.status === 'finance_processing' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                            <span>งานคลังทำฎีกา</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800">
                            <span>ขั้นตอนที่ {app.currentStep}/12</span>
                          </span>
                        )}
                      </td>

                      {/* Col 10: Actions */}
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={saveEdit}
                              className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              title="บันทึก"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300"
                              title="ยกเลิก"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => startEdit(app)}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="แก้ไขข้อมูลในตาราง"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onViewApplication(app)}
                              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                              title="ดูไทม์ไลน์"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onPrintApplication(app)}
                              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded"
                              title="พิมพ์เอกสาร AWP69 / บันทึกข้อความ"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            {isPaid && (
                              <button
                                onClick={() => onVerifyPayment(app)}
                                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                                title="สลิปโอนเงิน / รายงานผล"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
