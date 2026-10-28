import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Download, 
  Printer, 
  Search, 
  Building2, 
  HelpCircle, 
  Phone, 
  MapPin, 
  ExternalLink, 
  Calculator, 
  Sparkles, 
  GraduationCap, 
  Award, 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  ChevronRight,
  Info,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { calculateFacultyReward } from '../data/regulations';
import { AuthorRole, DatabaseName, JournalScope, QuartileRank } from '../types';

interface UserGuideViewProps {
  onBackToDashboard: () => void;
  onOpenNewSubmission?: () => void;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  onBackToDashboard,
  onOpenNewSubmission,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'rules' | 'steps' | 'calculator' | 'faq' | 'contact'>('all');

  // Mini Interactive Calculator State
  const [calcScope, setCalcScope] = useState<JournalScope>('international');
  const [calcQuartile, setCalcQuartile] = useState<QuartileRank>('Q1');
  const [calcIsTier1Top10, setCalcIsTier1Top10] = useState<boolean>(false);
  const [calcRole, setCalcRole] = useState<AuthorRole>('first_author');
  const [calcArticleType, setCalcArticleType] = useState<'research_article' | 'other_academic'>('research_article');
  const [calcClaimedPageCharge, setCalcClaimedPageCharge] = useState<number>(0);

  const calcResult = calculateFacultyReward({
    journalScope: calcScope,
    database: calcScope === 'international' ? 'Scopus' : 'TCI Tier 1',
    quartile: calcQuartile,
    isTier1Top10: calcIsTier1Top10,
    authorRole: calcRole,
    articleType: calcArticleType,
    claimedPageCharge: calcClaimedPageCharge,
    alreadyUsedQuotaInYear: 0,
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20 font-prompt print:p-0 print:m-0 print:max-w-none text-slate-800 dark:text-slate-100">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 text-xs text-amber-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่แดชบอร์ด</span>
            </button>
            <span className="text-xs text-slate-400">/</span>
            <span className="text-xs text-slate-300 font-medium">คู่มือการใช้งานระบบ iRAM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
            <span>คู่มือการใช้งานระบบสำหรับนักวิจัย</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://drive.google.com/file/d/17CIhPV50iGEvu7oRIMc8f92xr8--ADnz/view"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
            title="ดาวน์โหลดประกาศมหาวิทยาลัยนเรศวร (27 พ.ค. 2567)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>เอกสารประกาศ 27 พ.ค. 67</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium shadow-xs transition-all"
            title="พิมพ์หน้านี้เป็นเอกสาร / บันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">พิมพ์คู่มือ</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาในคู่มือ (เช่น 150,000, วงเงิน, กรุงไทย, 7928)..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        {/* Section Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none text-xs">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'rules', label: 'เกณฑ์และวงเงิน' },
            { id: 'steps', label: '6 ขั้นตอนใช้งาน' },
            { id: 'calculator', label: 'จำลองการคำนวณ' },
            { id: 'faq', label: 'คำถามที่พบบ่อย' },
            { id: 'contact', label: 'ติดต่อหน่วยวิจัย' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-amber-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Important Banner */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการฯ (27 พ.ค. 2567)</span>
        </div>
        <p className="leading-relaxed">
          อาจารย์และนักวิจัย คณะแพทยศาสตร์ สามารถเบิกเงินรางวัลและเงินสนับสนุนค่าตีพิมพ์ (Page Charge) รวมกันได้ <strong>ไม่เกิน 150,000 บาท ต่อคน ต่อปีงบประมาณ</strong> โดยบทความต้องได้รับการตีพิมพ์เผยแพร่มาแล้วไม่เกิน <strong>24 เดือน</strong> และระบุสังกัด <em>Faculty of Medicine, Naresuan University</em>
        </p>
      </div>

      {/* SECTION 1: RULES & REWARD RATES */}
      {(activeSection === 'all' || activeSection === 'rules') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              1. อัตราเงินรางวัลและเงินสนับสนุนค่าตีพิมพ์ (Publication Rewards & APC)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Table 1: Publication Rewards */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>อัตราเงินรางวัลการตีพิมพ์บทความ (บาท)</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2">ระดับวารสาร / Quartile</th>
                      <th className="p-2 text-right">บทความวิจัย / Review</th>
                      <th className="p-2 text-right">Case Report / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-purple-700 dark:text-purple-300">นานาชาติ Q1 Tier 1 (Top 10%)</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">35,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">17,500</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-amber-700 dark:text-amber-300">นานาชาติ Quartile 1 (Q1)</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">25,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">12,500</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-blue-700 dark:text-blue-300">นานาชาติ Quartile 2 (Q2)</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">15,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">7,500</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-slate-700 dark:text-slate-300">นานาชาติ Q3 และ Q4</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">5,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">2,500</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-teal-700 dark:text-teal-300">ระดับชาติ TCI กลุ่ม 1</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">2,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">1,000</td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2 font-medium text-teal-700 dark:text-teal-300">ระดับชาติ TCI กลุ่ม 2</td>
                      <td className="p-2 text-right font-bold text-slate-900 dark:text-white">1,000</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">500</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                <div><strong>First / Corresponding Author:</strong> ได้รับเงินรางวัล 100%</div>
                <div><strong>Co-author (ผู้ร่วมเขียน):</strong> ได้รับ 50% ของอัตราปกติ <em>(มีสิทธิ์เฉพาะ Q1 และ Q2 เท่านั้น)</em></div>
              </div>
            </div>

            {/* Table 2: Page Charge Support */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>เงินสนับสนุนค่าตีพิมพ์ (Page Charge / APC)</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q1 (Tier 1) และ Q2</span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold">สูงสุด 40,000 บาท</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    * เงื่อนไข: <strong>ต้องหักสิทธิ์เบิกกับมหาวิทยาลัยนเรศวร (มน.) ก่อน 30,000 บาทแรก</strong> ส่วนที่เกิน 30,000 บาท จึงนำมาเบิกกับคณะแพทยศาสตร์ได้ตามจ่ายจริงแต่ไม่เกิน 40,000 บาท
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q3</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 40,000 บาท</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q4</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 10,000 บาท</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารระดับชาติ TCI กลุ่ม 1 และ 2</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 5,000 บาท</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: 6 STEP GUIDE */}
      {(activeSection === 'all' || activeSection === 'steps') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                2. ขั้นตอนการใช้งานระบบแบบ Step-by-Step (6 ขั้นตอน)
              </h2>
            </div>
            {onOpenNewSubmission && (
              <button
                onClick={onOpenNewSubmission}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ ยื่นคำขอรับรางวัล</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">1</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Login & Profile</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">เข้าสู่ระบบ & เปิดสิทธิ์นักวิจัย</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เข้าสู่ระบบด้วย <strong>Google NU Account (@nu.ac.th)</strong> หากเข้าใช้งานครั้งแรก ให้กรอกข้อมูลส่วนบุคคล (PDPA) เพื่อเปิดสิทธิ์
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เลขบัญชีธนาคาร:</strong> สามารถใช้ได้ทุกธนาคาร <em>(แนะนำธนาคารกรุงไทย สาขาใน จ.พิษณุโลก เพื่อเลี่ยงค่าธรรมเนียมการโอน)</em></div>
                  <div><strong>เลขบัตรประชาชน 13 หลัก:</strong> สำหรับงานการเงินและระบบหักภาษี</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">2</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Quota Check</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">เช็คโควตาวงเงิน 150,000 บ.</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ตรวจสอบยอดเงินรางวัลสะสมและโควตาคงเหลือผ่านเมนู <strong>"แดชบอร์ดคำขอของฉัน"</strong> หรือใช้ <strong>"เตรียมเบิกรางวัล & วงเงิน"</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เกณฑ์ 24 เดือน:</strong> ต้องยื่นภายใน 24 เดือนนับจากวันที่ตีพิมพ์</div>
                  <div><strong>วางแผนข้ามปี:</strong> จัดทำร่างคำขอ (Draft) ไว้เบิกต้นปีงบประมาณถัดไปได้</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">3</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Submission</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">ยื่นคำขอรับการสนับสนุน</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  คลิกปุ่ม <strong>"+ ขอรับเงินรางวัล"</strong> กรอกข้อมูลบทความ ชื่องานวิจัย วารสาร DOI และฐานข้อมูล ระบบคำนวณเงินรางวัลให้อัตโนมัติ
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เอกสารแนบ:</strong> Reprint บทความ, หลักฐาน Quartile, ใบเสร็จค่าตีพิมพ์</div>
                  <div><strong>สำเนาประกาศ:</strong> สำเนาประกาศ ม.นเรศวร 27 พ.ค. 2567</div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">4</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Print Memo</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">พิมพ์บันทึกข้อความราชการ</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เมื่อเจ้าหน้าที่ออกเลขที่หนังสือแล้ว ให้ไปที่เมนู <strong>"ตารางคำขอของฉัน"</strong> เพื่อกดปุ่ม <strong>"พิมพ์บันทึกข้อความ"</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>รูปแบบมาตรฐาน:</strong> บันทึกข้อความพร้อมตราครุฑและช่องลงนาม</div>
                  <div><strong>การลงนาม:</strong> เสนอผ่านหัวหน้าภาควิชา และคณบดี</div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">5</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Tracking</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">ติดตามสถานะ 12 ขั้นตอน</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  ติดตามสถานะคำขอได้แบบเรียลไทม์ผ่านหน้าเว็บ ตั้งแต่ตรวจสอบเอกสาร เสนอผู้บริหาร จนถึงส่งงานการเงินเพื่อออกเลขฎีกา
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>ตรวจสอบโปร่งใส:</strong> เห็นสถานะปัจจุบันและเจ้าหน้าที่ผู้รับผิดชอบ</div>
                  <div><strong>บันทึกแก้ไข:</strong> ตรวจสอบข้อความแจ้งแก้ไขเอกสารได้ทันที</div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">6</span>
                  <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Payment</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">รับเงินโอน & สลิปหลักฐาน</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  เช็ครอบวันโอนเงินจาก <strong>"ปฏิทินรอบเบิกจ่าย"</strong> เมื่องานการเงินโอนเงินสำเร็จ สถานะจะเปลี่ยนเป็น <strong>Paid</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>สลิปโอนเงิน:</strong> ดาวน์โหลดไฟล์หลักฐานการโอนเงินได้จากระบบ</div>
                  <div><strong>ปิดงานสมบูรณ์:</strong> บันทึกเข้าประวัติผลงานวิจัยของนักวิจัย</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 3: INTERACTIVE REWARD CALCULATOR WIDGET */}
      {(activeSection === 'all' || activeSection === 'calculator') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              3. เครื่องมือจำลองการคำนวณเงินรางวัลและค่าเพจชาร์จ (Interactive Simulation)
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              ทดลองเลือกคุณสมบัติของบทความวิจัยของท่าน เพื่อตรวจสอบยอดเงินรางวัลและค่าตีพิมพ์ที่ระบบจะคำนวณตามเกณฑ์ประกาศฯ 27 พ.ค. 2567:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Scope */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">ขอบเขตวารสาร</label>
                <select
                  value={calcScope}
                  onChange={(e) => {
                    const sc = e.target.value as JournalScope;
                    setCalcScope(sc);
                    if (sc === 'national') setCalcQuartile('TCI_1');
                    else setCalcQuartile('Q1');
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="international">นานาชาติ (International)</option>
                  <option value="national">ระดับชาติ (National - TCI)</option>
                </select>
              </div>

              {/* Quartile */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Quartile / ระดับคุณภาพ</label>
                <select
                  value={calcQuartile}
                  onChange={(e) => setCalcQuartile(e.target.value as QuartileRank)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {calcScope === 'international' ? (
                    <>
                      <option value="Q1_Tier1">Quartile 1 Tier 1 (Top 10%)</option>
                      <option value="Q1">Quartile 1 (Q1)</option>
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

              {/* Author Role */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">บทบาทผู้ประพันธ์</label>
                <select
                  value={calcRole}
                  onChange={(e) => setCalcRole(e.target.value as AuthorRole)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="first_author">First Author (ผู้ประพันธ์อันดับแรก)</option>
                  <option value="corresponding_author">Corresponding Author (ผู้ประพันธ์บรรณกิจ)</option>
                  <option value="co_author">Co-author (ผู้ร่วมเขียน - 50% เฉพาะ Q1/Q2)</option>
                </select>
              </div>

              {/* Page charge claimed */}
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">ค่าตีพิมพ์จ่ายจริงตามใบเสร็จ (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={calcClaimedPageCharge || ''}
                  onChange={(e) => setCalcClaimedPageCharge(Number(e.target.value) || 0)}
                  placeholder="0 (หากไม่ขอเบิกค่าตีพิมพ์)"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-slate-900 border border-amber-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  ผลการจำลองสิทธิ์ที่ได้รับตามเกณฑ์:
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  {calcResult.ruleCitation || 'พร้อมยื่นคำขอรับการสนับสนุน'}
                </div>
                {calcResult.notes && calcResult.notes.length > 0 && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {calcResult.notes.join(' • ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">เงินรางวัล</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                    {calcResult.rewardAmount.toLocaleString()} บาท
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400">ค่าตีพิมพ์สนับสนุน</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {calcResult.approvedPageCharge.toLocaleString()} บาท
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-slate-300 dark:border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">รวมเงินที่ขออนุมัติ</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {calcResult.totalApproved.toLocaleString()} บาท
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 4: FAQ */}
      {(activeSection === 'all' || activeSection === 'faq') && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              4. คำถามที่พบบ่อย (FAQ)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Q1: หากค่าตีพิมพ์จริงสูงกว่าเพดาน 40,000 บาท ส่วนเกินทำอย่างไร?</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>คำตอบ:</strong> คณะฯ จะสนับสนุนตามเพดานสูงสุดที่ระบุในระเบียบ (เช่น Q1-Q2 ไม่เกิน 40,000 บ. หลังหักสิทธิ์เบิกกับมหาวิทยาลัย 30,000 บ.) ส่วนต่างที่เกินจากนั้นผู้ขอรับการสนับสนุนหรือโครงการวิจัยเป็นผู้รับผิดชอบ
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Q2: ผลงานแบบ Co-author ทำไมยื่นขอเบิก Q3 หรือ Q4 ไม่ได้?</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>คำตอบ:</strong> ตามข้อ 5(2) วรรคสอง ของประกาศมหาวิทยาลัยนเรศวรฯ ฉบับ 27 พ.ค. 2567 กำหนดให้สิทธิ์ผู้ร่วมเขียน (Co-author) เฉพาะผลงานในวารสารระดับนานาชาติที่อยู่ใน Quartile 1 หรือ Quartile 2 เท่านั้น (ได้รับเงินรางวัล 50%)
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Q3: วงเงิน 150,000 บาท คิดรอบตามปีปฏิทินหรือปีงบประมาณ?</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>คำตอบ:</strong> คิดตาม <strong>ปีงบประมาณ</strong> (1 ตุลาคม ถึง 30 กันยายนของปีถัดไป) หากโควตาในปีนี้ใกล้เต็ม สามารถใช้ฟังก์ชัน "เตรียมเบิกรางวัล & วงเงิน" เพื่อจัดทำแบบร่างและวางแผนยื่นเบิกในต้นปีงบประมาณถัดไปได้ ตราบใดที่อายุบทความไม่เกิน 24 เดือน
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Q4: บัญชีธนาคารสำหรับรับเงินโอน ใช้ธนาคารใดได้บ้าง?</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>คำตอบ:</strong> สามารถใช้บัญชีธนาคารได้ทุกธนาคาร แต่แนะนำให้เป็น <strong>ธนาคารกรุงไทย สาขาภายในจังหวัดพิษณุโลก</strong> เพื่อหลีกเลี่ยงการจ่ายค่าธรรมเนียมการโอนข้ามเขตและต่างธนาคาร
              </p>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 5: CONTACT INFORMATION */}
      {(activeSection === 'all' || activeSection === 'contact') && (
        <section className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">หน่วยบริหารและจัดการงานวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</h2>
              <p className="text-xs text-slate-400">ยินดีให้คำปรึกษาและประสานงานเกี่ยวกับการขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">โทรศัพท์ภายใน</div>
                <div className="text-amber-400 font-mono font-bold text-sm">7928 หรือ 7903</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">สถานที่ติดต่อ</div>
                <div className="text-slate-300">ห้องงานวิจัย ชั้น 5 อาคาร CC2 คณะแพทยศาสตร์</div>
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};
