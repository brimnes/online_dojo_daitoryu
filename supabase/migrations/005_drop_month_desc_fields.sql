-- Remove unused description/subtitle/modal_lessons_desc fields from months table
ALTER TABLE months DROP COLUMN IF EXISTS description;
ALTER TABLE months DROP COLUMN IF EXISTS subtitle;
ALTER TABLE months DROP COLUMN IF EXISTS modal_lessons_desc;
