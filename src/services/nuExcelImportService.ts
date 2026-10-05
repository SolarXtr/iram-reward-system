import * as XLSX from 'xlsx';
import { NuDisbursementRecord, ResearchApplication } from '../types';

export interface ParseResult {
  records: NuDisbursementRecord[];
  matchedCount: number;
  totalParsed: number;
}

export function normalizeText(text?: string): string {
  if (!text) return '';
  return text.toLowerCase().replace(/[^a-z0-9฀-๿]/g, '');
}

export async function parseNuDisbursementExcel(
  file: File,
  facultyApps: ResearchApplication[] = []
): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rawData || rawData.length < 2) {
    throw new Error('ไฟล์ Excel ไม่มีข้อมูลแถวสำหรับนำเข้า');
  }

  // Find Header Row (look for \'ชื่อนักวิจัย\' or \'ชื่อผลงาน\')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (Array.isArray(row) && row.some(cell => String(cell).includes('ชื่อนักวิจัย') || String(cell).includes('ชื่อผลงาน'))) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    headerRowIdx = 0; // fallback to row 0
  }

  const headers = rawData[headerRowIdx].map(h => String(h || '').trim());
  const idxResearcher = headers.findIndex(h => h.includes('ชื่อนักวิจัย') || h.includes('ผู้ขอ') || h.includes('อาจารย์'));
  const idxTitle = headers.findIndex(h => h.includes('ชื่อผลงาน') || h.includes('บทความ') || h.includes('เรื่อง'));
  const idxDept = headers.findIndex(h => h.includes('หน่วยงาน') || h.includes('สังกัด') || h.includes('คณะ'));
  const idxSubDate = headers.findIndex(h => h.includes('วันที่ยื่น') || h.includes('ยื่นคำร้อง') || h.includes('วันที่'));
  const idxType = headers.findIndex(h => h.includes('ประเภท') || h.includes('รายการ'));
  const idxStatus = headers.findIndex(h => h.includes('สถานะ'));

  const parsedRecords: NuDisbursementRecord[] = [];
  let matchedCount = 0;

  for (let r = headerRowIdx + 1; r < rawData.length; r++) {
    const row = rawData[r];
    if (!row || row.length === 0 || !row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')) {
      continue;
    }

    const researcherName = idxResearcher >= 0 ? String(row[idxResearcher] || '').trim() : '';
    const articleTitle = idxTitle >= 0 ? String(row[idxTitle] || '').trim() : '';
    const department = idxDept >= 0 ? String(row[idxDept] || '').trim() : 'คณะแพทยศาสตร์';
    let submissionDate = idxSubDate >= 0 ? String(row[idxSubDate] || '').trim() : '';
    const claimType = idxType >= 0 ? String(row[idxType] || '').trim() : 'รางวัลการตีพิมพ์และ Page Charge';
    const status = idxStatus >= 0 ? String(row[idxStatus] || '').trim() : 'อยู่ระหว่างการจัดส่งเอกสาร';

    if (!researcherName && !articleTitle) {
      continue;
    }

    // Format date string if it has time
    if (submissionDate.includes('T')) {
      submissionDate = submissionDate.split('T')[0];
    } else if (submissionDate.includes(' ')) {
      submissionDate = submissionDate.split(' ')[0];
    }

    // Check matching with faculty applications
    let matchedFacultyTrackingNo: string | undefined = undefined;
    const normArticle = normalizeText(articleTitle);

    if (normArticle.length > 10) {
      const match = facultyApps.find(app => {
        const normApp = normalizeText(app.articleTitle);
        return normApp.includes(normArticle) || normArticle.includes(normApp);
      });
      if (match) {
        matchedFacultyTrackingNo = match.trackingNo;
        matchedCount++;
      }
    }

    // Estimated amounts based on typical NU regulations
    let estReward = 0;
    let estPage = 0;
    if (claimType.includes('รางวัล')) {
      estReward = 25000;
    }
    if (claimType.includes('Page') || claimType.includes('ตีพิมพ์')) {
      estPage = 35000;
    }

    const rec: NuDisbursementRecord = {
      id: 'nu-import-' + Date.now() + '-' + r + '-' + Math.random().toString(36).substring(2, 6),
      researcherName: researcherName || 'ไม่ระบุชื่อ',
      articleTitle: articleTitle || 'ไม่ระบุชื่อบทความ',
      department: department || 'คณะแพทยศาสตร์',
      submissionDate: submissionDate || new Date().toISOString().split('T')[0],
      claimType: claimType || 'รางวัลการตีพิมพ์และ Page Charge',
      status: status || 'อยู่ระหว่างการจัดส่งเอกสาร',
      rewardAmount: estReward,
      pageChargeAmount: estPage,
      totalAmount: estReward + estPage,
      matchedFacultyTrackingNo,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    parsedRecords.push(rec);
  }

  return {
    records: parsedRecords,
    matchedCount,
    totalParsed: parsedRecords.length,
  };
}
