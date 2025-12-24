import { PrismaClient } from "@prisma/client/default";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

// Create a PostgreSQL pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create an adapter using the pool
const adapter = new PrismaPg(pool);

// Create a Prisma client with the adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@meelike.com" },
    update: {},
    create: {
      email: "admin@meelike.com",
      name: "Admin",
      password: "$2b$10$Eot.oPbj8/HUHmu12ZK/1.EX3Oay3BeTdrakXwPaDoo6pmdzjmeoK", // password123
      role: "ADMIN",
    },
  });

  const supportA = await prisma.user.upsert({
    where: { email: "support.a@meelike.com" },
    update: {},
    create: {
      email: "support.a@meelike.com",
      name: "Support A",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm",
      role: "SUPPORT",
    },
  });

  const supportB = await prisma.user.upsert({
    where: { email: "support.b@meelike.com" },
    update: {},
    create: {
      email: "support.b@meelike.com",
      name: "Support B",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm",
      role: "SUPPORT",
    },
  });

  await prisma.user.upsert({
    where: { email: "manager@meelike.com" },
    update: {},
    create: {
      email: "manager@meelike.com",
      name: "Manager",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm",
      role: "MANAGER",
    },
  });

  console.log("✅ Users created");

  // Create Case Types
  const caseTypes = await Promise.all([
    prisma.caseType.upsert({
      where: { name: "เติมเงินไม่เข้า" },
      update: {},
      create: {
        name: "เติมเงินไม่เข้า",
        category: "PAYMENT",
        defaultSeverity: "CRITICAL",
        defaultSlaMinutes: 15,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "ลูกค้าโอนเงินแต่ยอดไม่เข้าระบบ",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ออเดอร์มีปัญหา" },
      update: {},
      create: {
        name: "ออเดอร์มีปัญหา",
        category: "ORDER",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 60,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "ปัญหาเกี่ยวกับออเดอร์ เช่น ค้าง Processing",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ยอดไม่ตรง" },
      update: {},
      create: {
        name: "ยอดไม่ตรง",
        category: "PAYMENT",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 120,
        requireProvider: false,
        requireOrderId: true,
        lineNotification: false,
        description: "ยอดเงินที่แสดงไม่ตรงกับที่ลูกค้าโอน",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "SMS/OTP ไม่ได้รับ" },
      update: {},
      create: {
        name: "SMS/OTP ไม่ได้รับ",
        category: "SYSTEM",
        defaultSeverity: "LOW",
        defaultSlaMinutes: 180,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: false,
        description: "ลูกค้าไม่ได้รับ SMS หรือ OTP",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "Refund" },
      update: {},
      create: {
        name: "Refund",
        category: "PAYMENT",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 60,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "คำขอคืนเงิน",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "Provider ไม่ตอบ" },
      update: {},
      create: {
        name: "Provider ไม่ตอบ",
        category: "PROVIDER",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 60,
        requireProvider: true,
        requireOrderId: false,
        lineNotification: true,
        description: "Provider ไม่ตอบกลับหรือใช้เวลานาน",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "อื่นๆ" },
      update: {},
      create: {
        name: "อื่นๆ",
        category: "OTHER",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 240,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: false,
        description: "ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่",
      },
    }),
  ]);

  console.log("✅ Case Types created");

  // Create Providers
  const providers = await Promise.all([
    prisma.provider.upsert({
      where: { name: "TrueMoney" },
      update: {},
      create: {
        name: "TrueMoney",
        type: "API",
        defaultSlaMinutes: 30,
        contactChannel: "API Support",
        totalCases: 45,
        resolvedCases: 42,
        avgResolutionMinutes: 25,
        refundRate: 2.5,
        riskLevel: "LOW",
      },
    }),
    prisma.provider.upsert({
      where: { name: "PromptPay" },
      update: {},
      create: {
        name: "PromptPay",
        type: "API",
        defaultSlaMinutes: 30,
        contactChannel: "Bank API",
        totalCases: 128,
        resolvedCases: 120,
        avgResolutionMinutes: 18,
        refundRate: 1.8,
        riskLevel: "LOW",
      },
    }),
    prisma.provider.upsert({
      where: { name: "KBank" },
      update: {},
      create: {
        name: "KBank",
        type: "API",
        defaultSlaMinutes: 60,
        contactChannel: "K-API",
        totalCases: 67,
        resolvedCases: 58,
        avgResolutionMinutes: 45,
        refundRate: 5.2,
        riskLevel: "MEDIUM",
      },
    }),
    prisma.provider.upsert({
      where: { name: "SCB" },
      update: {},
      create: {
        name: "SCB",
        type: "MANUAL",
        defaultSlaMinutes: 120,
        contactChannel: "Call Center",
        totalCases: 34,
        resolvedCases: 28,
        avgResolutionMinutes: 120,
        refundRate: 8.5,
        riskLevel: "HIGH",
      },
    }),
    prisma.provider.upsert({
      where: { name: "BBL" },
      update: {},
      create: {
        name: "BBL",
        type: "API",
        defaultSlaMinutes: 90,
        contactChannel: "API",
        totalCases: 23,
        resolvedCases: 18,
        avgResolutionMinutes: 90,
        refundRate: 12.0,
        riskLevel: "CRITICAL",
        isActive: false,
      },
    }),
  ]);

  console.log("✅ Providers created");

  // Create Sample Cases
  const now = new Date();

  const case1 = await prisma.case.create({
    data: {
      caseNumber: `CASE-${now.getFullYear()}-0001`,
      title: "เติมเงินไม่เข้าบัญชี",
      description: "ลูกค้าแจ้งว่าโอนเงิน 500 บาท เมื่อเวลา 14:32 แต่ยอดเงินไม่เข้าระบบ รอตรวจสอบจาก TrueMoney",
      source: "LINE",
      caseTypeId: caseTypes[0].id,
      severity: "CRITICAL",
      status: "INVESTIGATING",
      customerName: "คุณสมชาย ใจดี",
      customerId: "USER-12345",
      customerContact: "Line: @somchai",
      providerId: providers[0].id,
      ownerId: supportA.id,
      slaDeadline: new Date(Date.now() + 10 * 60 * 1000),
      firstResponseAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  });

  await prisma.caseActivity.createMany({
    data: [
      {
        caseId: case1.id,
        type: "CREATED",
        title: "สร้างเคสใหม่",
        description: "เคสถูกสร้างจาก Line Message",
      },
      {
        caseId: case1.id,
        type: "ASSIGNED",
        title: "มอบหมายให้ Support A",
        userId: adminUser.id,
      },
      {
        caseId: case1.id,
        type: "STATUS_CHANGED",
        title: "เปลี่ยนสถานะเป็น กำลังตรวจสอบ",
        oldValue: "NEW",
        newValue: "INVESTIGATING",
        userId: supportA.id,
      },
      {
        caseId: case1.id,
        type: "NOTE_ADDED",
        title: "เพิ่มบันทึก",
        description: "ติดต่อ TrueMoney เพื่อตรวจสอบสถานะการโอน รอการตอบกลับภายใน 15 นาที",
        userId: supportA.id,
      },
    ],
  });

  // Create Order for case 1
  await prisma.order.create({
    data: {
      orderId: "ORD-2024-5678",
      amount: 500,
      status: "PENDING",
      providerId: providers[0].id,
      cases: { connect: { id: case1.id } },
    },
  });

  // Case 2
  await prisma.case.create({
    data: {
      caseNumber: `CASE-${now.getFullYear()}-0002`,
      title: "ออเดอร์ค้างสถานะ Processing",
      description: "ออเดอร์ค้างอยู่ที่สถานะ Processing มานานกว่า 30 นาที",
      source: "TICKET",
      caseTypeId: caseTypes[1].id,
      severity: "HIGH",
      status: "INVESTIGATING",
      customerName: "คุณสมศรี มั่งมี",
      customerId: "USER-23456",
      customerContact: "Tel: 081-xxx-xxxx",
      providerId: providers[1].id,
      ownerId: supportA.id,
      slaDeadline: new Date(Date.now() + 45 * 60 * 1000),
    },
  });

  // Case 3
  await prisma.case.create({
    data: {
      caseNumber: `CASE-${now.getFullYear()}-0003`,
      title: "ยอดเงินไม่ตรงกับที่โอน",
      description: "ลูกค้าโอน 1,000 บาท แต่ระบบแสดงยอด 900 บาท",
      source: "MANUAL",
      caseTypeId: caseTypes[2].id,
      severity: "NORMAL",
      status: "WAITING_PROVIDER",
      customerName: "คุณวิชัย สุขสันต์",
      customerId: "USER-34567",
      providerId: providers[2].id,
      ownerId: supportB.id,
      slaDeadline: new Date(Date.now() + 90 * 60 * 1000),
    },
  });

  // Case 4
  await prisma.case.create({
    data: {
      caseNumber: `CASE-${now.getFullYear()}-0004`,
      title: "ไม่ได้รับ SMS ยืนยัน OTP",
      description: "ลูกค้ารอ OTP นานกว่า 5 นาทีแล้วยังไม่ได้รับ",
      source: "LINE",
      caseTypeId: caseTypes[3].id,
      severity: "LOW",
      status: "FIXING",
      customerName: "คุณนิดา อารมณ์ดี",
      customerId: "USER-45678",
      ownerId: supportA.id,
      slaDeadline: new Date(Date.now() + 120 * 60 * 1000),
    },
  });

  // Case 5 - Resolved
  await prisma.case.create({
    data: {
      caseNumber: `CASE-${now.getFullYear()}-0005`,
      title: "Refund ไม่คืนเข้าบัญชี",
      description: "ขอ Refund แล้วแต่เงินยังไม่เข้าบัญชี",
      source: "TICKET",
      caseTypeId: caseTypes[4].id,
      severity: "HIGH",
      status: "RESOLVED",
      customerName: "คุณมานะ พากเพียร",
      customerId: "USER-56789",
      providerId: providers[3].id,
      ownerId: supportB.id,
      resolvedAt: new Date(Date.now() - 30 * 60 * 1000),
      rootCause: "PROVIDER_ISSUE",
      resolution: "ดำเนินการ Refund เรียบร้อยแล้ว ลูกค้าจะได้รับเงินภายใน 3-5 วันทำการ",
    },
  });

  console.log("✅ Sample cases created");

  // Create Notification Templates
  await prisma.notificationTemplate.upsert({
    where: { name: "case_created" },
    update: {},
    create: {
      name: "case_created",
      event: "case_created",
      template: `🔔 เคสใหม่: {{case_number}}

หัวข้อ: {{title}}
ลูกค้า: {{customer_name}}
ความรุนแรง: {{severity}}

SLA: {{sla_deadline}}`,
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { name: "sla_warning" },
    update: {},
    create: {
      name: "sla_warning",
      event: "sla_warning",
      template: `⚠️ SLA ใกล้หมด!

เคส: {{case_number}}
หัวข้อ: {{title}}
เหลือเวลา: {{remaining_time}}

กรุณาดำเนินการโดยเร็ว`,
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { name: "case_resolved" },
    update: {},
    create: {
      name: "case_resolved",
      event: "case_resolved",
      template: `✅ แก้ไขเรียบร้อย

เคส: {{case_number}}
หัวข้อ: {{title}}
แก้ไขโดย: {{owner_name}}

ขอบคุณที่ใช้บริการ Meelike`,
    },
  });

  console.log("✅ Notification templates created");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
