import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  TableBorders,
  Packer,
  ImageRun,
  CharacterSet,
  Header,
  Footer,
  VerticalMergeType,
  VerticalAlign,
  TabStopType,
  LeaderType,
  DocumentGridType,
  UnderlineType,
  Tab
} from 'docx';
import { saveAs } from 'file-saver';
import { ResearchApplication } from '../types';
import { bahtText, formatBaht, getTrackingPrefix } from '../data/regulations';
import { GARUDA_BASE64 } from './garudaBase64';
import { MED_NU_LOGO_BASE64 } from './medNuLogo';
import { TEMPLATE_CHECKLIST_LOGO_BASE64 } from './templateChecklistLogo';
import { getThSarabunFontData } from './thSarabunBase64';
import { formatInternalDocNo, getDepartmentCode } from '../data/departmentCodes';


// =========================================================================
// STANDARD THAI GOVERNMENT SARABAN SPECIFICATIONS
// ตามระเบียบสำนักนายกรัฐมนตรี ว่าด้วยงานสารบรรณ พ.ศ. 2526 & คู่มือการจัดทำเอกสารราชการ
// =========================================================================
const FONT_NAME = 'TH Sarabun PSK';

// ฟอนต์ฝังในตัวไฟล์ docx เพื่อให้เครื่อง PC ปลายทางที่ไม่มีฟอนต์แสดงผลได้ถูกต้อง 100%
const FONT_CONFIG = {
  name: FONT_NAME,
  ascii: FONT_NAME,
  hAnsi: FONT_NAME,
  cs: FONT_NAME,
};

// Helper สำหรับสร้าง TextRun ภาษาไทยที่ปิดเส้นหยักตรวจคำผิด (noProof) และกำหนด Language Tag
function createThaiTextRun(options: ConstructorParameters<typeof TextRun>[0]): TextRun {
  const opts = typeof options === 'string' ? { text: options } : options;
  return new TextRun({
    font: FONT_CONFIG,
    noProof: true,
    language: {
      value: 'th-TH',
      eastAsia: 'th-TH',
      bidirectional: 'th-TH',
    },
    ...opts,
  });
}

// Helper สำหรับแทรก Zero-Width Space (\u200B) เพื่อให้ Word ตัดคำภาษาไทยตามวรรคตอนธรรมชาติได้อย่างถูกต้อง และจัดเต็มบรรทัด (Thai Distribute) โดยไม่เกิดช่องว่างถ่างผิดปกติ
export function addThaiWordBreaks(text: string): string {
  if (!text) return text;
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter('th', { granularity: 'word' });
      const segments = Array.from(segmenter.segment(text)).map((s: any) => s.segment);
      return segments.join('\u200B');
    } catch {
      // fallback to dictionary-based breaking below
    }
  }

  const zwsp = '\u200B';
  const breakWords = [
    'ข้าพเจ้า', 'ตำแหน่ง', 'อาจารย์', 'สังกัด', 'ภาควิชา', 'สถานวิทยาศาสตร์คลินิก', 'คณะแพทยศาสตร์',
    'มีความประสงค์', 'ขออนุมัติ', 'เงินรางวัล', 'ตีพิมพ์', 'บทความ', 'ในวารสาร', 'วิชาการ',
    'ระดับนานาชาติ', 'และระดับชาติ', 'ตามประกาศ', 'มหาวิทยาลัยนเรศวร', 'เรื่อง',
    'หลักเกณฑ์', 'การสนับสนุน', 'ค่าตีพิมพ์', 'และรางวัล', 'การตีพิมพ์บทความ',
    'ประกาศ ณ วันที่', 'พฤษภาคม', 'ซึ่งมีรายละเอียดดังนี้',
    'ตรวจสอบ', 'ความถูกต้อง', 'ครบถ้วน', 'ของเอกสาร', 'ตามเกณฑ์', 'การรับทุน',
    'และปรับปรุง', 'ข้อมูล', 'ในฐานข้อมูล', 'เรียบร้อยแล้ว',
    'อ้างถึงหนังสือ', 'ในการนี้', 'ข้าพเจ้าจึงขออนุมัติเบิกเงิน', 'รวมเป็นเงินทั้งสิ้น', 'รายละเอียดตามเอกสารแนบท้าย'
  ];
  let res = text;
  for (const w of breakWords) {
    res = res.split(w).join(zwsp + w + zwsp);
  }
  res = res.replace(/[\u200B]+/g, zwsp);
  res = res.replace(/\u200B /g, ' ').replace(/ \u200B/g, ' ');
  return res;
}

export function formatQuartileDisplay(q?: string, isTier1?: boolean): string {
  if (!q) return '-';
  const upper = q.toUpperCase();
  if (upper.includes('TIER 1') || upper.includes('TIER1') || upper.includes('TOP 10%') || isTier1) {
    return 'Quartile 1 (Tier 1)';
  }
  if (upper.includes('Q1')) return 'Quartile 1';
  if (upper.includes('Q2')) return 'Quartile 2';
  if (upper.includes('Q3')) return 'Quartile 3';
  if (upper.includes('Q4')) return 'Quartile 4';
  if (upper.includes('TCI 1') || upper.includes('TCI_1')) return 'TCI กลุ่ม 1';
  if (upper.includes('TCI 2') || upper.includes('TCI_2')) return 'TCI กลุ่ม 2';
  return q;
}

export function formatJournalDatabaseQuartile(app: Partial<ResearchApplication>): string {
  const journal = app.journalName || '-';
  const db = app.database || 'Scopus';
  const dbYear = app.databaseYear?.trim() ? ` ${app.databaseYear.trim()}` : '';
  const qStr = formatQuartileDisplay(app.quartile, app.isTier1Top10);
  return `${journal} จากฐานข้อมูล ${db}${dbYear} จัดอยู่ใน ${qStr}`;
}

export function formatPublicationVolumeIssue(app: Partial<ResearchApplication>): string {
  const v = app.vol?.trim() || '-';
  const n = app.no?.trim() || '-';
  const m = app.publishMonth?.trim() || '-';
  
  let y = app.publishYear?.trim();
  if (!y || y === '-') {
    if (app.publishedDate) {
      const parsedYear = new Date(app.publishedDate).getFullYear();
      if (!isNaN(parsedYear) && parsedYear > 1900) {
        y = parsedYear.toString();
      }
    }
  }
  if (!y) y = '-';

  const p = app.pages?.trim() || '-';

  if (v === '-' && n === '-' && m === '-' && (y === '-' || !app.publishYear) && p === '-' && app.volumeIssue?.trim()) {
    const volMatch = app.volumeIssue.match(/vol\.?\s*([^\s,]+)/i);
    const noMatch = app.volumeIssue.match(/(?:no|issue)\.?\s*([^\s,]+)/i);
    const monthMatch = app.volumeIssue.match(/month\s+([^\s,]+)|(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i);
    const yearMatch = app.volumeIssue.match(/(?:year|\()?(\b20\d\d\b)/i);
    const pagesMatch = app.volumeIssue.match(/(?:pages?|pp?\.?)\s*[:.]?\s*([0-9]+(?:\s*-\s*[0-9]+)?|[^\s,;]+)/i);

    const parsedV = volMatch ? volMatch[1] : '-';
    const parsedN = noMatch ? noMatch[1] : '-';
    const parsedM = monthMatch ? (monthMatch[1] || monthMatch[2]) : '-';
    const parsedY = yearMatch ? yearMatch[1] : (y !== '-' ? y : '-');
    const parsedP = pagesMatch ? pagesMatch[1] : '-';
    return `Vol ${parsedV} No ${parsedN} Month ${parsedM} Year ${parsedY} pages: ${parsedP}`;
  }

  return `Vol ${v} No ${n} Month ${m} Year ${y} pages: ${p}`;
}


function createThaiDocument(sections: any[]) {
  const fontData = getThSarabunFontData();
  return new Document({
    fonts: [
      {
        name: 'TH Sarabun PSK',
        data: fontData.regular as any,
        characterSet: CharacterSet.THAI,
      },
      {
        name: 'TH SarabunPSK',
        data: fontData.regular as any,
        characterSet: CharacterSet.THAI,
      },
      {
        name: 'TH Sarabun New',
        data: fontData.regular as any,
        characterSet: CharacterSet.THAI,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: FONT_CONFIG,
            size: FONT_SIZE_CONTENT,
            noProof: true,
            language: {
              value: 'th-TH',
              eastAsia: 'th-TH',
              bidirectional: 'th-TH',
            },
          },
          paragraph: {
            spacing: { line: 240, before: 0, after: 0 },
          },
        },
      },
    },
    sections: sections.map(sect => ({
      ...sect,
      properties: {
        grid: {
          type: DocumentGridType.DEFAULT,
        },
        ...sect.properties,
      },
    })),
  });
}

// ขนาดตัวอักษร (ใน docx หน่วยเป็น half-points: 1 pt = 2 half-points)
const FONT_SIZE_META = 32;          // 16 pt (ข้อความในส่วนราชการ, ที่, วันที่, เรื่อง)
const FONT_SIZE_CONTENT = 30;       // 15 pt (เนื้อหาบันทึกข้อความ ตรงตาม PDF text-[15pt] ตัดคำเต็มบรรทัดพอดี)
const FONT_SIZE_APPROVERS = 29;     // 14.5 pt (ส่วนลงนามหัวหน้างานวิจัยและรองคณบดีฯ)
const FONT_SIZE_MEMO_HEADER = 58;   // 29 pt (คำว่า "บันทึกข้อความ")
const FONT_SIZE_FIELD_LABEL = 40;   // 20 pt (คำว่า "ส่วนราชการ", "ที่", "วันที่", "เรื่อง")
const FONT_SIZE_TABLE = 28;         // 14 pt (ข้อความในตาราง)
const FONT_SIZE_TABLE_SM = 26;      // 13 pt
const FONT_SIZE_SUBTEXT = 24;       // 12 pt (หมายเหตุ/คำอธิบายย่อย)

// ระยะห่างบรรทัด (Line Spacing: 1.0 = 240, 0.9 = 216, 0.85 = 204)
const LINE_SPACING_HEADER = 216;    // 0.9 line spacing สำหรับส่วนราชการ, ที่, วันที่, เรื่อง
const LINE_SPACING_BODY = 204;      // 0.85 line spacing สำหรับเนื้อหา และส่วนลงนาม
const LINE_SPACING_SINGLE = 240;    // 1.0 line spacing (Single) สำหรับเนื้อหาบันทึกข้อความขออนุมัติเบิกเงินรางวัล

// ระยะขอบหน้ากระดาษราชการ A4 (dxa: 1 cm ≈ 567 dxa):
// - ขอบซ้าย: 3 เซนติเมตร (1,701 dxa) สำหรับเข้าแฟ้ม
// - ขอบขวา: 2 เซนติเมตร (1,134 dxa)
// - ขอบบน: 2.5 เซนติเมตร (1,417 dxa)
// - ขอบล่าง: 2 เซนติเมตร (1,134 dxa)
const STANDARD_SARABAN_MARGINS = {
  top: 1417,
  bottom: 1134,
  left: 1701,
  right: 1134,
};

// การย่อหน้าข้อความ: 2.5 เซนติเมตร (1,417 dxa) หรือ 0.5 นิ้ว (720 dxa)
const INDENT_SARABAN = 1417; // 2.5 cm

// เส้นตาราง
const BORDER_SINGLE = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};

const BORDER_NONE = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const CELL_BORDERS_ALL = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
};

const CELL_NO_PADDING = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
};

const CELL_BORDERS_NONE = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_NONE,
};

const CELL_BORDERS_VERTICAL_BODY = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
};

function formatAmountNumber(num: number): string {
  const hasDec = Math.abs(num % 1) > 0.001;
  return num.toLocaleString('th-TH', {
    minimumFractionDigits: hasDec ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

const CELL_BORDERS_BODY_LEFT = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_SINGLE,
  right: BORDER_NONE,
};

const CELL_BORDERS_BODY_MIDDLE = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_NONE,
};

const CELL_BORDERS_BODY_RIGHT = {
  top: BORDER_NONE,
  bottom: BORDER_NONE,
  left: BORDER_NONE,
  right: BORDER_SINGLE,
};

const CELL_BORDERS_SUMMARY_LEFT = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
};

const CELL_BORDERS_SUMMARY_RIGHT = {
  top: BORDER_SINGLE,
  bottom: BORDER_SINGLE,
  left: BORDER_SINGLE,
  right: BORDER_SINGLE,
};

const TABLE_BORDERS_NONE = TableBorders.NONE;


// ฟังก์ชันแปลงรูปแบบเงินเป็นภาษาไทยทางการ (ไม่มีเครื่องหมาย ฿ ต่อท้ายด้วย บาท)
export function formatCurrencyBaht(amount: number): string {
  const num = Number(amount) || 0;
  return num.toLocaleString('th-TH') + ' บาท';
}

// ฟังก์ชันแปลงวันที่เป็นรูปแบบราชการไทย (เช่น 17 กันยายน 2569)
export function formatThaiDateOfficial(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') return '...................................................';
  // If already contains Thai month name
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  for (const m of thaiMonths) {
    if (dateStr.includes(m)) return dateStr;
  }

  // Parse ISO or YYYY-MM-DD or date with time
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  const day = d.getDate();
  const month = thaiMonths[d.getMonth()];
  const year = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
  return `${day} ${month} ${year}`;
}

// ฟังก์ชันแปลงวันที่เป็นรูปแบบย่อไทย (เช่น 23 ก.ย. 69 หรือ 29 ต.ค. 68)
export function formatThaiDateShort(dateStr?: string): string {
  if (!dateStr || dateStr.trim() === '') return '';
  const shortThaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  for (const m of shortThaiMonths) {
    if (dateStr.includes(m)) return dateStr;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const month = shortThaiMonths[d.getMonth()];
  const fullYear = d.getFullYear() > 2400 ? d.getFullYear() : d.getFullYear() + 543;
  const yearShort = String(fullYear).slice(-2);
  return `${day} ${month} ${yearShort}`;
}

// ฟังก์ชันสร้างชื่อเรื่องบันทึกข้อความตามเงื่อนไข (มีคำว่า "บทความ")
export function getMemoSubject(app: ResearchApplication, isDisbursement = false): string {
  const isReward = (app.claimedRewardAmount || 0) > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = (app.approvedPageChargeAmount || 0) > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  const scopeStr = app.journalScope === 'national' ? 'ระดับชาติ' : 'ระดับนานาชาติ';

  if (isDisbursement) {
    if (isReward && isPage) {
      return `ขออนุมัติเบิกเงินสนับสนุนค่าตีพิมพ์และเงินรางวัลตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    } else if (isPage) {
      return `ขออนุมัติเบิกเงินสนับสนุนค่าตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    } else {
      return `ขออนุมัติเบิกเงินรางวัลตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    }
  } else {
    if (isReward && isPage) {
      return `ขอรับการสนับสนุนค่าตีพิมพ์และเงินรางวัลตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    } else if (isPage) {
      return `ขออนุมัติเงินสนับสนุนค่าตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    } else {
      return `ขออนุมัติเงินรางวัลตีพิมพ์บทความในวารสารวิชาการ${scopeStr}`;
    }
  }
}

// ฟังก์ชันระบุตำแหน่งคำลงท้ายใต้ลายเซ็นผู้ขอรับทุน/รางวัล
export function getApplicantSignRoleTitle(app: ResearchApplication): string {
  const isReward = (app.claimedRewardAmount || 0) > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = (app.approvedPageChargeAmount || 0) > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  if (isReward && isPage) return 'ผู้ขอรับค่าตีพิมพ์และรางวัล';
  if (isPage) return 'ผู้ขอรับค่าตีพิมพ์';
  return 'ผู้ขอรับรางวัล';
}

// แปลง Base64 ของรูปครุฑเป็น Uint8Array
function getGarudaImageData(): Uint8Array {
  const binaryString = atob(GARUDA_BASE64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// แปลง Base64 ของโลโก้คณะแพทยศาสตร์ มน. เป็น Uint8Array
function getMedNuImageData(): Uint8Array {
  const binaryString = atob(MED_NU_LOGO_BASE64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function getTemplateChecklistLogoData(): Uint8Array {
  const binaryString = atob(TEMPLATE_CHECKLIST_LOGO_BASE64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// -------------------------------------------------------------------------
// 1. Checklist: แบบตรวจสอบรายการขอรับทุนสนับสนุนค่าตีพิมพ์ (AWP Checklist)
// ปรับปรุงตรงตามความต้องการของผู้ใช้และแบบฟอร์ม 100%
// -------------------------------------------------------------------------
export async function generateChecklistDocx(app: ResearchApplication) {
  const trackingPrefix = getTrackingPrefix(app.fiscalYear);
  const rewardAmt = app.claimedRewardAmount || 0;
  const pageAmt = app.approvedPageChargeAmount || 0;
  const logoImg = getTemplateChecklistLogoData();

  // ขนาดตัวอักษรเนื้อหา checklist คือ 14 pt (28 half-points) ตามที่ผู้ใช้กำหนด
  const FONT_CHECKLIST = 28; // 14 pt

  const symChecked = () => createThaiTextRun({ text: '☑ ', size: FONT_CHECKLIST });

  // 2. ประเภททุนสนับสนุน
  const isReward = rewardAmt > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = pageAmt > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  const rewardList: TextRun[] = [];
  if (isReward) {
    rewardList.push(createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: 'รางวัลตีพิมพ์', size: FONT_CHECKLIST }));
  }
  if (isPage) {
    if (rewardList.length > 0) {
      rewardList.push(createThaiTextRun({ text: '     ', size: FONT_CHECKLIST }));
    } else {
      rewardList.push(createThaiTextRun({ text: ' ' }));
    }
    rewardList.push(symChecked(), createThaiTextRun({ text: 'ค่าตีพิมพ์', size: FONT_CHECKLIST }));
  }
  if (rewardList.length === 0) {
    rewardList.push(createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: 'รางวัลตีพิมพ์', size: FONT_CHECKLIST }));
  }

  // 3. ประเภทบทความ
  const isOther = app.articleType === 'other_academic';
  const articleTypeRun = isOther
    ? [createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: '2) บทความวิชาการอื่น ๆ (เช่น Case report, Case series, Clinical picture, Clinical note, Technical note)', size: FONT_CHECKLIST })]
    : [createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: '1) บทความวิชาการ (Research Article, Review Article, หรือ Guidelines)', size: FONT_CHECKLIST })];

  // 4. การมีส่วนร่วม
  const isFirst = app.authorRole === 'first_author';
  const isCorr = app.authorRole === 'corresponding_author';
  let authorRoleRuns: TextRun[] = [];
  if (isFirst) {
    authorRoleRuns = [createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: '1) ผู้เขียนชื่อแรก (First Author)', size: FONT_CHECKLIST })];
  } else if (isCorr) {
    authorRoleRuns = [createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: '1) ผู้เขียนชื่อหลัก (Corresponding Author)', size: FONT_CHECKLIST })];
  } else {
    authorRoleRuns = [createThaiTextRun({ text: ' ' }), symChecked(), createThaiTextRun({ text: '2) ผู้ร่วมเขียน (Co-author)', size: FONT_CHECKLIST })];
  }

  // 6. ประเภทฐานข้อมูล & Quartile
  const isNational = app.journalScope === 'national';
  const dbName = app.database || (isNational ? 'TCI' : 'Scopus');
  const qStr = app.quartile || 'Q1';

  const dbScopeRuns: TextRun[] = isNational
    ? [
        createThaiTextRun({ text: ' ระดับชาติ   ', bold: true, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: `${dbName}   `, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: qStr, size: FONT_CHECKLIST }),
      ]
    : [
        createThaiTextRun({ text: ' ระดับนานาชาติ   ', bold: true, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: `${dbName}   `, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: qStr, size: FONT_CHECKLIST }),
      ];

  const doc = createThaiDocument([
    {
      properties: {
        page: {
          margin: {
            top: 567,     // 1.0 cm
            bottom: 567,  // 1.0 cm
            left: 850,    // 1.5 cm
            right: 850,   // 1.5 cm
            header: 567,  // 1.0 cm (หัวกระดาษจากขอบ)
            footer: 567,  // 1.0 cm (ท้ายกระดาษจากขอบ)
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: TABLE_BORDERS_NONE,
              rows: [
                new TableRow({
                  children: [
                    // Col 1: Logo คณะแพทย์ จัดกึ่งกลางทั้งแนวตั้งและแนวนอน
                    new TableCell({
                      width: { size: 14, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      borders: {
                        top: BORDER_NONE,
                        left: BORDER_NONE,
                        right: BORDER_NONE,
                        bottom: BORDER_SINGLE,
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new ImageRun({
                              data: logoImg,
                              transformation: {
                                width: 70,
                                height: 70,
                              },
                              type: 'png',
                            } as any),
                          ],
                        }),
                      ],
                    }),
                    // Col 2: ข้อความหัวกระดาษ 3 บรรทัด ตัวหนา 14 จัดกึ่งกลาง
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      borders: {
                        top: BORDER_NONE,
                        left: BORDER_NONE,
                        right: BORDER_NONE,
                        bottom: BORDER_SINGLE,
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            createThaiTextRun({
                              text: 'แบบตรวจสอบรายการขอรับทุนสนับสนุนค่าตีพิมพ์',
                              size: 28, // 14 pt
                              bold: true,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            createThaiTextRun({
                              text: 'รางวัลตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ',
                              size: 28, // 14 pt
                              bold: true,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            createThaiTextRun({
                              text: 'คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร',
                              size: 28, // 14 pt
                              bold: true,
                            }),
                          ],
                        }),
                      ],
                    }),
                    // Col 3: รหัส Tracking ตัวหนา ในกล่องข้อความพอดีกับข้อความ ไม่ซ้ำ AWP
                    new TableCell({
                      width: { size: 16, type: WidthType.PERCENTAGE },
                      verticalAlign: VerticalAlign.CENTER,
                      borders: {
                        top: BORDER_NONE,
                        left: BORDER_NONE,
                        right: BORDER_NONE,
                        bottom: BORDER_SINGLE,
                      },
                      children: [
                        new Table({
                          alignment: AlignmentType.CENTER,
                          borders: CELL_BORDERS_ALL,
                          rows: [
                            new TableRow({
                              children: [
                                new TableCell({
                                  borders: CELL_BORDERS_ALL,
                                  children: [
                                    new Paragraph({
                                      alignment: AlignmentType.CENTER,
                                      children: [
                                        createThaiTextRun({
                                          text: app.trackingNo,
                                          font: 'Arial Black',
                                          size: 22, // 11 pt
                                          bold: true,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              spacing: { line: 200, before: 0, after: 0 },
              children: [
                createThaiTextRun({
                  text: '* ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ (ประกาศ ณ วันที่ 27 พฤษภาคม 2567)',
                  size: 20, // 10 pt
                }),
              ],
            }),
            new Paragraph({
              spacing: { line: 200, before: 0, after: 0 },
              children: [
                createThaiTextRun({
                  text: '** ปรับปรุงล่าสุด Version3.10 / 10 ก.ย. 69',
                  size: 20, // 10 pt
                }),
              ],
            }),
            new Paragraph({
              spacing: { line: 200, before: 0, after: 0 },
              children: [
                createThaiTextRun({
                  text: '*** สำหรับตรวจเช็คความครบถ้วนของเอกสารและความถูกต้องของข้อมูลเท่านั้น',
                  size: 20, // 10 pt
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // ==========================================
        // TABLE 1: ข้อมูลและเกณฑ์การขอรับทุน (ฟอนต์ 13 pt)
        // ==========================================
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS_ALL,
          margins: { top: 0, bottom: 0, left: 100, right: 100 },
          rows: [
            // Row 1: หัวข้อ | รายละเอียด
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 24, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [createThaiTextRun({ text: 'หัวข้อ', size: FONT_CHECKLIST, bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 76, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [createThaiTextRun({ text: 'รายละเอียด', size: FONT_CHECKLIST, bold: true })],
                    }),
                  ],
                }),
              ],
            }),
            // Row 2: 1. ชื่อผู้ขอรับทุน
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 1. ชื่อผู้ขอรับทุน', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ` ${app.applicantName}`, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 3: หน่วยงานที่สังกัด
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '     หน่วยงานที่สังกัด', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ` ${app.department} คณะแพทยศาสตร์`, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 4: 2. ประเภททุนสนับสนุน (แสดงเฉพาะรายการที่ขอรับทุน)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 2. ประเภททุนสนับสนุน', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      children: rewardList,
                    }),
                  ],
                }),
              ],
            }),
            // Row 5: 3. ชื่อบทความ
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 3. ชื่อบทความ', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ` ${app.articleTitle}`, size: FONT_CHECKLIST, italics: true })] })],
                }),
              ],
            }),
            // Row 6: ประเภทบทความ (แสดงเฉพาะประเภทที่เลือก)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '     ประเภทบทความ', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      children: articleTypeRun,
                    }),
                  ],
                }),
              ],
            }),
            // Row 7: 4. การมีส่วนร่วม (แสดงเฉพาะการมีส่วนร่วมที่เลือกไว้)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 4. การมีส่วนร่วม', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      children: authorRoleRuns,
                    }),
                  ],
                }),
              ],
            }),
            // Row 8: 5. ชื่อวารสาร
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 5. ชื่อวารสาร', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ` ${app.journalName}`, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 9: 6. ประเภทฐานข้อมูล (แสดงเฉพาะที่เลือกไว้)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: ' 6. ประเภทฐานข้อมูล', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      children: dbScopeRuns,
                    }),
                  ],
                }),
              ],
            }),
            // Row 10: 7. บทความที่ขอรับรางวัลตีพิมพ์เผยแพร่แล้ว...
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      children: [
                        createThaiTextRun({
                          text: ' 7. บทความที่ขอรับรางวัลตีพิมพ์เผยแพร่แล้ว ไม่เกิน 24 เดือน และไม่เป็นส่วนหนึ่งในการขอจบการศึกษาเพื่อปริญญา',
                          size: FONT_CHECKLIST,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ==========================================
        // HEADER TABLE 2: เอกสารประกอบการรับทุน...
        // ==========================================
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            createThaiTextRun({
              text: '    เอกสารประกอบการรับทุนสนับสนุนค่าตีพิมพ์/เบิกเงินรางวัลตีพิมพ์',
              size: FONT_CHECKLIST,
              bold: true,
            }),
          ],
        }),

        // ==========================================
        // TABLE 2: ตารางรายการเอกสาร 13 ข้อ + ลายเซ็นใต้หัวตารางตรงตามรูปแนบ
        // หัวตาราง merge ช่องที่ 1 กับ 2 เป็น "รายการ", ช่อง 3 กับ 4 เป็น "/ = มี   X = ไม่มี"
        // ==========================================
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          columnWidths: [918, 6328, 816, 2144],
          borders: CELL_BORDERS_ALL,
          margins: { top: 0, bottom: 0, left: 100, right: 100 },
          rows: [
            // Row 1: Header ตาราง 2 (merge col 1 และ 2 เป็น "รายการ", merge col 3 และ 4 เป็น "/ = มี   X = ไม่มี")
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  width: { size: 71, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายการ', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  columnSpan: 2,
                  width: { size: 29, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [createThaiTextRun({ text: '/ = มี   X = ไม่มี', size: FONT_CHECKLIST, bold: true })],
                    }),
                  ],
                }),
              ],
            }),

            // Items 1-9: เงินรางวัล
            ...[
              ' 1. บันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์ รางวัลตีพิมพ์',
              ' 2. แบบฟอร์มประกอบการอนุมัติงบประมาณ',
              ' 3. บันทึกข้อความขออนุมัติเบิกเงิน',
              ' 4. ใบสำคัญรับเงิน',
              ' 5. สำเนาบัตรประชาชน (รับรองสำเนาถูกต้อง)',
              ' 6. สำเนาหน้าบัญชีธนาคารสำหรับโอนเงิน',
              ' 7. สำเนาบทความที่ได้รับการตีพิมพ์ (รับรองสำเนาถูกต้องทุกหน้า)',
              ' 8. สำเนาหลักฐานอ้างอิงฐานข้อมูล JCR/SJR/Scopus/TCI',
              ' 9. สำเนาประกาศหลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์',
            ].map((title, idx) =>
              new TableRow({
                children: [
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        width: { size: 9, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'เงินรางวัล', size: FONT_CHECKLIST, bold: true })] })],
                      })
                    : new TableCell({
                        verticalMerge: VerticalMergeType.CONTINUE,
                        width: { size: 9, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [],
                      }),
                  new TableCell({
                    width: { size: 62, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ children: [createThaiTextRun({ text: title, size: FONT_CHECKLIST })] })],
                  }),
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: isReward ? '/' : 'X', size: FONT_CHECKLIST, bold: true })] })],
                  }),
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        verticalAlign: VerticalAlign.BOTTOM,
                        width: { size: 21, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_NONE,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200, after: 40 },
                            children: [
                              createThaiTextRun({ text: '....................................................', size: FONT_CHECKLIST }),
                              createThaiTextRun({ text: `(${app.applicantName})`, size: FONT_CHECKLIST, break: 1 }),
                              createThaiTextRun({ text: 'ผู้ขอรับทุน/รางวัลตีพิมพ์', size: FONT_CHECKLIST, break: 1 }),
                              createThaiTextRun({ text: 'วันที่....................................', size: FONT_CHECKLIST, break: 1 }),
                            ],
                          }),
                        ],
                      })
                    : new TableCell({
                        verticalMerge: VerticalMergeType.CONTINUE,
                        width: { size: 21, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_NONE,
                        children: [],
                      }),
                ],
              })
            ),

            // Items 10-13: ค่าตีพิมพ์
            ...[
              ' 10. เอกสารแสดงการตอบรับตีพิมพ์จากวารสาร',
              ' 11. ใบเรียกเก็บเงินค่าตีพิมพ์จากวารสารที่ระบุข้อมูลเชื่อมโยงกับหลักฐานในข้อ 10.',
              ' 12. หลักฐานการจ่ายเงินหรือใบเสร็จรับเงินสกุลเงินบาท',
              ' 13. ใบรับรองการจ่ายเงินค่า page charge',
            ].map((title, idx) =>
              new TableRow({
                children: [
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        width: { size: 9, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'ค่าตีพิมพ์', size: FONT_CHECKLIST, bold: true })] })],
                      })
                    : new TableCell({
                        verticalMerge: VerticalMergeType.CONTINUE,
                        width: { size: 9, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [],
                      }),
                  new TableCell({
                    width: { size: 62, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ children: [createThaiTextRun({ text: title, size: FONT_CHECKLIST })] })],
                  }),
                  new TableCell({
                    width: { size: 8, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: isPage ? '/' : 'X', size: FONT_CHECKLIST, bold: true })] })],
                  }),
                  new TableCell({
                    verticalMerge: VerticalMergeType.CONTINUE,
                    width: { size: 22, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_NONE,
                    children: [],
                  }),
                ],
              })
            ),
          ],
        }),

        // ==========================================
        // ข้อความตรวจสอบและลายเซ็นผู้ประสานงานท้ายหน้า (10 เคาะ, เต็มบรรทัดไม่ถ่าง, ลายเซ็นกึ่งกลางชิดขวา)
        // ==========================================
        new Paragraph({
          spacing: { before: 80, after: 30, line: 240 },
          alignment: AlignmentType.THAI_DISTRIBUTE,
          children: [
            createThaiTextRun({
              text: addThaiWordBreaks(
                '          ตรวจสอบความถูกต้องครบถ้วนของเอกสารตามเกณฑ์การรับทุนสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร และปรับปรุงข้อมูลในฐานข้อมูลเรียบร้อยแล้ว'
              ),
              size: FONT_CHECKLIST,
            }),
          ],
        }),
        // ลายเซ็นผู้ประสานงาน จัดกึ่งกลางชิดขวา (Borderless Table: ซ้าย 55% ว่าง, ขวา 45% จัดกึ่งกลาง)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ children: [] })],
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 50, line: 240 },
                      children: [
                        createThaiTextRun({
                          text: '.............................................................. ผู้ประสานงาน',
                          size: FONT_CHECKLIST,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 240 },
                      children: [
                        createThaiTextRun({
                          text: '(..........…….…………………………………………)',
                          size: FONT_CHECKLIST,
                        }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 240 },
                      children: [
                        createThaiTextRun({
                          text: 'วันที่ ....................................................',
                          size: FONT_CHECKLIST,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ]);
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `1_แบบตรวจสอบรายการ_${app.trackingNo.replace('/', '_')}.docx`);
}



// -------------------------------------------------------------------------
// 2. บันทึกข้อความขออนุมัติเงินรางวัล (ตามแบบฟอร์ม 2 & Version 4.0.0.25Sep2026)
// -------------------------------------------------------------------------
export async function generateMemoRewardDocx(app: ResearchApplication) {
  const rewardAmt = app.claimedRewardAmount || 0;
  const pageAmt = app.approvedPageChargeAmount || 0;
  const totalAmt = app.totalClaimedAmount || 0;
  const garudaImg = getGarudaImageData();

  const isReward = rewardAmt > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = pageAmt > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  const subject = getMemoSubject(app, false);
  const effectiveDeptCode = app.deptCode || getDepartmentCode(app.department);
  const isDocOfficiallyNumbered = Boolean(app.isOnlineReviewComplete && app.docRunningNo);
  const docNoText = isDocOfficiallyNumbered 
    ? formatInternalDocNo(effectiveDeptCode, app.docRunningNo) 
    : (app.internalDocNo || formatInternalDocNo(effectiveDeptCode, ''));
  const dateText = (app.isOnlineReviewComplete && app.officialDocDate) 
    ? formatThaiDateOfficial(app.officialDocDate) 
    : '';

  const authorRoleText = app.authorRole === 'first_author' 
    ? '(1)First author' 
    : app.authorRole === 'corresponding_author' 
    ? '(1)Corresponding author' 
    : '(2)Co-author';

  const scopeText = app.journalScope === 'national' ? '(ข)ระดับชาติ' : '(ก)ระดับนานาชาติ';
  const articleTypeText = app.articleType === 'research_article' ? '1)Research Article' : '2)บทความวิชาการอื่นๆ';

  const doc = createThaiDocument([
    {
      properties: {
        page: {
          margin: {
            top: 1134,    // 2.0 cm
            bottom: 850,   // 1.5 cm
            left: 1701,    // 3.0 cm
            right: 1134,   // 2.0 cm
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
              children: [
                createThaiTextRun({ text: 'Version 4.0.0.25Sep2026', font: FONT_NAME, size: 18 }),
              ],
            }),
          ],
        }),
      },
      children: [
        // 1. ส่วนหัว: ตาราง 3 คอลัมน์ ครุฑซ้าย 20%, บันทึกข้อความ กึ่งกลาง 60% (28 pt ตัวหนา), ขวาว่าง 20%
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      spacing: { line: 240, before: 0, after: 0 },
                      children: [
                        new ImageRun({
                          data: garudaImg,
                          transformation: {
                            width: 57, // 1.5 cm ≈ 56.7 pt
                            height: 57,
                          },
                          type: 'png',
                        } as any),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 60, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 240, before: 0, after: 0 },
                      children: [
                        createThaiTextRun({
                          text: 'บันทึกข้อความ',
                          font: FONT_NAME,
                          size: 56, // 28 pt
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ spacing: { line: 240, before: 0, after: 0 }, text: '' })],
                }),
              ],
            }),
          ],
        }),

        // 2. ส่วนราชการ: ตัวหนา 20 pt (size: 40) ข้อความหลัง 16 pt (size: 32) ขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
        new Paragraph({
          spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
          tabStops: [
            { type: TabStopType.RIGHT, position: 9071 },
          ],
          children: [
            createThaiTextRun({ text: 'ส่วนราชการ  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: `คณะแพทยศาสตร์  ภาควิชา${app.department || ''}  โทร. ${app.phone || 'ภายในคณะ'}`, 
              font: FONT_NAME, 
              size: FONT_SIZE_META,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 3. ที่ และ วันที่: แยก 2 คอลัมน์ (48% / 52% ให้ 'วันที่' ตรงกับคำว่า 'ข้อ' ของ 'บันทึกข้อความ') พร้อมขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 48, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4354 },
                      ],
                      children: [
                        createThaiTextRun({ text: 'ที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: docNoText, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_META,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                        new TextRun({
                          children: [new Tab()],
                          font: FONT_CONFIG,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 52, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4717 },
                      ],
                      children: [
                        createThaiTextRun({ text: 'วันที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: dateText, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_META,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                        new TextRun({
                          children: [new Tab()],
                          font: FONT_CONFIG,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 4. เรื่อง: ตัวหนา 20 pt (size: 40) ข้อความหลัง 16 pt (size: 32) ขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
        new Paragraph({
          spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
          tabStops: [
            { type: TabStopType.RIGHT, position: 9071 },
          ],
          children: [
            createThaiTextRun({ text: 'เรื่อง  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: subject, 
              font: FONT_NAME, 
              size: FONT_SIZE_META,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 5. คำขึ้นต้น: เรียน คณบดีคณะแพทยศาสตร์ space before = 6/ after = 6 (120 dxa)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 120, after: 120 },
          children: [
            createThaiTextRun({ text: 'เรียน   คณบดีคณะแพทยศาสตร์', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 6. ภาคเหตุ: เคาะ 10 จัดกระจายแบบไทย (THAI_DISTRIBUTE) space before = 0/ after = 0
        new Paragraph({
          alignment: AlignmentType.THAI_DISTRIBUTE,
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({
              text: addThaiWordBreaks(`          ข้าพเจ้า ${app.applicantName} ตำแหน่ง ${app.academicPosition || 'อาจารย์แพทย์'} สังกัด ภาควิชา${app.department || ''} คณะแพทยศาสตร์ มีความประสงค์${subject} ตามประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 ซึ่งมีรายละเอียดดังนี้`),
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 7. รายละเอียดบทความ (เคาะ 10 space before = 0/ after = 0 ทั้งหมด)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          ชื่อบทความที่ได้รับการตีพิมพ์ : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: `${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_CONTENT, italics: true }),
          ],
        }),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          ชื่อวารสาร : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: formatJournalDatabaseQuartile(app), font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          วัน/เดือน/ปีที่พิมพ์ : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: formatPublicationVolumeIssue(app), font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        ...(app.doi ? [
          new Paragraph({
            spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
            children: [
              createThaiTextRun({ text: '          DOI : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
              createThaiTextRun({ text: `${app.doi}`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            ],
          })
        ] : []),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          การมีส่วนในผลงาน : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: authorRoleText, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          วารสารวิชาการ : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: `${scopeText}   `, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: 'บทความประเภท : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: articleTypeText, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({
              text: isReward && isPage
                ? `          โดยขออนุมัติ เงินรางวัลตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmt)} (${bahtText(rewardAmt)})`
                : isReward
                ? `          โดยขออนุมัติ เงินรางวัลตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmt)} (${bahtText(rewardAmt)})`
                : `          โดยขออนุมัติ ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageAmt)} (${bahtText(pageAmt)})`,
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
              break: 0,
            }),
            ...(isReward && isPage ? [
              createThaiTextRun({
                text: `                       ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageAmt)} (${bahtText(pageAmt)})`,
                font: FONT_NAME,
                size: FONT_SIZE_CONTENT,
                break: 1,
              })
            ] : []),
            createThaiTextRun({
              text: `                       รวมเป็นเงินทั้งสิ้น ${formatCurrencyBaht(totalAmt)} (${bahtText(totalAmt)})`,
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
              bold: true,
              break: 1,
            }),
          ],
        }),

        // 8. ภาคสรุป: เคาะ 10 space before = 6/ after = 6 (120 dxa)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 120, after: 120 },
          children: [
            createThaiTextRun({ text: '          จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 9. ลายมือชื่อผู้ขอรับรางวัล (ชิดกั้นหลัง จัดกึ่งกลางบล็อก space before = 6/ after = 6 (120 dxa))
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [new Paragraph({ spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 }, text: '' })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_BODY, before: 120, after: 120 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ.............................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                        createThaiTextRun({ text: getApplicantSignRoleTitle(app), font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 10. ส่วนลงนามของหัวหน้างานวิจัยและรองคณบดีฯ (บล็อกซ้าย จัดกึ่งกลางในบล็อก, 14.5 pt)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 120, after: 120 },
          children: [
            createThaiTextRun({ text: 'เรียน  คณบดีคณะแพทยศาสตร์', font: FONT_NAME, size: FONT_SIZE_APPROVERS, bold: true }),
            createThaiTextRun({ text: '          ขอเบิกจ่ายจาก งบประมาณรายได้ปี ........................', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
            createThaiTextRun({ text: '          จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
          ],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_BODY, before: 120, after: 0 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ....................................................', font: FONT_NAME, size: FONT_SIZE_APPROVERS }),
                        createThaiTextRun({ text: '(นางสาวปรารถนา เอนกปัญญากุล)', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'รักษาการในตำแหน่งหัวหน้างานวิจัย', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'วันที่......../........./...........', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_BODY, before: 240, after: 0 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ....................................................', font: FONT_NAME, size: FONT_SIZE_APPROVERS }),
                        createThaiTextRun({ text: '(รองศาสตราจารย์ นายแพทย์อาทิตย์ เหล่าเรืองธนา)', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'รองคณบดีฝ่ายวิจัยและถ่ายทอดเทคโนโลยี', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'วันที่......../........./...........', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [new Paragraph({ spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 }, text: '' })],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ]);

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `2_บันทึกข้อความ_ขออนุมัติเงินรางวัล_${app.trackingNo.replace('/', '_')}.docx`);
}

// -------------------------------------------------------------------------
// 3. บันทึกข้อความขออนุมัติเบิกเงินรางวัล (ตามแบบฟอร์ม 3 & Version 4.0.0.25Sep2026)
// -------------------------------------------------------------------------
export async function generateMemoDisbursementDocx(app: ResearchApplication) {
  const rewardAmt = app.claimedRewardAmount || 0;
  const pageAmt = app.approvedPageChargeAmount || 0;
  const totalAmt = app.totalClaimedAmount || 0;
  const garudaImg = getGarudaImageData();

  const isReward = rewardAmt > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = pageAmt > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  const subject = getMemoSubject(app, true);
  const memoApprovalSubject = getMemoSubject(app, false);
  const effectiveDeptCode = app.deptCode || getDepartmentCode(app.department);
  const isDocOfficiallyNumbered = Boolean(app.isOnlineReviewComplete && app.docRunningNo);
  const docNoText = isDocOfficiallyNumbered 
    ? formatInternalDocNo(effectiveDeptCode, app.docRunningNo) 
    : (app.internalDocNo || formatInternalDocNo(effectiveDeptCode, ''));
  const dateText = (app.isOnlineReviewComplete && app.officialDocDate) 
    ? formatThaiDateOfficial(app.officialDocDate) 
    : '';

  const doc = createThaiDocument([
    {
      properties: {
        page: {
          margin: {
            top: 1134,    // 2.0 cm
            bottom: 850,   // 1.5 cm
            left: 1701,    // 3.0 cm
            right: 1134,   // 2.0 cm
          },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
              children: [
                createThaiTextRun({ text: 'Version 4.0.0.25Sep2026', font: FONT_NAME, size: 18 }),
              ],
            }),
          ],
        }),
      },
      children: [
        // 1. ส่วนหัว: ตาราง 3 คอลัมน์ ครุฑซ้าย 20%, บันทึกข้อความ กึ่งกลาง 60% (28 pt ตัวหนา), ขวาว่าง 20%
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      spacing: { line: 240, before: 0, after: 0 },
                      children: [
                        new ImageRun({
                          data: garudaImg,
                          transformation: {
                            width: 57, // 1.5 cm ≈ 56.7 pt
                            height: 57,
                          },
                          type: 'png',
                        } as any),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 60, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: 240, before: 0, after: 0 },
                      children: [
                        createThaiTextRun({
                          text: 'บันทึกข้อความ',
                          font: FONT_NAME,
                          size: 56, // 28 pt
                          bold: true,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 20, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ spacing: { line: 240, before: 0, after: 0 }, text: '' })],
                }),
              ],
            }),
          ],
        }),

        // 2. ส่วนราชการ: ตัวหนา 20 pt (size: 40) ข้อความหลัง 16 pt (size: 32) ขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
        new Paragraph({
          spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
          tabStops: [
            { type: TabStopType.RIGHT, position: 9071 },
          ],
          children: [
            createThaiTextRun({ text: 'ส่วนราชการ  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: `คณะแพทยศาสตร์  ภาควิชา${app.department || ''}  โทร. ${app.phone || 'ภายในคณะ'}`, 
              font: FONT_NAME, 
              size: FONT_SIZE_META,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 3. ที่ และ วันที่: แยก 2 คอลัมน์ (48% / 52% ให้ 'วันที่' ตรงกับคำว่า 'ข้อ' ของ 'บันทึกข้อความ') พร้อมขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 48, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4354 },
                      ],
                      children: [
                        createThaiTextRun({ text: 'ที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: docNoText, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_META,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                        new TextRun({
                          children: [new Tab()],
                          font: FONT_CONFIG,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 52, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4717 },
                      ],
                      children: [
                        createThaiTextRun({ text: 'วันที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: dateText, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_META,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                        new TextRun({
                          children: [new Tab()],
                          font: FONT_CONFIG,
                          underline: { type: UnderlineType.DOTTED },
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 4. เรื่อง: ตัวหนา 20 pt (size: 40) ข้อความหลัง 16 pt (size: 32) ขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
        new Paragraph({
          spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
          tabStops: [
            { type: TabStopType.RIGHT, position: 9071 },
          ],
          children: [
            createThaiTextRun({ text: 'เรื่อง  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: subject, 
              font: FONT_NAME, 
              size: FONT_SIZE_META,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 5. คำขึ้นต้น: เรียน คณบดีคณะแพทยศาสตร์ space before = 6/ after = 6 (120 dxa)
        new Paragraph({
          spacing: { line: LINE_SPACING_SINGLE, before: 120, after: 120 },
          children: [
            createThaiTextRun({ text: 'เรียน   คณบดีคณะแพทยศาสตร์', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 6. ภาคเหตุ (อ้างถึง): เคาะ 10 จัดกระจายแบบไทย (THAI_DISTRIBUTE) space before = 0/ after = 0
        new Paragraph({
          alignment: AlignmentType.THAI_DISTRIBUTE,
          spacing: { line: LINE_SPACING_SINGLE, before: 0, after: 0 },
          children: [
            createThaiTextRun({
              text: addThaiWordBreaks(`          อ้างถึงหนังสือคณะแพทยศาสตร์ ที่ ${docNoText || 'อว 0603.10...../.....'} ลงวันที่ ${dateText || '...................................................'} เรื่อง ${memoApprovalSubject} บทความวิจัยเรื่อง “${app.articleTitle}” นั้น`),
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 7. ภาคความประสงค์: เคาะ 10 จัดกระจายแบบไทย (THAI_DISTRIBUTE) space before = 0/ after = 0
        new Paragraph({
          alignment: AlignmentType.THAI_DISTRIBUTE,
          spacing: { line: LINE_SPACING_SINGLE, before: 0, after: 0 },
          children: [
            createThaiTextRun({
              text: addThaiWordBreaks(`          ในการนี้ ข้าพเจ้าจึงขออนุมัติเบิกเงิน${isPage ? `ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageAmt)} (${bahtText(pageAmt)}) ` : ''}${isReward && isPage ? 'และ' : ''}${isReward ? `รางวัลตีพิมพ์ตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmt)} (${bahtText(rewardAmt)})` : ''} รวมเป็นเงินทั้งสิ้น ${formatCurrencyBaht(totalAmt)} (${bahtText(totalAmt)}) รายละเอียดตามเอกสารแนบท้าย`),
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 8. ภาคสรุป: เคาะ 10 space before = 6/ after = 6 (120 dxa)
        new Paragraph({
          spacing: { line: LINE_SPACING_SINGLE, before: 120, after: 120 },
          children: [
            createThaiTextRun({ text: '          จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 9. ลายมือชื่อผู้ขอรับรางวัล (ชิดกั้นหลัง จัดกึ่งกลางบล็อก space before = 6/ after = 6 (120 dxa))
        // (หมายเหตุ: ตัดข้อความส่วนของหัวหน้างานและรองคณบดีออกตามที่ผู้ใช้ร้องขอ)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [new Paragraph({ spacing: { line: LINE_SPACING_SINGLE, before: 0, after: 0 }, text: '' })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_SINGLE, before: 120, after: 120 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ.............................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                        createThaiTextRun({ text: getApplicantSignRoleTitle(app), font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ]);

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `3_บันทึกข้อความ_ขออนุมัติเบิกเงินรางวัล_${app.trackingNo.replace('/', '_')}.docx`);
}

// -------------------------------------------------------------------------
// 4. ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร (ตามแบบฟอร์ม 4 & media_1790149942514.png)
// -------------------------------------------------------------------------
export async function generateReceiptDocx(app: ResearchApplication) {
  const rewardAmt = app.claimedRewardAmount || 0;
  const pageAmt = app.approvedPageChargeAmount || 0;
  const totalAmt = app.totalClaimedAmount || 0;

  const doc = createThaiDocument([
    {
      properties: {
        page: {
          margin: STANDARD_SARABAN_MARGINS,
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            createThaiTextRun({ text: 'ใบสำคัญรับเงิน', font: FONT_NAME, size: 44, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            createThaiTextRun({ text: 'มหาวิทยาลัยนเรศวร', font: FONT_NAME, size: 32, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 80, after: 120 },
          children: [
            createThaiTextRun({ text: 'วันที่............เดือน................................พ.ศ. .........', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 160 },
          children: [
            createThaiTextRun({ text: 'ข้าพเจ้า ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: app.applicantName, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: ' ที่อยู่คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: 'ตำบล ท่าโพธิ์  อำเภอ เมือง  จังหวัด พิษณุโลก', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
            createThaiTextRun({ text: 'ได้รับเงินจากมหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
          ],
        }),

        // Table รายการเงิน (มีเฉพาะเส้นแนวตั้งและขอบนอก ไม่มีเส้นแนวนอนด้านใน)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          margins: {
            top: 80,
            bottom: 80,
            left: 140,
            right: 140,
          },
          borders: {
            top: BORDER_SINGLE,
            bottom: BORDER_SINGLE,
            left: BORDER_SINGLE,
            right: BORDER_SINGLE,
            insideHorizontal: BORDER_NONE,
            insideVertical: BORDER_SINGLE,
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 8, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'ที่', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 52, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายการ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'หน่วยละ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวนเงิน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
              ],
            }),
            ...(pageAmt > 0
              ? [
                  new TableRow({
                    children: [
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ children: [createThaiTextRun({ text: 'เงินสนับสนุนค่าตีพิมพ์บทความ', font: FONT_NAME, size: FONT_SIZE_TABLE }), createThaiTextRun({ text: `เรื่อง ${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_TABLE, break: 1 })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatAmountNumber(pageAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatAmountNumber(pageAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                    ],
                  }),
                ]
              : []),
            ...(rewardAmt > 0
              ? [
                  new TableRow({
                    children: [
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: pageAmt > 0 ? '2' : '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ children: [createThaiTextRun({ text: 'เงินรางวัลตีพิมพ์บทความ', font: FONT_NAME, size: FONT_SIZE_TABLE }), createThaiTextRun({ text: `เรื่อง ${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_TABLE, break: 1 })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatAmountNumber(rewardAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatAmountNumber(rewardAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                    ],
                  }),
                ]
              : []),
            // แถวว่าง 5 แถว ตามข้อกำหนด (มีเส้นแนวตั้ง ไม่มีเส้นแนวนอน)
            ...[1, 2, 3, 4, 5].map(() => new TableRow({
              children: [
                new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ text: '' })] }),
                new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ text: '' })] }),
                new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ text: '' })] }),
                new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ text: '' })] }),
                new TableCell({ borders: CELL_BORDERS_VERTICAL_BODY, children: [new Paragraph({ text: '' })] }),
              ],
            })),
            new TableRow({
              children: [
                new TableCell({ columnSpan: 4, borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รวม', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatAmountNumber(totalAmt), font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 80, after: 180 },
          children: [
            createThaiTextRun({ text: 'จำนวนเงิน  ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: `${bahtText(totalAmt)}`, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
          ],
        }),

        // ลายเซ็นผู้รับเงินและผู้จ่ายเงิน (จัดกึ่งกลางชิดขวา)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ text: '' })],
                }),
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 180, after: 180 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ..........................................................ผู้รับเงิน', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 180, after: 0 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ..........................................................ผู้จ่ายเงิน', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: '(........................................................)', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ]);

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `4_ใบสำคัญรับเงิน_${app.trackingNo.replace('/', '_')}.docx`);
}

// -------------------------------------------------------------------------
// 5. ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน page charge ตามข้อ 46 & media_1790149973030.png)
// -------------------------------------------------------------------------
export async function generateCertificationDocx(app: ResearchApplication) {
  const pageAmt = app.approvedPageChargeAmount || 0;
  const certAmt = app.claimedPageChargeAmount || app.approvedPageChargeAmount || pageAmt || app.totalClaimedAmount || 0;
  const isOver70k = certAmt > 70000;
  const part1 = Math.min(certAmt, 30000);
  const part2 = Math.min(Math.max(0, certAmt - 30000), 40000);
  const bahtPart = Math.floor(certAmt).toLocaleString('th-TH');
  const satangNum = Math.round((certAmt % 1) * 100);
  const satangPart = satangNum === 0 ? '-' : satangNum.toString().padStart(2, '0');
  const paidDateShort = formatThaiDateShort(app.pageChargePaidDate || app.publishedDate || app.createdAt) || '29 ต.ค. 68';

  const doc = createThaiDocument([
    {
      properties: {
        page: {
          margin: STANDARD_SARABAN_MARGINS,
        },
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            createThaiTextRun({ text: 'ใบรับรองการจ่ายเงิน', font: FONT_NAME, size: 44, bold: true }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            createThaiTextRun({ text: 'ส่วนราชการ มหาวิทยาลัยนเรศวร', font: FONT_NAME, size: 36, bold: true }),
          ],
        }),

        // ตารางใบรับรอง มีคอลัมน์ บาท และ สตางค์
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'วัน เดือน ปี', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 52, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายละเอียดการจ่าย', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ columnSpan: 2, borders: CELL_BORDERS_ALL, width: { size: 20, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวนเงิน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'หมายเหตุ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: paidDateShort, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [
                    new Paragraph({ children: [createThaiTextRun({ text: `ค่าตีพิมพ์ เรื่อง ${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_TABLE })] }),
                    new Paragraph({ text: '' }),
                    ...(isOver70k ? [
                      new Paragraph({ children: [createThaiTextRun({ text: 'ขอเบิกจ่ายเพียง 70,000.00 (เจ็ดหมื่นบาทถ้วน)', font: FONT_NAME, size: FONT_SIZE_TABLE_SM, bold: true })] }),
                      new Paragraph({ children: [createThaiTextRun({ text: '- ฉบับจริงใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ จำนวนเงิน 30,000.00 (สามหมื่นบาทถ้วน)', font: FONT_NAME, size: FONT_SIZE_TABLE_SM })] }),
                      new Paragraph({ children: [createThaiTextRun({ text: '- ฉบับสำเนาใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ จำนวนเงิน 40,000.00 (สี่หมื่นบาทถ้วน)', font: FONT_NAME, size: FONT_SIZE_TABLE_SM })] }),
                    ] : [
                      new Paragraph({ children: [createThaiTextRun({ text: `- ฉบับจริงใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ จำนวนเงิน ${formatCurrencyBaht(part1)} (${bahtText(part1)})`, font: FONT_NAME, size: FONT_SIZE_TABLE_SM })] }),
                      ...(part2 > 0 ? [
                        new Paragraph({ children: [createThaiTextRun({ text: `- ฉบับสำเนาใช้เบิกจ่ายตามประกาศมหาวิทยาลัยนเรศวรเรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ จำนวนเงิน ${formatCurrencyBaht(part2)} (${bahtText(part2)})`, font: FONT_NAME, size: FONT_SIZE_TABLE_SM })] }),
                      ] : []),
                    ]),
                  ],
                }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: bahtPart, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 6, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: satangPart, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({ columnSpan: 2, borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รวมทั้งสิ้น', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: bahtPart, font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: satangPart, font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
              ],
            }),
          ],
        }),

        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: 80, after: 160 },
          children: [
            createThaiTextRun({ text: 'รวมทั้งสิ้น (ตัวอักษร)   ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: `${bahtText(certAmt)}`, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true, underline: { type: UnderlineType.SINGLE } }),
          ],
        }),

        // ข้อความรับรองตามระเบียบกระทรวงการคลัง (เว้นวรรคปกติ ไม่ใช้ justify เพื่อไม่ให้คำถ่าง)
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { after: 180 },
          children: [
            createThaiTextRun({ text: 'ข้าพเจ้า ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: app.applicantName, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true, underline: { type: UnderlineType.SINGLE } }),
            createThaiTextRun({ text: '  ตำแหน่ง  ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            createThaiTextRun({ text: app.academicPosition || 'อาจารย์แพทย์', font: FONT_NAME, size: FONT_SIZE_CONTENT, underline: { type: UnderlineType.SINGLE } }),
            createThaiTextRun({ text: `สังกัด ${app.department} คณะแพทยศาสตร์ ขอรับรองว่า รายจ่ายข้างต้นนี้ ข้าพเจ้าได้จ่ายเงินไปโดยได้รับใบเสร็จรับเงินซึ่งมีรายการไม่ครบถ้วนตามหลักฐานการจ่ายเงินในข้อ 46 หรือซึ่งตามลักษณะไม่อาจเรียกใบเสร็จรับเงินจากผู้รับเงินได้ ซึ่งเป็นไปตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลัง การรับเงิน การจ่ายเงิน การเก็บรักษาเงิน และการนำเงินส่งคลัง พ.ศ. 2562`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
          ],
        }),

        // ส่วนลงนาม (จัดกึ่งกลางชิดขวา)
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: TABLE_BORDERS_NONE,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 45, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ text: '' })],
                }),
                new TableCell({
                  width: { size: 55, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 180, after: 0 },
                      children: [
                        createThaiTextRun({ text: '(ลงชื่อ).......................................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                        createThaiTextRun({ text: 'วันที่ ...................................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ]);

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `5_ใบสำคัญรับรองจ่าย_${app.trackingNo.replace('/', '_')}.docx`);
}

// -------------------------------------------------------------------------
// Download All 5 Documents sequentially
// -------------------------------------------------------------------------
export async function generateAllDocsDocx(app: ResearchApplication) {
  await generateChecklistDocx(app);
  await generateMemoRewardDocx(app);
  await generateMemoDisbursementDocx(app);
  await generateReceiptDocx(app);
  await generateCertificationDocx(app);
}
