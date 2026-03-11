// pages/Grupos.jsx — versão Supabase (bug fix: tela branca ao criar grupo)
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { EmptyState } from '../components/EmptyState.jsx';
import { supabase } from '../lib/supabase.js';
import { TURMAS, GRUPO_CORES, ALUNO_CORES } from '../data/turmas.js';
import { TURMA_IDS, ORG_ID } from '../data/ids.js';
import { UsersThree, Plus, PencilSimple, Trash, UserPlus } from '@phosphor-icons/react';

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
    , document.body
  );
}

function GrupoCard({ grupo, grupoIdx, onEdit, onDelete, onAddMembro }) {
  return (
    <div className="grupo-card">
      <div className="grupo-card-head">
        <div>
          <div className="grupo-num">Grupo {grupoIdx + 1}</div>
          <div className="grupo-name">{grupo.nome || 'Sem nome'}</div>
        </div>
        <div className="grupo-actions">
          <button className="icon-btn-sm" title="Adicionar membro" onClick={() => onAddMembro(grupoIdx)}><UserPlus size={15} /></button>
          <button className="icon-btn-sm" title="Editar grupo" onClick={() => onEdit(grupoIdx)}><PencilSimple size={15} /></button>
          <button className="icon-btn-sm danger" title="Excluir grupo" onClick={() => onDelete(grupoIdx)}><Trash size={15} /></button>
        </div>
      </div>
      <div className="grupo-members">
        {(grupo.membros || []).length === 0 ? (
          <div style={{ fontSize: '0.8125rem', color: 'var(--text3)', padding: '8px 0' }}>Nenhum membro ainda</div>
        ) : (
          grupo.membros.map((m, mi) => {
            const c = ALUNO_CORES[mi % ALUNO_CORES.length];
            const initials = m.nome ? m.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?';
            return (
              <div key={mi} className="member-row">
                <div className="member-avatar" style={{ background: c.bg, color: c.text }}>{initials}</div>
                <div className="member-info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="member-name">{m.nome}</div>
                  {m.papel && <div className="member-role">{m.papel}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Grupos({ activeTurma, turmaKey }) {
  // activeTurma = UUID da turma (vem de turmaAtiva.id no App.jsx)
  // turmaKey = chave como 'mod1a' para lookup de label
  const turma   = TURMAS[turmaKey] || TURMAS[activeTurma];
  const turmaId = activeTurma;

  const [grupos,  setGrupos]  = useState([]);
  const [loading, setLoading] = useState(true);

  const [showNewGrupo,   setShowNewGrupo]   = useState(false);
  const [editIdx,        setEditIdx]        = useState(null);
  const [addMembroIdx,   setAddMembroIdx]   = useState(null);
  const [novoGrupoNome,  setNovoGrupoNome]  = useState('');
  const [novoGrupoDesc,  setNovoGrupoDesc]  = useState('');
  const [novoNome,       setNovoNome]       = useState('');
  const [novoPapel,      setNovoPapel]      = useState('');

  const [saving, setSaving] = useState(false);
  const [erro,   setErro]   = useState('');

  // ── Load ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    supabase
      .from('grupos')
      .select('*')
      .eq('turma_id', turmaId)
      .order('criado_em')
      .then(({ data, error }) => {
        if (error) console.error('Erro ao carregar grupos:', error);
        setGrupos(data || []);
        setLoading(false);
      });
  }, [turmaId]);

  // ── Save grupo (upsert com professor_id para passar RLS) ────
  const saveGrupo = async (grupo) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão expirada. Faça login novamente.');
    const { data, error } = await supabase
      .from('grupos')
      .upsert({ ...grupo, turma_id: turmaId, professor_id: user.id })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  // ── Criar novo grupo ─────────────────────────────────────
  const criarGrupo = async () => {
    if (!novoGrupoNome.trim()) return;
    setSaving(true); setErro('');
    try {
      const novo = { nome: novoGrupoNome.trim(), descricao: novoGrupoDesc.trim(), membros: [] };
      const saved = await saveGrupo(novo);
      if (saved) setGrupos(g => [...g, saved]);
      setNovoGrupoNome(''); setNovoGrupoDesc('');
      setShowNewGrupo(false);
    } catch(e) {
      setErro('Erro ao criar grupo: ' + (e.message || 'tente novamente'));
    } finally { setSaving(false); }
  };

  // ── Editar nome/desc ─────────────────────────────────────
  const salvarEdicao = async () => {
    setSaving(true); setErro('');
    try {
      const g = grupos[editIdx];
      const updated = { ...g, nome: novoGrupoNome.trim(), descricao: novoGrupoDesc.trim() };
      const saved = await saveGrupo(updated);
      if (saved) setGrupos(gs => gs.map((x, i) => i === editIdx ? saved : x));
      setEditIdx(null);
    } catch(e) {
      setErro('Erro ao salvar: ' + (e.message || 'tente novamente'));
    } finally { setSaving(false); }
  };

  // ── Adicionar membro ─────────────────────────────────────
  const adicionarMembro = async () => {
    if (!novoNome.trim()) return;
    setSaving(true); setErro('');
    try {
      const g = grupos[addMembroIdx];
      const membros = [...(g.membros || []), { nome: novoNome.trim(), papel: novoPapel.trim() }];
      const saved = await saveGrupo({ ...g, membros });
      if (saved) setGrupos(gs => gs.map((x, i) => i === addMembroIdx ? saved : x));
      setNovoNome(''); setNovoPapel('');
      setAddMembroIdx(null);
    } catch(e) {
      setErro('Erro ao adicionar membro: ' + (e.message || 'tente novamente'));
    } finally { setSaving(false); }
  };

  // ── Deletar grupo ────────────────────────────────────────
  const deletarGrupo = async (idx) => {
    const g = grupos[idx];
    if (!confirm(`Excluir "${g.nome || 'Grupo ' + (idx+1)}"?`)) return;
    await supabase.from('grupos').delete().eq('id', g.id);
    setGrupos(gs => gs.filter((_, i) => i !== idx));
  };

  if (loading) return <div style={{ color: 'var(--text3)', padding: 32 }}>Carregando grupos...</div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Grupos</div>
          <div className="page-subtitle">{turma?.modulo} · {turma?.label} · {grupos.length} grupo{grupos.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn-primary" onClick={() => { setNovoGrupoNome(''); setNovoGrupoDesc(''); setErro(''); setShowNewGrupo(true); }}>
          <Plus size={15} weight="bold" /> Novo grupo
        </button>
      </div>

      {erro && (
        <div style={{ background: 'var(--red-bg)', border: '1px solid var(--red-border)', borderRadius: 10, padding: '10px 16px', color: 'var(--red)', fontSize: '0.85rem', marginBottom: 16 }}>
          {erro}
        </div>
      )}

      {grupos.length === 0 ? (
        <EmptyState icon="👥" title="Nenhum grupo criado"
          desc="Organize sua turma em grupos para facilitar atividades colaborativas."
          action="+ Criar primeiro grupo" onAction={() => setShowNewGrupo(true)} />
      ) : (
        <div className="grupos-grid">
          {grupos.map((g, i) => (
            <GrupoCard
              key={g.id}
              grupo={g}
              grupoIdx={i}
              cor={GRUPO_CORES[i % GRUPO_CORES.length]}
              onEdit={(idx) => { setEditIdx(idx); setNovoGrupoNome(grupos[idx].nome || ''); setNovoGrupoDesc(grupos[idx].descricao || ''); }}
              onDelete={deletarGrupo}
              onAddMembro={(idx) => { setAddMembroIdx(idx); setNovoNome(''); setNovoPapel(''); }}
            />
          ))}
        </div>
      )}

      {showNewGrupo && (
        <Modal title="Novo grupo" onClose={() => setShowNewGrupo(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome do grupo *</div>
            <input className="modal-input" placeholder="ex: Grupo Alpha" value={novoGrupoNome}
              onChange={e => setNovoGrupoNome(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && criarGrupo()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Descrição (opcional)</div>
            <input className="modal-input" placeholder="Projeto, tema..." value={novoGrupoDesc}
              onChange={e => setNovoGrupoDesc(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowNewGrupo(false)}>Cancelar</button>
            <button className="btn-primary" onClick={criarGrupo} disabled={saving}>{saving ? 'Criando…' : 'Criar'}</button>
          </div>
        </Modal>
      )}

      {editIdx !== null && (
        <Modal title="Editar grupo" onClose={() => setEditIdx(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome</div>
            <input className="modal-input" value={novoGrupoNome} onChange={e => setNovoGrupoNome(e.target.value)} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Descrição</div>
            <input className="modal-input" value={novoGrupoDesc} onChange={e => setNovoGrupoDesc(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setEditIdx(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicao}>Salvar</button>
          </div>
        </Modal>
      )}

      {addMembroIdx !== null && (
        <Modal title={`Adicionar membro — ${grupos[addMembroIdx]?.nome || 'Grupo ' + (addMembroIdx+1)}`} onClose={() => setAddMembroIdx(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome do aluno *</div>
            <input className="modal-input" placeholder="Nome completo" value={novoNome}
              onChange={e => setNovoNome(e.target.value)} autoFocus
              onKeyDown={e => e.key === 'Enter' && adicionarMembro()} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Papel (opcional)</div>
            <input className="modal-input" placeholder="ex: Líder, Dev, Designer..." value={novoPapel}
              onChange={e => setNovoPapel(e.target.value)} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setAddMembroIdx(null)}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarMembro}>Adicionar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}