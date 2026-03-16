import { useState, useEffect } from 'react';
import { X, MagnifyingGlass, ArrowSquareOut } from '@phosphor-icons/react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase.js';

// Tipos de projeto disponíveis
const TIPOS = [
  { value: 'projeto',         label: '📦 Projeto'           },
  { value: 'trabalho_grupo',  label: '👥 Trabalho em Grupo'  },
  { value: 'desafio',         label: '🏆 Desafio'            },
];

const STATUS_OPTS = [
  { value: 'planejamento', label: '🏗️ Planejamento' },
  { value: 'em_progresso', label: '⚙️ Em Progresso' },
  { value: 'concluído',    label: '✅ Concluído'    },
];

export function FormProjeto({ projeto, onSave, onClose }) {
  const [form, setForm] = useState(projeto ? {
    nome:         projeto.nome         || '',
    descricao:    projeto.descricao    || '',
    status:       projeto.status       || 'planejamento',
    data_inicio:  projeto.data_inicio  || '',
    data_termino: projeto.data_termino || '',
    tipo:         projeto.tipo         || 'projeto',
    atividade_base_id: projeto.atividade_base_id || null,
  } : {
    nome: '', descricao: '', status: 'planejamento',
    data_inicio: '', data_termino: '', tipo: 'projeto',
    atividade_base_id: null,
  });

  const [erros,       setErros]       = useState({});
  const [atividades,  setAtividades]  = useState([]);
  const [loadingAtiv, setLoadingAtiv] = useState(true);
  const [busca,       setBusca]       = useState('');
  const [mostrarBase, setMostrarBase] = useState(!projeto); // abre por padrão em criação

  // Carrega atividades existentes como base
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoadingAtiv(false); return; }
      supabase
        .from('atividades')
        .select('id, titulo, tipo, prazo, descricao')
        .eq('professor_id', user.id)
        .order('prazo', { ascending: false })
        .then(({ data }) => {
          setAtividades(data || []);
          setLoadingAtiv(false);
        });
    });
  }, []);

  const atividadesFiltradas = atividades.filter(a =>
    !busca || a.titulo?.toLowerCase().includes(busca.toLowerCase())
  );

  const selecionarBase = (ativ) => {
    setForm(f => ({
      ...f,
      nome:              f.nome || ativ.titulo || '',
      descricao:         f.descricao || ativ.descricao || '',
      data_termino:      f.data_termino || ativ.prazo || '',
      atividade_base_id: ativ.id,
    }));
    setMostrarBase(false);
  };

  const validar = () => {
    const e = {};
    if (!form.nome.trim()) e.nome = 'Nome obrigatório';
    if (form.data_inicio && form.data_termino &&
        new Date(form.data_termino) <= new Date(form.data_inicio))
      e.data_termino = 'Término deve ser após o início';
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validar()) onSave(form);
  };

  const Field = ({ label, req, err, children, half }) => (
    <div className="modal-field" style={half ? { marginBottom: 0 } : {}}>
      <div className="modal-label">
        {label}{req && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
      </div>
      {children}
      {err && <div style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 4 }}>{err}</div>}
    </div>
  );

  // Atividade selecionada como base
  const atividadeBase = form.atividade_base_id
    ? atividades.find(a => a.id === form.atividade_base_id)
    : null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560, maxHeight: '90dvh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="modal-title" style={{ margin: 0 }}>
            {projeto ? 'Editar projeto' : 'Novo projeto'}
          </div>
          <button onClick={onClose}
            style={{ color: 'var(--text3)', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}>
            <X size={20} />
          </button>
        </div>

        {/* ── Base de atividades ── */}
        {!projeto && (
          <div style={{ marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => setMostrarBase(v => !v)}
              style={{
                width: '100%', textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 'var(--r-sm)',
                background: mostrarBase ? 'var(--accent-faint)' : 'var(--surface2)',
                border: `1px solid ${mostrarBase ? 'rgba(192,132,252,0.35)' : 'var(--border)'}`,
                color: mostrarBase ? 'var(--accent-light)' : 'var(--text2)',
                fontSize: '0.8125rem', fontWeight: 600,
                transition: 'all 0.15s', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              <span>📋 Usar atividade existente como base</span>
              <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>{mostrarBase ? '▲ ocultar' : '▼ ver'}</span>
            </button>

            {mostrarBase && (
              <div style={{
                marginTop: 8,
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                overflow: 'hidden',
              }}>
                {/* Busca */}
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <MagnifyingGlass size={14} style={{ color: 'var(--text3)', flexShrink: 0 }} />
                  <input
                    placeholder="Buscar atividade..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    style={{
                      flex: 1, background: 'none', border: 'none', outline: 'none',
                      color: 'var(--text)', fontSize: '0.8125rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* Lista */}
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {loadingAtiv ? (
                    <div style={{ padding: '16px', color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center' }}>
                      Carregando atividades...
                    </div>
                  ) : atividadesFiltradas.length === 0 ? (
                    <div style={{ padding: '16px', color: 'var(--text3)', fontSize: '0.8rem', textAlign: 'center' }}>
                      {atividades.length === 0
                        ? 'Nenhuma atividade cadastrada ainda. Crie em Atividades primeiro.'
                        : 'Nenhuma atividade encontrada.'}
                    </div>
                  ) : atividadesFiltradas.map(a => {
                    const sel = form.atividade_base_id === a.id;
                    return (
                      <div
                        key={a.id}
                        onClick={() => selecionarBase(a)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: sel ? 'var(--accent-faint)' : 'transparent',
                          transition: 'background 0.12s',
                          display: 'flex', alignItems: 'center', gap: 10,
                        }}
                        onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--surface2)'; }}
                        onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8375rem', fontWeight: 600, color: sel ? 'var(--accent-light)' : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.titulo}
                          </div>
                          {a.prazo && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>
                              Prazo: {a.prazo.slice(8,10)}/{a.prazo.slice(5,7)}/{a.prazo.slice(0,4)}
                            </div>
                          )}
                        </div>
                        {sel && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-light)', background: 'rgba(192,132,252,0.15)', padding: '2px 8px', borderRadius: 99, flexShrink: 0 }}>
                            ✓ selecionada
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Badge da base selecionada */}
            {atividadeBase && !mostrarBase && (
              <div style={{
                marginTop: 8, padding: '8px 12px', borderRadius: 'var(--r-sm)',
                background: 'var(--accent-faint)', border: '1px solid rgba(192,132,252,0.3)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: '0.78rem', color: 'var(--accent-light)',
              }}>
                <span>📋</span>
                <span style={{ flex: 1 }}>Base: <strong>{atividadeBase.titulo}</strong></span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, atividade_base_id: null }))}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Nome" req err={erros.nome}>
            <input className="modal-input" placeholder="Ex: Vitrine UX/UI"
              value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
              autoFocus={!!projeto} />
          </Field>

          <Field label="Descrição">
            <textarea className="modal-textarea" placeholder="Descreva o projeto..." rows={3}
              value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <Field label="Tipo" half>
              <select className="modal-input" value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </Field>
            <Field label="Status" half>
              <select className="modal-input" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px', marginTop: 0 }}>
            <Field label="Início" half>
              <input type="date" className="modal-input"
                value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} />
            </Field>
            <Field label="Término" half err={erros.data_termino}>
              <input type="date" className="modal-input"
                style={erros.data_termino ? { borderColor: 'var(--red)' } : {}}
                value={form.data_termino} onChange={e => setForm({ ...form, data_termino: e.target.value })} />
            </Field>
          </div>

          <div className="modal-footer" style={{ marginTop: 20 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">
              {projeto ? 'Salvar alterações' : 'Criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}