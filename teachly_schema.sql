-- ============================================================
--  TEACHLY — Schema completo do banco de dados
--  Cole tudo isso no SQL Editor do Supabase e clique em "Run"
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. USUÁRIOS (espelho da tabela auth.users do Supabase)
--    Criada automaticamente quando alguém se cadastra,
--    mas precisamos de uma tabela pública para dados extras.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT,
  email       TEXT,
  avatar_url  TEXT,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

-- Trigger: cria linha em "usuarios" automaticamente quando
-- alguém se registra pelo Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 2. ORGANIZAÇÕES (escolas, instituições)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            TEXT NOT NULL,
  slug            TEXT UNIQUE NOT NULL,
  cidade          TEXT,
  estado          CHAR(2),
  tipo            TEXT,                         -- 'escola' | 'curso_livre' | etc
  logo_url        TEXT,
  codigo_convite  CHAR(6) DEFAULT substring(gen_random_uuid()::text, 1, 6),
  criado_por      UUID REFERENCES usuarios(id),
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 3. MEMBROS (professor ↔ organização)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS membros_organizacao (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id   UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
  usuario_id       UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  papel            TEXT DEFAULT 'professor',    -- 'admin' | 'professor'
  entrou_em        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organizacao_id, usuario_id)
);


-- ────────────────────────────────────────────────────────────
-- 4. DISCIPLINAS (planos de ensino com blocos de aulas)
--    blocos é JSONB porque o conteúdo das aulas é rico e
--    não precisa ser consultado por coluna individualmente.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disciplinas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id  UUID REFERENCES organizacoes(id),
  professor_id    UUID REFERENCES usuarios(id),
  nome            TEXT NOT NULL,
  codigo          TEXT,                         -- ex: 'DE_232'
  carga_horaria   INTEGER,                      -- em horas
  descricao       TEXT,
  avaliacao       TEXT,
  banner_url      TEXT,
  cor_destaque    CHAR(7) DEFAULT '#7C3AED',
  visibilidade    TEXT DEFAULT 'privada',       -- 'privada' | 'publica'
  blocos          JSONB DEFAULT '[]',           -- conteúdo completo das aulas
  criado_em       TIMESTAMPTZ DEFAULT now(),
  atualizado_em   TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 5. ALUNOS (únicos por organização, reutilizados em turmas)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alunos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id  UUID REFERENCES organizacoes(id),
  nome            TEXT NOT NULL,
  matricula       TEXT,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organizacao_id, matricula)
);


-- ────────────────────────────────────────────────────────────
-- 6. TURMAS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS turmas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id  UUID REFERENCES organizacoes(id),
  professor_id    UUID REFERENCES usuarios(id),
  disciplina_id   UUID REFERENCES disciplinas(id),
  label           TEXT NOT NULL,               -- ex: 'Turma A', 'Módulo 1'
  modulo          TEXT,
  ano             TEXT,
  periodo         TEXT,                        -- ex: 'Março – Julho'
  cor             CHAR(7),
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 7. MATRÍCULA ALUNO → TURMA
--    Aluno pode estar em várias turmas
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS matriculas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id    UUID REFERENCES turmas(id) ON DELETE CASCADE,
  aluno_id    UUID REFERENCES alunos(id) ON DELETE CASCADE,
  entrou_em   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, aluno_id)
);


-- ────────────────────────────────────────────────────────────
-- 8. GRUPOS (dentro de uma turma)
--    membros é JSONB: [{ nome, papel, matricula }]
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS grupos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id        UUID REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id    UUID REFERENCES usuarios(id),
  nome            TEXT,
  descricao       TEXT,
  membros         JSONB DEFAULT '[]',
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 9. FREQUÊNCIA — aulas registradas
--    Uma linha por "chamada" (aula realizada em uma data)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aulas_frequencia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id        UUID REFERENCES turmas(id) ON DELETE CASCADE,
  disciplina_id   UUID REFERENCES disciplinas(id),
  disciplina_nome TEXT,
  data            DATE NOT NULL,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, data)
);

-- ────────────────────────────────────────────────────────────
-- 10. FREQUÊNCIA — presenças por aluno
--     Uma linha por aluno por aula
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS presencas (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_frequencia_id    UUID REFERENCES aulas_frequencia(id) ON DELETE CASCADE,
  aluno_id              UUID REFERENCES alunos(id) ON DELETE CASCADE,
  aluno_local_id        UUID REFERENCES alunos_frequencia(id) ON DELETE CASCADE,
  presente              BOOLEAN DEFAULT false,
  UNIQUE(aula_frequencia_id, aluno_local_id)
);



-- ────────────────────────────────────────────────────────────
-- 10b. ALUNOS DE FREQUÊNCIA (lista local por turma)
--      Separado de "alunos" pois não requer matrícula formal
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alunos_frequencia (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id    UUID REFERENCES turmas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  matricula   TEXT,
  criado_em   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE alunos_frequencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alunos_freq_do_professor" ON alunos_frequencia
  USING (turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid()));

-- ────────────────────────────────────────────────────────────
-- 11. ATIVIDADES E PROJETOS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS atividades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID REFERENCES usuarios(id),
  organizacao_id  UUID REFERENCES organizacoes(id),
  titulo          TEXT NOT NULL,
  tipo            TEXT DEFAULT 'atividade',    -- 'atividade' | 'projeto' | 'prova' | 'entrega'
  descricao       TEXT,
  imagem_url      TEXT,
  link            TEXT,
  prazo           DATE,
  aviso_dias      INTEGER DEFAULT 3,           -- avisar X dias antes do prazo
  turmas          JSONB DEFAULT '[]',          -- lista de turma_ids ou labels
  criado_em       TIMESTAMPTZ DEFAULT now(),
  atualizado_em   TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 12. HORÁRIO SEMANAL
--     Uma linha por célula da grade (dia × horário)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS horario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID REFERENCES usuarios(id),
  organizacao_id  UUID REFERENCES organizacoes(id),
  dia             TEXT NOT NULL,               -- 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex'
  hora_inicio     TEXT NOT NULL,               -- '18:40' | '19:30' | '20:20'
  turma_label     TEXT,
  disciplina      TEXT,
  obs             TEXT,
  criado_em       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professor_id, dia, hora_inicio)
);


-- ────────────────────────────────────────────────────────────
-- 13. CALENDÁRIO — eventos
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_calendario (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID REFERENCES usuarios(id),
  turma_id        UUID REFERENCES turmas(id),
  data            DATE NOT NULL,
  titulo          TEXT NOT NULL,
  tipo            TEXT DEFAULT 'aula',         -- 'aula' | 'prova' | 'feriado' | 'outro'
  cor             CHAR(7),
  obs             TEXT,
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 14. DESAFIO UX — acompanhamento individual por turma
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS desafio_ux (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id        UUID REFERENCES turmas(id) ON DELETE CASCADE,
  professor_id    UUID REFERENCES usuarios(id),
  prazo           DATE,
  criado_em       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS desafio_ux_alunos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desafio_id      UUID REFERENCES desafio_ux(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  grupo           TEXT,
  linkedin        TEXT,
  app             TEXT,                        -- link/nome do app criado
  status          TEXT DEFAULT 'pendente',     -- 'pendente' | 'entregue' | 'avaliado'
  nota            NUMERIC(4,1),
  obs             TEXT,
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 15. LINKS ÚTEIS
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID REFERENCES usuarios(id),
  titulo          TEXT NOT NULL,
  url             TEXT NOT NULL,
  categoria       TEXT,
  cor             CHAR(7),
  criado_em       TIMESTAMPTZ DEFAULT now()
);


-- ────────────────────────────────────────────────────────────
-- 16. ESTADO DAS AULAS (aula concluída, problemas, notas)
--     Equivale ao classflow_data_v1 do localStorage
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS estado_aulas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id    UUID REFERENCES usuarios(id),
  turma_id        UUID REFERENCES turmas(id),
  disciplina_key  TEXT NOT NULL,               -- ex: 'dcu'
  aula_id         TEXT NOT NULL,               -- ex: 'AULA_01'
  done            BOOLEAN DEFAULT false,
  problems        JSONB DEFAULT '[]',          -- lista de problemas registrados
  notas           TEXT,
  atualizado_em   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professor_id, turma_id, disciplina_key, aula_id)
);


-- ════════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY (RLS)
--  Cada professor só enxerga os próprios dados.
--  Ative isso DEPOIS de testar se as tabelas estão corretas.
-- ════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE membros_organizacao     ENABLE ROW LEVEL SECURITY;
ALTER TABLE disciplinas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alunos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE turmas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE matriculas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas_frequencia        ENABLE ROW LEVEL SECURITY;
ALTER TABLE presencas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades              ENABLE ROW LEVEL SECURITY;
ALTER TABLE horario                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_calendario      ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafio_ux              ENABLE ROW LEVEL SECURITY;
ALTER TABLE desafio_ux_alunos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE links                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE estado_aulas            ENABLE ROW LEVEL SECURITY;

-- ── Políticas: cada um vê/edita só o que é seu ──────────────

-- usuarios: cada um vê e edita o próprio perfil
CREATE POLICY "usuario_proprio" ON usuarios
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- organizacoes: membros da org enxergam a org
CREATE POLICY "membros_veem_org" ON organizacoes
  USING (
    id IN (
      SELECT organizacao_id FROM membros_organizacao
      WHERE usuario_id = auth.uid()
    )
  );

-- membros_organizacao: vê os da mesma org
CREATE POLICY "membros_da_mesma_org" ON membros_organizacao
  USING (
    organizacao_id IN (
      SELECT organizacao_id FROM membros_organizacao
      WHERE usuario_id = auth.uid()
    )
  );

-- disciplinas: professor dono ou membro da org
CREATE POLICY "disciplinas_do_professor" ON disciplinas
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- alunos: professor da org
CREATE POLICY "alunos_da_org" ON alunos
  USING (
    organizacao_id IN (
      SELECT organizacao_id FROM membros_organizacao
      WHERE usuario_id = auth.uid()
    )
  );

-- turmas: professor dono
CREATE POLICY "turmas_do_professor" ON turmas
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- matriculas: via turma do professor
CREATE POLICY "matriculas_do_professor" ON matriculas
  USING (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  );

-- grupos
CREATE POLICY "grupos_do_professor" ON grupos
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- aulas_frequencia: via turma
CREATE POLICY "frequencia_do_professor" ON aulas_frequencia
  USING (
    turma_id IN (SELECT id FROM turmas WHERE professor_id = auth.uid())
  );

-- presencas: via aula_frequencia → turma
CREATE POLICY "presencas_do_professor" ON presencas
  USING (
    aula_frequencia_id IN (
      SELECT af.id FROM aulas_frequencia af
      JOIN turmas t ON t.id = af.turma_id
      WHERE t.professor_id = auth.uid()
    )
  );

-- atividades
CREATE POLICY "atividades_do_professor" ON atividades
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- horario
CREATE POLICY "horario_do_professor" ON horario
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- calendario
CREATE POLICY "eventos_do_professor" ON eventos_calendario
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- desafio_ux
CREATE POLICY "desafio_do_professor" ON desafio_ux
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- desafio_ux_alunos: via desafio
CREATE POLICY "desafio_alunos_do_professor" ON desafio_ux_alunos
  USING (
    desafio_id IN (
      SELECT id FROM desafio_ux WHERE professor_id = auth.uid()
    )
  );

-- links
CREATE POLICY "links_do_professor" ON links
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

-- estado_aulas
CREATE POLICY "estado_do_professor" ON estado_aulas
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());
