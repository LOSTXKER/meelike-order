# External Cron Service Setup (ฟรี)

## ปัญหา
Vercel Hobby plan จำกัด cron ให้รันวันละ 1 ครั้งเท่านั้น

## วิธีแก้: ใช้ External Cron Service

### ตัวเลือกที่ 1: cron-job.org (แนะนำ ✅)
**ฟรี:** รัน cron ได้ทุก 1 นาที

**วิธีตั้งค่า:**
1. ไปที่ https://cron-job.org/en/
2. สมัครสมาชิก (ฟรี)
3. Create Cronjob:
   - Title: `MIMS Process Outbox`
   - URL: `https://your-app.vercel.app/api/cron/process-outbox`
   - Schedule: `Every minute (* * * * *)`
   - Request method: `GET`
4. Save

---

### ตัวเลือกที่ 2: EasyCron
**ฟรี:** รัน cron ได้ทุก 1 ชั่วโมง (100 executions/เดือน)

**วิธีตั้งค่า:**
1. ไปที่ https://www.easycron.com/
2. สมัครสมาชิก (ฟรี)
3. Create Cron Job:
   - URL: `https://your-app.vercel.app/api/cron/process-outbox`
   - When: `Every hour (0 * * * *)`
4. Save

---

### ตัวเลือกที่ 3: UptimeRobot
**ฟรี:** Monitor URL ได้ทุก 5 นาที (ใช้เป็น cron ได้)

**วิธีตั้งค่า:**
1. ไปที่ https://uptimerobot.com/
2. สมัครสมาชิก (ฟรี)
3. Add New Monitor:
   - Monitor Type: `HTTP(s)`
   - Friendly Name: `MIMS Cron`
   - URL: `https://your-app.vercel.app/api/cron/process-outbox`
   - Monitoring Interval: `5 minutes`
4. Create Monitor

---

### ตัวเลือกที่ 4: GitHub Actions (ฟรี 100%)
**ฟรี:** unlimited cron jobs

**วิธีตั้งค่า:**
สร้างไฟล์ `.github/workflows/cron.yml`:

```yaml
name: Process Outbox Cron

on:
  schedule:
    - cron: '*/5 * * * *' # ทุก 5 นาที
  workflow_dispatch: # สามารถรัน manual ได้

jobs:
  cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cron API
        run: |
          curl -X GET https://your-app.vercel.app/api/cron/process-outbox
```

---

## สรุปคำแนะนำ

| Service | ความถี่ | ราคา | แนะนำ |
|---------|---------|------|-------|
| **cron-job.org** | ทุก 1 นาที | ฟรี | ⭐⭐⭐⭐⭐ |
| **UptimeRobot** | ทุก 5 นาที | ฟรี | ⭐⭐⭐⭐ |
| **GitHub Actions** | ทุก 5 นาที | ฟรี | ⭐⭐⭐⭐ |
| **EasyCron** | ทุก 1 ชั่วโมง | ฟรี | ⭐⭐⭐ |
| **Vercel Hobby** | ทุก 1 ชั่วโมง | ฟรี | ⭐⭐ |

**แนะนำ:** ใช้ **cron-job.org** หรือ **UptimeRobot** เพราะฟรีและรันบ่อย

---

## หมายเหตุ
- `/api/cron/process-outbox` รองรับทั้ง GET และ POST
- ไม่ต้องมี authentication (แต่ควรเพิ่มใน production)
- Vercel cron ยังคงใช้ได้ (รันทุกชั่วโมง) แต่ช้ากว่า external service



