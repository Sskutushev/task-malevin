ALTER TABLE work_types
ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Общестроительные работы';

ALTER TABLE work_types
ADD COLUMN IF NOT EXISTS quantity_hint TEXT NOT NULL DEFAULT 'Введите объем в соответствующей единице измерения';
