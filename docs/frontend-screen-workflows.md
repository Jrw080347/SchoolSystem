# วิธีการทำงานของโค้ดแต่ละหน้าจอ (Frontend Screen Workflows)

เอกสารนี้ใช้อธิบายการทำงาน (Workflow) และการดึงข้อมูลของแต่ละหน้าจอในฝั่ง Frontend (Next.js App Router) สำหรับใช้พรีเซนต์การทำงานของระบบ

---

## 1. ฝั่งระบบยืนยันตัวตน (Authentication)

### 1.1 หน้าจอเข้าสู่ระบบ ([auth/login/page.tsx](frontend/src/app/auth/login/page.tsx))
- **การทำงาน**:
  1. แสดงฟอร์มรับ `username` และ `password` จากผู้ใช้งาน
  2. เมื่อผู้ใช้กดปุ่ม Login โค้ดจะเรียกฟังก์ชันผ่าน Axios ส่งค่าไปยัง Backend ที่ Endpoint `/api/auth/login`
  3. **ข้อมูลที่ดึง/ส่ง**: ส่งข้อมูลประเภท JSON (`{ username, password }`) ไปตรวจสอบในฐานข้อมูล
  4. หากถูกต้อง Backend จะตอบกลับมาเป็น JWT Token และ Role ของผู้ใช้
  5. Frontend จะบันทึก Token และ Role ลงใน Cookie (ผ่าน `js-cookie`) และพาผู้ใช้เปลี่ยนเส้นทาง (Redirect) ไปยังหน้า Dashboard ตาม Role ที่ได้รับ (Admin ไป `/admin/dashboard`, Teacher ไป `/teacher/homeroom`, Parent ไป `/parent/dashboard`)

---

## 2. ฝั่งผู้ดูแลระบบ (Admin Pages)

### 2.1 หน้าจอแดดบอร์ดแอดมิน ([admin/dashboard/page.tsx](frontend/src/app/admin/dashboard/page.tsx))
- **การทำงาน**:
  1. เมื่อเปิดหน้าเว็บ โค้ดจะทำการเรียก API ผ่าน [api.ts](frontend/src/lib/api.ts) ไปยัง Endpoint ฝั่ง Admin (เช่น `/api/admin/stats` หรือข้อมูลภาพรวมระบบ)
  2. **ข้อมูลที่ดึง**: ดึงสถิติจำนวนผู้ใช้งานทั้งหมด, จำนวนนักเรียน, จำนวนครู, และจำนวนห้องเรียน
  3. นำข้อมูลที่ดึงมาแสดงผลเป็น Card สถิติสรุปภาพรวมให้แอดมินเห็นทันที

### 2.2 หน้าจอจัดการผู้ใช้งาน ([admin/users/page.tsx](frontend/src/app/admin/users/page.tsx))
- **การทำงาน**:
  1. โหลดข้อมูลรายชื่อผู้ใช้ทั้งหมดโดยเรียก API จาก `AdminController`
  2. **ข้อมูลที่ดึง**: ดึง List ของ User ทั้งหมด (รหัส, ชื่อผู้ใช้, บทบาท/Role)
  3. มีฟังก์ชันให้แอดมินสามารถค้นหา, เพิ่มผู้ใช้ใหม่, แก้ไขข้อมูล ([admin/users/[id]/edit/page.tsx](frontend/src/app/admin/users/[id]/edit/page.tsx)), หรือลบผู้ใช้ได้ โดยจะส่งคำขอ (POST/PUT/DELETE) ไปยัง Backend ทันที

### 2.3 หน้าจอจัดการห้องเรียน ([admin/classrooms/page.tsx](frontend/src/app/admin/classrooms/page.tsx))
- **การทำงาน**:
  1. ดึงข้อมูลห้องเรียนทั้งหมดจาก API ฝั่ง Admin
  2. **ข้อมูลที่ดึง**: รายชื่อห้องเรียน, ระดับชั้น, ปีการศึกษา, และรายชื่อนักเรียนในห้อง
  3. รองรับการสร้างห้องเรียนใหม่และการทำ Bulk Promote (เลื่อนชั้นเรียนนักเรียนประจำปี)

### 2.4 หน้าจอจัดการรายวิชา ([admin/subjects/page.tsx](frontend/src/app/admin/subjects/page.tsx))
- **การทำงาน**:
  1. ดึงรายชื่อวิชาทั้งหมดจากฐานข้อมูล
  2. **ข้อมูลที่ดึง**: รหัสวิชา, ชื่อวิชา, และครูผู้สอนที่รับผิดชอบรายวิชานั้นๆ

---

## 3. ฝั่งครูผู้สอน (Teacher Pages)

### 3.1 หน้าจอโฮมรูมและจัดการห้องเรียนประจำชั้น ([teacher/homeroom/page.tsx](frontend/src/app/teacher/homeroom/page.tsx))
- **การทำงาน**:
  1. ดึงข้อมูลห้องเรียนที่ครูท่านนี้ได้รับมอบหมายให้ดูแล
  2. **ข้อมูลที่ดึง**: รายชื่อนักเรียนในความดูแล, สรุปสถานะการมาเรียน

### 3.2 หน้าจอเช็คชื่อการเข้าเรียน ([teacher/attendance/page.tsx](frontend/src/app/teacher/attendance/page.tsx))
- **การทำงาน**:
  1. โหลดรายชื่อนักเรียนตามห้องและวันที่ปัจจุบัน
  2. **ข้อมูลที่ดึง**: รายชื่อนักเรียน และสถานะการเข้าเรียนเดิม (มา, ขาด, สาย, ลา)
  3. ครูสามารถกดบันทึก/เปลี่ยนสถานะการเข้าเรียน แล้วส่งข้อมูล (`RecordAttendanceRequest`) กลับไปบันทึกยังฐานข้อมูลผ่าน API

### 3.3 หน้าจอดูลำดับการบ้านและการมอบหมายงาน ([teacher/assignments/page.tsx](frontend/src/app/teacher/assignments/page.tsx) & [teacher/assignments/new/page.tsx](frontend/src/app/teacher/assignments/new/page.tsx))
- **การทำงาน**:
  1. ดึงรายการการบ้านที่ครูเคยสั่งไว้ทั้งหมด
  2. **ข้อมูลที่ดึง**: ชื่องาน, รายวิชา, วันกำหนดส่ง (Due Date), และจำนวนนักเรียนที่ส่งงานแล้ว
  3. หน้าสร้างงานใหม่ให้ครูกรอกฟอร์มรายละเอียด แล้วส่งข้อมูลไปที่ API เพื่อบันทึกลงตาราง `Assignment`

### 3.4 หน้าจอตรวจการบ้านนักเรียน ([teacher/assignments/[assignmentId]/submissions/page.tsx](frontend/src/app/teacher/assignments/[assignmentId]/submissions/page.tsx))
- **การทำงาน**:
  1. ดึงรายชื่อนักเรียนที่ส่งงานในชิ้นงาน (`assignmentId`) นั้นๆ
  2. **ข้อมูลที่ดึง**: รายชื่อนักเรียน, ไฟล์หรือเนื้อหาที่ส่ง, สถานะการส่ง, และคะแนน
  3. ครูสามารถให้คะแนนและคอมเมนต์ แล้วบันทึกกลับไปยังระบบ

### 3.5 หน้าจอตารางสอน ([teacher/schedule/page.tsx](frontend/src/app/teacher/schedule/page.tsx))
- **การทำงาน**:
  1. ดึงข้อมูลตารางสอนของครูประจำวิชา
  2. **ข้อมูลที่ดึง**: วัน, เวลา, วิชา, และห้องเรียนที่ต้องไปสอน

---

## 4. ฝั่งผู้ปกครอง (Parent Pages)

### 4.1 หน้าจอแดดบอร์ดผู้ปกครอง ([parent/dashboard/page.tsx](frontend/src/app/parent/dashboard/page.tsx))
- **การทำงาน**:
  1. ดึงข้อมูลภาพรวมของบุตรหลานที่ผูกกับบัญชีผู้ปกครองคนนั้น
  2. **ข้อมูลที่ดึง**: รายชื่อบุตรหลาน, สรุปการบ้านที่ต้องส่ง, และกิจกรรมล่าสุด (Recent Activities)

### 4.2 หน้าจอดูข้อมูลบุตรหลาน ([parent/students/page.tsx](frontend/src/app/parent/students/page.tsx))
- **การทำงาน**:
  1. ดึงข้อมูลรายละเอียดของนักเรียนที่เป็นบุตรหลาน
  2. **ข้อมูลที่ดึง**: ข้อมูลส่วนตัว, ห้องเรียน, และครูประจำชั้น

### 4.3 หน้าจอดูกิจกรรมการบ้านและการบ้านของบุตรหลาน ([parent/assignments/page.tsx](frontend/src/app/parent/assignments/page.tsx))
- **การทำงาน**:
  1. ดึงรายการการบ้านทั้งหมดของบุตรหลานแต่ละคน
  2. **ข้อมูลที่ดึง**: ชื่องาน, วิชา, กำหนดส่ง, และสถานะการส่งงาน (ส่งแล้ว/ยังไม่ส่ง)

### 4.4 หน้าจอดูการเข้าเรียน ([parent/attendance/page.tsx](frontend/src/app/parent/attendance/page.tsx))
- **การทำงาน**:
  1. ดึงประวัติการมาเรียนของบุตรหลาน
  2. **ข้อมูลที่ดึง**: สถิติการมาเรียน, ขาด, สาย, หรือลา ในแต่ละวัน

### 4.5 หน้าจอรายงานผลการเรียน ([parent/report/page.tsx](frontend/src/app/parent/report/page.tsx))
- **การทำงาน**:
  1. เรียก API สรุปผลการเรียนและเกรดรายวิชาของบุตรหลาน
  2. **ข้อมูลที่ดึง**: รายชื่อวิชา, คะแนนเก็บ, คะแนนสอบ, และเกรดเฉลี่ย (GPA) เพื่อแสดงผลในรูปแบบ Report Card
