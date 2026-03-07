-- Adiciona colunas novas na tabela anotacoes (se não existirem)
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS tags       JSONB    DEFAULT '[]';
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS arquivada  BOOLEAN  DEFAULT false;
ALTER TABLE anotacoes ADD COLUMN IF NOT EXISTS turma_id   UUID     REFERENCES turmas(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';

-- Toggle ativa para turmas
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT true;
NOTIFY pgrst, 'reload schema';
