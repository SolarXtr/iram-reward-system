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
const FONT_SIZE_CONTENT = 32;       // 16 pt (เนื้อหาปกติ)
const FONT_SIZE_APPROVERS = 29;     // 14.5 pt (ส่วนลงนามหัวหน้างานวิจัยและรองคณบดีฯ)
const FONT_SIZE_MEMO_HEADER = 58;   // 29 pt (คำว่า "บันทึกข้อความ")
const FONT_SIZE_FIELD_LABEL = 40;   // 20 pt (คำว่า "ส่วนราชการ", "ที่", "วันที่", "เรื่อง")
const FONT_SIZE_TABLE = 28;         // 14 pt (ข้อความในตาราง)
const FONT_SIZE_TABLE_SM = 26;      // 13 pt
const FONT_SIZE_SUBTEXT = 24;       // 12 pt (หมายเหตุ/คำอธิบายย่อย)

// ระยะห่างบรรทัด (Line Spacing: 1.0 = 240, 0.9 = 216, 0.85 = 204)
const LINE_SPACING_HEADER = 216;    // 0.9 line spacing สำหรับส่วนราชการ, ที่, วันที่, เรื่อง
const LINE_SPACING_BODY = 204;      // 0.85 line spacing สำหรับเนื้อหา และส่วนลงนาม

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

// ฟังก์ชันสร้างชื่อเรื่องบันทึกข้อความตามเงื่อนไข
export function getMemoSubject(app: ResearchApplication, isDisbursement = false): string {
  const isReward = (app.claimedRewardAmount || 0) > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = (app.approvedPageChargeAmount || 0) > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  
  let typeStr = 'ค่าตีพิมพ์และรางวัลตีพิมพ์';
  if (isReward && isPage) {
    typeStr = 'ค่าตีพิมพ์และรางวัลตีพิมพ์';
  } else if (isPage) {
    typeStr = 'ค่าตีพิมพ์';
  } else if (isReward) {
    typeStr = 'รางวัลตีพิมพ์';
  }

  const scopeStr = app.journalScope === 'national' ? 'ระดับชาติ' : 'ระดับนานาชาติ';
  const actionStr = isDisbursement ? 'ขออนุมัติเบิกเงิน' : 'ขออนุมัติเงิน';
  return `${actionStr}${typeStr}ในวารสารวิชาการ${scopeStr}`;
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

  // ขนาดตัวอักษรเนื้อหา checklist คือ 13 pt (26 half-points) ตามที่ผู้ใช้กำหนด
  const FONT_CHECKLIST = 26; // 13 pt

  const symChecked = () => createThaiTextRun({ text: '☑ ', size: FONT_CHECKLIST });

  // 2. ประเภททุนสนับสนุน
  const isReward = rewardAmt > 0 || app.requestType === 'reward_only' || app.requestType === 'both';
  const isPage = pageAmt > 0 || app.requestType === 'page_charge_only' || app.requestType === 'both';
  const rewardList: TextRun[] = [];
  if (isReward) {
    rewardList.push(symChecked(), createThaiTextRun({ text: 'รางวัลตีพิมพ์', size: FONT_CHECKLIST }));
  }
  if (isPage) {
    if (rewardList.length > 0) rewardList.push(createThaiTextRun({ text: '     ', size: FONT_CHECKLIST }));
    rewardList.push(symChecked(), createThaiTextRun({ text: 'ค่าตีพิมพ์', size: FONT_CHECKLIST }));
  }
  if (rewardList.length === 0) {
    rewardList.push(symChecked(), createThaiTextRun({ text: 'รางวัลตีพิมพ์', size: FONT_CHECKLIST }));
  }

  // 3. ประเภทบทความ
  const isOther = app.articleType === 'other_academic';
  const articleTypeRun = isOther
    ? [symChecked(), createThaiTextRun({ text: '2) บทความวิชาการอื่น ๆ (เช่น Case report, Case series, Clinical picture, Clinical note, Technical note)', size: FONT_CHECKLIST })]
    : [symChecked(), createThaiTextRun({ text: '1) บทความวิชาการ (Research Article, Review Article, หรือ Guidelines)', size: FONT_CHECKLIST })];

  // 4. การมีส่วนร่วม
  const isFirst = app.authorRole === 'first_author';
  const isCorr = app.authorRole === 'corresponding_author';
  let authorRoleRuns: TextRun[] = [];
  if (isFirst) {
    authorRoleRuns = [symChecked(), createThaiTextRun({ text: '1) ผู้เขียนชื่อแรก (First Author)', size: FONT_CHECKLIST })];
  } else if (isCorr) {
    authorRoleRuns = [symChecked(), createThaiTextRun({ text: '1) ผู้เขียนชื่อหลัก (Corresponding Author)', size: FONT_CHECKLIST })];
  } else {
    authorRoleRuns = [symChecked(), createThaiTextRun({ text: '2) ผู้ร่วมเขียน (Co-author)', size: FONT_CHECKLIST })];
  }

  // 6. ประเภทฐานข้อมูล & Quartile
  const isNational = app.journalScope === 'national';
  const dbName = app.database || (isNational ? 'TCI' : 'Scopus');
  const qStr = app.quartile || 'Q1';

  const dbScopeRuns: TextRun[] = isNational
    ? [
        createThaiTextRun({ text: 'ระดับชาติ   ', bold: true, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: `${dbName}   `, size: FONT_CHECKLIST }),
        symChecked(),
        createThaiTextRun({ text: qStr, size: FONT_CHECKLIST }),
      ]
    : [
        createThaiTextRun({ text: 'ระดับนานาชาติ   ', bold: true, size: FONT_CHECKLIST }),
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
            top: 576,    // 1 cm
            bottom: 576, // 1 cm
            left: 576,   // 1 cm
            right: 576,  // 1 cm
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
                    // Col 2: ข้อความหัวกระดาษ 3 บรรทัด ตัวหนา 14 ไม่ขีดเส้นใต้ จัดกึ่งกลาง
                    new TableCell({
                      width: { size: 66, type: WidthType.PERCENTAGE },
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
                      width: { size: 20, type: WidthType.PERCENTAGE },
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
              children: [
                createThaiTextRun({
                  text: '* ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ (ประกาศ ณ วันที่ 27 พฤษภาคม 2567)',
                  size: 20, // 10 pt
                }),
              ],
            }),
            new Paragraph({
              children: [
                createThaiTextRun({
                  text: '** ปรับปรุงล่าสุด Version3.10 / 10 ก.ย. 69',
                  size: 20, // 10 pt
                }),
              ],
            }),
            new Paragraph({
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
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '1. ชื่อผู้ขอรับทุน', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: app.applicantName, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 3: หน่วยงานที่สังกัด
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '    หน่วยงานที่สังกัด', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: `${app.department} คณะแพทยศาสตร์`, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 4: 2. ประเภททุนสนับสนุน (แสดงเฉพาะรายการที่ขอรับทุน)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '2. ประเภททุนสนับสนุน', size: FONT_CHECKLIST, bold: true })] })],
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
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '3. ชื่อบทความ', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: app.articleTitle, size: FONT_CHECKLIST, italics: true })] })],
                }),
              ],
            }),
            // Row 6: ประเภทบทความ (แสดงเฉพาะประเภทที่เลือก)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '    ประเภทบทความ', size: FONT_CHECKLIST, bold: true })] })],
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
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '4. การมีส่วนร่วม', size: FONT_CHECKLIST, bold: true })] })],
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
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '5. ชื่อวารสาร', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: app.journalName, size: FONT_CHECKLIST })] })],
                }),
              ],
            }),
            // Row 9: 6. ประเภทฐานข้อมูล (แสดงเฉพาะที่เลือกไว้)
            new TableRow({
              children: [
                new TableCell({
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ children: [createThaiTextRun({ text: '6. ประเภทฐานข้อมูล', size: FONT_CHECKLIST, bold: true })] })],
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
                          text: '7. บทความที่ขอรับรางวัลตีพิมพ์เผยแพร่แล้ว ไม่เกิน 24 เดือน และไม่เป็นส่วนหนึ่งในการขอจบการศึกษาเพื่อปริญญา',
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
        // หัวตาราง merge ช่องที่ 1 กับ 2 เป็น "รายการ"
        // ==========================================
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: CELL_BORDERS_ALL,
          rows: [
            // Row 1: Header ตาราง 2 (merge col 1 และ 2 เป็น "รายการ")
            new TableRow({
              children: [
                new TableCell({
                  columnSpan: 2,
                  width: { size: 68, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายการ', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_ALL,
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '/ = มี\nX = ไม่มี', size: FONT_CHECKLIST, bold: true })] })],
                }),
                new TableCell({
                  width: { size: 22, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  children: [new Paragraph({ text: '' })],
                }),
              ],
            }),

            // Items 1-9: เงินรางวัล
            ...[
              '1. บันทึกข้อความขอรับทุนสนับสนุนค่าตีพิมพ์ รางวัลตีพิมพ์',
              '2. แบบฟอร์มประกอบการอนุมัติงบประมาณ',
              '3. บันทึกข้อความขออนุมัติเบิกเงิน',
              '4. ใบสำคัญรับเงิน',
              '5. สำเนาบัตรประชาชน (รับรองสำเนาถูกต้อง)',
              '6. สำเนาหน้าบัญชีธนาคารสำหรับโอนเงิน',
              '7. สำเนาบทความที่ได้รับการตีพิมพ์ (รับรองสำเนาถูกต้องทุกหน้า)',
              '8. สำเนาหลักฐานอ้างอิงฐานข้อมูล JCR/SJR/Scopus/TCI',
              '9. สำเนาประกาศหลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์',
            ].map((title, idx) =>
              new TableRow({
                children: [
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'เงินรางวัล', size: FONT_CHECKLIST, bold: true })] })],
                      })
                    : new TableCell({
                        verticalMerge: VerticalMergeType.CONTINUE,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [],
                      }),
                  new TableCell({
                    width: { size: 58, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ children: [createThaiTextRun({ text: title, size: FONT_CHECKLIST })] })],
                  }),
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: isReward ? '/' : 'X', size: FONT_CHECKLIST, bold: true })] })],
                  }),
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        width: { size: 22, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_NONE,
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 200 },
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
                        width: { size: 22, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_NONE,
                        children: [],
                      }),
                ],
              })
            ),

            // Items 10-13: ค่าตีพิมพ์
            ...[
              '10. เอกสารแสดงการตอบรับตีพิมพ์จากวารสาร',
              '11. ใบเรียกเก็บเงินค่าตีพิมพ์จากวารสารที่ระบุข้อมูลเชื่อมโยงกับหลักฐานในข้อ 10.',
              '12. หลักฐานการจ่ายเงินหรือใบเสร็จรับเงินสกุลเงินบาท',
              '13. ใบรับรองการจ่ายเงินค่า page change',
            ].map((title, idx) =>
              new TableRow({
                children: [
                  idx === 0
                    ? new TableCell({
                        verticalMerge: VerticalMergeType.RESTART,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'ค่าตีพิมพ์', size: FONT_CHECKLIST, bold: true })] })],
                      })
                    : new TableCell({
                        verticalMerge: VerticalMergeType.CONTINUE,
                        width: { size: 10, type: WidthType.PERCENTAGE },
                        borders: CELL_BORDERS_ALL,
                        children: [],
                      }),
                  new TableCell({
                    width: { size: 58, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_ALL,
                    children: [new Paragraph({ children: [createThaiTextRun({ text: title, size: FONT_CHECKLIST })] })],
                  }),
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
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
        // ข้อความตรวจสอบและลายเซ็นผู้ประสานงานท้ายหน้า (10 เคาะ, ตัดคำอัตโนมัติ)
        // ==========================================
        new Paragraph({
          spacing: { before: 80, after: 30 },
          alignment: AlignmentType.LEFT,
          children: [
            createThaiTextRun({
              text: '          ตรวจสอบความถูกต้องครบถ้วนของเอกสารตามเกณฑ์การรับทุนสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร และปรับปรุงข้อมูลในฐานข้อมูลเรียบร้อยแล้ว',
              size: FONT_CHECKLIST,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 60 },
          children: [
            createThaiTextRun({
              text: '.............................................................. ผู้ประสานงาน',
              size: FONT_CHECKLIST,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            createThaiTextRun({
              text: '(..........…….…………………………………………)',
              size: FONT_CHECKLIST,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            createThaiTextRun({
              text: '    วันที่ ....................................................',
              size: FONT_CHECKLIST,
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
  const formattedDate = formatThaiDateOfficial(app.createdAt);

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
            { type: TabStopType.RIGHT, position: 9071, leader: LeaderType.DOT },
          ],
          children: [
            createThaiTextRun({ text: 'ส่วนราชการ  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: `คณะแพทยศาสตร์  ภาควิชา${app.department || ''}  โทร. ${app.phone || 'ภายในคณะ'}`, 
              font: FONT_NAME, 
              size: FONT_SIZE_CONTENT,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 3. ที่ และ วันที่: แยก 2 คอลัมน์ (50% / 50%) พร้อมขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
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
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4500, leader: LeaderType.DOT },
                      ],
                      children: [
                        createThaiTextRun({ text: 'ที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: `${app.internalDocNo || 'อว 0603.10.    / '}`, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_CONTENT,
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
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4500, leader: LeaderType.DOT },
                      ],
                      children: [
                        createThaiTextRun({ text: 'วันที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: formattedDate, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_CONTENT,
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
            { type: TabStopType.RIGHT, position: 9071, leader: LeaderType.DOT },
          ],
          children: [
            createThaiTextRun({ text: 'เรื่อง  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: subject, 
              font: FONT_NAME, 
              size: FONT_SIZE_CONTENT,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 5. คำขึ้นต้น: เรียน คณบดีคณะแพทยศาสตร์ (ระยะบรรทัด 0.85)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 8, after: 6 },
          children: [
            createThaiTextRun({ text: 'เรียน   คณบดีคณะแพทยศาสตร์', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 6. ภาคเหตุ: เคาะ 10 (ระยะบรรทัด 0.85, alignment ชิดซ้ายไม่เกิด justify gap)
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 6 },
          children: [
            createThaiTextRun({
              text: `          ข้าพเจ้า ${app.applicantName} ตำแหน่ง ${app.academicPosition || 'อาจารย์แพทย์'} สังกัด ภาควิชา${app.department || ''} คณะแพทยศาสตร์ มีความประสงค์${subject} ตามประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติ และระดับชาติ คณะแพทยศาสตร์ ประกาศ ณ วันที่ 27 พฤษภาคม 2567 ซึ่งมีรายละเอียดดังนี้`,
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 7. รายละเอียดบทความ (เคาะ 10, ระยะบรรทัด 0.85 ทั้งหมด)
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
            createThaiTextRun({ text: `${app.journalName} จากฐานข้อมูล ${app.database || 'Scopus'} จัดอยู่ใน Quartile ${app.quartile || '-'}`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
          children: [
            createThaiTextRun({ text: '          วัน/เดือน/ปีที่พิมพ์ : ', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
            createThaiTextRun({ text: `${app.volumeIssue || 'Vol...... No...... Month.......... Year..........'}`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
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
          spacing: { line: LINE_SPACING_BODY, before: 4, after: 4 },
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

        // 8. ภาคสรุป: เคาะ 10 (ระยะบรรทัด 0.85)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 4, after: 6 },
          children: [
            createThaiTextRun({ text: '          จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 9. ลายมือชื่อผู้ขอรับรางวัล (ชิดกั้นหลัง จัดกึ่งกลางบล็อก, ระยะบรรทัด 0.85)
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
                      spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ.............................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                        createThaiTextRun({ text: 'ผู้ขอรับรางวัล', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // 10. ส่วนลงนามของหัวหน้างานวิจัยและรองคณบดีฯ (บล็อกซ้าย จัดกึ่งกลางในบล็อก, 14.5 pt, ระยะบรรทัด 0.85)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 6, after: 6 },
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
                      spacing: { line: LINE_SPACING_BODY, before: 4, after: 6 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ....................................................', font: FONT_NAME, size: FONT_SIZE_APPROVERS }),
                        createThaiTextRun({ text: '(นางสาวปรารถนา เอนกปัญญากุล)', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'รักษาการในตำแหน่งหัวหน้างานวิจัย', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                        createThaiTextRun({ text: 'วันที่......../........./...........', font: FONT_NAME, size: FONT_SIZE_APPROVERS, break: 1 }),
                      ],
                    }),
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_BODY, before: 6, after: 0 },
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
  const formattedDate = formatThaiDateOfficial(app.createdAt);

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
            { type: TabStopType.RIGHT, position: 9071, leader: LeaderType.DOT },
          ],
          children: [
            createThaiTextRun({ text: 'ส่วนราชการ  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: `คณะแพทยศาสตร์  ภาควิชา${app.department || ''}  โทร. ${app.phone || 'ภายในคณะ'}`, 
              font: FONT_NAME, 
              size: FONT_SIZE_CONTENT,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 3. ที่ และ วันที่: แยก 2 คอลัมน์ (50% / 50%) พร้อมขีดเส้นใต้เส้นประถึงกั้นหลัง ระยะบรรทัด 0.9 (line: LINE_SPACING_HEADER)
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
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4500, leader: LeaderType.DOT },
                      ],
                      children: [
                        createThaiTextRun({ text: 'ที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: `${app.internalDocNo || 'อว 0603.10.    / '}`, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_CONTENT,
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
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      spacing: { line: LINE_SPACING_HEADER, before: 0, after: 0 },
                      tabStops: [
                        { type: TabStopType.RIGHT, position: 4500, leader: LeaderType.DOT },
                      ],
                      children: [
                        createThaiTextRun({ text: 'วันที่  ', font: FONT_NAME, size: 40, bold: true }),
                        createThaiTextRun({ 
                          text: formattedDate, 
                          font: FONT_NAME, 
                          size: FONT_SIZE_CONTENT,
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
            { type: TabStopType.RIGHT, position: 9071, leader: LeaderType.DOT },
          ],
          children: [
            createThaiTextRun({ text: 'เรื่อง  ', font: FONT_NAME, size: 40, bold: true }),
            createThaiTextRun({ 
              text: subject, 
              font: FONT_NAME, 
              size: FONT_SIZE_CONTENT,
              underline: { type: UnderlineType.DOTTED },
            }),
            new TextRun({
              children: [new Tab()],
              font: FONT_CONFIG,
              underline: { type: UnderlineType.DOTTED },
            }),
          ],
        }),

        // 5. คำขึ้นต้น: เรียน คณบดีคณะแพทยศาสตร์
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 8, after: 4 },
          children: [
            createThaiTextRun({ text: 'เรียน   คณบดีคณะแพทยศาสตร์', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 6. ภาคเหตุ (อ้างถึง): เคาะ 10 (ระยะบรรทัด 0.85, alignment ชิดซ้ายไม่เกิด justify gap)
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LINE_SPACING_BODY, before: 0, after: 4 },
          children: [
            createThaiTextRun({
              text: `          ตามที่ ข้าพเจ้า ${app.applicantName} ตำแหน่ง ${app.academicPosition || 'อาจารย์แพทย์'} สังกัด ภาควิชา${app.department || ''} คณะแพทยศาสตร์ ได้ยื่นเรื่อง ${memoApprovalSubject} บทความวิจัยเรื่อง “${app.articleTitle}” นั้น`,
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 7. ภาคความประสงค์: เคาะ 10 (ระยะบรรทัด 0.85, alignment ชิดซ้ายไม่เกิด justify gap)
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { line: LINE_SPACING_BODY, before: 4, after: 4 },
          children: [
            createThaiTextRun({
              text: `          ในการนี้ ข้าพเจ้าจึงขออนุมัติเบิกเงิน${isPage ? `ค่าตีพิมพ์ตามเกณฑ์ข้อ 9 จำนวนเงิน ${formatCurrencyBaht(pageAmt)} (${bahtText(pageAmt)}) ` : ''}${isReward && isPage ? 'และ' : ''}${isReward ? `รางวัลตีพิมพ์ตามเกณฑ์ข้อ 8 เงินรางวัล ${formatCurrencyBaht(rewardAmt)} (${bahtText(rewardAmt)})` : ''} รวมเป็นเงินทั้งสิ้น ${formatCurrencyBaht(totalAmt)} (${bahtText(totalAmt)}) รายละเอียดตามเอกสารแนบท้าย`,
              font: FONT_NAME,
              size: FONT_SIZE_CONTENT,
            }),
          ],
        }),

        // 8. ภาคสรุป: เคาะ 10 (ระยะบรรทัด 0.85)
        new Paragraph({
          spacing: { line: LINE_SPACING_BODY, before: 4, after: 8 },
          children: [
            createThaiTextRun({ text: '          จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
          ],
        }),

        // 9. ลายมือชื่อผู้ขอรับรางวัล (ชิดกั้นหลัง จัดกึ่งกลางบล็อก, ระยะบรรทัด 0.85)
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
                  children: [new Paragraph({ spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 }, text: '' })],
                }),
                new TableCell({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  borders: CELL_BORDERS_NONE,
                  margins: CELL_NO_PADDING,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { line: LINE_SPACING_BODY, before: 0, after: 0 },
                      children: [
                        createThaiTextRun({ text: 'ลงชื่อ.............................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                        createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
                        createThaiTextRun({ text: 'ผู้ขอรับรางวัล', font: FONT_NAME, size: FONT_SIZE_CONTENT, break: 1 }),
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
// 4. ใบสำคัญรับเงิน มหาวิทยาลัยนเรศวร (ตามแบบฟอร์ม 4)
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
            alignment: AlignmentType.CENTER,
            children: [
              createThaiTextRun({ text: 'มหาวิทยาลัยนเรศวร', font: FONT_NAME, size: 36, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 120 },
            children: [
              createThaiTextRun({ text: `วันที่............เดือน................................พ.ศ. ${app.fiscalYear}`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: INDENT_SARABAN },
            spacing: { after: 180 },
            children: [
              createThaiTextRun({ text: `ข้าพเจ้า `, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
              createThaiTextRun({ text: `${app.applicantName}`, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
              createThaiTextRun({ text: ` ตำแหน่ง ${app.academicPosition || 'อาจารย์'} ที่อยู่ คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ตำบลท่าโพธิ์ อำเภอเมือง จังหวัดพิษณุโลก ได้รับเงินจากมหาวิทยาลัยนเรศวร ดังรายการต่อไปนี้`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            ],
          }),

          // Table รายการเงิน
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'ที่', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 50, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายการ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'หน่วยละ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 14, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวนเงิน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                ],
              }),
              ...(pageAmt > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ children: [createThaiTextRun({ text: `เงินสนับสนุนค่าตีพิมพ์บทความ เรื่อง ${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(pageAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(pageAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      ],
                    }),
                  ]
                : []),
              ...(rewardAmt > 0
                ? [
                    new TableRow({
                      children: [
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: pageAmt > 0 ? '2' : '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ children: [createThaiTextRun({ text: `เงินรางวัลตีพิมพ์บทความ เรื่อง ${app.articleTitle} (${app.journalName})`, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: '1', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(rewardAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                        new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(rewardAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                      ],
                    }),
                  ]
                : []),
              new TableRow({
                children: [
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: 'รวม', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(totalAmt), font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                ],
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 120, after: 240 },
            children: [
              createThaiTextRun({ text: `จำนวนเงิน (ตัวอักษร) : `, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true }),
              createThaiTextRun({ text: `${bahtText(totalAmt)}`, font: FONT_NAME, size: FONT_SIZE_CONTENT }),
            ],
          }),

          // ลายเซ็นผู้รับเงินและผู้จ่ายเงิน
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: TABLE_BORDERS_NONE,
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_NONE,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          createThaiTextRun({ text: 'ลงชื่อ.................................................................ผู้รับเงิน', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                          createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true, break: 1 }),
                          createThaiTextRun({ text: 'ผู้ขอรับทุน / รางวัล', font: FONT_NAME, size: FONT_SIZE_TABLE, break: 1 }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: CELL_BORDERS_NONE,
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          createThaiTextRun({ text: 'ลงชื่อ.................................................................ผู้จ่ายเงิน', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
                          createThaiTextRun({ text: '(หน่วยการเงินและบัญชี คณะแพทยศาสตร์)', font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true, break: 1 }),
                          createThaiTextRun({ text: 'ผู้จ่ายเงิน', font: FONT_NAME, size: FONT_SIZE_TABLE, break: 1 }),
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
// 5. ใบสำคัญรับรองจ่าย (ใบรับรองการจ่ายเงิน page charge ตามข้อ 46)
// -------------------------------------------------------------------------
export async function generateCertificationDocx(app: ResearchApplication) {
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
              createThaiTextRun({ text: 'ใบรับรองการจ่ายเงิน', font: FONT_NAME, size: 44, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              createThaiTextRun({ text: 'ส่วนราชการ มหาวิทยาลัยนเรศวร', font: FONT_NAME, size: 36, bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              createThaiTextRun({ text: '(ตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลังฯ พ.ศ. 2562 ข้อ 46)', font: FONT_NAME, size: FONT_SIZE_TABLE }),
            ],
          }),

          // ตารางใบรับรอง
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'วัน เดือน ปี', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 52, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'รายละเอียดการจ่าย', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จำนวนเงิน', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'หมายเหตุ', font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: `${app.publishedDate || app.createdAt}`, font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                  new TableCell({
                    borders: CELL_BORDERS_ALL,
                    children: [
                      new Paragraph({ children: [createThaiTextRun({ text: `ค่าสนับสนุนการตีพิมพ์ / รางวัลตีพิมพ์บทความวิจัย`, font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] }),
                      new Paragraph({ children: [createThaiTextRun({ text: `เรื่อง ${app.articleTitle}`, font: FONT_NAME, size: FONT_SIZE_TABLE, italics: true })] }),
                      new Paragraph({ children: [createThaiTextRun({ text: `วารสาร ${app.journalName} (Quartile ${app.quartile}) ขอเบิกจ่ายตามประกาศคณะแพทยศาสตร์`, font: FONT_NAME, size: FONT_SIZE_SUBTEXT })] }),
                    ],
                  }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(totalAmt), font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [createThaiTextRun({ text: 'จ่ายจริง', font: FONT_NAME, size: FONT_SIZE_TABLE })] })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: `รวมทั้งสิ้น (${bahtText(totalAmt)})`, font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [createThaiTextRun({ text: formatBaht(totalAmt), font: FONT_NAME, size: FONT_SIZE_TABLE, bold: true })] })] }),
                  new TableCell({ borders: CELL_BORDERS_ALL, children: [new Paragraph({ text: '' })] }),
                ],
              }),
            ],
          }),

          // ข้อความรับรองตามระเบียบกระทรวงการคลัง ข้อ 46
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: INDENT_SARABAN },
            spacing: { before: 180, after: 240 },
            children: [
              createThaiTextRun({
                text: `ข้าพเจ้า ${app.applicantName} ตำแหน่ง ${app.academicPosition || 'อาจารย์แพทย์'} สังกัด ${app.department} คณะแพทยศาสตร์ ขอรับรองว่า รายจ่ายข้างต้นนี้ ข้าพเจ้าได้จ่ายเงินไปโดยได้รับใบเสร็จรับเงินซึ่งมีรายการไม่ครบถ้วนตามหลักฐานการจ่ายเงินในข้อ 46 หรือซึ่งตามลักษณะไม่อาจเรียกใบเสร็จรับเงินจากผู้รับเงินได้ ซึ่งเป็นไปตามระเบียบกระทรวงการคลัง ว่าด้วยการเบิกเงินจากคลัง การรับเงิน การจ่ายเงิน การเก็บรักษาเงิน และการนำเงินส่งคลัง พ.ศ. 2562`,
                font: FONT_NAME,
                size: FONT_SIZE_CONTENT,
              }),
            ],
          }),

          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 240 },
            children: [
              createThaiTextRun({ text: 'ลงชื่อ.................................................................', font: FONT_NAME, size: FONT_SIZE_CONTENT }),
              createThaiTextRun({ text: `(${app.applicantName})`, font: FONT_NAME, size: FONT_SIZE_CONTENT, bold: true, break: 1 }),
              createThaiTextRun({ text: 'ผู้รับรอง', font: FONT_NAME, size: FONT_SIZE_TABLE, break: 1 }),
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
