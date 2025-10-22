export type HelpRequestStatus = "pending" | "resolved" | "unresolved";

export type HelpRequest = {
  id: string;
  question: string;
  customer_id: string;
  status: HelpRequestStatus;
  created_at: string;
  updated_at: string;
  // Optional backend flags we may show later:
  ai_followup_sent?: boolean;
  supervisor_answer?: string | null;
  seen_by_supervisor?: boolean;
};
export type ResolvePayload = {
  answer: string;
  resolver: string; // e.g. "supervisor-1"
};
