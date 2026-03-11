-- ── Corrige a tabela alunos_frequencia caso não exista ──────────
CREATE TABLE IF NOT EXISTS alunos_frequencia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id    UUID REFERENCES turmas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  matricula   TEXT,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE alunos_frequencia ENABLE ROW LEVEL SECURITY;

-- Remove policy antiga se existir e recria corretamente
DROP POLICY IF EXISTS "alunos_freq_do_professor" ON alunos_frequencia;
CREATE POLICY "alunos_freq_do_professor" ON alunos_frequencia
  USING  (turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid()))
  WITH CHECK (turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid()));

-- Força o PostgREST a recarregar o schema cache
NOTIFY pgrst, 'reload schema';
