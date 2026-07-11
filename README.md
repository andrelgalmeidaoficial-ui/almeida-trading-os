# Almeida Trading OS — Sprint 10.5 Pregão Stable Fix

## Foundation 2.0 — Sprint 12

A persistência e a autenticação foram desacopladas da interface sem alterar o formato dos dados em produção. A arquitetura, as garantias de compatibilidade, o ciclo de sincronização e os testes estão documentados em [`docs/SPRINT-12-FOUNDATION-2.0.md`](docs/SPRINT-12-FOUNDATION-2.0.md).

## Correção
- Restaura o fluxo de Iniciar Pregão
- Corrige Reabrir pregão sem quebrar a criação de novo pregão
- Fallback seguro apenas no reabrir
- Base recomendada após erro de tela branca

## Publicar

```bash
npm run dev
git add .
git commit -m "Corrige Pregao Stable Sprint 10.5"
git push
```
