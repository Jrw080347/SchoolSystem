-- สคริปต์ลบคอลัมน์ email ออกจากตาราง users
USE school_system;

ALTER TABLE users DROP COLUMN email;
