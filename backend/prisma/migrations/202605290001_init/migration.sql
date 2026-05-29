CREATE TABLE "work_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "work_logs" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "work_type_id" TEXT NOT NULL,
    "volume" DECIMAL(10,2) NOT NULL,
    "unit" TEXT NOT NULL,
    "executor_name" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "work_types_name_key" ON "work_types"("name");
CREATE INDEX "work_logs_date_idx" ON "work_logs"("date");
CREATE INDEX "work_logs_work_type_id_idx" ON "work_logs"("work_type_id");

ALTER TABLE "work_logs" ADD CONSTRAINT "work_logs_work_type_id_fkey"
    FOREIGN KEY ("work_type_id") REFERENCES "work_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
