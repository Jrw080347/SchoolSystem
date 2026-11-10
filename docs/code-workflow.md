# เอกสารวิธีทำงานของโค้ด (School System Code Workflow)

ระบบ School System ประกอบด้วย Backend (Spring Boot) และ Frontend (Next.js App Router) โดยแบ่งโครงสร้างและการทำงานออกเป็นส่วนๆ ดังนี้

---

## 1. ภาพรวมสถาปัตยกรรม (Architecture Overview)
- **Backend**: Spring Boot 3.x ใช้ฐานข้อมูล MySQL, Spring Security ร่วมกับ JWT (JSON Web Token) สำหรับการยืนยันตัวตน, Spring Data JPA สำหรับการจัดการฐานข้อมูล
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Axios สำหรับเรียกใช้งาน REST API

---

## 2. โครงสร้าง Backend (Spring Boot)

### 2.1 Security & Authentication (`com.school.security` & `config`)
- **[JwtUtil.java](backend/src/main/java/com/school/security/JwtUtil.java)**: จัดการการสร้าง (Generate), ตรวจสอบ (Validate) และดึงข้อมูลจาก JWT Token
- **[JwtAuthFilter.java](backend/src/main/java/com/school/security/JwtAuthFilter.java)**: คลาสกรองคำขอ (Filter) ทุก Request เพื่อดึง Header `Authorization: Bearer <token>` ตรวจสอบความถูกต้องและเซ็ต SecurityContext
- **[SecurityConfig.java](backend/src/main/java/com/school/config/SecurityConfig.java)**: ตั้งค่า Spring Security, CORS, กำหนดสิทธิ์การเข้าถึง Endpoints ตาม Role (ADMIN, TEACHER, PARENT)
- **[CustomUserDetailsService.java](backend/src/main/java/com/school/service/CustomUserDetailsService.java)**: โหลดข้อมูลผู้ใช้จากฐานข้อมูลเพื่อใช้ในกระบวนการ Authentication

### 2.2 Entities (`com.school.entity`)
- **[User.java](backend/src/main/java/com/school/entity/User.java)**: ข้อมูลผู้ใช้งานระบบ (Admin, Teacher, Parent) พร้อมฟิลด์ username, password, role
- **[Student.java](backend/src/main/java/com/school/entity/Student.java)**: ข้อมูลนักเรียน (ชื่อ, รหัสประจำตัว, ห้องเรียน)
- **[Classroom.java](backend/src/main/java/com/school/entity/Classroom.java)**: ข้อมูลห้องเรียน (ระดับชั้น, ปีการศึกษา)
- **[Subject.java](backend/src/main/java/com/school/entity/Subject.java)**: รายวิชาเรียน
- **[Assignment.java](backend/src/main/java/com/school/entity/Assignment.java)**: งานหรือการบ้านที่มอบหมาย
- **[Attendance.java](backend/src/main/java/com/school/entity/Attendance.java)**: บันทึกการเข้าเรียน
- **[ParentStudent.java](backend/src/main/java/com/school/entity/ParentStudent.java)**: ความสัมพันธ์ระหว่างผู้ปกครองและนักเรียน

### 2.3 Repositories (`com.school.repository`)
- ทำหน้าที่ติดต่อฐานข้อมูลผ่าน Spring Data JPA (เช่น [UserRepository.java](backend/src/main/java/com/school/repository/UserRepository.java), [StudentRepository.java](backend/src/main/java/com/school/repository/StudentRepository.java), [AssignmentRepository.java](backend/src/main/java/com/school/repository/AssignmentRepository.java))

### 2.4 Services (`com.school.service`)
- **[AdminService.java](backend/src/main/java/com/school/service/AdminService.java)** / **[AdminServiceImpl.java](backend/src/main/java/com/school/service/AdminServiceImpl.java)**: จัดการผู้ใช้งาน, ห้องเรียน, วิชา, การเลื่อนชั้นเรียน (Bulk Promote), นำเข้าข้อมูล
- **[AssignmentService.java](backend/src/main/java/com/school/service/AssignmentService.java)** / **[AssignmentServiceImpl.java](backend/src/main/java/com/school/service/AssignmentServiceImpl.java)**: สร้างและจัดการงาน มอบหมายให้นักเรียน ตรวจสอบสถานะการส่งงาน
- **[ParentService.java](backend/src/main/java/com/school/service/ParentService.java)** / **[ParentServiceImpl.java](backend/src/main/java/com/school/service/ParentServiceImpl.java)**: ดึงข้อมูลสรุปผลการเรียน การเข้าเรียน และกิจกรรมของบุตรหลานสำหรับผู้ปกครอง

### 2.5 Controllers (`com.school.controller`)
- **[AuthController.java](backend/src/main/java/com/school/controller/AuthController.java)**: Endpoint สำหรับ Login, Register และยืนยันตัวตน
- **[AdminController.java](backend/src/main/java/com/school/controller/AdminController.java)**: API จัดการระบบสำหรับ Admin
- **[TeacherController.java](backend/src/main/java/com/school/controller/TeacherController.java)**: API จัดการการบ้าน บันทึกเวลาเรียน และให้คะแนนสำหรับครู
- **[ParentController.java](backend/src/main/java/com/school/controller/ParentController.java)**: API สำหรับผู้ปกครองตรวจสอบข้อมูลนักเรียน

---

## 3. โครงสร้าง Frontend (Next.js)

### 3.1 Core Setup & Libs
- **[api.ts](frontend/src/lib/api.ts)**: ตั้งค่า Axios Client, แนบ JWT Token อัตโนมัติจาก Cookie ในทุก Request, และจัดการกรณี Token หมดอายุ (401 Unauthorized) ไปหน้า Login
- **[layout.tsx](frontend/src/app/layout.tsx)**: โครงสร้างหลักของหน้าเว็บ พร้อม Notification Provider

### 3.2 Authentication & Routing (`frontend/src/app`)
- **[auth/login/page.tsx](frontend/src/app/auth/login/page.tsx)**: หน้าเข้าสู่ระบบ ตรวจสอบ Username/Password และบันทึก Token ลง Cookie
- **[admin/dashboard/page.tsx](frontend/src/app/admin/dashboard/page.tsx)**: หน้าแดชบอร์ดผู้ดูแลระบบ
- **[teacher/](frontend/src/app/teacher/)**: โฟลเดอร์หน้าจอฝั่งครู (จัดการงาน, บันทึกเวลาเรียน, ตรวจสอบรายวิชา)
- **[parent/](frontend/src/app/parent/)**: โฟลเดอร์หน้าจอฝั่งผู้ปกครอง (ดูรายงาน, การเข้าเรียน, การบ้านของบุตรหลาน)

---

## 4. ขั้นตอนการทำงานของระบบ (Workflow)
1. **Login**: ผู้ใช้กรอกข้อมูลใน [login/page.tsx](frontend/src/app/auth/login/page.tsx) เรียก API `/api/auth/login` ผ่าน [AuthController.java](backend/src/main/java/com/school/controller/AuthController.java) ได้รับ JWT Token กลับมาเก็บใน Cookie
2. **API Request**: ทุกคำขอจาก Frontend ผ่าน [api.ts](frontend/src/lib/api.ts) จะแนบ Bearer Token ไปด้วย ซึ่ง [JwtAuthFilter.java](backend/src/main/java/com/school/security/JwtAuthFilter.java) จะตรวจสอบสิทธิ์ก่อนส่งต่อให้ Controller ทำงาน
3. **Business Logic & Database**: Service Layer ดำเนินการประมวลผลข้อมูลและติดต่อ Database ผ่าน JPA Repositories
