# คู่มืออธิบายการทำงานของโค้ดรายไฟล์ (สำหรับพรีเซนต์)

เอกสารนี้ใช้อธิบายการทำงานของแต่ละไฟล์ในระบบ School System ว่าทำหน้าที่อะไร และมีการดึงข้อมูล (Fetch/Query) จากส่วนไหนอย่างไรบ้าง

---

## 1. Backend: ส่วนควบคุมหลักและสถาปัตยกรรม (Core & Security)

### 1.1 [SchoolSystemApplication.java](backend/src/main/java/com/school/SchoolSystemApplication.java)
- **หน้าที่**: เป็นจุดเริ่มต้น (Entry Point) ของ Spring Boot Application
- **การทำงาน**: รันเซิร์ฟเวอร์หลักและเปิดใช้งาน Spring Context

### 1.2 [DataInitializer.java](backend/src/main/java/com/school/DataInitializer.java)
- **หน้าที่**: สร้างข้อมูลเริ่มต้น (Seed Data) เมื่อรันระบบครั้งแรก
- **การทำงาน**: ตรวจสอบว่ามีผู้ดูแลระบบ (Admin) หรือข้อมูลพื้นฐานในฐานข้อมูลหรือยัง หากยังไม่มีจะทำการบันทึกข้อมูลตั้งต้นลง MySQL

### 1.3 [SecurityConfig.java](backend/src/main/java/com/school/config/SecurityConfig.java)
- **หน้าที่**: ตั้งค่าความปลอดภัยของระบบ (Spring Security)
- **การทำงาน**: กำหนดสิทธิ์การเข้าถึง URL ต่างๆ (เช่น `/api/auth/**` ให้เข้าได้ทุกคน, `/api/admin/**` เฉพาะ Admin), เปิดใช้งาน CORS และกำหนดให้ใช้ Stateless Session ร่วมกับ JWT

### 1.4 [JwtUtil.java](backend/src/main/java/com/school/security/JwtUtil.java)
- **หน้าที่**: จัดการ Token (JSON Web Token)
- **การทำงาน**: ทำหน้าที่สร้าง Token จาก Username/Role, ตรวจสอบความถูกต้องของ Token, และแกะ (Extract) ข้อมูลผู้ใช้ออกมาจาก Token

### 1.5 [JwtAuthFilter.java](backend/src/main/java/com/school/security/JwtAuthFilter.java)
- **หน้าที่**: ดักจับและตรวจสอบคำขอทุก Request
- **การทำงาน**: ดึง Header `Authorization: Bearer <token>` จาก HTTP Request ผ่าน `JwtUtil` เพื่อตรวจสอบความถูกต้อง หากถูกต้องจะเซ็ตข้อมูล Authentication ลงใน `SecurityContextHolder` ให้ระบบรู้ว่าใครเป็นคนเรียก API

---

## 2. Backend: Entities (โครงสร้างตารางฐานข้อมูล)

- **[User.java](backend/src/main/java/com/school/entity/User.java)**: ตารางเก็บข้อมูลผู้ใช้ (id, username, password, role เช่น ADMIN, TEACHER, PARENT)
- **[Student.java](backend/src/main/java/com/school/entity/Student.java)**: ตารางเก็บข้อมูลนักเรียน (ชื่อ, นามสกุล, รหัสนักเรียน, ความสัมพันธ์กับห้องเรียน)
- **[Classroom.java](backend/src/main/java/com/school/entity/Classroom.java)**: ตารางเก็บข้อมูลห้องเรียน (ระดับชั้น, ปีการศึกษา)
- **[Subject.java](backend/src/main/java/com/school/entity/Subject.java)**: ตารางเก็บรายวิชา
- **[Assignment.java](backend/src/main/java/com/school/entity/Assignment.java)**: ตารางเก็บข้อมูลการบ้าน/งานที่มอบหมาย
- **[Attendance.java](backend/src/main/java/com/school/entity/Attendance.java)**: ตารางบันทึกเวลาเรียน (มา, ขาด, สาย, ลา)
- **[ParentStudent.java](backend/src/main/java/com/school/entity/ParentStudent.java)**: ตารางเชื่อมโยงระหว่างผู้ปกครองกับนักเรียน (Parent ID <-> Student ID)
- **[Schedule.java](backend/src/main/java/com/school/entity/Schedule.java)**: ตารางตารางเรียน/ตารางสอน
- **[TeacherSubject.java](backend/src/main/java/com/school/entity/TeacherSubject.java)**: ตารางเชื่อมโยงครูกับวิชาที่สอนในแต่ละห้อง

---

## 3. Backend: Repositories (การดึงข้อมูลจากฐานข้อมูล)
ทุก Repository (เช่น `UserRepository`, `StudentRepository`, `AssignmentRepository`, `AttendanceRepository`) สืบทอดจาก `JpaRepository` ทำหน้าที่แปลงคำสั่ง Java เป็น SQL Queries เพื่อดึง บันทึก อัปเดต หรือลบข้อมูลใน MySQL โดยตรงผ่าน Spring Data JPA

---

## 4. Backend: Services (ธุรกิจและตรรกะการทำงาน)

### 4.1 [AdminServiceImpl.java](backend/src/main/java/com/school/service/AdminServiceImpl.java)
- **หน้าที่**: จัดการระบบหลังบ้านทั้งหมด
- **การทำงาน**: ดึงและบันทึกข้อมูลผู้ใช้, จัดการห้องเรียน, วิชา, และฟังก์ชัน Bulk Promote (เลื่อนชั้นเรียนนักเรียนประจำปี) โดยดึงข้อมูลจากหลาย Repository มาประมวลผลร่วมกัน

### 4.2 [AssignmentServiceImpl.java](backend/src/main/java/com/school/service/AssignmentServiceImpl.java)
- **หน้าที่**: จัดการการบ้านและการส่งงาน
- **การทำงาน**: ดึงรายการการบ้านตามวิชา/ห้องเรียน, บันทึกการบ้านใหม่จากครู, และติดตามสถานะการส่งงานของนักเรียน

### 4.3 [ParentServiceImpl.java](backend/src/main/java/com/school/service/ParentServiceImpl.java)
- **หน้าที่**: ประมวลผลข้อมูลสำหรับผู้ปกครอง
- **การทำงาน**: ดึงรายชื่อบุตรหลานที่ผูกกับผู้ปกครองคนนั้นๆ ผ่าน `ParentStudentRepository` จากนั้นดึงเกรด การเข้าเรียน และการบ้านมาจัดทำรายงาน (Student Report)

### 4.4 [CustomUserDetailsService.java](backend/src/main/java/com/school/service/CustomUserDetailsService.java)
- **หน้าที่**: โหลดข้อมูล User สำหรับ Spring Security ตอน Login โดยดึงข้อมูลจาก `UserRepository` ตาม Username

---

## 5. Backend: Controllers (จุดรับคำขอ API)

### 5.1 [AuthController.java](backend/src/main/java/com/school/controller/AuthController.java)
- **Endpoint**: `/api/auth/login`
- **การทำงาน**: รับ Username/Password ตรวจสอบความถูกต้องผ่าน AuthenticationManager หากผ่านจะสร้าง JWT Token ส่งกลับไปให้ Frontend

### 5.2 [AdminController.java](backend/src/main/java/com/school/controller/AdminController.java)
- **Endpoint**: `/api/admin/**`
- **การทำงาน**: รับคำขอจากผู้ดูแลระบบเพื่อจัดการ Users, Classrooms, Subjects, Schedules และ Import ข้อมูล

### 5.3 [TeacherController.java](backend/src/main/java/com/school/controller/TeacherController.java)
- **Endpoint**: `/api/teacher/**`
- **การทำงาน**: รับคำขอจากครูเพื่อสร้างการบ้าน, บันทึกการเข้าเรียน (Attendance), และให้คะแนนนักเรียน

### 5.4 [ParentController.java](backend/src/main/java/com/school/controller/ParentController.java)
- **Endpoint**: `/api/parent/**`
- **การทำงาน**: ดึงข้อมูลบุตรหลาน, รายงานผลการเรียน, และการบ้านสำหรับผู้ปกครอง

---

## 6. Frontend: โครงสร้างและการดึงข้อมูล (Next.js)

### 6.1 [api.ts](frontend/src/lib/api.ts)
- **หน้าที่**: ศูนย์กลางการเรียก API ทั้งหมด
- **การทำงาน**: ใช้ Axios สร้าง HTTP Client ตั้งค่า Base URL (`/api`), ใส่ Interceptor แนบ JWT Token จาก Cookie ไปกับทุก Request อัตโนมัติ และดักจับ Error 401 เพื่อพาผู้ใช้กลับหน้า Login หาก Token หมดอายุ

### 6.2 หน้าจอ Login ([auth/login/page.tsx](frontend/src/app/auth/login/page.tsx))
- **การทำงาน**: รับค่า Username และ Password จากฟอร์ม ส่งไปยัง API `/api/auth/login` เมื่อสำเร็จจะบันทึก Token ลง Cookie และ Redirect ไปหน้า Dashboard ตาม Role

### 6.3 หน้าจอ Admin (`frontend/src/app/admin/`)
- **[dashboard/page.tsx](frontend/src/app/admin/dashboard/page.tsx)**: ดึงสถิติภาพรวมระบบ (จำนวนนักเรียน, ครู, ห้องเรียน)
- **[users/page.tsx](frontend/src/app/admin/users/page.tsx)**: ดึงรายการผู้ใช้งานทั้งหมดเพื่อเพิ่ม/ลบ/แก้ไข
- **[classrooms/page.tsx](frontend/src/app/admin/classrooms/page.tsx)**: ดึงและจัดการข้อมูลห้องเรียน
- **[subjects/page.tsx](frontend/src/app/admin/subjects/page.tsx)**: ดึงและจัดการรายวิชา

### 6.4 หน้าจอ Teacher (`frontend/src/app/teacher/`)
- **[assignments/page.tsx](frontend/src/app/teacher/assignments/page.tsx)**: ดึงรายการการบ้านที่ครูมอบหมาย และตรวจสอบงานที่นักเรียนส่ง
- **[attendance/page.tsx](frontend/src/app/teacher/attendance/page.tsx)**: ดึงรายชื่อนักเรียนในห้องเพื่อบันทึกการเข้าเรียนรายวัน
- **[schedule/page.tsx](frontend/src/app/teacher/schedule/page.tsx)**: ดึงตารางสอนของครู

### 6.5 หน้าจอ Parent (`frontend/src/app/parent/`)
- **[dashboard/page.tsx](frontend/src/app/parent/dashboard/page.tsx)**: ดึงภาพรวมกิจกรรมและการบ้านของบุตรหลาน
- **[students/page.tsx](frontend/src/app/parent/students/page.tsx)**: ดึงข้อมูลรายละเอียดของบุตรหลาน
- **[report/page.tsx](frontend/src/app/parent/report/page.tsx)**: ดึงผลการเรียนและการเข้าเรียนมาแสดงผลในรูปแบบรายงาน
