-- =============================================
-- Migration 009: r2rAdmin tables
-- Date: 2026-03-15
-- =============================================

BEGIN;

ALTER TABLE class_codes
    ADD CONSTRAINT uq_class_codes_class_code UNIQUE (class_code);

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id             CHAR(9)      PRIMARY KEY,
    password_hash        VARCHAR(255) NOT NULL,
    admin_username       TEXT         NOT NULL,
    admin_email          TEXT         NOT NULL,
    role                 VARCHAR(20)  NOT NULL DEFAULT 'courseadmin'
        CHECK (role IN ('sysadmin', 'courseadmin')),
    is_active            BOOLEAN      NOT NULL,
    must_change_password BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS admin_classes (
    admin_id   CHAR(9)        NOT NULL
        REFERENCES admin_users(admin_id) ON DELETE CASCADE,
    class_code VARCHAR(1024)  NOT NULL
        REFERENCES class_codes(class_code) ON DELETE CASCADE,
    PRIMARY KEY (admin_id, class_code)
);

CREATE INDEX IF NOT EXISTS idx_admin_classes_class_code
    ON admin_classes(class_code);

COMMIT;
