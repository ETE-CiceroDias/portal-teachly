# ClassFlow — versão Supabase

## Primeiros passos

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
Renomeie `.env.example` para `.env` e preencha:
- `VITE_SUPABASE_URL` → sua URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` → Settings → API → anon key

### 3. Criar banco de dados
Cole o conteúdo de `teachly_schema.sql` no SQL Editor do Supabase e clique em Run.

### 4. Criar usuário
No Supabase → Authentication → Users → Add user
Use o e-mail e senha que vai usar no login.

### 5. Rodar o projeto
```bash
npm run dev
```

## O que mudou em relação à versão anterior
- `localStorage` substituído pelo Supabase (banco de dados real)
- Login agora usa e-mail + senha via Supabase Auth
- `storage.js` reescrito com funções async
- `App.jsx` e `Login.jsx` atualizados
- `Profile.jsx` atualizado

## Arquivos novos
- `src/lib/supabase.js` — conexão com o banco
- `src/store/storage.js` — substituição completa do storage antigo
