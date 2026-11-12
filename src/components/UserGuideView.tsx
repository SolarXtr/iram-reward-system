import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft,
  Users,
  UserCheck,
  CreditCard,
  Lock,
  FileCheck,
  CheckSquare
} from 'lucide-react';
import { OFFICIAL_WORKFLOW_STEPS_DEF } from '../data/initialData';
import { WORKFLOW_19_STEPS_DEF, WORKFLOW_ROLES_DEF } from '../data/workflow19Steps';
import { calculateFacultyReward } from '../data/regulations';
import { AuthorRole, DatabaseName, JournalScope, QuartileRank } from '../types';

interface UserGuideViewProps {
  onBackToDashboard: () => void;
  onOpenNewSubmission?: () => void;
  /** สิทธิ์ผู้ดูแลระบบ */
  isAdmin?: boolean;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  onBackToDashboard,
  onOpenNewSubmission,
  isAdmin = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<'all' | 'steps' | 'rules' | 'calculator' | 'faq' | 'official_workflow' | 'contact'>('all');
  const [infographicViewMode, setInfographicViewMode] = useState<'swimlane' | 'phases'>('swimlane');
  const [selectedInfographicRole, setSelectedInfographicRole] = useState<string>('all');

  // ---- Search: กรองหมวดเนื้อหาตามคำค้น ----
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchedSections, setMatchedSections] = useState<Record<string, boolean>>({});
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  useEffect(() => {
    const q = trimmedQuery.toLowerCase();
    if (!q || !containerRef.current) {
      setMatchedSections({});
      return;
    }
    const next: Record<string, boolean> = {};
    containerRef.current.querySelectorAll<HTMLElement>('[data-guide-section]').forEach((el) => {
      next[el.dataset.guideSection as string] = (el.textContent || '').toLowerCase().includes(q);
    });
    setMatchedSections(next);
  }, [trimmedQuery]);

  // ระหว่างค้นหา: เรนเดอร์ทุกหมวดแล้วซ่อนหมวดที่ไม่ตรงคำค้น
  const renderSection = (id: string) => {
    return isSearching || activeSection === 'all' || activeSection === id;
  };
  const hiddenCls = (id: string) => (isSearching && matchedSections[id] === false ? ' hidden' : '');
  const matchedCount = Object.values(matchedSections).filter(Boolean).length;

  // Mini Interactive Calculator State
  const [calcScope, setCalcScope] = useState<JournalScope>('international');
  const [calcQuartile, setCalcQuartile] = useState<QuartileRank>('Q1');
  const [calcIsTier1Top10, setCalcIsTier1Top10] = useState<boolean>(false);
  const [calcRole, setCalcRole] = useState<AuthorRole>('first_author');
  const [calcArticleType, setCalcArticleType] = useState<'research_article' | 'other_academic'>('research_article');
  const [calcClaimedPageCharge, setCalcClaimedPageCharge] = useState<number>(0);

  const calcResult = calculateFacultyReward({
    journalScope: calcScope,
    database: calcScope === 'international' ? 'Scopus' : (calcQuartile === 'TCI_2' ? 'TCI Tier 2' : 'TCI Tier 1'),
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
    <div ref={containerRef} className="space-y-6 w-full py-2 pb-20 font-prompt print:p-0 print:m-0 text-slate-800 dark:text-slate-100">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1 text-sm text-amber-300 hover:text-white transition-colors bg-slate-800/80 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่แดชบอร์ด</span>
            </button>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-sm text-slate-300 font-medium">คู่มือการใช้งานระบบ iRAM</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400 shrink-0" />
            <span>คู่มือการใช้งานระบบสำหรับนักวิจัย</span>
          </h1>
          <p className="text-sm sm:text-sm text-slate-300">
            ระบบขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="https://drive.google.com/file/d/17CIhPV50iGEvu7oRIMc8f92xr8--ADnz/view"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-sm font-semibold shadow-xs transition-all hover:scale-[1.02]"
            title="ดาวน์โหลดประกาศมหาวิทยาลัยนเรศวร (27 พ.ค. 2567)"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>เอกสารประกาศ 27 พ.ค. 67</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </a>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium shadow-xs transition-all"
            title="พิมพ์หน้านี้เป็นเอกสาร / บันทึกเป็น PDF"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">พิมพ์คู่มือ</span>
          </button>
        </div>
      </div>

      {/* Quick Search & Filter Navigation */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs print:hidden space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <div className="relative w-full sm:w-52 lg:w-56 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
              placeholder="ค้นหาในคู่มือ..."
              aria-label="ค้นหาในคู่มือ"
              title="ค้นหาข้อความและกรองหมวดในคู่มืออัตโนมัติ"
              className="w-full pl-8 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {isSearching && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-sm cursor-pointer"
                aria-label="ล้างคำค้น"
                title="ล้างคำค้น (Esc)"
              >
                ✕
              </button>
            )}
          </div>

          {/* Section Jump Pills (ขึ้นบรรทัดใหม่อัตโนมัติ ไม่ล้นกรอบ) */}
          <div className="flex flex-wrap items-center gap-1.5 text-sm min-w-0">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'steps', label: '6 ขั้นตอนใช้งาน' },
              { id: 'rules', label: 'เกณฑ์และวงเงิน' },
              { id: 'calculator', label: 'จำลองการคำนวณ' },
              { id: 'faq', label: 'คำถามที่พบบ่อย' },
              { id: 'official_workflow', label: 'Reward Cycle' },
              { id: 'contact', label: 'ติดต่อหน่วยถ่ายทอดเทคโนโลยี' },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => { setSearchQuery(''); setActiveSection(sec.id as any); }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all cursor-pointer ${
                  !isSearching && activeSection === sec.id
                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {isSearching && (
          <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
            {matchedCount > 0
              ? `พบคำว่า "${trimmedQuery}" ใน ${matchedCount} หมวด — แสดงเฉพาะหมวดที่เกี่ยวข้อง`
              : `ไม่พบคำว่า "${trimmedQuery}" ในคู่มือ ลองใช้คำอื่น เช่น วงเงิน, Quartile, บัญชี`}
          </p>
        )}
      </div>

      {/* Main Important Banner */}
      <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-xl space-y-1.5 text-sm text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
          <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>ประกาศมหาวิทยาลัยนเรศวร เรื่อง หลักเกณฑ์การสนับสนุนค่าตีพิมพ์ และรางวัลการตีพิมพ์บทความในวารสารวิชาการฯ (27 พ.ค. 2567)</span>
        </div>
        <p className="leading-relaxed">
          อาจารย์และนักวิจัย คณะแพทยศาสตร์ สามารถเบิกเงินรางวัลและเงินสนับสนุนค่าตีพิมพ์ (Page Charge) รวมกันได้ <strong>ไม่เกิน 150,000 บาท ต่อคน ต่อปีงบประมาณ</strong> โดยบทความต้องได้รับการตีพิมพ์เผยแพร่มาแล้วไม่เกิน <strong>24 เดือน</strong> และระบุสังกัด <em>Faculty of Medicine, Naresuan University</em>
        </p>
      </div>

      {/* SECTION 1: 6 STEP GUIDE (6 ขั้นตอนใช้งาน) */}
      {renderSection('steps') && (
        <section data-guide-section="steps" className={`space-y-4${hiddenCls('steps')}`}>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                1. ขั้นตอนการใช้งานระบบแบบ Step-by-Step (6 ขั้นตอน)
              </h2>
            </div>
            {onOpenNewSubmission && (
              <button
                onClick={onOpenNewSubmission}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-xs transition-all"
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
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">1</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Login & Profile</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">เข้าสู่ระบบ & เปิดสิทธิ์นักวิจัย</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  เข้าสู่ระบบด้วย <strong>Google NU Account (@nu.ac.th)</strong> หากเข้าใช้งานครั้งแรก ให้กรอกข้อมูลส่วนบุคคล (PDPA) เพื่อเปิดสิทธิ์
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เลขบัญชีธนาคาร:</strong> สามารถใช้ได้ทุกธนาคาร <em>(แนะนำธนาคารกรุงไทย สาขาใน จ.พิษณุโลก เพื่อเลี่ยงค่าธรรมเนียมการโอน)</em></div>
                  <div><strong>เลขบัตรประชาชน 13 หลัก:</strong> สำหรับงานการเงินและระบบหักภาษี</div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">2</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Quota Check</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">เช็คโควตาวงเงิน 150,000 บ.</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  ตรวจสอบยอดเงินรางวัลสะสมและโควตาคงเหลือผ่านเมนู <strong>"แดชบอร์ดคำขอของฉัน"</strong> หรือใช้ <strong>"เตรียมเบิกรางวัล & วงเงิน"</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เกณฑ์ 24 เดือน:</strong> ต้องยื่นภายใน 24 เดือนนับจากวันที่ตีพิมพ์</div>
                  <div><strong>วางแผนข้ามปี:</strong> จัดทำร่างคำขอ (Draft) ไว้เบิกต้นปีงบประมาณถัดไปได้</div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">3</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Submission</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">ยื่นคำขอรับการสนับสนุน</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  คลิกปุ่ม <strong>"+ ขอรับเงินรางวัล"</strong> กรอกข้อมูลบทความ ชื่องานวิจัย วารสาร DOI และฐานข้อมูล ระบบคำนวณเงินรางวัลให้อัตโนมัติ
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>เอกสารแนบ:</strong> Reprint บทความ, หลักฐาน Quartile, ใบเสร็จค่าตีพิมพ์</div>
                  <div><strong>สำเนาประกาศ:</strong> สำเนาประกาศ ม.นเรศวร 27 พ.ค. 2567</div>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">4</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Print Memo</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">พิมพ์บันทึกข้อความราชการ</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  เมื่อเจ้าหน้าที่ออกเลขที่หนังสือแล้ว ให้ไปที่เมนู <strong>"ตารางคำขอของฉัน"</strong> เพื่อกดปุ่ม <strong>"พิมพ์บันทึกข้อความ"</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>รูปแบบมาตรฐาน:</strong> บันทึกข้อความพร้อมตราครุฑและช่องลงนาม</div>
                  <div><strong>การลงนาม:</strong> เสนอผ่านหัวหน้าภาควิชา และคณบดี</div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">5</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Tracking</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">ติดตามสถานะกระบวนการ (19 ขั้นตอน)</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  ติดตามสถานะคำขอได้แบบเรียลไทม์ผ่านหน้าเว็บ ตั้งแต่ตรวจสอบเอกสาร เสนอผู้บริหาร จนถึงส่งงานการเงินเพื่อออกเลขฎีกา
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>ตรวจสอบโปร่งใส:</strong> เห็นสถานะปัจจุบันและเจ้าหน้าที่ผู้รับผิดชอบ</div>
                  <div><strong>บันทึกแก้ไข:</strong> ตรวจสอบข้อความแจ้งแก้ไขเอกสารได้ทันที</div>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">6</span>
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Payment</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">รับเงินโอน & สลิปหลักฐาน</h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  เช็ครอบวันโอนเงินจาก <strong>"ปฏิทินรอบเบิกจ่าย"</strong> เมื่องานการเงินโอนเงินสำเร็จ สถานะจะเปลี่ยนเป็น <strong>Paid</strong>
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <div><strong>สลิปโอนเงิน:</strong> ดาวน์โหลดไฟล์หลักฐานการโอนเงินได้จากระบบ</div>
                  <div><strong>ปิดงานสมบูรณ์:</strong> บันทึกเข้าประวัติผลงานวิจัยของนักวิจัย</div>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 2: RULES & REWARD RATES (เกณฑ์และวงเงิน) */}
      {renderSection('rules') && (
        <section data-guide-section="rules" className={`space-y-4${hiddenCls('rules')}`}>
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              2. อัตราเงินรางวัลและเงินสนับสนุนค่าตีพิมพ์ (เกณฑ์และวงเงิน)
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
                <table className="w-full text-sm text-left">
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

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 space-y-1">
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

              <div className="space-y-2.5 text-sm">
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q1 (Tier 1) และ Q2</span>
                    <span className="text-amber-700 dark:text-amber-300 font-bold">สูงสุด 40,000 บาท</span>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    * เงื่อนไข: <strong>ต้องหักสิทธิ์เบิกกับมหาวิทยาลัยนเรศวร (มน.) ก่อน 30,000 บาทแรก</strong> ส่วนที่เกิน 30,000 บาท จึงนำมาเบิกกับคณะแพทยศาสตร์ได้ตามจ่ายจริงแต่ไม่เกิน 40,000 บาท
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q3</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 40,000 บาท</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารนานาชาติ Q4</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 10,000 บาท</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>วารสารระดับชาติ TCI กลุ่ม 1 และ 2</span>
                    <span className="text-slate-900 dark:text-white font-bold">สูงสุด 5,000 บาท</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    * คณะสนับสนุนตามจ่ายจริง ไม่ต้องหักส่วนของ มน.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: INTERACTIVE REWARD CALCULATOR WIDGET (จำลองการคำนวณ) */}
      {renderSection('calculator') && (
        <section data-guide-section="calculator" className={`space-y-4${hiddenCls('calculator')}`}>
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Calculator className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              3. เครื่องมือจำลองการคำนวณเงินรางวัลและค่าเพจชาร์จ (Interactive Simulation)
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              ทดลองเลือกคุณสมบัติของบทความวิจัยของท่าน เพื่อตรวจสอบยอดเงินรางวัลและค่าตีพิมพ์ที่ระบบจะคำนวณตามเกณฑ์ประกาศฯ 27 พ.ค. 2567:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
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
                <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  ผลการจำลองสิทธิ์ที่ได้รับตามเกณฑ์:
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {calcResult.ruleCitation || 'พร้อมยื่นคำขอรับการสนับสนุน'}
                </div>
                {calcResult.notes && calcResult.notes.length > 0 && (
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {calcResult.notes.join(' • ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-slate-400">เงินรางวัล</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400">
                    {calcResult.rewardAmount.toLocaleString()} บาท
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">ค่าตีพิมพ์สนับสนุน</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400">
                    {calcResult.approvedPageCharge.toLocaleString()} บาท
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-slate-300 dark:border-slate-700">
                  <div className="text-xs text-slate-400 font-bold uppercase">รวมเงินที่ขออนุมัติ</div>
                  <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {calcResult.totalApproved.toLocaleString()} บาท
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* SECTION 4: FAQ (คำถามที่พบบ่อย) */}
      {renderSection('faq') && (
        <section data-guide-section="faq" className={`space-y-4${hiddenCls('faq')}`}>
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              4. คำถามที่พบบ่อย (FAQ)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            
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

      {/* SECTION 5: REWARD CYCLE (แผนผังกระบวนการดำเนินการระบบเงินรางวัล 19 ขั้นตอน) */}
      {renderSection('official_workflow') && (
        <section data-guide-section="official_workflow" className={`space-y-6${hiddenCls('official_workflow')}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Reward Cycle (แผนผังกระบวนการดำเนินงาน 19 ขั้นตอน)</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-semibold">19 ขั้นตอน</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร • การขออนุมัติและเบิกจ่ายเงินรางวัล / ค่าตีพิมพ์ (5 ฝ่าย 3 ระยะ 19 ขั้นตอน)
                </p>
              </div>
            </div>

            {/* View Mode Switcher & Print */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setInfographicViewMode('swimlane')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    infographicViewMode === 'swimlane'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  มุมมอง Swimlane
                </button>
                <button
                  type="button"
                  onClick={() => setInfographicViewMode('phases')}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                    infographicViewMode === 'phases'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  มุมมอง 3 ระยะดำเนินงาน
                </button>
              </div>

              <a
                href="/reward-process-infographic.html"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs sm:text-sm font-semibold border border-amber-300 dark:border-amber-700 cursor-pointer transition-all"
                title="เปิดอินโฟกราฟิกฉบับเต็มในแท็บใหม่"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                <span>เปิดอินโฟกราฟิกเต็มจอ</span>
              </a>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium border border-slate-200 dark:border-slate-700 cursor-pointer"
                title="พิมพ์เฉพาะแผนผัง / บันทึก PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์แผนผัง</span>
              </button>
            </div>
          </div>

          {/* Quick KPI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
              <div className="text-xs font-medium text-blue-600 dark:text-blue-400">ขั้นตอนทั้งหมด</div>
              <div className="text-2xl font-bold text-blue-950 dark:text-blue-200 mt-1">19 <span className="text-xs font-normal text-blue-600 dark:text-blue-400">ขั้นตอน</span></div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
              <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">กลุ่มผู้มีส่วนเกี่ยวข้อง</div>
              <div className="text-2xl font-bold text-emerald-950 dark:text-emerald-200 mt-1">5 <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">ฝ่าย/ตำแหน่ง</span></div>
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
              <div className="text-xs font-medium text-amber-600 dark:text-amber-400">ระยะดำเนินงานหลัก</div>
              <div className="text-2xl font-bold text-amber-950 dark:text-amber-200 mt-1">3 <span className="text-xs font-normal text-amber-600 dark:text-amber-400">ระยะ (Phases)</span></div>
            </div>
            <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50">
              <div className="text-xs font-medium text-purple-600 dark:text-purple-400">ผลลัพธ์ปลายทาง</div>
              <div className="text-2xl font-bold text-purple-950 dark:text-purple-200 mt-1">โอนเงิน <span className="text-xs font-normal text-purple-600 dark:text-purple-400">เข้าบัญชี</span></div>
            </div>
          </div>

          {/* Role Filter Buttons */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>คลิกเพื่อกรองหรือไฮไลท์ขั้นตอนตามฝ่ายที่รับผิดชอบ:</span>
              {selectedInfographicRole !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedInfographicRole('all')}
                  className="text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  ล้างตัวกรอง (แสดงทั้งหมด)
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setSelectedInfographicRole('all')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedInfographicRole === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-semibold'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="text-xs font-bold leading-tight">แสดงทั้งหมด</div>
                <div className="text-[11px] opacity-80">19 ขั้นตอน</div>
              </button>

              {WORKFLOW_ROLES_DEF.map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedInfographicRole(role.key)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedInfographicRole === role.key
                      ? 'ring-2 ring-amber-500 shadow-xs ' + role.badgeColor
                      : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${role.dotColor}`}></span>
                    <span className="text-xs font-bold truncate">{role.name}</span>
                  </div>
                  <div className="text-[11px] opacity-75 mt-0.5">{role.count} ขั้นตอน ({role.steps})</div>
                </button>
              ))}
            </div>
          </div>

          {/* VIEW 1: SWIMLANE VIEW */}
          {infographicViewMode === 'swimlane' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 text-white flex items-center justify-between">
                <div className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>ตารางกระบวนการ Swimlane 5 ฝ่าย (ขั้นตอนที่ 1 - 19)</span>
                </div>
                <span className="text-[11px] text-slate-300 bg-white/10 px-2 py-0.5 rounded">
                  {selectedInfographicRole === 'all' ? 'แสดงทั้ง 19 ขั้นตอน' : `กรองเฉพาะ: ${WORKFLOW_ROLES_DEF.find(r => r.key === selectedInfographicRole)?.name}`}
                </span>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[920px]">
                  {/* Swimlane Column Headers */}
                  <div className="grid grid-cols-5 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 sticky top-0 z-10">
                    <div className="p-3 text-center border-r border-slate-200 dark:border-slate-700 text-blue-800 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/20">
                      นักวิจัย / เลขานุการ
                    </div>
                    <div className="p-3 text-center border-r border-slate-200 dark:border-slate-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20">
                      เจ้าหน้าที่งานวิจัย
                    </div>
                    <div className="p-3 text-center border-r border-slate-200 dark:border-slate-700 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
                      จนท. นโยบายและแผน
                    </div>
                    <div className="p-3 text-center border-r border-slate-200 dark:border-slate-700 text-purple-800 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
                      เจ้าหน้าที่การเงิน
                    </div>
                    <div className="p-3 text-center text-rose-800 dark:text-rose-300 bg-rose-50/50 dark:bg-rose-950/20">
                      ผู้บริหาร
                    </div>
                  </div>

                  {/* 19 Step Rows */}
                  {WORKFLOW_19_STEPS_DEF.map((step) => {
                    const isHighlighted = selectedInfographicRole === 'all' || selectedInfographicRole === step.roleKey;
                    const isPhase1Start = step.stepNumber === 1;
                    const isPhase2Start = step.stepNumber === 5;
                    const isPhase3Start = step.stepNumber === 13;

                    return (
                      <React.Fragment key={step.stepNumber}>
                        {/* Phase Dividers */}
                        {isPhase1Start && (
                          <div className="bg-sky-50 dark:bg-sky-950/30 px-4 py-2 border-b border-sky-200 dark:border-sky-900/50 flex items-center justify-between text-xs font-semibold text-sky-800 dark:text-sky-300">
                            <span className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-sky-200 dark:bg-sky-900/60 text-sky-900 dark:text-sky-200 text-[10px]">ระยะที่ 1</span>
                              <span>การยื่นคำขอและตรวจเช็คระบบออนไลน์ (ขั้นตอนที่ 1 - 4)</span>
                            </span>
                            <span className="text-[11px] font-normal text-sky-600 dark:text-sky-400">ระบบสารสนเทศ</span>
                          </div>
                        )}
                        {isPhase2Start && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 px-4 py-2 border-y border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                            <span className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-[10px]">ระยะที่ 2</span>
                              <span>การเสนอขออนุมัติหลักการและกรอบงบประมาณ (ขั้นตอนที่ 5 - 12)</span>
                            </span>
                            <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">ตรวจงบประมาณและลงนาม</span>
                          </div>
                        )}
                        {isPhase3Start && (
                          <div className="bg-purple-50 dark:bg-purple-950/30 px-4 py-2 border-y border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs font-semibold text-purple-900 dark:text-purple-300">
                            <span className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 text-purple-900 dark:text-purple-200 text-[10px]">ระยะที่ 3</span>
                              <span>การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี (ขั้นตอนที่ 13 - 19)</span>
                            </span>
                            <span className="text-[11px] font-normal text-purple-700 dark:text-purple-400">ฎีกาเบิกจ่ายและโอนเงิน</span>
                          </div>
                        )}

                        {/* Swimlane Step Row */}
                        <div
                          className={`grid grid-cols-5 border-b border-slate-100 dark:border-slate-800 transition-opacity ${
                            isHighlighted ? 'opacity-100' : 'opacity-25 grayscale'
                          }`}
                        >
                          {/* Col 1: Researcher */}
                          <div className="p-2.5 border-r border-slate-100 dark:border-slate-800 flex items-center">
                            {step.roleKey === 'researcher' ? (
                              <div className={`w-full p-2.5 rounded-xl border ${
                                step.stepNumber === 19
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-950 dark:text-emerald-200 shadow-xs'
                                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-950 dark:text-blue-200'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                                    step.stepNumber === 19 ? 'bg-emerald-600' : 'bg-blue-600'
                                  }`}>
                                    {step.stepNumber}
                                  </span>
                                  <span className="font-bold text-xs">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{step.description}</p>
                              </div>
                            ) : null}
                          </div>

                          {/* Col 2: Research Office */}
                          <div className="p-2.5 border-r border-slate-100 dark:border-slate-800 flex items-center">
                            {step.roleKey === 'research-office' ? (
                              <div className="w-full p-2.5 rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-950 dark:text-emerald-200">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {step.stepNumber}
                                  </span>
                                  <span className="font-bold text-xs">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{step.description}</p>
                                {step.isFeedbackLoop && (
                                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                                    <span>↺ ส่งคืนแก้ไข (ย้อนกลับข้อ 2)</span>
                                  </div>
                                )}
                              </div>
                            ) : null}
                          </div>

                          {/* Col 3: Policy & Planning */}
                          <div className="p-2.5 border-r border-slate-100 dark:border-slate-800 flex items-center">
                            {step.roleKey === 'policy-plan' ? (
                              <div className="w-full p-2.5 rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 text-amber-950 dark:text-amber-200">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {step.stepNumber}
                                  </span>
                                  <span className="font-bold text-xs">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{step.description}</p>
                              </div>
                            ) : null}
                          </div>

                          {/* Col 4: Finance */}
                          <div className="p-2.5 border-r border-slate-100 dark:border-slate-800 flex items-center">
                            {step.roleKey === 'finance' ? (
                              <div className="w-full p-2.5 rounded-xl border bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-950 dark:text-purple-200">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {step.stepNumber}
                                  </span>
                                  <span className="font-bold text-xs">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{step.description}</p>
                              </div>
                            ) : null}
                          </div>

                          {/* Col 5: Executives */}
                          <div className="p-2.5 flex items-center">
                            {step.roleKey === 'executives' ? (
                              <div className="w-full p-2.5 rounded-xl border bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-950 dark:text-rose-200">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {step.stepNumber}
                                  </span>
                                  <span className="font-bold text-xs">{step.title}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">{step.description}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: 3-PHASE TIMELINE VIEW */}
          {infographicViewMode === 'phases' && (
            <div className="space-y-4">
              {[1, 2, 3].map((phaseNum) => {
                const phaseSteps = WORKFLOW_19_STEPS_DEF.filter(s => s.phase === phaseNum);
                const phaseTitle = phaseNum === 1
                  ? 'ระยะที่ 1: การยื่นคำขอและตรวจเช็คระบบออนไลน์'
                  : phaseNum === 2
                  ? 'ระยะที่ 2: การเสนอขออนุมัติหลักการและกรอบงบประมาณ'
                  : 'ระยะที่ 3: การขออนุมัติเบิกเงินและโอนเงินเข้าบัญชี';
                const phaseDesc = phaseNum === 1
                  ? 'ขั้นตอนที่ 1 - 4 (กรอกข้อมูลในระบบ ตรวจสอบคุณสมบัติบทความ และมีช่องทางส่งคืนแก้ไข)'
                  : phaseNum === 2
                  ? 'ขั้นตอนที่ 5 - 12 (ดาวน์โหลดเอกสาร บันทึกข้อมูลงบประมาณ และผู้บริหารลงนามอนุมัติกรอบวงเงิน)'
                  : 'ขั้นตอนที่ 13 - 19 (จัดทำเอกสารเบิกจ่าย ออกฎีกา และโอนเงินรางวัลเข้าบัญชีธนาคาร)';
                const headerGrad = phaseNum === 1
                  ? 'from-sky-600 to-blue-700'
                  : phaseNum === 2
                  ? 'from-amber-600 to-orange-700'
                  : 'from-purple-700 to-indigo-800';

                return (
                  <div key={phaseNum} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                    <div className={`p-4 bg-gradient-to-r ${headerGrad} text-white flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                          0{phaseNum}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base">{phaseTitle}</h3>
                          <p className="text-xs opacity-80">{phaseDesc}</p>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-white/20 font-medium">
                        {phaseSteps.length} ขั้นตอน
                      </span>
                    </div>

                    <div className="p-4 sm:p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {phaseSteps.map((step) => {
                          const isHighlighted = selectedInfographicRole === 'all' || selectedInfographicRole === step.roleKey;
                          const roleInfo = WORKFLOW_ROLES_DEF.find(r => r.key === step.roleKey);

                          return (
                            <div
                              key={step.stepNumber}
                              className={`p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 transition-all ${
                                isHighlighted ? 'opacity-100' : 'opacity-25 grayscale'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1 mb-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                                  {step.stepNumber}
                                </span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${roleInfo?.badgeColor}`}>
                                  {step.responsibleParty}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mb-1">
                                {step.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                {step.description}
                              </p>
                              {step.isFeedbackLoop && (
                                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  <span>↺ Feedback Loop ส่งคืนแก้ไข</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sub-section 2: Role Responsibilities (7 Roles) */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>บทบาท หน้าที่ และขั้นตอนการดำเนินงานแยกตาม 7 กลุ่มผู้ใช้งาน (Role Responsibilities)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              
              {/* Role 1: Public */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">ผู้ใช้ทั่วไป (Public / Guest)</h4>
                    <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">เข้าชมได้โดยไม่ต้องล็อกอิน</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li>ดูสถิติภาพรวมเงินรางวัลการตีพิมพ์รายปีงบประมาณ (Public Reward Summary)</li>
                  <li>ค้นหาและติดตามสถานะคำขอด้วย Tracking No. (เช่น <code>AWP69-xxx</code>, <code>AWP70-xxx</code>), DOI หรือชื่องานวิจัย</li>
                  <li>ได้รับการคุ้มครองข้อมูลส่วนบุคคลตามเกณฑ์ PDPA (ระบบ Mask เลขที่บัญชีและเลขบัตรประชาชนอัตโนมัติ)</li>
                  <li>เข้าสู่ระบบผ่าน Google NU Account (<code>@nu.ac.th</code>) เพื่อดำเนินการตามสิทธิ์</li>
                </ul>
              </div>

              {/* Role 2: Researcher */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">นักวิจัย (Researcher)</h4>
                    <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">ผู้ยื่นคำขอรับรางวัลและค่าตีพิมพ์</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li><strong>เปิดใช้งานระบบครั้งแรก:</strong> ยินยอมข้อกำหนด PDPA ตรวจสอบเลขบัญชี 10 หลัก และเลขบัตรประชาชน 13 หลัก</li>
                  <li><strong>ยื่นคำขอรับรางวัล (Step 1):</strong> ระบุ DOI ดึงข้อมูล Scopus อัตโนมัติ เลือกระดับ Quartile / Tier 1 และแนบหลักฐาน (Reprint, ใบเสร็จ)</li>
                  <li><strong>ตรวจสอบโควตาอัตโนมัติ:</strong> เพดาน 150,000 บาท/คน/ปีงบประมาณ และระบบยกยอดเงินรางวัล (Carry Over)</li>
                  <li><strong>แก้ไขคำขอ (Step 3):</strong> กรณีถูกส่งกลับ สามารถดูคำแนะนำและแก้ไขข้อมูลเดิมที่คงอยู่ครบถ้วน แล้วส่งตรวจซ้ำ</li>
                  <li><strong>พิมพ์เอกสารและรับเงิน (Step 12):</strong> พรีวิว/ดาวน์โหลดชุดเอกสารราชการ 5 ฉบับ และรับแจ้งเตือนเมื่อเงินโอนเข้าบัญชีผ่าน LINE OA</li>
                </ul>
              </div>

              {/* Role 3: Department Secretary */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-teal-200 dark:border-teal-900/50 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">เลขาภาควิชา (Department Secretary)</h4>
                    <span className="text-xs sm:text-sm text-teal-600 dark:text-teal-400 font-medium">ยื่นแทนและดูแลคณาจารย์ในภาควิชา</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li><strong>ยื่นคำขอและร่างคำขอแทนอาจารย์:</strong> เลือกอาจารย์ในภาควิชาตนเอง ระบบดึงข้อมูลบัญชี/บัตรประชาชนที่บันทึกไว้มาแสดงอัตโนมัติ</li>
                  <li><strong>สลับผู้ใช้เต็มรูปแบบ (Full CRUD Impersonation):</strong> สลับบทบาทไปเป็นนักวิจัยในภาควิชาเพื่อสร้าง/แก้ไข/ลบคำขอแทนได้เสมือนอาจารย์ดำเนินการเอง</li>
                  <li><strong>ติดตามงานระดับภาควิชา:</strong> ตรวจสอบสถานะคำขอทั้งหมดของคณาจารย์ในภาควิชาเพื่อช่วยประสานงานกับงานวิจัย</li>
                  <li><strong>จัดการข้อมูลนักวิจัยในภาค:</strong> เพิ่ม/แก้ไขข้อมูลอาจารย์ในภาควิชาตนเอง (ล็อกความปลอดภัยไม่ให้แก้ไขข้ามภาควิชาหรือแก้ข้อมูล Admin)</li>
                </ul>
              </div>

              {/* Role 4: Research Coordinator */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">เจ้าหน้าที่วิจัย / ผู้ประสานงาน (Coordinator)</h4>
                    <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">ผู้ตรวจสอบและขับเคลื่อนกระบวนการสารบรรณ</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li><strong>ตรวจความถูกต้อง 100% (Step 2):</strong> ตรวจ Checklist เอกสารแนบ, สัดส่วนผู้ประพันธ์, Affiliation คณะแพทย์ ม.นเรศวร, และความซ้ำซ้อน DOI</li>
                  <li><strong>ส่งคืนแก้ไข:</strong> ส่งคำขอกลับให้นักวิจัยแก้ไขพร้อมระบุข้อความแนะนำ</li>
                  <li><strong>อนุมัติผลตรวจและออกเลขหนังสือ (Step 4):</strong> กด "ตรวจครบ 100%" บันทึกสถานะลง D1 ปลดล็อกการลงเลขหนังสือและวันที่ผ่าน Calendar Date Picker</li>
                  <li><strong>พิมพ์ชุดเอกสารราชการ 5 ฉบับ:</strong> ตรวจสอบเอกสารตราครุฑมาตรฐาน 1.5 ซม. SVG และส่งออกไฟล์ Word (.docx)</li>
                  <li><strong>เสนอผู้บริหารและส่งต่อเรื่อง (Step 5, 6, 9):</strong> ส่งเสนอหัวหน้างานวิจัยลงนาม และส่งชุดเอกสารทางการไปยังหน่วยการคลัง</li>
                  <li><strong>แจ้งเตือนผ่าน LINE OA:</strong> ส่งข้อความอัปเดตสถานะคำขอถึงนักวิจัยอัตโนมัติ</li>
                </ul>
              </div>

              {/* Role 5: Finance Officer */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                    5
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">เจ้าหน้าที่การเงิน (Finance Officer)</h4>
                    <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">หน่วยการคลังและเบิกจ่ายเงินรางวัล</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li><strong>ลงรับเรื่องเบิกจ่าย (Step 7):</strong> ตรวจสอบใบสำคัญรับเงินและความถูกต้องของยอดเงิน ออกเลขรับการเงินและใบ Blue Slip</li>
                  <li><strong>ทำฎีกาเบิกเงิน (Step 10):</strong> ส่งเรื่องเบิกจ่ายผ่านระบบการเงินมหาวิทยาลัย บันทึกเลขฎีกา (Disbursement Voucher No.) และรหัสงบประมาณ</li>
                  <li><strong>โอนเงินและแนบสลิป (Step 11):</strong> โอนเงินเข้าบัญชีธนาคารของนักวิจัย อัปโหลด Payment Transfer Slip เข้าระบบ iRAM</li>
                  <li><strong>ปรับสถานะคำขอ:</strong> เปลี่ยนสถานะคำขอเป็น "Paid" (ชำระเงินเรียบร้อยแล้ว)</li>
                </ul>
              </div>

              {/* Role 6: Executive / Dean */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
                    6
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">ผู้บริหาร / คณบดี (Executive & Dean)</h4>
                    <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">พิจารณาและอนุมัติงบประมาณ</span>
                  </div>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  <li><strong>หัวหน้างานวิจัย / รองคณบดีฝ่ายวิจัย (Step 5):</strong> กลั่นกรองทางวิชาการและลงนามรับรองในบันทึกข้อความขออนุมัติ</li>
                  <li><strong>คณบดีคณะแพทยศาสตร์ (Step 8):</strong> ลงนามอนุมัติให้เบิกจ่ายเงินรางวัลจากงบประมาณรายได้ของคณะแพทยศาสตร์</li>
                  <li><strong>Executive Dashboard:</strong> ติดตามสถิติภาพรวมการใช้งบประมาณ อัตราการตีพิมพ์รายภาควิชา และแนวโน้มผลงานวิจัย</li>
                </ul>
              </div>

              {/* Role 7: System Administrator */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-300 dark:border-slate-700 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold">
                    7
                  </div>
                  <div>
                    <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">ผู้ดูแลระบบ (System Administrator)</h4>
                    <span className="text-xs sm:text-sm text-slate-500 font-medium">ควบคุมระบบ ตั้งค่าเกณฑ์ และดูแลความปลอดภัย</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 leading-relaxed">
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>จัดการผู้ใช้และสิทธิ์:</strong> กำหนดบทบาท ปรับปรุงข้อมูลบัญชีธนาคารและเลขบัตรประชาชนตามเกณฑ์ PDPA</li>
                    <li><strong>ตั้งค่าเกณฑ์เงินรางวัล:</strong> กำหนดปีงบประมาณ เพดานโควตา อัตราเงินรางวัล และรอบยกยอดงบประมาณ</li>
                  </ul>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Cloudflare D1 & Sync Console:</strong> ตรวจสอบความสมบูรณ์ของฐานข้อมูล ซิงค์ข้อมูลกับ Google Sheets และการสำรองข้อมูล</li>
                    <li><strong>Super Impersonation & Analytics:</strong> สลับเป็นผู้ใช้รายใดก็ได้เพื่อแก้ปัญหาหน้างาน และดูสถิติ Pageview Analytics</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Sub-section 3: 5 Official Printable Documents */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>ชุดเอกสารราชการ 5 ฉบับที่ระบบจัดทำและสร้างขึ้นให้อัตโนมัติ</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-sm sm:text-base text-slate-600 dark:text-slate-300">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">1. AWP Checklist:</span> รายการตรวจสอบเอกสารและข้อกำหนดการให้เงินรางวัล
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">2. บันทึกขออนุมัติเงินรางวัล:</span> ตราครุฑ 1.5 ซม. เรียนคณบดีเพื่อขออนุมัติเงินรางวัล
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">3. บันทึกขออนุมัติเบิกเงิน:</span> บันทึกข้อความฉบับเบิกเงินส่งงานคลัง อ้างอิงเลขและวันที่ฉบับ 2
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">4. ใบสำคัญรับเงิน:</span> แบบฟอร์มใบสำคัญรับเงินพร้อมแจกแจงยอดและหักค่าธรรมเนียม
              </div>
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200">5. แบบคำขอและรับรอง AWP46:</span> คำขอและรับรองการตีพิมพ์ผลงานวิจัยตามประกาศคณะฯ
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-medium">
                ✓ รองรับการส่งออก Word (.docx) และ PDF
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 6: CONTACT INFORMATION (ติดต่อหน่วยถ่ายทอดเทคโนโลยี) */}
      {renderSection('contact') && (
        <section data-guide-section="contact" className={`bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-lg space-y-4${hiddenCls('contact')}`}>
          <div className="flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold">หน่วยถ่ายทอดเทคโนโลยี งานวิจัย คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร</h2>
              <p className="text-sm text-slate-400">ยินดีให้คำปรึกษาและประสานงานเกี่ยวกับการขอรับเงินรางวัลและค่าตีพิมพ์บทความวิจัย</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2 border-t border-slate-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-200">โทรศัพท์ภายใน</div>
                <div className="text-amber-400 font-mono font-bold text-sm">5761</div>
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
