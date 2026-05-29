import { Pool } from "pg";
import { env } from "../config/env";

export function createCrdbPool(): Pool {
  return new Pool({ connectionString: env.CRDB_URL });
}
