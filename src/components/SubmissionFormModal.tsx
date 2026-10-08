import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  HelpCircle, 
  DollarSign, 
  Building, 
  Calendar, 
  Info,
  Paperclip,
  Check,
  ShieldCheck,
  UserCheck,
  RefreshCw,
  Lock,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Save,
  BookmarkCheck
} from 'lucide-react';
import { checkArticleDuplicate, DuplicateCheckResult } from '../services/rewardD1Service';
import { 
  ArticleType, 
  AuthorRole, 
  DatabaseName, 
  DocumentAttachment, 
  JournalScope, 
  QuartileRank, 
  RequestType, 
  ResearchApplication,
  UserProfile 
} from '../types';
import { 
  calculateFacultyReward, 
  formatBaht, 
  formatThaiCitizenId, 
  formatKrungsriAccountNo, 
  formatPageChargeInput, 
  parsePageCharge,
  getTrackingPrefix,
  generateNextTrackingNo
} from '../data/regulations';
import { OFFICIAL_WORKFLOW_STEPS_DEF } from '../data/initialData';
import { getStoredUserProfile, saveStoredUserProfile } from '../data/userProfile';

interface SubmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newApp: Partial<ResearchApplication>, asDraft?: boolean) => void;
  existingApplications?: ResearchApplication[];
  currentUser?: UserProfile;
  initialData?: Partial<ResearchApplication> | null;
}

const DEPARTMENTS = [
  'ภาควิชาศัลยศาสตร์',
  'ภาควิชาอายุรศาสตร์',
  'ภาควิชากุมารเวชศาสตร์',
  'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
  'ภาควิชาออร์โธปิดิกส์',
  'ภาควิชาพยาธิวิทยา',
  'ภาควิชารังสีวิทยา',
  'ภาควิชาวิสัญญีวิทยา',
  'ภาควิชาจักษุวิทยา',
  'ภาควิชาโสต ศอ นาสิกวิทยา',
  'ภาควิชาจิตเวชศาสตร์',
  'ภาควิชาเวชศาสตร์ชุมชน',
  'ภาควิชาเวชศาสตร์ครอบครัว',
  'ภาควิชากายวิภาคศาสตร์',
  'ภาควิชาสรีรวิทยา',
  'ภาควิชาชีวเคมี',
  'ภาควิชาเภสัชวิทยา',
  'ภาควิชาจุลชีววิทยาและปรสิตวิทยา'
];

export function normalizeDepartment(dept?: string | null): string {
  if (!dept || typeof dept !== 'string') return '-';
  const trimmed = dept.trim();
  if (!trimmed || trimmed === '-' || trimmed === 'null' || trimmed === 'undefined') return '-';

  const lower = trimmed.toLowerCase();

  const englishToThaiMap: Record<string, string> = {
    'pediatrics': 'ภาควิชากุมารเวชศาสตร์',
    'department of pediatrics': 'ภาควิชากุมารเวชศาสตร์',
    'surgery': 'ภาควิชาศัลยศาสตร์',
    'department of surgery': 'ภาควิชาศัลยศาสตร์',
    'medicine': 'ภาควิชาอายุรศาสตร์',
    'internal medicine': 'ภาควิชาอายุรศาสตร์',
    'department of medicine': 'ภาควิชาอายุรศาสตร์',
    'department of internal medicine': 'ภาควิชาอายุรศาสตร์',
    'obstetrics and gynecology': 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
    'department of obstetrics and gynecology': 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
    'obstetrics': 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
    'gynecology': 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
    'ob-gyn': 'ภาควิชาสูติศาสตร์-นรีเวชวิทยา',
    'orthopaedics': 'ภาควิชาออร์โธปิดิกส์',
    'orthopedics': 'ภาควิชาออร์โธปิดิกส์',
    'department of orthopaedics': 'ภาควิชาออร์โธปิดิกส์',
    'department of orthopedics': 'ภาควิชาออร์โธปิดิกส์',
    'pathology': 'ภาควิชาพยาธิวิทยา',
    'department of pathology': 'ภาควิชาพยาธิวิทยา',
    'radiology': 'ภาควิชารังสีวิทยา',
    'department of radiology': 'ภาควิชารังสีวิทยา',
    'anesthesiology': 'ภาควิชาวิสัญญีวิทยา',
    'anaesthesiology': 'ภาควิชาวิสัญญีวิทยา',
    'department of anesthesiology': 'ภาควิชาวิสัญญีวิทยา',
    'ophthalmology': 'ภาควิชาจักษุวิทยา',
    'department of ophthalmology': 'ภาควิชาจักษุวิทยา',
    'otolaryngology': 'ภาควิชาโสต ศอ นาสิกวิทยา',
    'department of otolaryngology': 'ภาควิชาโสต ศอ นาสิกวิทยา',
    'ent': 'ภาควิชาโสต ศอ นาสิกวิทยา',
    'psychiatry': 'ภาควิชาจิตเวชศาสตร์',
    'department of psychiatry': 'ภาควิชาจิตเวชศาสตร์',
    'community medicine': 'ภาควิชาเวชศาสตร์ชุมชน',
    'department of community medicine': 'ภาควิชาเวชศาสตร์ชุมชน',
    'family medicine': 'ภาควิชาเวชศาสตร์ครอบครัว',
    'department of family medicine': 'ภาควิชาเวชศาสตร์ครอบครัว',
    'anatomy': 'ภาควิชากายวิภาคศาสตร์',
    'department of anatomy': 'ภาควิชากายวิภาคศาสตร์',
    'physiology': 'ภาควิชาสรีรวิทยา',
    'department of physiology': 'ภาควิชาสรีรวิทยา',
    'biochemistry': 'ภาควิชาชีวเคมี',
    'department of biochemistry': 'ภาควิชาชีวเคมี',
    'pharmacology': 'ภาควิชาเภสัชวิทยา',
    'department of pharmacology': 'ภาควิชาเภสัชวิทยา',
    'microbiology and parasitology': 'ภาควิชาจุลชีววิทยาและปรสิตวิทยา',
    'department of microbiology and parasitology': 'ภาควิชาจุลชีววิทยาและปรสิตวิทยา',
    'microbiology': 'ภาควิชาจุลชีววิทยาและปรสิตวิทยา',
    'parasitology': 'ภาควิชาจุลชีววิทยาและปรสิตวิทยา',
    'secretary office': 'สำนักงานเลขานุการ คณะแพทยศาสตร์',
    'office of secretary': 'สำนักงานเลขานุการ คณะแพทยศาสตร์',
  };

  if (englishToThaiMap[lower]) {
    return englishToThaiMap[lower];
  }

  for (const deptName of DEPARTMENTS) {
    if (deptName === trimmed || deptName.replace('ภาควิชา', '') === trimmed) {
      return deptName;
    }
  }

  return trimmed;
}

export const SubmissionFormModal: React.FC<SubmissionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingApplications,
  currentUser,
  initialData,
}) => {
  // Active user profile (loaded from authentication / stored local profile)
  const activeUserProfile = useMemo(() => {
    return currentUser || getStoredUserProfile();
  }, [currentUser]);

  const isEditingDraft = Boolean(initialData && (initialData.status === 'draft' || initialData.id));

  // Fiscal Year & Tracking Number states (Default to 2570 / AWP70-XXX)
  const [fiscalYear, setFiscalYear] = useState<number>(2570);
  const currentTrackingPrefix = useMemo(() => getTrackingPrefix(fiscalYear), [fiscalYear]);

  // Generate sequence tracking number based on fiscal year and existing applications
  const autoGeneratedTrackingNo = useMemo(() => {
    const existingTrackingNos = (existingApplications || []).map((a) => a.trackingNo);
    return generateNextTrackingNo(fiscalYear, existingTrackingNos);
  }, [fiscalYear, existingApplications]);

  const [trackingNoInput, setTrackingNoInput] = useState<string>(autoGeneratedTrackingNo);

  // When autoGeneratedTrackingNo changes, update input
  useEffect(() => {
    if (!initialData?.trackingNo || initialData.trackingNo === 'DRAFT') {
      setTrackingNoInput(autoGeneratedTrackingNo);
    }
  }, [autoGeneratedTrackingNo, initialData]);

  // Form states - Initialized with logged-in user profile (PDPA compliant, no hardcoded real researcher data)
  const [applicantName, setApplicantName] = useState<string>(activeUserProfile.name || '');
  const [academicPosition, setAcademicPosition] = useState<string>(activeUserProfile.academicPosition || '');
  const [department, setDepartment] = useState<string>(normalizeDepartment(activeUserProfile.department));
  const [phone, setPhone] = useState<string>(activeUserProfile.phone || '');
  const [email, setEmail] = useState<string>(activeUserProfile.email || '');
  const [bankName, setBankName] = useState<string>(activeUserProfile.bankName || 'ธนาคารกรุงศรีอยุธยา');
  const [bankAccountNo, setBankAccountNo] = useState<string>(activeUserProfile.bankAccountNo || '');
  const [idCardNo, setIdCardNo] = useState<string>(activeUserProfile.idCardNo || '');

  // Department options including custom profile department if present
  const departmentOptions = useMemo(() => {
    const list = [...DEPARTMENTS];
    if (department && department !== '-' && !list.includes(department)) {
      list.unshift(department);
    }
    return list;
  }, [department]);

  // PDPA & Profile preference states
  const [pdpaConsentAccepted, setPdpaConsentAccepted] = useState<boolean>(false);
  const [rememberProfile, setRememberProfile] = useState<boolean>(true);
  const [profileReloadedNotice, setProfileReloadedNotice] = useState<boolean>(false);

  // Reload data from active profile
  const handleReloadFromUserProfile = () => {
    const freshProfile = currentUser || getStoredUserProfile();
    setApplicantName(freshProfile.name || '');
    setAcademicPosition(freshProfile.academicPosition || '');
    setDepartment(normalizeDepartment(freshProfile.department));
    setPhone(freshProfile.phone || '');
    setEmail(freshProfile.email || '');
    setBankName(freshProfile.bankName || 'ธนาคารกรุงศรีอยุธยา');
    setBankAccountNo(freshProfile.bankAccountNo || '');
    setIdCardNo(freshProfile.idCardNo || '');
    setProfileReloadedNotice(true);
    setTimeout(() => setProfileReloadedNotice(false), 3000);
  };

  const [requestType, setRequestType] = useState<RequestType>('reward_only');
  const [articleTitle, setArticleTitle] = useState('');
  const [journalName, setJournalName] = useState('');
  const [journalScope, setJournalScope] = useState<JournalScope>('international');
  const [database, setDatabase] = useState<DatabaseName>('Web of Science');
  const [quartile, setQuartile] = useState<QuartileRank>('Q2');
  const [isTier1Top10, setIsTier1Top10] = useState(false);
  const [authorRole, setAuthorRole] = useState<AuthorRole>('first_author');
  const [articleType, setArticleType] = useState<ArticleType>('research_article');

  const [issn, setIssn] = useState('');
  const [doi, setDoi] = useState('');
  const [volumeIssue, setVolumeIssue] = useState('');
  const [databaseYear, setDatabaseYear] = useState<string>('2025');
  const [vol, setVol] = useState<string>('');
  const [no, setNo] = useState<string>('');
  const [publishMonth, setPublishMonth] = useState<string>('' );
  const [publishYear, setPublishYear] = useState<string>('2026');
  const [pages, setPages] = useState<string>('');
  const [publishedDate, setPublishedDate] = useState('2026-02-15');
  const [pageChargeInput, setPageChargeInput] = useState<string>('125,216.54');
  const [claimedPageCharge, setClaimedPageCharge] = useState<number>(125216.54);
  const [pageChargePaidDate, setPageChargePaidDate] = useState<string>('2026-02-15');

  const handlePublishedDateChange = (dateVal: string) => {
    setPublishedDate(dateVal);
    if (dateVal) {
      const parsedYear = new Date(dateVal).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1900) {
        setPublishYear(parsedYear.toString());
      }
    }
  };

  // Real-time Duplicate Check States (D1 Cloudflare)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);

  // Debounced live check when DOI or articleTitle changes
  useEffect(() => {
    const cleanDoi = doi.trim();
    const cleanTitle = articleTitle.trim();

    if (!cleanDoi && cleanTitle.length < 10) {
      setDuplicateResult(null);
      setIsCheckingDuplicate(false);
      return;
    }

    setIsCheckingDuplicate(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkArticleDuplicate(cleanDoi, cleanTitle);
        setDuplicateResult(res);
      } catch (e) {
        console.error('Duplicate check error:', e);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [doi, articleTitle]);

  // Mandatory regulation compliance checkboxes - เริ่มต้นเป็น false (unchecked) ต้องเลือกทุกข้อจึงจะส่งได้
  // Mandatory regulation compliance checkboxes - เริ่มต้นเป็น false (unchecked) ต้องเลือกทุกข้อจึงจะส่งได้
  const [medNuAffiliationDeclared, setMedNuAffiliationDeclared] = useState(false);
  const [notForGraduation, setNotForGraduation] = useState(false);
  const [within24Months, setWithin24Months] = useState(false);
  const [notPreviouslyClaimed, setNotPreviouslyClaimed] = useState(false);

  // คำนวณความครบถ้วนของคุณสมบัติ และเงื่อนไข Disable ปุ่มบันทึก (ตามเงื่อนไขข้อ 3 และ PDPA ข้อ 5)
  const complianceCount = useMemo(() => {
    return [medNuAffiliationDeclared, notForGraduation, within24Months, notPreviouslyClaimed].filter(Boolean).length;
  }, [medNuAffiliationDeclared, notForGraduation, within24Months, notPreviouslyClaimed]);

  const allCompliant = complianceCount === 4;
  const isSubmitDisabled = !allCompliant || !pdpaConsentAccepted || (duplicateResult?.isDuplicate ?? false) || isCheckingDuplicate;

  // Uploaded files simulation
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: boolean }>({
    reprint: true,
    quartileProof: true,
    invoice: true,
    idCard: true,
    bankBook: true,
  });

  // Synchronize form when modal opens or initialData / currentUser changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        if (initialData.fiscalYear) setFiscalYear(initialData.fiscalYear);
        if (initialData.trackingNo && initialData.trackingNo !== 'DRAFT') {
          setTrackingNoInput(initialData.trackingNo);
        }
        setApplicantName(initialData.applicantName || activeUserProfile.name || '');
        setAcademicPosition(initialData.academicPosition || activeUserProfile.academicPosition || '');
        setDepartment(normalizeDepartment(initialData.department || activeUserProfile.department));
        setPhone(initialData.phone || activeUserProfile.phone || '');
        setEmail(initialData.email || activeUserProfile.email || '');
        setBankName(initialData.bankName || activeUserProfile.bankName || 'ธนาคารกรุงศรีอยุธยา');
        setBankAccountNo(initialData.bankAccountNo || activeUserProfile.bankAccountNo || '');
        setIdCardNo(initialData.idCardNo || activeUserProfile.idCardNo || '');

        setRequestType(initialData.requestType || 'reward_only');
        setArticleTitle(initialData.articleTitle || '');
        setJournalName(initialData.journalName || '');
        setJournalScope(initialData.journalScope || 'international');
        setDatabase(initialData.database || 'Web of Science');
        setQuartile(initialData.quartile || 'Q2');
        setIsTier1Top10(Boolean(initialData.isTier1Top10));
        setAuthorRole(initialData.authorRole || 'first_author');
        setArticleType(initialData.articleType || 'research_article');
        setIssn(initialData.issn || '');
        setDoi(initialData.doi || '');
        setVolumeIssue(initialData.volumeIssue || '');
        setDatabaseYear(initialData.databaseYear || '2025');
        setVol(initialData.vol || '');
        setNo(initialData.no || '');
        setPublishMonth(initialData.publishMonth || '');
        setPublishYear(initialData.publishYear || '2026');
        setPages(initialData.pages || '');
        setPublishedDate(initialData.publishedDate || new Date().toISOString().split('T')[0]);
        setClaimedPageCharge(initialData.claimedPageChargeAmount || 0);
        setPageChargeInput(formatPageChargeInput(initialData.claimedPageChargeAmount || 0));
        setPageChargePaidDate(initialData.pageChargePaidDate || '');

        setMedNuAffiliationDeclared(Boolean(initialData.medNuAffiliationDeclared));
        setNotForGraduation(Boolean(initialData.notForGraduation));
        setWithin24Months(Boolean(initialData.within24Months));
        setNotPreviouslyClaimed(true);
        setPdpaConsentAccepted(Boolean(initialData.pdpaConsentAccepted));
      } else {
        const freshProfile = currentUser || getStoredUserProfile();
        if (freshProfile) {
          setApplicantName(freshProfile.name || '');
          setAcademicPosition(freshProfile.academicPosition || '');
          setDepartment(normalizeDepartment(freshProfile.department));
          setPhone(freshProfile.phone || '');
          setEmail(freshProfile.email || '');
          setBankName(freshProfile.bankName || 'ธนาคารกรุงศรีอยุธยา');
          setBankAccountNo(freshProfile.bankAccountNo || '');
          setIdCardNo(freshProfile.idCardNo || '');
        }
        setArticleTitle('');
        setJournalName('');
        setDoi('');
        setIssn('');
        setMedNuAffiliationDeclared(false);
        setNotForGraduation(false);
        setWithin24Months(false);
        setNotPreviouslyClaimed(false);
        setPdpaConsentAccepted(false);
      }
    }
  }, [isOpen, initialData, currentUser]);

  // Dynamic calculation based on current inputs
  const calculation = useMemo(() => {
    return calculateFacultyReward({
      journalScope,
      database,
      quartile,
      isTier1Top10,
      authorRole,
      articleType,
      claimedPageCharge: requestType === 'reward_only' ? 0 : claimedPageCharge,
      alreadyUsedQuotaInYear: 0,
    });
  }, [journalScope, database, quartile, isTier1Top10, authorRole, articleType, claimedPageCharge, requestType]);

  // Handle Fiscal Year switch: automatically adapt prefix (e.g. AWP69 -> AWP70)
  const handleFiscalYearChange = (newYear: number) => {
    setFiscalYear(newYear);
    const oldPrefix = getTrackingPrefix(fiscalYear);
    const newPrefix = getTrackingPrefix(newYear);

    // If input begins with old prefix, swap it cleanly
    if (trackingNoInput.startsWith(oldPrefix)) {
      const suffix = trackingNoInput.substring(oldPrefix.length);
      setTrackingNoInput(`${newPrefix}${suffix}`);
    } else {
      const existingTrackingNos = (existingApplications || []).map((a) => a.trackingNo);
      setTrackingNoInput(generateNextTrackingNo(newYear, existingTrackingNos));
    }
  };

  const handleResetTrackingNo = () => {
    const existingTrackingNos = (existingApplications || []).map((a) => a.trackingNo);
    setTrackingNoInput(generateNextTrackingNo(fiscalYear, existingTrackingNos));
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!articleTitle.trim()) {
      alert('กรุณากรอกชื่อบทความวิจัยก่อนทำการบันทึกร่างเตรียมเบิก');
      return;
    }

    if (rememberProfile) {
      saveStoredUserProfile({
        name: applicantName,
        academicPosition,
        department,
        phone,
        email,
        bankName,
        bankAccountNo,
        idCardNo,
      });
    }

    const generatedId = initialData?.id || `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const today = new Date().toISOString().split('T')[0];

    const draftApp: Partial<ResearchApplication> = {
      ...(initialData || {}),
      id: generatedId,
      trackingNo: initialData?.trackingNo && initialData.trackingNo !== 'DRAFT' ? initialData.trackingNo : 'DRAFT',
      fiscalYear,
      createdAt: initialData?.createdAt || today,
      updatedAt: today,
      applicantName: applicantName || activeUserProfile.name || 'นักวิจัย',
      academicPosition,
      department,
      phone,
      email: email || activeUserProfile.email || '',
      bankAccountNo,
      bankName,
      idCardNo,
      pdpaConsentAccepted,
      pdpaConsentDate: pdpaConsentAccepted ? new Date().toISOString() : undefined,
      requestType,
      articleTitle: articleTitle.trim(),
      journalName: journalName.trim(),
      journalScope,
      database,
      databaseYear: databaseYear.trim() || '2025',
      quartile,
      isTier1Top10,
      authorRole,
      articleType,
      issn,
      doi,
      vol: vol.trim(),
      no: no.trim(),
      publishMonth: publishMonth.trim(),
      publishYear: publishYear.trim(),
      pages: pages.trim(),
      volumeIssue: volumeIssue.trim() || `Vol ${vol.trim() || '-'} No ${no.trim() || '-'} Month ${publishMonth.trim() || '-'} Year ${publishYear.trim() || '-'} pages: ${pages.trim() || '-'}`,
      publishedDate,
      within24Months,
      notForGraduation,
      medNuAffiliationDeclared,
      claimedRewardAmount: requestType === 'page_charge_only' ? 0 : calculation.rewardAmount,
      claimedPageChargeAmount: requestType === 'reward_only' ? 0 : claimedPageCharge,
      approvedPageChargeAmount: requestType === 'reward_only' ? 0 : calculation.approvedPageCharge,
      pageChargePaidDate: requestType === 'reward_only' ? undefined : pageChargePaidDate,
      totalClaimedAmount: requestType === 'reward_only' 
        ? calculation.rewardAmount 
        : requestType === 'page_charge_only'
        ? calculation.approvedPageCharge
        : (calculation.rewardAmount + calculation.approvedPageCharge),
      currentStep: 1,
      status: 'draft',
      paymentStatus: 'unpaid',
      attachments: initialData?.attachments || [
        {
          id: 'att-draft-1',
          title: 'สำเนา Reprint บทความวิจัย',
          type: 'reprint',
          fileName: `${journalName.substring(0, 15) || 'paper'}_reprint.pdf`,
          fileSize: '2.1 MB',
          uploadedAt: today,
          verified: false,
        }
      ]
    };

    onSubmit(draftApp, true);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ตรวจสอบการรับรองคุณสมบัติต้องเลือกทั้งหมด
    if (!allCompliant) {
      alert('กรุณาตรวจสอบและยืนยันคุณสมบัติผู้ขอรับทุนทุกข้อ (หัวข้อ 3) ก่อนส่งแบบคำขอ');
      return;
    }

    if (!pdpaConsentAccepted) {
      alert('กรุณาให้ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA Consent) ก่อนส่งแบบคำขอ');
      return;
    }

    if (!department || department === '-') {
      alert('กรุณาระบุสังกัดของผู้ขอรับทุนให้ถูกต้องก่อนส่งแบบคำขอ');
      return;
    }

    if (duplicateResult?.isDuplicate) {
      alert(`ไม่สามารถส่งคำขอได้: ${duplicateResult.message}`);
      return;
    }

    if (!articleTitle.trim() || !journalName.trim()) {
      alert('กรุณากรอกชื่อบทความวิจัย และชื่อวารสารให้ครบถ้วน');
      return;
    }

    if (!calculation.eligible) {
      alert(calculation.ineligibilityReason || 'ข้อมูลไม่ผ่านเกณฑ์การขอรับทุน');
      return;
    }

    // Save as default profile for next time if opted in
    if (rememberProfile) {
      saveStoredUserProfile({
        name: applicantName,
        academicPosition,
        department,
        phone,
        email,
        bankName,
        bankAccountNo,
        idCardNo,
      });
    }

    const generatedId = (initialData?.id && !initialData.id.startsWith('draft-'))
      ? initialData.id
      : `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const finalTrackingNo = (trackingNoInput.trim() && trackingNoInput.trim() !== 'DRAFT')
      ? trackingNoInput.trim()
      : autoGeneratedTrackingNo;
    const today = new Date().toISOString().split('T')[0];

    const newApp: Partial<ResearchApplication> = {
      ...(initialData || {}),
      id: generatedId,
      trackingNo: finalTrackingNo,
      fiscalYear,
      createdAt: initialData?.createdAt || today,
      updatedAt: today,
      applicantName,
      academicPosition,
      department,
      phone,
      email,
      bankAccountNo,
      bankName,
      idCardNo,
      pdpaConsentAccepted: true,
      pdpaConsentDate: new Date().toISOString(),
      requestType,
      articleTitle,
      journalName,
      journalScope,
      database,
      databaseYear: databaseYear.trim() || '2025',
      quartile,
      isTier1Top10,
      authorRole,
      articleType,
      issn,
      doi,
      vol: vol.trim(),
      no: no.trim(),
      publishMonth: publishMonth.trim(),
      publishYear: publishYear.trim(),
      pages: pages.trim(),
      volumeIssue: volumeIssue.trim() || `Vol ${vol.trim() || '-'} No ${no.trim() || '-'} Month ${publishMonth.trim() || '-'} Year ${publishYear.trim() || '-'} pages: ${pages.trim() || '-'}`,
      publishedDate,
      within24Months,
      notForGraduation,
      medNuAffiliationDeclared,
      claimedRewardAmount: requestType === 'page_charge_only' ? 0 : calculation.rewardAmount,
      claimedPageChargeAmount: requestType === 'reward_only' ? 0 : claimedPageCharge,
      approvedPageChargeAmount: requestType === 'reward_only' ? 0 : calculation.approvedPageCharge,
      pageChargePaidDate: requestType === 'reward_only' ? undefined : pageChargePaidDate,
      totalClaimedAmount: requestType === 'reward_only' 
        ? calculation.rewardAmount 
        : requestType === 'page_charge_only'
        ? calculation.approvedPageCharge
        : (calculation.rewardAmount + calculation.approvedPageCharge),
      currentStep: 1,
      status: 'submitted',
      paymentStatus: 'unpaid',
      attachments: initialData?.attachments && initialData.attachments.length > 0 ? initialData.attachments : [
        {
          id: 'att-user-1',
          title: 'สำเนา Reprint บทความวิจัย',
          type: 'reprint',
          fileName: `${journalName.substring(0, 15)}_reprint.pdf`,
          fileSize: '2.1 MB',
          uploadedAt: new Date().toISOString().split('T')[0],
          verified: false,
        },
        {
          id: 'att-user-2',
          title: 'เอกสารรับรอง Quartile จากฐานข้อมูล',
          type: 'quartile_proof',
          fileName: `${database}_proof.pdf`,
          fileSize: '750 KB',
          uploadedAt: new Date().toISOString().split('T')[0],
          verified: false,
        }
      ]
    };

    onSubmit(newApp, false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-prompt flex items-center gap-2">
              <span>คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</span>
              <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono">
                {currentTrackingPrefix}
              </span>
              {isEditingDraft && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                  <BookmarkCheck className="w-3 h-3 text-emerald-400" />
                  ร่างเตรียมเบิก (Draft)
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white font-prompt flex items-center gap-2">
              <span>{isEditingDraft ? 'แก้ไขข้อมูลบทความเตรียมเบิกรางวัล' : `แบบคำขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย (${currentTrackingPrefix})`}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          
          {/* Section 0: กำหนดปีงบประมาณและเลขที่ติดตาม (Dynamic Fiscal Year & AWP Prefix) */}
          <div className="bg-gradient-to-r from-blue-50/90 via-amber-50/40 to-slate-50 p-4 rounded-xl border border-blue-200/90 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-blue-200/70 pb-2.5">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-2 font-prompt">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                  ★
                </span>
                <span>ปีงบประมาณและเลขที่ติดตามคำขอ (Fiscal Year & Tracking No.)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 font-medium">รหัสนำหน้าตามปีงบ:</span>
                <span className="font-mono font-bold text-xs bg-blue-700 text-white px-2.5 py-0.5 rounded-md shadow-sm">
                  {currentTrackingPrefix}-XXX
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  ปีงบประมาณ (พ.ศ.) *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={fiscalYear}
                    onChange={(e) => handleFiscalYearChange(Number(e.target.value))}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value={2570}>ปีงบประมาณ 2570 (AWP70-XXX)</option>
                    <option value={2569}>ปีงบประมาณ 2569 (AWP69-XXX)</option>
                    <option value={2568}>ปีงบประมาณ 2568 (AWP68-XXX)</option>
                    <option value={2571}>ปีงบประมาณ 2571 (AWP71-XXX)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  เมื่อเปลี่ยนปีงบประมาณ รหัสนำหน้าจะเปลี่ยนเป็น <strong className="text-blue-800">{currentTrackingPrefix}-</strong> ทันที
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center justify-between">
                  <span>เลขที่ติดตามคำขอ (Tracking No.) *</span>
                  <span className="text-[10px] text-blue-700 font-medium">ปรับเปลี่ยนได้ตามต้องการ</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={trackingNoInput}
                    onChange={(e) => setTrackingNoInput(e.target.value)}
                    placeholder={`เช่น ${currentTrackingPrefix}-001`}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleResetTrackingNo}
                    className="px-2.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[11px] font-medium transition-colors shrink-0"
                    title="สร้างเลขลำดับถัดไปใหม่อัตโนมัติ"
                  >
                    รีเซ็ตลำดับ
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  ตัวอย่าง: ปี 2569 ใช้ <strong>AWP69-XXX</strong> | ปี 2570 ใช้ <strong>AWP70-XXX</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: ข้อมูลนักวิจัยผู้ขอรับทุน */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <span className="font-bold text-slate-900 text-sm font-prompt">
                  ข้อมูลผู้ขอรับทุนสนับสนุน (ส่วนของผู้รับทุน)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ดึงจากบัญชีผู้ล็อกอิน (PDPA Verified)
                </span>
                <button
                  type="button"
                  onClick={handleReloadFromUserProfile}
                  className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                  title="รีโหลดข้อมูลจากบัญชีล็อกอินปัจจุบัน"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>ดึงข้อมูลอีกครั้ง</span>
                </button>
              </div>
            </div>

            {/* Notification if reloaded */}
            {profileReloadedNotice && (
              <div className="p-2 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>ดึงข้อมูลตั้งต้นจากบัญชีล็อกอินเรียบร้อยแล้ว</span>
              </div>
            )}

            {/* SSO Info Bar */}
            <div className="p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50/60 rounded-lg border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  เชื่อมต่อข้อมูลผู้ใช้งาน: <strong className="text-blue-950 font-mono">{email}</strong>
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer text-[11px]">
                <input
                  type="checkbox"
                  checked={rememberProfile}
                  onChange={(e) => setRememberProfile(e.target.checked)}
                  className="text-blue-600 rounded focus:ring-blue-500"
                />
                <span>บันทึกเป็นโปรไฟล์ตั้งต้นของฉัน</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อ - สกุล (พร้อมคำนำหน้า)*</label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ตำแหน่งทางวิชาการ</label>
                <input
                  type="text"
                  value={academicPosition}
                  onChange={(e) => setAcademicPosition(e.target.value)}
                  placeholder="เช่น ผู้ช่วยศาสตราจารย์"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">สังกัด*</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium ${
                    department === '-' ? 'border-amber-400 text-slate-400' : 'border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="-">- ไม่ระบุ / ไม่มีข้อมูลในโปรไฟล์ -</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
                {department === '-' && (
                  <p className="text-[11px] text-amber-700 mt-0.5">⚠ กรุณาเลือกสังกัดของท่าน หรืออัปเดตในโปรไฟล์</p>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">เบอร์โทรศัพท์ภายใน*</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เช่น 5588"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">อีเมลมหาวิทยาลัย (@nu.ac.th)*</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">เลขประจำตัวประชาชน*</label>
                  <span className="text-[10px] text-slate-400 font-mono">จัดรูปแบบอัตโนมัติ</span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={17}
                  inputMode="numeric"
                  placeholder="x-xxxx-xxxxx-xx-x"
                  value={idCardNo}
                  onChange={(e) => setIdCardNo(formatThaiCitizenId(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 bg-blue-50/60 p-3 rounded-lg border border-blue-200 space-y-2.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-blue-200">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-blue-900">บัญชีรับโอนเงิน</span>
                  <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">ดึงจากโปรไฟล์ / แก้ไขได้</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">ธนาคาร*</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded text-xs font-medium text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="ธนาคารกรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา (BAY)</option>
                      <option value="ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร">ธนาคารกรุงศรีอยุธยา สาขา มน. (BAY)</option>
                      <option value="ธนาคารกรุงไทย">ธนาคารกรุงไทย (KTB)</option>
                      <option value="ธนาคารไทยพาณิชย์">ธนาคารไทยพาณิชย์ (SCB)</option>
                      <option value="ธนาคารกสิกรไทย">ธนาคารกสิกรไทย (KBANK)</option>
                      <option value="ธนาคารกรุงเทพ">ธนาคารกรุงเทพ (BBL)</option>
                      <option value="ธนาคารออมสิน">ธนาคารออมสิน (GSB)</option>
                      <option value="ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร">ธนาคาร ธ.ก.ส. (BAAC)</option>
                      <option value="อื่นๆ">ธนาคารอื่นๆ (โปรดระบุในช่องเลขบัญชี)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">เลขที่บัญชี*</label>
                    <input
                      type="text"
                      required
                      maxLength={20}
                      inputMode="numeric"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(formatKrungsriAccountNo(e.target.value))}
                      placeholder={
                        bankName.startsWith('ธนาคารกรุงศรี') ? 'xxx-x-xxxxx-x' :
                        bankName === 'ธนาคารกรุงไทย' ? 'xxx-x-xxxxx-x' :
                        'เช่น 123-4-56789-0'
                      }
                      className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded text-xs font-mono font-bold text-blue-950 tracking-wider focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลการตีพิมพ์และการคำนวณ */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2 font-prompt">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
              <span>ข้อมูลบทความวิชาการ และระดับวารสาร (คำนวณเงินอัตโนมัติ)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block font-medium text-slate-700 mb-1">ประเภททุนที่ขอรับ*</label>
                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      checked={requestType === 'reward_only'}
                      onChange={() => setRequestType('reward_only')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-semibold text-slate-800">ขอเงินรางวัล</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      checked={requestType === 'page_charge_only'}
                      onChange={() => setRequestType('page_charge_only')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>ขอค่าเพจชาร์จ (Page Charge)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="requestType"
                      checked={requestType === 'both'}
                      onChange={() => setRequestType('both')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>ขอค่าเพจชาร์จและเงินรางวัล (ทั้ง 2 รายการ)</span>
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700">ชื่อบทความวิชาการ (Manuscript Title)*</label>
                  {isCheckingDuplicate && (
                    <span className="flex items-center gap-1 text-[11px] text-blue-600 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      กำลังตรวจสอบความซ้ำซ้อนใน D1...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="เช่น Laparoscopic hepatectomy is feasible for patients diagnosed with..."
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs focus:ring-2 focus:outline-none ${
                    duplicateResult?.isDuplicate 
                      ? 'border-rose-400 bg-rose-50/50 text-rose-950 focus:ring-rose-500' 
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  DOI (Digital Object Identifier)
                </label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="เช่น 10.1007/s00464-023-..."
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-xs font-mono focus:ring-2 focus:outline-none ${
                    duplicateResult?.isDuplicate 
                      ? 'border-rose-400 bg-rose-50/50 text-rose-950 focus:ring-rose-500' 
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
              </div>

              {/* Real-time Duplicate Status Banner */}
              <div className="sm:col-span-3">
                {duplicateResult?.isDuplicate ? (
                  <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-2.5 text-rose-900 shadow-sm animate-shake">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-bold text-rose-950 flex items-center gap-1.5">
                        <span>ตรวจพบประวัติการขอรับเงินรางวัลหรือเบิกจ่ายแล้ว (ซ้ำซ้อน)</span>
                        <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.5 rounded font-mono">ไม่อนุญาตให้ยื่นซ้ำ</span>
                      </div>
                      <p className="text-rose-800 leading-relaxed">{duplicateResult.message}</p>
                      {duplicateResult.match?.trackingNo && (
                        <div className="text-[11px] text-rose-700 font-mono bg-rose-100/70 p-1.5 rounded">
                          เลขที่คำขอเดิม: <strong>{duplicateResult.match.trackingNo}</strong> | ผู้ยื่น: {duplicateResult.match.applicantName} | สถานะ: {duplicateResult.match.status}
                        </div>
                      )}
                    </div>
                  </div>
                ) : duplicateResult && !duplicateResult.isDuplicate && (articleTitle.trim().length >= 10 || doi.trim()) ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-800 text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ ผ่านการตรวจสอบ: บทความนี้ยังไม่เคยมีประวัติการขอรับเงินรางวัลหรือค่าตีพิมพ์ในระบบ Cloudflare D1</span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ชื่อวารสาร (Journal Name)*</label>
                <input
                  type="text"
                  required
                  value={journalName}
                  onChange={(e) => setJournalName(e.target.value)}
                  placeholder="เช่น World Journal of Gastrointestinal Surgery"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ระดับวารสาร*</label>
                <select
                  value={journalScope}
                  onChange={(e) => {
                    const scope = e.target.value as JournalScope;
                    setJournalScope(scope);
                    if (scope === 'national') {
                      setDatabase('TCI Tier 1');
                      setQuartile('TCI_1');
                    } else {
                      setDatabase('Web of Science');
                      setQuartile('Q1');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="international">วารสารวิชาการระดับนานาชาติ (International)</option>
                  <option value="national">วารสารวิชาการระดับชาติ (National - TCI)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                  ฐานข้อมูลอ้างอิง*
                  {journalScope === 'national' && (
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
                      <Lock className="w-2.5 h-2.5" />
                      วารสารชาติ = TCI เท่านั้น
                    </span>
                  )}
                </label>
                {journalScope === 'national' ? (
                  <div className="w-full px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-medium text-amber-900 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>TCI (Thai Citation Index) — กำหนดอัตโนมัติสำหรับวารสารระดับชาติ</span>
                  </div>
                ) : (
                  <select
                    value={database}
                    onChange={(e) => setDatabase(e.target.value as DatabaseName)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Web of Science">Web of Science</option>
                    <option value="Scopus">Scopus</option>
                    <option value="PubMed">PubMed</option>
                    <option value="SJR (SCImago)">SJR (SCImago Journal Rank)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Quartile / ระดับกลุ่ม*</label>
                <select
                  value={quartile}
                  onChange={(e) => setQuartile(e.target.value as QuartileRank)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-900"
                >
                  {journalScope === 'international' ? (
                    <>
                      <option value="Q1_Tier1">Quartile 1 (อยู่ในระดับ Tier 1 / Top 10%)</option>
                      <option value="Q1">Quartile 1 (Q1 ทั่วไป)</option>
                      <option value="Q2">Quartile 2 (Q2)</option>
                      <option value="Q3">Quartile 3 (Q3)</option>
                      <option value="Q4">Quartile 4 (Q4)</option>
                    </>
                  ) : (
                    <>
                      <option value="TCI_1">TCI กลุ่ม 1</option>
                      <option value="TCI_2">TCI กลุ่ม 2</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">บทบาทการมีส่วนร่วมในผลงาน*</label>
                <select
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value as AuthorRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="first_author">1) ผู้เขียนชื่อแรก (First Author)</option>
                  <option value="corresponding_author">2) ผู้เขียนชื่อหลัก (Corresponding Author)</option>
                  <option value="co_author">3) ผู้ร่วมเขียน (Co-author) - เฉพาะ Q1-Q2 (ได้ 50%)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ประเภทของบทความ*</label>
                <select
                  value={articleType}
                  onChange={(e) => setArticleType(e.target.value as ArticleType)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="research_article">บทความวิจัย / บทความปริทัศน์ (Research / Review / Guidelines)</option>
                  <option value="other_academic">บทความวิชาการอื่นๆ (Case report, Clinical picture, Note)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">ปีของฐานข้อมูล (Database Year)*</label>
                <input
                  type="text"
                  value={databaseYear}
                  onChange={(e) => setDatabaseYear(e.target.value)}
                  placeholder="เช่น 2025"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">วันที่เผยแพร่ (Published Date)*</label>
                <input
                  type="date"
                  required
                  value={publishedDate}
                  onChange={(e) => handlePublishedDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* ข้อมูลเล่ม/ฉบับ/วันเดือนปีที่พิมพ์ (สำหรับแสดงในบันทึกข้อความและเอกสารราชการ) */}
              <div className="sm:col-span-3 bg-slate-100/70 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-xs text-slate-800">
                    ข้อมูลวัน/เดือน/ปีที่พิมพ์ (Vol, No, Month, Year, Pages)
                  </label>
                  <span className="text-[11px] text-slate-500">หากช่องใดไม่มีข้อมูล ระบบจะใส่ขีดกลาง (-) ให้อัตโนมัติ</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Vol. (เล่มที่)</label>
                    <input
                      type="text"
                      value={vol}
                      onChange={(e) => setVol(e.target.value)}
                      placeholder="เช่น 29 (ถ้าไม่มีใส่ -)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">No. (ฉบับที่)</label>
                    <input
                      type="text"
                      value={no}
                      onChange={(e) => setNo(e.target.value)}
                      placeholder="เช่น 1 (ถ้าไม่มีใส่ -)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Month (เดือน)</label>
                    <input
                      type="text"
                      value={publishMonth}
                      onChange={(e) => setPublishMonth(e.target.value)}
                      placeholder="เช่น Jan หรือ ม.ค."
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Year (ปี ค.ศ.)</label>
                    <input
                      type="text"
                      value={publishYear}
                      onChange={(e) => setPublishYear(e.target.value)}
                      placeholder="เช่น 2026"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[11px] text-slate-600 mb-1">Pages (เลขหน้า)</label>
                    <input
                      type="text"
                      value={pages}
                      onChange={(e) => setPages(e.target.value)}
                      placeholder="เช่น 123-130 (ถ้าไม่มีใส่ -)"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {requestType !== 'reward_only' && (
                <div className="sm:col-span-3 bg-amber-50/70 p-3 rounded-lg border border-amber-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-amber-950 block">
                          ค่าตีพิมพ์จ่ายจริงตามใบเสร็จ (Page Charge / APC)*
                        </label>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">
                          รองรับจุดทศนิยม
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800">
                        กรอกยอดเงินบาทตามใบเสร็จหรือ Statement บัตรเครดิต เช่น 125,216.54 (ระบบใส่เครื่องหมายจุลภาคและคำนวณอัตโนมัติ)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="เช่น 125,216.54"
                        value={pageChargeInput}
                        onChange={(e) => {
                          const formatted = formatPageChargeInput(e.target.value);
                          setPageChargeInput(formatted);
                          setClaimedPageCharge(parsePageCharge(formatted));
                        }}
                        onBlur={() => {
                          if (!pageChargeInput.trim()) {
                            setPageChargeInput('');
                            setClaimedPageCharge(0);
                            return;
                          }
                          const num = parsePageCharge(pageChargeInput);
                          if (pageChargeInput.includes('.') || num % 1 !== 0) {
                            setPageChargeInput(num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                          } else {
                            setPageChargeInput(num.toLocaleString('en-US'));
                          }
                          setClaimedPageCharge(num);
                        }}
                        className="w-44 px-3 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold text-amber-950 text-right focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                      />
                      <span className="font-semibold text-amber-900">บาท</span>
                    </div>
                  </div>

                  {/* วันที่จ่ายค่าเพจชาร์จจริง (สำหรับแสดงในใบรับรองการจ่ายเงิน ข้อ 46) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-2 border-t border-amber-200/60">
                    <div>
                      <span className="font-bold text-xs text-amber-950 block">
                        วันที่จ่ายค่าเพจชาร์จจริง (ตามใบเสร็จรับเงิน/ตัดบัตรเครดิต)
                      </span>
                      <span className="text-[11px] text-amber-800">
                        ดึงไปแสดงในตาราง วัน เดือน ปี ของใบรับรองการจ่ายเงิน (ข้อ 46)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={pageChargePaidDate}
                        onChange={(e) => setPageChargePaidDate(e.target.value)}
                        className="w-44 px-3 py-1.5 bg-white border border-amber-300 rounded text-xs font-bold text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {claimedPageCharge > 0 && (
                    <div className="mt-2 pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between text-[11px] text-amber-900">
                      <span>
                        ยอดจ่ายจริงตามใบเสร็จ: <strong className="font-mono font-bold text-amber-950">{formatBaht(claimedPageCharge)}</strong>
                      </span>
                      <span>
                        {claimedPageCharge > calculation.maxPageChargeAllowed ? (
                          <span className="text-amber-800 font-medium bg-amber-100/70 px-2 py-0.5 rounded">
                            (คณะฯ สนับสนุนตามประกาศฯ สูงสุดไม่เกิน <strong className="font-mono">{formatBaht(calculation.maxPageChargeAllowed)}</strong>)
                          </span>
                        ) : (
                          <span className="text-emerald-800 font-medium bg-emerald-100/70 px-2 py-0.5 rounded">
                            (ยอดอยู่ในเกณฑ์ สามารถเบิกจ่ายได้เต็มจำนวน <strong className="font-mono">{formatBaht(claimedPageCharge)}</strong>)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Calculation Display Box */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-4 rounded-xl shadow-md border border-blue-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 font-prompt text-xs tracking-wider uppercase">
                  ผลการคำนวณตามเกณฑ์ประกาศ พ.ศ. 2567
                </span>
                <span className="text-[11px] bg-blue-800/80 px-2 py-0.5 rounded text-blue-200">
                  {calculation.ruleCitation}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-blue-800/80">
                <div>
                  <span className="text-blue-300 text-[11px] block">เงินรางวัลที่ได้สิทธิ:</span>
                  <span className="text-lg font-bold text-white font-prompt">
                    {formatBaht(requestType === 'page_charge_only' ? 0 : calculation.rewardAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-blue-300 text-[11px] block">ค่าตีพิมพ์ที่อนุมัติ:</span>
                  <span className="text-lg font-bold text-white font-prompt">
                    {formatBaht(requestType === 'reward_only' ? 0 : calculation.approvedPageCharge)}
                  </span>
                </div>

                <div className="bg-amber-500/20 p-2 rounded-lg border border-amber-500/40">
                  <span className="text-amber-200 text-[11px] font-semibold block">ยอดเงินขออนุมัติสุทธิ:</span>
                  <span className="text-xl font-bold text-amber-300 font-prompt">
                    {formatBaht(
                      requestType === 'reward_only' 
                        ? calculation.rewardAmount 
                        : requestType === 'page_charge_only'
                        ? calculation.approvedPageCharge
                        : (calculation.rewardAmount + calculation.approvedPageCharge)
                    )}
                  </span>
                </div>
              </div>

              {calculation.notes.length > 0 && (
                <div className="pt-2 text-[11px] text-blue-200/90 space-y-0.5">
                  {calculation.notes.map((note, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: การรับรองคุณสมบัติตามระเบียบ (Mandatory Compliance) */}
          <div className={`p-4 rounded-xl border space-y-2.5 ${allCompliant ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200/80'}`}>
            <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-200 pb-2 font-prompt">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs ${allCompliant ? 'bg-emerald-600' : 'bg-blue-600'}`}>3</span>
                <span>การรับรองคุณสมบัติผู้ขอรับทุน (ตามประกาศมหาวิทยาลัยนเรศวร)</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                allCompliant
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {complianceCount}/4 ยืนยันแล้ว
              </span>
            </div>

            <div className="space-y-2 text-slate-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={medNuAffiliationDeclared}
                  onChange={(e) => setMedNuAffiliationDeclared(e.target.checked)}
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>
                  ระบุชื่อตำแหน่งที่อยู่ผู้เขียนเป็น <strong>"Faculty of Medicine, Naresuan University"</strong> ในบทความวิชาการอย่างชัดเจน (ข้อ 5(2))
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notForGraduation}
                  onChange={(e) => setNotForGraduation(e.target.checked)}
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>
                  บทความวิชาการดังกล่าว <strong>ไม่ได้เป็นส่วนหนึ่งของการจบการศึกษาเพื่อปริญญา</strong> ของผู้ขอรับทุน (ข้อ 5(4))
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={within24Months}
                  onChange={(e) => setWithin24Months(e.target.checked)}
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>
                  ผลงานได้รับการตีพิมพ์เผยแพร่มาแล้ว <strong>ไม่เกิน 24 เดือน</strong> นับตั้งแต่วันที่ตีพิมพ์จนถึงวันที่ยื่นเอกสาร (ข้อ 6(1))
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notPreviouslyClaimed}
                  onChange={(e) => setNotPreviouslyClaimed(e.target.checked)}
                  className="mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>
                  <strong>ไม่เป็นบทความที่เคยขอรับการสนับสนุนค่าตีพิมพ์หรือรางวัลการตีพิมพ์มาก่อน</strong> (ข้อ 6(5))
                </span>
              </label>
            </div>

            {!allCompliant && (
              <div className="flex items-center gap-2 pt-1 text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>ต้องยืนยันคุณสมบัติครบทุกข้อ (<strong>{complianceCount}/4</strong>) จึงจะบันทึกคำขอได้</span>
              </div>
            )}
          </div>

          {/* Section 4: รายการเอกสารแนบ Checklist */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-slate-200 pb-2 font-prompt">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">4</span>
                <span>เอกสารประกอบการขอรับทุน ({currentTrackingPrefix} Checklist)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">แนบไฟล์ออนไลน์ & เตรียมสำหรับพิมพ์</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-medium">1. สำเนาบทความ Reprint (ลงลายมือชื่อทุกหน้า)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">พร้อมแนบ</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-medium">2. เอกสารรับรอง Quartile (SJR / WoS / Scopus / TCI)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">พร้อมแนบ</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-medium">3. ใบแจ้งหนี้ (Invoice) หรือใบเสร็จรับเงินค่าตีพิมพ์</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">พร้อมแนบ</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-medium">4. สำเนาหน้าสมุดบัญชีธนาคารกรุงศรีอยุธยา</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">พร้อมแนบ</span>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between sm:col-span-2">
                <span className="font-medium">5. สำเนาบัตรประจำตัวประชาชน (รับรองสำเนาถูกต้อง)</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">พร้อมแนบ</span>
              </div>
            </div>
          </div>

          {/* Section 5: การให้ความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA Consent) */}
          <div className={`p-4 rounded-xl border space-y-2.5 transition-colors ${pdpaConsentAccepted ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/40 border-rose-200'}`}>
            <div className="font-bold text-slate-900 text-sm flex items-center justify-between border-b border-current/20 pb-2 font-prompt">
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold ${pdpaConsentAccepted ? 'bg-emerald-700' : 'bg-rose-600'}`}>5</span>
                <span className={pdpaConsentAccepted ? 'text-emerald-950' : 'text-rose-950'}>การคุ้มครองข้อมูลส่วนบุคคล (PDPA Consent)</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold flex items-center gap-1 ${
                pdpaConsentAccepted
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {pdpaConsentAccepted ? 'ให้ความยินยอมแล้ว' : 'ยังไม่ได้ให้ความยินยอม'}
              </span>
            </div>

            <p className="text-[11px] text-slate-700 leading-relaxed">
              ข้าพเจ้ายินยอมให้คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร เก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลของข้าพเจ้า (รวมถึงชื่อ-นามสกุล, ข้อมูลสังกัด, เลขประจำตัวประชาชน, ข้อมูลบัญชีธนาคาร, อีเมล และเบอร์โทรศัพท์) เพื่อประโยชน์ในการตรวจสอบคุณสมบัตินักวิจัย อนุมัติเบิกจ่ายเงินรางวัล และการดำเนินการทางบัญชี/ภาษีอากรตามกฎหมายและระเบียบของมหาวิทยาลัยนเรศวร โดยข้อมูลจะได้รับการคุ้มครองความปลอดภัยตามมาตรการ PDPA ของมหาวิทยาลัย
            </p>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                required
                checked={pdpaConsentAccepted}
                onChange={(e) => setPdpaConsentAccepted(e.target.checked)}
                className="mt-0.5 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <span className={`text-xs font-semibold ${pdpaConsentAccepted ? 'text-emerald-900' : 'text-rose-900'}`}>
                ข้าพเจ้าได้อ่านและให้ความยินยอมในการประมวลผลข้อมูลส่วนบุคคลตามวัตถุประสงค์ข้างต้น (PDPA Consent)*
              </span>
            </label>

            {!pdpaConsentAccepted && (
              <div className="flex items-center gap-2 text-[11px] text-rose-800 bg-rose-100/80 border border-rose-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>ต้องให้ความยินยอม PDPA ก่อนจึงจะบันทึกคำขอได้</span>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-lg text-xs"
            >
              ยกเลิก
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Button 1: Save Draft (บันทึกร่างเตรียมเบิก / ยังไม่ส่ง) */}
              <button
                type="button"
                onClick={handleSaveDraft}
                title="บันทึกข้อมูลเตรียมไว้เพื่อตรวจเช็ควงเงินและจัดลำดับก่อนส่งเบิกจริง (สามารถกลับมาแก้ไขได้ตลอด)"
                className="px-4 py-2.5 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 shadow-sm cursor-pointer active:scale-[0.99]"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <span>{isEditingDraft ? 'บันทึกอัปเดตร่างเตรียมเบิก' : 'บันทึกร่างเตรียมเบิก (ยังไม่ส่ง)'}</span>
              </button>

              {/* Button 2: Submit Now (บันทึกและส่งคำขอทันที) */}
              <button
                type="submit"
                disabled={isSubmitDisabled}
                title={
                  isSubmitDisabled
                    ? 'ปุ่มถูกล็อค: กรุณายืนยันคุณสมบัติผู้ขอรับทุน (ข้อ 3) และให้ความยินยอม PDPA (ข้อ 5) ให้ครบทุกข้อก่อนส่งเบิก'
                    : 'คลิกเพื่อบันทึกและส่งคำขอออนไลน์'
                }
                className={`px-5 py-2.5 font-semibold rounded-lg text-xs transition-all flex items-center justify-center gap-2 select-none ${
                  isSubmitDisabled
                    ? 'bg-blue-100 text-blue-400 border border-blue-200/80 cursor-not-allowed opacity-60 shadow-none'
                    : 'bg-blue-700 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/30 cursor-pointer active:scale-[0.99]'
                }`}
              >
                {isCheckingDuplicate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    <span>กำลังตรวจสอบซ้ำซ้อน...</span>
                  </>
                ) : duplicateResult?.isDuplicate ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>ไม่อนุญาตให้ยื่น (ตรวจพบข้อมูลซ้ำซ้อน)</span>
                  </>
                ) : isSubmitDisabled ? (
                  <>
                    <Lock className="w-4 h-4 text-blue-400" />
                    <span>{isEditingDraft ? 'ส่งเบิกคำขอนี้ทันที' : 'ส่งคำขอออนไลน์ (เข้าระบบ D1)'}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-white" />
                    <span>{isEditingDraft ? 'ส่งเบิกคำขอนี้ทันที' : 'บันทึกและส่งคำขอออนไลน์'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
