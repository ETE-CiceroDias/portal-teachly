-- Tabela de aulas planejadas (planejamento × execução)
CREATE TABLE IF NOT EXISTS aulas_planejadas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  turma_id        UUID NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id   UUID NOT NULL,
  aula_id         TEXT NOT NULL,
  aula_titulo     TEXT NOT NULL,
  data_planejada  DATE NOT NULL,
  hora            TEXT DEFAULT '18:40',
  obs             TEXT DEFAULT '',
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE aulas_planejadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planejadas_do_professor" ON aulas_planejadas;
CREATE POLICY "planejadas_do_professor" ON aulas_planejadas
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

NOTIFY pgrst, 'reload schema';
