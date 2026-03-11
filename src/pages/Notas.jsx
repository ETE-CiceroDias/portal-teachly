// pages/Notas.jsx — Lançamento de notas por turma, atividade e aluno
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';

import {
  Trophy, CheckCircle, Clock, Warning, PencilSimple,
  FloppyDisk, X, MagnifyingGlass, Export, ArrowsDownUp,
} from '@phosphor-icons/react';

// ── Helpers ─────────────────────────────────────────────────────
const STATUS_META = {
  pendente:  { label: 'Pendente',  cor: '#d97706', bg: 'rgba(217,119,6,0.08)',   border: 'rgba(217,119,6,0.25)'  },
  entregue:  { label: 'Entregue',  cor: '#2563eb', bg: 'rgba(37,99,235,0.08)',   border: 'rgba(37,99,235,0.2)'   },
  avaliado:  { label: 'Avaliado',  cor: '#059669', bg: 'rgba(5,150,105,0.08)',   border: 'rgba(5,150,105,0.2)'   },
};
const STATUS_OPTS = ['pendente', 'entregue', 'avaliado'];

const fmtNota = (n) => {
  if (n === null || n === undefined || n === '') return '—';
  const v = parseFloat(n);
  return isNaN(v) ? '—' : v.toFixed(1).replace('.', ',');
};

const corNota = (n) => {
  if (n === null || n === '' || n === undefined) return 'var(--text3)';
  const v = parseFloat(n);
  if (isNaN(v)) return 'var(--text3)';
  if (v >= 7) return 'var(--green)';
  if (v >= 5) return 'var(--amber)';
  return 'var(--red)';
};

const initials = (nome) =>
  (nome || '?').split(' ').filter(Boolean).map(p => p[0]).join('').slice(0, 2).toUpperCase();

const AVATAR_CORES = [
  { bg: 'rgba(192,132,252,0.18)', text: '#c084fc' },
  { bg: 'rgba(232,121,249,0.15)', text: '#e879f9' },
  { bg: 'rgba(251,191,36,0.15)',  text: '#fbbf24' },
  { bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
  { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80' },
  { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa' },
  { bg: 'rgba(251,146,60,0.15)',  text: '#fb923c' },
  { bg: 'rgba(45,212,191,0.15)',  text: '#2dd4bf' },
];
const avatarCor = (nome) => AVATAR_CORES[(nome || '').charCodeAt(0) % AVATAR_CORES.length];

// ── Inline cell edit ─────────────────────────────────────────────
function NotaCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const start = () => {
    setDraft(value !== null && value !== undefined ? String(value) : '');
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    const raw = draft.replace(',', '.').trim();
    if (raw === '') { onChange(null); return; }
    const v = parseFloat(raw);
    if (!isNaN(v)) onChange(Math.min(10, Math.max(0, v)));
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        style={{
          width: 56, textAlign: 'center', fontSize: '0.88rem', fontWeight: 700,
          background: 'var(--surface2)', border: '1.5px solid var(--accent)',
          borderRadius: 7, padding: '4px 6px', color: 'var(--text)',
          outline: 'none', fontFamily: 'inherit',
        }}
      />
    );
  }

  return (
    <span
      onClick={start}
      title="Clique para editar"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: 'pointer', padding: '4px 10px', borderRadius: 8,
        background: 'var(--surface2)', border: '1px solid var(--border)',
        fontWeight: 700, fontSize: '0.88rem', color: corNota(value),
        transition: 'border-color 0.15s',
        minWidth: 52, justifyContent: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {fmtNota(value)}
    </span>
  );
}

function StatusCell({ value, onChange }) {
  const meta = STATUS_META[value] || STATUS_META.pendente;
  const idx = STATUS_OPTS.indexOf(value);
  const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length];

  return (
    <span
      onClick={() => onChange(next)}
      title="Clique para alternar status"
      style={{
        cursor: 'pointer', padding: '3px 10px', borderRadius: 99,
        fontSize: '0.72rem', fontWeight: 700,
        color: meta.cor, background: meta.bg, border: `1px solid ${meta.border}`,
        transition: 'opacity 0.15s', whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {meta.label}
    </span>
  );
}

// ── Modal de detalhe de uma nota (obs + critérios) ───────────────
function NotaDetailModal({ row, atividade, onClose, onSave }) {
  const [form, setForm] = useState({
    nota: row.nota ?? '',
    status: row.status || 'pendente',
    obs: row.obs || '',
    criterio1: row.criterio1 ?? '',
    criterio2: row.criterio2 ?? '',
    criterio3: row.criterio3 ?? '',
  });

  const temCriterios = atividade?.criterios?.length > 0;
  const criterios = atividade?.criterios || [
    { label: 'Critério 1', peso: '' },
    { label: 'Critério 2', peso: '' },
    { label: 'Critério 3', peso: '' },
  ];

  const notaCalc = useMemo(() => {
    if (!temCriterios) return null;
    const vals = [form.criterio1, form.criterio2, form.criterio3].map(v => parseFloat(String(v).replace(',', '.')));
    const validos = vals.filter(v => !isNaN(v));
    if (validos.length === 0) return null;
    return (validos.reduce((a, b) => a + b, 0) / validos.length).toFixed(1);
  }, [form.criterio1, form.criterio2, form.criterio3, temCriterios]);

  const inputStyle = {
    width: '100%', padding: '8px 12px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)',
    fontSize: '0.875rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480, width: '95vw' }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">
          Nota — {row.nome}
          <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 400, marginLeft: 8 }}>
            {atividade?.titulo}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Status */}
          <div>
            <div className="modal-label">Status</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUS_OPTS.map(s => {
                const m = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                    style={{
                      padding: '5px 14px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700,
                      cursor: 'pointer', border: `1px solid ${form.status === s ? m.cor : 'var(--border)'}`,
                      background: form.status === s ? m.bg : 'transparent',
                      color: form.status === s ? m.cor : 'var(--text3)',
                    }}>
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nota final */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="modal-label">Nota final (0–10)</div>
              <input style={inputStyle} value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                placeholder="ex: 8,5" />
            </div>
            {notaCalc && (
              <div>
                <div className="modal-label">Média dos critérios</div>
                <div style={{ ...inputStyle, color: corNota(notaCalc), fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                  {notaCalc}
                </div>
              </div>
            )}
          </div>

          {/* Critérios (sempre 3, com labels configuráveis) */}
          <div>
            <div className="modal-label" style={{ marginBottom: 8 }}>Notas por critério</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: '0.83rem', color: 'var(--text2)' }}>
                    {criterios[i]?.label || `Critério ${i + 1}`}
                    {criterios[i]?.peso ? <span style={{ color: 'var(--text3)', marginLeft: 6, fontSize: '0.75rem' }}>({criterios[i].peso})</span> : ''}
                  </div>
                  <input
                    style={{ ...inputStyle, textAlign: 'center' }}
                    value={[form.criterio1, form.criterio2, form.criterio3][i]}
                    onChange={e => setForm(f => ({ ...f, [`criterio${i + 1}`]: e.target.value }))}
                    placeholder="0–10"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Observação */}
          <div>
            <div className="modal-label">Observação / feedback</div>
            <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3}
              value={form.obs} onChange={e => setForm(f => ({ ...f, obs: e.target.value }))}
              placeholder="Feedback para o aluno, pontos de melhoria..." />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={() => onSave(form)}>
            <FloppyDisk size={14} style={{ marginRight: 5 }} weight="fill" /> Salvar nota
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────
export function Notas() {
  const { org, turmas } = useOrg();

  const [turmaId, setTurmaId] = useState('');
  const [atividadeId, setAtividadeId] = useState('');
  const [atividades, setAtividades] = useState([]);
  const [alunos, setAlunos] = useState([]);         // alunos da turma
  const [notas, setNotas] = useState([]);            // notas salvas {aluno_id, atividade_id, nota, status, obs, criterio1..3}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});          // {aluno_id: true}
  const [dirty, setDirty] = useState({});            // {aluno_id: {campo: valor}}
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAluno, setModalAluno] = useState(null);
  const [sortBy, setSortBy] = useState('nome');      // 'nome' | 'nota' | 'status'

  // Inicializa turma
  useEffect(() => {
    if (turmas.length > 0 && !turmaId) setTurmaId(turmas[0].id);
  }, [turmas]);

  // Carrega atividades — sem filtro extra, o RLS do Supabase já garante que vê só as suas
  useEffect(() => {
    supabase.from('atividades').select('*').order('prazo')
      .then(({ data }) => setAtividades(data || []));
  }, []);

  // Carrega alunos da turma + notas
  useEffect(() => {
    if (!turmaId) return;
    setLoading(true);
    Promise.all([
      // Alunos matriculados na turma (via alunos_frequencia que é a lista local)
      supabase.from('alunos_frequencia').select('*').eq('turma_id', turmaId).order('nome'),
      // Notas existentes para essa turma
      supabase.from('notas_alunos').select('*').eq('turma_id', turmaId),
    ]).then(([{ data: a }, { data: n }]) => {
      setAlunos(a || []);
      setNotas(n || []);
      setLoading(false);
    }).catch(() => {
      // Se tabela não existe ainda, carrega só alunos
      supabase.from('alunos_frequencia').select('*').eq('turma_id', turmaId).order('nome')
        .then(({ data: a }) => { setAlunos(a || []); setLoading(false); });
    });
  }, [turmaId]);

  const atividade = atividades.find(a => a.id === atividadeId);

  // Monta linhas da tabela mesclando alunos + notas
  const rows = useMemo(() => {
    return alunos.map(aluno => {
      const nota = notas.find(n => n.aluno_id === aluno.id && n.atividade_id === atividadeId);
      const d = dirty[aluno.id] || {};
      return {
        ...aluno,
        nota: d.nota !== undefined ? d.nota : (nota?.nota ?? null),
        status: d.status !== undefined ? d.status : (nota?.status || 'pendente'),
        obs: d.obs !== undefined ? d.obs : (nota?.obs || ''),
        criterio1: d.criterio1 !== undefined ? d.criterio1 : (nota?.criterio1 ?? null),
        criterio2: d.criterio2 !== undefined ? d.criterio2 : (nota?.criterio2 ?? null),
        criterio3: d.criterio3 !== undefined ? d.criterio3 : (nota?.criterio3 ?? null),
        _saved: !!nota,
        _notaId: nota?.id,
      };
    });
  }, [alunos, notas, dirty, atividadeId]);

  const filtered = useMemo(() => {
    let r = rows;
    if (busca) r = r.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()));
    if (filtroStatus !== 'todos') r = r.filter(a => a.status === filtroStatus);
    return [...r].sort((a, b) => {
      if (sortBy === 'nota') {
        const na = parseFloat(a.nota) || -1;
        const nb = parseFloat(b.nota) || -1;
        return nb - na;
      }
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      return (a.nome || '').localeCompare(b.nome || '');
    });
  }, [rows, busca, filtroStatus, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const comNota = rows.filter(r => r.nota !== null && r.nota !== '');
    const media = comNota.length > 0
      ? (comNota.reduce((s, r) => s + parseFloat(r.nota), 0) / comNota.length).toFixed(1)
      : null;
    return {
      total: rows.length,
      avaliados: rows.filter(r => r.status === 'avaliado').length,
      entregues: rows.filter(r => r.status === 'entregue').length,
      pendentes: rows.filter(r => r.status === 'pendente').length,
      media,
    };
  }, [rows]);

  // Marca campo como dirty
  const markDirty = (alunoId, campo, valor) => {
    setDirty(d => ({ ...d, [alunoId]: { ...(d[alunoId] || {}), [campo]: valor } }));
  };

  // Salva nota de um aluno no Supabase
  const salvar = useCallback(async (alunoId, extra = {}) => {
    if (!atividadeId) return;
    const row = rows.find(r => r.id === alunoId);
    if (!row) return;
    setSaving(s => ({ ...s, [alunoId]: true }));

    const payload = {
      turma_id: turmaId,
      aluno_id: alunoId,
      atividade_id: atividadeId,
      nota: extra.nota !== undefined ? (extra.nota === '' ? null : parseFloat(String(extra.nota).replace(',', '.'))) : (row.nota === '' ? null : parseFloat(row.nota)),
      status: extra.status || row.status || 'pendente',
      obs: extra.obs !== undefined ? extra.obs : row.obs,
      criterio1: extra.criterio1 !== undefined ? (extra.criterio1 === '' ? null : parseFloat(String(extra.criterio1).replace(',', '.'))) : row.criterio1,
      criterio2: extra.criterio2 !== undefined ? (extra.criterio2 === '' ? null : parseFloat(String(extra.criterio2).replace(',', '.'))) : row.criterio2,
      criterio3: extra.criterio3 !== undefined ? (extra.criterio3 === '' ? null : parseFloat(String(extra.criterio3).replace(',', '.'))) : row.criterio3,
    };

    if (row._notaId) {
      await supabase.from('notas_alunos').update(payload).eq('id', row._notaId);
    } else {
      await supabase.from('notas_alunos').insert(payload);
    }

    // Recarrega notas
    const { data: n } = await supabase.from('notas_alunos').select('*').eq('turma_id', turmaId);
    setNotas(n || []);
    setDirty(d => { const nd = { ...d }; delete nd[alunoId]; return nd; });
    setSaving(s => ({ ...s, [alunoId]: false }));
  }, [atividadeId, turmaId, rows]);

  const salvarDoModal = async (alunoId, form) => {
    await salvar(alunoId, form);
    setModalAluno(null);
  };

  const exportCSV = () => {
    const header = ['Aluno', 'Status', 'Nota', 'Critério 1', 'Critério 2', 'Critério 3', 'Observação'];
    const linhas = rows.map(r => [
      r.nome, STATUS_META[r.status]?.label || r.status,
      fmtNota(r.nota), fmtNota(r.criterio1), fmtNota(r.criterio2), fmtNota(r.criterio3),
      (r.obs || '').replace(/"/g, "'"),
    ].map(v => `"${v}"`).join(';'));
    const csv = [header.join(';'), ...linhas].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `notas_${atividade?.titulo || 'turma'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const turmaAtiva = turmas.find(t => t.id === turmaId);

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Notas</div>
          <div className="page-subtitle">Lance e acompanhe as notas por turma e atividade</div>
        </div>
        {atividadeId && rows.length > 0 && (
          <button onClick={exportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            <Export size={15} /> Exportar CSV
          </button>
        )}
      </div>

      {/* Seletor de turma + atividade */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Turma</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {turmas.map(t => (
              <button key={t.id} onClick={() => { setTurmaId(t.id); setDirty({}); }}
                style={{
                  padding: '7px 14px', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700,
                  cursor: 'pointer', border: `2px solid ${turmaId === t.id ? t.cor : 'var(--border)'}`,
                  background: turmaId === t.id ? t.cor + '18' : 'transparent',
                  color: turmaId === t.id ? t.cor : 'var(--text2)', transition: 'all 0.15s',
                }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: t.cor, marginRight: 6 }} />
                {t.modulo} · {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Atividade / Projeto</div>
          <select
            value={atividadeId}
            onChange={e => { setAtividadeId(e.target.value); setDirty({}); }}
            style={{ width: '100%', padding: '8px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: atividadeId ? 'var(--text)' : 'var(--text3)', fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
            <option value="">— Selecione uma atividade —</option>
            <option value="__vitrine__">🎨 Vitrine UX/UI na Prática (Desafio Extra)</option>
            {['atividade','projeto','prova','entrega'].map(tipo => {
              const grupo = atividades.filter(a => a.tipo === tipo);
              if (grupo.length === 0) return null;
              const labels = { atividade: '📝 Atividades', projeto: '🚀 Projetos', prova: '📊 Provas/Avaliações', entrega: '📦 Entregas' };
              return (
                <optgroup key={tipo} label={labels[tipo]}>
                  {grupo.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.titulo}{a.prazo ? ` — até ${a.prazo.split('-').reverse().join('/')}` : ''}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
      </div>

      {/* Estado vazio: sem atividade */}
      {!atividadeId && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>Selecione uma atividade</div>
          <div style={{ fontSize: '0.85rem' }}>Escolha a turma e a atividade acima para lançar as notas</div>
        </div>
      )}

      {atividadeId && (
        <>
          {/* Stats rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
            {[
              { label: 'Total', val: stats.total, cor: 'var(--accent-light)' },
              { label: 'Pendente', val: stats.pendentes, cor: '#d97706' },
              { label: 'Entregue', val: stats.entregues, cor: '#2563eb' },
              { label: 'Avaliado', val: stats.avaliados, cor: 'var(--green)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: s.cor }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Média geral */}
          {stats.media && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 18, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px' }}>
              <Trophy size={15} color="var(--amber)" weight="fill" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>Média da turma:</span>
              <span style={{ fontWeight: 800, fontSize: '1rem', color: corNota(stats.media) }}>{stats.media.replace('.', ',')}</span>
            </div>
          )}

          {/* Barra de busca + filtros + sort */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <MagnifyingGlass size={14} color="var(--text3)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar aluno..."
                style={{ width: '100%', paddingLeft: 30, padding: '7px 12px 7px 30px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 9, color: 'var(--text)', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {/* Filtro status */}
            <div style={{ display: 'flex', gap: 5 }}>
              {['todos', ...STATUS_OPTS].map(s => {
                const m = STATUS_META[s];
                return (
                  <button key={s} onClick={() => setFiltroStatus(s)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                      border: `1px solid ${filtroStatus === s ? (m?.cor || 'var(--accent)') : 'var(--border)'}`,
                      background: filtroStatus === s ? (m?.bg || 'var(--accent-faint)') : 'transparent',
                      color: filtroStatus === s ? (m?.cor || 'var(--accent-light)') : 'var(--text3)',
                    }}>
                    {s === 'todos' ? 'Todos' : m.label}
                  </button>
                );
              })}
            </div>
            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              style={{ padding: '6px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              <option value="nome">Ordenar: Nome</option>
              <option value="nota">Ordenar: Nota ↓</option>
              <option value="status">Ordenar: Status</option>
            </select>
          </div>

          {/* Tabela */}
          {loading ? (
            <div style={{ color: 'var(--text3)', padding: 32, textAlign: 'center' }}>Carregando alunos…</div>
          ) : alunos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 700, color: 'var(--text2)', marginBottom: 4 }}>Nenhum aluno nesta turma</div>
              <div style={{ fontSize: '0.85rem' }}>Adicione alunos na página de Frequência ou Alunos</div>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Header da tabela */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 90px 90px auto', gap: 0, borderBottom: '1px solid var(--border)', padding: '10px 16px', background: 'var(--surface2)' }}>
                {['Aluno', 'Status', 'Nota', 'Critério 1', 'Critério 2', 'Critério 3', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: i >= 2 ? 'center' : 'left' }}>{h}</div>
                ))}
              </div>

              {/* Linhas */}
              {filtered.map((row, idx) => {
                const cor = avatarCor(row.nome);
                const isDirty = !!dirty[row.id];
                const isSaving = saving[row.id];

                return (
                  <div key={row.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px 90px 90px auto',
                    gap: 0, padding: '10px 16px', alignItems: 'center',
                    borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    background: isDirty ? 'var(--accent-faint)' : 'transparent',
                    transition: 'background 0.15s',
                  }}>
                    {/* Nome */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: cor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: cor.text }}>{initials(row.nome)}</span>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.875rem' }}>{row.nome}</span>
                      {isDirty && <span style={{ fontSize: '0.65rem', background: 'var(--accent-faint)', color: 'var(--accent-light)', border: '1px solid var(--accent)', borderRadius: 99, padding: '1px 6px', fontWeight: 700 }}>não salvo</span>}
                    </div>

                    {/* Status (clicável) */}
                    <div style={{ textAlign: 'center' }}>
                      <StatusCell
                        value={row.status}
                        onChange={val => markDirty(row.id, 'status', val)}
                      />
                    </div>

                    {/* Nota final */}
                    <div style={{ textAlign: 'center' }}>
                      <NotaCell
                        value={row.nota}
                        onChange={val => markDirty(row.id, 'nota', val)}
                      />
                    </div>

                    {/* Critérios */}
                    {[1, 2, 3].map(c => (
                      <div key={c} style={{ textAlign: 'center' }}>
                        <NotaCell
                          value={row[`criterio${c}`]}
                          onChange={val => markDirty(row.id, `criterio${c}`, val)}
                        />
                      </div>
                    ))}

                    {/* Ações */}
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                      <button onClick={() => setModalAluno(row)}
                        title="Abrir detalhe / observação"
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text3)', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
                        <PencilSimple size={13} />
                      </button>
                      {isDirty && (
                        <button onClick={() => salvar(row.id)}
                          disabled={isSaving}
                          title="Salvar nota"
                          style={{ background: 'var(--accent)', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'white', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 700, opacity: isSaving ? 0.6 : 1 }}>
                          {isSaving ? '…' : <><FloppyDisk size={13} weight="fill" /> Salvar</>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Botão salvar tudo (se tiver dirty) */}
          {Object.keys(dirty).length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => Object.keys(dirty).forEach(id => salvar(id))}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                <FloppyDisk size={15} weight="fill" />
                Salvar todas as notas ({Object.keys(dirty).length})
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal detalhe */}
      {modalAluno && (
        <NotaDetailModal
          row={modalAluno}
          atividade={atividade}
          onClose={() => setModalAluno(null)}
          onSave={(form) => salvarDoModal(modalAluno.id, form)}
        />
      )}
    </div>
  );
}
