import { fetchJson, qs } from "./client";
import type { CursorPage } from "@/types/common";
import type { KBItem, KBQueryRequest, KBQueryResponse } from "@/types/kb";

/**
 * GET /kb?limit=&cursor=
 */
export async function listKB(args: {
  limit?: number;
  cursor?: string | null;
} = {}): Promise<CursorPage<KBItem>> {
  const query = qs({
    limit: args.limit ?? 20,
    cursor: args.cursor ?? undefined,
  });
  return fetchJson<CursorPage<KBItem>>(`/kb${query}`);
}

/**
 * POST /kb/query
 * Body: { question }
 * Returns: { found, answer?, kb_id?, similarity? }
 */
export async function queryKB(body: KBQueryRequest): Promise<KBQueryResponse> {
  return fetchJson<KBQueryResponse>(`/kb/query`, {
    method: "POST",
    body,
  });
}
