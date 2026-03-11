// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
//  Arquivo de conexão com o Supabase
//
//  Como usar:
//  1. Crie um arquivo .env na raiz do projeto com:
//       VITE_SUPABASE_URL=https://pxvidrnuxkbwwarqfkws.supabase.co
//       VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
//
//  2. A anon key fica em: Supabase → Settings → API → Project API keys
//
//  3. NUNCA commite o .env no git. Adicione ao .gitignore:
//       .env
//       .env.local
// ─────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Faltam as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.\n' +
    'Crie um arquivo .env na raiz do projeto com essas chaves.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────────
//  Helper: retorna o usuário logado ou null
// ─────────────────────────────────────────────────────────────
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
