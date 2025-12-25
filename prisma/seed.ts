import { PrismaClient } from "@prisma/client";
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

  // ⚠️ ไม่ลบเคสเดิมแล้ว เพื่อรักษาข้อมูลจริง
  // ถ้าต้องการรีเซ็ต ให้ใช้ npx prisma migrate reset แทน

  // Create Users (4 roles: CEO, MANAGER, SUPPORT, TECHNICIAN)
  
  // CEO - ผู้ดูแลระบบสูงสุด
  const ceoUser = await prisma.user.upsert({
    where: { email: "ceo@meelike.com" },
    update: { role: "CEO" },
    create: {
      email: "ceo@meelike.com",
      name: "CEO",
      password: "$2b$10$Eot.oPbj8/HUHmu12ZK/1.EX3Oay3BeTdrakXwPaDoo6pmdzjmeoK", // password123
      role: "CEO",
    },
  });

  // MANAGER - ดูภาพรวม/ดูแลทีม
  await prisma.user.upsert({
    where: { email: "manager@meelike.com" },
    update: { role: "MANAGER" },
    create: {
      email: "manager@meelike.com",
      name: "Manager",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // password123
      role: "MANAGER",
    },
  });

  // SUPPORT - รับเรื่อง/แจ้งลูกค้า
  await prisma.user.upsert({
    where: { email: "support@meelike.com" },
    update: { role: "SUPPORT" },
    create: {
      email: "support@meelike.com",
      name: "Support",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // password123
      role: "SUPPORT",
    },
  });

  // TECHNICIAN - คนแก้ปัญหา (ดูเฉพาะเคสตัวเอง)
  const techA = await prisma.user.upsert({
    where: { email: "tech.a@meelike.com" },
    update: { role: "TECHNICIAN" },
    create: {
      email: "tech.a@meelike.com",
      name: "Technician A",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // password123
      role: "TECHNICIAN",
    },
  });

  const techB = await prisma.user.upsert({
    where: { email: "tech.b@meelike.com" },
    update: { role: "TECHNICIAN" },
    create: {
      email: "tech.b@meelike.com",
      name: "Technician B",
      password: "$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm", // password123
      role: "TECHNICIAN",
    },
  });

  console.log("✅ Users created");

  // Create Case Types ตามรูปภาพ
  const caseTypes = await Promise.all([
    prisma.caseType.upsert({
      where: { name: "ปัญหาเว็บไซต์/ข้อเสนอ" },
      update: {},
      create: {
        name: "ปัญหาเว็บไซต์/ข้อเสนอ",
        category: "SYSTEM",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 120,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: true,
        description: "แจ้งปัญหาเว็บไซต์หรือข้อเสนอแนะ",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ปัญหารหัส/User" },
      update: {},
      create: {
        name: "ปัญหารหัส/User",
        category: "SYSTEM",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 30,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: true,
        description: "ปัญหาเกี่ยวกับรหัสผ่านหรือบัญชีผู้ใช้",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ขอเติมยอด" },
      update: {},
      create: {
        name: "ขอเติมยอด",
        category: "PAYMENT",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 15,
        requireProvider: true,
        requireOrderId: false,
        lineNotification: true,
        description: "ขอเติมเงินเข้าบัญชี",
      },
    }),
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
      where: { name: "ขอยกเลิก" },
      update: {},
      create: {
        name: "ขอยกเลิก",
        category: "ORDER",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 30,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: false,
        description: "ขอยกเลิกออเดอร์",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "เสร็จแต่ยอดไม่ขึ้น" },
      update: {},
      create: {
        name: "เสร็จแต่ยอดไม่ขึ้น",
        category: "ORDER",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 30,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "ออเดอร์เสร็จแล้วแต่ยอดไม่อัปเดต",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "อื่นๆ" },
      update: {},
      create: {
        name: "อื่นๆ",
        category: "OTHER",
        defaultSeverity: "LOW",
        defaultSlaMinutes: 240,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: false,
        description: "ปัญหาอื่นๆ ที่ไม่อยู่ในหมวดหมู่",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ขอโปรโมชั่น" },
      update: {},
      create: {
        name: "ขอโปรโมชั่น",
        category: "OTHER",
        defaultSeverity: "LOW",
        defaultSlaMinutes: 60,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: false,
        description: "สอบถามหรือขอโปรโมชั่น",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ยอดไม่ครบ" },
      update: {},
      create: {
        name: "ยอดไม่ครบ",
        category: "ORDER",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 30,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "ยอดที่ได้รับไม่ครบตามที่สั่ง",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "เข้าเว็บไม่ได้" },
      update: {},
      create: {
        name: "เข้าเว็บไม่ได้",
        category: "SYSTEM",
        defaultSeverity: "CRITICAL",
        defaultSlaMinutes: 15,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: true,
        description: "ไม่สามารถเข้าใช้งานเว็บไซต์ได้",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ยอดไม่ขึ้น" },
      update: {},
      create: {
        name: "ยอดไม่ขึ้น",
        category: "ORDER",
        defaultSeverity: "HIGH",
        defaultSlaMinutes: 30,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: true,
        description: "ยอดไม่อัปเดตในระบบ",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "ขอเพิ่มความเร็ว" },
      update: {},
      create: {
        name: "ขอเพิ่มความเร็ว",
        category: "ORDER",
        defaultSeverity: "NORMAL",
        defaultSlaMinutes: 60,
        requireProvider: true,
        requireOrderId: true,
        lineNotification: false,
        description: "ขอเพิ่มความเร็วในการทำงาน",
      },
    }),
    prisma.caseType.upsert({
      where: { name: "สอบถามอื่นๆ" },
      update: {},
      create: {
        name: "สอบถามอื่นๆ",
        category: "OTHER",
        defaultSeverity: "LOW",
        defaultSlaMinutes: 120,
        requireProvider: false,
        requireOrderId: false,
        lineNotification: false,
        description: "สอบถามข้อมูลทั่วไป",
      },
    }),
  ]);

  console.log("✅ Case Types created");

  // ลบ Providers เดิมทั้งหมด
  console.log("🗑️  Deleting old providers...");
  await prisma.provider.deleteMany({});
  console.log("✅ Old providers deleted");

  // Create Providers ใหม่ตามภาพ
  await prisma.provider.create({
    data: {
      name: "Super",
      type: "API",
      defaultSlaMinutes: 30,
      contactChannel: "Line: @super",
      notificationPreference: "LINE",
      riskLevel: "LOW",
      isActive: true,
    },
  });

  await prisma.provider.create({
    data: {
      name: "Dragon",
      type: "API",
      defaultSlaMinutes: 30,
      contactChannel: "Line: @dragon",
      notificationPreference: "LINE",
      riskLevel: "LOW",
      isActive: true,
    },
  });

  await prisma.provider.create({
    data: {
      name: "ARSD",
      type: "API",
      defaultSlaMinutes: 30,
      contactChannel: "Line: @arsd",
      notificationPreference: "LINE",
      riskLevel: "LOW",
      isActive: true,
    },
  });

  await prisma.provider.create({
    data: {
      name: "JAP",
      type: "API",
      defaultSlaMinutes: 30,
      contactChannel: "Line: @jap",
      notificationPreference: "LINE",
      riskLevel: "LOW",
      isActive: true,
    },
  });

  console.log("✅ Providers created");

  // Create Notification Templates
  await prisma.notificationTemplate.upsert({
    where: { name: "case_created" },
    update: {},
    create: {
      name: "case_created",
      event: "case_created",
      template: "🆕 เคสใหม่: {{caseNumber}}\n📝 {{title}}\n👤 ลูกค้า: {{customerName}}\n⚠️ ความรุนแรง: {{severity}}",
      isActive: true,
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { name: "sla_warning" },
    update: {},
    create: {
      name: "sla_warning",
      event: "sla_warning",
      template: "⏰ แจ้งเตือน SLA!\nเคส {{caseNumber}} ใกล้เกินกำหนด\n⏱ เหลือเวลา: {{slaRemaining}} นาที",
      isActive: true,
    },
  });

  await prisma.notificationTemplate.upsert({
    where: { name: "case_resolved" },
    update: {},
    create: {
      name: "case_resolved",
      event: "case_resolved",
      template: "✅ แก้ไขเคสสำเร็จ\nเคส: {{caseNumber}}\n📝 {{title}}\n✨ วิธีแก้ไข: {{resolution}}",
      isActive: true,
    },
  });

  console.log("✅ Notification Templates created");

  // Create Line Channels (delete old and create new)
  await prisma.lineChannel.deleteMany({
    where: { name: "Meelike Alert-Staff" },
  });

  await prisma.lineChannel.create({
    data: {
      name: "Meelike Alert-Staff",
      accessToken: "YOUR_LINE_ACCESS_TOKEN",
      defaultGroupId: "YOUR_LINE_GROUP_ID",
      enabledEvents: [
        "case_created",
        "case_assigned",
        "case_status_changed",
        "case_resolved",
        "provider_issue",
        "sla_missed",
        "sla_warning",
      ],
      isActive: true,
    },
  });

  console.log("✅ Line Channels created");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
