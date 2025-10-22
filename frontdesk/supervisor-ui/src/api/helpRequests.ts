/**
 * POST /help-requests/mark-all-seen
 */
export async function markAllHelpRequestsSeen(): Promise<void> {
  await fetchJson("/help-requests/mark-all-seen", { method: "POST" });
}
import { fetchJson, qs } from "./client";
import type { CursorPage } from "@/types/common";
import type { HelpRequest, HelpRequestStatus, ResolvePayload } from "@/types/helpRequests";

/**
 * GET /help-requests?status=&limit=&cursor=
 */
export async function listHelpRequests(args: {
  status: HelpRequestStatus;
  limit?: number;
  cursor?: string | null;
}): Promise<CursorPage<HelpRequest>> {
  const query = qs({
    status: args.status,
    limit: args.limit ?? 20,
    cursor: args.cursor ?? undefined,
  });
  return fetchJson<CursorPage<HelpRequest>>(`/help-requests${query}`);
}

/**
 * POST /help-requests/{id}/resolve
 * Body: { answer, resolver }
 * Returns updated HelpRequest
 */
export async function resolveHelpRequest(
  id: string,
  body: ResolvePayload
): Promise<HelpRequest> {
  return fetchJson<HelpRequest>(`/help-requests/${id}/resolve`, {
    method: "POST",
    body,
  });
}
