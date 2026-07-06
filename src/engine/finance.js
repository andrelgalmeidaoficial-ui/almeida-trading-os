export function accountNet({ initialResult = 0, result = 0, withdrawals = 0 }) {
  return Number(initialResult || 0) + Number(result || 0) - Number(withdrawals || 0);
}

export function accountHealth({ net = 0, safetyBuffer = 0 }) {
  const buffer = Math.max(Number(safetyBuffer || 0), 1500);
  if (Number(net || 0) >= buffer) return 'Saudável';
  if (Number(net || 0) >= 500) return 'Atenção';
  return 'Risco';
}
