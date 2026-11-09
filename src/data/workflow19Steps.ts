import { WorkflowStep, WorkflowStepId } from '../types';
export interface WorkflowStep19 {
  stepNumber: number;
  title: string;
  responsibleParty: 'นักวิจัย/เลขานุการ' | 'เจ้าหน้าที่งานวิจัย' | 'เจ้าหน้าที่นโยบายและแผน' | 'เจ้าหน้าที่การเงิน' | 'ผู้บริหาร';
  roleKey: 'researcher' | 'research-office' | 'policy-plan' | 'finance' | 'executives';
  phase: 1 | 2 | 3;
  phaseTitle: string;
  description: string;
  actionNote?: string;
  isFeedbackLoop?: boolean;
}

export const WORKFLOW_ROLES_DEF = [
  {
    key: 'researcher',
    name: 'นักวิจัย / เลขานุการ',
    count: 6,
    steps: '1, 2, 5, 6, 13, 19',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    dotColor: 'bg-blue-600',
  },
  {
    key: 'research-office',
    name: 'เจ้าหน้าที่งานวิจัย',
    count: 7,
    steps: '3, 4, 7, 8, 12, 14, 15',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-600',
  },
  {
    key: 'policy-plan',
    name: 'จนท. นโยบายและแผน',
    count: 1,
    steps: '9',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
  },
  {
    key: 'finance',
    name: 'เจ้าหน้าที่การเงิน',
    count: 3,
    steps: '10, 17, 18',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    dotColor: 'bg-purple-600',
  },
  {
    key: 'executives',
    name: 'ผู้บริหาร',
    count: 2,
    steps: '11, 16',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dotColor: 'bg-rose-600',
  },
] as const;

export const WORKFLOW_19_STEPS_DEF: WorkflowStep19[] = [
  {
    stepNumber: 1,
    title: 'นักวิจัยเข้าสู่ระบบ',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 1,
    phaseTitle: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์',
    description: 'ผู้ขอรับเงินรางวัลเข้าสู่ระบบสารสนเทศงานวิจัยด้วยบัญชีผู้ใช้มหาวิทยาลัยนเรศวร',
    actionNote: 'เข้าสู่ระบบออนไลน์',
  },
  {
    stepNumber: 2,
    title: 'ยื่นคำขอ / ร่างคำขอ',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 1,
    phaseTitle: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์',
    description: 'กรอกข้อมูลบทความวิจัย ระบุ DOI ตรวจสอบสิทธิ์โควตา และแนบไฟล์เอกสารหลักฐาน',
    actionNote: 'ส่งต่อเจ้าหน้าที่งานวิจัย',
  },
  {
    stepNumber: 3,
    title: 'เจ้าหน้าที่ตรวจสอบ',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 1,
    phaseTitle: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์',
    description: 'ตรวจสอบคุณสมบัติผลงานวิจัย ฐานข้อมูล Scopus/TCI สัดส่วนผู้ประพันธ์ และเกณฑ์เงินรางวัล',
    actionNote: 'ตรวจสอบความถูกต้อง',
  },
  {
    stepNumber: 4,
    title: 'ส่งคืนแก้ไข / แจ้งผลการตรวจสอบ',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 1,
    phaseTitle: 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์',
    description: 'หากเอกสารไม่สมบูรณ์ส่งคืนแก้ไขผ่านระบบ (Feedback Loop) หรือแจ้งผลผ่านการตรวจเมื่อถูกต้อง',
    actionNote: 'ส่งกลับแก้ไข / แจ้งผล',
    isFeedbackLoop: true,
  },
  {
    stepNumber: 5,
    title: 'นักวิจัยดาวน์โหลดเอกสารขออนุมัติเงินรางวัล',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'ดาวน์โหลดแบบฟอร์มเอกสารขออนุมัติเงินรางวัลที่ระบบประมวลผลให้อัตโนมัติ',
    actionNote: 'พิมพ์เอกสารขออนุมัติ',
  },
  {
    stepNumber: 6,
    title: 'เสนอบันทึกข้อความพร้อมเอกสารแนบ',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'ลงนามในบันทึกข้อความและรวบรวมเอกสารแนบนำส่งงานวิจัย คณะแพทยศาสตร์',
    actionNote: 'นำส่งแฟ้มเอกสาร',
  },
  {
    stepNumber: 7,
    title: 'งานวิจัยตรวจความครบถ้วน',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'ตรวจสอบชุดเอกสารบันทึกข้อความ ลายมือชื่อ และเอกสารประกอบความถูกต้อง',
    actionNote: 'ตรวจความครบถ้วน',
  },
  {
    stepNumber: 8,
    title: 'งานวิจัยเสนอผู้บริหารอนุมัติรางวัล / ค่าตีพิมพ์',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'จัดทำเรื่องเสนอผู้บริหาร และส่งต่อแฟ้มเรื่องไปยังงานนโยบายและแผน',
    actionNote: 'ส่งต่อฝ่ายนโยบายและแผน',
  },
  {
    stepNumber: 9,
    title: 'บันทึกข้อมูลงบประมาณ',
    responsibleParty: 'เจ้าหน้าที่นโยบายและแผน',
    roleKey: 'policy-plan',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'ตรวจสอบรหัสโครงการและบันทึกตัดยอดกรอบวงเงินในระบบแผนและงบประมาณ',
    actionNote: 'บันทึกตัดยอดงบประมาณ',
  },
  {
    stepNumber: 10,
    title: 'ตรวจเช็คงบประมาณ',
    responsibleParty: 'เจ้าหน้าที่การเงิน',
    roleKey: 'finance',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'ตรวจสอบความถูกต้องของวงเงิน แหล่งงบประมาณรายได้ และความสอดคล้องตามระเบียบการเงิน',
    actionNote: 'ตรวจเช็คงบประมาณ',
  },
  {
    stepNumber: 11,
    title: 'ผู้บริหารลงนามและอนุมัติตามลำดับ',
    responsibleParty: 'ผู้บริหาร',
    roleKey: 'executives',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'หัวหน้าภาควิชา / รองคณบดีฝ่ายวิจัย / คณบดีคณะแพทยศาสตร์ ลงนามอนุมัติกรอบวงเงิน',
    actionNote: 'ลงนามอนุมัติกรอบวงเงิน',
  },
  {
    stepNumber: 12,
    title: 'แจ้งผลการอนุมัติ',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 2,
    phaseTitle: 'ระยะที่ 2: การขออนุมัติหลักการ/กรอบวงเงินรางวัล',
    description: 'งานวิจัยแจ้งผลการอนุมัติผ่านระบบ เพื่อให้นักวิจัยเริ่มกระบวนการขอเบิกจ่ายเงินรางวัล',
    actionNote: 'แจ้งผลอนุมัติต่อนักวิจัย',
  },
  {
    stepNumber: 13,
    title: 'นักวิจัยดาวน์โหลดเอกสารขออนุมัติเบิกเงินรางวัล',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'ดาวน์โหลดแบบฟอร์มเอกสารขออนุมัติเบิกเงินรางวัล พร้อมใบสำคัญรับเงินที่ระบบออกให้',
    actionNote: 'จัดทำชุดเอกสารเบิกจ่าย',
  },
  {
    stepNumber: 14,
    title: 'งานวิจัยตรวจความครบถ้วน',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'ตรวจสอบชุดเอกสารขออนุมัติเบิกเงินรางวัลให้ตรงตามยอดและมติที่ได้รับอนุมัติ',
    actionNote: 'ตรวจเอกสารขอเบิกเงิน',
  },
  {
    stepNumber: 15,
    title: 'งานวิจัยเสนอผู้บริหารอนุมัติเบิกเงินรางวัล / ค่าตีพิมพ์',
    responsibleParty: 'เจ้าหน้าที่งานวิจัย',
    roleKey: 'research-office',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'เสนอแฟ้มขออนุมัติเบิกจ่ายเงินรางวัลจริงต่อผู้บริหารฝ่ายวิจัยและคณบดี',
    actionNote: 'เสนอผู้บริหารอนุมัติเบิกจ่าย',
  },
  {
    stepNumber: 16,
    title: 'ผู้บริหารลงนามและอนุมัติตามลำดับ',
    responsibleParty: 'ผู้บริหาร',
    roleKey: 'executives',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'ผู้บริหารลงนามอนุมัติคำสั่งเบิกจ่ายเงินรางวัลเข้าสู่กระบวนการคลัง',
    actionNote: 'ลงนามอนุมัติสั่งจ่าย',
  },
  {
    stepNumber: 17,
    title: 'จัดทำฎีกาส่งเบิกเงิน',
    responsibleParty: 'เจ้าหน้าที่การเงิน',
    roleKey: 'finance',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'เจ้าหน้าที่การเงินจัดทำฎีกาเบิกเงิน (Voucher No.) และส่งเบิกต่อกองคลังมหาวิทยาลัย',
    actionNote: 'จัดทำฎีกาเบิกคลัง',
  },
  {
    stepNumber: 18,
    title: 'โอนเงินเข้าบัญชีนักวิจัย',
    responsibleParty: 'เจ้าหน้าที่การเงิน',
    roleKey: 'finance',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'ดำเนินการโอนเงินรางวัล / ค่าตีพิมพ์เข้าบัญชีธนาคารของนักวิจัยตามที่ระบุไว้',
    actionNote: 'โอนเงินเข้าบัญชีธนาคาร',
  },
  {
    stepNumber: 19,
    title: 'ตรวจสอบผลการโอนเงิน',
    responsibleParty: 'นักวิจัย/เลขานุการ',
    roleKey: 'researcher',
    phase: 3,
    phaseTitle: 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี',
    description: 'นักวิจัยตรวจสอบผลการโอนเงินเข้าบัญชี และระบบบันทึกสถานะการเบิกจ่ายเสร็จสมบูรณ์',
    actionNote: 'สิ้นสุดกระบวนการ (Complete)',
  },
];

/**
 * แมปปิ้งขั้นตอนเดิม (Legacy 12 Steps) ไปยังโครงสร้าง 19 ขั้นตอนมาตรฐาน
 * เพื่อความเข้ากันได้แบบ 100% ย้อนหลัง (Backward Compatibility)
 */
export function mapLegacy12To19Step(legacyStep: number): WorkflowStepId {
  switch (legacyStep) {
    case 1: return 2;  // กรอกข้อมูลและแนบเอกสาร -> ยื่นคำขอ/ร่างคำขอ
    case 2: return 3;  // ผู้ประสานงานตรวจสอบ -> เจ้าหน้าที่ตรวจสอบ
    case 3: return 5;  // ลงนามและแนบเอกสาร -> นักวิจัยดาวน์โหลดเอกสารขออนุมัติ
    case 4: return 7;  // ตรวจสอบความถูกต้อง -> งานวิจัยตรวจความครบถ้วน
    case 5: return 8;  // ผู้บริหารฝ่ายวิจัยลงนาม -> งานวิจัยเสนอผู้บริหาร
    case 6: return 8;  // ทานความครบถ้วน -> งานวิจัยเสนอผู้บริหาร
    case 7: return 9;  // ลงข้อมูลบประมาณ -> บันทึกข้อมูลงบประมาณ (นโยบายและแผน)
    case 8: return 11; // ผู้บริหาร (คณบดี) ลงนาม -> ผู้บริหารลงนามอนุมัติตามลำดับ
    case 9: return 12; // ส่งเอกสารเบิกเงิน -> แจ้งผลการอนุมัติ
    case 10: return 17; // จัดทำฎีกาเบิกเงิน -> จัดทำฎีกาส่งเบิกเงิน (การเงิน)
    case 11: return 18; // ส่งสำเนาโอนเงิน -> โอนเงินเข้าบัญชีนักวิจัย
    case 12: return 19; // ลงบันทึกคุมเงินและแจ้งนักวิจัย -> ตรวจสอบผลการโอนเงิน (สิ้นสุด)
    default:
      if (legacyStep > 12 && legacyStep <= 19) return legacyStep as WorkflowStepId;
      return 1;
  }
}

/**
 * Normalizer: ปรับค่าตัวเลขขั้นตอนให้เป็น WorkflowStepId 1..19 อย่างปลอดภัย
 */
export function normalizeWorkflowStep(step: number | null | undefined): WorkflowStepId {
  if (!step || typeof step !== 'number' || isNaN(step)) return 1;
  const clamped = Math.max(1, Math.min(19, Math.round(step)));
  return clamped as WorkflowStepId;
}

/**
 * ค้นหาข้อมูลนิยามขั้นตอนที่ 1..19
 */
export function getWorkflow19StepDef(stepNumber: number): WorkflowStep19 | undefined {
  const normalized = normalizeWorkflowStep(stepNumber);
  return WORKFLOW_19_STEPS_DEF.find((s) => s.stepNumber === normalized);
}

/**
 * สร้าง Timeline รายการ 19 ขั้นตอนสำหรับคำขอ
 */
export function generateTimelineFor19Steps(currentStep: number): WorkflowStep[] {
  const normalizedCurrent = normalizeWorkflowStep(currentStep);
  return WORKFLOW_19_STEPS_DEF.map((step) => {
    let status: 'completed' | 'in_progress' | 'pending' | 'returned' = 'pending';
    let completedAt: string | undefined = undefined;

    if (step.stepNumber < normalizedCurrent) {
      status = 'completed';
      completedAt = new Date().toISOString().split('T')[0];
    } else if (step.stepNumber === normalizedCurrent) {
      status = 'in_progress';
    }

    return {
      stepNumber: step.stepNumber as WorkflowStepId,
      title: step.title,
      responsibleParty: step.responsibleParty,
      description: step.description,
      status,
      completedAt,
      phase: step.phase,
      phaseTitle: step.phaseTitle,
      actionNote: step.actionNote,
      isFeedbackLoop: step.isFeedbackLoop,
    };
  });
}
