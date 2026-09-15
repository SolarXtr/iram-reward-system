import React from 'react';
import { 
  Award, 
  Banknote, 
  CheckCircle2, 
  Clock, 
  FileCheck, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Printer, 
  Eye, 
  Send, 
  DollarSign, 
  Building, 
  Layers
} from 'lucide-react';
import { ResearchApplication } from '../types';
import { formatBaht } from '../data/regulations';

interface DashboardViewProps {
  applications: ResearchApplication[];
  onViewApplication: (app: ResearchApplication) => void;
  onPrintApplication: (app: ResearchApplication) => void;
  onVerifyPayment: (app: ResearchApplication) => void;
  onOpenNewSubmission: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  applications,
  onViewApplication,
  onPrintApplication,
  onVerifyPayment,
  onOpenNewSubmission,
}) => {
  // Aggregate statistics
  const totalApplications = applications.length;
  const totalApprovedAmount = applications.reduce((acc, a) => acc + (a.totalClaimedAmount || 0), 0);
  const totalPaidAmount = applications
    .filter((a) => a.status === 'paid')
    .reduce((acc, a) => acc + (a.actualPaidAmount || a.totalClaimedAmount || 0), 0);
  const totalPendingAmount = applications
    .filter((a) => a.status !== 'paid' && a.status !== 'rejected')
    .reduce((acc, a) => acc + (a.totalClaimedAmount || 0), 0);

  const totalRewardsOnly = applications.reduce((acc, a) => acc + (a.claimedRewardAmount || 0), 0);
  const totalPageChargesOnly = applications.reduce((acc, a) => acc + (a.approvedPageChargeAmount || 0), 0);

  // Status counts
  const countPaid = applications.filter((a) => a.status === 'paid').length;
  const countInReview = applications.filter((a) => ['staff_verified', 'researcher_signed', 'admin_review', 'budget_verified', 'dean_approved', 'finance_processing'].includes(a.status)).length;
  const countSubmitted = applications.filter((a) => a.status === 'submitted').length;

  // Quartile distribution
  const q1Tier1Count = applications.filter((a) => a.quartile === 'Q1_Tier1' || a.isTier1Top10).length;
  const q1Count = applications.filter((a) => a.quartile === 'Q1' && !a.isTier1Top10).length;
  const q2Count = applications.filter((a) => a.quartile === 'Q2').length;
  const q3Count = applications.filter((a) => a.quartile === 'Q3').length;
  const q4Count = applications.filter((a) => a.quartile === 'Q4').length;
  const tciCount = applications.filter((a) => a.quartile === 'TCI_1' || a.quartile === 'TCI_2').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with University Identity & Official Scope */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <span>ประกาศมหาวิทยาลัยนเรศวร (ลงวันที่ 27 พฤษภาคม 2567)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-prompt">
              แดชบอร์ดติดตามเงินรางวัลและค่าตีพิมพ์ คณะแพทยศาสตร์
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              ติดตามขั้นตอนการขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัยระดับนานาชาติและระดับชาติ 
              ตรวจสอบเอกสารตามเกณฑ์ AWP (AWP69, AWP70 และปีงบถัดไป) และกำกับขั้นตอนการโอนเงินเข้าบัญชีอย่างโปร่งใส
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={onOpenNewSubmission}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-slate-950" />
              <span>ยื่นคำขอรับทุนใหม่</span>
            </button>
            <div className="bg-slate-800/80 backdrop-blur px-4 py-2.5 rounded-xl border border-slate-700/80 text-xs">
              <span className="text-slate-400 block">เพดานสิทธิ์ต่อคน/ปีงบประมาณ:</span>
              <span className="font-bold text-amber-300 text-sm">150,000 บาท</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Approved Amount */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">งบประมาณอนุมัติรวม</span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight font-prompt">
              {formatBaht(totalApprovedAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <span>ทั้งหมด {totalApplications} โครงการ</span>
            </div>
          </div>
        </div>

        {/* Card 2: Disbursed / Paid Amount */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">เบิกจ่าย/โอนสำเร็จแล้ว</span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 tracking-tight font-prompt">
              {formatBaht(totalPaidAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span>โอนเข้าบัญชีกรุงศรี {countPaid} รายการ</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending In-process Amount */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">อยู่ระหว่างพิจารณา/ทำฎีกา</span>
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 tracking-tight font-prompt">
              {formatBaht(totalPendingAmount)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <span>รอพิจารณา {countInReview + countSubmitted} รายการ</span>
            </div>
          </div>
        </div>

        {/* Card 4: Rewards vs Page Charge ratio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">สัดส่วน เงินรางวัล : ค่าตีพิมพ์</span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-purple-700 font-semibold">รางวัล: {formatBaht(totalRewardsOnly)}</span>
            </div>
            <div className="flex justify-between items-baseline mt-1">
              <span className="text-xs text-indigo-700 font-semibold">ค่าตีพิมพ์: {formatBaht(totalPageChargesOnly)}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 flex overflow-hidden">
              <div 
                className="bg-purple-600 h-full" 
                style={{ width: `${(totalRewardsOnly / (totalApprovedAmount || 1)) * 100}%` }}
                title="เงินรางวัล"
              />
              <div 
                className="bg-indigo-500 h-full" 
                style={{ width: `${(totalPageChargesOnly / (totalApprovedAmount || 1)) * 100}%` }}
                title="ค่าตีพิมพ์ (Page Charge)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quartile Breakdown & Process Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Distribution by Journal Quartile & Regulations */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-prompt">
                การกระจายตัวบทความตามฐานข้อมูลและ Quartile
              </h3>
              <p className="text-xs text-slate-500">
                วารสารวิชาการที่ได้รับการตีพิมพ์ คณะแพทยศาสตร์ ประจำปีงบประมาณ 2569
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">
              Web of Science / Scopus / PubMed / TCI
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg border border-blue-200 bg-blue-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900">Q1 Tier 1 (Top 10%)</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">
                  35,000 บ.
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-950 mt-2 font-prompt">{q1Tier1Count}</div>
              <div className="text-[11px] text-blue-700/80 mt-1">บทความชั้นนำระดับโลก</div>
            </div>

            <div className="p-3.5 rounded-lg border border-teal-200 bg-teal-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-teal-900">Quartile 1 (Q1)</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 bg-teal-600 text-white rounded">
                  25,000 บ.
                </span>
              </div>
              <div className="text-2xl font-bold text-teal-950 mt-2 font-prompt">{q1Count}</div>
              <div className="text-[11px] text-teal-700/80 mt-1">วารสารนานาชาติ Q1</div>
            </div>

            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900">Quartile 2 (Q2)</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 bg-amber-600 text-white rounded">
                  15,000 บ.
                </span>
              </div>
              <div className="text-2xl font-bold text-amber-950 mt-2 font-prompt">{q2Count}</div>
              <div className="text-[11px] text-amber-700/80 mt-1">วารสารนานาชาติ Q2</div>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Quartile 3 & 4</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 bg-slate-600 text-white rounded">
                  5,000 บ.
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-2 font-prompt">{q3Count + q4Count}</div>
              <div className="text-[11px] text-slate-500 mt-1">นานาชาติ Q3 และ Q4</div>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/50 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-900">ระดับชาติ TCI (กลุ่ม 1 และ 2)</span>
                <span className="text-[11px] font-bold px-1.5 py-0.5 bg-emerald-600 text-white rounded">
                  1,000 - 2,000 บ.
                </span>
              </div>
              <div className="text-2xl font-bold text-emerald-950 mt-2 font-prompt">{tciCount}</div>
              <div className="text-[11px] text-emerald-700/80 mt-1">วารสารวิชาการระดับชาติผ่านเกณฑ์ TCI</div>
            </div>
          </div>

          {/* Core Regulations Reference Card */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs space-y-1.5">
            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>สรุปเกณฑ์สำคัญตามประกาศฯ คณะแพทยศาสตร์ (27 พ.ค. 2567)</span>
            </div>
            <ul className="list-disc list-inside text-slate-600 space-y-0.5 text-[11px]">
              <li><strong>คุณสมบัติ:</strong> ต้องเป็น First Author หรือ Corresponding Author ระบุสังกัดคณะแพทยศาสตร์ ม.นเรศวร ชัดเจน</li>
              <li><strong>Co-author:</strong> ขอรับได้เฉพาะวารสารนานาชาติ Q1-Q2 (ได้รับเงินรางวัล 50% และขอได้ 1 คน/บทความ)</li>
              <li><strong>อายุบทความ:</strong> เผยแพร่มาแล้วไม่เกิน 24 เดือนนับถึงวันที่คณะฯ ได้รับเอกสาร</li>
              <li><strong>กรอบวงเงิน:</strong> รวมค่าตีพิมพ์และเงินรางวัลไม่เกิน 150,000 บาท ต่อคนต่อปีงบประมาณ</li>
            </ul>
          </div>
        </div>

        {/* Right 1 Col: Process Pipeline & SLA Monitor */}
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 font-prompt">
              ไทม์ไลน์และระยะเวลา SLA
            </h3>
            <p className="text-xs text-slate-500">
              ขั้นตอนมาตรฐาน 12 ขั้นตอนตามประกาศ
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                1-4
              </div>
              <div>
                <span className="font-semibold text-blue-900 block">ตรวจสอบเอกสารและจัดทำบันทึก</span>
                <span className="text-slate-600 text-[11px]">SLA 1-4 วันทำการ (จนท. และนักวิจัยลงนาม)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                5-8
              </div>
              <div>
                <span className="font-semibold text-indigo-900 block">เสนอผู้บริหารและคณบดีอนุมัติ</span>
                <span className="text-slate-600 text-[11px]">หน.ภาคฯ &rarr; รองคณบดี &rarr; แผน &rarr; คณบดี</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                9-12
              </div>
              <div>
                <span className="font-semibold text-emerald-900 block">งานการเงินจัดทำฎีกา & โอนเงิน</span>
                <span className="text-slate-600 text-[11px]">โอนเข้าบัญชีกรุงศรีภายใน 4 สัปดาห์ พร้อมแจ้ง LINE OA</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">อัตราโอนเงินสำเร็จ:</span>
              <span className="font-bold text-emerald-600">
                {Math.round((countPaid / (totalApplications || 1)) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(countPaid / (totalApplications || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Applications Table List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-prompt">
              รายการคำขอรับเงินรางวัลและค่าตีพิมพ์ล่าสุด
            </h3>
            <p className="text-xs text-slate-500">
              คลิกเพื่อดูไทม์ไลน์ 12 ขั้นตอน, ปริ้นเอกสารราชการ, หรือตรวจสอบสถานะเงินโอน
            </p>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-full">
            แสดง {applications.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">เลขที่ติดตาม (AWP)</th>
                <th className="px-4 py-3 text-left">นักวิจัย / ภาควิชา</th>
                <th className="px-4 py-3 text-left">บทความ / วารสาร</th>
                <th className="px-4 py-3 text-left">Quartile / ฐาน</th>
                <th className="px-4 py-3 text-right">ยอดเงินรวม</th>
                <th className="px-4 py-3 text-center">สถานะโครงการ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {applications.map((app, idx) => {
                const isPaid = app.status === 'paid';
                const rowKey = app.id || `dash-app-${app.trackingNo || 'row'}-${idx}`;
                return (
                  <tr key={rowKey} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {app.trackingNo}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-1">
                        <span className="font-medium text-amber-800 bg-amber-50 px-1 rounded mr-1">ปี {app.fiscalYear}</span>
                        <span>{app.createdAt}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{app.applicantName}</div>
                      <div className="text-slate-500 text-[11px]">{app.department}</div>
                    </td>

                    <td className="px-4 py-3 max-w-xs">
                      <div className="font-medium text-slate-800 line-clamp-1" title={app.articleTitle}>
                        {app.articleTitle}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 italic">
                        {app.journalName}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {app.quartile === 'Q1_Tier1' ? 'Q1 Tier 1' : app.quartile}
                      </span>
                      <span className="block text-[10px] text-slate-500 mt-0.5">{app.database}</span>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="font-bold text-slate-900 font-prompt">
                        {formatBaht(app.totalClaimedAmount)}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        รางวัล: {formatBaht(app.claimedRewardAmount)}
                      </div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>โอนเงินแล้ว</span>
                        </span>
                      ) : app.status === 'dean_approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <span>คณบดีอนุมัติแล้ว</span>
                        </span>
                      ) : app.status === 'staff_verified' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          <span>จนท. ตรวจสอบแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <span>ขั้นตอนที่ {app.currentStep}/12</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewApplication(app)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ดูไทม์ไลน์ 12 ขั้นตอน"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPrintApplication(app)}
                          className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="ปริ้นแบบฟอร์มราชการ (AWP69 / บันทึกข้อความ)"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {isPaid && (
                          <button
                            onClick={() => onVerifyPayment(app)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="ตรวจสอบสลิปโอนเงิน / เลขฎีกา"
                          >
                            <Banknote className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
