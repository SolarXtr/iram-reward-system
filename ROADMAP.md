# แผนงานและการพัฒนา (Roadmap & Development Plan) — iRAM Ecosystem

เอกสารสรุปแผนงานการพัฒนาระบบนิเวศสารสนเทศงานวิจัย (iRAM Ecosystem) คณะแพทยศาสตร์ มหาวิทยาลัยนเรศวร

---

## 🗺️ แผนการดำเนินงาน (Roadmap Overview)

```mermaid
flowchart TD
    subgraph P1["Phase 1: Core System & Evaluation Engine (ส.ค. - ก.ย. 2569) ✅ เสร็จสมบูรณ์"]
        P1_1["ระบบประเมินเกณฑ์และฟอร์มยื่นคำขอ"]
        P1_2["คำนวณเงินค่าตีพิมพ์ 70,000 บ. และรางวัล Quartile"]
        P1_3["Deploy ระบบบน Cloudflare Pages"]
    end

    subgraph P2["Phase 2: Doc Engine, RBAC & Security (ก.ย. 2569) ✅ เสร็จสมบูรณ์"]
        P2_1["ระบบสร้างเอกสารราชการ 5 ชุด (Word .docx & PDF)"]
        P2_2["ระบบกำหนดสิทธิ์และหน้าจอ 5 บทบาท (RBAC)"]
        P2_3["Admin User Management Console & PDPA Security"]
        P2_4["ระบบคัดกรอง NU Account (@nu.ac.th) & Public Dashboard"]
    end

    subgraph P3["Phase 3: Integration, Data Pipeline & API Sync (ต.ค. - ธ.ค. 2569) 🔄 ระยะถัดไป"]
        P3_1["Cloudflare D1 Database & Worker Backend"]
        P3_2["Scopus Automation Fetcher & DOI Import"]
        P3_3["Researcher Profile Sync (ตำแหน่ง, Scopus ID)"]
        P3_4["ระบบยืนยันตัวตนและการลงนามดิจิทัล (E-Signature)"]
    end

    P1 --> P2 --> P3
```

---

## 📌 รายละเอียดแต่ละระยะ (Phases)

### ✅ Phase 1: Core System & Evaluation Engine (เสร็จสมบูรณ์ v1.0.0)
- [x] **Online Gatekeeper:** ตรวจสอบคุณสมบัติผู้ยื่นคำขอตามเกณฑ์และประกาศคณะ/มหาวิทยาลัย
- [x] **Smart Calculation:** คำนวณเงินค่าตีพิมพ์ (Page Charge ไม่เกิน 70,000 บาท) และเงินรางวัลตามระดับ Quartile
- [x] **Department & Saraban Auto-fill:** ดึงสังกัดและรหัสหนังสือราชการอัตโนมัติ
- [x] **Responsive UI & Cloudflare Deployment:** รองรับการใช้งานผ่าน Web Browser บน [https://iram-reward-system.pages.dev](https://iram-reward-system.pages.dev)

### ✅ Phase 2: Official Document Generation Engine (เสร็จสมบูรณ์ v1.0.0)
- [x] **Checklist (แบบตรวจสอบหลักฐาน):** แสดงรายการเอกสารแนบและเงื่อนไขอัตโนมัติ
- [x] **บันทึกข้อความขออนุมัติเงินรางวัล:** ปรับระยะบรรทัด 1.0 จัดหน้ากระดาษแบบราชการไทย (TH Sarabun PSK)
- [x] **บันทึกข้อความขออนุมัติเบิกเงินค่าตอบแทนและค่าใช้จ่าย:** จัดระเบียบข้อความ ชิดขอบและไม่ถ่างตัวอักษร
- [x] **ใบสำคัญรับเงิน (Receipt Voucher):** ตารางแนวตั้งยาวตลอด เว้นระยะ Padding สวยงาม ไม่มีสัญลักษณ์ ฿
- [x] **ใบรับรองการจ่ายเงิน (ข้อ 46):** เว้นระยะขอบขวาของตาราง 1-2 เคาะ จัดขอบเสมอแบบ Justified โดยไม่ถ่างตัวอักษร
- [x] **Dynamic Rows:** ปรับแถวตารางว่างให้พอดีใน 1 หน้ากระดาษ A4 ไม่ล้นเกิน

### ✅ Phase 2.5: User Roles, RBAC & Admin Console (เสร็จสมบูรณ์ v1.1.0)
- [x] **5 Distinct User Roles:** รองรับบทบาทนักวิจัย (Researcher), จนท.วิจัย (Coordinator), งานการเงิน (Finance), ผู้บริหาร (Executive), และผู้ดูแลระบบ (Admin)
- [x] **Role-Based Header & Navigation Cleanup:** จัดระเบียบหน้าจอตามบทบาท ซ่อนเมนูและเครื่องมือที่ไม่เกี่ยวข้อง เช่น Kanban/LINE OA/Admin Console ให้เห็นเฉพาะผู้มีสิทธิ์
- [x] **User Management Console:** ทะเบียนผู้ใช้งานรวมศูนย์ ค้นหา กรองบทบาท/ภาควิชา และ Quick Role Switcher
- [x] **PDPA Security Gate & Sensitive Data Masking:** ล็อกหน้าจอ Admin ด้วยรหัสผ่านความปลอดภัย และระบบซ่อนเลขบัญชี/บัตรประชาชน
- [x] **Route Guard:** ป้องกันหน้าจอค้างข้ามบทบาท สลับกลับสู่แดชบอร์ดอัตโนมัติเมื่อเปลี่ยนสิทธิ์

### ✅ Phase 2.6: NU Account Gatekeeper & Public vs Private Dashboard (เสร็จสมบูรณ์ v1.2.0)
- [x] **Zero Information Leakage:** ซ่อนรายชื่ออาจารย์ ตารางคำขอ ยอดเงินส่วนบุคคล และเลข AWP 100% สำหรับผู้เยี่ยมชมทั่วไป (Guest Mode)
- [x] **Public Header & Dashboard:** แสดงเฉพาะสถิติภาพรวม Quartile, สรุปยอดเงินรวมทั้งคณะ, และประกาศมหาวิทยาลัยนเรศวร พ.ศ. 2567
- [x] **NU Google Workspace Integration:** ตรวจสอบอีเมลโดเมน `@nu.ac.th` พร้อม Auto-provisioning สร้างสิทธิ์นักวิจัยให้อัตโนมัติเมื่อเข้าสู่ระบบครั้งแรก
- [x] **Quick Demo Switcher:** อำนวยความสะดวกในการตรวจประเมินระบบ สามารถสลับเข้าใช้งาน 5 บทบาทได้ทันที
- [x] **Secure Session & Logout:** จัดการสถานะการเข้าสู่ระบบอย่างปลอดภัย และมีปุ่มออกจากระบบ (Logout) คืนสู่ Guest Mode ทันที

### ✅ Phase 2.7: Cloudflare D1 Unified Users & Profile Sync (เสร็จสมบูรณ์ v1.3.0)
- [x] **Single Source of Truth (`irUser`):** ขยายโครงสร้างตาราง `irUser` ใน Cloudflare D1 (`iram-db`) รองรับข้อมูลการเงิน, เลขบัญชี, บัตรประชาชน, ตำแหน่งทางวิชาการและบริหาร
- [x] **Cross-Device Profile Sync:** นักวิจัยหรือเจ้าหน้าที่อัปเดตข้อมูลตนเองจากเครื่องใด ระบบจะบันทึกขึ้น Cloudflare D1 ทันที ทำให้ข้อมูลซิงก์กันทุกอุปกรณ์แบบ Real-time
- [x] **Unified User Directory:** เชื่อมโยงหน้าต่างโปรไฟล์ (`UserProfileModal`) และศูนย์จัดการผู้ใช้ (`UserManagementView`) ให้ดึงข้อมูลชุดเดียวกัน 12 บัญชีหลักตรงกัน 100%
- [x] **Cloudflare Worker API:** พัฒนาและ Deploy User Endpoints (`/api/users`, `/api/users/profile/:email`, `/api/users/profile/:id`) บน Cloudflare Worker
- [x] **Offline-First Resilience:** ระบบมีกลไก LocalStorage Fallback หากการเชื่อมต่ออินเทอร์เน็ตมีปัญหา หน้าเว็บยังคงทำงานได้ต่อเนื่อง

### 🔄 Phase 3: Integration, Data Pipeline & API Sync (ระยะถัดไป)
- [x] **Backend Database (Cloudflare D1 & Worker):** เชื่อมต่อฐานข้อมูล `iram-db` และ Worker API สำหรับบันทึกคำขอรับทุนและผู้ใช้งาน
- [ ] **Scopus Automation Fetcher:** เชื่อมต่อระบบดึงข้อมูลผลงานตีพิมพ์จาก Scopus อัตโนมัติด้วย DOI
- [ ] **E-Signature & Tracking:** ระบบลงนามอิเล็กทรอนิกส์และติดตามสถานะการเบิกจ่าย

---

## 💾 ข้อมูลการแบคอัพ (Backup Metadata)
- **Tag:** `v1.3.0`
- **Release Date:** 29 กันยายน 2569
- **Repository Backend:** `https://github.com/SolarXtr/iram-backend.git`
- **Repository Frontend:** `https://github.com/SolarXtr/iram-reward-system.git`
- **Production URL:** `https://iram-reward-system.pages.dev`

