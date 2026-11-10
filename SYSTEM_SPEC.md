# System Specification: School Management System

## 1. ภาพรวมระบบ (System Overview)
ระบบบริหารจัดการโรงเรียน (School Management System) พัฒนาขึ้นเพื่อรองรับการจัดการข้อมูลนักเรียน ครู ผู้ปกครอง ชั้นเรียน การบ้าน การเข้าเรียน (Attendance) และตารางสอน โดยแยกสถาปัตยกรรมเป็น Backend (Spring Boot) และ Frontend (Next.js / React)

---

## 2. สถาปัตยกรรมระบบ (System Architecture)
- **Backend:** Java 17+, Spring Boot, Spring Security (JWT), Spring Data JPA, Hibernate, Relational Database (H2 / PostgreSQL / MySQL)
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Authentication:** Token-based Authentication ผ่าน JSON Web Token (JWT)

---

## 3. บทบาทผู้ใช้งาน (User Roles & Permissions)
ระบบรองรับ 3 บทบาทหลัก:
1. **Admin (ผู้ดูแลระบบ):**
   - จัดการชั้นเรียน (Classroom Management, Bulk Promote)
   - จัดการตารางเรียน (Schedule Management)
   - นำเข้าข้อมูล (Data Import: Students, Teachers)
   - ดูรายงานภาพรวมระบบ (System Reports)
2. **Teacher (ครูผู้สอน / ครูประจำชั้น):**
   - บันทึกและจัดการการเข้าเรียนของนักเรียน (Attendance)
   - สร้างและตรวจการบ้าน/งานที่มอบหมาย (Assignments & Submissions)
   - ดูตารางสอนที่รับผิดชอบ
   - จัดการข้อมูลนักเรียนในความดูแล (Homeroom)
3. **Parent / Student (ผู้ปกครอง / นักเรียน):**
   - ดูผลการเรียนและความก้าวหน้า (Student Report)
   - ตรวจสอบการบ้านและสถานะการส่งงาน (Assignments)
   - ตรวจสอบประวัติการเข้าเรียน (Attendance)
   - ดูตารางเรียนประจำตัว

---

## 4. โครงสร้างฐานข้อมูลและ Entity (Database Schema)

### 4.1 Student (`students`)
- `id` (Long, PK)
- `classroomId` (Long, FK -> Classrooms)
- `studentCode` (String)
- `fullName` (String)

### 4.2 ParentStudent (`parent_students`)
- `id` (Long, PK)
- `parentId` (Long)
- `studentId` (Long, FK -> Students)

### 4.3 Classroom (`classrooms`)
- `id` (Long, PK)
- `name` (String) - ตัวอย่าง: ม.1/1
- `gradeLevel` (Integer)
- `academicYear` (String)

### 4.4 TeacherSubject (`teacher_subjects`)
- `id` (Long, PK)
- `teacherId` (Long)
- `classroomId` (Long, FK -> Classrooms)

### 4.5 Assignment (`assignments`)
- `id` (Long, PK)
- `title` (String)
- `description` (String)
- `dueDate` (LocalDateTime)
- `teacherSubjectId` (Long, FK -> TeacherSubjects)
- `maxScore` (Double)

### 4.6 SubmissionStatus (`submission_statuses`)
- `id` (Long, PK)
- `assignmentId` (Long, FK -> Assignments)
- `studentId` (Long, FK -> Students)
- `status` (String: SUBMITTED, PENDING, GRADED)
- `score` (Double)
- `feedback` (String)
- `submittedAt` (LocalDateTime)

### 4.7 Attendance (`attendances`)
- `id` (Long, PK)
- `studentId` (Long, FK -> Students)
- `date` (LocalDate)
- `status` (String: PRESENT, ABSENT, LATE, EXCUSED)
- `remarks` (String)

### 4.8 Schedule (`schedules`)
- `id` (Long, PK)
- `classroomId` (Long, FK -> Classrooms)
- `teacherId` (Long)
- `dayOfWeek` (String: MONDAY - SUNDAY)
- `startTime` (LocalTime)
- `endTime` (LocalTime)
- `room` (String)

---

## 5. สรุป API Endpoints สำคัญ

### 5.1 Authentication (`/api/auth`)
- `POST /api/auth/login` - เข้าสู่ระบบและรับ JWT Token
- `POST /api/auth/register` - ลงทะเบียนผู้ใช้ใหม่

### 5.2 Admin Controller (`/api/admin`)
- `GET /api/admin/classrooms` - จัดการชั้นเรียน
- `POST /api/admin/classrooms/bulk-promote` - เลื่อนชั้นเรียนแบบกลุ่ม
- `GET /api/admin/schedules` - จัดการตารางเรียน
- `GET /api/admin/reports/system` - รายงานภาพรวมระบบ

### 5.3 Teacher Controller (`/api/teacher`)
- `GET /api/teacher/dashboard` - สถิติและข้อมูลแดชบอร์ดครู
- `GET /api/teacher/homeroom` - จัดการนักเรียนในที่ปรึกษา
- `GET /api/teacher/assignments` - จัดการการบ้าน
- `POST /api/teacher/assignments` - สร้างการบ้านใหม่
- `GET /api/teacher/assignments/{id}/submissions` - ตรวจและให้คะแนนงานนักเรียน
- `POST /api/teacher/attendance` - บันทึกการเข้าเรียนรายวัน

### 5.4 Parent Controller (`/api/parent`)
- `GET /api/parent/students` - รายชื่อนักเรียนในปกครอง
- `GET /api/parent/dashboard` - สรุปภาพรวมของบุตรหลาน
- `GET /api/parent/attendance` - ตรวจสอบการเข้าเรียนของบุตรหลาน
- `GET /api/parent/assignments` - ตรวจสอบการบ้านของบุตรหลาน
- `GET /api/parent/report` - รายงานผลการเรียนและความประพฤติ

---

## 6. โครงสร้าง Frontend Routes (Next.js App Router)
- `/auth/login` - หน้าเข้าสู่ระบบ
- `/admin/dashboard` - แดชบอร์ดผู้ดูแลระบบ
- `/admin/classrooms` - จัดการชั้นเรียน
- `/admin/schedules` - จัดการตารางเรียน
- `/admin/import` - นำเข้าข้อมูลระบบ (Students, Teachers)
- `/teacher/homeroom` - หน้าโฮมรูมครูประจำชั้น
- `/teacher/attendance` - บันทึกเวลาเรียน
- `/teacher/assignments` - จัดการการบ้านและการส่งงาน
- `/teacher/schedule` - ตารางสอนครู
- `/parent/dashboard` - แดชบอร์ดผู้ปกครอง
- `/parent/students` - ข้อมูลบุตรหลาน
- `/parent/attendance` - ประวัติการมาเรียนของบุตรหลาน
- `/parent/assignments` - ติดตามการบ้านบุตรหลาน
- `/parent/report` - ผลการเรียนและเกรด
