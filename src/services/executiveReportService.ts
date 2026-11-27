/**
 * Multi-Sheet Executive Excel (.xlsx) Report Generator
 * Dynamically imports `xlsx` only on demand so initial page bundle remains lightweight.
 */

import { ResearchApplication } from '../types';
import { get19StepDisplayInfo } from '../data/workflow19Steps';
import { evaluateApplicationSla } from '../utils/slaUtils';

export async function exportExecutiveMultiSheetReport(
  applications: ResearchApplication[],
  fiscalYearLabel: string = 'ทั้งหมด'
): Promise<string> {
  const XLSX = await import('xlsx');

  const validApps = applications.filter((a) => a.status !== 'draft' && a.status !== 'trash');

  const totalCount = validApps.length;
  const paidApps = validApps.filter((a) => a.status === 'paid' || a.paymentStatus === 'transferred');
  const pendingApps = validApps.filter((a) => a.status !== 'paid' && a.paymentStatus !== 'transferred');

  const sumReward = validApps.reduce((s, a) => s + (Number(a.claimedRewardAmount) || 0), 0);
  const sumPageCharge = validApps.reduce((s, a) => s + (Number(a.approvedPageChargeAmount) || 0), 0);
  const sumTotal = validApps.reduce((s, a) => s + (Number(a.totalClaimedAmount) || 0), 0);
  const sumPaid = paidApps.reduce((s, a) => s + (Number(a.actualPaidAmount || a.totalClaimedAmount) || 0), 0);
  const sumPending = pendingApps.reduce((s, a) => s + (Number(a.totalClaimedAmount) || 0), 0);

  // Sheet 1: Executive Overview
  const overviewRows = [
    ['รายงานสรุปผู้บริหาร: ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร'],
    [`ปีงบประมาณ: ${fiscalYearLabel}`, `วันที่ออกรายงาน: ${new Date().toLocaleString('th-TH')}`],
    [],
    ['ตัวชี้วัดสำคัญ (KPI)', 'จำนวนเรื่อง', 'งบประมาณรวม (บาท)'],
    ['คำขอรับการสนับสนุนทั้งหมด (ไม่รวมฉบับร่าง)', totalCount, sumTotal],
    ['โอนเงินเข้าบัญชีเรียบร้อยแล้ว (Paid)', paidApps.length, sumPaid],
    ['อยู่ระหว่างดำเนินการเบิกจ่าย (In Progress)', pendingApps.length, sumPending],
    [],
    ['จำแนกตามประเภทวงเงิน', 'สัดส่วน (%)', 'จำนวนเงิน (บาท)'],
    ['เงินรางวัลการตีพิมพ์บทความวิจัย', sumTotal > 0 ? Number(((sumReward / sumTotal) * 100).toFixed(1)) : 0, sumReward],
    ['ค่าธรรมเนียมการตีพิมพ์ (Page Charge)', sumTotal > 0 ? Number(((sumPageCharge / sumTotal) * 100).toFixed(1)) : 0, sumPageCharge],
    ['รวมทั้งสิ้น', 100, sumTotal],
  ];

  // Sheet 2: Department Breakdown
  const deptMap = new Map<
    string,
    { count: number; paidCount: number; reward: number; pageCharge: number; total: number }
  >();
  for (const app of validApps) {
    const dept = app.department || 'ไม่ระบุภาควิชา';
    const cur = deptMap.get(dept) || { count: 0, paidCount: 0, reward: 0, pageCharge: 0, total: 0 };
    cur.count += 1;
    if (app.status === 'paid' || app.paymentStatus === 'transferred') cur.paidCount += 1;
    cur.reward += Number(app.claimedRewardAmount) || 0;
    cur.pageCharge += Number(app.approvedPageChargeAmount) || 0;
    cur.total += Number(app.totalClaimedAmount) || 0;
    deptMap.set(dept, cur);
  }
  const deptSorted = Array.from(deptMap.entries()).sort((a, b) => b[1].total - a[1].total);
  const deptRows = [
    ['ลำดับ', 'ภาควิชา / หน่วยงาน', 'จำนวนเรื่องรวม', 'โอนเงินแล้ว (เรื่อง)', 'เงินรางวัล (บาท)', 'ค่าตีพิมพ์ (บาท)', 'รวมงบประมาณ (บาท)'],
    ...deptSorted.map(([dept, stat], idx) => [
      idx + 1,
      dept,
      stat.count,
      stat.paidCount,
      stat.reward,
      stat.pageCharge,
      stat.total,
    ]),
    ['รวมทั้งสิ้น', '', totalCount, paidApps.length, sumReward, sumPageCharge, sumTotal],
  ];

  // Sheet 3: Quartile Breakdown
  const quartileOrder = [
    { key: 'Q1_Tier1', label: 'Q1 Tier 1 (Top 10%)' },
    { key: 'Q1', label: 'Quartile 1 (Q1)' },
    { key: 'Q2', label: 'Quartile 2 (Q2)' },
    { key: 'Q3', label: 'Quartile 3 (Q3)' },
    { key: 'Q4', label: 'Quartile 4 (Q4)' },
    { key: 'TCI_1', label: 'TCI กลุ่มที่ 1' },
    { key: 'TCI_2', label: 'TCI กลุ่มที่ 2' },
  ];
  const quartileRows = [
    ['ระดับคุณภาพวารสาร (Quartile)', 'จำนวนเรื่อง', 'เงินรางวัลรวม (บาท)', 'ค่าตีพิมพ์รวม (บาท)', 'งบประมาณรวม (บาท)'],
    ...quartileOrder.map((q) => {
      const matched = validApps.filter((a) =>
        q.key === 'Q1_Tier1'
          ? a.quartile === 'Q1_Tier1' || a.isTier1Top10
          : q.key === 'Q1'
          ? a.quartile === 'Q1' && !a.isTier1Top10
          : a.quartile === q.key
      );
      const r = matched.reduce((s, a) => s + (Number(a.claimedRewardAmount) || 0), 0);
      const p = matched.reduce((s, a) => s + (Number(a.approvedPageChargeAmount) || 0), 0);
      return [q.label, matched.length, r, p, r + p];
    }),
    ['รวมทั้งสิ้น', totalCount, sumReward, sumPageCharge, sumTotal],
  ];

  // Sheet 4: Detailed Applications Master List
  const detailRows = [
    [
      'ลำดับ',
      'เลขที่คำขอ (AWP)',
      'ปีงบประมาณ',
      'ชื่อ-สกุลผู้ขอรับทุน',
      'ภาควิชา',
      'ชื่อบทความวิจัย',
      'ชื่อวารสาร',
      'ฐานข้อมูล',
      'Quartile',
      'บทบาทผู้ประพันธ์',
      'เงินรางวัล (บาท)',
      'ค่าตีพิมพ์อนุมัติ (บาท)',
      'ยอดรวม (บาท)',
      'ขั้นตอนปัจจุบัน (12 ขั้น)',
      'สถานะ SLA',
      'เลขที่ฎีกา',
      'วันที่โอนเงิน',
      'วันที่ยื่นคำขอ',
    ],
    ...validApps.map((a, idx) => {
      const stepInfo = get19StepDisplayInfo(a);
      const sla = evaluateApplicationSla(a);
      return [
        idx + 1,
        a.trackingNo,
        a.fiscalYear,
        a.applicantName,
        a.department,
        a.articleTitle,
        a.journalName,
        a.databaseName || a.database,
        a.quartile === 'Q1_Tier1' ? 'Q1 Tier 1' : a.quartile,
        a.authorRole,
        Number(a.claimedRewardAmount) || 0,
        Number(a.approvedPageChargeAmount) || 0,
        Number(a.totalClaimedAmount) || 0,
        `${stepInfo.label} - ${stepInfo.stepTitle}`,
        sla.isApplicable ? sla.label : 'เสร็จสมบูรณ์',
        a.disbursementVoucherNo || '-',
        a.paymentDate || '-',
        a.createdAt || '-',
      ];
    }),
  ];

  const wb = XLSX.utils.book_new();

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 48 }, { wch: 20 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, '1_สรุปภาพรวมผู้บริหาร');

  const wsDept = XLSX.utils.aoa_to_sheet(deptRows);
  wsDept['!cols'] = [{ wch: 8 }, { wch: 36 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsDept, '2_แยกตามภาควิชา');

  const wsQuartile = XLSX.utils.aoa_to_sheet(quartileRows);
  wsQuartile['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsQuartile, '3_แยกตาม_Quartile');

  const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
  wsDetail['!cols'] = [
    { wch: 7 },
    { wch: 14 },
    { wch: 12 },
    { wch: 30 },
    { wch: 26 },
    { wch: 45 },
    { wch: 28 },
    { wch: 16 },
    { wch: 12 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 34 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetail, '4_ทะเบียนคำขอทั้งหมด');

  const datePart = new Date().toISOString().split('T')[0];
  const filename = `รายงานสรุปเงินรางวัลวิจัย_คณะแพทยศาสตร์_${fiscalYearLabel === 'all' ? 'ทุกปีงบ' : `ปีงบ_${fiscalYearLabel}`}_${datePart}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
