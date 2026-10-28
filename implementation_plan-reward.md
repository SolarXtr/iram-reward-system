# 🔍 Gap Analysis: โค้ดจริง vs. sitemap_and_crud_matrix.md
## ระบบเบิกเงินรางวัล iRAM — วิเคราะห์ความสอดคล้องสิทธิ์ CRUD ตาราง 3 ส่วนหลัก

> **วิธีการวิเคราะห์:** เปรียบเทียบ CRUD Matrix ใน [sitemap_and_crud_matrix.md](file:///C:/Users/tinnakornh/.gemini/antigravity/brain/b31db261-266f-44a9-bf40-fb1f964ad43b/sitemap_and_crud_matrix.md) (ข้อกำหนด) กับโค้ดจริงใน 3 component หลัก เพื่อค้นหา Gap ที่ยังพัฒนาไม่ตรงตามสเปค

---

## ส่วนที่ 1 — P-05: Table View (`TableView.tsx`)

### 📋 สเปค CRUD จาก sitemap (ตารางที่ 1, P-05)

| ฟังก์ชัน | Researcher | Coordinator | Finance | Executive | Admin |
|---|---|---|---|---|---|
| ดูตารางคำขอหลัก | **R-Own** | **R-All** | **R-All** | **R-All** | **R-All** |
| แก้ไขในตาราง (Inline Edit) | ❌ | **U-Role** (ข้อมูลวิจัย/เลขรับ) | **U-Role** (เลขฎีกา/วันโอน) | ❌ | **U-All** |
| ส่งคืนคำขอย้อนกลับเตรียมเบิก | **Ret-Own** | **Ret-All** | ❌ | ❌ | **Ret-All** |
| ซ่อน/เปิดเผยข้อมูล PDPA | **U-Mask** | **U-Mask** | **U-Mask** | **U-Mask** | **U-Mask** |
| ส่งออก Excel | **R-Own** | **R-All** | **R-All** | **R-All** | **R-All** |

### 🔎 สถานะโค้ดจริง

| ฟังก์ชัน | สถานะ | รายละเอียด Gap |
|---|---|---|
| ดูตารางคำขอ | ✅ ตรงสเปค | researcher เห็นเฉพาะของตัวเอง (line 124-128), staff เห็นทั้งหมด |
| **Inline Edit — researcher** | ❌ **ไม่ตรงสเปค** | โค้ดปัจจุบัน (line 598): `(canAnyEdit \|\| (researcher && draft))` → researcher ไม่ควรมี Edit เลย ตาม sitemap ระบุ `-` (ไม่มีสิทธิ์) แต่โค้ดยังมีเงื่อนไขเปิดช่องให้ researcher กดได้เมื่อ status === 'draft' ซึ่งใน TableView ไม่มี draft อยู่แล้ว แต่เป็นเงื่อนไขที่ซ้ำซ้อนและสับสน |
| **Inline Edit — finance** | ⚠️ **บางส่วน** | finance มีสิทธิ์ตาม `canEditFinance` (line 54) แก้ได้เฉพาะ Col 8 (บัญชี/ฎีกา) ✅ แต่เห็น **ปุ่ม Edit ทั้งแถว** → กด Edit แล้วเห็น field อื่นเป็น read-only มี lock icon แต่ยังสับสน UX |
| **ส่งคืน (Ret-Own/Ret-All)** | ❌ **ไม่ตรงสเปค** | โค้ดปัจจุบัน (line 623-626): `(admin \|\| coordinator \|\| (researcher && isMyApp)) && status !== draft && status !== paid` → **ขาดการจำกัดว่า researcher ส่งคืนได้เฉพาะสถานะ submitted** และ **finance/executive ไม่ควรส่งคืนได้** แต่โค้ดใช้ `isMyApp` ซึ่งยังสามารถผ่านได้ถ้า finance เป็นเจ้าของ |
| ซ่อน/เปิด PDPA Mask | ✅ ตรงสเปค | ทุก role เห็นปุ่ม toggle (line 304) |
| ส่งออก CSV | ⚠️ **บางส่วน** | Export CSV มีให้ทุก role ✅ แต่ไม่ได้ filter เฉพาะข้อมูลของ researcher เอง — researcher ควรได้เฉพาะข้อมูลของตัวเอง |
| **การเรียงลำดับ** | ❌ **ขาดหายใน sitemap และโค้ด** | sitemap ระบุ "เรียงลำดับวันที่ส่งล่าสุด" แต่ **ไม่มี .sort() ใน `filteredApps`** ทั้งสิ้น |

### 📌 สรุป Gap P-05 (Table View)

```
❌ GAP 1: ไม่มีการเรียงวันที่ส่งล่าสุดก่อน (updatedAt DESC)
❌ GAP 2: เงื่อนไข Return-to-Draft ไม่จำกัดสถานะให้ researcher (ควรเฉพาะ 'submitted')
❌ GAP 3: finance/executive ไม่ควรเห็นปุ่ม Return เลย แต่โค้ดอาจเปิดช่องผ่าน isMyApp
⚠️ GAP 4: ปุ่ม Edit ทั้งแถวสำหรับ finance สับสน UX — ควรแยกเป็น inline direct edit ที่ Col บัญชี/ฎีกา
⚠️ GAP 5: Export CSV ของ researcher ควร scope เฉพาะข้อมูลของตัวเอง
```

---

## ส่วนที่ 2 — P-02: Quota Planner (`QuotaPlannerView.tsx`)

### 📋 สเปค CRUD จาก sitemap (ตารางที่ 1, P-02)

| ฟังก์ชัน | Researcher | Coordinator | Finance | Executive | Admin |
|---|---|---|---|---|---|
| ดูรายการเตรียมเบิก (Draft) | **R-Own** | **R-All** | ❌ | ❌ | **R-All** |
| สร้างรายการใหม่ | **C** | **C** | ❌ | ❌ | **C** |
| แก้ไขรายการเตรียมเบิก | **U-Own** | **U-All** | ❌ | ❌ | **U-All** |
| ลบรายการเตรียมเบิก | **D-Own** | **D-All** | ❌ | ❌ | **D-All** |
| ส่งเบิกคำขอ (Submit Draft) | **U-Own** | **U-All** | ❌ | ❌ | **U-All** |
| เลื่อนปีงบประมาณ (Carry Over) | **U-Own** | **U-All** | ❌ | ❌ | **U-All** |

### 🔎 สถานะโค้ดจริง

| ฟังก์ชัน | สถานะ | รายละเอียด |
|---|---|---|
| ดูรายการ Draft — Researcher | ✅ ตรงสเปค | `currentRole === 'researcher'` → `isMyApplication(a)` เท่านั้น (line 127-128) |
| ดูรายการ Draft — Coordinator/Admin | ✅ ตรงสเปค | `isStaffOrAdmin && draftScopeFilter === 'all'` มี toggle แสดงทั้งหมด (line 130) |
| **Finance/Executive เข้าถึง Quota Planner** | ⚠️ **ไม่มี Guard** | sitemap ระบุ finance และ executive **ไม่มีสิทธิ์** แต่โค้ดและ `App.tsx` ไม่มีการซ่อน Tab นี้สำหรับ finance/executive |
| แก้ไข/ส่ง/ลบ Draft | ✅ ตรงสเปค | `canEditThisDraft = isStaffOrAdmin \|\| isMyApplication(draft)` (line 720) ถูกต้อง |
| Carry Over | ✅ ตรงสเปค | ใช้ `canEditThisDraft` เช่นกัน |
| **การเรียงลำดับ 24 เดือน** | ✅ ถูกต้อง | เรียงตาม `publishedDate ASC` (เก่าสุดก่อน = ใกล้หมดอายุก่อน) ตรงตามเจตนา |
| Badge "ส่งคืนจากคำขอ" | ✅ มีอยู่แล้ว | แสดงเมื่อ `trackingNo !== 'DRAFT'` (line 627-634) — **ครบถ้วนแล้ว** |
| ข้อมูลนักวิจัยเมื่อ Staff ดูทั้งหมด | ✅ มีอยู่แล้ว | แสดง inline ในคอลัมน์บทความ (line 637-644) — ครบถ้วนแล้ว |

### 📌 สรุป Gap P-02 (Quota Planner)

```
⚠️ GAP 6: ไม่มี Guard ซ่อน Tab P-02 สำหรับ finance และ executive
           → ตาม sitemap finance และ executive ไม่มีสิทธิ์เข้าหน้า Quota Planner
           → แต่ในความเป็นจริง อาจให้เข้าได้แบบ Read-Only (ดูวงเงิน/ภาพรวม)
           → ต้องตัดสินใจ: ซ่อน Tab ทั้งหมด หรือ แสดงแบบ Read-Only?
✅ อื่นๆ ตรงสเปคแล้ว
```

> [!IMPORTANT]
> **ต้องตัดสินใจ:** Finance และ Executive ควรเข้าหน้าเตรียมเบิกได้หรือไม่?
> - ตาม sitemap เดิม → **ไม่ควรเข้า** (ซ่อน Tab)
> - ในทางปฏิบัติ → executive อาจต้องการดูวงเงินและสถิติ, finance ต้องดูยอดที่รอเบิก

---

## ส่วนที่ 3 — P-03/DRI: NuDisbursementTable (`NuDisbursementTable.tsx`)

### 📋 สเปค CRUD จาก sitemap (ตารางที่ 1, P-03)

| ฟังก์ชัน | Researcher | Coordinator | Finance | Executive | Admin |
|---|---|---|---|---|---|
| ดูตารางบทความรวม 3 หมวด | **R-Own** | **R-All** | **R-All** | **R-All** | **R-All** |
| เพิ่มรายการประวัติเบิก มน. | ❌ | **C** | ❌ | ❌ | **C** |
| แก้ไขสถานะ มน. และ คณะฯ | ❌ | ❌ | ❌ | ❌ | **U-All** |
| ส่งออกข้อมูลเป็น Excel | **R-Own** | **R-All** | **R-All** | **R-All** | **R-All** |

### 🔎 สถานะโค้ดจริง

| ฟังก์ชัน | สถานะ | รายละเอียด Gap |
|---|---|---|
| ดูรายการ — Researcher | ✅ ตรงสเปค | `scopedRecords` filter ด้วยชื่อ (line 80-85) |
| ดูรายการ — Staff | ✅ ตรงสเปค | `canViewAll = ['admin','coordinator','executive','finance']` (line 66) |
| **Import Excel (เพิ่มรายการ มน.)** | ❌ **ไม่ตรงสเปค** | `canEdit = currentRole === 'admin'` (line 69) → **admin เท่านั้น** แต่สเปคกำหนด `coordinator` ควรมีสิทธิ์ C ด้วย |
| **แก้ไขรายการ (Edit Modal)** | ⚠️ **ตรงสเปค แต่ควรทบทวน** | `canEdit = admin only` ✅ ตรงสเปค P-03 แต่ sitemap ยัง reference ไปที่ **M-05: Article Master Edit** ซึ่งระบุ admin only เช่นกัน ✅ |
| **ส่งออก Excel** | ❌ **ขาดหายในโค้ด** | ไม่มีปุ่ม Export CSV/Excel ใน `NuDisbursementTable.tsx` เลย แต่สเปคระบุว่าทุก role ที่มีสิทธิ์ดู ควรส่งออกได้ |
| **การเรียงลำดับ** | ✅ ถูกต้อง | มี Interactive Sort พร้อม icon (line 50-62) และ default `submissionDate DESC` |

### 📌 สรุป Gap P-03 (DRI Tracking)

```
❌ GAP 7: coordinator ไม่สามารถ Import Excel ได้ แต่สเปค P-03 กำหนดว่า coordinator มีสิทธิ์ C
❌ GAP 8: ไม่มีปุ่ม Export CSV/Excel ใน NuDisbursementTable
⚠️ GAP 9: ยังไม่มีปุ่มเปิดเอกสารคณะฯ (onOpenFacultyDoc) ที่ทำงานได้จริงเมื่อ matchedFacultyTrackingNo ตรง
```

---

## ส่วนที่ 4 — M-02: Timeline Tracker Modal

### 📋 สเปค CRUD จาก sitemap (ตารางที่ 2, M-02)

| ฟังก์ชัน | Researcher | Coordinator | Finance | Executive | Admin |
|---|---|---|---|---|---|
| ส่งคืนไปรายการเตรียมเบิก (`↩️`) | **Ret-Own** | **Ret-All** | ❌ | ❌ | **Ret-All** |
| กดยืนยันผ่านขั้นตอน | **Adv-Role** (1,3) | **Adv-Role** (2,4,6,9) | **Adv-Role** (5,10,11) | **Adv-Role** (7,8) | **Adv-All** |

> [!NOTE]
> M-02 Timeline Modal มีสิทธิ์ Return แยกต่างหากจาก P-05 Table View — ควรใช้ logic เดียวกันเพื่อความสม่ำเสมอ

---

## สรุป Gap Analysis ทั้งหมด (Gap Registry)

| # | ระดับ | Component | Gap ที่พบ | สิ่งที่ควรเป็น (ตามสเปค) | สิ่งที่เป็นอยู่ในโค้ด |
|---|---|---|---|---|---|
| G-01 | 🔴 High | `TableView.tsx` | ไม่มีการเรียงลำดับ | วันที่ส่งล่าสุดก่อน (`updatedAt DESC`) | ไม่มี `.sort()` |
| G-02 | 🔴 High | `TableView.tsx` | Return-to-Draft ผิดเงื่อนไข | researcher: เฉพาะ `submitted`; finance/executive: ❌ | ไม่จำกัดสถานะ, ไม่บล็อก role |
| G-03 | 🟡 Medium | `TableView.tsx` | Edit button ทั้งแถวสำหรับ finance สับสน UX | finance แก้ได้เฉพาะ Col ฎีกา/บัญชี ผ่าน inline field ตรงๆ | กด Edit → เปิดทั้งแถว แต่ field อื่น lock |
| G-04 | 🟡 Medium | `TableView.tsx` | Export CSV ไม่ scope researcher | researcher export เฉพาะของตัวเอง | export `filteredApps` ซึ่งมี filter role แล้วบางส่วน ✅ |
| G-05 | 🟡 Medium | `App.tsx` / Header | Finance/Executive เข้า P-02 Quota Planner ได้ | sitemap: ไม่มีสิทธิ์ / ต้องตัดสินใจ | ไม่มี Guard ซ่อน Tab |
| G-06 | 🔴 High | `NuDisbursementTable.tsx` | coordinator ไม่สามารถ Import ได้ | coordinator มีสิทธิ์ C ตามสเปค P-03 | `canEdit = admin only` |
| G-07 | 🔴 High | `NuDisbursementTable.tsx` | ไม่มีปุ่ม Export CSV | ทุก role ที่เห็นข้อมูล ควร Export ได้ | ไม่มีปุ่มเลย |
| G-08 | 🟢 Low | `NuDisbursementTable.tsx` | ปุ่มเปิดเอกสารคณะฯ ไม่ทำงาน | แสดงปุ่มลิงก์เมื่อมี `matchedFacultyTrackingNo` | prop `onOpenFacultyDoc` อาจไม่ถูกส่งมา |

---

## แผนแก้ไขตามลำดับความสำคัญ

### 🔴 ต้องทำก่อน (High Priority — ส่งผลต่อ Business Logic)

```
1. [G-01] เพิ่ม .sort(updatedAt DESC) ใน filteredApps ของ TableView.tsx
2. [G-02] แก้เงื่อนไข Return-to-Draft:
     - researcher → เฉพาะ status === 'submitted' && isMyApp
     - finance, executive → canReturn = false เสมอ
3. [G-06] เปิดสิทธิ์ Import Excel ให้ coordinator ใน NuDisbursementTable
4. [G-07] เพิ่มปุ่ม Export CSV ใน NuDisbursementTable สำหรับ canViewAll
```

### 🟡 ควรทำ (Medium Priority — UX ดีขึ้น)

```
5. [G-03] ปรับ finance ให้เห็น inline edit ที่คอลัมน์ฎีกา/บัญชีโดยไม่ต้องกด Edit ก่อน
6. [G-05] ตัดสินใจว่า finance/executive ควรเห็น Tab Quota Planner หรือไม่
          ถ้าใช่ → แสดงแบบ Read-Only (ซ่อนปุ่มสร้าง/แก้ไข/ลบ/ส่ง)
          ถ้าไม่ → เพิ่ม guard ใน App.tsx ซ่อน Tab เมื่อ role = finance/executive
```

### 🟢 ทำเพิ่มเติม (Low Priority)

```
7. [G-08] ตรวจสอบ prop onOpenFacultyDoc ใน App.tsx ว่าส่งมาถูกต้องหรือไม่
```

---

> [!NOTE]
> **ส่วนที่ตรงสเปคสมบูรณ์แล้ว (ไม่ต้องแก้ไข):**
> - ✅ การเรียงลำดับตาราง Quota Planner (Draft) ตามวันที่ตีพิมพ์ใกล้หมดอายุก่อน
> - ✅ Badge "ส่งคืนแก้ไข (รหัสคำขอเดิม: AWP...)" ในตารางเตรียมเบิก
> - ✅ การแสดงข้อมูลนักวิจัยเมื่อ Staff ดูร่างทั้งหมด
> - ✅ PDPA Mask toggle ทุก role
> - ✅ DRI Table default sort วันที่ล่าสุดก่อน + Interactive Sort
> - ✅ Role scoping ตารางเตรียมเบิก (researcher เห็นเฉพาะตัวเอง)
> - ✅ การรักษาเลข AWP เดิมเมื่อส่งคืน (Preservation of Tracking Number)
