// Frequencia.jsx — arquivo completo corrigido
import { EmptyState } from '../components/EmptyState.jsx';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { TURMAS, ALUNO_CORES } from '../data/turmas.js';
import { TURMA_IDS } from '../data/ids.js';
import { SquaresFour, ListBullets, CheckCircle, XCircle, Trash } from '@phosphor-icons/react';

async function getAlunosMatriculados(turmaId) {
  const { data } = await supabase
    .from('matriculas')
    .select('aluno_id, alunos(id, nome, matricula)')
    .eq('turma_id', turmaId);
  return (data || []).map(m => ({
    id_global: m.aluno_id,
    nome: m.alunos?.nome || '',
    matricula: m.alunos?.matricula || '',
  })).filter(a => a.nome);
}

async function getAlunosFromGrupos(turmaId) {
  const { data } = await supabase.from('grupos').select('membros').eq('turma_id', turmaId);
  const seen = new Set();
  const alunos = [];
  (data || []).forEach(g => {
    (g.membros || []).forEach(m => {
      if (m.nome && !seen.has(m.nome.toLowerCase().trim())) {
        seen.add(m.nome.toLowerCase().trim());
        alunos.push({ nome: m.nome.trim(), matricula: m.matricula || '' });
      }
    });
  });
  return alunos;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

const initials = (nome) => nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
const fmtDate  = (iso) => iso ? iso.slice(8,10) + '/' + iso.slice(5,7) : '';
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ✅ FIX: chave usa aula.id (UUID) — igual ao que o banco retorna
const presKey = (alunoId, aulaId) => `${alunoId}_${aulaId}`;

export function Frequencia({ activeTurma, turmaKey }) {
  const turma   = TURMAS[turmaKey] || TURMAS[activeTurma];
  const turmaId = activeTurma || TURMA_IDS[turmaKey];

  const [turmaData, setTurmaData] = useState({ alunos: [], aulas: [], presencas: {} });
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: aulasRows } = await supabase
        .from('aulas_frequencia').select('*').eq('turma_id', turmaId).order('data');

      const aulas = (aulasRows || []).map(r => ({ id: r.id, data: r.data, disciplina: r.disciplina_nome || r.disciplina || '' }));

      const aulaIds = aulas.map(a => a.id);
      let presencas = {};
      if (aulaIds.length > 0) {
        const { data: presRows } = await supabase
          .from('presencas').select('*').in('aula_frequencia_id', aulaIds);
        // ✅ FIX: chave agora é aluno_local_id + aula_frequencia_id (ambos UUIDs)
        (presRows || []).forEach(p => {
          presencas[presKey(p.aluno_local_id, p.aula_frequencia_id)] = p.presente;
        });
      }

      const { data: alunosRows } = await supabase
        .from('alunos_frequencia').select('*').eq('turma_id', turmaId).order('criado_em');

      const alunos = (alunosRows || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));

      setTurmaData({ alunos, aulas, presencas });
      setLoading(false);
    }
    load();
  }, [turmaId]);

  const persist = useCallback(async (next) => {
    setTurmaData(next);
  }, []);

  const [showAddAluno, setShowAddAluno] = useState(false);
  const [showAddAula,  setShowAddAula]  = useState(false);
  const [showImport,   setShowImport]   = useState(false);
  const [editAluno,    setEditAluno]    = useState(null);
  const [formAluno,    setFormAluno]    = useState({ nome: '', matricula: '' });
  const [formAula,     setFormAula]     = useState({ data: todayISO(), disciplina: '' });
  const [viewMode,     setViewMode]     = useState('grid');
  const [importSel,    setImportSel]    = useState([]);
  const [syncMsg,      setSyncMsg]      = useState('');
  const [syncing,      setSyncing]      = useState(false);

  const [alunosDoGrupo, setAlunosDoGrupo] = useState([]);
  useEffect(() => { getAlunosFromGrupos(turmaId).then(setAlunosDoGrupo); }, [turmaId]);

  const sincronizarAlunos = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      const matriculados = await getAlunosMatriculados(turmaId);
      if (matriculados.length === 0) {
        setSyncMsg('Nenhum aluno matriculado nesta turma ainda. Vá em Alunos para matricular.');
        setSyncing(false); return;
      }
      const jaExistem = new Set(turmaData.alunos.map(a => a.nome.toLowerCase().trim()));
      const novos = matriculados.filter(a => !jaExistem.has(a.nome.toLowerCase().trim()));
      if (novos.length === 0) {
        setSyncMsg('Lista já está atualizada — todos os alunos matriculados já estão aqui.');
        setSyncing(false); return;
      }
      const paraInserir = novos.map(a => ({ turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' }));
      const { data, error } = await supabase.from('alunos_frequencia').insert(paraInserir).select();
      if (error) throw error;
      const inseridos = (data || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));
      await persist({ ...turmaData, alunos: [...turmaData.alunos, ...inseridos] });
      setSyncMsg(`✓ ${inseridos.length} aluno${inseridos.length > 1 ? 's' : ''} adicionado${inseridos.length > 1 ? 's' : ''} da lista global.`);
    } catch(e) {
      setSyncMsg('Erro ao sincronizar: ' + (e.message || 'verifique sua conexão'));
    } finally { setSyncing(false); }
  };

  const toggleImportSel = (nome) => {
    setImportSel(prev => prev.includes(nome) ? prev.filter(n => n !== nome) : [...prev, nome]);
  };

  const confirmarImport = async () => {
    const jaExistem = new Set(turmaData.alunos.map(a => a.nome.toLowerCase().trim()));
    const paraInserir = alunosDoGrupo.filter(a =>
      importSel.includes(a.nome) && !jaExistem.has(a.nome.toLowerCase().trim())
    ).map(a => ({ turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' }));
    if (paraInserir.length > 0) {
      const { data } = await supabase.from('alunos_frequencia').insert(paraInserir).select();
      const novos = (data || []).map(r => ({ id: r.id, nome: r.nome, matricula: r.matricula || '' }));
      await persist({ ...turmaData, alunos: [...turmaData.alunos, ...novos] });
    }
    setShowImport(false);
    setImportSel([]);
  };

  const [alunoErro,   setAlunoErro]   = useState('');
  const [alunoSaving, setAlunoSaving] = useState(false);

  const adicionarAluno = async () => {
    if (!formAluno.nome.trim()) return;
    setAlunoSaving(true); setAlunoErro('');
    try {
      const { data, error } = await supabase.from('alunos_frequencia')
        .insert({ turma_id: turmaId, nome: formAluno.nome.trim(), matricula: formAluno.matricula.trim() })
        .select().single();
      if (error) throw error;
      if (data) {
        const aluno = { id: data.id, nome: data.nome, matricula: data.matricula || '' };
        await persist({ ...turmaData, alunos: [...turmaData.alunos, aluno] });
        setFormAluno({ nome: '', matricula: '' });
        setShowAddAluno(false);
      }
    } catch(e) {
      setAlunoErro('Erro ao adicionar: ' + (e.message || 'verifique sua conexão'));
    } finally { setAlunoSaving(false); }
  };

  const salvarEdicaoAluno = async () => {
    const aluno = turmaData.alunos[editAluno];
    await supabase.from('alunos_frequencia')
      .update({ nome: formAluno.nome, matricula: formAluno.matricula })
      .eq('id', aluno.id);
    const next = turmaData.alunos.map((a, i) =>
      i === editAluno ? { ...a, nome: formAluno.nome, matricula: formAluno.matricula } : a
    );
    await persist({ ...turmaData, alunos: next });
    setEditAluno(null);
  };

  const excluirAluno = async (i) => {
    if (!confirm(`Remover "${turmaData.alunos[i]?.nome}" da lista?`)) return;
    const aluno = turmaData.alunos[i];
    await supabase.from('alunos_frequencia').delete().eq('id', aluno.id);
    const presencas = { ...turmaData.presencas };
    // ✅ FIX: prefixo correto com UUID do aluno
    Object.keys(presencas).forEach(k => { if (k.startsWith(`${aluno.id}_`)) delete presencas[k]; });
    await persist({ ...turmaData, alunos: turmaData.alunos.filter((_, j) => j !== i), presencas });
  };

  const [aulaErro,   setAulaErro]   = useState('');
  const [aulaSaving, setAulaSaving] = useState(false);

  const adicionarAula = async () => {
    if (!formAula.data) return;
    setAulaSaving(true); setAulaErro('');
    try {
      const { data, error } = await supabase.from('aulas_frequencia')
        .insert({ turma_id: turmaId, data: formAula.data, disciplina: formAula.disciplina })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error(`Já existe uma aula registrada em ${formAula.data}. Escolha outra data.`);
        throw error;
      }
      if (data) {
        const aula = { id: data.id, data: data.data, disciplina: formAula.disciplina };
        await persist({ ...turmaData, aulas: [...turmaData.aulas, aula] });
        setFormAula({ data: todayISO(), disciplina: '' });
        setShowAddAula(false);
      }
    } catch(e) {
      setAulaErro(e.message || 'Erro ao registrar aula. Verifique sua conexão.');
    } finally { setAulaSaving(false); }
  };

  const excluirAula = async (i) => {
    if (!confirm('Remover esta aula do registro?')) return;
    const aula = turmaData.aulas[i];
    await supabase.from('aulas_frequencia').delete().eq('id', aula.id);
    const presencas = { ...turmaData.presencas };
    // ✅ FIX: usa aula.id (UUID) para limpar presenças
    Object.keys(presencas).forEach(k => { if (k.endsWith(`_${aula.id}`)) delete presencas[k]; });
    await persist({ ...turmaData, aulas: turmaData.aulas.filter((_, j) => j !== i), presencas });
  };

  // ✅ FIX: togglePresenca e isPresente agora usam aula.id em vez de aulaIdx
  const togglePresenca = async (alunoId, aulaId) => {
    const k = presKey(alunoId, aulaId);
    const presente = !turmaData.presencas[k];
    const { error } = await supabase.from('presencas').upsert(
      { aula_frequencia_id: aulaId, aluno_local_id: alunoId, presente },
      { onConflict: 'aula_frequencia_id,aluno_local_id' }
    );
    if (error) { console.error('Erro ao salvar presença:', error); return; }
    const presencas = { ...turmaData.presencas, [k]: presente };
    setTurmaData(prev => ({ ...prev, presencas }));
  };

  const isPresente = (alunoId, aulaId) => !!turmaData.presencas[presKey(alunoId, aulaId)];

  // ✅ FIX: stats usa aula.id, e turmaData está nas dependências corretas
  const stats = useMemo(() => {
    return turmaData.alunos.map(a => {
      const total    = turmaData.aulas.length;
      const presente = turmaData.aulas.filter(au => isPresente(a.id, au.id)).length;
      const pct      = total > 0 ? Math.round(presente / total * 100) : 100;
      return { ...a, total, presente, ausente: total - presente, pct };
    });
  }, [turmaData]);

  const mediaFreq = stats.length > 0
    ? Math.round(stats.reduce((s, a) => s + a.pct, 0) / stats.length)
    : 100;

  // ✅ FIX: marcarTodos usa aula.id em vez de aulaIdx
  const marcarTodos = async (aulaIdx, valor) => {
    const aula = turmaData.aulas[aulaIdx];
    const upserts = turmaData.alunos.map(a => ({
      aula_frequencia_id: aula.id, aluno_local_id: a.id, presente: valor,
    }));
    if (upserts.length > 0) {
      const { error } = await supabase.from('presencas').upsert(upserts, { onConflict: 'aula_frequencia_id,aluno_local_id' });
      if (error) { console.error('Erro ao salvar presenças em massa:', error); return; }
    }
    const presencas = { ...turmaData.presencas };
    turmaData.alunos.forEach(a => { presencas[presKey(a.id, aula.id)] = valor; });
    setTurmaData(prev => ({ ...prev, presencas }));
  };

  const aulas  = turmaData.aulas;
  const alunos = turmaData.alunos;

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Frequência</div>
          <div className="page-subtitle">
            {turma?.modulo} · {turma?.label} · {alunos.length} aluno{alunos.length !== 1 ? 's' : ''} · {aulas.length} aula{aulas.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-ghost" onClick={sincronizarAlunos} disabled={syncing} title="Importa automaticamente os alunos matriculados nesta turma">
            {syncing ? 'Sincronizando…' : '↻ Sincronizar alunos'}
          </button>
          {alunosDoGrupo.length > 0 && (
            <button className="btn-ghost" onClick={() => { setImportSel([]); setShowImport(true); }}>
              Importar de grupos
            </button>
          )}
          <button className="btn-ghost" onClick={() => { setFormAluno({ nome: '', matricula: '' }); setShowAddAluno(true); }}>
            + Aluno manual
          </button>
          <button className="btn-primary" onClick={() => { setFormAula({ data: todayISO(), disciplina: '' }); setAulaErro(''); setShowAddAula(true); }}>
            + Registrar aula
          </button>
        </div>
      </div>

      {syncMsg && (
        <div style={{
          background: syncMsg.startsWith('✓') ? 'var(--green-bg)' : 'var(--amber-bg)',
          border: `1px solid ${syncMsg.startsWith('✓') ? 'var(--green-border)' : 'var(--amber-border)'}`,
          borderRadius: 10, padding: '10px 16px',
          color: syncMsg.startsWith('✓') ? 'var(--green)' : 'var(--amber)',
          fontSize: '0.85rem', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {syncMsg}
          <button onClick={() => setSyncMsg('')} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontSize:16, padding:'0 4px' }}>×</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Alunos',      val: alunos.length,                         c: 'var(--accent-light)' },
          { label: 'Aulas',       val: aulas.length,                          c: 'var(--text2)' },
          { label: 'Freq. média', val: `${mediaFreq}%`,                       c: mediaFreq >= 75 ? 'var(--green)' : 'var(--red)' },
          { label: 'Risco',       val: stats.filter(a => a.pct < 75).length,  c: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', padding: '12px 18px', minWidth: 90,
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginBottom: 3 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: s.c }}>{s.val}</div>
          </div>
        ))}
      </div>

      {alunos.length === 0 ? (
        <EmptyState icon="📋" title="Nenhum aluno cadastrado"
          desc="Adicione os alunos da turma para começar a registrar a frequência."
          action="+ Adicionar primeiro aluno" onAction={() => setShowAddAluno(true)} />
      ) : aulas.length === 0 ? (
        <div>
          <div className="section-label">Alunos cadastrados</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {alunos.map((a, i) => {
              const cor = ALUNO_CORES[i % ALUNO_CORES.length];
              return (
                <div key={a.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)', padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', minWidth: 20, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                  <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text }}>
                    {initials(a.nome)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{a.nome}</div>
                    {a.matricula && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Matrícula: {a.matricula}</div>}
                  </div>
                  <button className="icon-btn-sm" onClick={() => { setEditAluno(i); setFormAluno({ nome: a.nome, matricula: a.matricula || '' }); }}>✏️</button>
                  <button className="icon-btn-sm danger" onClick={() => excluirAluno(i)} style={{display:"flex",alignItems:"center",justifyContent:"center"}}><Trash size={13} /></button>
                </div>
              );
            })}
          </div>
          <div style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>
            Clique em "+ Registrar aula" para começar o controle de frequência.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {[['grid', <SquaresFour size={14} />, 'Grade'], ['list', <ListBullets size={14} />, 'Resumo']].map(([v, icon, l]) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                style={{
                  padding: '6px 16px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600,
                  border: '1px solid', cursor: 'pointer',
                  borderColor: viewMode === v ? 'var(--accent)' : 'var(--border)',
                  background: viewMode === v ? 'var(--accent-faint)' : 'transparent',
                  color: viewMode === v ? 'var(--accent-light)' : 'var(--text3)',
                  transition: 'all 0.15s',
                }}
              ><span style={{display:'flex',alignItems:'center',gap:5}}>{icon}{l}</span></button>
            ))}
          </div>

          {viewMode === 'grid' ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.8125rem', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '8px 0 0 0', textAlign: 'left', color: 'var(--text3)', fontWeight: 700, position: 'sticky', left: 0, zIndex: 2, minWidth: 160 }}>
                      Aluno
                    </th>
                    {aulas.map((au, i) => (
                      <th key={au.id} style={{ padding: '8px 6px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text2)', fontWeight: 600, minWidth: 64 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{fmtDate(au.data)}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--accent-light)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>{au.disciplina || '—'}</div>
                        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 4 }}>
                          <button title="Marcar todos presente" onClick={() => marcarTodos(i, true)}
                            style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)', cursor: 'pointer' }}>✓</button>
                          <button title="Marcar todos ausente" onClick={() => marcarTodos(i, false)}
                            style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)', cursor: 'pointer' }}>✗</button>
                          <button title="Remover aula" onClick={() => excluirAula(i)}
                            style={{ fontSize: 10, padding: '1px 4px', borderRadius: 3, background: 'var(--surface3)', color: 'var(--text3)', border: '1px solid var(--border)', cursor: 'pointer' }}><Trash size={13} /></button>
                        </div>
                      </th>
                    ))}
                    <th style={{ padding: '10px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text3)', fontWeight: 700, borderRadius: '0 8px 0 0', minWidth: 70 }}>
                      %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((a, ri) => {
                    const cor = ALUNO_CORES[ri % ALUNO_CORES.length];
                    const riskColor = a.pct < 75 ? 'var(--red)' : a.pct < 85 ? 'var(--amber)' : 'var(--green)';
                    return (
                      <tr key={a.id}>
                        <td style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', position: 'sticky', left: 0, zIndex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text3)', minWidth: 18, textAlign: 'right', flexShrink: 0 }}>#{ri + 1}</div>
                            <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text, width: 26, height: 26, fontSize: '0.7rem' }}>
                              {initials(a.nome)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, color: 'var(--text)' }}>{a.nome}</div>
                              {a.matricula && <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>{a.matricula}</div>}
                            </div>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: 3 }}>
                              <button className="icon-btn-sm" style={{ width: 22, height: 22, fontSize: 11 }} onClick={() => { setEditAluno(ri); setFormAluno({ nome: a.nome, matricula: a.matricula || '' }); }}>✏️</button>
                              <button className="icon-btn-sm danger" style={{ width: 22, height: 22, display:"flex",alignItems:"center",justifyContent:"center" }} onClick={() => excluirAluno(ri)}><Trash size={11} /></button>
                            </div>
                          </div>
                        </td>
                        {aulas.map((au) => {
                          // ✅ FIX: passa au.id em vez do índice
                          const pres = isPresente(a.id, au.id);
                          return (
                            <td
                              key={au.id}
                              style={{ padding: 6, border: '1px solid var(--border)', textAlign: 'center', background: pres ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.04)', cursor: 'pointer' }}
                              onClick={() => togglePresenca(a.id, au.id)}
                              title={pres ? 'Presente — clique para marcar falta' : 'Falta — clique para marcar presença'}
                            >
                              {pres ? <CheckCircle size={18} color="var(--green)" weight="fill" /> : <XCircle size={18} color="var(--red)" weight="fill" />}
                            </td>
                          );
                        })}
                        <td style={{ padding: '10px 10px', border: '1px solid var(--border)', textAlign: 'center', background: 'var(--surface)' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: riskColor, fontSize: '0.9375rem' }}>{a.pct}%</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{a.presente}/{a.total}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.map((a, i) => {
                const cor = ALUNO_CORES[i % ALUNO_CORES.length];
                const riskColor = a.pct < 75 ? 'var(--red)' : a.pct < 85 ? 'var(--amber)' : 'var(--green)';
                return (
                  <div key={a.id} style={{
                    background: 'var(--surface)', border: `1px solid ${a.pct < 75 ? 'var(--red-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)', padding: '14px 16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text }}>
                        {initials(a.nome)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{a.nome}</div>
                        {a.matricula && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{a.matricula}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: riskColor, fontSize: '1.2rem' }}>{a.pct}%</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{a.presente}/{a.total} aulas</div>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface3)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${a.pct}%`, background: riskColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
                    </div>
                    {a.pct < 75 && (
                      <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--red)' }}>
                        ⚠ Frequência abaixo de 75% — risco de reprovação
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal add aluno */}
      {showAddAluno && (
        <Modal title="Adicionar aluno" onClose={() => setShowAddAluno(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" placeholder="Nome do aluno" value={formAluno.nome} onChange={e => setFormAluno(f=>({...f,nome:e.target.value}))} autoFocus onKeyDown={e => e.key === 'Enter' && adicionarAluno()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula (opcional)</div>
            <input className="modal-input" placeholder="ex: 2025001" value={formAluno.matricula} onChange={e => setFormAluno(f=>({...f,matricula:e.target.value}))} />
          </div>
          {alunoErro && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 8, padding: '8px 12px', color: 'var(--red)', fontSize: '0.82rem', marginTop: 4 }}>
              {alunoErro}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => { setShowAddAluno(false); setAlunoErro(''); }}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarAluno} disabled={alunoSaving}>{alunoSaving ? 'Adicionando…' : 'Adicionar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal editar aluno */}
      {editAluno !== null && (
        <Modal title="Editar aluno" onClose={() => setEditAluno(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome</div>
            <input className="modal-input" value={formAluno.nome} onChange={e => setFormAluno(f=>({...f,nome:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula</div>
            <input className="modal-input" value={formAluno.matricula} onChange={e => setFormAluno(f=>({...f,matricula:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setEditAluno(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicaoAluno}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal add aula */}
      {showAddAula && (
        <Modal title="Registrar aula" onClose={() => { setShowAddAula(false); setAulaErro(''); }}>
          <div className="modal-field">
            <div className="modal-label">Data da aula *</div>
            <input type="date" className="modal-input" value={formAula.data} onChange={e => setFormAula(f=>({...f,data:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Disciplina (opcional)</div>
            <input className="modal-input" placeholder="ex: DCU, Design Thinking..." value={formAula.disciplina} onChange={e => setFormAula(f=>({...f,disciplina:e.target.value}))} />
          </div>
          {aulaErro && (
            <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>
              {aulaErro}
            </div>
          )}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => { setShowAddAula(false); setAulaErro(''); }}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarAula} disabled={aulaSaving}>{aulaSaving ? 'Registrando…' : 'Registrar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal importar de grupos */}
      {showImport && (
        <Modal title="Importar alunos dos grupos" onClose={() => setShowImport(false)}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 12 }}>
            Selecione os alunos cadastrados nos grupos desta turma para importar na frequência:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto', marginBottom: 14 }}>
            {alunosDoGrupo.map((a, i) => {
              const jaExiste = turmaData.alunos.some(x => x.nome.toLowerCase().trim() === a.nome.toLowerCase().trim());
              const sel = importSel.includes(a.nome);
              return (
                <div key={i}
                  onClick={() => !jaExiste && toggleImportSel(a.nome)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: sel ? 'var(--accent-faint)' : 'var(--surface2)',
                    border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-sm)', padding: '8px 12px',
                    cursor: jaExiste ? 'default' : 'pointer', opacity: jaExiste ? 0.5 : 1,
                  }}
                >
                  <input type="checkbox" checked={sel || jaExiste} readOnly style={{ accentColor: 'var(--accent)' }} />
                  <span style={{ fontWeight: 500 }}>{a.nome}</span>
                  {jaExiste && <span style={{ fontSize: '0.72rem', color: 'var(--text3)', marginLeft: 'auto' }}>já cadastrado</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 12 }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--accent-light)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
              onClick={() => setImportSel(alunosDoGrupo.filter(a => !turmaData.alunos.some(x => x.nome.toLowerCase().trim() === a.nome.toLowerCase().trim())).map(a => a.nome))}
            >Selecionar todos</button>
            {' · '}
            <button style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}
              onClick={() => setImportSel([])}
            >Limpar</button>
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowImport(false)}>Cancelar</button>
            <button className="btn-primary" disabled={importSel.length === 0} onClick={confirmarImport}>
              Importar {importSel.length > 0 ? `(${importSel.length})` : ''}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}