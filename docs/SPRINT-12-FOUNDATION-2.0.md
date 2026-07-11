# Sprint 12 — Foundation 2.0

## Objetivo

Desacoplar Firebase e o ciclo de persistência da interface React sem alterar a experiência visível nem migrar os dados existentes.

## Arquitetura

- `src/storage/firebaseStorage.js`: único ponto de inicialização do Firebase; expõe autenticação e o repositório do estado.
- `src/storage/useTradingState.js`: coordena hidratação, status de sincronização e autosave com debounce.
- `src/storage/stateCompatibility.js`: normaliza documentos legados preservando campos desconhecidos e o comportamento histórico do workspace Lucid.
- `src/main.jsx`: permanece responsável por composição visual e regras funcionais existentes, mas não conhece Firestore nem Firebase Auth diretamente.

## Compatibilidade

O caminho e o formato de persistência continuam exatamente os mesmos:

```text
users/{uid}/foundation/state
```

Não há migração, renomeação de campos ou divisão de documentos nesta sprint. `settings`, `workspaces`, `accounts`, `operations`, `sessions`, `activeSession` e campos desconhecidos continuam sendo lidos e gravados no formato atual. Backups JSON atuais continuam compatíveis.

## Sincronização

O estado recebido do Firestore recebe uma fingerprint antes de ser entregue à interface. O autosave ignora esse estado hidratado e grava apenas mudanças locais. O adaptador também mantém uma janela limitada das fingerprints gravadas localmente e não devolve seus próprios snapshots para a interface. Isso impede tanto o ciclo de gravações quanto a restauração de uma edição antiga enquanto uma alteração local mais recente aguarda o debounce.

O debounce de 500 ms, os textos de status e o `setDoc(..., { merge: true })` foram preservados.

## Testes

Os testes de compatibilidade usam o test runner nativo do Node e verificam preservação de coleções, campos futuros, configurações padrão e compatibilidade com documentos anteriores ao workspace Lucid.

## Fora do escopo

A separação do documento monolítico em coleções, migrations versionadas e Firestore Security Rules são próximas etapas. Fazê-las agora violaria o requisito de compatibilidade integral e exigiria uma migração de produção.
