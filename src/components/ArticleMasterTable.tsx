import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  BookOpen, 
  Award, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Printer, 
  ShieldCheck, 
  Layers, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  ChevronRight, 
  ExternalLink,
  Info,
  DollarSign,
  PlusCircle,
  X
} from 'lucide-react';
import { NuDisbursementRecord, ResearchApplication, UserProfile, UserRole } from '../types';
import { formatBaht } from '../data/regulations';

export interface UnifiedArticleRow {
  id: string;
  articleTitle: string;
  researcherName: string;
  department: string;
  fiscalYear: number;
  doi?: string;
  journalName?: string;
  quartile?: string;
  database?: string;

  // Category
  category: 'submitted' | 'preparing' | 'historical';
  categoryLabel: string;

  // Funding Source
  fundingSource: 'both' | 'nu_only' | 'faculty_only' | 'draft_plan';
  fundingSourceLabel: string;

  // Amounts
  nuRewardAmount: number;
  nuPageChargeAmount: number;
  nuTotalAmount: number;

  facultyRewardAmount: number;
  facultyPageChargeAmount: number;
  facultyTotalAmount: number;

  grandTotalAmount: number;

  // NU Status
  nuStatus: string;
  nuPaymentDate?: string;
  nuVoucherNo?: string;
  isNuPaid: boolean;
  isNuIneligible: boolean;

  // Faculty Status
  facultyStatus: string;
  facultyPaymentDate?: string;
  facultyVoucherNo?: string;
  isFacultyPaid: boolean;

  // Tracking references
  facultyTrackingNo?: string;
  matchedNuId?: string;

  // Raw references
  rawNuRecord?: NuDisbursementRecord;
  rawApp?: ResearchApplication;
}

interface ArticleMasterTableProps {
  nuDisbursements: NuDisbursementRecord[];
  applications: ResearchApplication[];
  currentUser: UserProfile | null;
  currentRole: UserRole;
  onViewApplication?: (app: ResearchApplication) => void;
  onPrintApplication?: (app: ResearchApplication) => void;
  onOpenNewSubmission?: () => void;
}

// Normalizer for fuzzy matching titles
function normTitle(s?: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/[^a-z0-9\u0e00-\u0e7f]/g, '');
}

export const ArticleMasterTable: React.FC<ArticleMasterTableProps> = ({
  nuDisbursements,
  applications,
  currentUser,
  currentRole,
  onViewApplication,
  onPrintApplication,
  onOpenNewSubmission,
}) => {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [fiscalYearFilter, setFiscalYearFilter] = useState<string>('all');
  const [fundingFilter, setFundingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'my_articles'>('all');
  
  // Sorting
  const [sortField, setSortField] = useState<'fiscalYear' | 'articleTitle' | 'researcherName' | 'grandTotalAmount' | 'category'>('fiscalYear');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Detail Modal
  const [selectedArticle, setSelectedArticle] = useState<UnifiedArticleRow | null>(null);

  // Check roles
  const canViewAll = ['admin', 'coordinator', 'executive', 'finance'].includes(currentRole);

  // 1. Merge 3 Data Categories into 1 row per article
  const allMergedArticles = useMemo<UnifiedArticleRow[]>(() => {
    const list: UnifiedArticleRow[] = [];
    const matchedAppIds = new Set<string>();

    // Step A: Process nuDisbursements records (Google Sheets aw68, aw69, ASPxGridView)
    nuDisbursements.forEach((nuRec, idx) => {
      const nuCleanTitle = normTitle(nuRec.articleTitle);
      
      // Attempt to find matching ResearchApplication
      const matchedApp = applications.find(app => {
        if (matchedAppIds.has(app.id)) return false;
        if (nuRec.matchedFacultyTrackingNo && app.trackingNo === nuRec.matchedFacultyTrackingNo) return true;
        if (nuRec.facultyTrackingNo && (app.trackingNo.includes(nuRec.facultyTrackingNo) || app.id.includes(nuRec.facultyTrackingNo))) return true;
        const appCleanTitle = normTitle(app.articleTitle);
        if (nuCleanTitle.length > 15 && appCleanTitle.length > 15) {
          if (nuCleanTitle === appCleanTitle || nuCleanTitle.includes(appCleanTitle) || appCleanTitle.includes(nuCleanTitle)) {
            return true;
          }
        }
        return false;
      });

      if (matchedApp) {
        matchedAppIds.add(matchedApp.id);
      }

      // Determine NU Payment & Status
      const rawNuStatus = nuRec.status || '';
      const isNuPaid = Boolean(rawNuStatus.includes('จ่ายเงินแล้ว') || nuRec.isNuPaidConfirmed || nuRec.paymentDate);
      
      // Faculty Paid logic
      // Note: User rule: "ปี 69 คณะเบิกจ่ายเรียบร้อยแล้ว แม้จะไม่มี เลข รด. แต่ใส่เลขฎีกา เช่น 2203 2204"
      const isFacultyPaid = Boolean(
        nuRec.facultyStatus === 'paid' || 
        nuRec.disbursementVoucherNo || 
        nuRec.fiscalYear === 2569 || 
        matchedApp?.status === 'paid'
      );

      const hasNuClaim = (nuRec.totalAmount || 0) > 0 || isNuPaid;
      const isNuIneligible = (isFacultyPaid && !isNuPaid && !hasNuClaim) || rawNuStatus.includes('ไม่เข้าเกณฑ์');

      // Determine Funding Source
      let fundingSource: 'both' | 'nu_only' | 'faculty_only' | 'draft_plan' = 'both';
      let fundingSourceLabel = 'ทั้ง มน. และ คณะฯ';

      if (isNuIneligible) {
        fundingSource = 'faculty_only';
        fundingSourceLabel = 'คณะแพทยศาสตร์';
      } else if ((nuRec.facultyTotalAmount || 0) === 0 && !isFacultyPaid && (nuRec.totalAmount || 0) > 0) {
        fundingSource = 'nu_only';
        fundingSourceLabel = 'ม.นเรศวร';
      } else if (hasNuClaim && (isFacultyPaid || (nuRec.facultyTotalAmount || 0) > 0 || matchedApp)) {
        fundingSource = 'both';
        fundingSourceLabel = 'ทั้ง มน. และ คณะฯ';
      }

      // Amounts
      const nuReward = isNuIneligible ? 0 : (nuRec.rewardAmount || 0);
      const nuPage = isNuIneligible ? 0 : (nuRec.pageChargeAmount || 0);
      const nuTotal = isNuIneligible ? 0 : (nuRec.totalAmount || 0);

      const facReward = nuRec.facultyRewardAmount || matchedApp?.claimedRewardAmount || 0;
      const facPage = nuRec.facultyPageChargeAmount || matchedApp?.approvedPageChargeAmount || 0;
      const facTotal = nuRec.facultyTotalAmount || matchedApp?.totalClaimedAmount || (facReward + facPage);

      // Determine Category
      let category: 'submitted' | 'preparing' | 'historical' = 'historical';
      let categoryLabel = 'เคยส่งเบิกแล้ว';

      if (matchedApp?.status === 'draft') {
        category = 'preparing';
        categoryLabel = 'เตรียมเบิก';
      } else if (isNuPaid || isFacultyPaid || (nuRec.fiscalYear && nuRec.fiscalYear < 2570)) {
        category = 'historical';
        categoryLabel = 'เคยส่งเบิกแล้ว';
      } else if (rawNuStatus.includes('อนุมัติแล้ว') || rawNuStatus.includes('ส่งการเงิน') || rawNuStatus.includes('จัดส่งเอกสาร') || (matchedApp && matchedApp.status !== 'draft')) {
        category = 'submitted';
        categoryLabel = 'รายการที่ส่งเบิก';
      }

      // Status text: User rule "ใช้สถานะ จ่ายเงินแล้ว เหมือนกันทั้ง มน. และคณะ"
      let nuStatusText = 'ยังไม่ได้เบิกจ่าย มน.';
      if (isNuIneligible) {
        nuStatusText = 'ไม่เข้าเกณฑ์ มน.';
      } else if (isNuPaid) {
        nuStatusText = 'จ่ายเงินแล้ว';
      } else if (rawNuStatus.includes('ส่งการเงินรวมศูนย์')) {
        nuStatusText = 'ส่งการเงินรวมศูนย์';
      } else if (rawNuStatus.includes('อนุมัติแล้ว')) {
        nuStatusText = 'อนุมัติแล้ว';
      } else if (rawNuStatus) {
        nuStatusText = rawNuStatus;
      }

      let facultyStatusText = 'ยังไม่ได้เบิกคณะ';
      if (isFacultyPaid) {
        facultyStatusText = 'จ่ายเงินแล้ว';
      } else if (matchedApp) {
        if (matchedApp.status === 'dean_approved') facultyStatusText = 'คณบดีอนุมัติแล้ว';
        else if (matchedApp.status === 'staff_verified') facultyStatusText = 'จนท. ตรวจแล้ว';
        else if (matchedApp.status === 'finance_processing') facultyStatusText = 'งานการเงินจัดทำฎีกา';
        else if (matchedApp.status === 'submitted') facultyStatusText = 'ยื่นคำขอแล้ว';
      }

      list.push({
        id: `unified-nu-${nuRec.id || idx}`,
        articleTitle: nuRec.articleTitle || matchedApp?.articleTitle || 'ไม่ระบุชื่อบทความ',
        researcherName: nuRec.researcherName || matchedApp?.applicantName || 'ไม่ระบุชื่อผู้วิจัย',
        department: nuRec.department || matchedApp?.department || 'คณะแพทยศาสตร์',
        fiscalYear: nuRec.fiscalYear || matchedApp?.fiscalYear || 2569,
        journalName: matchedApp?.journalName,
        quartile: matchedApp?.quartile,
        database: matchedApp?.database,
        doi: matchedApp?.doi,
        category,
        categoryLabel,
        fundingSource,
        fundingSourceLabel,
        nuRewardAmount: nuReward,
        nuPageChargeAmount: nuPage,
        nuTotalAmount: nuTotal,
        facultyRewardAmount: facReward,
        facultyPageChargeAmount: facPage,
        facultyTotalAmount: facTotal,
        grandTotalAmount: nuTotal + facTotal,
        nuStatus: nuStatusText,
        nuPaymentDate: nuRec.paymentDate || undefined,
        nuVoucherNo: nuRec.nuDisbursementVoucherNo || undefined,
        isNuPaid,
        isNuIneligible,
        facultyStatus: facultyStatusText,
        facultyPaymentDate: nuRec.facultyPaymentDate || matchedApp?.paymentDate,
        facultyVoucherNo: nuRec.disbursementVoucherNo || matchedApp?.disbursementVoucherNo,
        isFacultyPaid,
        facultyTrackingNo: nuRec.matchedFacultyTrackingNo || nuRec.facultyTrackingNo || matchedApp?.trackingNo,
        matchedNuId: nuRec.id,
        rawNuRecord: nuRec,
        rawApp: matchedApp,
      });
    });

    // Step B: Process remaining ResearchApplications that were not matched to any nuDisbursements
    applications.forEach((app, idx) => {
      if (matchedAppIds.has(app.id)) return; // Already merged into a row

      const isDraft = app.status === 'draft';
      const isPaid = app.status === 'paid';

      let category: 'submitted' | 'preparing' | 'historical' = isDraft 
        ? 'preparing' 
        : isPaid 
        ? 'historical' 
        : 'submitted';
      let categoryLabel = isDraft 
        ? 'เตรียมเบิก' 
        : isPaid 
        ? 'เคยส่งเบิกแล้ว' 
        : 'รายการที่ส่งเบิก';

      const facReward = app.claimedRewardAmount || 0;
      const facPage = app.approvedPageChargeAmount || 0;
      const facTotal = app.totalClaimedAmount || (facReward + facPage);

      let facStatus = 'ยังไม่ได้เบิกคณะ';
      if (isPaid) {
        facStatus = 'จ่ายเงินแล้ว';
      } else if (isDraft) {
        facStatus = 'เตรียมเบิก';
      } else if (app.status === 'dean_approved') {
        facStatus = 'คณบดีอนุมัติแล้ว';
      } else if (app.status === 'staff_verified') {
        facStatus = 'จนท. ตรวจแล้ว';
      } else if (app.status === 'finance_processing') {
        facStatus = 'งานการเงินจัดทำฎีกา';
      } else {
        facStatus = 'ยื่นคำขอแล้ว';
      }

      list.push({
        id: `unified-app-${app.id || idx}`,
        articleTitle: app.articleTitle || 'ไม่ระบุชื่อบทความ',
        researcherName: app.applicantName || 'ไม่ระบุชื่อผู้วิจัย',
        department: app.department || 'คณะแพทยศาสตร์',
        fiscalYear: app.fiscalYear || 2570,
        journalName: app.journalName,
        quartile: app.quartile,
        database: app.database,
        doi: app.doi,
        category,
        categoryLabel,
        fundingSource: isDraft ? 'draft_plan' : 'faculty_only',
        fundingSourceLabel: isDraft ? 'เตรียมวางแผนเบิก' : 'คณะแพทยศาสตร์',
        nuRewardAmount: 0,
        nuPageChargeAmount: 0,
        nuTotalAmount: 0,
        facultyRewardAmount: facReward,
        facultyPageChargeAmount: facPage,
        facultyTotalAmount: facTotal,
        grandTotalAmount: facTotal,
        nuStatus: isDraft ? '-' : 'ยังไม่ได้ยื่น มน.',
        isNuPaid: false,
        isNuIneligible: false,
        facultyStatus: facStatus,
        facultyPaymentDate: app.paymentDate,
        facultyVoucherNo: app.disbursementVoucherNo,
        isFacultyPaid: isPaid,
        facultyTrackingNo: app.trackingNo,
        rawApp: app,
      });
    });

    return list;
  }, [nuDisbursements, applications]);

  // 2. Role Scoping:
  // "coordinator, admin เห็นทั้งหมด researcher เห็นเฉพาะของตนเอง"
  const scopedArticles = useMemo(() => {
    if (!currentUser) return [];
    if (canViewAll && scopeFilter === 'all') return allMergedArticles;

    const myName = (currentUser.name || '').trim().toLowerCase();
    const myFirst = (currentUser.firstNameTh || '').trim().toLowerCase();
    const myLast = (currentUser.lastNameTh || '').trim().toLowerCase();
    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const myShort = (currentUser.shortNameEn || '').trim().toLowerCase();

    return allMergedArticles.filter(art => {
      const artName = art.researcherName.toLowerCase();
      if (myFirst && myLast && artName.includes(myFirst) && artName.includes(myLast)) return true;
      if (myName && artName.includes(myName)) return true;
      if (myShort && artName.includes(myShort)) return true;
      if (art.rawApp && art.rawApp.email && art.rawApp.email.toLowerCase() === myEmail) return true;
      return false;
    });
  }, [allMergedArticles, currentUser, canViewAll, scopeFilter]);

  // 3. Filtering
  const filteredArticles = useMemo(() => {
    return scopedArticles.filter(art => {
      // Category filter
      if (categoryFilter !== 'all' && art.category !== categoryFilter) return false;

      // Fiscal Year filter
      if (fiscalYearFilter !== 'all' && String(art.fiscalYear) !== fiscalYearFilter) return false;

      // Funding Source filter
      if (fundingFilter !== 'all' && art.fundingSource !== fundingFilter) return false;

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'paid_both' && (!art.isNuPaid || !art.isFacultyPaid)) return false;
        if (statusFilter === 'paid_either' && (!art.isNuPaid && !art.isFacultyPaid)) return false;
        if (statusFilter === 'faculty_only_paid' && (!art.isFacultyPaid || !art.isNuIneligible)) return false;
        if (statusFilter === 'preparing' && art.category !== 'preparing') return false;
        if (statusFilter === 'in_progress' && art.category !== 'submitted') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = art.articleTitle.toLowerCase().includes(q);
        const matchName = art.researcherName.toLowerCase().includes(q);
        const matchDept = art.department.toLowerCase().includes(q);
        const matchTrack = (art.facultyTrackingNo || '').toLowerCase().includes(q);
        const matchVoucher = (art.facultyVoucherNo || '').toLowerCase().includes(q) || (art.nuVoucherNo || '').toLowerCase().includes(q);
        const matchJournal = (art.journalName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchName && !matchDept && !matchTrack && !matchVoucher && !matchJournal) {
          return false;
        }
      }

      return true;
    });
  }, [scopedArticles, categoryFilter, fiscalYearFilter, fundingFilter, statusFilter, searchQuery]);

  // 4. Sorting
  const sortedArticles = useMemo(() => {
    const list = [...filteredArticles];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'fiscalYear') {
        cmp = a.fiscalYear - b.fiscalYear;
      } else if (sortField === 'articleTitle') {
        cmp = a.articleTitle.localeCompare(b.articleTitle, 'th');
      } else if (sortField === 'researcherName') {
        cmp = a.researcherName.localeCompare(b.researcherName, 'th');
      } else if (sortField === 'grandTotalAmount') {
        cmp = a.grandTotalAmount - b.grandTotalAmount;
      } else if (sortField === 'category') {
        cmp = a.category.localeCompare(b.category);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredArticles, sortField, sortDirection]);

  // Handle Sort Click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'fiscalYear' || field === 'grandTotalAmount' ? 'desc' : 'asc');
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = scopedArticles.length;
    const historicalCount = scopedArticles.filter(a => a.category === 'historical').length;
    const submittedCount = scopedArticles.filter(a => a.category === 'submitted').length;
    const preparingCount = scopedArticles.filter(a => a.category === 'preparing').length;

    const sumNu = scopedArticles.reduce((s, a) => s + a.nuTotalAmount, 0);
    const sumFac = scopedArticles.reduce((s, a) => s + a.facultyTotalAmount, 0);
    const sumGrand = scopedArticles.reduce((s, a) => s + a.grandTotalAmount, 0);

    return { total, historicalCount, submittedCount, preparingCount, sumNu, sumFac, sumGrand };
  }, [scopedArticles]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'ลำดับ',
      'หมวดบทความ',
      'ปีงบประมาณ',
      'ชื่อบทความ',
      'อาจารย์นักวิจัย',
      'ภาควิชา',
      'แหล่งเงิน',
      'สถานะ มน.',
      'วันที่โอน มน.',
      'เลขฎีกา/คำสั่งจ่าย มน.',
      'ยอดเงิน มน. (บาท)',
      'สถานะ คณะฯ',
      'เลขฎีกา คณะฯ',
      'วันที่จ่าย คณะฯ',
      'ยอดเงิน คณะฯ (บาท)',
      'รวมทั้งสิ้น (บาท)'
    ];

    const rows = sortedArticles.map((art, idx) => [
      idx + 1,
      `"${art.categoryLabel}"`,
      art.fiscalYear,
      `"${art.articleTitle.replace(/"/g, '""')}"`,
      `"${art.researcherName.replace(/"/g, '""')}"`,
      `"${art.department.replace(/"/g, '""')}"`,
      `"${art.fundingSourceLabel}"`,
      `"${art.nuStatus}"`,
      `"${art.nuPaymentDate || '-'}"`,
      `"${art.nuVoucherNo || '-'}"`,
      art.nuTotalAmount,
      `"${art.facultyStatus}"`,
      `"${art.facultyVoucherNo || '-'}"`,
      `"${art.facultyPaymentDate || '-'}"`,
      art.facultyTotalAmount,
      art.grandTotalAmount
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `iram_master_articles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 font-sans animate-in fade-in duration-200">
      
      {/* 1. Header Banner & Identity */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-md bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-prompt shadow-xs">
              Article Master Table
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
              รวม 3 หมวดบทความ (1 แถวต่อผลงาน)
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-prompt mt-1.5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 shrink-0" />
            <span>ตารางบทความรวม (สถานะการเบิกจ่าย มน. และ คณะ)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            ติดตามสถานะการเบิกจ่ายเงินรางวัลตีพิมพ์และค่าเพจชาร์จ ครอบคลุมทั้งบทความที่เคยส่งเบิกแล้ว (ประวัติ 2568-2569), 
            บทความที่กำลังส่งเบิก และบทความที่เตรียมเบิก โดยผสานแหล่งงบประมาณทั้ง ม.นเรศวร และ คณะแพทยศาสตร์
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenNewSubmission && (
            <button
              onClick={onOpenNewSubmission}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-xs shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ยื่นคำขอใหม่</span>
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 transition-colors shadow-xs"
            title="ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Articles */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium font-prompt">บทความทั้งหมด</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-prompt">
            {metrics.total.toLocaleString()} <span className="text-xs font-normal text-slate-500">เรื่อง</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            รวมทั้งสิ้น {formatBaht(metrics.sumGrand)}
          </div>
        </div>

        {/* Card 2: Historical / Completed Disbursed */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium font-prompt">เคยส่งเบิกแล้ว</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-900 font-prompt">
            {metrics.historicalCount.toLocaleString()} <span className="text-xs font-normal text-emerald-700">เรื่อง</span>
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            เบิกจ่ายเสร็จสิ้น (ปี 68, 69)
          </div>
        </div>

        {/* Card 3: Active Submissions Pipeline */}
        <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/20 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-xs font-medium font-prompt">รายการที่ส่งเบิก</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900 font-prompt">
            {metrics.submittedCount.toLocaleString()} <span className="text-xs font-normal text-blue-700">เรื่อง</span>
          </div>
          <div className="text-[11px] text-blue-700 mt-1">
            อยู่ระหว่างกระบวนการอนุมัติ
          </div>
        </div>

        {/* Card 4: Draft Preparation */}
        <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-medium font-prompt">รายการที่เตรียมเบิก</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-prompt">
            {metrics.preparingCount.toLocaleString()} <span className="text-xs font-normal text-amber-800">เรื่อง</span>
          </div>
          <div className="text-[11px] text-amber-800 mt-1">
            ฉบับร่างในระบบวางแผน
          </div>
        </div>
      </div>

      {/* 3. Control Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Scope Toggle for Admins/Staff */}
          <div className="flex flex-wrap items-center gap-2">
            {!canViewAll ? (
              <div className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>มุมมองนักวิจัย: แสดงบทความของท่าน ({scopedArticles.length} รายการ)</span>
              </div>
            ) : (
              <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs">
                <button
                  onClick={() => setScopeFilter('all')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    scopeFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  บทความทั้งหมด ({allMergedArticles.length})
                </button>
                <button
                  onClick={() => setScopeFilter('my_articles')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    scopeFilter === 'my_articles'
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  บทความของตนเอง
                </button>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              {[
                { id: 'all', label: 'ทุกหมวด' },
                { id: 'historical', label: 'เคยส่งเบิกแล้ว' },
                { id: 'submitted', label: 'กำลังส่งเบิก' },
                { id: 'preparing', label: 'เตรียมเบิก' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อเรื่อง, ผู้วิจัย, ฎีกา, รหัส..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> ตัวกรอง:
          </span>

          {/* Fiscal Year Filter */}
          <select
            value={fiscalYearFilter}
            onChange={(e) => setFiscalYearFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">ทุกปีงบประมาณ</option>
            <option value="2570">ปีงบฯ 2570</option>
            <option value="2569">ปีงบฯ 2569</option>
            <option value="2568">ปีงบฯ 2568</option>
          </select>

          {/* Funding Source Filter */}
          <select
            value={fundingFilter}
            onChange={(e) => setFundingFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">ทุกแหล่งเงินรางวัล</option>
            <option value="both">🌟 ทั้ง มน. และ คณะฯ</option>
            <option value="faculty_only">🏥 คณะแพทยศาสตร์ เท่านั้น</option>
            <option value="nu_only">🏛️ ม.นเรศวร เท่านั้น</option>
            <option value="draft_plan">📝 อยู่ระหว่างวางแผน</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
          >
            <option value="all">ทุกสถานะการเบิกจ่าย</option>
            <option value="paid_both">จ่ายเงินแล้ว ทั้ง 2 ส่วน (มน.+คณะ)</option>
            <option value="paid_either">จ่ายเงินแล้ว (ส่วนใดส่วนหนึ่ง)</option>
            <option value="faculty_only_paid">คณะจ่ายแล้ว (ไม่เข้าเกณฑ์ มน.)</option>
            <option value="in_progress">อยู่ระหว่างดำเนินการเบิกจ่าย</option>
            <option value="preparing">เตรียมเบิก (ร่าง)</option>
          </select>

          {(categoryFilter !== 'all' || fiscalYearFilter !== 'all' || fundingFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('all');
                setFiscalYearFilter('all');
                setFundingFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-amber-700 hover:text-amber-800 text-[11px] font-semibold underline ml-auto cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* 4. Main Master Article Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold uppercase tracking-wider text-[11px] font-prompt select-none">
              <tr>
                <th className="py-3 px-3 w-12 text-center">ลำดับ</th>

                {/* Sortable: หมวด / ปีงบ */}
                <th 
                  onClick={() => handleSort('fiscalYear')}
                  className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-100 transition-colors"
                  title="คลิกจัดเรียงตามปีงบประมาณ"
                >
                  <div className="flex items-center gap-1">
                    <span>หมวด / ปีงบฯ</span>
                    {sortField === 'fiscalYear' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* Sortable: ชื่อบทความวิจัย */}
                <th 
                  onClick={() => handleSort('articleTitle')}
                  className="py-3 px-3 min-w-[280px] cursor-pointer hover:bg-slate-100 transition-colors"
                  title="คลิกจัดเรียงตามชื่อบทความ"
                >
                  <div className="flex items-center gap-1">
                    <span>ชื่อบทความวิจัย / แหล่งเงิน</span>
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
                  className="py-3 px-3 w-44 cursor-pointer hover:bg-slate-100 transition-colors"
                  title="คลิกจัดเรียงตามชื่อผู้วิจัย"
                >
                  <div className="flex items-center gap-1">
                    <span>อาจารย์นักวิจัย / ภาควิชา</span>
                    {sortField === 'researcherName' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-600" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                {/* สถานะ มน. */}
                <th className="py-3 px-3 w-36 text-center">สถานะ มน.</th>

                {/* ยอดเงิน มน. */}
                <th className="py-3 px-3 w-28 text-right">ยอดเงิน มน.</th>

                {/* สถานะ คณะฯ */}
                <th className="py-3 px-3 w-36 text-center bg-purple-50/30">สถานะ คณะฯ</th>

                {/* ยอดเงิน คณะฯ */}
                <th className="py-3 px-3 w-28 text-right bg-purple-50/30">ยอดเงิน คณะฯ</th>

                {/* Sortable: รวมทั้งสิ้น */}
                <th 
                  onClick={() => handleSort('grandTotalAmount')}
                  className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-100 transition-colors bg-amber-50/40"
                  title="คลิกจัดเรียงตามยอดรวมทั้งสิ้น"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>รวมทั้งสิ้น</span>
                    {sortField === 'grandTotalAmount' ? (
                      sortDirection === 'desc' ? <ArrowDown className="w-3.5 h-3.5 text-amber-700" /> : <ArrowUp className="w-3.5 h-3.5 text-amber-700" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-300" />
                    )}
                  </div>
                </th>

                <th className="py-3 px-2 w-16 text-center">ดูข้อมูล</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {sortedArticles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Info className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <span className="font-medium text-sm">ไม่พบบทความที่ตรงกับเงื่อนไขการค้นหา</span>
                    <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองใหม่อีกครั้ง</p>
                  </td>
                </tr>
              ) : (
                sortedArticles.map((art, idx) => {
                  return (
                    <tr key={art.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 1. ลำดับ */}
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* 2. หมวด / ปีงบ */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          {/* Category Badge */}
                          {art.category === 'preparing' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>เตรียมเบิก</span>
                            </span>
                          ) : art.category === 'submitted' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                              <span>กำลังส่งเบิก</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>เคยส่งเบิกแล้ว</span>
                            </span>
                          )}

                          {/* Fiscal Year */}
                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span className="font-semibold text-slate-700 bg-slate-100 px-1 rounded">ปี {art.fiscalYear}</span>
                            {art.facultyTrackingNo && (
                              <span className="text-[9px] text-purple-700 font-mono font-medium truncate max-w-[70px]">
                                {art.facultyTrackingNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 3. ชื่อบทความวิจัย / แหล่งเงิน */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-900 transition-colors">
                          {art.articleTitle}
                        </div>
                        
                        {/* Funding source & journal info badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {/* Funding Source badge */}
                          {art.fundingSource === 'both' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              🌟 ทั้ง มน. และ คณะฯ
                            </span>
                          ) : art.fundingSource === 'faculty_only' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              🏥 คณะแพทยศาสตร์
                            </span>
                          ) : art.fundingSource === 'nu_only' ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              🏛️ ม.นเรศวร
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              📝 วางแผนเตรียมเบิก
                            </span>
                          )}

                          {art.quartile && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              {art.quartile}
                            </span>
                          )}

                          {art.journalName && (
                            <span className="text-[10px] text-slate-500 italic truncate max-w-[200px]" title={art.journalName}>
                              {art.journalName}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. อาจารย์นักวิจัย / ภาควิชา */}
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900 leading-snug">
                          {art.researcherName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                          {art.department}
                        </div>
                      </td>

                      {/* 5. สถานะ มน. */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {art.isNuIneligible ? (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300"
                            title="บทความนี้ไม่เข้าเกณฑ์หรือไม่ได้ขอรับเงินสนับสนุนส่วนของ มน."
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            <span>ไม่เข้าเกณฑ์ มน.</span>
                          </span>
                        ) : art.isNuPaid ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300" title="ยืนยันการจ่ายเงินแล้วจาก ม.นเรศวร">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>จ่ายเงินแล้ว</span>
                            </span>
                            {art.nuPaymentDate && (
                              <span className="text-[10px] text-emerald-800 font-mono font-semibold mt-0.5">
                                ✓ {art.nuPaymentDate}
                              </span>
                            )}
                            {art.nuVoucherNo && (
                              <span className="text-[9px] text-slate-500 font-mono leading-tight">
                                {art.nuVoucherNo}
                              </span>
                            )}
                          </div>
                        ) : art.nuStatus.includes('ส่งการเงิน') ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                            <span>ส่งการเงินรวมศูนย์</span>
                          </span>
                        ) : art.nuStatus.includes('อนุมัติแล้ว') ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>อนุมัติแล้ว</span>
                          </span>
                        ) : art.category === 'preparing' ? (
                          <span className="text-[11px] text-slate-400">-</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                            <span>{art.nuStatus}</span>
                          </span>
                        )}
                      </td>

                      {/* 6. ยอดเงิน มน. */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                        {art.isNuIneligible || art.nuTotalAmount === 0 ? (
                          <span className="text-slate-400 font-normal">-</span>
                        ) : (
                          <span className="text-slate-800">฿{art.nuTotalAmount.toLocaleString()}</span>
                        )}
                      </td>

                      {/* 7. สถานะ คณะฯ (User rule: "ใช้สถานะ จ่ายเงินแล้ว เหมือนกันทั้ง มน. และคณะ") */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap bg-purple-50/20">
                        {art.isFacultyPaid ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>จ่ายเงินแล้ว</span>
                            </span>
                            {art.facultyVoucherNo && (
                              <span className="text-[10px] text-purple-900 font-mono font-semibold mt-0.5" title="เลขที่ฎีกาเบิกจ่ายของคณะแพทยฯ">
                                ฎีกา {art.facultyVoucherNo}
                              </span>
                            )}
                            {art.facultyPaymentDate && (
                              <span className="text-[9px] text-slate-500 font-mono">
                                {art.facultyPaymentDate}
                              </span>
                            )}
                          </div>
                        ) : art.category === 'preparing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span>เตรียมเบิก</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <span>{art.facultyStatus}</span>
                          </span>
                        )}
                      </td>

                      {/* 8. ยอดเงิน คณะฯ */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-950 bg-purple-50/20 whitespace-nowrap">
                        {art.facultyTotalAmount > 0 ? (
                          `฿${art.facultyTotalAmount.toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* 9. ยอดรวมทั้งสิ้น */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 bg-amber-50/30 whitespace-nowrap">
                        {art.grandTotalAmount > 0 ? (
                          `฿${art.grandTotalAmount.toLocaleString()}`
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedArticle(art)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="ดูรายละเอียดข้อมูลการเบิกจ่าย"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary Bar */}
        <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-2 font-mono">
          <div>
            แสดงทั้งหมด <span className="font-bold text-slate-900">{sortedArticles.length}</span> จาก{' '}
            <span className="font-bold text-slate-900">{scopedArticles.length}</span> รายการ
          </div>
          <div className="flex items-center gap-4">
            <div>ยอด มน.: <span className="font-bold text-slate-900">฿{sortedArticles.reduce((s, a) => s + a.nuTotalAmount, 0).toLocaleString()}</span></div>
            <div>ยอด คณะฯ: <span className="font-bold text-purple-900">฿{sortedArticles.reduce((s, a) => s + a.facultyTotalAmount, 0).toLocaleString()}</span></div>
            <div>รวมทั้งสิ้น: <span className="font-bold text-amber-900">฿{sortedArticles.reduce((s, a) => s + a.grandTotalAmount, 0).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* 5. Detail Modal for Selected Article */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                    ปี {selectedArticle.fiscalYear}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                    {selectedArticle.categoryLabel}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                    {selectedArticle.fundingSourceLabel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 font-prompt">
                  รายละเอียดบทความวิจัยและการเบิกจ่าย
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Title */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                ชื่อบทความ / ผลงานวิจัย
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
                {selectedArticle.articleTitle}
              </p>
            </div>

            {/* Researcher & Department */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">อาจารย์นักวิจัย:</span>
                <span className="font-semibold text-slate-900">{selectedArticle.researcherName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">ภาควิชา / หน่วยงาน:</span>
                <span className="font-semibold text-slate-900">{selectedArticle.department}</span>
              </div>
              {selectedArticle.journalName && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[11px]">วารสาร / ระดับ:</span>
                  <span className="font-medium text-slate-800">
                    {selectedArticle.journalName} {selectedArticle.quartile ? `(${selectedArticle.quartile})` : ''}
                  </span>
                </div>
              )}
            </div>

            {/* NU vs Faculty Disbursement Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* NU Card */}
              <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-200/80 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                  <span className="font-bold text-blue-950 font-prompt text-xs flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-700" />
                    <span>ส่วน ม.นเรศวร (DRI NU)</span>
                  </span>
                  <span className="text-[11px] font-bold text-blue-900 font-mono">
                    ฿{selectedArticle.nuTotalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">สถานะ มน.:</span>
                    <span className="font-semibold">{selectedArticle.nuStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่โอน/จ่ายเงิน:</span>
                    <span className="font-mono">{selectedArticle.nuPaymentDate || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เลขฎีกา/คำสั่งจ่าย มน.:</span>
                    <span className="font-mono">{selectedArticle.nuVoucherNo || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-blue-200/50">
                    <span>เงินรางวัล: ฿{selectedArticle.nuRewardAmount.toLocaleString()}</span>
                    <span>เพจชาร์จ: ฿{selectedArticle.nuPageChargeAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Faculty Card */}
              <div className="bg-purple-50/40 rounded-xl p-4 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                  <span className="font-bold text-purple-950 font-prompt text-xs flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-purple-700" />
                    <span>ส่วน คณะแพทยศาสตร์</span>
                  </span>
                  <span className="text-[11px] font-bold text-purple-900 font-mono">
                    ฿{selectedArticle.facultyTotalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-500">สถานะ คณะฯ:</span>
                    <span className="font-semibold">{selectedArticle.facultyStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">เลขที่ฎีกา คณะฯ:</span>
                    <span className="font-mono font-bold text-purple-900">{selectedArticle.facultyVoucherNo || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">วันที่โอน คณะฯ:</span>
                    <span className="font-mono">{selectedArticle.facultyPaymentDate || '-'}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-purple-200/50">
                    <span>เงินรางวัล: ฿{selectedArticle.facultyRewardAmount.toLocaleString()}</span>
                    <span>เพจชาร์จ: ฿{selectedArticle.facultyPageChargeAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs font-prompt">
              <span className="font-semibold text-amber-900">รวมงบประมาณสนับสนุนทั้งสิ้น (มน. + คณะ):</span>
              <span className="text-base font-bold text-amber-950 font-mono">
                ฿{selectedArticle.grandTotalAmount.toLocaleString()}
              </span>
            </div>

            {/* Actions in Modal */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {selectedArticle.rawApp && onPrintApplication && (
                <button
                  onClick={() => {
                    onPrintApplication(selectedArticle.rawApp!);
                    setSelectedArticle(null);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์แบบฟอร์มคำขอ</span>
                </button>
              )}
              {selectedArticle.rawApp && onViewApplication && (
                <button
                  onClick={() => {
                    onViewApplication(selectedArticle.rawApp!);
                    setSelectedArticle(null);
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" />
                  <span>ดูไทม์ไลน์ 12 ขั้นตอน</span>
                </button>
              )}
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
