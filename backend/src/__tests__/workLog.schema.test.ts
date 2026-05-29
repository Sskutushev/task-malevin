import { describe, expect, it } from "vitest";
import { createWorkLogSchema } from "../modules/work-logs/workLog.schema";

describe("createWorkLogSchema", () => {
  it("validates valid payload", () => {
    const payload = {
      date: "2026-01-10",
      workTypeId: "id",
      volume: 10,
      unit: "m3",
      executorName: "Иван Иванов",
    };
    expect(() => createWorkLogSchema.parse(payload)).not.toThrow();
  });
});
