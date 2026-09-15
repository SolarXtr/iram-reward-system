import { CalendarEventSchedule, ResearchApplication, WorkflowStep, WorkflowStepId } from '../types';

export const OFFICIAL_WORKFLOW_STEPS_DEF: Array<{
  stepNumber: WorkflowStepId;
  title: string;
  responsibleParty: 'นักวิจัย' | 'ผู้ประสานงานวิจัย' | 'ผู้บริหาร' | 'งานนโยบายและแผน' | 'งานการเงิน';
  slaDays: number;
  description: string;
}> = [
  {
    stepNumber: 1,
    title: 'กรอกข้อมูลและแนบเอกสารออนไลน์',
    responsibleParty: 'นักวิจัย',
    slaDays: 1,
    description: 'นักวิจัยกรอกข้อมูลในระบบบริหารโครงการวิจัย พร้อมแนบสำเนาเอกสาร (Reprint, Quartile, ใบเสร็จ)',
  },
  {
    stepNumber: 2,
    title: 'ผู้ประสานงานวิจัยตรวจสอบเอกสารตามเกณฑ์',
    responsibleParty: 'ผู้ประสานงานวิจัย',
    slaDays: 1,
    description: 'เจ้าหน้าที่ตรวจเช็คคุณสมบัติ หากตามเกณฑ์ จัดทำบันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์/รางวัล',
  },
  {
    stepNumber: 3,
    title: 'ลงนามและแนบเอกสารประกอบ',
    responsibleParty: 'นักวิจัย',
    slaDays: 4,
    description: 'นักวิจัยพิมพ์แบบฟอร์ม ลงนาม และแนบใบสำคัญรับเงิน สำเนาบัตร ปชช. และสำเนาสมุดบัญชีธนาคารกรุงศรี',
  },
  {
    stepNumber: 4,
    title: 'ผู้ประสานงานวิจัยตรวจสอบความถูกต้อง',
    responsibleParty: 'ผู้ประสานงานวิจัย',
    slaDays: 1,
    description: 'ตรวจสอบความสมบูรณ์ของเอกสารและลายมือชื่อก่อนเสนอผู้บริหาร',
  },
  {
    stepNumber: 5,
    title: 'ผู้บริหารฝ่ายวิจัยลงนามตามลำดับ',
    responsibleParty: 'ผู้บริหาร',
    slaDays: 3,
    description: 'หัวหน้าภาควิชา และรองคณบดีฝ่ายคุณภาพและวิจัย พิจารณาลงนามตามลำดับ',
  },
  {
    stepNumber: 6,
    title: 'ผู้ประสานงานวิจัยทานความครบถ้วน',
    responsibleParty: 'ผู้ประสานงานวิจัย',
    slaDays: 1,
    description: 'ทานความครบถ้วนของเอกสารและลายเซ็นต์ผู้บริหารฝ่ายวิจัย',
  },
  {
    stepNumber: 7,
    title: 'ทานตรวจและลงข้อมูลบประมาณ',
    responsibleParty: 'งานนโยบายและแผน',
    slaDays: 2,
    description: 'งานนโยบายและแผน และงานการเงิน ตรวจสอบงบประมาณรายได้ ออกใบ Blue Slip คุมยอด',
  },
  {
    stepNumber: 8,
    title: 'ผู้บริหาร (คณบดี) ลงนามอนุมัติ',
    responsibleParty: 'ผู้บริหาร',
    slaDays: 3,
    description: 'คณบดีคณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร พิจารณาลงนามอนุมัติเบิกจ่าย',
  },
  {
    stepNumber: 9,
    title: 'ส่งเอกสารที่ได้รับอนุมัติเบิกเงินรางวัล',
    responsibleParty: 'ผู้ประสานงานวิจัย',
    slaDays: 1,
    description: 'ผู้ประสานงานวิจัยส่งบันทึกข้อความและเอกสารที่อนุมัติแล้วให้งานการเงิน',
  },
  {
    stepNumber: 10,
    title: 'จัดทำฎีกาเบิกเงินฯ และโอนเข้าบัญชี',
    responsibleParty: 'งานการเงิน',
    slaDays: 20, // ภายใน 4 สัปดาห์
    description: 'งานการเงินจัดทำฎีกาเบิกเงินผ่านระบบคลัง และโอนเงินเข้าบัญชีธนาคารกรุงศรีของนักวิจัย',
  },
  {
    stepNumber: 11,
    title: 'ส่งสำเนาเอกสารการโอนเงินให้ผู้ประสานงาน',
    responsibleParty: 'งานการเงิน',
    slaDays: 1,
    description: 'งานการเงินส่งสำเนาหลักฐานการโอนเงิน (Transfer Slip) ให้ผู้ประสานงานวิจัย',
  },
  {
    stepNumber: 12,
    title: 'ลงบันทึกข้อมูลคุมเงินและแจ้งนักวิจัย',
    responsibleParty: 'ผู้ประสานงานวิจัย',
    slaDays: 1,
    description: 'ลงบันทึกฐานข้อมูลคุมเงิน และจัดส่งสำเนาการโอนเงินแจ้งให้นักวิจัยทราบผ่านระบบและ LINE OA',
  },
];

export function generateTimelineForStep(currentStep: WorkflowStepId): WorkflowStep[] {
  return OFFICIAL_WORKFLOW_STEPS_DEF.map((step) => {
    let status: 'completed' | 'in_progress' | 'pending' | 'returned' = 'pending';
    let completedAt: string | undefined = undefined;

    if (step.stepNumber < currentStep) {
      status = 'completed';
      completedAt = '2569-02-15';
    } else if (step.stepNumber === currentStep) {
      status = 'in_progress';
    }

    return {
      ...step,
      status,
      completedAt,
    };
  });
}

export const INITIAL_APPLICATIONS: ResearchApplication[] = [
  {
    id: 'app-001',
    trackingNo: 'AWP69-054',
    fiscalYear: 2569,
    createdAt: '2026-01-26',
    updatedAt: '2026-03-23',

    applicantName: 'ผู้ช่วยศาสตราจารย์ ดร.สมหมาย วิจัยเจริญ',
    academicPosition: 'ผู้ช่วยศาสตราจารย์',
    department: 'ภาควิชาศัลยศาสตร์',
    phone: '5535',
    email: 'sommaiv@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00188-2',
    idCardNo: '1-6500-00214-55-1',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2026-01-26 09:30',

    requestType: 'both',
    articleTitle: 'Laparoscopic hepatectomy is feasible for patients diagnosed with hepatocellular carcinoma and cirrhotic liver',
    journalName: 'World Journal of Gastrointestinal Surgery',
    journalScope: 'international',
    database: 'Web of Science',
    quartile: 'Q2',
    isTier1Top10: false,
    authorRole: 'first_author',
    articleType: 'research_article',

    issn: '1948-9366',
    doi: '10.4240/wjgs.v18.i1.114262',
    volumeIssue: 'Vol 18 No 1 Month January (Year) 2026 Page1-11',
    publishedDate: '2026-01-27',
    acceptedDate: '2025-11-21',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 15000,
    claimedPageChargeAmount: 40000,
    approvedPageChargeAmount: 40000,
    totalClaimedAmount: 55000,
    actualPaidAmount: 55000,

    internalDocNo: 'อว 0603.10.10/066',
    researchDocRecNo: 'เลขรับ 0205 (10 ก.พ. 2569)',
    financeDocRecNo: 'เลขรับงานคลัง 2154/69 (16 ก.พ. 2569)',
    disbursementVoucherNo: 'เลขที่ฎีกา 3606/69',
    blueSlipNo: 'BLUE SLIP 4604 / SMU 208000/69',
    budgetExpenseCode: 'งบประมาณรายได้ ปี 2569 หมวดเงินอุดหนุน กองทุนวิจัย คณะแพทยศาสตร์',

    paymentDate: '2026-03-23',
    paymentStatus: 'transferred',
    paymentNotifiedAt: '2026-03-23 16:30',

    currentStep: 12,
    status: 'paid',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
      ...s,
      status: 'completed',
      completedAt: [
        '2026-01-26',
        '2026-01-29',
        '2026-02-03',
        '2026-02-05',
        '2026-02-12',
        '2026-02-13',
        '2026-02-16',
        '2026-03-17',
        '2026-03-18',
        '2026-03-23',
        '2026-03-23',
        '2026-03-23',
      ][idx],
      notes: idx === 9 ? 'โอนเงินบัญชีกรุงศรี 346-1-00188-2 เรียบร้อย (ฎีกา 3606/69)' : undefined,
    })),

    attachments: [
      {
        id: 'att-1',
        title: 'สำเนา Reprint บทความวิจัย',
        type: 'reprint',
        fileName: 'reprint_laparoscopic_hepatectomy.pdf',
        fileSize: '2.4 MB',
        uploadedAt: '2026-01-26',
        verified: true,
      },
      {
        id: 'att-2',
        title: 'เอกสารรับรอง Quartile (Web of Science Q2)',
        type: 'quartile_proof',
        fileName: 'wos_journal_info_q2.pdf',
        fileSize: '840 KB',
        uploadedAt: '2026-01-26',
        verified: true,
      },
      {
        id: 'att-3',
        title: 'ใบเสร็จ/Invoice ค่าตีพิมพ์ Baishideng ($3,203 USD)',
        type: 'invoice',
        fileName: 'baishideng_invoice_3203usd.pdf',
        fileSize: '1.1 MB',
        uploadedAt: '2026-01-26',
        verified: true,
      },
      {
        id: 'att-4',
        title: 'สำเนาสมุดบัญชีธนาคารกรุงศรีอยุธยา',
        type: 'bank_book',
        fileName: 'krungsri_passbook_sample.pdf',
        fileSize: '512 KB',
        uploadedAt: '2026-01-26',
        verified: true,
      },
      {
        id: 'att-5',
        title: 'สลิปหลักฐานการโอนเงิน (งานคลังส่งมอบ)',
        type: 'transfer_slip',
        fileName: 'krungsri_transfer_receipt_55000.pdf',
        fileSize: '720 KB',
        uploadedAt: '2026-03-23',
        verified: true,
      },
    ],
    coordinatorNotes: 'ตรวจสอบเอกสารครบถ้วนตามเกณฑ์ประกาศ 2567 เงินรางวัล 15,000 + ค่าตีพิมพ์ 40,000 รวม 55,000 บาท',
    lineNotified: true,
    lineLastSentAt: '2026-03-23 16:32',
    calendarSynced: true,
  },

  {
    id: 'app-002',
    trackingNo: 'AWP69-058',
    fiscalYear: 2569,
    createdAt: '2026-02-10',
    updatedAt: '2026-03-12',

    applicantName: 'รองศาสตราจารย์ ดร.แพทย์หญิง สุภาวดี ศิริพงษ์',
    academicPosition: 'รองศาสตราจารย์',
    department: 'ภาควิชาอายุรศาสตร์',
    phone: '5540',
    email: 'supawadees@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00204-9',
    idCardNo: '1-6500-00188-72-4',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2026-02-10 10:15',

    requestType: 'both',
    articleTitle: 'Cardiovascular and renal outcomes of SGLT2 inhibitors in diabetic kidney disease: A comprehensive cohort study',
    journalName: 'The Lancet Diabetes & Endocrinology',
    journalScope: 'international',
    database: 'Scopus',
    quartile: 'Q1_Tier1',
    isTier1Top10: true,
    authorRole: 'corresponding_author',
    articleType: 'research_article',

    issn: '2213-8587',
    doi: '10.1016/S2213-8587(25)00341-X',
    volumeIssue: 'Vol 13 Issue 2 Feb 2026',
    publishedDate: '2026-02-01',
    acceptedDate: '2025-12-15',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 35000,
    claimedPageChargeAmount: 40000,
    approvedPageChargeAmount: 40000,
    totalClaimedAmount: 75000,

    internalDocNo: 'อว 0603.10.10/112',
    researchDocRecNo: 'เลขรับ 0340 (12 ก.พ. 2569)',
    financeDocRecNo: 'เลขรับงานคลัง 2890/69',
    blueSlipNo: 'BLUE SLIP 4812 / SMU 208000/69',
    budgetExpenseCode: 'งบประมาณรายได้ ปี 2569 หมวดเงินอุดหนุน กองทุนวิจัย คณะแพทยศาสตร์',

    paymentStatus: 'processing',
    currentStep: 9,
    status: 'dean_approved',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
      ...s,
      status: idx < 8 ? 'completed' : idx === 8 ? 'in_progress' : 'pending',
      completedAt: idx < 8 ? '2026-03-10' : undefined,
    })),

    attachments: [
      {
        id: 'att-201',
        title: 'Reprint Lancet Article',
        type: 'reprint',
        fileName: 'lancet_sglt2_kidney.pdf',
        fileSize: '3.1 MB',
        uploadedAt: '2026-02-10',
        verified: true,
      },
      {
        id: 'att-202',
        title: 'Scopus Q1 Tier 1 Certificate',
        type: 'quartile_proof',
        fileName: 'scopus_q1_tier1_proof.pdf',
        fileSize: '920 KB',
        uploadedAt: '2026-02-10',
        verified: true,
      },
    ],
    coordinatorNotes: 'บทความระดับ Tier 1 Top 10% อนุมัติเงินรางวัล 35,000 บ. + ค่าตีพิมพ์ 40,000 บ. เสนองานการเงินจัดทำฎีกา',
    lineNotified: true,
    lineLastSentAt: '2026-03-10 14:15',
    calendarSynced: true,
  },

  {
    id: 'app-003',
    trackingNo: 'AWP69-061',
    fiscalYear: 2569,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-05',

    applicantName: 'อาจารย์ นายแพทย์ ภัทรพล วงศ์สว่าง',
    academicPosition: 'อาจารย์',
    department: 'ภาควิชากุมารเวชศาสตร์',
    phone: '5562',
    email: 'pattarapholw@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00910-3',
    idCardNo: '1-6500-00391-10-8',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2026-03-01 11:20',

    requestType: 'both',
    articleTitle: 'Rare presentation of Multisystem Inflammatory Syndrome in Neonates: A Case Series in Lower Northern Thailand',
    journalName: 'Pediatric Infectious Disease Journal',
    journalScope: 'international',
    database: 'PubMed',
    quartile: 'Q2',
    isTier1Top10: false,
    authorRole: 'first_author',
    articleType: 'other_academic', // Case series

    issn: '0891-3668',
    doi: '10.1097/INF.0000000000004122',
    volumeIssue: 'Vol 45 No 3 March 2026',
    publishedDate: '2026-02-28',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 7500, // Case series Q2 = 7,500 บาท
    claimedPageChargeAmount: 25000,
    approvedPageChargeAmount: 25000,
    totalClaimedAmount: 32500,

    internalDocNo: 'อว 0603.10.10/145',
    researchDocRecNo: 'เลขรับ 0412 (02 มี.ค. 2569)',

    paymentStatus: 'unpaid',
    currentStep: 3,
    status: 'staff_verified',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
      ...s,
      status: idx < 2 ? 'completed' : idx === 2 ? 'in_progress' : 'pending',
      completedAt: idx < 2 ? '2026-03-04' : undefined,
    })),

    attachments: [
      {
        id: 'att-301',
        title: 'Reprint PIDJ Case Series',
        type: 'reprint',
        fileName: 'pidj_mis_c_neonates.pdf',
        fileSize: '1.8 MB',
        uploadedAt: '2026-03-01',
        verified: true,
      },
    ],
    coordinatorNotes: 'บทความประเภท Case series (ข้อ 8(1)(ก)(2)(ค)) เงินรางวัล 7,500 บ. ค่าตีพิมพ์ 25,000 บ.',
    lineNotified: true,
    lineLastSentAt: '2026-03-04 10:00',
    calendarSynced: false,
  },

  {
    id: 'app-004',
    trackingNo: 'AWP69-065',
    fiscalYear: 2569,
    createdAt: '2026-03-11',
    updatedAt: '2026-03-11',

    applicantName: 'ผู้ช่วยศาสตราจารย์ แพทย์หญิง นภัสวรรณ รัตนชัย',
    academicPosition: 'ผู้ช่วยศาสตราจารย์',
    department: 'ภาควิชาพยาธิวิทยา',
    phone: '5570',
    email: 'napassawanr@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00219-5',
    idCardNo: '1-6500-00451-22-3',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2026-03-11 14:05',

    requestType: 'both',
    articleTitle: 'Validation of Automated Whole Slide Imaging for HER2 Scoring in Invasive Breast Carcinoma',
    journalName: 'Journal of the Medical Association of Thailand (JMAT)',
    journalScope: 'national',
    database: 'TCI Tier 1',
    quartile: 'TCI_1',
    authorRole: 'first_author',
    articleType: 'research_article',

    issn: '0125-2208',
    volumeIssue: 'Vol 109 No 2 Feb 2026',
    publishedDate: '2026-02-15',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 2000, // TCI 1 research = 2,000
    claimedPageChargeAmount: 5000,
    approvedPageChargeAmount: 5000,
    totalClaimedAmount: 7000,

    paymentStatus: 'unpaid',
    currentStep: 2,
    status: 'submitted',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
      completedAt: idx === 0 ? '2026-03-11' : undefined,
    })),

    attachments: [
      {
        id: 'att-401',
        title: 'Reprint JMAT Article',
        type: 'reprint',
        fileName: 'jmat_her2_validation.pdf',
        fileSize: '1.2 MB',
        uploadedAt: '2026-03-11',
        verified: false,
      },
    ],
    coordinatorNotes: 'รอผู้ประสานงานวิจัยตรวจสอบเอกสารและสืบค้นฐาน TCI กลุ่ม 1',
    lineNotified: false,
    calendarSynced: false,
  },

  {
    id: 'app-005',
    trackingNo: 'AWP69-048',
    fiscalYear: 2569,
    createdAt: '2025-12-18',
    updatedAt: '2026-02-14',

    applicantName: 'ศาสตราจารย์ นายแพทย์ วรพจน์ ธนสารสมบัติ',
    academicPosition: 'ศาสตราจารย์',
    department: 'ภาควิชาออร์โธปิดิกส์',
    phone: '5520',
    email: 'vorapojt@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00109-1',
    idCardNo: '1-6500-00102-19-9',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2025-12-18 08:45',

    requestType: 'both',
    articleTitle: 'Biomechanical analysis of patient-specific 3D-printed titanium implants for complex cervical spinal reconstruction',
    journalName: 'The Spine Journal',
    journalScope: 'international',
    database: 'Web of Science',
    quartile: 'Q1',
    authorRole: 'first_author',
    articleType: 'research_article',

    issn: '1529-9430',
    doi: '10.1016/j.spinee.2025.11.002',
    volumeIssue: 'Vol 26 Issue 1 Jan 2026',
    publishedDate: '2026-01-05',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 25000,
    claimedPageChargeAmount: 40000,
    approvedPageChargeAmount: 40000,
    totalClaimedAmount: 65000,
    actualPaidAmount: 65000,

    internalDocNo: 'อว 0603.10.10/012',
    disbursementVoucherNo: 'เลขที่ฎีกา 3201/69',
    paymentDate: '2026-02-14',
    paymentStatus: 'transferred',
    paymentNotifiedAt: '2026-02-14 15:00',

    currentStep: 12,
    status: 'paid',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s) => ({
      ...s,
      status: 'completed',
      completedAt: '2026-02-14',
    })),
    attachments: [],
    coordinatorNotes: 'โอนเงินเรียบร้อย กรอบวงเงินใช้ไป 65,000 / 150,000 บาท',
    lineNotified: true,
    lineLastSentAt: '2026-02-14 15:00',
    calendarSynced: true,
  },

  {
    id: 'app-006',
    trackingNo: 'AWP69-070',
    fiscalYear: 2569,
    createdAt: '2026-03-14',
    updatedAt: '2026-03-14',

    applicantName: 'ดร.ทินกร หอมดี',
    academicPosition: 'อาจารย์ ดร.',
    department: 'สถานวิทยาศาสตร์คลินิก',
    phone: '5588',
    email: 'tinnakornh@nu.ac.th',
    bankName: 'ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร',
    bankAccountNo: '346-1-00888-9',
    idCardNo: '1-6500-00888-99-0',
    pdpaConsentAccepted: true,
    pdpaConsentDate: '2026-03-14 09:00',

    requestType: 'both',
    articleTitle: 'Machine Learning Approaches for Clinical Biomarker Discovery in Precision Oncology',
    journalName: 'Scientific Reports',
    journalScope: 'international',
    database: 'Scopus',
    quartile: 'Q1',
    isTier1Top10: false,
    authorRole: 'corresponding_author',
    articleType: 'research_article',

    issn: '2045-2322',
    doi: '10.1038/s41598-026-58120-4',
    volumeIssue: 'Vol 16 Article 4812 (2026)',
    publishedDate: '2026-02-20',
    acceptedDate: '2026-01-15',
    within24Months: true,
    notForGraduation: true,
    medNuAffiliationDeclared: true,

    claimedRewardAmount: 25000,
    claimedPageChargeAmount: 65000,
    approvedPageChargeAmount: 65000,
    totalClaimedAmount: 90000,

    internalDocNo: 'อว 0603.10.10/201',
    researchDocRecNo: 'เลขรับ 0512 (14 มี.ค. 2569)',
    paymentStatus: 'unpaid',
    currentStep: 2,
    status: 'submitted',
    timeline: OFFICIAL_WORKFLOW_STEPS_DEF.map((s, idx) => ({
      ...s,
      status: idx === 0 ? 'completed' : idx === 1 ? 'in_progress' : 'pending',
      completedAt: idx === 0 ? '2026-03-14' : undefined,
    })),
    attachments: [
      {
        id: 'att-601',
        title: 'Reprint Nature SciRep Article',
        type: 'reprint',
        fileName: 'scirep_precision_oncology_ml.pdf',
        fileSize: '2.1 MB',
        uploadedAt: '2026-03-14',
        verified: true,
      },
    ],
    coordinatorNotes: 'คำขอของนักวิจัยบัญชี NU Login (ดร.ทินกร หอมดี) เอกสารครบถ้วน รอเจ้าหน้าที่วิจัยตรวจสอบฐานข้อมูล',
    lineNotified: true,
    lineLastSentAt: '2026-03-14 09:15',
    calendarSynced: true,
  }
];

export const INITIAL_SCHEDULE_EVENTS: CalendarEventSchedule[] = [
  {
    id: 'cal-1',
    title: 'ประชุมคณะกรรมการบริหารงานวิจัย คณะแพทยศาสตร์ (ประจำเดือน มี.ค.)',
    date: '2026-03-18',
    time: '09:30 - 12:00',
    type: 'committee_meeting',
    location: 'ห้องประชุม CC2-414 คณะแพทยศาสตร์',
    description: 'พิจารณากลั่นกรองเงินรางวัลและค่าตีพิมพ์บทความวิจัยรอบที่ 3/2569 ตามประกาศ พ.ศ. 2567',
  },
  {
    id: 'cal-2',
    title: 'รอบตัดส่งเอกสารงานการเงินเพื่อจัดทำฎีกาเบิกจ่าย (รอบกลางเดือน)',
    date: '2026-03-20',
    time: '16:30',
    type: 'payment_round',
    location: 'หน่วยการเงินและบัญชี คณะแพทยศาสตร์',
    description: 'รวบรวมบันทึกข้อความที่คณบดีอนุมัติแล้วส่งงานการเงินเพื่อออกฎีกาโอนเงินเข้าบัญชี',
  },
  {
    id: 'cal-3',
    title: 'วันครบกำหนด SLA รอบการโอนเงิน (4 สัปดาห์) งวดที่ 2/2569',
    date: '2026-03-27',
    time: '17:00',
    type: 'sla_deadline',
    location: 'ระบบโอนเงิน K-Cyber / Krungsri Corporate',
    description: 'กำหนดวันโอนเงินรางวัลและค่าตีพิมพ์เข้าบัญชีธนาคารกรุงศรีอยุธยาของนักวิจัย',
  },
  {
    id: 'cal-4',
    title: 'ประชุมคณะกรรมการบริหารงานวิจัย คณะแพทยศาสตร์ (ประจำเดือน เม.ย.)',
    date: '2026-04-15',
    time: '09:30 - 12:00',
    type: 'committee_meeting',
    location: 'ห้องประชุม CC2-414 คณะแพทยศาสตร์',
    description: 'พิจารณาอนุมัติคำขอรับเงินรางวัลและค่าตีพิมพ์รอบถัดไป',
  },
];
