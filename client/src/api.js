const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return data;
}

export function getSessionId() {
  const KEY = 'pawswipe_session_id';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function fetchItems() {
  return request('/api/items');
}

export function submitVote(itemId, choice) {
  return request('/api/vote', {
    method: 'POST',
    body: JSON.stringify({
      itemId,
      choice,
      sessionId: getSessionId(),
    }),
  });
}

export function deleteVote(itemId) {
  return request('/api/vote', {
    method: 'DELETE',
    body: JSON.stringify({
      itemId,
      sessionId: getSessionId(),
    }),
  });
}

export function fetchResults() {
  return request('/api/results');
}

export function fetchSessionVotes() {
  const sessionId = getSessionId();
  return request(`/api/session/${encodeURIComponent(sessionId)}/votes`);
}
