import { fetchJson } from "./client";

export type AgentAskRequest = {
  customer_id: string;  // e.g. "demo-1"
  question: string;
};

export type AgentAskKnown = {
  known: true;
  source: string;       // "knowledge_base-semantic"
  kb_id: string;
  similarity: number;   // 0..1
  answer: string;
};

export type AgentAskUnknown = {
  known: false;
  help_request_id: string;
  message: string;      // "No answer found; help request created."
};

export type AgentAskResponse = AgentAskKnown | AgentAskUnknown;

/** POST /agent/question */
export async function askAgent(body: AgentAskRequest): Promise<AgentAskResponse> {
  return fetchJson<AgentAskResponse>("/agent/question", {
    method: "POST",
    body,
  });
}
