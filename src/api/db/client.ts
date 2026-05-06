export type TenantId = string & { __brand: "tenantId" };
export type UserId = string & { __brand: "userId" };
export type ContactId = string & { __brand: "contactId" };
export type DealId = string & { __brand: "dealId" };
export type InvoiceId = string & { __brand: "invoiceId" };
export type ProjectId = string & { __brand: "projectId" };

export interface DatabaseClient {
  query<T>(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<T>;
  execute(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<{ rowCount: number }>;
}

export async function createClient(): Promise<DatabaseClient> {
  const dbUrl = process.env.DATABASE_URL || "sqlite://:memory:";
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    return createPgClient();
  }
  return createSqliteClient();
}

export async function createPgClient(): Promise<DatabaseClient> {
  const { default: pg } = await import("pg");
  const { Pool } = pg;
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  return {
    async query<T>(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<T> {
      const query = typeof strings === 'string' ? strings : strings[0];
      const result = await pool.query(query, values);
      return result.rows as unknown as T;
    },
    async execute(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<{ rowCount: number }> {
      const query = typeof strings === 'string' ? strings : strings[0];
      const res = await pool.query(query, values);
      return { rowCount: res.rowCount ?? 0 };
    },
  };
}

export async function createSqliteClient(): Promise<DatabaseClient> {
  const { default: betterSqlite3 } = await import("better-sqlite3");
  
  const db = betterSqlite3(process.env.DATABASE_PATH || ":memory:");

  return {
    async query<T>(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<T> {
      let query: string;
      let args: unknown[];
      if (typeof strings === 'string') {
        query = strings;
        args = values;
      } else {
        query = strings.join("?");
        args = values;
      }
      const stmt = db.prepare(query);
      return stmt.all(...args) as T;
    },
    async execute(strings: TemplateStringsArray | string, ...values: unknown[]): Promise<{ rowCount: number }> {
      let query: string;
      let args: unknown[];
      if (typeof strings === 'string') {
        query = strings;
        args = values;
      } else {
        query = strings.join("?");
        args = values;
      }
      const stmt = db.prepare(query);
      const info = stmt.run(...args);
      return { rowCount: info.changes };
    },
  };
}

export function sql(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), "");
}
export type Client = DatabaseClient;
