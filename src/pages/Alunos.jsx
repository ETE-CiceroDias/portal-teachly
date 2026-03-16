// pages/Alunos.jsx
import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { Users, Plus, PencilSimple, Trash, MagnifyingGlass, Check } from '@phosphor-icons/react';
import { EmptyState } from '../components/EmptyState.jsx';

const initials = (nome) => (nome || '?').split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

const CORES = [
  { bg: 'rgba(192,132,252,0.18)', text: '#c084fc' },
  { bg: 'rgba(232,121,249,0.15)', text: '#e879f9' },
  { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80' },
  { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c' },
  { bg: 'rgba(45,212,191,0.15)',  text: '#2dd4bf' },
];

function Modal({ title, onClose, children, wide }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 540 } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>,
    document.body
  );
}

function TurmaSelector({ turmas, selecionadas, onToggle }) {
  if (turmas.length === 0) return (
    <div style={{ fontSize: '0.8rem', color: 'var(--text3)', padding: '8px 0' }}>Nenhuma turma cadastrada.</div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {turmas.map(t => {
        const sel = selecionadas.has(t.id);
        return (
          <div key={t.id} onClick={() => onToggle(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${sel ? t.cor + '60' : 'var(--border)'}`,
              background: sel ? `${t.cor}12` : 'var(--surface2)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--surface3)'; }}
            onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'var(--surface2)'; }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: 5, flexShrink: 0,
              background: sel ? t.cor : 'transparent',
              border: `2px solid ${sel ? t.cor : 'var(--border2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
              {sel && <Check size={12} color="white" weight="bold" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{t.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{t.modulo}</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.cor, flexShrink: 0 }} />
          </div>
        );
      })}
    </div>
  );
}

export function Alunos() {
  const { org, turmas } = useOrg();

  const [alunos,      setAlunos]      = useState([]);
  const [matriculas,  setMatriculas]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busca,       setBusca]       = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todas');

  // Seleção múltipla
  const [selecionados, setSelecionados] = useState(new Set());
  const [showLote,     setShowLote]     = useState(false);
  const [savingLote,   setSavingLote]   = useState(false);
  const [turmasLote,   setTurmasLote]   = useState(new Set());

  // Modal criar
  const [showNew,   setShowNew]   = useState(false);
  const [formNew,   setFormNew]   = useState({ nome: '', matricula: '' });
  const [turmasSel, setTurmasSel] = useState(new Set());
  const [erroNew,   setErroNew]   = useState('');
  const [savingNew, setSavingNew] = useState(false);

  // Modal editar
  const [editAluno,  setEditAluno]  = useState(null);
  const [formEdit,   setFormEdit]   = useState({ nome: '', matricula: '' });
  const [erroEdit,   setErroEdit]   = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal turmas avulso
  const [turmasAluno, setTurmasAluno] = useState(null);

  // ── Load ──────────────────────────────────────────────
  useEffect(() => {
    if (!org?.id) return;
    setLoading(true);
    Promise.all([
      supabase.from('alunos').select('*').eq('organizacao_id', org.id).order('nome'),
      supabase.from('matriculas').select('aluno_id, turma_id'),
    ]).then(([{ data: a }, { data: m }]) => {
      setAlunos(a || []);
      setMatriculas(m || []);
      setLoading(false);
    });
  }, [org?.id]);

  const turmasDoAluno = (alunoId) =>
    matriculas.filter(m => m.aluno_id === alunoId)
      .map(m => turmas.find(t => t.id === m.turma_id)).filter(Boolean);

  const alunosFiltrados = useMemo(() => {
    let list = alunos;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(q) || (a.matricula || '').toLowerCase().includes(q));
    }
    if (filtroTurma === 'sem_turma') {
      const comTurma = new Set(matriculas.map(m => m.aluno_id));
      list = list.filter(a => !comTurma.has(a.id));
    } else if (filtroTurma !== 'todas') {
      const ids = new Set(matriculas.filter(m => m.turma_id === filtroTurma).map(m => m.aluno_id));
      list = list.filter(a => ids.has(a.id));
    }
    return list;
  }, [alunos, matriculas, busca, filtroTurma]);

  // ── Sincroniza aluno com alunos_frequencia ────────────
  const syncFrequencia = async (nome, matricula, turmaIds) => {
    for (const tid of turmaIds) {
      await supabase.from('alunos_frequencia').upsert(
        { turma_id: tid, nome, matricula: matricula || '' },
        { onConflict: 'turma_id,nome', ignoreDuplicates: true }
      );
    }
  };

  // ── Criar aluno ───────────────────────────────────────
  const criarAluno = async () => {
    if (!formNew.nome.trim()) return;
    setSavingNew(true); setErroNew('');
    try {
      const { data, error } = await supabase.from('alunos')
        .insert({ organizacao_id: org.id, nome: formNew.nome.trim(), matricula: formNew.matricula.trim() || null })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um aluno com essa matrícula.');
        throw error;
      }
      setAlunos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      if (turmasSel.size > 0) {
        const rows = [...turmasSel].map(tid => ({ aluno_id: data.id, turma_id: tid }));
        const { data: mats } = await supabase.from('matriculas').insert(rows).select();
        if (mats) setMatriculas(prev => [...prev, ...mats.map(m => ({ aluno_id: m.aluno_id, turma_id: m.turma_id }))]);
        await syncFrequencia(data.nome, data.matricula, [...turmasSel]);
      }
      setFormNew({ nome: '', matricula: '' }); setTurmasSel(new Set()); setShowNew(false);
    } catch(e) { setErroNew(e.message || 'Erro ao criar aluno.'); }
    finally { setSavingNew(false); }
  };

  // ── Editar aluno ──────────────────────────────────────
  const salvarEdicao = async () => {
    if (!formEdit.nome.trim()) return;
    setSavingEdit(true); setErroEdit('');
    try {
      const { error } = await supabase.from('alunos')
        .update({ nome: formEdit.nome.trim(), matricula: formEdit.matricula.trim() || null })
        .eq('id', editAluno.id);
      if (error) throw error;
      setAlunos(prev => prev.map(a => a.id === editAluno.id
        ? { ...a, nome: formEdit.nome.trim(), matricula: formEdit.matricula.trim() || null } : a));
      setEditAluno(null);
    } catch(e) { setErroEdit(e.message || 'Erro ao salvar.'); }
    finally { setSavingEdit(false); }
  };

  // ── Excluir aluno ─────────────────────────────────────
  const excluirAluno = async (aluno) => {
    if (!confirm(`Excluir "${aluno.nome}"? Remove também todas as matrículas.`)) return;
    await supabase.from('alunos').delete().eq('id', aluno.id);
    setAlunos(prev => prev.filter(a => a.id !== aluno.id));
    setMatriculas(prev => prev.filter(m => m.aluno_id !== aluno.id));
  };

  // ── Toggle matrícula avulso ───────────────────────────
  const toggleMatricula = async (alunoId, turmaId) => {
    const aluno = alunos.find(a => a.id === alunoId);
    const existe = matriculas.some(m => m.aluno_id === alunoId && m.turma_id === turmaId);
    if (existe) {
      await supabase.from('matriculas').delete().eq('aluno_id', alunoId).eq('turma_id', turmaId);
      setMatriculas(prev => prev.filter(m => !(m.aluno_id === alunoId && m.turma_id === turmaId)));
    } else {
      const { data } = await supabase.from('matriculas')
        .insert({ aluno_id: alunoId, turma_id: turmaId }).select().single();
      if (data) {
        setMatriculas(prev => [...prev, { aluno_id: data.aluno_id, turma_id: data.turma_id }]);
        if (aluno) await syncFrequencia(aluno.nome, aluno.matricula, [turmaId]);
      }
    }
  };

  // ── Matricular em lote ────────────────────────────────
  const matricularLote = async () => {
    if (selecionados.size === 0 || turmasLote.size === 0) return;
    setSavingLote(true);
    try {
      const alunosSel = alunos.filter(a => selecionados.has(a.id));
      for (const turmaId of turmasLote) {
        const jaIds = new Set(matriculas.filter(m => m.turma_id === turmaId).map(m => m.aluno_id));
        const novos = alunosSel.filter(a => !jaIds.has(a.id));
        if (novos.length === 0) continue;
        const { data: mats } = await supabase.from('matriculas')
          .insert(novos.map(a => ({ aluno_id: a.id, turma_id: turmaId }))).select();
        if (mats) setMatriculas(prev => [...prev, ...mats.map(m => ({ aluno_id: m.aluno_id, turma_id: m.turma_id }))]);
        await syncFrequencia('', '', []); // chama individualmente abaixo
        for (const a of novos) {
          await supabase.from('alunos_frequencia').upsert(
            { turma_id: turmaId, nome: a.nome, matricula: a.matricula || '' },
            { onConflict: 'turma_id,nome', ignoreDuplicates: true }
          );
        }
      }
      setSelecionados(new Set()); setTurmasLote(new Set()); setShowLote(false);
    } finally { setSavingLote(false); }
  };

  const todosSelFiltrados = alunosFiltrados.length > 0 && alunosFiltrados.every(a => selecionados.has(a.id));

  if (loading) return <div style={{ color: 'var(--text3)', padding: 32 }}>Carregando alunos...</div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Alunos</div>
          <div className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrados</div>
        </div>
        <button className="btn-primary"
          onClick={() => { setFormNew({ nome: '', matricula: '' }); setTurmasSel(new Set()); setErroNew(''); setShowNew(true); }}>
          <Plus size={15} weight="bold" /> Novo aluno
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input className="modal-input" placeholder="Buscar por nome ou matrícula…"
            value={busca} onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: 30, width: '100%' }} />
        </div>
        <select className="modal-input" value={filtroTurma}
          onChange={e => setFiltroTurma(e.target.value)}
          style={{ flex: '0 0 auto', minWidth: 160 }}>
          <option value="todas">Todas as turmas</option>
          <option value="sem_turma">Sem turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.modulo} — {t.label}</option>)}
        </select>
      </div>

      {/* Barra de ação quando há selecionados */}
      {selecionados.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--accent-faint)', border: '1px solid rgba(192,132,252,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 10,
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-light)', flex: 1 }}>
            {selecionados.size} aluno{selecionados.size > 1 ? 's' : ''} selecionado{selecionados.size > 1 ? 's' : ''}
          </span>
          <button onClick={() => { setTurmasLote(new Set()); setShowLote(true); }}
            style={{ padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--accent-mid), var(--accent-dim))', color: '#fff', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit' }}>
            + Adicionar à turma
          </button>
          <button onClick={() => setSelecionados(new Set())}
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text3)', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            Limpar seleção
          </button>
        </div>
      )}

      {/* Checkbox selecionar todos */}
      {alunosFiltrados.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingLeft: 4 }}>
          <input type="checkbox" style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer' }}
            checked={todosSelFiltrados}
            onChange={e => {
              if (e.target.checked) setSelecionados(prev => new Set([...prev, ...alunosFiltrados.map(a => a.id)]));
              else setSelecionados(prev => { const n = new Set(prev); alunosFiltrados.forEach(a => n.delete(a.id)); return n; });
            }}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
            Selecionar todos ({alunosFiltrados.length})
          </span>
        </div>
      )}

      {/* Lista */}
      {alunosFiltrados.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={alunos.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum resultado'}
          desc={alunos.length === 0 ? 'Cadastre alunos e vincule-os às turmas.' : 'Tente ajustar os filtros.'}
          action={alunos.length === 0 ? '+ Cadastrar primeiro aluno' : null}
          onAction={alunos.length === 0 ? () => setShowNew(true) : null}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alunosFiltrados.map((aluno, i) => {
            const cor = CORES[i % CORES.length];
            const tAluno = turmasDoAluno(aluno.id);
            const isSel = selecionados.has(aluno.id);
            return (
              <div key={aluno.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: isSel ? 'var(--accent-faint)' : 'var(--surface)',
                border: `1px solid ${isSel ? 'rgba(192,132,252,0.35)' : 'var(--border)'}`,
                borderRadius: 10, padding: '10px 14px', transition: 'all 0.15s',
              }}>
                {/* Checkbox */}
                <input type="checkbox"
                  style={{ accentColor: 'var(--accent)', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
                  checked={isSel}
                  onChange={e => setSelecionados(prev => {
                    const n = new Set(prev);
                    e.target.checked ? n.add(aluno.id) : n.delete(aluno.id);
                    return n;
                  })}
                  onClick={e => e.stopPropagation()}
                />

                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: cor.bg, color: cor.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.78rem', fontFamily: 'var(--font-display)',
                }}>
                  {initials(aluno.nome)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {aluno.nome}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 1 }}>
                    {aluno.matricula ? `Matrícula: ${aluno.matricula}` : 'Sem matrícula'}
                  </div>
                </div>

                {/* Badges de turma clicáveis */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                  {tAluno.length === 0 ? (
                    <button onClick={() => setTurmasAluno(aluno)}
                      style={{ fontSize: '0.72rem', color: 'var(--text3)', background: 'var(--surface2)', border: '1px dashed var(--border2)', borderRadius: 99, padding: '3px 10px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; }}>
                      + turma
                    </button>
                  ) : tAluno.map(t => (
                    <button key={t.id} onClick={() => setTurmasAluno(aluno)} title="Editar turmas"
                      style={{ fontSize: '0.72rem', fontWeight: 600, borderRadius: 99, padding: '3px 10px', background: `${t.cor}18`, color: t.cor, border: `1px solid ${t.cor}40`, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onMouseEnter={e => e.currentTarget.style.background = `${t.cor}30`}
                      onMouseLeave={e => e.currentTarget.style.background = `${t.cor}18`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="icon-btn-sm" title="Editar"
                    onClick={() => { setEditAluno(aluno); setFormEdit({ nome: aluno.nome, matricula: aluno.matricula || '' }); setErroEdit(''); }}>
                    <PencilSimple size={14} />
                  </button>
                  <button className="icon-btn-sm danger" title="Excluir"
                    onClick={() => excluirAluno(aluno)}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal: novo aluno ── */}
      {showNew && (
        <Modal title="Novo aluno" onClose={() => setShowNew(false)} wide>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" placeholder="Nome do aluno" value={formNew.nome}
              onChange={e => setFormNew(f => ({ ...f, nome: e.target.value }))} autoFocus
              onKeyDown={e => e.key === 'Enter' && criarAluno()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>(opcional)</span></div>
            <input className="modal-input" placeholder="ex: 2025001" value={formNew.matricula}
              onChange={e => setFormNew(f => ({ ...f, matricula: e.target.value }))} />
          </div>
          {turmas.length > 0 && (
            <div className="modal-field">
              <div className="modal-label">Matricular em turmas <span style={{ color: 'var(--text3)', fontSize: '0.75rem' }}>(opcional)</span></div>
              <TurmaSelector turmas={turmas} selecionadas={turmasSel}
                onToggle={id => setTurmasSel(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
            </div>
          )}
          {erroNew && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>{erroNew}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button>
            <button className="btn-primary" onClick={criarAluno} disabled={savingNew}>
              {savingNew ? 'Criando…' : turmasSel.size > 0 ? `Criar e matricular em ${turmasSel.size} turma${turmasSel.size > 1 ? 's' : ''}` : 'Criar aluno'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: editar aluno ── */}
      {editAluno && (
        <Modal title="Editar aluno" onClose={() => setEditAluno(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" value={formEdit.nome}
              onChange={e => setFormEdit(f => ({ ...f, nome: e.target.value }))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula</div>
            <input className="modal-input" placeholder="ex: 2025001" value={formEdit.matricula}
              onChange={e => setFormEdit(f => ({ ...f, matricula: e.target.value }))} />
          </div>
          {erroEdit && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>{erroEdit}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setEditAluno(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicao} disabled={savingEdit}>{savingEdit ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: turmas do aluno ── */}
      {turmasAluno && (
        <Modal title={`Turmas — ${turmasAluno.nome}`} onClose={() => setTurmasAluno(null)} wide>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 14 }}>
            Clique em uma turma para matricular ou desmatricular.
          </div>
          <TurmaSelector
            turmas={turmas}
            selecionadas={new Set(matriculas.filter(m => m.aluno_id === turmasAluno.id).map(m => m.turma_id))}
            onToggle={id => toggleMatricula(turmasAluno.id, id)}
          />
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={() => setTurmasAluno(null)}>Feito</button>
          </div>
        </Modal>
      )}

      {/* ── Modal: adicionar lote em turmas ── */}
      {showLote && (
        <Modal title={`Adicionar ${selecionados.size} aluno${selecionados.size > 1 ? 's' : ''} à turma`} onClose={() => setShowLote(false)} wide>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 14 }}>
            Selecione as turmas para matricular todos os alunos selecionados de uma vez.
          </div>
          <TurmaSelector turmas={turmas} selecionadas={turmasLote}
            onToggle={id => setTurmasLote(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} />
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button className="btn-ghost" onClick={() => setShowLote(false)}>Cancelar</button>
            <button className="btn-primary" onClick={matricularLote} disabled={savingLote || turmasLote.size === 0}>
              {savingLote ? 'Matriculando…' : `Matricular em ${turmasLote.size} turma${turmasLote.size > 1 ? 's' : ''}`}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}