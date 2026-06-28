-- Migration: add pairwise_pending flag to rank_new_items
-- Date: 2026-06-23

ALTER TABLE rank_new_items
    ADD COLUMN IF NOT EXISTS pairwise_pending BOOLEAN NOT NULL DEFAULT FALSE;
