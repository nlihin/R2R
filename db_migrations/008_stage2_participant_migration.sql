-- Migration: 008_stage2_participant_migration.sql
-- Date: 2026-03-10

BEGIN;

-- ============================================================
-- STEP 1: question — add class_code + unique(number, class_code)
-- ============================================================

ALTER TABLE question
    ADD COLUMN IF NOT EXISTS class_code VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE question DROP CONSTRAINT IF EXISTS question_number_key;
ALTER TABLE question DROP CONSTRAINT IF EXISTS question_description_key;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_question_number_class'
          AND table_name = 'question'
    ) THEN
        ALTER TABLE question
            ADD CONSTRAINT uq_question_number_class UNIQUE (number, class_code);
    END IF;
END $$;


-- ============================================================
-- STEP 2: question_answer — user_id → participant_id
-- ============================================================

ALTER TABLE question_answer
    ADD COLUMN IF NOT EXISTS participant_id INTEGER;

UPDATE question_answer qa
SET participant_id = sub.participant_id
FROM (
    SELECT DISTINCT ON (qa2.id) qa2.id AS qa_id, p.participant_id
    FROM question_answer qa2
    JOIN participants p ON p.username = qa2.user_id::TEXT
    ORDER BY qa2.id, p.participant_id
) sub
WHERE qa.id = sub.qa_id;

ALTER TABLE question_answer
    DROP COLUMN IF EXISTS user_id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_qa_participant'
          AND table_name = 'question_answer'
    ) THEN
        ALTER TABLE question_answer
            ADD CONSTRAINT fk_qa_participant
            FOREIGN KEY (participant_id)
            REFERENCES participants(participant_id);
    END IF;
END $$;


-- ============================================================
-- STEP 3: crowd_rating — username → participant_id
-- ============================================================

ALTER TABLE crowd_rating
    DROP CONSTRAINT IF EXISTS crowd_rating_pkey;

ALTER TABLE crowd_rating
    ADD COLUMN IF NOT EXISTS participant_id INTEGER;

UPDATE crowd_rating cr
SET participant_id = p.participant_id
FROM participants p
WHERE p.username = cr.username
  AND p.class_code = cr.class_code;

UPDATE crowd_rating cr
SET participant_id = (
    SELECT p.participant_id
    FROM participants p
    WHERE p.username = cr.username
    LIMIT 1
)
WHERE cr.participant_id IS NULL
  AND cr.username IS NOT NULL;

DELETE FROM crowd_rating
WHERE participant_id IS NULL;

DELETE FROM crowd_rating
WHERE ctid NOT IN (
    SELECT MIN(ctid)
    FROM crowd_rating
    GROUP BY participant_id, group_number
);

ALTER TABLE crowd_rating
    ALTER COLUMN participant_id SET NOT NULL;

ALTER TABLE crowd_rating
    DROP COLUMN IF EXISTS username,
    DROP COLUMN IF EXISTS class_code;

ALTER TABLE crowd_rating
    ADD PRIMARY KEY (participant_id, group_number);

ALTER TABLE crowd_rating
    ADD CONSTRAINT fk_crowd_rating_participant
    FOREIGN KEY (participant_id)
    REFERENCES participants(participant_id);


-- ============================================================
-- STEP 4: pairwise — username (integer) → participant_id
-- ============================================================

ALTER TABLE pairwise
    ADD COLUMN IF NOT EXISTS participant_id_new INTEGER;

UPDATE pairwise pw
SET participant_id_new = p.participant_id
FROM participants p
WHERE p.username = pw.username::TEXT
  AND p.class_code = pw.class_code;

UPDATE pairwise pw
SET participant_id_new = (
    SELECT p.participant_id
    FROM participants p
    WHERE p.username = pw.username::TEXT
    LIMIT 1
)
WHERE pw.participant_id_new IS NULL;

DELETE FROM pairwise
WHERE participant_id_new IS NULL;

ALTER TABLE pairwise
    DROP COLUMN username;

ALTER TABLE pairwise
    RENAME COLUMN participant_id_new TO participant_id;

ALTER TABLE pairwise
    ALTER COLUMN participant_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_pairwise_participant'
          AND table_name = 'pairwise'
    ) THEN
        ALTER TABLE pairwise
            ADD CONSTRAINT fk_pairwise_participant
            FOREIGN KEY (participant_id)
            REFERENCES participants(participant_id);
    END IF;
END $$;


-- ============================================================
-- STEP 5: rate — add participant_id (username остаётся)
-- ============================================================

ALTER TABLE rate
    ADD COLUMN IF NOT EXISTS participant_id INTEGER;

UPDATE rate r
SET participant_id = p.participant_id
FROM participants p
WHERE p.username = r.username
  AND p.class_code = r.class_code;

UPDATE rate r
SET participant_id = (
    SELECT p.participant_id
    FROM participants p
    WHERE p.username = r.username
    LIMIT 1
)
WHERE r.participant_id IS NULL
  AND r.username IS NOT NULL;


-- ============================================================
-- STEP 6: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_qa_participant
    ON question_answer(participant_id);

CREATE INDEX IF NOT EXISTS idx_qa_question_number
    ON question_answer(question_number);

CREATE INDEX IF NOT EXISTS idx_cr_participant
    ON crowd_rating(participant_id);

CREATE INDEX IF NOT EXISTS idx_pairwise_participant_class
    ON pairwise(participant_id, class_code);

CREATE INDEX IF NOT EXISTS idx_question_class_code
    ON question(class_code);

CREATE INDEX IF NOT EXISTS idx_rate_participant
    ON rate(participant_id);

COMMIT;
