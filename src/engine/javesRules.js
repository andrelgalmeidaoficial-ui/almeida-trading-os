export function javesBrief({ name = 'Trader', tes = 0, totalOps = 0, context = '' }) {
  const ctx = context ? ` no Workspace ${context}` : '';
  if (!totalOps) {
    return `Bom dia, ${name}. Sem histórico suficiente${ctx}. Comece registrando pregões e operações para eu analisar sua evolução.`;
  }
  if (tes >= 85) {
    return `${name}, sua execução está forte${ctx}. Mantenha o plano, proteja o capital e evite aumentar risco sem necessidade.`;
  }
  if (tes >= 60) {
    return `${name}, há evolução${ctx}, mas ainda existe espaço para melhorar disciplina, risco e emocional. Foque em setups A+.`;
  }
  return `${name}, os dados indicam necessidade de reduzir risco${ctx}. Hoje a prioridade é proteger capital e executar apenas setups A+.`;
}
