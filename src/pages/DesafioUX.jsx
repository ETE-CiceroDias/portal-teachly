// pages/DesafioUX.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { Trash } from '@phosphor-icons/react';
import { TURMAS, ALUNO_CORES } from '../data/turmas.js';
import { TURMA_IDS } from '../data/ids.js';

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

const STATUS_OPTS = ['pendente', 'entregue', 'avaliado'];
const STATUS_LABELS = { pendente: 'Pendente', entregue: 'Entregue', avaliado: 'Avaliado' };

export function DesafioUX({ activeTurma }) {
  const turma   = TURMAS[activeTurma];
  const turmaId = TURMA_IDS[activeTurma];

  const [data,      setData]    = useState({ alunos: [], prazo: '' });
  const [desafioId, setDesafioId] = useState(null);
  const [loading,   setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: row } = await supabase.from('desafio_ux')
        .select('*, desafio_ux_alunos(*)')
        .eq('turma_id', turmaId).maybeSingle();
      if (row) {
        setDesafioId(row.id);
        setData({ prazo: row.prazo || '', alunos: row.desafio_ux_alunos || [] });
      }
      setLoading(false);
    }
    load();
  }, [turmaId]);

  const persist = async (next) => {
    setData(next);
    // Se não há desafio ainda, cria
    let dId = desafioId;
    if (!dId) {
      const { data: row } = await supabase.from('desafio_ux')
        .insert({ turma_id: turmaId, prazo: next.prazo }).select().single();
      if (row) { dId = row.id; setDesafioId(row.id); }
    } else if (next.prazo !== data.prazo) {
      await supabase.from('desafio_ux').update({ prazo: next.prazo }).eq('id', dId);
    }
  };

  const [showAdd, setShowAdd]     = useState(false);
  const [showEdit, setShowEdit]   = useState(null); // index
  const [filterStatus, setFilterStatus] = useState('todos');

  const [form, setForm] = useState({
    nome: '', grupo: '', linkedin: '',
    status: 'pendente', nota: '', obs: '', app: '',
  });

  const adicionarAluno = async () => {
    if (!form.nome.trim()) return;
    await persist({ ...data, alunos: data.alunos }); // garante desafioId
    const { data: saved } = await supabase.from('desafio_ux_alunos')
      .insert({ ...form, desafio_id: desafioId }).select().single();
    if (saved) setData(d => ({ ...d, alunos: [...d.alunos, saved] }));
    setForm({ nome: '', grupo: '', linkedin: '', status: 'pendente', nota: '', obs: '', app: '' });
    setShowAdd(false);
  };

  const salvarEdicao = async () => {
    const aluno = data.alunos[showEdit];
    await supabase.from('desafio_ux_alunos').update(form).eq('id', aluno.id);
    const next = data.alunos.map((a, i) => i === showEdit ? { ...a, ...form } : a);
    setData(d => ({ ...d, alunos: next }));
    setShowEdit(null);
  };

  const excluir = async (i) => {
    if (!confirm('Remover este aluno do desafio?')) return;
    const aluno = data.alunos[i];
    await supabase.from('desafio_ux_alunos').delete().eq('id', aluno.id);
    setData(d => ({ ...d, alunos: d.alunos.filter((_, j) => j !== i) }));
  };

  const abrirEdicao = (i) => {
    setShowEdit(i);
    setForm({ ...data.alunos[i] });
  };

  const filtered = filterStatus === 'todos'
    ? data.alunos
    : data.alunos.filter(a => a.status === filterStatus);

  const counts = {
    total:    data.alunos.length,
    entregue: data.alunos.filter(a => a.status === 'entregue').length,
    avaliado: data.alunos.filter(a => a.status === 'avaliado').length,
    pendente: data.alunos.filter(a => a.status === 'pendente').length,
  };

  return (
    <div className="anim-up">
      {/* Hero */}
      <div className="desafio-hero">
        <div className="desafio-badge">🏆 Desafio Extra · 1 Ponto</div>
        <div className="desafio-title">Vitrine UX/UI na Prática</div>
        <div className="desafio-sub">
          Aplicação prática de Design Centrado no Usuário e Design Thinking.
          Os alunos analisam um app real, redesenham uma tela no Figma e publicam no LinkedIn.
          Exclusivo para Módulo 1.
        </div>
      </div>

      {/* Steps */}
      <div className="section-label">O Desafio</div>
      <div className="desafio-steps" style={{ marginBottom: 28 }}>
        {[
          { n: '1', t: 'Escolha e Análise', d: 'Selecione um app ou site brasileiro com problema de UX/UI identificando a heurística de Nielsen violada.' },
          { n: '2', t: 'Empatia e DT', d: 'Utilize empatia e Design Thinking para entender a dor do usuário e propor uma solução centrada nele.' },
          { n: '3', t: 'Redesign no Figma', d: 'Crie um protótipo de média/alta fidelidade no Figma com boa hierarquia visual e contraste.' },
          { n: '4', t: 'Post no LinkedIn', d: 'Publique um estudo de caso "Antes e Depois" com #UXnaPraticaETECD, marcando a escola e a professora.' },
        ].map(s => (
          <div key={s.n} className="desafio-step">
            <div className="step-num">{s.n}</div>
            <div className="step-title">{s.t}</div>
            <div className="step-desc">{s.d}</div>
          </div>
        ))}
      </div>

      {/* Rubrica */}
      <div className="section-label">Rubrica de Avaliação</div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', marginBottom: 28 }}>
        <table className="rubrica-table">
          <thead>
            <tr>
              <th>Critério</th>
              <th>Foco</th>
              <th>Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Análise Teórica</strong></td>
              <td>Identificou problema real com vocabulário de DCU (Heurísticas de Nielsen, Gestalt, affordance, contraste)</td>
              <td><span className="rubrica-pts">0,3</span></td>
            </tr>
            <tr>
              <td><strong>Qualidade da Solução</strong></td>
              <td>Protótipo no Figma de média/alta fidelidade que resolve a dor apontada, com hierarquia visual e alinhamento corretos</td>
              <td><span className="rubrica-pts">0,4</span></td>
            </tr>
            <tr>
              <td><strong>Post no LinkedIn</strong></td>
              <td>Texto engajador com storytelling (problema → empatia → solução), marcações obrigatórias e hashtag #UXnaPraticaETECD</td>
              <td><span className="rubrica-pts">0,3</span></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Alunos */}
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div>
          <div className="section-label" style={{ marginBottom: 0 }}>
            Acompanhamento · {turma?.modulo} {turma?.label}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Prazo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: 'var(--text3)' }}>
            Prazo:
            <input
              type="date"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 'var(--r-xs)', padding: '4px 8px', fontSize: '0.8125rem', outline: 'none' }}
              value={data.prazo || ''}
              onChange={e => persist({ ...data, prazo: e.target.value })}
            />
          </div>
          <button className="btn-primary" onClick={() => { setForm({ nome: '', grupo: '', linkedin: '', status: 'pendente', nota: '', obs: '', app: '' }); setShowAdd(true); }}>
            + Adicionar aluno
          </button>
        </div>
      </div>

      {/* Stats mini */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', val: counts.total, c: 'var(--text2)' },
          { label: 'Entregues', val: counts.entregue, c: 'var(--green)' },
          { label: 'Avaliados', val: counts.avaliado, c: 'var(--accent-light)' },
          { label: 'Pendentes', val: counts.pendente, c: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 14px', fontSize: '0.8125rem' }}>
            <span style={{ color: 'var(--text3)' }}>{s.label}: </span>
            <span style={{ color: s.c, fontWeight: 700 }}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['todos', ...STATUS_OPTS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            style={{
              padding: '5px 14px',
              borderRadius: 99,
              fontSize: '0.8rem',
              fontWeight: 600,
              border: '1px solid',
              borderColor: filterStatus === s ? 'var(--accent)' : 'var(--border)',
              background: filterStatus === s ? 'var(--accent-faint)' : 'transparent',
              color: filterStatus === s ? 'var(--accent-light)' : 'var(--text3)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Lista alunos */}
      {filtered.length === 0 ? (
        <div style={{ color: 'var(--text3)', fontSize: '0.875rem', padding: '20px 0' }}>
          {data.alunos.length === 0
            ? 'Nenhum aluno cadastrado ainda. Clique em "+ Adicionar aluno".'
            : 'Nenhum aluno com esse status.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((a, i) => {
            const ri = data.alunos.indexOf(a);
            const cor = ALUNO_CORES[ri % ALUNO_CORES.length];
            const initials = a.nome.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
            return (
              <div key={a.id || i} className="aluno-card">
                <div className="aluno-avatar" style={{ background: cor.bg, color: cor.text }}>{initials}</div>
                <div className="aluno-info">
                  <div className="aluno-name">{a.nome}</div>
                  <div className="aluno-meta">
                    {a.grupo && `Grupo: ${a.grupo}`}
                    {a.app && ` · App: ${a.app}`}
                    {a.linkedin && <> · <a href={a.linkedin.startsWith('http') ? a.linkedin : `https://${a.linkedin}`} target="_blank" rel="noopener" style={{ color: 'var(--accent-light)', fontSize: '0.75rem' }}>LinkedIn</a></>}
                  </div>
                  {a.obs && <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 3 }}>{a.obs}</div>}
                </div>

                <span className={`aluno-status ${a.status}`}>
                  {STATUS_LABELS[a.status]}
                </span>

                {/* Nota */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    className="nota-input"
                    type="number"
                    min="0" max="1" step="0.1"
                    placeholder="—"
                    value={a.nota || ''}
                    onChange={e => {
                      const next = data.alunos.map((al, j) =>
                        j === ri ? { ...al, nota: e.target.value } : al
                      );
                      persist({ ...data, alunos: next });
                    }}
                    title="Nota (0-1)"
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>/1</span>
                </div>

                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="icon-btn-sm" onClick={() => abrirEdicao(ri)}>✏️</button>
                  <button className="icon-btn-sm danger" onClick={() => excluir(ri)} style={{display:'flex',alignItems:'center',justifyContent:'center'}}><Trash size={13} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal add */}
      {showAdd && (
        <Modal title="Adicionar aluno ao desafio" onClose={() => setShowAdd(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome do aluno *</div>
            <input className="modal-input" placeholder="Nome completo" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} autoFocus />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="modal-field">
              <div className="modal-label">Grupo</div>
              <input className="modal-input" placeholder="ex: Grupo Alpha" value={form.grupo} onChange={e => setForm(f=>({...f,grupo:e.target.value}))} />
            </div>
            <div className="modal-field">
              <div className="modal-label">App/Site analisado</div>
              <input className="modal-input" placeholder="ex: iFood, Nubank" value={form.app} onChange={e => setForm(f=>({...f,app:e.target.value}))} />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">LinkedIn (opcional)</div>
            <input className="modal-input" placeholder="linkedin.com/in/..." value={form.linkedin} onChange={e => setForm(f=>({...f,linkedin:e.target.value}))} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Status</div>
            <select className="modal-input" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Observação</div>
            <textarea className="modal-textarea" rows={2} value={form.obs} onChange={e => setForm(f=>({...f,obs:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarAluno}>Adicionar</button>
          </div>
        </Modal>
      )}

      {/* Modal edit */}
      {showEdit !== null && (
        <Modal title="Editar aluno" onClose={() => setShowEdit(null)}>
          <div className="modal-field">
            <div className="modal-label">Nome</div>
            <input className="modal-input" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="modal-field">
              <div className="modal-label">Grupo</div>
              <input className="modal-input" value={form.grupo} onChange={e => setForm(f=>({...f,grupo:e.target.value}))} />
            </div>
            <div className="modal-field">
              <div className="modal-label">App analisado</div>
              <input className="modal-input" value={form.app} onChange={e => setForm(f=>({...f,app:e.target.value}))} />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">LinkedIn</div>
            <input className="modal-input" value={form.linkedin} onChange={e => setForm(f=>({...f,linkedin:e.target.value}))} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Status</div>
            <select className="modal-input" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="modal-field">
            <div className="modal-label">Observação</div>
            <textarea className="modal-textarea" rows={2} value={form.obs} onChange={e => setForm(f=>({...f,obs:e.target.value}))} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowEdit(null)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarEdicao}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}