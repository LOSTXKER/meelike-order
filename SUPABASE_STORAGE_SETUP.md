# Supabase Storage Setup Guide

## 📦 Setup Storage Bucket for File Uploads

### Step 1: Create Storage Bucket

1. ไปที่ [Supabase Dashboard](https://app.supabase.com)
2. เลือกโปรเจค
3. ไปที่ **Storage** > **Buckets**
4. คลิก **New Bucket**
5. ตั้งค่า:
   - **Name**: `case-attachments`
   - **Public bucket**: ❌ ปิด (private bucket)
   - คลิก **Create bucket**

### Step 2: Setup Storage Policies

ไปที่ Bucket `case-attachments` > **Policies** > คลิก **New Policy**

#### Policy 1: Allow Authenticated Upload
```sql
-- Policy Name: Allow authenticated users to upload
-- Operation: INSERT

CREATE POLICY "Allow authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-attachments' AND
  auth.role() = 'authenticated'
);
```

#### Policy 2: Allow Authenticated Read
```sql
-- Policy Name: Allow authenticated users to read
-- Operation: SELECT

CREATE POLICY "Allow authenticated read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'case-attachments');
```

#### Policy 3: Allow Authenticated Delete (Optional)
```sql
-- Policy Name: Allow user to delete own uploads
-- Operation: DELETE

CREATE POLICY "Allow delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Configure File Size Limits

ไปที่ **Settings** > **Storage** และตั้งค่า:
- **Maximum file size**: 10 MB (หรือตามต้องการ)
- **Allowed MIME types**: (เว้นว่างเพื่ออนุญาตทุกไฟล์ หรือระบุ `image/*,application/pdf`)

### Step 4: Verify Environment Variables

ตรวจสอบใน `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR-ANON-KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR-SERVICE-ROLE-KEY"
```

## ✅ Testing Upload

หลังจาก setup เสร็จแล้ว ทดสอบโดย:

1. เข้าหน้า **Cases** > **New Case**
2. สร้างเคส
3. ในหน้า case detail > **Add Note/Activity**
4. เลือก **Attach File** > อัปโหลดไฟล์ (รูป, PDF, etc.)
5. ตรวจสอบว่าไฟล์ปรากฏในหน้า Timeline

## 🔧 Troubleshooting

### ❌ Error: "new row violates row-level security policy"
- ตรวจสอบว่าสร้าง Policies ครบ 2 ตัว (INSERT, SELECT)
- ตรวจสอบว่า bucket name ถูกต้อง (`case-attachments`)

### ❌ Error: "The resource already exists"
- Bucket ชื่อนี้มีอยู่แล้ว ใช้ชื่อเดิมได้เลย

### ❌ Error: "413 Payload Too Large"
- ไฟล์ใหญ่เกินไป ตั้งค่า file size limit ใหม่ใน Supabase Settings

## 📂 File Structure in Bucket

ระบบจะจัดเก็บไฟล์ในรูปแบบ:

```
case-attachments/
├── {userId}/
│   ├── {caseId}/
│   │   ├── {timestamp}-{filename}
│   │   └── ...
```

Example:
```
case-attachments/user_123/case_abc/1640000000000-screenshot.png
```

---

**หมายเหตุ**: หากต้องการให้ไฟล์เป็น public (ดาวน์โหลดได้โดยไม่ต้อง auth) ให้เปลี่ยนเป็น **Public bucket** และปรับ policies ตามนั้น



