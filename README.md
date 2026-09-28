# iRAM Reward System (ระบบขอรับการสนับสนุนค่าตีพิมพ์และเงินรางวัลการตีพิมพ์บทความ)

ระบบสารสนเทศเพื่อการขอรับการสนับสนุนค่าตีพิมพ์ (Page Charge) และเงินรางวัลการตีพิมพ์บทความในวารสารวิชาการระดับนานาชาติและระดับชาติ  
คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร

---

## 🌟 จุดเด่นและฟังก์ชันการทำงานหลัก

1. **ระบบคัดกรองและประเมินเกณฑ์อัตโนมัติ (Online Gatekeeper & Eligibility Check):**
   - ตรวจสอบเงื่อนไขตามประกาศมหาวิทยาลัยนเรศวร และประกาศคณะแพทยศาสตร์
   - คำนวณวงเงินสนับสนุนค่าตีพิมพ์ (Page Charge) สูงสุด 70,000 บาท (30,000 บาท มหาวิทยาลัย + 40,000 บาท คณะ)
   - คำนวณเงินรางวัลตาม Quartile (Q1 Tier 1, Q1, Q2, Q3, Q4, TCI กลุ่ม 1, TCI กลุ่ม 2)
   - ตรวจสอบสัดส่วนผู้แต่ง (First Author / Corresponding Author / Co-author) และสถานะการทำงาน

2. **ระบบออกเอกสารราชการอัตโนมัติ 5 ชุด (Official Documents Export):**
   - รองรับทั้งการดูตัวอย่างก่อนพิมพ์ (**Interactive HTML Preview & Print to PDF**) และการดาวน์โหลดไฟล์ **Microsoft Word (.docx)**
   - **ชุดที่ 1:** แบบตรวจสอบหลักฐานการขอรับการสนับสนุนฯ (Checklist)
   - **ชุดที่ 2:** บันทึกข้อความขออนุมัติเงินรางวัลการตีพิมพ์บทความ
   - **ชุดที่ 3:** บันทึกข้อความขออนุมัติเบิกเงินค่าตอบแทนและค่าใช้จ่าย (ค่าตีพิมพ์)
   - **ชุดที่ 4:** ใบสำคัญรับเงิน (Receipt Voucher) — เส้นตารางแนวตั้ง จัดกั้นหน้า-หลัง ไม่มีเครื่องหมาย ฿ รองรับการแสดงผล 1 หน้ากระดาษพอดี
   - **ชุดที่ 5:** ใบรับรองการจ่ายเงิน (ตามระเบียบกระทรวงการคลัง ข้อ 46) — ฟอร์แมตถูกต้อง ไม่ถ่างตัวอักษร เว้นระยะห่างขอบตารางสวยงาม

3. **รหัสสารบรรณและข้อมูลภาควิชาอัตโนมัติ:**
   - ผูกรหัสหนังสือราชการคณะแพทยศาสตร์ ม.นเรศวร ตามประกาศล่าสุด (อว 0603.10.xx)
   - ดึงข้อมูลสังกัดภาควิชาและตำแหน่งทางวิชาการอัตโนมัติ

4. **ระบบรักษาความปลอดภัยและการเข้าถึงด้วย NU Account (NU Account Gatekeeper & Public vs Private Mode):**
   - **โหมดผู้เยี่ยมชมทั่วไป (Guest Mode):** แสดงเฉพาะ Header สาธารณะ และ Dashboard สถิติภาพรวมที่จำเป็น (สัดส่วน Quartile, ประกาศฯ 2567) **ซ่อนข้อมูลส่วนบุคคล รายชื่ออาจารย์ และตารางคำขอ 100% (Zero Info Leakage ตามมาตรฐาน PDPA)**
   - **การยืนยันตัวตนด้วย Google Workspace (@nu.ac.th):** ตรวจสอบโดเมนมหาวิทยาลัยนเรศวร หากเป็นผู้ใช้ใหม่จะสร้างโปรไฟล์นักวิจัยให้อัตโนมัติ (Auto-Provisioning)
   - **ระบบทดสอบตามบทบาท (Quick Demo Switcher):** รองรับการทดสอบทั้ง 5 บทบาทได้ทันที

5. **ระบบกำหนดสิทธิ์และมุมมองตามบทบาท (Role-Based Access Control & Minimalism):**
   - แบ่งแยกสิทธิ์และหน้าจอการทำงานชัดเจน 5 บทบาท: นักวิจัย (Researcher), เจ้าหน้าที่วิจัย (Coordinator), งานการเงิน (Finance), ผู้บริหาร (Executive), และผู้ดูแลระบบ (Admin)
   - ปรับแต่งหน้าจอให้แสดงเฉพาะข้อมูลและเมนูที่จำเป็นสำหรับแต่ละบทบาท (Role-based Header & Navigation Cleanup)
   - นักวิจัยเห็นเฉพาะงานของตนเอง 100% พร้อมแดชบอร์ดวงเงินสะสมเทียบกับเพดาน 150,000 บาท
   - เจ้าหน้าที่วิจัยควบคุมกระบวนการผ่าน Kanban Board 12 ขั้นตอน SLA และระบบแจ้งเตือน LINE OA
   - งานการเงินบันทึกเลขฎีกา วันที่โอนเงิน และหลักฐานการโอนเงิน (Transfer Slip) โดยซ่อนปุ่มยื่นคำขอเพื่อป้องกันความสับสน

6. **ศูนย์ควบคุมและจัดการผู้ใช้งาน (Admin User Management Console & PDPA Security):**
   - ทะเบียนผู้ใช้งานรวมศูนย์ (`User Registry Service`) พร้อมสถิติจำนวนผู้ใช้ตามบทบาท
   - ค้นหาและกรองผู้ใช้ตามบทบาทและภาควิชา พร้อมระบบ Quick Role Selector
   - **PDPA Security Gate:** ล็อกหน้าจอด้านหลัง Admin Passcode ป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต
   - ระบบปิดบังข้อมูลอ่อนไหว (Sensitive Data Masking) สำหรับเลขบัญชีธนาคารและเลขประจำตัวประชาชน

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite 6, Lucide React, Framer Motion
- **Authentication:** Firebase Google OAuth (NU Workspace Domain Enforcement `@nu.ac.th`)
- **Document Engine:** `docx` (v9) สำหรับสร้าง Word .docx ที่จัดหน้าแบบ Saraban ราชการไทย และ Web Print Engine สำหรับ PDF
- **Backend / Database / Deployment:** Cloudflare Pages & Cloudflare D1 (Production: [https://iram-reward-system.pages.dev](https://iram-reward-system.pages.dev))

---

## 🚀 การติดตั้งและใช้งาน (Local Development)

```bash
# ติดตั้ง dependencies
npm install

# รัน Development Server
npm run dev

# ตรวจสอบ TypeScript Lint
npm run lint

# Build สำหรับ Production
npm run build
```

---

## 📦 เวอร์ชั่นและประวัติการปล่อย (Releases)

- **v1.2.0 (NU Account Gatekeeper & Public vs Private Dashboard - 28 ก.ย. 2569):**
  - ติดตั้งโหมด Guest / Public Mode: ซ่อนตารางรายการคำขอและข้อมูลส่วนบุคคล 100% ตามมาตรฐาน PDPA
  - หน้าต่างเข้าสู่ระบบด้วย NU Account (`LoginModal.tsx`): รองรับ Google Workspace `@nu.ac.th` และ Quick Demo Login สำหรับผู้ประเมิน
  - ระบบตรวจสอบและคุ้มครองโดเมนมหาวิทยาลัยนเรศวร พร้อม Auto-provisioning บทบาทนักวิจัยอัตโนมัติ
  - เพิ่มปุ่มออกจากระบบ (Logout) และแถบ Header สาธารณะที่เรียบง่าย ปลอดภัย

- **v1.1.0 (Role-Based Access Control & Admin Console - 28 ก.ย. 2569):**
  - ติดตั้งหน้าจอจัดการผู้ใช้งาน (User Management Console) สำหรับ Admin
  - ติดตั้งระบบความปลอดภัย Admin Security Gate & PDPA Masking ป้องกันข้อมูลรั่วไหล
  - ปรับปรุงโครงสร้าง Header และ Navigation ให้แสดงผลเฉพาะตำแหน่งที่จำเป็นตามสิทธิ์ของแต่ละบทบาท 100%
  - เพิ่ม Route Guard ป้องกันการค้างของหน้าจอข้ามบทบาท

- **v1.0.0 (Initial Release - 25 ก.ย. 2569):**
  - ระบบยื่นคำขอและประเมินเกณฑ์
  - ระบบ Export เอกสารราชการครบทั้ง 5 ชุด (Word .docx + PDF)
  - ปรับปรุงฟอร์แมตใบสำคัญรับเงินและใบรับรองการจ่ายเงิน ข้อ 46 สมบูรณ์แบบ
  - Deploy ขึ้น Production บน Cloudflare Pages
