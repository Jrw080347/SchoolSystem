-- ย้อน users.role จากเลขกลับเป็นข้อความ enum
-- ใช้เมื่อจำเป็นต้อง rollback หลังรัน migrate-user-role-to-number.sql
-- ควรรันตอน maintenance window เพราะ ALTER TABLE อาจ lock/rebuild ตาราง users

USE school_system;

DELIMITER $$

CREATE PROCEDURE rollback_user_role_to_text()
BEGIN
    DECLARE role_column_type VARCHAR(64);
    DECLARE role_text_count INT DEFAULT 0;
    DECLARE invalid_role_count INT DEFAULT 0;
    DECLARE constraint_count INT DEFAULT 0;

    SELECT DATA_TYPE
    INTO role_column_type
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role';

    IF role_column_type IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role column not found';
    END IF;

    IF role_column_type NOT IN ('tinyint', 'smallint', 'int', 'bigint') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role is not numeric; rollback already applied or unsupported schema';
    END IF;

    SELECT COUNT(*)
    INTO invalid_role_count
    FROM users
    WHERE role NOT IN (1, 2, 3, 4);

    IF invalid_role_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role contains unknown numeric values; fix data before rollback';
    END IF;

    SELECT COUNT(*)
    INTO role_text_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role_text';

    IF role_text_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role_text already exists; aborting rollback';
    END IF;

    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'chk_users_role';

    IF constraint_count > 0 THEN
        ALTER TABLE users DROP CHECK chk_users_role;
    END IF;

    ALTER TABLE users
        ADD COLUMN role_text ENUM('ADMIN', 'TEACHER', 'HOMEROOM_TEACHER', 'PARENT') NULL AFTER password;

    UPDATE users
    SET role_text = CASE role
        WHEN 1 THEN 'ADMIN'
        WHEN 2 THEN 'TEACHER'
        WHEN 3 THEN 'HOMEROOM_TEACHER'
        WHEN 4 THEN 'PARENT'
    END;

    IF EXISTS (SELECT 1 FROM users WHERE role_text IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'role_text backfill failed; rollback transaction and inspect data';
    END IF;

    ALTER TABLE users DROP COLUMN role;

    ALTER TABLE users
        CHANGE role_text role ENUM('ADMIN', 'TEACHER', 'HOMEROOM_TEACHER', 'PARENT') NOT NULL;
END$$

DELIMITER ;

CALL rollback_user_role_to_text();
DROP PROCEDURE rollback_user_role_to_text;
