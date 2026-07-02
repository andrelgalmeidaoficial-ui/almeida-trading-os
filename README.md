# Almeida Trading OS Cloud

Versão com React + Firebase.

## Como testar localmente

1. Extraia o ZIP.
2. Abra a pasta no VS Code.
3. Rode:

```bash
npm install
npm run dev
```

4. Abra o link do terminal, normalmente http://localhost:5173

## Firebase

Este projeto já está configurado para o Firebase:
- projectId: almeida-capital-pro
- Auth: Email/Password
- Firestore: users/{uid}/tradingOS/state

## Regras do Firestore

Use:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Publicação

Pode publicar no Vercel:
- importar projeto
- build command: npm run build
- output: dist


## v1.1

- Editar/excluir contas
- Editar/excluir avaliações
- Editar/excluir operações
- Remoção automática de operações vinculadas quando conta/avaliação é excluída


## v1.2 CRUD completo

- Editar/excluir projetos
- Editar/excluir contas
- Editar/excluir avaliações
- Editar/excluir operações
- Campos renomeados para maior clareza
