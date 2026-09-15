/**
 * Types & Interfaces for Med NU Research Reward & Page Charge System
 * Based on Naresuan University Faculty of Medicine Announcement (May 27, 2024 / B.E. 2567)
 */

export type RequestType = 'reward_only' | 'page_charge_only' | 'both';

export type ArticleType = 
  | 'research_article'     // บทความวิจัย / บทความปริทัศน์ / Guidelines
  | 'other_academic';      // Case report, Case series, Clinical note, Technical note

export type AuthorRole = 
  | 'first_author'         // First Author
  | 'corresponding_author' // Corresponding Author
  | 'co_author';           // Co-author (Allowed only for International Q1-Q2, 50% reward)

export type JournalScope = 'international' | 'national';

export type DatabaseName = 
  | 'Web of Science' 
  | 'Scopus' 
  | 'PubMed' 
  | 'SJR (SCImago)' 
  | 'TCI Tier 1' 
  | 'TCI Tier 2';

export type QuartileRank = 'Q1_Tier1' | 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'TCI_1' | 'TCI_2';

export type WorkflowStepId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface WorkflowStep {
  stepNumber: WorkflowStepId;
  title: string;
  responsibleParty: 'นักวิจัย' | 'ผู้ประสานงานวิจัย' | 'ผู้บริหาร' | 'งานนโยบายและแผน' | 'งานการเงิน';
  slaDays: number; // working days
  description: string;
  completedAt?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'returned';
  notes?: string;
  documentRef?: string;
}

export type ApplicationStatus = 
  | 'draft'               // ร่างคำขอ
  | 'submitted'           // ยื่นคำขอแล้ว (รอ จนท. ตรวจสอบ)
  | 'staff_verified'      // จนท. ตรวจสอบผ่าน จัดทำบันทึกข้อความ
  | 'researcher_signed'   // นักวิจัยลงนามและแนบเอกสารแล้ว
  | 'admin_review'        // อยู่ระหว่างผู้บริหารพิจารณา (หัวหน้าภาค / รองคณบดี)
  | 'budget_verified'     // งานนโยบาย/การเงิน ทานงบประมาณ
  | 'dean_approved'       // คณบดีอนุมัติเรียบร้อย
  | 'finance_processing'  // งานการเงินจัดทำฎีกาเบิกจ่าย
  | 'paid'                // โอนเงินเข้าบัญชีเรียบร้อยแล้ว
  | 'rejected'            // ส่งกลับแก้ไข / ไม่อนุมัติ
  | 'closed';             // ปิดงานสมบูรณ์

export interface DocumentAttachment {
  id: string;
  title: string;
  type: 
    | 'reprint' 
    | 'quartile_proof' 
    | 'invoice' 
    | 'bank_book' 
    | 'id_card' 
    | 'payment_receipt' 
    | 'acceptance_letter'
    | 'transfer_slip';
  fileUrl?: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  verified: boolean;
}

export interface ResearchApplication {
  id: string;
  trackingNo: string; // e.g. AWP69-054
  fiscalYear: number; // e.g. 2569
  createdAt: string;
  updatedAt: string;

  // Researcher Profile (Complies with PDPA)
  applicantName: string; // ชื่อ-นามสกุล ผู้ขอรับทุน
  academicPosition: string; // ตำแหน่งทางวิชาการ
  department: string; // ภาควิชา/หน่วยงาน
  phone: string; // เบอร์โทรศัพท์ภายใน
  email: string; // อีเมลผู้ใช้ (NU Account)
  bankName: string; // ธนาคารกรุงศรีอยุธยา สาขามหาวิทยาลัยนเรศวร
  bankAccountNo: string; // เลขที่บัญชีธนาคาร (10 หลัก)
  idCardNo: string; // เลขประจำตัวประชาชน 13 หลัก
  pdpaConsentAccepted?: boolean; // ได้รับความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
  pdpaConsentDate?: string; // วันเวลาที่ให้ความยินยอม

  // Request Details
  requestType: RequestType;
  articleTitle: string;
  journalName: string;
  journalScope: JournalScope;
  database: DatabaseName;
  quartile: QuartileRank;
  isTier1Top10?: boolean;
  authorRole: AuthorRole;
  articleType: ArticleType;

  // Publication Details
  issn?: string;
  doi?: string;
  volumeIssue?: string; // Vol. 18 No. 1
  publishedDate: string; // วันที่ตีพิมพ์
  acceptedDate?: string;
  within24Months: boolean;
  notForGraduation: boolean;
  medNuAffiliationDeclared: boolean;

  // Financial Figures (Calculated & Claimed)
  claimedRewardAmount: number; // เงินรางวัลที่คำนวณได้
  claimedPageChargeAmount: number; // ค่าตีพิมพ์ที่จ่ายจริงตามใบเสร็จ
  approvedPageChargeAmount: number; // ค่าตีพิมพ์ที่คณะสนับสนุนตามเกณฑ์
  totalClaimedAmount: number; // รวมเงินที่ขอเบิก
  actualPaidAmount?: number; // ยอดเงินที่โอนจริง

  // Government & Financial References
  internalDocNo?: string; // เลขที่หนังสือ อว 0603.10.10/066
  memoDocNo?: string; // Alias for internalDocNo
  researchDocRecNo?: string; // เลขรับงานวิจัย 0205 / เวลา 9.00 น.
  financeDocRecNo?: string; // เลขรับงานคลัง 2154/69
  disbursementVoucherNo?: string; // เลขที่ฎีกาเบิกเงิน 3606/69
  blueSlipNo?: string; // เลขใบ BLUE SLIP 4604 / SMU 208000/69
  budgetExpenseCode?: string; // หมวดเงินอุดหนุน โครงการส่งเสริมพัฒนาการวิจัย/นวัตกรรม

  // Payment Tracking
  paymentDate?: string; // วันที่โอนเงิน
  paymentTransferSlipUrl?: string; // ลิงก์สลิปโอนเงิน
  paymentStatus: 'unpaid' | 'processing' | 'transferred';
  paymentNotifiedAt?: string;

  // Workflow
  currentStep: WorkflowStepId;
  status: ApplicationStatus;
  timeline: WorkflowStep[];
  attachments: DocumentAttachment[];
  coordinatorNotes?: string;
  staffNotes?: string; // Alias for coordinatorNotes

  // Line Notification Status
  lineNotified: boolean;
  lineLastSentAt?: string;
  calendarSynced: boolean;
}

export interface ResearcherQuota {
  researcherName: string;
  department: string;
  fiscalYear: number;
  maxLimit: number; // 150,000 บาท ตามข้อ 12
  usedAmount: number;
  pendingAmount: number;
  remainingAmount: number;
}

export type LineMilestoneType = 
  | 'application_submitted' 
  | 'document_verified' 
  | 'dean_approved' 
  | 'payment_transferred';

export interface LineNotificationRecord {
  id: string;
  trackingNo: string;
  milestone: LineMilestoneType;
  title: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  details: string;
  timestamp: string;
  channel: string; // e.g. '@414jvrca'
  status: 'delivered' | 'pending' | 'failed';
}

export interface LineNotificationPayload {
  toUserId?: string;
  trackingNo: string;
  milestone?: LineMilestoneType;
  researcherName: string;
  articleTitle: string;
  statusText: string;
  amountText: string;
  actionUrl: string;
  timestamp: string;
}

export interface CalendarEventSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'committee_meeting' | 'payment_round' | 'sla_deadline' | 'submission_deadline';
  location: string;
  description: string;
  googleCalendarUrl?: string;
}

export type UserRole = 'researcher' | 'coordinator' | 'finance';

export interface UserProfile {
  id: string;
  name: string;
  academicPosition: string;
  department: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNo: string;
  idCardNo: string;
  role: UserRole;
  isNuAccount: boolean;
}
