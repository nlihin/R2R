-- Migration: 007_stage1_rename_and_cleanup.sql
-- Date: 2026-03-09

BEGIN;

-- ============================================================
-- STEP 1: RENAME rank_new → participants
-- ============================================================

-- 1a. Drop old unique constraint (try common names)
ALTER TABLE rank_new DROP CONSTRAINT IF EXISTS uq_rank_new_username_class_code;
ALTER TABLE rank_new DROP CONSTRAINT IF EXISTS rank_new_username_class_code_key;

-- 1b. Rename table
ALTER TABLE rank_new RENAME TO participants;

-- 1c. Rename column id → participant_id
ALTER TABLE participants RENAME COLUMN id TO participant_id;

-- 1d. New unique constraint
ALTER TABLE participants
    ADD CONSTRAINT uq_participants_username_class_code
    UNIQUE (username, class_code);

-- 1e. Index for lookups
CREATE INDEX IF NOT EXISTS idx_participants_username_class
    ON participants(username, class_code);

-- ============================================================
-- STEP 2: rank_new_items: rank_new_id → participant_id
-- ============================================================

-- 2a. Drop old FK constraint (try common auto-generated names)
ALTER TABLE rank_new_items DROP CONSTRAINT IF EXISTS rank_new_items_rank_new_id_fkey;
ALTER TABLE rank_new_items DROP CONSTRAINT IF EXISTS rank_new_items_rank_new_id_rank_new_fkey;
ALTER TABLE rank_new_items DROP CONSTRAINT IF EXISTS "rank_new_items_rank_new_id_fkey1";

-- 2b. Drop old unique constraint
ALTER TABLE rank_new_items DROP CONSTRAINT IF EXISTS uq_rank_item_rank_group;
ALTER TABLE rank_new_items DROP CONSTRAINT IF EXISTS rank_new_items_rank_new_id_group_id_key;

-- 2c. Rename column
ALTER TABLE rank_new_items RENAME COLUMN rank_new_id TO participant_id;

-- 2d. New FK → participants(participant_id)
ALTER TABLE rank_new_items
    ADD CONSTRAINT fk_rank_new_items_participant
    FOREIGN KEY (participant_id)
    REFERENCES participants(participant_id)
    ON DELETE CASCADE;

-- 2e. New unique constraint
ALTER TABLE rank_new_items
    ADD CONSTRAINT uq_rank_item_participant_group
    UNIQUE (participant_id, group_id);

-- 2f. Update indexes
DROP INDEX IF EXISTS idx_rank_new_items_rank_new_id;
CREATE INDEX IF NOT EXISTS idx_rank_new_items_participant
    ON rank_new_items(participant_id);

-- 2g. Add feedback column (for future use, from rate table)
ALTER TABLE rank_new_items ADD COLUMN IF NOT EXISTS feedback TEXT;

-- ============================================================
-- STEP 3: DROP rank table (not used in code)
-- ============================================================
DROP TABLE IF EXISTS rank CASCADE;

-- ============================================================
-- STEP 4: question_answer — DROP class_code column
-- ============================================================
ALTER TABLE question_answer DROP COLUMN IF EXISTS class_code;

COMMIT;
