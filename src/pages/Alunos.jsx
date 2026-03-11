// pages/Alunos.jsx — Pool global de alunos + matricular em turmas
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { Users, Plus, PencilSimple, Trash, ArrowsLeftRight, MagnifyingGlass, X, Check, UserCircle } from '@phosphor-icons/react';
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
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 540, width: '95vw' } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function Alunos() {
  const { org, turmas } = useOrg();

  const [alunos,      setAlunos]      = useState([]);
  const [matriculas,  setMatriculas]  = useState([]); // [{aluno_id, turma_id}]
  const [loading,     setLoading]     = useState(true);
  const [busca,       setBusca]       = useState('');
  const [filtroTurma, setFiltroTurma] = useState('todas');

  // Modais
  const [showNew,     setShowNew]     = useState(false);
  const [editAluno,   setEditAluno]   = useState(null);
  const [moverAluno,  setMoverAluno]  = useState(null); // aluno para matricular/desmatricular
  const [form,        setForm]        = useState({ nome: '', matricula: '' });
  const [erro,        setErro]        = useState('');
  const [saving,      setSaving]      = useState(false);

  // ── Load ────────────────────────────────────────────────
  useEffect(() => {
    if (!org?.id) return;
    setLoading(true);
    Promise.all([
      supabase.from('alunos').select('*').eq('organizacao_id', org.id).order('nome'),
      supabase.from('matriculas').select('aluno_id, turma_id').in(
        'turma_id', turmas.map(t => t.id)
      ),
    ]).then(([{ data: a }, { data: m }]) => {
      setAlunos(a || []);
      setMatriculas(m || []);
      setLoading(false);
    });
  }, [org?.id, turmas.length]);

  // ── Helpers ──────────────────────────────────────────────
  const turmasDoAluno = (alunoId) =>
    matriculas.filter(m => m.aluno_id === alunoId).map(m => turmas.find(t => t.id === m.turma_id)).filter(Boolean);

  const alunosFiltrados = useMemo(() => {
    let list = alunos;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter(a => a.nome.toLowerCase().includes(q) || (a.matricula || '').toLowerCase().includes(q));
    }
    if (filtroTurma !== 'todas') {
      const ids = new Set(matriculas.filter(m => m.turma_id === filtroTurma).map(m => m.aluno_id));
      list = list.filter(a => ids.has(a.id));
    }
    return list;
  }, [alunos, matriculas, busca, filtroTurma]);

  // ── Criar aluno ──────────────────────────────────────────
  const criarAluno = async () => {
    if (!form.nome.trim()) return;
    setSaving(true); setErro('');
    try {
      const { data, error } = await supabase.from('alunos')
        .insert({ organizacao_id: org.id, nome: form.nome.trim(), matricula: form.matricula.trim() || null })
        .select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um aluno com essa matrícula.');
        throw error;
      }
      setAlunos(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)));
      setForm({ nome: '', matricula: '' });
      setShowNew(false);
    } catch(e) { setErro(e.message || 'Erro ao criar aluno.'); }
    finally { setSaving(false); }
  };

  // ── Editar aluno ─────────────────────────────────────────
  const salvarEdicao = async () => {
    if (!form.nome.trim()) return;
    setSaving(true); setErro('');
    try {
      const { error } = await supabase.from('alunos')
        .update({ nome: form.nome.trim(), matricula: form.matricula.trim() || null })
        .eq('id', editAluno.id);
      if (error) throw error;
      setAlunos(prev => prev.map(a => a.id === editAluno.id ? { ...a, nome: form.nome.trim(), matricula: form.matricula.trim() || null } : a));
      setEditAluno(null);
    } catch(e) { setErro(e.message || 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  // ── Excluir aluno ────────────────────────────────────────
  const excluirAluno = async (aluno) => {
    if (!confirm(`Excluir "${aluno.nome}"? Isso remove também todas as matrículas.`)) return;
    await supabase.from('alunos').delete().eq('id', aluno.id);
    setAlunos(prev => prev.filter(a => a.id !== aluno.id));
    setMatriculas(prev => prev.filter(m => m.aluno_id !== aluno.id));
  };

  // ── Matricular / desmatricular ───────────────────────────
  const toggleMatricula = async (turmaId) => {
    if (!moverAluno) return;
    const existe = matriculas.some(m => m.aluno_id === moverAluno.id && m.turma_id === turmaId);
    if (existe) {
      await supabase.from('matriculas').delete()
        .eq('aluno_id', moverAluno.id).eq('turma_id', turmaId);
      setMatriculas(prev => prev.filter(m => !(m.aluno_id === moverAluno.id && m.turma_id === turmaId)));
    } else {
      const { data } = await supabase.from('matriculas')
        .insert({ aluno_id: moverAluno.id, turma_id: turmaId })
        .select().single();
      if (data) setMatriculas(prev => [...prev, { aluno_id: data.aluno_id, turma_id: data.turma_id }]);
    }
  };

  if (loading) return <div style={{ color: 'var(--text3)', padding: 32 }}>Carregando alunos...</div>;

  return (
    <div className="anim-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Alunos</div>
          <div className="page-subtitle">{alunos.length} aluno{alunos.length !== 1 ? 's' : ''} cadastrados</div>
        </div>
        <button className="btn-primary" onClick={() => { setForm({ nome: '', matricula: '' }); setErro(''); setShowNew(true); }}>
          <Plus size={15} weight="bold" /> Novo aluno
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 160 }}>
          <MagnifyingGlass size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
          <input
            className="modal-input"
            placeholder="Buscar por nome ou matrícula…"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: 30, width: '100%' }}
          />
        </div>
        <select
          className="modal-input"
          value={filtroTurma}
          onChange={e => setFiltroTurma(e.target.value)}
          style={{ flex: '0 0 auto', minWidth: 150 }}
        >
          <option value="todas">Todas as turmas</option>
          <option value="sem_turma">Sem turma</option>
          {turmas.map(t => <option key={t.id} value={t.id}>{t.modulo} — {t.label}</option>)}
        </select>
      </div>

      {/* Lista */}
      {alunosFiltrados.length === 0 ? (
        <EmptyState
          icon={<Users size={40} />}
          title={alunos.length === 0 ? 'Nenhum aluno cadastrado' : 'Nenhum resultado'}
          desc={alunos.length === 0 ? 'Cadastre alunos aqui e depois os adicione às turmas que quiser.' : 'Tente ajustar os filtros.'}
          action={alunos.length === 0 ? '+ Cadastrar primeiro aluno' : null}
          onAction={alunos.length === 0 ? () => setShowNew(true) : null}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alunosFiltrados.map((aluno, i) => {
            const cor = CORES[i % CORES.length];
            const turmasAluno = turmasDoAluno(aluno.id);
            return (
              <div key={aluno.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 14px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: cor.bg, color: cor.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', fontFamily: 'var(--font-display)',
                }}>
                  {initials(aluno.nome)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {aluno.nome}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 1 }}>
                    {aluno.matricula ? `Matrícula: ${aluno.matricula}` : 'Sem matrícula'}
                  </div>
                </div>

                {/* Badges de turmas */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
                  {turmasAluno.length === 0 ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px' }}>
                      Sem turma
                    </span>
                  ) : turmasAluno.map(t => (
                    <span key={t.id} style={{
                      fontSize: '0.72rem', fontWeight: 600, borderRadius: 99, padding: '2px 8px',
                      background: `${t.cor}18`, color: t.cor, border: `1px solid ${t.cor}40`,
                    }}>
                      {t.label}
                    </span>
                  ))}
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button className="icon-btn-sm" title="Matricular em turmas"
                    onClick={() => setMoverAluno(aluno)}>
                    <ArrowsLeftRight size={14} />
                  </button>
                  <button className="icon-btn-sm" title="Editar aluno"
                    onClick={() => { setEditAluno(aluno); setForm({ nome: aluno.nome, matricula: aluno.matricula || '' }); setErro(''); }}>
                    <PencilSimple size={14} />
                  </button>
                  <button className="icon-btn-sm danger" title="Excluir aluno"
                    onClick={() => excluirAluno(aluno)}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo aluno */}
      {showNew && (
        <Modal title="Novo aluno" onClose={() => setShowNew(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" placeholder="Nome do aluno" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus
              onKeyDown={e => e.key === 'Enter' && criarAluno()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula (opcional)</div>
            <input className="modal-input" placeholder="ex: 2025001" value={form.matricula}
              onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
          </div>
          {erro && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>{erro}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancelar</button>
            <button className="btn-primary" onClick={criarAluno} disabled={saving}>{saving ? 'Criando…' : 'Criar aluno'}</button>
          </div>
        </Modal>
      )}

      {/* Modal editar aluno */}
      {editAluno && (
        <Modal title="Editar aluno" onClose={() => setEditAluno(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome completo *</div>
            <input className="modal-input" value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Matrícula</div>
            <input className="modal-input" placeholder="ex: 2025001" value={form.matricula}
              onChange={e => setForm(f => ({ ...f, matricula: e.target.value }))} />
          </div>
          {erro && <div style={{ background:'var(--red-bg)', border:'1px solid var(--red-border)', borderRadius:8, padding:'8px 12px', color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>{erro}</div>}
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setEditAluno(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicao} disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
          </div>
        </Modal>
      )}

      {/* Modal matricular em turmas */}
      {moverAluno && (
        <Modal title={`Turmas — ${moverAluno.nome}`} onClose={() => setMoverAluno(null)} wide>
          <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 14 }}>
            Selecione as turmas em que este aluno estará matriculado. Você pode adicionar ou remover a qualquer momento.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {turmas.map(t => {
              const matriculado = matriculas.some(m => m.aluno_id === moverAluno.id && m.turma_id === t.id);
              return (
                <div key={t.id}
                  onClick={() => toggleMatricula(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${matriculado ? t.cor + '60' : 'var(--border)'}`,
                    background: matriculado ? `${t.cor}10` : 'var(--surface2)',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    background: matriculado ? t.cor : 'var(--surface3)',
                    border: `2px solid ${matriculado ? t.cor : 'var(--border2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {matriculado && <Check size={12} color="white" weight="bold" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.9rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{t.modulo} · {t.periodo}</div>
                  </div>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.cor, flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={() => setMoverAluno(null)}>Feito</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
