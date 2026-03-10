// src/store/storage.js  ←  versão Supabase
// ─────────────────────────────────────────────────────────────
//  Substitui o localStorage pelo banco de dados Supabase.
//  A API é parecida com a anterior, mas as funções agora são
//  async (precisam de await onde forem chamadas).
//
//  INSTALAÇÃO:
//    npm install @supabase/supabase-js
// ─────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabase.js';


// ════════════════════════════════════════════════════════════
//  AUTH — Login / Logout / Sessão
//  Substitui: isAuthed(), setAuth(), senha hardcoded
// ════════════════════════════════════════════════════════════

export const Auth = {

  // Retorna o usuário logado (ou null se não estiver logado)
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // Login com email + senha
  // Uso: await Auth.signIn('samara@escola.com', 'minhasenha')
  async signIn(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data.user;
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Ouvir mudanças de sessão (login/logout automático)
  // Uso: Auth.onAuthChange((user) => setAuthed(!!user))
  onAuthChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => callback(session?.user ?? null)
    );
    return subscription; // chame subscription.unsubscribe() para limpar
  },
};


// ════════════════════════════════════════════════════════════
//  PERFIL DO PROFESSOR
//  Substitui: loadProfile(), saveProfile()
// ════════════════════════════════════════════════════════════

export const Profile = {

  async load() {
    const user = await Auth.getUser();
    if (!user) return {};
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) { console.error(error); return {}; }
    return data;
  },

  async save(perfil) {
    const user = await Auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('usuarios')
      .upsert({ id: user.id, ...perfil });
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  GRUPOS
//  Substitui: loadGrupos(), saveGrupos()
// ════════════════════════════════════════════════════════════

export const Grupos = {

  // Carrega todos os grupos de uma turma
  // Uso: const grupos = await Grupos.loadByTurma(turmaId)
  async loadByTurma(turmaId) {
    const { data, error } = await supabase
      .from('grupos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('criado_em');
    if (error) { console.error(error); return []; }
    return data;
  },

  // Salva/atualiza um grupo
  async save(grupo) {
    const user = await Auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('grupos')
      .upsert({ ...grupo, professor_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Remove um grupo
  async delete(grupoId) {
    const { error } = await supabase
      .from('grupos')
      .delete()
      .eq('id', grupoId);
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  FREQUÊNCIA
//  Substitui: teachly_freq_v1 no localStorage
// ════════════════════════════════════════════════════════════

export const Frequencia = {

  // Retorna as aulas registradas de uma turma
  async loadAulas(turmaId) {
    const { data, error } = await supabase
      .from('aulas_frequencia')
      .select('*')
      .eq('turma_id', turmaId)
      .order('data');
    if (error) { console.error(error); return []; }
    return data;
  },

  // Adiciona uma nova data de aula
  async addAula(turmaId, data, disciplinaId = null) {
    const { data: row, error } = await supabase
      .from('aulas_frequencia')
      .insert({ turma_id: turmaId, data, disciplina_id: disciplinaId })
      .select()
      .single();
    if (error) throw error;
    return row;
  },

  // Remove uma aula (e as presenças em cascata)
  async deleteAula(aulaId) {
    const { error } = await supabase
      .from('aulas_frequencia')
      .delete()
      .eq('id', aulaId);
    if (error) throw error;
  },

  // Carrega presenças de uma aula
  async loadPresencas(aulaId) {
    const { data, error } = await supabase
      .from('presencas')
      .select('*, alunos(nome, matricula)')
      .eq('aula_frequencia_id', aulaId);
    if (error) { console.error(error); return []; }
    return data;
  },

  // Marca/desmarca presença de um aluno
  async togglePresenca(aulaId, alunoId, presente) {
    const { error } = await supabase
      .from('presencas')
      .upsert({ aula_frequencia_id: aulaId, aluno_id: alunoId, presente });
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  ALUNOS
// ════════════════════════════════════════════════════════════

export const Alunos = {

  async loadByTurma(turmaId) {
    const { data, error } = await supabase
      .from('matriculas')
      .select('alunos(*)')
      .eq('turma_id', turmaId);
    if (error) { console.error(error); return []; }
    return data.map(m => m.alunos);
  },

  async add(orgId, nome, matricula) {
    const { data, error } = await supabase
      .from('alunos')
      .upsert({ organizacao_id: orgId, nome, matricula })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async matricular(turmaId, alunoId) {
    const { error } = await supabase
      .from('matriculas')
      .insert({ turma_id: turmaId, aluno_id: alunoId });
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  ATIVIDADES E PROJETOS
//  Substitui: teachly_atividades_v1
// ════════════════════════════════════════════════════════════

export const Atividades = {

  async load(orgId) {
    const { data, error } = await supabase
      .from('atividades')
      .select('*')
      .eq('organizacao_id', orgId)
      .order('prazo');
    if (error) { console.error(error); return []; }
    return data;
  },

  async save(atividade) {
    const user = await Auth.getUser();
    if (!user) return;
    const payload = {
      ...atividade,
      professor_id: user.id,
      atualizado_em: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('atividades')
      .upsert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('atividades').delete().eq('id', id);
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  HORÁRIO SEMANAL
//  Substitui: loadHorario(), saveHorario()
// ════════════════════════════════════════════════════════════

export const Horario = {

  async load() {
    const user = await Auth.getUser();
    if (!user) return {};
    const { data, error } = await supabase
      .from('horario')
      .select('*')
      .eq('professor_id', user.id);
    if (error) { console.error(error); return {}; }
    // Converte lista → objeto { 'Seg_18:40': { ... } }
    return data.reduce((acc, row) => {
      acc[`${row.dia}_${row.hora_inicio}`] = row;
      return acc;
    }, {});
  },

  async saveCell(dia, hora, turmaLabel, disciplina, obs) {
    const user = await Auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('horario')
      .upsert({
        professor_id: user.id,
        dia,
        hora_inicio: hora,
        turma_label: turmaLabel,
        disciplina,
        obs,
      });
    if (error) throw error;
  },

  async clearCell(dia, hora) {
    const user = await Auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('horario')
      .delete()
      .eq('professor_id', user.id)
      .eq('dia', dia)
      .eq('hora_inicio', hora);
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  CALENDÁRIO / AGENDA
//  Substitui: loadAgenda(), saveAgenda()
// ════════════════════════════════════════════════════════════

export const Agenda = {

  async load(turmaId = null) {
    const user = await Auth.getUser();
    if (!user) return [];
    let query = supabase
      .from('eventos_calendario')
      .select('*')
      .eq('professor_id', user.id)
      .order('data');
    if (turmaId) query = query.eq('turma_id', turmaId);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data;
  },

  async save(evento) {
    const user = await Auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('eventos_calendario')
      .upsert({ ...evento, professor_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('eventos_calendario').delete().eq('id', id);
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  DESAFIO UX
//  Substitui: loadDesafio(), saveDesafio()
// ════════════════════════════════════════════════════════════

export const DesafioUX = {

  async loadByTurma(turmaId) {
    const { data, error } = await supabase
      .from('desafio_ux')
      .select('*, desafio_ux_alunos(*)')
      .eq('turma_id', turmaId)
      .single();
    if (error) return null;
    return data;
  },

  async savePrazo(turmaId, prazo) {
    const user = await Auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('desafio_ux')
      .upsert({ turma_id: turmaId, professor_id: user.id, prazo })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async saveAluno(desafioId, aluno) {
    const { data, error } = await supabase
      .from('desafio_ux_alunos')
      .upsert({ ...aluno, desafio_id: desafioId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAluno(alunoId) {
    const { error } = await supabase
      .from('desafio_ux_alunos')
      .delete()
      .eq('id', alunoId);
    if (error) throw error;
  },
};


// ════════════════════════════════════════════════════════════
//  ESTADO DAS AULAS (aulas concluídas, notas, problemas)
//  Substitui: load(), save() do teachly_data_v1
// ════════════════════════════════════════════════════════════

export const EstadoAulas = {

  // Carrega todo o estado de aulas de uma turma.
  // Retorna um objeto keyed pela stateKey completa: 'dcu_mod1a_AULA_01'
  async load(turmaId) {
    const user = await Auth.getUser();
    if (!user) return {};
    const { data, error } = await supabase
      .from('estado_aulas')
      .select('*')
      .eq('professor_id', user.id)
      .eq('turma_id', turmaId);
    if (error) { console.error('EstadoAulas.load error:', error); return {}; }
    return (data || []).reduce((acc, row) => {
      if (!row.state_key) return acc; // ignora linhas antigas sem state_key
      acc[row.state_key] = {
        done:      row.done      ?? false,
        problems:  row.problems  ?? [],
        nota_prof: row.nota_prof ?? '',
        data_aula: row.data_aula ?? '',
        slide_url: row.slide_url ?? '',
        teoria:    row.teoria    ?? '',
        pratica:   row.pratica   ?? '',
        codealong: row.codealong ?? '',
        recurso:   row.recurso   ?? '',
        conexao:   row.conexao   ?? '',
        obs_prof:  row.obs_prof  ?? '',
        plano_b:   row.plano_b   ?? '',
      };
      return acc;
    }, {});
  },

  // Salva o estado de uma aula usando a stateKey completa como identificador.
  // stateKey = id completo do estado no app, ex: 'dcu_mod1a_AULA_01'
  async save(turmaId, stateKey, updates) {
    const user = await Auth.getUser();
    if (!user) return;
    const allowed = ['done','problems','nota_prof','data_aula','slide_url',
                     'teoria','pratica','codealong','recurso','conexao','obs_prof','plano_b'];
    const safe = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    const ts = new Date().toISOString();

    // Tenta UPDATE primeiro
    const { data: upd, error: errUp } = await supabase
      .from('estado_aulas')
      .update({ atualizado_em: ts, ...safe })
      .eq('professor_id', user.id)
      .eq('turma_id',     turmaId)
      .eq('state_key',    stateKey)
      .select('id');
    if (errUp) { console.error('EstadoAulas.update error:', errUp); throw errUp; }

    // Se não existia, insere
    if (!upd || upd.length === 0) {
      const discKey = stateKey.split('_')[0] || '';
      const { error: errIns } = await supabase
        .from('estado_aulas')
        .insert({
          professor_id:   user.id,
          turma_id:       turmaId,
          state_key:      stateKey,
          disciplina_key: discKey,
          aula_id:        stateKey,
          atualizado_em:  ts,
          ...safe,
        });
      if (errIns) { console.error('EstadoAulas.insert error:', errIns); throw errIns; }
    }
  },
};


// ════════════════════════════════════════════════════════════
//  HELPERS (mantidos da versão anterior para compatibilidade)
// ════════════════════════════════════════════════════════════

export function aulaId(courseKey, turmaKey, aula) {
  return `${courseKey}_${turmaKey}_${aula.id.replace(/\s+/g, '_')}`;
}

export function courseStats(courseKey, turmaKey, allCourses, state) {
  const c = allCourses[courseKey];
  let total = 0, done = 0, problems = 0;
  c.blocos.forEach(b => b.aulas.forEach(a => {
    if (a.id === 'NOTA') return;
    total++;
    const st = state[aulaId(courseKey, turmaKey, a)] || {};
    if (st.done) done++;
    if ((st.problems || []).length > 0) problems++;
  }));
  return { total, done, problems, pct: total ? Math.round(done / total * 100) : 0 };
}

export function globalStats(allCourses, turmaKey, state) {
  let total = 0, done = 0, problems = 0;
  Object.keys(allCourses).forEach(k => {
    const s = courseStats(k, turmaKey, allCourses, state);
    total += s.total; done += s.done; problems += s.problems;
  });
  return { total, done, problems, pct: total ? Math.round(done / total * 100) : 0 };
}

export function getOrderedBlocos(courseKey, turmaKey, allCourses, state) {
  const course = allCourses[courseKey];
  return course.blocos.map((bloco, bi) => {
    const order = state[`${courseKey}_${turmaKey}_order_b${bi}`];
    if (!order) return bloco;
    return { ...bloco, aulas: order.map(i => bloco.aulas[i]).filter(Boolean) };
  });
}