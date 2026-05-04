export type TenantId = string & { __brand: "tenantId" };
export type UserId = string & { __brand: "userId" };
export type ContactId = string & { __brand: "contactId" };
export type DealId = string & { __brand: "dealId" };
export type InvoiceId = string & { __brand: "invoiceId" };
export type ProjectId = string & { __brand: "projectId" };

export interface DatabaseClient {
  query<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>;
  execute(strings: TemplateStringsArray, ...values: unknown[]): Promise<{ rowCount: number }>;
}

export async function createPgClient(): Promise<DatabaseClient> {
  const { default: pg } = await import("pg");
  const { Pool } = pg;
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/crm",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return {
    async query<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
      const result = await pool.query(strings[0], values);
      return result.rows[0] as T;
    },
    async execute(strings: TemplateStringsArray, ...values: unknown[]): Promise<{ rowCount: number }> {
      const res = await pool.query(strings[0], values);
      return { rowCount: res.rowCount ?? 0 };
    },
  };
}

export async function createSqliteClient(): Promise<DatabaseClient> {
  const { default: betterSqlite3 } = await import("better-sqlite3");
  
  const db = betterSqlite3(process.env.DATABASE_PATH || ":memory:");

  return {
    async query<T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T> {
      const stmt = db.prepare(strings[0]);
      return stmt.get(...values) as T;
    },
    async execute(strings: TemplateStringsArray, ...values: unknown[]): Promise<{ rowCount: number }> {
      const stmt = db.prepare(strings[0]);
      const info = stmt.run(...values);
      return { rowCount: info.changes };
    },
  };
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
}
export type Client = DatabaseClient;