import { ArticleType, AuthorRole, DatabaseName, JournalScope, QuartileRank } from '../types';

export interface CalculationResult {
  rewardAmount: number;
  maxPageChargeAllowed: number;
  approvedPageCharge: number;
  totalApproved: number;
  eligible: boolean;
  ineligibilityReason?: string;
  ruleCitation: string;
  notes: string[];
}

/**
 * Calculate publication reward and approved page charge
 * strictly adhering to Faculty of Medicine Naresuan University announcement (27 May 2024)
 */
export function calculateFacultyReward(params: {
  journalScope: JournalScope;
  database: DatabaseName;
  quartile: QuartileRank;
  isTier1Top10?: boolean;
  authorRole: AuthorRole;
  articleType: ArticleType;
  claimedPageCharge: number; // จ่ายจริงตามใบเสร็จ (บาท)
  alreadyUsedQuotaInYear: number; // ยอดที่เบิกไปแล้วในปีงบประมาณนี้
}): CalculationResult {
  const {
    journalScope,
    quartile,
    isTier1Top10 = false,
    authorRole,
    articleType,
    claimedPageCharge,
    alreadyUsedQuotaInYear,
  } = params;

  let rewardAmount = 0;
  let maxPageChargeAllowed = 0;
  let ruleCitation = '';
  const notes: string[] = [];

  // 1. Co-author eligibility check (ข้อ 5(2) วรรคสอง และ ข้อ 8(2))
  if (authorRole === 'co_author') {
    if (journalScope !== 'international' || (quartile !== 'Q1' && quartile !== 'Q1_Tier1' && quartile !== 'Q2')) {
      return {
        rewardAmount: 0,
        maxPageChargeAllowed: 0,
        approvedPageCharge: 0,
        totalApproved: 0,
        eligible: false,
        ineligibilityReason: 'กรณีผู้ร่วมเขียน (Co-author) ต้องเป็นบทความในวารสารนานาชาติ Quartile 1-2 เท่านั้น ตามข้อ 5(2)',
        ruleCitation: 'ประกาศฯ ข้อ 5(2) และข้อ 8(2)',
        notes: ['ไม่ผ่านเกณฑ์คุณสมบัติ Co-author']
      };
    }
    notes.push('ผู้ขอรับการสนับสนุนเป็น Co-author ได้รับเงินรางวัลร้อยละ 50 ของอัตราปกติ (ข้อ 8(2))');
  }

  // 2. Determine Reward Amount (ข้อ 8)
  if (journalScope === 'international') {
    if (articleType === 'research_article') {
      // 8(1)(ก)(1)
      if (isTier1Top10 || quartile === 'Q1_Tier1') {
        rewardAmount = 35000;
        ruleCitation = 'ข้อ 8(1)(ก)(1)(ก) Q1 Tier 1 (Top 10%) = 35,000 บาท';
      } else if (quartile === 'Q1') {
        rewardAmount = 25000;
        ruleCitation = 'ข้อ 8(1)(ก)(1)(ข) Quartile 1 = 25,000 บาท';
      } else if (quartile === 'Q2') {
        rewardAmount = 15000;
        ruleCitation = 'ข้อ 8(1)(ก)(1)(ค) Quartile 2 = 15,000 บาท';
      } else if (quartile === 'Q3' || quartile === 'Q4') {
        rewardAmount = 5000;
        ruleCitation = 'ข้อ 8(1)(ก)(1)(ง) Quartile 3 & 4 = 5,000 บาท';
      }
    } else {
      // 8(1)(ก)(2) บทความวิชาการอื่นๆ (Case report, Case series, Technical note, ฯลฯ)
      if (isTier1Top10 || quartile === 'Q1_Tier1') {
        rewardAmount = 17500;
        ruleCitation = 'ข้อ 8(1)(ก)(2)(ก) อื่นๆ Q1 Tier 1 = 17,500 บาท';
      } else if (quartile === 'Q1') {
        rewardAmount = 12500;
        ruleCitation = 'ข้อ 8(1)(ก)(2)(ข) อื่นๆ Quartile 1 = 12,500 บาท';
      } else if (quartile === 'Q2') {
        rewardAmount = 7500;
        ruleCitation = 'ข้อ 8(1)(ก)(2)(ค) อื่นๆ Quartile 2 = 7,500 บาท';
      } else if (quartile === 'Q3' || quartile === 'Q4') {
        rewardAmount = 2500;
        ruleCitation = 'ข้อ 8(1)(ก)(2)(ง) อื่นๆ Quartile 3 & 4 = 2,500 บาท';
      }
    }

    // Co-author modifier: 50%
    if (authorRole === 'co_author') {
      rewardAmount = rewardAmount * 0.5;
    }

    // 3. Determine Page Charge Support (ข้อ 9(1))
    if (quartile === 'Q1' || quartile === 'Q1_Tier1' || quartile === 'Q2') {
      maxPageChargeAllowed = 40000;
      notes.push('ค่าตีพิมพ์ Q1-Q2 คณะสนับสนุนตามจ่ายจริงไม่เกิน 40,000 บาท (ข้อ 9(1)(ก))');
    } else if (quartile === 'Q3') {
      maxPageChargeAllowed = 40000;
      notes.push('ค่าตีพิมพ์ Q3 สนับสนุนไม่เกิน 40,000 บาท (ข้อ 9(1)(ข))');
    } else if (quartile === 'Q4') {
      maxPageChargeAllowed = 10000;
      notes.push('ค่าตีพิมพ์ Q4 สนับสนุนไม่เกิน 10,000 บาท (ข้อ 9(1)(ค))');
    }

  } else {
    // ระดับชาติ (TCI)
    if (articleType === 'research_article') {
      if (quartile === 'TCI_1') {
        rewardAmount = 2000;
        ruleCitation = 'ข้อ 8(1)(ข)(1)(ก) TCI กลุ่ม 1 = 2,000 บาท';
      } else {
        rewardAmount = 1000;
        ruleCitation = 'ข้อ 8(1)(ข)(1)(ข) TCI กลุ่ม 2 = 1,000 บาท';
      }
    } else {
      if (quartile === 'TCI_1') {
        rewardAmount = 1000;
        ruleCitation = 'ข้อ 8(1)(ข)(2)(ก) อื่นๆ TCI กลุ่ม 1 = 1,000 บาท';
      } else {
        rewardAmount = 500;
        ruleCitation = 'ข้อ 8(1)(ข)(2)(ข) อื่นๆ TCI กลุ่ม 2 = 500 บาท';
      }
    }

    // ค่าตีพิมพ์ระดับชาติ (ข้อ 9(2))
    maxPageChargeAllowed = 5000;
    notes.push('ค่าตีพิมพ์ระดับชาติ สนับสนุนตามจ่ายจริงไม่เกิน 5,000 บาท (ข้อ 9(2))');
  }

  // Calculate actual approved page charge: min(claimed, maxPageChargeAllowed)
  const approvedPageCharge = Math.min(claimedPageCharge, maxPageChargeAllowed);
  let totalApproved = rewardAmount + approvedPageCharge;

  // 4. Annual Cap Check (ข้อ 12: กรอบวงเงินไม่เกิน 150,000 บาทต่อคนต่อปีงบประมาณ)
  const MAX_ANNUAL_CAP = 150000;
  const remainingQuota = Math.max(0, MAX_ANNUAL_CAP - alreadyUsedQuotaInYear);

  if (alreadyUsedQuotaInYear + totalApproved > MAX_ANNUAL_CAP) {
    notes.push(`*หมายเหตุ: คำขอเกินกรอบวงเงิน 150,000 บาท/คน/ปี (เบิกไปแล้ว ${alreadyUsedQuotaInYear.toLocaleString()} บาท, โควตาคงเหลือ ${remainingQuota.toLocaleString()} บาท)`);
    totalApproved = Math.min(totalApproved, remainingQuota);
  }

  return {
    rewardAmount,
    maxPageChargeAllowed,
    approvedPageCharge,
    totalApproved,
    eligible: true,
    ruleCitation,
    notes,
  };
}

/**
 * Currency formatter to Thai Baht (with decimal/satang support e.g. 125,216.54)
 */
export function formatBaht(amount: number): string {
  const hasFraction = Math.abs(amount % 1) > 0.001;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function convertThaiNumberUnderMillion(n: number): string {
  if (n === 0) return '';
  const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];
  let str = '';
  let temp = n;
  let pos = 0;

  while (temp > 0) {
    const d = temp % 10;
    if (d !== 0) {
      if (pos === 1 && d === 1) {
        str = 'สิบ' + str;
      } else if (pos === 1 && d === 2) {
        str = 'ยี่สิบ' + str;
      } else if (pos === 0 && d === 1 && (temp > 1 || Math.floor(n / 10) > 0)) {
        str = 'เอ็ด' + str;
      } else {
        str = digits[d] + positions[pos] + str;
      }
    }
    pos++;
    temp = Math.floor(temp / 10);
  }
  return str;
}

/**
 * Convert number to Thai Baht Text (เช่น 125,216.54 -> หนึ่งแสนสองหมื่นห้าพันสองร้อยสิบหกบาทห้าสิบสี่สตางค์)
 * Exactly as used on official receipt forms (ใบสำคัญรับเงิน, บันทึกข้อความ)
 */
export function bahtText(num: number): string {
  if (!num || isNaN(num) || num === 0) return 'ศูนย์บาทถ้วน';

  const absNum = Math.abs(num);
  const baht = Math.floor(absNum);
  const satang = Math.round((absNum - baht) * 100);

  let result = '';
  
  if (baht >= 1000000) {
    const millions = Math.floor(baht / 1000000);
    const remainder = baht % 1000000;
    result += convertThaiNumberUnderMillion(millions) + 'ล้าน';
    if (remainder > 0) {
      result += convertThaiNumberUnderMillion(remainder);
    }
    result += 'บาท';
  } else if (baht > 0) {
    result = convertThaiNumberUnderMillion(baht) + 'บาท';
  } else {
    result = 'ศูนย์บาท';
  }

  if (satang > 0) {
    const tens = Math.floor(satang / 10);
    const ones = satang % 10;
    let satangText = '';
    const digits = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];

    if (tens > 0) {
      if (tens === 1) satangText += 'สิบ';
      else if (tens === 2) satangText += 'ยี่สิบ';
      else satangText += digits[tens] + 'สิบ';
    }
    if (ones > 0) {
      if (tens > 0 && ones === 1) satangText += 'เอ็ด';
      else satangText += digits[ones];
    }
    result += satangText + 'สตางค์';
  } else {
    result += 'ถ้วน';
  }

  return result;
}

/**
 * Auto-format Thai Citizen ID as X-XXXX-XXXXX-XX-X (13 digits)
 * E.g. 1234567890123 -> 1-2345-67890-12-3
 */
export function formatThaiCitizenId(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 13);
  let res = '';
  if (digits.length > 0) res += digits.substring(0, 1);
  if (digits.length > 1) res += '-' + digits.substring(1, 5);
  if (digits.length > 5) res += '-' + digits.substring(5, 10);
  if (digits.length > 10) res += '-' + digits.substring(10, 12);
  if (digits.length > 12) res += '-' + digits.substring(12, 13);
  return res;
}

/**
 * Mask Thai Citizen ID according to PDPA principles
 * E.g. 1-2345-67890-12-3 -> 1-XXXX-XXXXX-XX-3
 */
export function maskThaiCitizenId(value: string): string {
  if (!value) return '';
  const formatted = formatThaiCitizenId(value);
  if (!formatted || formatted.length < 17) return formatted;
  // 1-2345-67890-12-3 -> 1-XXXX-XXXXX-XX-3
  return `${formatted.substring(0, 2)}XXXX-XXXXX-XX-${formatted.slice(-1)}`;
}

/**
 * Auto-format Krungsri Bank Account No as XXX-X-XXXXX-X (10 digits)
 * E.g. 3460000001 -> 346-0-00000-1
 */
export function formatKrungsriAccountNo(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 10);
  let res = '';
  if (digits.length > 0) res += digits.substring(0, 3);
  if (digits.length > 3) res += '-' + digits.substring(3, 4);
  if (digits.length > 4) res += '-' + digits.substring(4, 9);
  if (digits.length > 9) res += '-' + digits.substring(9, 10);
  return res;
}

/**
 * Mask Bank Account Number according to PDPA principles
 * E.g. 346-1-48984-7 -> 346-X-XXXXX-7
 */
export function maskBankAccountNo(value: string): string {
  if (!value) return '';
  const formatted = formatKrungsriAccountNo(value);
  if (!formatted || formatted.length < 13) return formatted;
  // 346-1-48984-7 -> 346-X-XXXXX-7
  return `${formatted.substring(0, 4)}X-XXXXX-${formatted.slice(-1)}`;
}

/**
 * Format currency with commas and 2 decimals for Page Charge input
 * E.g. 125216.54 -> 125,216.54
 */
export function formatPageChargeInput(raw: string): string {
  if (!raw) return '';
  const clean = raw.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  let intPart = parts[0] || '';
  const decPart = parts.length > 1 ? parts.slice(1).join('') : null;

  if (intPart) {
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  if (decPart !== null) {
    return `${intPart || '0'}.${decPart.slice(0, 2)}`;
  }
  return intPart;
}

/**
 * Parse formatted currency string to number
 */
export function parsePageCharge(formatted: string): number {
  if (!formatted) return 0;
  const clean = formatted.replace(/,/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Extract 2-digit Buddhist Era fiscal year string
 * e.g. 2569 -> "69", 2570 -> "70", 2568 -> "68"
 */
export function getFiscalYearShortCode(fiscalYear: number | string): string {
  const num = typeof fiscalYear === 'number' ? fiscalYear : parseInt(String(fiscalYear), 10);
  if (!num || isNaN(num)) return '69';
  const yearStr = String(Math.floor(num));
  return yearStr.length >= 2 ? yearStr.slice(-2) : yearStr.padStart(2, '0');
}

/**
 * Get tracking prefix based on fiscal year
 * e.g. 2569 -> "AWP69", 2570 -> "AWP70", 2568 -> "AWP68"
 */
export function getTrackingPrefix(fiscalYear: number | string): string {
  return `AWP${getFiscalYearShortCode(fiscalYear)}`;
}

/**
 * Parse fiscal year from tracking number if present
 * e.g. "AWP69-054" -> 2569, "AWP70-001" -> 2570
 */
export function parseFiscalYearFromTrackingNo(trackingNo: string): number | null {
  if (!trackingNo) return null;
  const match = trackingNo.match(/^AWP(\d{2})-/i);
  if (match) {
    return 2500 + parseInt(match[1], 10);
  }
  return null;
}

/**
 * Calculate the next tracking number for a given fiscal year
 * based on existing applications or tracking numbers
 * e.g. For fiscal year 2570, if no item exists, returns "AWP70-001"
 * If "AWP70-003" exists, returns "AWP70-004"
 */
export function generateNextTrackingNo(
  fiscalYear: number | string,
  existingTrackingNos: string[] = []
): string {
  const prefix = getTrackingPrefix(fiscalYear);
  const regex = new RegExp(`^${prefix}-(\\d+)`, 'i');
  let maxSeq = 0;

  for (const t of existingTrackingNos) {
    if (!t) continue;
    const match = t.trim().match(regex);
    if (match) {
      const seq = parseInt(match[1], 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  // If there are existing records for this fiscal year, increment by 1.
  // If no records exist yet for this fiscal year, start at 1 (e.g. AWP70-001)
  const nextSeq = maxSeq > 0 ? maxSeq + 1 : 1;
  return `${prefix}-${String(nextSeq).padStart(3, '0')}`;
}

