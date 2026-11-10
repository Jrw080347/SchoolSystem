-- สคริปต์ลบคอลัมน์ email ออกจากตาราง users (ยกเลิกการใช้อีเมลในระบบทั้งหมด)

USE school_system;

-- ลบคอลัมน์ email
ALTER TABLE users DROP COLUMN email;

-- ตรวจสอบโครงสร้างตาราง users
DESCRIBE users;
