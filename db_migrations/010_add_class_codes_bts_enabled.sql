-- =============================================
-- Migration 010: class_codes.bts_enabled (BTS toggle per class)
-- Date: 2026-04-11
-- =============================================

BEGIN;

ALTER TABLE class_codes
    ADD COLUMN IF NOT EXISTS bts_enabled BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
