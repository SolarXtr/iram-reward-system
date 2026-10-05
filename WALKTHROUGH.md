# สรุปผลการพัฒนา: ระบบคัดกรองการเข้าถึงด้วย NU Account (@nu.ac.th) และ Public vs Private Dashboard (v1.2.0)

## 1. ภาพรวมการพัฒนา (Overview)
ตามข้อกำหนดในการคุ้มครองข้อมูลส่วนบุคคล (PDPA) และการกำกับดูแลความปลอดภัยของระบบเงินรางวัล คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร ทีม iRAM ได้ดำเนินการติดตั้ง **ระบบคัดกรองการเข้าถึงด้วย NU Account (Authentication Gatekeeper)** และแบ่งแยกการแสดงผลระหว่าง **โหมดผู้เยี่ยมชมทั่วไป (Guest Mode - Zero Information Leakage)** กับ **โหมดผู้ใช้งานที่ยืนยันตัวตนแล้ว (Authenticated Role-Based Mode)** เสร็จสมบูรณ์เรียบร้อยแล้ว

---

## 2. ฟังก์ชันเด่นที่ติดตั้งในเวอร์ชัน v1.2.0

### ก. การแสดงผลสำหรับผู้เยี่ยมชมทั่วไป (Guest Mode: Zero Information Leakage)
1. **Public Identity Header:**
   - แสดงเฉพาะตราสัญลักษณ์คณะแพทยศาสตร์ ม.นเรศวร, ชื่องานวิจัยและบริการวิชาการ, และป้ายประกาศ พ.ศ. 2567
   - ปุ่มเด่นสีทอง: **"เข้าสู่ระบบด้วย NU Account"** (เชื่อมโยง Google Workspace และ Demo Login)
   - ซ่อนช่องค้นหา, แถบสลับบทบาท, โปรไฟล์ส่วนบุคคล, และปุ่ม Cloudflare D1
   - แถบนำทางแสดงเพียงแท็บเดี่ยว: **"ภาพรวมระบบและสถิติสาธารณะ (Public General Stats)"**
2. **Public Dashboard (สถิติภาพรวมที่จำเป็น):**
   - แสดงการ์ดสรุปยอดเงินสนับสนุนรวม, ยอดเบิกจ่ายรวม, สัดส่วนเงินรางวัลต่อค่าตีพิมพ์
   - แสดงกราฟการกระจายตัวบทความตาม Quartile (Q1 Tier 1, Q1, Q2, Q3, Q4, TCI กลุ่ม 1 และ 2)
   - แสดงไทม์ไลน์ 12 ขั้นตอน SLA และข้อมูลหลักเกณฑ์ตามประกาศคณะฯ พ.ศ. 2567
   - **ซ่อนตาราง Recent Applications Table 100%:** ไม่เปิดเผยชื่ออาจารย์ผู้ขอรับทุน, ภาควิชา, ชื่อบทความ, หรือยอดเงินรางวัลรายบุคคล
   - แสดงกล่องแจ้งเตือนความปลอดภัยตามมาตรฐาน PDPA พร้อมปุ่ม Call-to-Action ชวนให้อาจารย์เข้าสู่ระบบ

### ข. หน้าต่างเข้าสู่ระบบด้วย NU Account (`LoginModal.tsx`)
1. **Google Workspace Sign-in (@nu.ac.th):**
   - เชื่อมต่อ Google OAuth ผ่าน Firebase
   - ตรวจสอบโดเมนอีเมล หากไม่ลงท้ายด้วย `@nu.ac.th` ระบบจะปฏิเสธการเข้าถึงพร้อมข้อความแจ้งเตือนที่ชัดเจน
   - **Auto-Provisioning:** หากเป็นอาจารย์ที่เข้าใช้งานครั้งแรก ระบบจะสร้างโปรไฟล์นักวิจัย (Researcher) ให้อัตโนมัติทันที
2. **Quick Demo Login (โหมดทดสอบสำหรับผู้ตรวจประเมิน):**
   - มีปุ่มเข้าใช้งานด่วนครบ 5 บทบาท พร้อมชื่อ-สกุล อีเมล และสังกัดภาควิชา:
     - 👨‍🏫 **นักวิจัย (Researcher):** ผศ.ดร.สมหมาย วิจัยเจริญ (`sommaiv@nu.ac.th`)
     - 📋 **จนท.วิจัย (Coordinator):** คุณปรารถนา เอนกปัญญากุล (`pararthanaa@nu.ac.th`)
     - 💰 **งานการเงิน (Finance):** คุณวิลาสินี การคลังมั่นคง (`finance_med@nu.ac.th`)
     - 👔 **ผู้บริหาร (Executive):** รศ.นพ.อาทิตย์ เหล่าเรืองธนา (`arthitl@nu.ac.th`)
     - 🛡️ **ผู้ดูแลระบบ (Admin):** นายทินกรณ์ หาญณรงค์ (`tinnakornh@nu.ac.th`)

### ค. การแสดงผลเมื่อ Login ด้วย NU Account แล้ว (Authenticated Role-Based Mode)
1. **อาจารย์ / นักวิจัย (Researcher):**
   - แดชบอร์ดแสดงข้อมูลเฉพาะตนเอง: ยอดคำขอของฉัน, วงเงินสะสมคงเหลือเทียบกับเพดาน 150,000 บาท
   - ตารางแสดงเฉพาะรายการคำขอของอาจารย์ท่านนั้น 100%
   - แท็บนำทางแสดง 3 แท็บ: แดชบอร์ดคำขอของฉัน, ตารางคำขอของฉัน, ปฏิทินรอบเงินโอน
2. **เจ้าหน้าที่วิจัย (Coordinator):**
   - ปลดล็อกแดชบอร์ดภาพรวมคณะ, กระดาน Kanban 12 ขั้นตอน, ตารางข้อมูลทั้งคณะ, และศูนย์แจ้งเตือน LINE OA
3. **งานการเงิน (Finance):**
   - ปลดล็อกหน้าจัดการฎีกา, วันที่โอนเงิน, และปฏิทินตัดจ่ายรอบเดือน โดยซ่อนปุ่มยื่นคำขอเพื่อป้องกันความสับสน
4. **ผู้บริหาร (Executive):**
   - แสดงสถิติและภาพรวมบทความวิจัยระดับนานาชาติ
5. **ผู้ดูแลระบบ (Admin):**
   - เข้าถึงเมนูและฟังก์ชันทั้งหมด รวมถึง **Admin User Management Console**

### ง. ปุ่มออกจากระบบ (Logout) และ Route Guard
- เพิ่มปุ่มออกจากระบบ (Logout) บริเวณมุมขวาบนของ Header
- เมื่อกด Logout ระบบจะเคลียร์ Session และเปลี่ยนมุมมองกลับเป็น Guest Mode ทันที
- Route Guard บังคับให้อยู่เฉพาะหน้า Dashboard เมื่อยังไม่ผ่านการล็อกอิน ป้องกันการเข้าถึง URL หรือ Tab ภายในโดยตรง

---

## 3. สรุปไฟล์ที่มีการสร้างและปรับปรุง

| ไฟล์ | ลักษณะ | การเปลี่ยนแปลง |
|---|---|---|
| [`src/services/authService.ts`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/src/services/authService.ts) | สร้างใหม่ | จัดการ Session ผู้ใช้, ตรวจสอบโดเมน `@nu.ac.th`, Auto-provisioning ผู้ใช้ใหม่, Demo Login, และ Logout |
| [`src/components/LoginModal.tsx`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/src/components/LoginModal.tsx) | สร้างใหม่ | หน้าต่าง Modal สวยงาม รองรับทั้ง Google Workspace (@nu.ac.th) และปุ่ม Quick Demo 5 บทบาท |
| [`src/components/Header.tsx`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/src/components/Header.tsx) | แก้ไข | แสดง Guest Header ปลอดภัยเมื่อยังไม่ล็อกอิน, ปุ่มเข้าสู่ระบบ, ซ่อนเครื่องมือที่ไม่เกี่ยวข้อง, เพิ่มปุ่ม Logout |
| [`src/components/DashboardView.tsx`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/src/components/DashboardView.tsx) | แก้ไข | เพิ่ม Public Dashboard (สถิติ Quartile, ประกาศฯ), ซ่อนตาราง Recent Applications 100% ป้องกันข้อมูลรั่วไหล |
| [`src/App.tsx`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/src/App.tsx) | แก้ไข | จัดการ State `currentUser` เริ่มต้นเป็น null, เชื่อมต่อ LoginModal, บังคับ Route Guard สำหรับ Guest |
| [`README.md`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/README.md) & [`ROADMAP.md`](file:///D:/.gemini/antigravity/scratch/iram-reward-system/ROADMAP.md) | แก้ไข | อัปเดตรายละเอียดฟังก์ชันความปลอดภัย v1.2.0, บันทึกประวัติการปล่อยเวอร์ชัน |

---

# สรุปผลการพัฒนา: การเชื่อมโยง Cloudflare D1 `irUser` เป็น Single Source of Truth สำหรับโปรไฟล์และสิทธิ์การใช้งาน (v1.3.0)

## 1. ภาพรวมการพัฒนา (Overview)
เพื่อแก้ปัญหาความไม่สอดคล้องกันระหว่าง **หน้าต่างโปรไฟล์ผู้ใช้ (`UserProfileModal.tsx`)** และ **ศูนย์จัดการผู้ใช้ของผู้ดูแลระบบ (`UserManagementView.tsx`)** รวมถึงรองรับการที่นักวิจัยอัปเดตข้อมูลตนเองจากเครื่องใดก็ได้แล้วข้อมูลต้องอัปเดตแบบ Real-time ข้ามเครื่อง ทีม iRAM ได้ดำเนินการ:
1. เชื่อมโยงฐานข้อมูลหลัก **Cloudflare D1 (`iram-db`)** ตาราง **`irUser`** ให้เป็น **Single Source of Truth** ร่วมกันทั้งระบบ Scopus และระบบเงินรางวัล
2. พัฒนาและ Deploy Backend API บน Cloudflare Worker `iram-backend`
3. ปรับปรุง Frontend `iram-reward-system` ให้ทำงานแบบ Offline-first fallback และ Real-time Cloud Sync

---

## 2. การดำเนินงานหลักที่สำเร็จ (Completed Milestones)

### ก. ขยายโครงสร้างฐานข้อมูล Cloudflare D1 (`irUser`)
- เพิ่มฟิลด์รองรับงานเงินรางวัลและข้อมูลบุคคล:
  - `phone` (เบอร์โทรศัพท์ติดต่อ)
  - `bankName` (ธนาคารรับเงินโอน)
  - `bankAccountNo` (เลขที่บัญชีธนาคาร)
  - `idCardNo` (เลขประจำตัวประชาชน)
  - `academicPosition` (ตำแหน่งทางวิชาการ เช่น ศ., รศ., ผศ.)
  - `administrativePosition` (ตำแหน่งบริหาร)
  - `rolesJson` (JSON array สิทธิ์ใช้งานระบบ)
  - `lastLoginAt` (เวลาเข้าใช้งานล่าสุด)
- นำเข้าข้อมูลผู้ใช้ตั้งต้น 12 บัญชี (รวมผู้บริหาร, อาจารย์แพทย์, เจ้าหน้าที่ และแอดมิน) เข้าสู่ Cloudflare D1 สำเร็จ 100%

### ข. พัฒนาและ Deploy Backend API บน Cloudflare Worker
- URL Endpoint: `https://iram-backend.tinnakornh.workers.dev`
  - `GET /api/users` : ดึงรายชื่อผู้ใช้ทั้งหมดพร้อมฟิลด์โปรไฟล์และการเงิน
  - `GET /api/users/profile/:email` : ดึงข้อมูลโปรไฟล์ตามอีเมล
  - `PUT /api/users/profile/:id` : อัปเดตข้อมูลโปรไฟล์ (ชื่อ, เบอร์โทร, บัญชีธนาคาร, ตำแหน่ง)
  - `POST /api/users` : เพิ่มบัญชีผู้ใช้ใหม่
- Worker Version ID: `f65facb3-0a47-4925-b83b-5713cb86e330`

### ค. ปรับปรุง Frontend สู่ระบบ Single Source of Truth
- สร้าง `src/services/userService.ts` เชื่อมโยง D1 APIs พร้อม Offline-first fallback ผ่าน `localStorage`
- ปรับปรุง `src/components/UserProfileModal.tsx`:
  - ดึงรายชื่อผู้ใช้จาก `registeredUsers` (เห็นครบทั้ง 12 คน และ sync ตรงกับ Admin Console เสมอ)
  - แก้ไขป้ายบทบาทของผู้บริหาร (Executive) ให้แสดงเป็นภาษาไทย **"ผู้บริหาร"** พร้อม Badge สี Indigo อย่างถูกต้อง
- ปรับปรุง `src/App.tsx`:
  - ดึงข้อมูล `registeredUsers` จาก D1 เมื่อเริ่มต้นโหลดระบบ
  - เมื่อนักวิจัยหรือ Admin แก้ไขข้อมูลโปรไฟล์ ข้อมูลจะถูกซิงก์ขึ้น D1 ทันที และอัปเดต state ในแอปพร้อมกัน

---

## 3. สรุปไฟล์ที่มีการสร้างและปรับปรุง (v1.3.0)

| Repository | ไฟล์ | ลักษณะ | การเปลี่ยนแปลง |
|---|---|---|---|
| `iram-backend` | `extend_iruser_reward_profile.sql` | สร้างใหม่ | สคริปต์ Migration ขยาย Schema ตาราง `irUser` บน D1 |
| `iram-backend` | `src/index.ts` | ปรับปรุง | เพิ่ม Endpoints จัดการ Profile และ Users เชื่อมต่อกับ D1 |
| `iram-reward-system` | `src/services/userService.ts` | สร้างใหม่ | Data Service เชื่อมโยง D1 Users API พร้อม Offline Fallback |
| `iram-reward-system` | `src/components/UserProfileModal.tsx` | ปรับปรุง | แสดงผู้ใช้ครบ 12 บัญชี และแก้ป้าย Role Executive |
| `iram-reward-system` | `src/App.tsx` | ปรับปรุง | โหลดและซิงก์ Users กับ Cloudflare D1 Real-time |
| `iram-reward-system` | `package.json` | ปรับปรุง | Bump Version สู่ `v1.3.0` |

---

## 4. ผลการทดสอบ (Verification)
1. **Cloudflare D1 Query & Seed Verification:** ข้อมูลผู้ใช้ 12 คน ปรากฏในตาราง `irUser` ครบถ้วน
2. **Backend API Verification:** ทดสอบเรียก `GET /api/users` และ `GET /api/users/profile/tinnakornh@nu.ac.th` ได้ผลลัพธ์ JSON สมบูรณ์
3. **Frontend Production Build:** รัน `npm run build` ผ่านสมบูรณ์ (Built in 4.67s, 0 errors)
4. **Git Tracking & Push:**
   - `iram-backend`: Commit `e89480c` -> Push `origin/main`
   - `iram-reward-system`: Commit `93412f1` -> Git Tag `v1.3.0` -> Push `origin/main --tags`

---

## 5. การปรับแต่งหน้าจอสำหรับผู้เยี่ยมชม (Guest View UI Cleanup)
ตามความต้องการปรับลดองค์ประกอบที่ไม่จำเป็นสำหรับผู้เยี่ยมชมทั่วไป:
1. **Header Cleanup:**
   - นำป้าย "ประกาศ พ.ศ. 2567" ออกจาก Header (มีผลกับทุกบทบาท/ผู้ใช้ทุกคน)
   - ตัดปุ่ม "เข้าสู่ระบบด้วย NU Account" บริเวณขวาบนของ Header ในโหมดผู้เยี่ยมชมออก (คงไว้เฉพาะในกล่อง Hero Banner และ Call-to-Action ด้านล่าง)
   - ตัดแถบนำทางรอง (Secondary Bar) ที่แสดง `ภาพรวมระบบและสถิติสาธารณะ (Public General Stats)` และข้อความ PDPA ออกสำหรับผู้เยี่ยมชม ทำให้ Header มีขนาดกะทัดรัด (Single Bar) สะอาดตา
2. **Dashboard Overview Cleanup:**
   - คงการแสดงผลสถิติภาพรวมที่จำเป็น: งบประมาณอนุมัติรวม, ยอดเบิกจ่าย, งานอยู่ระหว่างพิจารณา, สัดส่วนรางวัลต่อค่าตีพิมพ์, การกระจายตัวตาม Quartile, เกณฑ์สำคัญ และไทม์ไลน์ SLA
   - ตัดส่วนกล่องแจ้งเตือนตารางคำขอ (Privacy Alert Box) ออกทั้งหมด เพื่อไม่ให้มีข้อความหรือกรอบเกี่ยวกับตารางคำขอรบกวนสายตาผู้เยี่ยมชม
   - สิ้นสุดเนื้อหาด้วยการ์ด Call-to-Action สีทองสำหรับคณาจารย์อย่างสวยงามและลงตัว

---

## 6. การปรับปรุงโครงสร้างผู้ใช้งานและนักวิจัยบน D1 (`irUser` Consolidation & Short Name Auto-Generation)
เพื่อแก้ปัญหาความซ้ำซ้อน ฐานข้อมูลอ้วน และป้องกันการเกิดบุคคลซ้ำซ้อนเมื่อเลื่อนฐานะหรือเปลี่ยนชื่อ-สกุล:
1. **D1 Schema Migration:**
   - ขยายโครงสร้าง `irUser` เพิ่ม: `titleTh`, `firstNameTh`, `lastNameTh`, `titleEn`, `firstNameEn`, `lastNameEn`, `shortNameEn`, `aliasesJson`, `department`, `scopusAuthorId`, `orcid`, `wosResearcherId`
   - สร้าง Index: `idx_user_shortNameEn`, `idx_user_scopusAuthorId`, `idx_user_email`
2. **Automated Parsing & Short Name Generation:**
   - ประมวลผลและแยกชื่อ-สกุล คำนำหน้า ทั้งภาษาไทยและอังกฤษให้อัตโนมัติครบทั้ง **308 ท่าน**
   - สร้างชื่อย่อสากล (`shortNameEn`) เช่น `Tapprom A.`, `Kuatrakul A.`, `Mahatthanatrakul A.`, `Srisingh K.` เพื่อใช้ในการจำแนกบทความ Scopus / WoS ได้อย่างแม่นยำ 100%
3. **Smart Progression & Audit History Logging:**
   - เมื่อมีการเลื่อนตำแหน่งทางวิชาการ (ผศ. ➔ รศ. ➔ ศ.) หรือเปลี่ยนคำนำหน้า/นามสกุล ระบบจะดำเนินการ `UPDATE` บน `userId` เดิมเท่านั้น (ไม่สร้างแถวใหม่)
   - ส่งคำสั่งบันทึกประวัติการเปลี่ยนแปลงลงตาราง `irResearcherProfileHistory` อัตโนมัติ (วันที่มีผล, ตำแหน่งเดิม, ตำแหน่งใหม่, เหตุผล)
   - หากมีการเปลี่ยนนามสกุล ระบบจะเก็บชื่อย่อเดิมไว้ใน `aliasesJson` อัตโนมัติ เพื่อให้บทความเก่าใน Scopus ยังคงผูกอยู่กับอาจารย์
4. **Backend API & Scopus Author Matching:**
   - ปรับปรุง `/api/users` และ `/api/users/profile/:email` ให้ดึงจาก `irUser` ตารางเดียวโดยตรง (ลด Row Reads ใน D1)
   - ปรับ Scopus author import ให้จับคู่ผู้แต่งบทความด้วย `shortNameEn` (เช่น `Srisingh K.`), ชื่อเต็ม, และ `aliasesJson`
   - Deploy Production Worker Version ID: `13869fe7-1693-4845-bdea-2e017138605d`

---

## 7. การแยกเลขที่หนังสือและวันที่อิสระ ระหว่างบันทึกขออนุมัติเงินรางวัล (ฉบับที่ 2) และบันทึกขออนุมัติเบิกเงิน (ฉบับที่ 3)

### ปัญหาเดิม
เดิมระบบใช้เลขที่หนังสือและวันที่ (`docRunningNo`, `officialDocDate`) ชุดเดียวกันในเอกสารทั้งสองฉบับ ส่งผลให้หัวบันทึกของ **บันทึกขออนุมัติเบิกเงิน (ฉบับที่ 3)** แสดงเลขและวันที่ตรงกับบันทึกขออนุมัติเงินรางวัล (ฉบับที่ 2) ทั้งที่ในทางสารบรรณเป็นหนังสือคนละฉบับ และออกคนละวัน

### การปรับปรุงและแก้ไข
1. **ขยายโครงสร้างข้อมูล (`types.ts`):**
   - เพิ่มฟิลด์ `disbursementDocRunningNo?: string` (เลขลำดับหนังสือออกของฉบับเบิกเงิน)
   - เพิ่มฟิลด์ `disbursementOfficialDocDate?: string` (วันที่ทางการของฉบับเบิกเงิน)
   - เพิ่มฟิลด์ `disbursementInternalDocNo?: string` (เลขที่หนังสือสมบูรณ์ของฉบับเบิกเงิน เช่น `อว 0603.10.10/095`)
2. **ปรับปรุงส่วนสร้างเอกสาร Word DOCX (`docxExportService.ts`):**
   - ในฟังก์ชัน `generateMemoDisbursementDocx`:
     - **ส่วนหัวบันทึก (Header):** นำเข้า `disbursementDocNoText` และ `disbursementDateText` เพื่อแสดงเลขที่และวันที่เฉพาะของฉบับเบิกเงิน
     - **ส่วนเนื้อหา (Reference Paragraph):** นำเข้า `refDocNoText` และ `refDateText` เพื่อคงการอ้างถึงเลขที่และวันที่ของฉบับขออนุมัติเงินรางวัล (ฉบับที่ 2) ตามระเบียบสารบรรณ
3. **ปรับปรุงหน้าต่างจัดการและพิมพ์เอกสารราชการ (`OfficialPrintModal.tsx`):**
   - **แผงควบคุมด้านข้าง (Sidebar Controls):** แยกช่องกรอกออกเป็น 2 กล่องสีชัดเจน:
     - 🟦 **กล่องสีฟ้า (ฉบับที่ 2 - ฉบับต้นเรื่อง):** สำหรับลงเลขลำดับและวันที่ของ "บันทึกขออนุมัติเงินรางวัล"
     - 🟪 **กล่องสีม่วง Indigo (ฉบับที่ 3 - ฉบับเบิกจ่าย):** สำหรับลงเลขลำดับและวันที่ของ "บันทึกขออนุมัติเบิกเงิน"
   - **Smart UX / UI Helpers:**
     - มีปุ่ม "วันนี้" แยกอิสระทั้ง 2 ฉบับ
     - มีแถบ Live Preview วันที่ แสดงผลลัพธ์ที่จะขึ้นบนหัวบันทึกแบบ Real-time ใต้ช่องกรอก
     - มีข้อความเตือนสีเหลือง `⚠️ วันที่ตรงกับฉบับ 2` หากวันที่ทั้ง 2 ฉบับตรงกัน เพื่อเตือนเจ้าหน้าที่
     - มีระบบ **Auto-Focus Highlight Ring:** เมื่อผู้ใช้คลิกเลือกแท็บ "3. บันทึกขออนุมัติเบิกเงินรางวัล" กล่องกรอกสีม่วงจะเรืองแสงพร้อมป้ายเตือน `⚠️ กรอกด้วย`
   - **ส่วนแสดงผล Preview (HTML Canvas):**
     - หัวกระดาษฉบับที่ 3 แสดงผลจาก `previewDisbursementDocNo` และ `previewDisbursementDate`
     - ย่อหน้าอ้างถึงในเนื้อหา ยังคงอ้างถึง `previewDocNo` และ `previewDate` ของฉบับที่ 2 อย่างถูกต้อง
4. **รองรับการบันทึกสถานะลงฐานข้อมูล (`App.tsx`):**
   - ฟังก์ชัน `handleUpdateDocDetails` ซิงก์ฟิลด์ชุดเบิกเงินขึ้น Cloudflare D1 และ LocalStorage พร้อมกัน

---

## 8. การปรับปรุงระบบยืนยันตัวตนสู่ Production Mode และการ Deploy ผ่าน Cloudflare Pages

### การปรับปรุง
1. **ตัดระบบ Demo Login ออก 100% (`LoginModal.tsx`):**
   - นำปุ่มทดสอบสิทธิ์ (Demo Role Accounts) ทั้ง 5 บทบาทออกจากหน้าจอ ล็อคระบบให้ต้องเข้าสู่ระบบด้วยบัญชีจริงเท่านั้น
   - บังคับการยืนยันตัวตนด้วย Google Workspace ของมหาวิทยาลัยนเรศวร (`@nu.ac.th`)
   - ปรับปรุงข้อความแจ้งเตือนเมื่อเกิดกรณี Popup ถูกปิด หรือโดเมนยังไม่ได้รับอนุญาตใน Firebase Auth
2. **ปรับลด Scope สิทธิ์ Google OAuth ให้กระชับ (`googleAuth.ts`):**
   - ตัดสิทธิ์เข้าถึง Google Drive และ Google Sheets ที่ไม่จำเป็นออก
   - จำกัด Scope เหลือเพียง: `email`, `profile`, `openid` และพารามิเตอร์ `hd: 'nu.ac.th'` เพื่อความรวดเร็วและความปลอดภัยสูงสุดตามมาตรฐาน PDPA
3. **การส่งมอบและ Deploy ผ่าน Cloudflare Pages (GitHub CI/CD):**
   - ตรวจสอบความถูกต้องของซอร์สโค้ดและรัน Production Build สำเร็จ 100%
   - จัดการ Source Control บน Git Repository: `https://github.com/SolarXtr/iram-reward-system` บนสาขา `main`:
     - **Commit `9b5e08c`**: `fix(print): separate Memo 2 and Memo 3 doc numbering in OfficialPrintModal`
     - **Commit `ad1104d`**: `feat(auth & ui): remove demo login, streamline google auth scopes to @nu.ac.th, and update views`
   - ระบบ Cloudflare Pages ตรวจรับ Webhook Trigger จาก GitHub และทำการ Auto-deploy สู่ Production เรียบร้อยสมบูรณ์

---

## 9. การระงับการใช้งานระบบแจ้งเตือน Line OA และ Email ชั่วคราวตามนโยบาย

### วัตถุประสงค์
ตามข้อกำหนดในการบริหารจัดการระบบเงินรางวัล เพื่อความเรียบร้อยและเตรียมความพร้อมในการเปิดใช้งานในระยะเวลาที่เหมาะสม จึงให้ระงับการทำงานของระบบแจ้งเตือนอัตโนมัติผ่าน LINE OA และ Email ไว้ก่อน โดยยังไม่เปิดให้บริการแก่ผู้ใช้งานทั่วไป

### การดำเนินการที่ได้ติดตั้ง
1. **กำหนด Feature Flag ในระบบ (`src/data/lineNotificationService.ts`):**
   - `IS_NOTIFICATION_SYSTEM_SUSPENDED = true`
   - `LINE_NOTIFICATION_SYSTEM_ENABLED = false`
   - `EMAIL_NOTIFICATION_SYSTEM_ENABLED = false`
   - รองรับการกลับมาเปิดใช้งานได้ทันทีในอนาคตด้วยการสลับ Flag เพียงจุดเดียว
2. **ซ่อนเมนูและแถบนำทาง (`src/components/Header.tsx`):**
   - ซ่อนแท็บนำทาง "LINE OA (@414jvrca)" ออกจาก Navigation Bar
   - ปรับ `roleAllowedTabs` ใน `App.tsx` เพื่อไม่ให้สิทธิ์เปิดแท็บดังกล่าว
3. **ตัดการส่ง Auto-Notification ทุกขั้นตอน (`src/App.tsx`):**
   - ระงับฟังก์ชัน `triggerLineMilestoneNotification` ไม่ให้ทำการยิงแจ้งเตือนและไม่แสดง Toast การแจ้งเตือน LINE OA ในทุกๆ Milestone (ยื่นคำขอ, ตรวจเอกสารผ่าน, คณบดีอนุมัติ, โอนเงินสำเร็จ)
   - ระงับฟังก์ชัน `handleSendLineNotification`
   - หากมีการเข้าถึง URL หรือแท็บ `line_oa` โดยตรง ระบบจะแสดงหน้าจอแจ้งเตือนสถานะการระงับการให้บริการชั่วคราวอย่างสุภาพพร้อมปุ่มนำทางกลับหน้าแดชบอร์ด
4. **ปรับปรุงข้อความบนหน้าจอ (`KanbanBoard.tsx`, `DashboardView.tsx`):**
   - นำข้อความ "พร้อมแจ้งเตือนไปยัง LINE OA นักวิจัยอัตโนมัติ" ออกจากหัวกระดาน Kanban
   - นำข้อความ "พร้อมแจ้ง LINE OA" ออกจากคำอธิบายขั้นตอนที่ 9-12 ใน Dashboard
5. **การทดสอบและ Deploy:**
   - ทดสอบรันคำสั่ง `npm run build` ผ่านสมบูรณ์ (1,716 modules, 0 errors)
   - บันทึกการเปลี่ยนแปลงใน Git Commit `c1a5097` และ Push ขึ้นสาขา `main` บน GitHub เพื่อให้ Cloudflare Pages ทำการ Deploy สู่ Production โดยอัตโนมัติ

---

## 10. การติดตั้งระบบติดตามการเบิกจ่ายเงินรางวัลและค่าตีพิมพ์ มหาวิทยาลัยนเรศวร (DRI NU Tracker) บนหน้า Dashboard

### วัตถุประสงค์
ตามเงื่อนไขประกาศมหาวิทยาลัยนเรศวรและประกาศคณะแพทยศาสตร์ 1 บทความวิจัยสามารถขอรับการสนับสนุนทั้งค่าเพจชาร์จและเงินรางวัลได้จากทั้ง 2 แหล่งทุน (ม.นเรศวร และ คณะแพทยศาสตร์) จึงได้พัฒนาส่วนงานติดตามการเบิกจ่ายของ มน. เข้าสู่หน้า Dashboard เพื่อให้ตรวจสอบความคืบหน้าได้ในจุดเดียว

### รายละเอียดการพัฒนาที่ติดตั้ง
1. **โครงสร้างข้อมูล (`types.ts`):**
   - กำหนด Interface `NuDisbursementRecord` รองรับ:
     - `researcherName`: ชื่ออาจารย์นักวิจัย
     - `articleTitle`: ชื่อบทความวิจัย
     - `submissionDate`: วันที่ยื่นคำร้องผ่านระบบ มน.
     - `claimType`: ประเภทการขอรับ (รางวัลการตีพิมพ์ / Page Charge / ทั้งสองอย่าง)
     - `status`: สถานะในระบบ มน. (อยู่ระหว่างการจัดส่งเอกสาร, เข้าระบบ, อนุมัติแล้ว, จ่ายเงินแล้ว, ไม่อนุมัติ)
     - `approvedDate`: วันที่อนุมัติเบิกของ มน.
     - `paymentDate`: วันที่โอนจ่ายเงินของ มน.
     - `rewardAmount`: จำนวนเงินรางวัลส่วนของ มน. (บาท)
     - `pageChargeAmount`: จำนวนค่าเพจชาร์จ/ค่าตีพิมพ์ส่วนของ มน. (บาท)
     - `totalAmount`: ยอดรวมเงินสนับสนุนส่วนของ มน.
     - `matchedFacultyTrackingNo`: เลขคำขอของคณะแพทยฯ ที่ตรงกัน
2. **ข้อมูลตั้งต้น (Initial Seed Data) จาก `ASPxGridView1.xlsx` (`src/data/nuDisbursementData.ts`):**
   - นำเข้า 11 รายการของอาจารย์คณะแพทยศาสตร์ (รศ.พญ.รสสุคนธ์, ผศ.พญ.วัชราภรณ์, รศ.นพ.อาทิตย์, รศ.พญ.ธิติมา, รศ.พญ.สุวรรณี, รศ.พญ.ไกลตา, ผศ.พญ.พันธิตรา) มาเป็นข้อมูลเริ่มต้นในระบบทันที
   - รองรับการบันทึกสถานะลง `localStorage` แบบถาวร
3. **ระบบนำเข้าไฟล์ Excel (`src/services/nuExcelImportService.ts` & `src/components/NuImportModal.tsx`):**
   - ใช้ไลบรารี `xlsx` (SheetJS)
   - รองรับการอัปโหลดไฟล์ `ASPxGridView1.xlsx` ที่ export ออกมาจากระบบบริหารโครงการวิจัย มน.
   - มีระบบค้นหาและจับคู่บทความอัตโนมัติ (Normalized Title Match) กับคำขอของคณะแพทยฯ
   - หน้าจอพรีวิวแสดงรายการก่อนยืนยันการนำเข้า
4. **ฟังก์ชันปรับปรุง/แก้ไขข้อมูล (`src/components/NuEditModal.tsx`):**
   - อนุญาตให้ Admin / Coordinator ปรับปรุง:
     - วันที่อนุมัติ (`approvedDate`) พร้อมปุ่ม "ใส่วันนี้"
     - วันที่จ่ายเงิน (`paymentDate`) พร้อมปุ่ม "ใส่วันนี้"
     - เงินรางวัล มน. (`rewardAmount`) และ ค่าเพจชาร์จ มน. (`pageChargeAmount`) พร้อมคำนวณยอดรวมอัตโนมัติ
     - สถานะของ มน. และหมายเหตุ
5. **ตารางแสดงผลบน Dashboard (`src/components/NuDisbursementTable.tsx`):**
   - **การจำแนกสิทธิ์ (Role Scoping):**
     - **นักวิจัย (Researcher):** มองเห็นเฉพาะรายการผลงานของตนเอง 100%
     - **ผู้ดูแลระบบ / ผู้ประสานงาน (Admin & Coordinator):** มองเห็นของอาจารย์ทุกคนทั้งคณะ
   - กล่องค้นหา (Search) และตัวกรองสถานะ (ยื่น/ส่งเอกสาร, อนุมัติแล้ว, จ่ายเงินแล้ว)
   - แถบสถิติ Quick KPI Cards (จำนวนคำขอ มน. ทั้งหมด, ยื่นแล้ว, อนุมัติแล้ว, โอนเงินสำเร็จแล้ว)
   - Dual-Tracking Badge: แสดงป้ายเชื่อมโยงสถานะคำขอของคณะแพทยศาสตร์ควบคู่กัน
6. **การส่งมอบและ Deploy:**
   - ทดสอบรันคำสั่ง `npm run build` ผ่านสมบูรณ์ (1,722 modules, 0 errors)
   - เริ่มรัน Vite Dev Server สำหรับทดสอบบน Local (`http://localhost:3000/`)
   - บันทึกการเปลี่ยนแปลงใน Git Commit `1a7d32a` และ Push ขึ้นสาขา `main` บน GitHub (`SolarXtr/iram-reward-system`) เพื่อให้ Cloudflare Pages ทำการ Deploy สู่ Production อัตโนมัติเรียบร้อยแล้ว






---

## 11. การปรับปรุงสิทธิ์การเข้าถึง DRI NU Tracker สำหรับผู้บริหารและเจ้าหน้าที่การเงิน (v1.3.2)

### วัตถุประสงค์
เพื่อให้ **ผู้บริหาร (Executive)** และ **เจ้าหน้าที่การเงิน (Finance)** สามารถติดตามภาพรวมการเบิกจ่ายเงินรางวัลและค่าเพจชาร์จจากกองการวิจัยและนวัตกรรม (ม.นเรศวร) ของอาจารย์และนักวิจัยทั้งหมดในคณะแพทยศาสตร์ได้ เพื่อประโยชน์ในการวางแผนงบประมาณ การตรวจสอบ และการกำกับดูแล แต่ต้องไม่มีสิทธิ์แก้ไขข้อมูลหรือนำเข้าไฟล์ Excel เพื่อความปลอดภัยของข้อมูล

### รายละเอียดการกำหนดสิทธิ์ (Permission Matrix)
| สิทธิ์ / ฟังก์ชัน | นักวิจัย (Researcher) | ผู้บริหาร (Executive) | เจ้าหน้าที่การเงิน (Finance) | ผู้ดูแลระบบ / จนท.วิจัย (Admin / Coordinator) |
|---|:---:|:---:|:---:|:---:|
| **ขอบเขตการมองเห็นข้อมูล** | เฉพาะผลงานของตนเอง | **เห็นของทั้งคณะ (Full Faculty View)** | **เห็นของทั้งคณะ (Full Faculty View)** | เห็นของทั้งคณะ (Full Faculty View) |
| **ปุ่มนำเข้าไฟล์ Excel** | ❌ ซ่อน | ❌ ซ่อน | ❌ ซ่อน | ✅ แสดง / ใช้งานได้ |
| **ปุ่มแก้ไขข้อมูล (✏️)** | ❌ ซ่อน | ❌ ซ่อน | ❌ ซ่อน | ✅ แสดง / ใช้งานได้ |
| **ป้ายกำกับโหมด (Mode Badge)** | — | 🔒 โหมดตรวจสอบข้อมูลภาพรวม (อ่านอย่างเดียว) | 🔒 โหมดตรวจสอบข้อมูลภาพรวม (อ่านอย่างเดียว) | ✏️ โหมดจัดการข้อมูล (Admin/Coordinator) |

### การดำเนินการที่ได้ติดตั้ง
1. **ปรับปรุง Logic ใน `src/components/NuDisbursementTable.tsx`:**
   - แยกเงื่อนไขการมองเห็นข้อมูล (`canViewAll`):
     ```typescript
     const canViewAll = ['admin', 'coordinator', 'executive', 'finance'].includes(currentRole);
     ```
   - แยกเงื่อนไขการแก้ไขข้อมูล (`canEdit`):
     ```typescript
     const canEdit = ['admin', 'coordinator'].includes(currentRole);
     ```
   - ซ่อนปุ่ม "นำเข้า Excel" และคอลัมน์ปุ่มดินสอแก้ไข (✏️) เมื่อไม่ใช่ Admin/Coordinator
   - เพิ่มป้าย Badge สีฟ้าชัดเจน: `🔒 โหมดตรวจสอบข้อมูลภาพรวม (อ่านอย่างเดียว)` บริเวณหัวตารางสำหรับบทบาท Executive และ Finance
2. **การส่งมอบและ Deploy:**
   - บันทึกการเปลี่ยนแปลงใน Git Commit `2f1fbe8`: `feat(nu-tracker): grant read-only access for executive and finance roles to DRI NU Tracker`
   - Push ขึ้นสาขา `main` บน GitHub (`https://github.com/SolarXtr/iram-reward-system.git`) เรียบร้อยสมบูรณ์ พร้อมให้ Cloudflare Pages ทำการ Deploy สู่ Production โดยอัตโนมัติ
