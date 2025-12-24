# Meelike Issue & Order Management System (MIMS)

## 1. Background & Problem
ปัจจุบัน Meelike ใช้ Notion ในการติดตามปัญหาออเดอร์จากลูกค้า (Line / Ticket / Provider) ซึ่งพบข้อจำกัดหลักคือ:
- ไม่รองรับ Flow การทำงานจริงแบบหลายขั้นตอน
- ติดตาม SLA และความรับผิดชอบได้ยาก
- วิเคราะห์ปัญหาเชิงระบบ (Recurring / Provider Issue) ไม่ได้
- ไม่เหมาะกับงานปริมาณมากและหลายคนพร้อมกัน

ระบบนี้ถูกออกแบบมาเพื่อแทน Notion และยกระดับหลังบ้านให้เป็นระบบจัดการปัญหาเชิงปฏิบัติการ (Operational System)

---

## 2. Objectives
1. รวมทุกปัญหาไว้ศูนย์กลางเดียว
2. ติดตามสถานะการแก้ไขแบบ Real-time
3. ลดงานมือและความผิดพลาดของทีม
4. วิเคราะห์ปัญหาเพื่อพัฒนา Product และ Provider
5. รองรับการขยายเป็น SaaS ในอนาคต

---

## 3. Core Concept
- 1 ปัญหา = 1 Case ที่มีชีวิต (มีสถานะ, ประวัติ, Owner)
- ใช้ State Machine แทนการใช้ Tag
- ทุกการกระทำต้องถูกบันทึกเป็น Timeline

---

## 4. Core Modules

> **Design Principle (สำคัญ):**
> ระบบนี้ไม่ใช่แค่แก้ปัญหา แต่ต้อง **ลดปัญหาในอนาคต + ให้ผู้บริหารตัดสินใจจากข้อมูลจริง** โดยเชื่อมกับระบบหลักที่มีอยู่แล้ว (เช่น Refund Automation)



> **Design Principle (สำคัญ):**
> ทุกเคสต้องวัดได้ว่า **ใครทำ ใช้เวลาเท่าไร ช้าเพราะอะไร และดีหรือแย่** เพื่อให้ผู้บริหารตัดสินใจได้จากข้อมูลจริง



> **Design Principle (สำคัญ):**
> ระบบต้องสื่อสารได้ 2 ทาง (Admin ↔ ลูกค้า ↔ ระบบหลัก) แบบอัตโนมัติ และลดการถามซ้ำ



> **Design Principle (สำคัญ):**
> ทุก Select / Tag ที่เคยเป็นแค่ Dropdown ใน Notion จะถูกยกระดับเป็น **Master Data ที่มี Logic, SLA และ Automation**



> **หมายเหตุเพิ่มเติม (Critical Requirement):**
> ระบบต้องรองรับกรณี **"เติมเงินไม่เข้า"** ซึ่งเป็นเคสเร่งด่วนสูงสุด และต้องมีระบบแจ้งเตือนแบบ Real-time ผ่าน Line Messenger API ที่แอดมินตั้งค่าเองได้ง่าย ไม่พึ่ง Dev ทุกครั้ง



### 4.1 Case Management
- Case ID (Auto)
- Source (Line / Ticket / API / Manual)
- Customer Info (Username, User ID)
- Linked Orders (Multiple)
- **Case Type (Configurable Master Data)**
- Severity (Auto from Case Type)
- Status (State Machine)
- Owner (Support / Admin)
- SLA Deadline (Auto from Case Type)
- Root Cause (Required on close)

---

### 4.1.1 Case Type Settings (NEW)
> แทน Select ธรรมดาใน Notion

**Case Type Fields**
- Name (เช่น เติมเงินไม่เข้า, ยอดไม่ขึ้น)
- Category (Payment / Order / System / Provider / Other)
- Default Severity (Critical / High / Normal / Low)
- Default SLA (เช่น 15 นาที, 2 ชม.)
- Require Provider (Yes/No)
- Require Order ID (Yes/No)
- Line Notification (Enable/Disable)
- Escalation Rule (When SLA Missed)

**ตัวอย่าง**
- เติมเงินไม่เข้า
  - Category: Payment
  - Severity: Critical
  - SLA: 15 นาที
  - Line Notify: Yes

---

- Case ID (Auto)
- Source (Line / Ticket / API / Manual)
- Customer Info (Username, User ID)
- Linked Orders (Multiple)
- Issue Type (Payment, Order, System, Provider, Other)
- Severity (Critical / High / Normal / Low)
- Status:
  - New
  - Investigating
  - Waiting Customer
  - Waiting Provider
  - Fixing
  - Resolved
  - Closed
- Owner (Support / Admin)
- SLA Deadline
- Root Cause (Required on close)

---

### 4.2 Timeline & Activity Log
- ทุก Action ถูกบันทึกอัตโนมัติ
- แสดงเรียงตามเวลา (Immutable)
- รองรับ Note, File, Screenshot

---

### 4.3 Order & Transaction Linking
- เชื่อม Case กับ Order ได้หลายรายการ
- แสดงข้อมูล Order (Amount, Status, Provider)
- ประวัติการเงิน (Topup / Deduct / Refund)

---

### 4.4 Provider Intelligence
- Provider Profile
- สถิติปัญหาแยกตาม Provider
- เวลาแก้ไขเฉลี่ย
- % Refund / Cancel
- Provider Risk Level (Auto)

---

### 4.4.1 Provider Management Settings (NEW)
> จาก Select Provider → Provider ที่มีสมอง

**Provider Fields**
- Provider Name
- Provider Type (API / Manual)
- Supported Case Types
- Default SLA
- Contact Channel
- Notification Preference
- Risk Level (Calculated)
- Active / Pause Status

**Logic Integration**
- Case Type + Provider = Notification Rule
- Provider มีปัญหาซ้ำ → Auto Flag

---

- Provider Profile
- สถิติปัญหาแยกตาม Provider
- เวลาแก้ไขเฉลี่ย
- % Refund / Cancel
- Provider Risk Level

---

### 4.5 Automation & Rules Engine
- Auto Severity จาก Issue Type
- SLA Monitor & Alert
- Provider Alert (ปัญหาซ้ำ)
- High-Risk Customer Detection

---

### 4.6 Dashboard & Reporting
- Case by Status / Severity
- SLA Missed / SLA Met
- Average Resolution Time
- Top Problem Provider
- Recurring Issue

---

### 4.6.1 Time Tracking System (NEW)

ระบบติดตามเวลาแบบอัตโนมัติ (ไม่ต้องกดจับเวลาเอง)

**สิ่งที่ระบบจับให้เอง**
- Time to First Response (ตั้งแต่เคสเข้า → มีคนรับ)
- Active Working Time (เวลาที่สถานะอยู่ใน Investigating / Fixing)
- Waiting Time (รอลูกค้า / รอ Provider)
- Total Resolution Time (ตั้งแต่เปิด → ปิดเคส)

**Logic**
- เปลี่ยน Status = เปลี่ยนประเภทเวลาอัตโนมัติ
- แยกชัดว่า "ช้าเพราะใคร" ไม่เหมารวม

---

### 4.6.2 Staff Performance Evaluation (CEO View) (NEW)

Dashboard สำหรับ CEO / Manager เท่านั้น

**Metric ต่อพนักงาน**
- จำนวนเคสที่รับ
- % เคสเสร็จตาม SLA
- Avg. Response Time
- Avg. Resolution Time
- เคส Critical ที่รับผิดชอบ
- คะแนน Performance (Auto Score)

**Performance Score ตัวอย่าง**
- SLA Compliance 40%
- Response Speed 30%
- Case Load 20%
- Customer Impact 10%

---

### 4.6.3 Performance Comparison & Trend
- เปรียบเทียบรายคน / รายทีม
- แนวโน้มดีขึ้นหรือแย่ลง (Week / Month)
- Highlight:
  - Top Performer
  - Bottleneck Staff

---

- Case by Status / Severity
- SLA Missed
- Top Problem Provider
- Recurring Issue
- **Realtime Alert Panel (Topup Failed / Payment Issue)**

---

### 4.7 Realtime Alert & Line Notification System

> ระบบแจ้งเตือนต้องครอบคลุม **Admin, Support และลูกค้า**

#### 4.7.1 Customer Line Notification (NEW)
ระบบสามารถส่ง Line ไปหาลูกค้าอัตโนมัติเมื่อ:
- เคสถูกสร้างและเข้าคิวการแก้ไข
- เคสเริ่มดำเนินการ
- เคสได้รับการแก้ไขแล้ว

**Event ตัวอย่าง**
- 🟡 เคสของคุณอยู่ระหว่างการตรวจสอบ
- 🔧 ทีมงานกำลังแก้ไขปัญหาให้คุณ
- ✅ แก้ไขเรียบร้อยแล้ว

**Message Template (Admin ปรับเองได้)**
- รองรับตัวแปร: {{case_id}}, {{order_id}}, {{status}}, {{eta}}

---

#### 4.7.2 Case Tracking Page (Customer)
- ลูกค้าเข้าดูสถานะเคสได้
- แสดง:
  - สถานะปัจจุบัน
  - เวลาประมาณการ (ETA)
  - ประวัติการอัปเดต

- เข้าถึงได้ผ่าน:
  - ลิงก์ใน Line
  - หน้าเว็บ (ไม่ต้อง Login / Token-based)

---

#### 4.7.3 Line Group & VIP Support (NEW)
รองรับลูกค้า VIP ที่ดูแลผ่านกลุ่ม Line

**Feature**
- แอดมินสามารถ:
  - เพิ่ม Bot เข้า Group ได้ง่าย (Invite Link)
  - เลือก Group เป็น Notification Channel
  - กำหนด Case Type ที่ส่งเข้ากลุ่มได้

- ระบบรองรับ:
  - 1 Case → แจ้งหลาย Channel (Private + Group)
  - แยก Group ต่อ VIP / Partner

---

#### 4.7.4 Admin Line Management UX
- หน้า Line Settings
- เพิ่ม Line Channel / Bot ได้เอง
- เลือกผู้รับแจ้งเตือน (User / Group)
- Test Message
- เปิด/ปิด Event

---



#### 4.7.1 Critical Use Case: เติมเงินไม่เข้า
- ตรวจจับเหตุการณ์:
  - Payment สำเร็จ แต่เครดิตไม่เข้า
  - Topup Pending เกินเวลาที่กำหนด
  - Webhook Payment Fail / Timeout

- ระบบสร้าง **Critical Case อัตโนมัติ**
  - Severity = Critical
  - SLA = Immediate (เช่น 10–15 นาที)
  - Tag = Topup / Payment

#### 4.7.2 Line Notification Architecture
- รองรับ Line Messaging API
- ไม่ hardcode token ในระบบ
- แอดมินสามารถเชื่อม Line ได้เองผ่านหน้า UI

**ข้อมูลที่จัดเก็บต่อ Line Channel:**
- Channel Name
- Channel Access Token (Encrypt)
- Default Notify Group / User
- Event ที่ต้องการแจ้งเตือน (Toggle เปิด/ปิด)

#### 4.7.3 Line Notification Events
- เติมเงินไม่เข้า (Critical)
- SLA ใกล้หมด / เกิน SLA
- Provider ไม่ตอบเกินเวลาที่ตั้งไว้
- Case Severity เปลี่ยนเป็น Critical

#### 4.7.4 Message Template (Configurable)
- แอดมินแก้ข้อความแจ้งเตือนได้เอง
- รองรับตัวแปร:
  - {{case_id}}
  - {{username}}
  - {{amount}}
  - {{order_id}}
  - {{provider}}
  - {{elapsed_time}}

#### 4.7.5 UX: Line Connection Flow
1. Admin เข้าเมนู "Notification Settings"
2. เลือก Line
3. วาง Channel Access Token
4. กด Test ส่งข้อความ
5. เปิดใช้งาน Event ที่ต้องการแจ้งเตือน

---

- Case by Status / Severity
- SLA Missed
- Top Problem Provider
- Recurring Issue

---

## 5. User Roles
- Admin: จัดการระบบทั้งหมด
- Support: รับและแก้เคส
- Manager: ดูภาพรวมทีม
- **CEO: ดู Performance, SLA, Trend (Read-only + Decision View)**

---

- Admin: จัดการระบบทั้งหมด
- Support: รับและแก้เคส
- Manager: ดูภาพรวมและ Report

---

## 6. UX Flow (Support)
1. Case ถูกสร้างอัตโนมัติจาก Source
2. Support เลือก **Case Type**
3. ระบบกำหนด Severity, SLA, Notification อัตโนมัติ
4. Support เลือก Provider (ถ้าจำเป็น)
5. ระบบใช้ Logic จาก Provider Settings
6. ดำเนินการแก้ไขและบันทึก Timeline
7. ปิดเคสพร้อมระบุ Root Cause

---

## 6.1 UX/UI Design System (NEW)

> แนวทางการออกแบบ: **Minimal • Apple‑like • Calm • Professional**
> รองรับทั้ง **Dark Mode / Light Mode** โดยใช้ชุดสีเดียวกัน

### 6.1.1 Color Palette (Based on Provided Colors)

**Core Colors**
- White: `#ffffff`
- Off‑White: `#fffaf6`
- Cream: `#fde8bd`
- Brown: `#937058`
- Soft Yellow: `#fcd77f`
- Dark Olive: `#473b30`
- Black: `#000000`

**Usage Guideline**
- Primary Accent: `#fcd77f`
- Secondary Accent: `#937058`
- Text Primary (Light): `#000000`
- Text Primary (Dark): `#ffffff`
- Background Light: `#fffaf6`
- Background Dark: `#000000`

---

### 6.1.2 Theme System

**Light Mode**
- Background: `#fffaf6`
- Card / Surface: `#ffffff`
- Text: `#000000`
- Divider / Border: `#fde8bd`

**Dark Mode**
- Background: `#000000`
- Card / Surface: `#473b30`
- Text: `#ffffff`
- Divider / Border: `#937058`

---

### 6.1.3 Typography
- Font Family: **Inter / SF Pro‑like**
- Headline: Medium / Semi‑Bold
- Body: Regular
- ใช้ spacing และ whitespace เยอะ

---

### 6.1.4 UI Components Style

- Button: Rounded, flat, no shadow หนัก
- Card: Soft radius, subtle border
- Table: Clean, no grid หนา
- Status Badge: สีอ่อน ไม่ฉูดฉาด
- Modal / Drawer: Slide‑in, focus content

---

### 6.1.5 UX Philosophy
- ลด cognitive load
- หน้าจอ 1 = 1 งานหลัก
- สีใช้เพื่อสื่อสถานะ ไม่ใช้ตกแต่ง
- Animation เบา ๆ (100–150ms)

---

### 6.1.6 Accessibility
- Contrast ผ่าน WCAG AA
- Keyboard navigation ครบ
- Dark mode ไม่แสบตา

---

1. Case ถูกสร้างอัตโนมัติจาก Source
2. Support รับเคส (Become Owner)
3. ตรวจสอบ Order / Transaction
4. ดำเนินการแก้ไขและบันทึก Timeline
5. ปิดเคสพร้อมระบุ Root Cause

---

## 7. Implementation Phases

### Phase 1 (MVP – Replace Notion) — Supabase-only
- Case Management (Case Type Settings)
- Status Flow (State Machine)
- Owner Assignment
- Timeline (Immutable)
- Order Linking
- Basic Customer Line Notification (สร้างเคส/เข้าคิว/ปิดเคส)
- **Outbox + Idempotency สำหรับส่ง Line/Sync**

### Phase 2 (Ops Stability) — Supabase-only + Cron
- Time Tracking (Auto)
- Staff Performance Dashboard (CEO/Manager)
- SLA & Escalation (Cron)
- Line Group & VIP Support
- Provider analytics พื้นฐาน

### Phase 3 (Scale & Reliability)
- **Option B: เพิ่ม Worker/Queue (Redis + BullMQ) เมื่อเริ่มหนัก**
- Provider Health Monitor (จริงจัง)
- Abuse Detection
- System Debt Dashboard
- AI Triage (Optional)
- SaaS-ready Architecture (Multi-tenant)

---

## 8. Tech Stack (Recommended)

> มี 2 ทางเลือกตามที่ตัดสินใจได้:
> - **Option A (Supabase-only)**: ทำ MVP ให้เร็ว ใช้ Supabase + Edge Functions + Cron เป็นหลัก
> - **Option B (Add Worker Queue later)**: เมื่อเริ่มหนัก ค่อยเพิ่ม Redis + BullMQ เพื่อความนิ่งระดับโปรดักชันใหญ่


> เป้าหมายสแต็กนี้คือ **นิ่ง + โตได้ + ทำรายงาน CEO โหด ๆ + เชื่อมเว็บหลักง่าย** และรองรับงาน Background (Line/SLA/Sync) แบบไม่ทำเว็บช้า

### 8.1 Frontend
- **Next.js (App Router) + TypeScript**
- UI: Tailwind + shadcn/ui
- Data Fetching: React Query

### 8.2 Core Platform (DB/Auth/Realtime)
- **Supabase**
  - Postgres (Primary DB)
  - Auth (Admin/Support/Manager/CEO)
  - Realtime (อัปเดตเคส/แดชบอร์ด)
  - Storage (ไฟล์/หลักฐาน)
- ORM/Schema Management: **Prisma** (แนะนำเพื่อคุม schema โต ๆ ให้ชัวร์)

### 8.3 Background Jobs (Supabase-only – Option A)

> ใช้ **Supabase Edge Functions + Cron** แทน worker queue ในช่วงแรก

**สิ่งที่ทำใน Edge Functions**
- ส่ง Line แจ้งเตือน (Admin/Support/Customer/Group)
- SLA escalation (ตรวจ SLA และแจ้งเตือน)
- Sync ไปเว็บหลัก (Webhook signed)
- Provider health check (เบื้องต้น)

**Cron Schedule (ตัวอย่างแนะนำ)**
- Critical SLA (Topup): ทุก 1 นาที
- SLA ปกติ: ทุก 5 นาที
- Provider health check: ทุก 5–10 นาที
- Retry failed notifications: ทุก 1–2 นาที

**Supabase-only Requirements (ต้องมีเพื่อไม่พัง)**
- Idempotency: กันส่งซ้ำด้วย event_id
- Outbox pattern: เก็บรายการที่ต้องส่ง/ต้อง sync แล้วค่อย process
- Retry + Backoff: ส่งไม่ผ่านต้อง retry ตามรอบ
- Rate limit: กันยิง Line ถี่จนโดนจำกัด

---

### 8.3.1 Option B (Add Worker Queue later)
เมื่อ traffic/งาน background หนักขึ้น ให้เพิ่ม:
- Redis + BullMQ (Worker service แยก)
- ย้ายงานจาก Cron/Edge ไป worker เพื่อความนิ่งและการ retry/priority ที่ดีกว่า

---

### 8.4 API & Integration
- Internal API: REST (สำหรับ Admin UI)
- External Sync: **Webhook (Push) + REST Pull (Fallback)**
- Security: **HMAC Signature + Timestamp** (กันปลอม/กัน replay)

### 8.5 Observability & Audit
- Error/Performance: **Sentry**
- Audit Log: append-only ใน DB (สำคัญกับ Timeline และการตรวจสอบย้อนหลัง)

---

## 8.1 External API Integration (Sync to Meelike Main)

> ใช้ได้ทั้ง Supabase-only และเมื่อเพิ่ม worker ในอนาคต


### 8.1.1 Issue Sync API
- ระบบมี API/Webhook สำหรับส่งสถานะเคสไปยังเว็บหลัก (Meelike Main)

**Use Case**
- แสดงออเดอร์ที่อยู่ระหว่างแก้ไขในเว็บหลัก
- แสดงสถานะ "กำลังตรวจสอบ / กำลังแก้ไข / แก้ไขแล้ว"

**แนวทางแนะนำ**
- Webhook เมื่อสถานะเปลี่ยน (เรียลไทม์)
- REST Pull เป็น fallback

**API ตัวอย่าง**
- GET /api/issues/active
- GET /api/issues/{order_id}
- POST /webhooks/issues.status_changed (signed)

---

- Frontend: Next.js
- Backend: NestJS
- Database: PostgreSQL
- Realtime: WebSocket
- Notification: Line OA / Slack

---

## 9. Advanced Systems & Future Expansion (CONFIRMED)

> ส่วนนี้คือของที่ **เพิ่มใหม่จริง** และใช้ต่อจาก Core Modules โดยไม่ซ้ำระบบหลัก
> หมายเหตุ: Supabase-only ก็ทำได้ทั้งหมด แค่บางอย่างจะนิ่งขึ้นเมื่อเพิ่ม worker queue ในอนาคต


> ส่วนนี้คือของที่ **เพิ่มใหม่จริง** และใช้ต่อจาก Core Modules โดยไม่ซ้ำระบบหลัก

---

### 9.1 Root Cause & System Debt Tracking (NEW)
- บังคับเลือก Root Cause เมื่อปิดเคส
  - Provider Issue
  - Payment Gateway
  - System Bug
  - User Error
  - Process Error
- ระบบตรวจจับปัญหาซ้ำ (Recurring Issue)
- Flag เป็น **System Debt** เพื่อส่งต่อทีม Dev / Product
- Dashboard แสดง System Debt ตามความรุนแรง

---

### 9.2 Knowledge Base & SOP System (NEW)
- ผูก Case Type → วิธีแก้มาตรฐาน (SOP)
- Support เห็นแนวทางแก้ทันทีเมื่อเปิดเคส
- รองรับแนบลิงก์ / ขั้นตอน / Note ภายในระบบ
- ลดความผิดพลาดจากมนุษย์และงานซ้ำ

---

### 9.3 Provider Health Monitor (NEW)
- ติดตาม Error Rate / Latency ของ Provider
- แจ้งเตือนเมื่อ Provider เริ่มมีปัญหา
- ใช้ข้อมูลร่วมกับ Provider Risk Level
- รองรับการปิด Provider ชั่วคราว (Manual / Auto)

---

### 9.4 AI Triage & Smart Classification (Optional)
- วิเคราะห์ข้อความลูกค้า
- แนะนำ Case Type / Severity
- แจ้งเตือนเคสที่มีความเสี่ยงสูง
- เปิด/ปิดได้ตาม Phase

---

### 9.5 Refund Integration (CONFIRMED – No Duplicate)
> **หมายเหตุ:** ระบบ Refund หลักอยู่ที่ Meelike Main

- Issue System จะ:
  - เรียกดูสถานะ Refund จากเว็บหลัก
  - แสดง Refund Status ใน Timeline
  - ส่งเหตุผลการ Refund ไปเก็บเป็นประวัติ
  - ใช้ข้อมูล Refund วิเคราะห์ Root Cause และ System Debt

---

### 9.6 Audit Log & Abuse Detection (NEW)
- ตรวจจับลูกค้าที่เปิดเคสบ่อยผิดปกติ
- ตรวจจับ Refund Pattern ที่เสี่ยง
- ตรวจจับ Provider ที่สร้างปัญหาซ้ำ
- Flag เป็น High Risk (Customer / Provider)

---

### 9.7 CEO Decision Dashboard (NEW)
- ภาพรวม System Health
- Top System Debt
- Provider ที่ควรแก้ / เลิกใช้
- Performance ทีม Support
- แนวโน้มปัญหา (Week / Month)

---

## 10. Success Metrics (FINAL)
- SLA Compliance Rate
- First Response Time
- Average Resolution Time
- Repeat Issue Rate
- System Debt Reduction
- Staff Performance Score
- Notification Delivery Success Rate (Line)
- Sync Success Rate (Meelike Main)

- SLA Compliance Rate
- First Response Time
- Average Resolution Time
- Repeat Issue Rate
- System Debt Reduction
- Staff Performance Score

