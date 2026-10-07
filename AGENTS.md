# iRAM Project Agent Guidelines

This workspace uses a multi-agent architecture to manage the iRAM (Internal Research Award Management) platform. 
To prevent system overload and maintain clear boundaries, tasks MUST be delegated to the following specialized subagents when applicable.

## Defined Subagents

The following subagents have been defined and are available via the `invoke_subagent` tool:

### 1. `data_engineer`
- **Scope**: `iram-scopus/` directory (specifically Python and JSON data files)
- **Role**: Python Data Engineer
- **Responsibilities**: Web scraping, API ingestion (Scopus, PubMed, ORCID), data cleaning, deduplication (`fetch_data.py`), and pushing payload to the backend API.

### 2. `backend_engineer`
- **Scope**: `iram-backend/` directory
- **Role**: Backend API Engineer
- **Responsibilities**: Cloudflare Workers (Hono.js), Cloudflare D1 Database schema (`index.ts`), handling API endpoints, and Cloudflare deployments via Wrangler.

### 3. `frontend_engineer`
- **Scope**: `iram-services/`, `iram-scopus/` (HTML/JS files), `citation-report/`, `iram-ecosystem/`, and `iram-experience/` directories.
- **Role**: Frontend Developer
- **Responsibilities**: UI/UX design, Next.js React components (for `iram-services`), DOM manipulation and styling (for standard HTML projects), rendering data, and Cloudflare Pages deployments.
- **Rules**: 
  - For `iram-services`, data MUST be fetched via API from `iram-backend`. Direct D1 database connections from the client side are strictly PROHIBITED.
  - Deployments for Next.js apps (`iram-services`) should be configured using `@cloudflare/next-on-pages`. Ensure strict version control (Git Commits) before any deployment.

## General Rules
1. Do not mix frontend, backend, and data processing tasks in a single conversation. If a user requests a full-stack feature, the Manager agent (you) should plan the feature and delegate the specific components to the appropriate subagents using `invoke_subagent`.
2. Communicate with subagents via `send_message`.
3. All database migrations or table schema alterations MUST be performed by the `backend_engineer`.

- Export Output Rule: All files exported by the agent team MUST be saved in D:\.gemini\antigravity\scratch\ and their filenames MUST include the prefix/suffix indicating they were sent from agents and iRAM (e.g., file_name_agents_iRAM_convID.ext).


--------------------------------------------------------------------------------

# ข้อกำหนดความมั่นคงปลอดภัยและการคุ้มครองข้อมูลส่วนบุคคล (Mandatory Security & Compliance Standard)
### สำหรับ Agent ทุกตัวในระบบ iRAM Ecosystem (Manager, Frontend, Backend, Data Engineer, Research, ฯลฯ)

อ้างอิง:
1. **ประกาศมหาวิทยาลัยนเรศวร เรื่อง นโยบายการพัฒนา Web Application และ Mobile Application ของมหาวิทยาลัยนเรศวร ตามมาตรฐาน OWASP Top 10** (ประกาศ ณ วันที่ 1 ธันวาคม พ.ศ. 2568)
2. **พระราชบัญญัติการรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (มาตรา 43, 44)**
3. **พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)**
4. **ประกาศคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ (กมช.) พ.ศ. 2566** (ระบบที่มีข้อมูลส่วนบุคคลต้องกำหนดระดับผลกระทบด้านการรักษาความลับ "ระดับกลาง" เป็นอย่างน้อย)

Agent ทุกตัวที่พัฒนา, แก้ไข, ออกแบบ หรือตรวจสอบ Web Application, Mobile Application, API Service และ Database ในระบบ iRAM ต้องปฏิบัติตามมาตรฐาน OWASP Top 10:2021 และ PDPA ดังต่อไปนี้อย่างเคร่งครัด:

## 1. A01: Broken Access Control (การควบคุมสิทธิ์การเข้าถึง)
- บังคับใช้หลัก **Least Privilege** และ **Role-Based Access Control (RBAC)** อย่างเคร่งครัด
- ทุก API Endpoint ต้องมี **Server-side Authorization Check** (ห้ามพึ่งพาการซ่อนปุ่มบน UI เพียงอย่างเดียว)
- ป้องกัน **Insecure Direct Object Reference (IDOR)** โดยตรวจสอบสิทธิ์ความเป็นเจ้าของข้อมูลก่อนประมวลผลคำขอเสมอ
- แบ่งแยกโหมดการแสดงผลระหว่าง **Guest View (Zero Information Leakage)** กับ **Authenticated Role View**
- ข้อมูลคำขอ ยอดเงิน และรายชื่ออาจารย์ต้องไม่รั่วไหลไปยังบุคคลภายนอกหรือผู้ใช้ที่ไม่มีสิทธิ์

## 2. A02: Cryptographic Failures (ความล้มเหลวด้านการเข้ารหัสลับ)
- บังคับใช้การสื่อสารที่เข้ารหัส **HTTPS (TLS 1.2 / 1.3)** ตลอดเส้นทาง
- ห้ามจัดเก็บรหัสผ่านหรือ Credentials เป็น Plaintext โดยเด็ดขาด
- ข้อมูลส่วนบุคคลอ่อนไหว (เช่น เลขประจำตัวประชาชน 13 หลัก, เลขบัญชีธนาคาร) ต้องทำ **Data Masking** บนหน้าจอ (เช่น `XXXXXXXXXX123`) และจัดเก็บอย่างปลอดภัย
- ห้ามส่งข้อมูลความลับ ข้อมูลส่วนบุคคล หรือ Session Token ผ่าน URL Query Parameters

## 3. A03: Injection (การป้องกันคำสั่งไม่พึงประสงค์)
- การสืบค้นฐานข้อมูล (SQL / Cloudflare D1) ต้องใช้ **Parameterized Queries / Prepared Statements (`db.prepare().bind()`) 100%** ห้ามนำ Input จากผู้ใช้มา Concatenate หรือต่อ String ในคำสั่ง SQL โดยเด็ดขาด
- ตรวจสอบและกรองข้อมูลนำเข้า (Input Validation & Sanitization) ก่อนนำไปประมวลผล
- ป้องกัน Cross-Site Scripting (XSS) โดยใช้ Framework ที่ Escape Output อัตโนมัติ (เช่น React JSX) และหลีกเลี่ยงการใช้ `dangerouslySetInnerHTML` โดยไม่ผ่านตัวกรอง

## 4. A04: Insecure Design (การออกแบบที่มั่นคงปลอดภัย)
- ยึดหลัก **Secure by Design** ตั้งแต่ขั้นตอนการวิเคราะห์ความต้องการ (Requirement Analysis)
- จัดทำ Threat Modeling และวางมาตรการควบคุมความปลอดภัยเชิงป้องกันไว้ล่วงหน้า
- แบ่งแยกหน้าที่ทางธุรกิจ (Segregation of Duties) เช่น แยกบทบาทผู้ยื่นคำขอ, ผู้ตรวจสอบเอกสาร, ผู้บริหารอนุมัติ และเจ้าหน้าที่การเงินตัดจ่ายเงิน

## 5. A05: Security Misconfiguration (การกำหนดค่าระบบให้มั่นคงปลอดภัย)
- ปิด Debug Mode, Default Configuration, Test Accounts และ Stack Traces ในการ Build สำหรับ Production
- ติดตั้ง Security Headers ที่จำเป็น (เช่น Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options)
- ห้าม Hardcode หรือ Commit Secrets, API Keys หรือ Private Credentials ลงใน Version Control (ให้ใช้ Environment Variables / Cloudflare Secrets เสมอ)

## 6. A06: Vulnerable and Outdated Components (ส่วนประกอบที่มีช่องโหว่และล้าสมัย)
- ติดตามและอัปเดตเวอร์ชันของ Library, Framework และ Dependencies อย่างสม่ำเสมอ
- ตรวจสอบช่องโหว่ซอฟต์แวร์ด้วยเครื่องมือสแกน (เช่น `npm audit`) และแก้ไขทันทีเมื่อพบความเสี่ยง (Zero High/Critical Vulnerabilities)
- จัดทำและควบคุมรายการทรัพยากรซอฟต์แวร์ (Software Inventory ผ่าน `package.json` และ `package-lock.json`)

## 7. A07: Identification and Authentication Failures (การพิสูจน์และยืนยันตัวตน)
- บังคับใช้ระบบพิสูจน์ตัวตนที่รัดกุมผ่านระบบกลางของมหาวิทยาลัย **Google Workspace (@nu.ac.th)** ซึ่งรองรับ Multi-Factor Authentication (MFA)
- ตัดระบบ Demo Login ออกจากระบบจริง (Production) เสมอ
- กำหนดอายุการใช้งานของ Session (Session Timeout) อย่างเหมาะสม
- ป้องกัน Session Hijacking และเมื่อผู้ใช้กด Logout ต้องล้าง Session Token และ Cache ออกทันที

## 8. A08: Software and Data Integrity Failures (ความสมบูรณ์ของซอฟต์แวร์และข้อมูล)
- พัฒนาซอฟต์แวร์ผ่านกระบวนการ Source Control (Git) ที่มีการตรวจสอบความเปลี่ยนแปลง
- มีกระบวนการ CI/CD ที่ปลอดภัยและตรวจสอบย้อนหลังได้ (เช่น Cloudflare Pages / Workers Deployment)
- ข้อมูลและไฟล์ที่นำเข้าจากภายนอก (เช่น Excel `.xlsx`) ต้องผ่านการตรวจสอบความถูกต้องของโครงสร้าง (Schema Validation) ก่อนนำเข้าสู่ฐานข้อมูล

## 9. A09: Security Logging and Monitoring Failures (การบันทึกและตรวจสอบเหตุการณ์)
- จัดให้มีระบบบันทึก Audit Logs สำหรับเหตุการณ์สำคัญด้านความปลอดภัย (การเข้าสู่ระบบ, การสลับสิทธิ์, การอนุมัติเงิน, การโอนเงิน, และการแก้ไขข้อมูลโปรไฟล์)
- จัดเก็บประวัติการแก้ไขข้อมูล (Audit Trail เช่น `irResearcherProfileHistory`) ย้อนหลังอย่างเหมาะสม
- มีระบบ Monitoring และ Alert เพื่อให้ตรวจจับและตอบสนองต่อเหตุการณ์ผิดปกติได้อย่างทันท่วงที

## 10. A10: Server-Side Request Forgery (SSRF)
- การส่งคำขอ HTTP ออกจากฝั่งเซิร์ฟเวอร์ (Server-side Fetch) ต้องจำกัดเฉพาะ **Allowlist ของ URL ปลายทางที่อนุญาต** (เช่น Scopus API, Crossref API, Google OAuth APIs)
- ห้ามรับ URL จากผู้ใช้ไปเรียกใช้งานภายนอกโดยไม่มีการกรอง
- ห้ามส่งคำขอไปยังระบบภายใน เครือข่าย Private IP (เช่น `127.0.0.1`, `localhost`, `10.x.x.x`, `192.168.x.x`) หรือ Cloud Metadata Endpoints

## 11. การรับรองผลตามแบบฟอร์มทางการของมหาวิทยาลัยนเรศวร
ทุกระบบที่พัฒนาขึ้นใหม่หรือมีการปรับปรุงใหญ่ ต้องสามารถจัดทำรายงานตาม **"แบบฟอร์มการตรวจสอบรายการดำเนินงานพัฒนา Web Application และ Mobile Application ของมหาวิทยาลัยนเรศวร ตามมาตรฐาน OWASP Top 10"** เพื่อให้ผู้พัฒนาซอฟต์แวร์, ผู้รับรองแบบฟอร์ม, ผู้ดูแลระบบประจำหน่วยงาน และผู้บริหารหน่วยงานลงนามรับทราบได้อย่างถูกต้องสมบูรณ์
