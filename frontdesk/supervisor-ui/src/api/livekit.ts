import { fetchJson, qs } from "./client";

export type LivekitTokenResponse = {
  token: string;
  url: string;       // e.g. wss://frontdesk-hitl-...livekit.cloud
  identity: string;  // echoed
  room: string;      // default: frontdesk-demo
};

/**
 * GET /livekit/token?identity=&room=
 */
export async function getLivekitToken(args: {
  identity: string;
  room?: string;
}): Promise<LivekitTokenResponse> {
  const query = qs({
    identity: args.identity,
    room: args.room ?? undefined,
  });
  return fetchJson<LivekitTokenResponse>(`/livekit/token${query}`);
}
