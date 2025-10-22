const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface HelpRequest {
  id: string;
  customer_id: string;
  question: string;
  status: 'pending' | 'resolved' | 'unresolved';
  supervisor_answer?: string;
  created_at: string;
  updated_at: string;
}

// Get LiveKit token
export async function getLiveKitToken(identity: string, room?: string): Promise<{
  token: string;
  url: string;
  identity: string;
  room: string;
}> {
  const params = new URLSearchParams({ identity });
  if (room) params.append('room', room);
  const response = await fetch(`${API_BASE}/livekit/token?${params}`);
  if (!response.ok) throw new Error('Failed to get LiveKit token');
  return response.json();
}

// Ask agent a question (REST API alternative)
export async function askAgent(customerId: string, question: string) {
  const response = await fetch(`${API_BASE}/agent/question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customer_id: customerId, question }),
  });
  if (!response.ok) throw new Error('Failed to ask agent');
  return response.json();
}

// List help requests (for supervisor dashboard)
export async function listHelpRequests(
  status?: 'pending' | 'resolved' | 'unresolved',
  limit = 20,
  cursor?: string
): Promise<{ items: HelpRequest[]; next_cursor: string | null }> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (status) params.append('status', status);
  if (cursor) params.append('cursor', cursor);
  const response = await fetch(`${API_BASE}/help-requests?${params}`);
  if (!response.ok) throw new Error('Failed to list help requests');
  return response.json();
}

// Get single help request
export async function getHelpRequest(id: string): Promise<HelpRequest> {
  const response = await fetch(`${API_BASE}/help-requests/${id}`);
  if (!response.ok) throw new Error('Failed to get help request');
  return response.json();
}

// Resolve help request (supervisor)
export async function resolveHelpRequest(
  id: string,
  answer: string,
  resolver: string
) {
  const response = await fetch(`${API_BASE}/help-requests/${id}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer, resolver }),
  });
  if (!response.ok) throw new Error('Failed to resolve help request');
  return response.json();
}

// Query knowledge base
export async function queryKnowledgeBase(question: string) {
  const response = await fetch(`${API_BASE}/kb/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error('Failed to query knowledge base');
  return response.json();
}
