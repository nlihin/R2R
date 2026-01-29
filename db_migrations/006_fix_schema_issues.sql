-- Migration: Fix all schema issues
-- Date: 2026-01-29

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS confirm BOOLEAN DEFAULT FALSE NOT NULL;


ALTER TABLE rate ADD COLUMN IF NOT EXISTS class_code VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE rate DROP CONSTRAINT IF EXISTS rate_pkey CASCADE;
ALTER TABLE rate ADD PRIMARY KEY (username, group_number, class_code);


ALTER TABLE crowd_rating ADD COLUMN IF NOT EXISTS class_code VARCHAR(255);
UPDATE crowd_rating SET class_code = '' WHERE class_code IS NULL;
ALTER TABLE crowd_rating ALTER COLUMN class_code SET NOT NULL;
ALTER TABLE crowd_rating DROP CONSTRAINT IF EXISTS crowd_rating_pkey CASCADE;
ALTER TABLE crowd_rating ADD PRIMARY KEY (username, group_number, class_code);


ALTER TABLE rank ADD COLUMN IF NOT EXISTS class_code VARCHAR(255) NOT NULL DEFAULT '';
ALTER TABLE question_answer ADD COLUMN IF NOT EXISTS class_code VARCHAR(255) DEFAULT '';


DROP TABLE IF EXISTS pairwise CASCADE;

CREATE TABLE pairwise (
  id SERIAL PRIMARY KEY,
  class_code VARCHAR(255) NOT NULL,
  username INTEGER NOT NULL,
  pairwise_q VARCHAR(255) NOT NULL,
  ask_time TIMESTAMP NOT NULL,
  answer_time TIMESTAMP NOT NULL,
  answer INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pairwise_class_code_username ON pairwise(class_code, username);
CREATE INDEX IF NOT EXISTS idx_pairwise_username ON pairwise(username);
CREATE INDEX IF NOT EXISTS idx_pairwise_class_code ON pairwise(class_code);