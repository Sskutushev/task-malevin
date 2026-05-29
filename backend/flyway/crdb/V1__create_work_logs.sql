CREATE TABLE IF NOT EXISTS work_logs (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  work_type_id TEXT NOT NULL,
  work_type_name TEXT NOT NULL,
  volume DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  executor_name TEXT NOT NULL,
  notes STRING NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs (date);
CREATE INDEX IF NOT EXISTS idx_work_logs_work_type_id ON work_logs (work_type_id);
