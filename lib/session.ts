// Session management to uniquely identify a client device / browser
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  let sessionId = localStorage.getItem('p2k_lfg_session_id');
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
    localStorage.setItem('p2k_lfg_session_id', sessionId);
  }
  return sessionId;
}
