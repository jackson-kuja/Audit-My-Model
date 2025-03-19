-- Make problematic columns nullable
ALTER TABLE audits
ALTER COLUMN model_name DROP NOT NULL,
ALTER COLUMN model_type DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN audit_type DROP NOT NULL,
ALTER COLUMN results DROP NOT NULL,
ALTER COLUMN original_filename DROP NOT NULL; 