-- ระบบตรวจสอบงานนักเรียนสำหรับผู้ปกครอง - โรงเรียนบ้านแจ้งกู้เรื่อง
-- Database Schema v1.0

CREATE DATABASE IF NOT EXISTS school_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE school_system;

-- ตาราง Users (ผู้ใช้งานทุกประเภท)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role TINYINT NOT NULL COMMENT '1=ADMIN, 2=TEACHER, 3=HOMEROOM_TEACHER, 4=PARENT',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (role IN (1, 2, 3, 4))
);

-- ตาราง ClassRooms (ห้องเรียน)
CREATE TABLE classrooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade_level INT NOT NULL COMMENT 'ชั้น ป.1-6',
    room_number VARCHAR(20),
    max_students INT DEFAULT 30 COMMENT 'จำนวนนักเรียนสูงสุดต่อห้อง',
    academic_year VARCHAR(10) NOT NULL,
    homeroom_teacher_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ตาราง Students (นักเรียน)
CREATE TABLE students (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender ENUM('MALE', 'FEMALE') NOT NULL,
    address TEXT,
    classroom_id BIGINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL
);

-- ตาราง ParentStudent (ความสัมพันธ์ผู้ปกครอง-นักเรียน)
CREATE TABLE parent_student (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    relationship VARCHAR(50) COMMENT 'บิดา, มารดา, ผู้ปกครอง',
    UNIQUE KEY unique_parent_student (parent_id, student_id),
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ตาราง Subjects (รายวิชา)
CREATE TABLE subjects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INT DEFAULT 1,
    grade_level INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง TeacherSubject (ครู-รายวิชา)
CREATE TABLE teacher_subject (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    classroom_id BIGINT NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    semester TINYINT DEFAULT 1,
    UNIQUE KEY unique_teacher_subject_class (teacher_id, subject_id, classroom_id, academic_year),
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- ตาราง Schedules (ตารางสอน)
CREATE TABLE schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    teacher_subject_id BIGINT NOT NULL,
    day_of_week ENUM('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    academic_year VARCHAR(10) NOT NULL,
    semester TINYINT DEFAULT 1,
    FOREIGN KEY (teacher_subject_id) REFERENCES teacher_subject(id) ON DELETE CASCADE
);

-- ตาราง Assignments (การมอบหมายงาน/การบ้าน)
CREATE TABLE assignments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    teacher_subject_id BIGINT NOT NULL,
    assigned_date DATE NOT NULL,
    due_date DATE NOT NULL,
    max_score DECIMAL(5,2) DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_subject_id) REFERENCES teacher_subject(id) ON DELETE CASCADE
);

-- ตาราง SubmissionStatus (สถานะการส่งงาน)
CREATE TABLE submission_status (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    status ENUM('NOT_SUBMITTED', 'SUBMITTED', 'LATE_SUBMITTED', 'EXCUSED') DEFAULT 'NOT_SUBMITTED',
    submitted_at TIMESTAMP NULL,
    score DECIMAL(5,2) NULL,
    teacher_note TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_assignment_student (assignment_id, student_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ตาราง Attendance (การเช็คชื่อ)
CREATE TABLE attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    student_id BIGINT NOT NULL,
    teacher_subject_id BIGINT NOT NULL,
    date DATE NOT NULL,
    status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL DEFAULT 'PRESENT',
    note TEXT,
    recorded_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_attendance (student_id, teacher_subject_id, date),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_subject_id) REFERENCES teacher_subject(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id)
);

-- Seed Data: Admin user (password: admin123)
INSERT INTO users (username, password, role, first_name, last_name)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.', 1, 'ผู้ดูแล', 'ระบบ');
