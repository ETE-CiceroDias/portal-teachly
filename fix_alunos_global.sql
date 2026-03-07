-- ── Corrige RLS da tabela alunos (faltava WITH CHECK) ───────────
DROP POLICY IF EXISTS "alunos_da_org" ON alunos;
CREATE POLICY "alunos_da_org" ON alunos
  USING (
    organizacao_id IN (
      SELECT organizacao_id FROM membros_organizacao WHERE usuario_id = auth.uid()
    )
  )
  WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM membros_organizacao WHERE usuario_id = auth.uid()
    )
  );

-- ── Corrige RLS da tabela matriculas (faltava WITH CHECK) ────────
DROP POLICY IF EXISTS "matriculas_do_professor" ON matriculas;
CREATE POLICY "matriculas_do_professor" ON matriculas
  USING (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  )
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  );

-- ── Corrige RLS de aulas_frequencia (faltava WITH CHECK) ────────
DROP POLICY IF EXISTS "frequencia_do_professor" ON aulas_frequencia;
CREATE POLICY "frequencia_do_professor" ON aulas_frequencia
  USING (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  )
  WITH CHECK (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';
