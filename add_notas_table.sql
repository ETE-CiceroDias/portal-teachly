-- ────────────────────────────────────────────────────────────
-- NOTAS DOS ALUNOS — Execute no SQL Editor do Supabase
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notas_alunos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id        UUID REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_id        UUID REFERENCES alunos_frequencia(id) ON DELETE CASCADE,
  atividade_id    TEXT NOT NULL,        -- UUID de atividades OU '__vitrine__'
  nota            NUMERIC(4,1),
  criterio1       NUMERIC(4,1),
  criterio2       NUMERIC(4,1),
  criterio3       NUMERIC(4,1),
  status          TEXT DEFAULT 'pendente',  -- 'pendente' | 'entregue' | 'avaliado'
  obs             TEXT,
  atualizado_em   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, aluno_id, atividade_id)
);

ALTER TABLE notas_alunos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_do_professor" ON notas_alunos
  USING (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  )
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  );
