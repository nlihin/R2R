-- =============================================
-- Migration 011: drop legacy rate table
-- Date: 2026-06-07
-- =============================================

BEGIN;

DROP TABLE IF EXISTS rate;

COMMIT;