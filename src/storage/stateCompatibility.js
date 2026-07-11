/**
 * Preserves the legacy Foundation document shape while filling fields introduced
 * by newer releases. Unknown fields are intentionally retained for forwards and
 * backwards compatibility with existing backups and Firestore documents.
 */
export function normalizeTradingState(data, initialState) {
  const source = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  const sourceWorkspaces = Array.isArray(source.workspaces) ? source.workspaces : initialState.workspaces;
  const lucid = initialState.workspaces.find(workspace => workspace.id === 'lucid');
  const workspaces = lucid && !sourceWorkspaces.some(workspace => workspace.id === 'lucid')
    ? [...sourceWorkspaces, lucid]
    : sourceWorkspaces;

  return {
    ...initialState,
    ...source,
    settings: { ...initialState.settings, ...(source.settings || {}) },
    workspaces,
    accounts: Array.isArray(source.accounts) ? source.accounts : [],
    operations: Array.isArray(source.operations) ? source.operations : [],
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    activeSession: source.activeSession || null
  };
}

export function stateFingerprint(state) {
  return JSON.stringify(state);
}
