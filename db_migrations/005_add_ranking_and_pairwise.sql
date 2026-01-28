-- Migration: Add new ranking system
-- Date: 2026-01-28

CREATE TABLE IF NOT EXISTS rank_new (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  class_code VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rank_new_items (
  id SERIAL PRIMARY KEY,
  rank_new_id INTEGER NOT NULL REFERENCES rank_new(id),
  group_id INTEGER NOT NULL REFERENCES "group"(id),
  rating INTEGER NOT NULL,
  position INTEGER NOT NULL,
  class_code VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pairwise (
  id SERIAL PRIMARY KEY,
  class_code VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  pairwise_q VARCHAR(255) NOT NULL,
  ask_time TIMESTAMP NOT NULL,
  answer_time TIMESTAMP NOT NULL,
  answer INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "group" ADD COLUMN IF NOT EXISTS class_code VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_rank_new_class_code ON rank_new(class_code);
CREATE INDEX IF NOT EXISTS idx_rank_new_username_class_code ON rank_new(username, class_code);
CREATE INDEX IF NOT EXISTS idx_rank_new_items_class_code ON rank_new_items(class_code);
CREATE INDEX IF NOT EXISTS idx_rank_new_items_rank_new_id ON rank_new_items(rank_new_id);
CREATE INDEX IF NOT EXISTS idx_pairwise_class_code_username ON pairwise(class_code, username);
CREATE INDEX IF NOT EXISTS idx_group_class_code ON "group"(class_code);