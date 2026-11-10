-- แปลง users.role จากข้อความเป็นเลข
-- 1=ADMIN, 2=TEACHER, 3=HOMEROOM_TEACHER, 4=PARENT
-- ควรรันตอน maintenance window เพราะ ALTER TABLE อาจ lock/rebuild ตาราง users
-- ต้องรันกับ schema เก่าที่ users.role เป็น text/enum เท่านั้น

USE school_system;

DELIMITER $$

CREATE PROCEDURE migrate_user_role_to_number()
BEGIN
    DECLARE role_column_type VARCHAR(64);
    DECLARE role_code_count INT DEFAULT 0;
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

    IF role_column_type NOT IN ('enum', 'varchar', 'char', 'text') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role is not a text/enum column; migration already applied or unsupported schema';
    END IF;

    SELECT COUNT(*)
    INTO role_code_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role_code';

    IF role_code_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role_code already exists; aborting migration';
    END IF;

    SELECT COUNT(*)
    INTO invalid_role_count
    FROM users
    WHERE UPPER(TRIM(role)) NOT IN ('ADMIN', 'TEACHER', 'HOMEROOM_TEACHER', 'PARENT');

    IF invalid_role_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'users.role contains unknown values; fix data before migration';
    END IF;

    ALTER TABLE users
        ADD COLUMN role_text_backup VARCHAR(32) NULL COMMENT 'Backup of text role before numeric migration' AFTER password,
        ADD COLUMN role_code TINYINT NULL COMMENT '1=ADMIN, 2=TEACHER, 3=HOMEROOM_TEACHER, 4=PARENT' AFTER role_text_backup;

    UPDATE users
    SET role_text_backup = UPPER(TRIM(role)),
        role_code = CASE UPPER(TRIM(role))
            WHEN 'ADMIN' THEN 1
            WHEN 'TEACHER' THEN 2
            WHEN 'HOMEROOM_TEACHER' THEN 3
            WHEN 'PARENT' THEN 4
        END;

    IF EXISTS (SELECT 1 FROM users WHERE role_code IS NULL) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'role_code backfill failed; rollback transaction and inspect data';
    END IF;

    ALTER TABLE users DROP COLUMN role;

    ALTER TABLE users
        CHANGE role_code role TINYINT NOT NULL COMMENT '1=ADMIN, 2=TEACHER, 3=HOMEROOM_TEACHER, 4=PARENT';

    SELECT COUNT(*)
    INTO constraint_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND CONSTRAINT_NAME = 'chk_users_role';

    IF constraint_count = 0 THEN
        ALTER TABLE users
            ADD CONSTRAINT chk_users_role CHECK (role IN (1, 2, 3, 4));
    END IF;
END$$

DELIMITER ;

CALL migrate_user_role_to_number();
DROP PROCEDURE migrate_user_role_to_number;
