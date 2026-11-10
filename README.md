# ระบบตรวจสอบงานนักเรียนสำหรับผู้ปกครอง
## โรงเรียนบ้านแจ้งกู้เรื่อง

ระบบบริหารจัดการการเรียนการสอน ตรวจสอบงานและการเข้าเรียนของนักเรียน พัฒนาโดย นายจิรวัฒน์ บุญสอาด

---

## Tech Stack

| Layer     | Technology        |
|-----------|-------------------|
| Backend   | Java 17 + Spring Boot 3.2 |
| Frontend  | Next.js 14 + TypeScript + Tailwind CSS |
| Database  | MySQL 8.0         |
| Auth      | JWT (jjwt 0.12.3) |
| ORM       | Spring Data JPA + Hibernate |

---

## Project Structure

```
school-system/
├── backend/                    # Spring Boot API
│   └── src/main/java/com/school/
│       ├── config/             # SecurityConfig, CORS
│       ├── controller/         # REST Controllers
│       │   ├── AuthController      (POST /api/auth/login)
│       │   ├── AdminController     (/api/admin/**)
│       │   ├── TeacherController   (/api/teacher/**)
│       │   └── ParentController    (/api/parent/**)
│       ├── entity/             # JPA Entities
│       │   ├── User, Student, Classroom
│       │   ├── Subject, TeacherSubject, Schedule
│       │   ├── Assignment, SubmissionStatus
│       │   ├── Attendance, ParentStudent
│       ├── dto/                # Request/Response DTOs
│       ├── service/            # Business Logic Interfaces
│       └── security/           # JWT Filter + JwtUtil
│
├── frontend/                   # Next.js App
│   └── src/
│       ├── app/
│       │   ├── auth/login/     # หน้าเข้าสู่ระบบ
│       │   ├── admin/          # Admin pages
│       │   │   ├── dashboard/  # แดชบอร์ด
│       │   │   ├── classrooms/ # จัดการห้องเรียน
│       │   │   ├── users/      # จัดการผู้ใช้
│       │   │   ├── subjects/   # จัดการรายวิชา
│       │   │   ├── schedules/  # จัดการตารางสอน
│       │   │   ├── import/     # นำเข้า Excel
│       │   │   └── report/     # รายงานภาพรวม
│       │   ├── teacher/        # Teacher pages
│       │   │   ├── schedule/   # ตารางสอน
│       │   │   ├── assignments/# จัดการงาน/การบ้าน
│       │   │   ├── attendance/ # เช็คชื่อ
│       │   │   ├── students/   # รายชื่อนักเรียน
│       │   │   └── report/     # รายงานชั้นเรียน
│       │   └── parent/         # Parent pages
│       │       ├── students/   # ข้อมูลบุตรหลาน
│       │       ├── assignments/ # สถานะงาน
│       │       ├── attendance/ # ประวัติการมาเรียน
│       │       └── report/     # ความก้าวหน้า
│       ├── components/
│       │   └── Sidebar.tsx     # Navigation sidebar
│       └── lib/
│           └── api.ts          # Axios API client
│
└── database/
    └── schema.sql              # MySQL Database Schema
```

---

## Setup & Installation

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend (Spring Boot)
```bash
cd backend

# แก้ไข application.yml
# spring.datasource.password: your_mysql_password
# jwt.secret: your-secret-key

mvn spring-boot:run
# API จะรันที่ http://localhost:8080/api
```

### 3. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# เว็บจะรันที่ http://localhost:3000
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | เข้าสู่ระบบ (คืน JWT token) |

### Admin (`/api/admin/**`) - Role: ADMIN
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/users | รายการผู้ใช้ทั้งหมด |
| PUT | /admin/users/{id} | แก้ไขผู้ใช้ |
| PATCH | /admin/users/{id}/toggle | เปิด/ปิดบัญชี |
| POST | /admin/import/teachers | นำเข้าครูจาก Excel |
| POST | /admin/import/students | นำเข้านักเรียน+ผู้ปกครองจาก Excel |
| GET/POST | /admin/classrooms | รายการ/เพิ่มห้องเรียน |
| PUT | /admin/classrooms/{id} | แก้ไขห้องเรียน |
| POST | /admin/classrooms/{id}/students/{sid} | เพิ่มนักเรียนเข้าห้อง |
| GET/POST | /admin/subjects | รายการ/เพิ่มรายวิชา |
| PUT | /admin/subjects/{id} | แก้ไขรายวิชา |
| GET/POST | /admin/schedules | รายการ/เพิ่มตารางสอน |
| PUT | /admin/schedules/{id} | แก้ไขตารางสอน |
| GET | /admin/report/system | รายงานภาพรวมระบบ |

### Teacher (`/api/teacher/**`) - Role: TEACHER, HOMEROOM_TEACHER
| Method | Path | Description |
|--------|------|-------------|
| GET | /teacher/schedule | ตารางสอนของตนเอง |
| GET | /teacher/students | รายชื่อนักเรียน |
| GET/POST | /teacher/assignments | รายการ/สร้างงาน |
| PUT/DELETE | /teacher/assignments/{id} | แก้ไข/ลบงาน |
| GET | /teacher/assignments/{id}/submissions | สถานะการส่งงาน |
| PUT | /teacher/submissions/{id} | อัปเดตสถานะการส่ง |
| GET/POST | /teacher/attendance | เช็คชื่อ |
| GET | /teacher/report/class/{id} | รายงานชั้นเรียน |

### Parent (`/api/parent/**`) - Role: PARENT
| Method | Path | Description |
|--------|------|-------------|
| GET | /parent/students | รายชื่อบุตรหลาน |
| GET | /parent/students/{id}/info | ข้อมูลนักเรียน |
| GET | /parent/students/{id}/assignments | สถานะงาน |
| GET | /parent/students/{id}/attendance | ประวัติการมาเรียน |
| GET | /parent/students/{id}/report | รายงานความก้าวหน้า |

---

## Default Login
- Username: `admin`
- Password: `123456` (ต้องเปลี่ยนรหัสผ่านก่อน deploy)

---

## User Roles
- **ADMIN** - ผู้ดูแลระบบ: จัดการทุกอย่าง
- **TEACHER** - ครูผู้สอน: จัดการงาน เช็คชื่อ
- **HOMEROOM_TEACHER** - ครูประจำชั้น: มีสิทธิ์เพิ่มเติมสำหรับชั้นเรียน
- **PARENT** - ผู้ปกครอง: ดูข้อมูลบุตรหลาน

---

## ผู้พัฒนา
นายจิรวัฒน์ บุญสอาด (รหัส 6604106319)  
คณะวิทยาศาสตร์ สาขาวิชาเทคโนโลยีสารสนเทศ  
มหาวิทยาลัยแม่โจ้ (เชียงใหม่)  
ที่ปรึกษา: อ.ดร.จิราวรรณ รอนราญ
