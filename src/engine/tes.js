export function calculateTES({ execution = 0, emotion = 0, risk = 0, discipline = 0 }) {
  const score = Math.round(
    (Number(execution || 0) * 0.30 +
     Number(risk || 0) * 0.25 +
     Number(discipline || 0) * 0.25 +
     Number(emotion || 0) * 0.20) * 10
  );
  return Number.isFinite(score) ? score : 0;
}

export function getTESLevel(score = 0) {
  if (score >= 91) return 'Elite';
  if (score >= 76) return 'Trader Consistente';
  if (score >= 61) return 'Trader em Evolução';
  if (score >= 41) return 'Operador';
  return 'Aprendiz';
}
