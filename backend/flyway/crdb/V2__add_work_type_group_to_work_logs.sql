ALTER TABLE work_logs
ADD COLUMN IF NOT EXISTS work_type_group STRING NOT NULL DEFAULT 'Общестроительные работы';

CREATE INDEX IF NOT EXISTS idx_work_logs_work_type_group ON work_logs (work_type_group);
