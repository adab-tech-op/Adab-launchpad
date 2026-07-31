import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

// Lazily-constructed Neon client. Building/bundling must not require DATABASE_URL —
// the connection is only created the first time a query actually runs (at request
// time in a server action), so a missing env var fails the request, not the build.
let _sql: NeonQueryFunction<false, false> | null = null;

function init(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _sql = neon(url);
  }
  return _sql;
}

// Behaves like the neon `sql` tag: callable as sql`...` and exposes sql.transaction(...).
export const sql = new Proxy((() => {}) as unknown as NeonQueryFunction<false, false>, {
  apply(_target, _thisArg, args: unknown[]) {
    // @ts-expect-error forwarding tagged-template args to the real client
    return init()(...args);
  },
  get(_target, prop) {
    const client = init() as unknown as Record<string | symbol, unknown>;
    return client[prop];
  },
});
