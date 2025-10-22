export type KBItem = {
  id: string;
  question_raw: string;
  answer: string;
  source: "supervisor" | "seed" | string;
  updated_at: string;
};

export type KBQueryRequest = {
  question: string;
};

export type KBQueryResponseKnown = {
  found: true;
  answer: string;
  kb_id: string;
  similarity: number; // 0..1
};

export type KBQueryResponseUnknown = {
  found: false;
};

export type KBQueryResponse = KBQueryResponseKnown | KBQueryResponseUnknown;
