# 3 หน้าจอหลักของระบบ (Core Screens for Presentation)

เอกสารนี้คัดเลือก 3 หน้าจอที่เป็นหัวใจสำคัญ (Core Features) ของระบบ School System สำหรับใช้นำเสนอ (Presentation) ในการพรีเซนต์โครงงาน โดยระบุวัตถุประสงค์ การดึงข้อมูล และขั้นตอนการทำงานอย่างกระชับและเข้าใจง่าย

---

## 1. หน้าจอเข้าสู่ระบบและการยืนยันตัวตน (Login & Authentication Screen)
- **ไฟล์โค้ด**: [auth/login/page.tsx](frontend/src/app/auth/login/page.tsx) และ [AuthController.java](backend/src/main/java/com/school/controller/AuthController.java)
- **ความสำคัญ**: เป็นประตูหน้าด่านแรกของระบบที่ควบคุมสิทธิ์การเข้าถึง (Authorization & Role-based Access)
- **ข้อมูลที่ดึงและส่ง**:
  - **ส่ง (Request)**: ข้อมูล `username` และ `password` ที่ผู้ใช้กรอกในฟอร์ม ส่งผ่าน POST Method ไปยัง Endpoint `/api/auth/login`
  - **รับ (Response)**: หากข้อมูลถูกต้อง Backend จะส่งกลับมาเป็น **JWT Token** และ **Role** ของผู้ใช้งาน (ADMIN, TEACHER, PARENT)
- **ขั้นตอนการทำงาน**:
  1. ผู้ใช้กรอก Username/Password กดปุ่ม Login
  2. ระบบตรวจสอบข้อมูลในฐานข้อมูลผ่าน `CustomUserDetailsService` และ `PasswordEncoder`
  3. เมื่อผ่าน ระบบสร้าง JWT Token และบันทึกลงใน Browser Cookie (ผ่าน `js-cookie`)
  4. ระบบทำการ Redirect ผู้ใช้ไปยัง Dashboard ที่ตรงกับ Role ของตนเองทันที

---

## 2. หน้าจอเช็คชื่อการเข้าเรียน (Teacher Attendance Screen)
- **ไฟล์โค้ด**: [teacher/attendance/page.tsx](frontend/src/app/teacher/attendance/page.tsx) และ [TeacherController.java](backend/src/main/java/com/school/controller/TeacherController.java)
- **ความสำคัญ**: เป็นฟังก์ชันหลักฝั่งคุณครูในการบริหารจัดการชั้นเรียนและบันทึกเวลาเรียนประจำวันของนักเรียน
- **ข้อมูลที่ดึงและส่ง**:
  - **ดึงข้อมูล (Fetch)**: เมื่อเข้าหน้านี้ ระบบจะเรียก API ดึงรายชื่อนักเรียนทั้งหมดในห้องที่ครูรับผิดชอบ พร้อมสถานะการเข้าเรียนเดิมของวันนั้น
  - **บันทึกข้อมูล (Save)**: เมื่อครูติ๊กเลือกสถานะ (มา, ขาด, สาย, ลา) และกดบันทึก ระบบจะส่ง Object ข้อมูลการเช็คชื่อ (`RecordAttendanceRequest`) กลับไปบันทึกที่ตาราง `Attendance` ในฐานข้อมูล MySQL
- **ขั้นตอนการทำงาน**:
  1. โหลดหน้าระบบ พร้อมแนบ JWT Token ไปใน Header (`api.ts`) เพื่อยืนยันสิทธิ์ความเป็นครู
  2. แสดงตารางรายชื่อนักเรียนในห้อง
  3. ครูทำเครื่องหมายเช็คชื่อและกดบันทึก ข้อมูลถูกส่งไปประมวลผลและอัปเดตแบบเรียลไทม์

---

## 3. หน้าจอรายงานผลการเรียนของนักเรียนสำหรับผู้ปกครอง (Parent Report Card Screen)
- **ไฟล์โค้ด**: [parent/report/page.tsx](frontend/src/app/parent/report/page.tsx) และ [ParentController.java](backend/src/main/java/com/school/controller/ParentController.java)
- **ความสำคัญ**: เป็นฟังก์ชันเชื่อมความสัมพันธ์ระหว่างโรงเรียนและผู้ปกครอง (Parent Engagement) ให้สามารถติดตามผลการเรียนของบุตรหลานได้
- **ข้อมูลที่ดึงและส่ง**:
  - **ดึงข้อมูล (Fetch)**: เรียก API `/api/parent/report` หรือขอดูข้อมูลนักเรียนในความดูแลผ่านตารางเชื่อมโยง `ParentStudent`
  - ข้อมูลที่ดึงมาแสดงประกอบด้วย: รายชื่อบุตรหลาน, ผลการเรียนรายวิชา (Subject Achievement), คะแนนเก็บ, คะแนนสอบ, และเกรดเฉลี่ย (GPA)
- **ขั้นตอนการทำงาน**:
  1. ผู้ปกครองเข้าสู่ระบบ ระบบตรวจสอบสิทธิ์ว่าเป็น Parent และดึงเฉพาะข้อมูลของบุตรหลานที่ผูกไว้เท่านั้น
  2. หน้าจอแสดงผลสรุปรายงานในรูปแบบ Dashboard/Report Card ที่อ่านง่าย สรุปสถานะการเรียนและการเข้าเรียนครบถ้วน
