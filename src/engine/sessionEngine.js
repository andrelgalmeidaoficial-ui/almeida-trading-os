export function summarizeSession(session, operations = []) {
  const result = operations.reduce((sum, op) => sum + Number(op.result || 0), 0);
  const wins = operations.filter(op => Number(op.result || 0) > 0).length;
  const losses = operations.filter(op => Number(op.result || 0) < 0).length;
  const count = operations.length;
  const winRate = count ? Math.round((wins / count) * 100) : 0;
  return { result, wins, losses, count, winRate };
}
