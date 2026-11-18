import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Search,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { AuditLogEntry, AuditRetentionSummary, UserProfile } from '../types';
import {
  fetchAuditLogs,
  checkAuditRetention,
  downloadAuditBackup24m,
  purgeAuditLogs24m,
  exportAllAuditLogs
} from '../services/auditLogService';

interface AuditLogViewProps {
  currentUser: UserProfile;
  onShowAlert?: (msg: string) => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({
  currentUser,
  onShowAlert
}) => {
  // State for logs & pagination
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedTargetType, setSelectedTargetType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Retention & Backup state
  const [retention, setRetention] = useState<AuditRetentionSummary | null>(null);
  const [checkingRetention, setCheckingRetention] = useState<boolean>(false);
  const [backupDownloaded, setBackupDownloaded] = useState<boolean>(false);
  const [hasConfirmedBackupCheckbox, setHasConfirmedBackupCheckbox] = useState<boolean>(false);
  const [isExportingAll, setIsExportingAll] = useState<boolean>(false);
  const [isDownloadingBackup, setIsDownloadingBackup] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);

  // Purge Confirmation Modal
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [purgeInputConfirm, setPurgeInputConfirm] = useState<string>('');

  // Load Retention Status
  const loadRetentionStatus = useCallback(async () => {
    try {
      setCheckingRetention(true);
      const data = await checkAuditRetention();
      setRetention(data);
    } catch (err: any) {
      console.warn('Failed to load retention status:', err);
    } finally {
      setCheckingRetention(false);
    }
  }, []);

  // Load Audit Logs
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const res = await fetchAuditLogs({
        q: searchQuery,
        action: selectedAction,
        targetType: selectedTargetType,
        limit: pageSize,
        offset
      });
      setLogs(res.logs || []);
      setTotalCount(res.total || 0);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      if (onShowAlert) onShowAlert('เกิดข้อผิดพลาดในการโหลด Audit Logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedAction, selectedTargetType, onShowAlert]);

  useEffect(() => {
    loadRetentionStatus();
  }, [loadRetentionStatus]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Handle Backup 24m Download
  const handleDownloadBackup24m = async () => {
    try {
      setIsDownloadingBackup(true);
      const filename = await downloadAuditBackup24m();
      setBackupDownloaded(true);
      if (onShowAlert) {
        onShowAlert(`ดาวน์โหลดไฟล์สำรองเรียบร้อยแล้ว: ${filename}`);
      }
    } catch (err: any) {
      alert('ไม่สามารถดาวน์โหลดไฟล์สำรองข้อมูลได้: ' + err.message);
    } finally {
      setIsDownloadingBackup(false);
    }
  };

  // Handle Full Export
  const handleExportAll = async () => {
    try {
      setIsExportingAll(true);
      const filename = await exportAllAuditLogs();
      if (onShowAlert) {
        onShowAlert(`ส่งออก Log ทั้งหมดเรียบร้อยแล้ว: ${filename}`);
      }
    } catch (err: any) {
      alert('ไม่สามารถส่งออกข้อมูลทั้งหมดได้: ' + err.message);
    } finally {
      setIsExportingAll(false);
    }
  };

  // Handle Purge Execution
  const handleExecutePurge = async () => {
    if (purgeInputConfirm !== 'PURGE') {
      alert('กรุณาพิมพ์ PURGE เพื่อยืนยันการล้างข้อมูล');
      return;
    }
    try {
      setIsPurging(true);
      const res = await purgeAuditLogs24m(currentUser.name || currentUser.email, currentUser.role);
      setShowPurgeModal(false);
      setPurgeInputConfirm('');
      setBackupDownloaded(false);
      setHasConfirmedBackupCheckbox(false);
      if (onShowAlert) {
        onShowAlert(`ล้างข้อมูลเก่าเกิน 24 เดือนเรียบร้อยแล้ว (${res.purgedCount} รายการ)`);
      }
      // Reload both
      await Promise.all([loadRetentionStatus(), loadLogs()]);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  // Format Action Badge with High-Contrast Colors
  const renderActionBadge = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('DELETE') || act.includes('PURGE')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          {action}
        </span>
      );
    }
    if (act.includes('CREATE') || act.includes('INSERT') || act.includes('SUBMIT')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {action}
        </span>
      );
    }
    if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('CHANGE')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          {action}
        </span>
      );
    }
    if (act.includes('LOGIN') || act.includes('AUTH')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {action}
      </span>
    );
  };

  // Convert SQLite UTC timestamp to Thailand time (GMT+7, Asia/Bangkok)
  const formatTimestamp = (ts: string) => {
    if (!ts) return '-';
    try {
      let iso = String(ts).trim();
      // If timestamp is in "YYYY-MM-DD HH:mm:ss" without timezone indicator, treat as UTC
      if (!iso.endsWith('Z') && !iso.includes('+')) {
        iso = iso.replace(' ', 'T') + 'Z';
      }
      const d = new Date(iso);
      if (isNaN(d.getTime())) return ts;

      return d.toLocaleString('th-TH', {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }) + ' น.';
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header - High Contrast Light Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold font-prompt text-slate-900 tracking-tight">
                  ประวัติการใช้งาน (Audit Logs)
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 rounded-full font-prompt shadow-xs">
                  Admin Console
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-prompt font-medium">
                บันทึกการกระทำของผู้ใช้ ตรวจสอบย้อนหลัง และระบบจัดการข้อมูลเก่าตามเกณฑ์ 24 เดือน
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              loadRetentionStatus();
              loadLogs();
            }}
            disabled={loading || checkingRetention}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-xs transition cursor-pointer disabled:opacity-50"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="font-prompt">รีเฟรช</span>
          </button>

          <button
            onClick={handleExportAll}
            disabled={isExportingAll || totalCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold border border-amber-400 shadow-sm transition cursor-pointer disabled:opacity-50"
            title="ส่งออกบันทึก Log ทั้งหมดเป็นไฟล์ CSV (UTF-8 BOM สำหรับเปิดใน Excel)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-950" />
            <span className="font-prompt">{isExportingAll ? 'กำลังส่งออก...' : 'ส่งออก Log ทั้งหมด (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* 24-MONTH RETENTION & BACKUP WARNING BANNER */}
      {retention && retention.expiredCount > 0 ? (
        <div className="bg-gradient-to-r from-amber-50 via-amber-100/40 to-slate-50 border-2 border-amber-400 rounded-2xl p-5 shadow-sm text-slate-900">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6 animate-pulse text-amber-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold font-prompt text-amber-950">
                    แจ้งเตือน: ตรวจพบข้อมูลบันทึกเกินเกณฑ์จัดเก็บ 24 เดือน (730 วัน)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200/80 text-amber-900 border border-amber-400">
                    {retention.expiredCount.toLocaleString()} รายการ
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-prompt">
                  มีประวัติการใช้งานที่บันทึกก่อนวันที่{' '}
                  <span className="font-bold text-amber-950 underline decoration-amber-500">
                    {retention.cutoffDate}
                  </span>{' '}
                  (ข้อมูลเก่าสุด:{' '}
                  <span className="text-amber-950 font-mono font-semibold">
                    {formatTimestamp(retention.oldestTimestamp || '')}
                  </span>
                  ) ตามมาตรฐานความปลอดภัยต้องดำเนินการสำรองข้อมูลลงเครื่อง Local ก่อนจึงจะอนุญาตให้ล้างข้อมูลได้
                </p>

                {/* Safe Protocol Checkbox */}
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-800 hover:text-slate-950 font-medium">
                    <input
                      type="checkbox"
                      checked={hasConfirmedBackupCheckbox}
                      onChange={(e) => setHasConfirmedBackupCheckbox(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 bg-white text-amber-600 focus:ring-amber-500/40 cursor-pointer"
                    />
                    <span className="font-prompt">
                      ข้าพเจ้าได้ดาวน์โหลดไฟล์สำรองข้อมูล (CSV) และตรวจสอบความถูกต้องแล้ว
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons: Backup & Purge */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <button
                onClick={handleDownloadBackup24m}
                disabled={isDownloadingBackup}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-prompt shadow-sm transition cursor-pointer ${
                  backupDownloaded
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-400'
                }`}
                title="ดาวน์โหลดไฟล์สำรองข้อมูลเฉพาะส่วนที่เก่าเกิน 24 เดือน (CSV UTF-8 BOM สำหรับเปิดใน Excel)"
              >
                {backupDownloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <Download className={`w-4 h-4 ${isDownloadingBackup ? 'animate-bounce' : ''}`} />
                )}
                <span>
                  {isDownloadingBackup
                    ? 'กำลังสำรองข้อมูล...'
                    : backupDownloaded
                    ? 'ดาวน์โหลดสำรองแล้ว (คลิกโหลดซ้ำ)'
                    : '1. ดาวน์โหลดสำรองข้อมูล (CSV)'}
                </span>
              </button>

              <button
                onClick={() => setShowPurgeModal(true)}
                disabled={(!backupDownloaded && !hasConfirmedBackupCheckbox) || isPurging}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs font-prompt transition ${
                  backupDownloaded || hasConfirmedBackupCheckbox
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm cursor-pointer border border-rose-500'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                }`}
                title={
                  backupDownloaded || hasConfirmedBackupCheckbox
                    ? 'ล้างประวัติการใช้งานที่เก่าเกิน 24 เดือน'
                    : 'ต้องดาวน์โหลดสำรองข้อมูลหรือติ๊กยืนยันก่อนจึงจะปลดล็อคปุ่มนี้ได้'
                }
              >
                <Trash2 className="w-4 h-4" />
                <span>2. ล้างข้อมูลเก่าเกิน 24 เดือน</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-emerald-950 font-prompt">
                สถานะการจัดเก็บข้อมูล Audit Logs เป็นปกติ
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800 font-prompt mt-0.5">
                ข้อมูลทั้งหมด <span className="font-bold text-emerald-950 font-mono">{retention?.totalCount.toLocaleString() || 0}</span> รายการ อยู่ภายในกรอบระยะเวลาจัดเก็บ 24 เดือน (ไม่พบข้อมูลค้างเก่า)
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-200 font-prompt inline-block">
              เกณฑ์จัดเก็บ: 730 วัน (2 ปี)
            </span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar - Clean White Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหา AWP Tracking No., ชื่อผู้ดำเนินการ, รายละเอียด..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-prompt transition"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-prompt cursor-pointer transition"
            >
              <option value="all">ทุกกิจกรรม (All Actions)</option>
              <option value="LOGIN">LOGIN (เข้าสู่ระบบ)</option>
              <option value="CREATE_APPLICATION">CREATE_APPLICATION (ยื่นคำขอ)</option>
              <option value="UPDATE_APPLICATION">UPDATE_APPLICATION (ปรับปรุงคำขอ/สถานะ)</option>
              <option value="DELETE_APPLICATION">DELETE_APPLICATION (ลบคำขอ)</option>
              <option value="UPDATE_USER">UPDATE_USER (แก้ไขผู้ใช้)</option>
              <option value="DELETE_USER">DELETE_USER (ลบผู้ใช้)</option>
              <option value="PURGE_EXPIRED_LOGS">PURGE_EXPIRED_LOGS (ล้าง Log เก่า)</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div className="relative">
            <select
              value={selectedTargetType}
              onChange={(e) => {
                setSelectedTargetType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-1 focus:ring-purple-600 font-prompt cursor-pointer transition"
            >
              <option value="all">ทุกประเภทข้อมูล (All Target Types)</option>
              <option value="REWARD_APPLICATION">REWARD_APPLICATION (คำขอรับทุน)</option>
              <option value="USER">USER (ผู้ใช้งาน)</option>
              <option value="SYSTEM">SYSTEM (ระบบ/แอดมิน)</option>
              <option value="GENERAL">GENERAL (ทั่วไป)</option>
            </select>
          </div>
        </div>

        {/* Status / Count indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            พบข้อมูล{' '}
            <span className="font-semibold text-slate-800 font-mono">
              {totalCount.toLocaleString()}
            </span>{' '}
            รายการ {searchQuery ? `(คำค้น: "${searchQuery}")` : ''}
          </div>
          <div>
            หน้า {currentPage} จาก {totalPages} (แสดงหน้าละ {pageSize} รายการ)
          </div>
        </div>
      </div>

      {/* Logs Table - High Contrast Light Theme */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-prompt">
                <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                <th className="py-3 px-4 font-semibold w-48 whitespace-nowrap">วัน-เวลา (เวลาประเทศไทย)</th>
                <th className="py-3 px-4 font-semibold w-48 whitespace-nowrap">ผู้ดำเนินการ</th>
                <th className="py-3 px-4 font-semibold w-36 whitespace-nowrap">กิจกรรม</th>
                <th className="py-3 px-4 font-semibold w-36 whitespace-nowrap">ประเภท / เป้าหมาย</th>
                <th className="py-3 px-4 font-semibold">รายละเอียดการเปลี่ยนแปลง</th>
                <th className="py-3 px-4 font-semibold w-32 whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    <span className="font-prompt text-xs">กำลังโหลดบันทึกการใช้งาน...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <span className="font-prompt text-sm text-slate-600">
                      ไม่พบบันทึกการใช้งานที่ตรงตามเงื่อนไข
                    </span>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const rowNum = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 text-center text-slate-400 font-mono">
                        {rowNum}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 font-prompt">
                            {log.userName || log.performedBy || log.userId || 'ผู้ดำเนินการ'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            บทบาท: {log.userRole || (log.performedBy ? 'admin' : 'user')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {renderActionBadge(log.action)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-slate-800 font-semibold">
                            {log.targetId || log.recordId || '-'}
                          </span>
                          {(log.targetType || log.tableName) && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {log.targetType || log.tableName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 max-w-md">
                        <div className="break-words font-prompt leading-relaxed text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          {log.details || log.newData || log.oldData || '-'}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between text-slate-700">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-prompt">ก่อนหน้า</span>
            </button>

            <span className="text-xs text-slate-600 font-prompt">
              หน้า <span className="font-bold text-slate-900">{currentPage}</span> จาก{' '}
              <span className="font-bold text-slate-900">{totalPages}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
            >
              <span className="font-prompt">ถัดไป</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* CONFIRM PURGE MODAL */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-300 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 border border-rose-200 rounded-xl">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold font-prompt text-slate-900">
                ยืนยันการล้างข้อมูลบันทึกเก่าเกิน 24 เดือน
              </h3>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 text-xs text-slate-700 space-y-2 font-prompt">
              <p>
                ⚠️ การล้างข้อมูลนี้จะลบ Log ทั้งหมดที่ถูกบันทึกก่อนวันที่{' '}
                <span className="font-bold text-slate-950 underline">
                  {retention?.cutoffDate}
                </span>{' '}
                จำนวน{' '}
                <span className="font-bold text-rose-700">
                  {retention?.expiredCount.toLocaleString()}
                </span>{' '}
                รายการ ออกจากฐานข้อมูล Cloudflare D1 อย่างถาวร
              </p>
              <p className="text-slate-600">
                ระบบจะบันทึก Audit Log การล้างข้อมูลในครั้งนี้ไว้เป็นหลักฐานโดยอัตโนมัติ
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-800 font-prompt block">
                พิมพ์คำว่า <span className="font-mono text-rose-600 font-bold">PURGE</span> ในช่องด้านล่างเพื่อยืนยัน:
              </label>
              <input
                type="text"
                placeholder="PURGE"
                value={purgeInputConfirm}
                onChange={(e) => setPurgeInputConfirm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono uppercase tracking-widest focus:outline-none focus:bg-white focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPurgeModal(false);
                  setPurgeInputConfirm('');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer font-prompt"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={purgeInputConfirm !== 'PURGE' || isPurging}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition cursor-pointer font-prompt flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPurging ? 'กำลังล้างข้อมูล...' : 'ยืนยันล้างข้อมูลเก่า'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
