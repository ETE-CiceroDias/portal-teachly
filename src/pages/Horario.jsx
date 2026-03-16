// pages/Horario.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';
import { TURMAS } from '../data/turmas.js'; // fallback apenas
import { GearSix } from '@phosphor-icons/react';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
const DEFAULT_HORARIOS = ['18:40', '19:20', '20:00', '20:40'];
const LS_KEY = 'teachly_horarios_grade';

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function loadHorariosGrade() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...DEFAULT_HORARIOS];
}
function saveHorariosGrade(h) {
  localStorage.setItem(LS_KEY, JSON.stringify(h));
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Horario() {
  const { org, turmas: turmasOrg } = useOrg();

  // Resolve cor e label de uma turma_label — busca primeiro no banco, depois no estático
  const getTurmaInfo = (turmaLabel) => {
    if (!turmaLabel) return { cor: 'var(--accent)', label: turmaLabel };
    // 1. Match direto por key ou id
    const fromOrg = turmasOrg.find(t =>
      t.key === turmaLabel || t.id === turmaLabel || t.label === turmaLabel
    );
    if (fromOrg) return { cor: fromOrg.cor, label: fromOrg.label };
    // 2. Match por key estática (mod1a → Turma A Módulo 1)
    const fromStatic = TURMAS[turmaLabel];
    if (fromStatic) {
      // Tenta encontrar no banco pelo label equivalente
      const fromOrgByLabel = turmasOrg.find(t =>
        t.label === fromStatic.label && t.modulo === fromStatic.modulo
      );
      if (fromOrgByLabel) return { cor: fromOrgByLabel.cor, label: fromOrgByLabel.label };
      return { cor: fromStatic.cor, label: fromStatic.label };
    }
    return { cor: 'var(--accent)', label: turmaLabel };
  };

  // Opções de turma para o select — usa banco com fallback estático
  const turmaOpts = turmasOrg.length > 0
    ? turmasOrg.map(t => ({ key: t.key || t.id, label: `${t.modulo} · ${t.label}`, cor: t.cor }))
    : Object.entries(TURMAS).map(([k, t]) => ({ key: k, label: `${t.modulo} · ${t.label}`, cor: t.cor }));

  const [aulas,    setAulas]    = useState([]);
  const [horarios, setHorarios] = useState(loadHorariosGrade);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState(null);

  // Modal aula
  const [showAula,  setShowAula]  = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [erro,      setErro]      = useState('');
  const [formAula,  setFormAula]  = useState({
    dia: 'Seg', hora_inicio: '18:40', hora_fim: '19:20',
    turma: turmaOpts[0]?.key || Object.keys(TURMAS)[0] || 'mod1a',
    disciplina: '', obs: ''
  });

  // Modal config grade
  const [showConfig,  setShowConfig]  = useState(false);
  const [novoHorario, setNovoHorario] = useState('');
  const [configErro,  setConfigErro]  = useState('');

  // ── Carrega usuário logado ─────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // ── Carrega aulas do banco ─────────────────────────────
  useEffect(() => {
    if (!userId) return;
    supabase
      .from('horario')
      .select('*')
      .eq('professor_id', userId)
      .order('hora_inicio')
      .then(({ data, error }) => {
        if (error) { setErro('Erro ao carregar: ' + error.message); }
        else {
          setAulas(data || []);
          // Garante que horários das aulas aparecem na grade
          if (data && data.length > 0) {
            setHorarios(prev => {
              const set = new Set(prev);
              data.forEach(r => { if (r.hora_inicio) set.add(r.hora_inicio); });
              const next = [...set].sort((a, b) => timeToMin(a) - timeToMin(b));
              saveHorariosGrade(next);
              return next;
            });
          }
        }
        setLoading(false);
      });
  }, [userId]);

  const aulasCell = (dia, hora) =>
    aulas.filter(a => a.dia === dia && a.hora_inicio === hora);

  const openNew = (dia, hora) => {
    setEditId(null); setErro('');
    const idx = horarios.indexOf(hora);
    const fim = idx < horarios.length - 1
      ? horarios[idx + 1]
      : minToTime(timeToMin(hora) + 40);
    setFormAula({
      dia, hora_inicio: hora, hora_fim: fim,
      turma: turmaOpts[0]?.key || Object.keys(TURMAS)[0] || 'mod1a',
      disciplina: '', obs: '',
    });
    setShowAula(true);
  };

  const openEdit = (aula, e) => {
    e.stopPropagation(); setErro('');
    setEditId(aula.id);
    setFormAula({
      dia:         aula.dia,
      hora_inicio: aula.hora_inicio,
      hora_fim:    aula.hora_fim    || '',
      turma:       aula.turma_label || turmaOpts[0]?.key || Object.keys(TURMAS)[0] || 'mod1a',
      disciplina:  aula.disciplina  || '',
      obs:         aula.obs         || '',
    });
    setShowAula(true);
  };

  // ── Salvar aula ────────────────────────────────────────
  // Colunas reais na tabela: id, professor_id, organizacao_id,
  // dia, hora_inicio, turma_label, disciplina, obs, criado_em
  const salvarAula = async () => {
    if (!formAula.disciplina.trim()) {
      setErro('Informe a disciplina.'); return;
    }
    if (!userId) {
      setErro('Usuário não identificado. Recarregue a página.'); return;
    }

    setSaving(true); setErro('');

    // Payload só com colunas que existem no banco
    const payload = {
      professor_id:   userId,
      organizacao_id: org?.id || null,
      dia:            formAula.dia,
      hora_inicio:    formAula.hora_inicio,
      turma_label:    formAula.turma,
      disciplina:     formAula.disciplina.trim(),
      obs:            formAula.obs.trim() || null,
    };

    try {
      if (editId) {
        const { data, error } = await supabase
          .from('horario')
          .update(payload)
          .eq('id', editId)
          .select()
          .single();
        if (error) throw error;
        // Preserva hora_fim local (não existe no banco)
        setAulas(a => a.map(x =>
          x.id === editId ? { ...data, hora_fim: formAula.hora_fim } : x
        ));
      } else {
        const { data, error } = await supabase
          .from('horario')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        // Guarda hora_fim localmente junto com o registro
        setAulas(a => [...a, { ...data, hora_fim: formAula.hora_fim }]);
        // Adiciona linha na grade se necessário
        if (!horarios.includes(formAula.hora_inicio)) {
          setHorarios(h => {
            const next = [...h, formAula.hora_inicio]
              .sort((a, b) => timeToMin(a) - timeToMin(b));
            saveHorariosGrade(next);
            return next;
          });
        }
      }
      setShowAula(false);
    } catch (e) {
      // Mensagens de erro amigáveis
      if (e.code === '23505')
        setErro(`Já existe uma aula de ${formAula.dia} às ${formAula.hora_inicio}. Edite a existente.`);
      else
        setErro('Erro ao salvar: ' + (e.message || 'tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  const excluirAula = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('horario').delete().eq('id', editId);
      if (error) throw error;
      setAulas(a => a.filter(x => x.id !== editId));
      setShowAula(false);
    } catch (e) {
      setErro('Erro ao excluir: ' + (e.message || 'tente novamente'));
    } finally { setSaving(false); }
  };

  const addLinhaGrade = () => {
    setConfigErro('');
    if (!novoHorario) { setConfigErro('Selecione um horário.'); return; }
    if (horarios.includes(novoHorario)) { setConfigErro('Este horário já existe.'); return; }
    const next = [...horarios, novoHorario].sort((a, b) => timeToMin(a) - timeToMin(b));
    setHorarios(next);
    saveHorariosGrade(next);
    setNovoHorario('');
  };

  const removeLinhaGrade = (h) => {
    if (aulas.some(a => a.hora_inicio === h)) {
      setConfigErro(`Remova as aulas das ${h} antes de excluir esta linha.`);
      return;
    }
    const next = horarios.filter(x => x !== h);
    setHorarios(next);
    saveHorariosGrade(next);
    setConfigErro('');
  };

  if (loading) return (
    <div style={{ color: 'var(--text3)', padding: 32 }}>Carregando horário...</div>
  );

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Horário Semanal</div>
          <div className="page-subtitle">Clique em qualquer célula para adicionar uma aula</div>
        </div>
        <button className="btn-ghost"
          onClick={() => { setShowConfig(true); setConfigErro(''); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <GearSix size={15} /> Horários
        </button>
      </div>

      {/* Grade */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 4, minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px', color: 'var(--text3)', fontWeight: 700, fontSize: '0.75rem', textAlign: 'left', minWidth: 72 }}>
                Hora
              </th>
              {DIAS.map(d => (
                <th key={d} style={{ padding: '8px 12px', color: 'var(--text2)', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map(hora => (
              <tr key={hora}>
                <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', verticalAlign: 'top', paddingTop: 12, minWidth: 90 }}>
                  {(() => {
                    const idx = horarios.indexOf(hora);
                    const fim = idx < horarios.length - 1
                      ? horarios[idx + 1]
                      : minToTime(timeToMin(hora) + 40);
                    return (
                      <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-light)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                        {hora}–{fim}
                      </span>
                    );
                  })()}
                </td>
                {DIAS.map(dia => {
                  const cells = aulasCell(dia, hora);
                  return (
                    <td key={dia} style={{ padding: 4, verticalAlign: 'top' }}>
                      {cells.map(aula => {
                        const { cor, label: turmaLabel } = getTurmaInfo(aula.turma_label);
                        return (
                          <div key={aula.id}
                            onClick={e => openEdit(aula, e)}
                            style={{
                              background: `${cor}18`, border: `1px solid ${cor}55`,
                              borderRadius: 10, padding: '8px 10px', marginBottom: 4,
                              cursor: 'pointer', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = `${cor}28`}
                            onMouseLeave={e => e.currentTarget.style.background = `${cor}18`}
                          >
                            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: cor, textTransform: 'uppercase', letterSpacing: 1 }}>
                              {turmaLabel}
                              {aula.hora_fim && (
                                <span style={{ fontWeight: 400, opacity: 0.7 }}> · até {aula.hora_fim}</span>
                              )}
                            </div>
                            {aula.disciplina && (
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                                {aula.disciplina}
                              </div>
                            )}
                            {aula.obs && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 1, fontStyle: 'italic' }}>
                                {aula.obs}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {/* Botão + só aparece se a célula estiver vazia */}
                      {cells.length === 0 && (
                      <div
                        onClick={() => openNew(dia, hora)}
                        style={{
                          minHeight: 64,
                          borderRadius: 10, cursor: 'pointer',
                          border: '1px dashed var(--border)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text3)', fontSize: '0.75rem',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.color = 'var(--accent-light)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text3)';
                        }}
                      >
                        +
                      </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal: adicionar/editar aula ── */}
      {showAula && (
        <Modal
          title={editId ? 'Editar aula' : 'Nova aula'}
          onClose={() => { setShowAula(false); setErro(''); }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
            <div className="modal-field">
              <div className="modal-label">Dia</div>
              <select className="modal-input" value={formAula.dia}
                onChange={e => setFormAula(f => ({ ...f, dia: e.target.value }))}>
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <div className="modal-label">Turma</div>
              <select className="modal-input" value={formAula.turma}
                onChange={e => setFormAula(f => ({ ...f, turma: e.target.value }))}>
                {turmaOpts.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <div className="modal-label">Início</div>
              <input type="time" className="modal-input" value={formAula.hora_inicio}
                onChange={e => setFormAula(f => ({ ...f, hora_inicio: e.target.value }))} />
            </div>
            <div className="modal-field">
              <div className="modal-label">Fim <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>(visual)</span></div>
              <input type="time" className="modal-input" value={formAula.hora_fim}
                onChange={e => setFormAula(f => ({ ...f, hora_fim: e.target.value }))} />
            </div>
          </div>

          <div className="modal-field">
            <div className="modal-label">
              Disciplina <span style={{ color: 'var(--red)' }}>*</span>
            </div>
            <input className="modal-input"
              placeholder="ex: DCU, Design Thinking..."
              value={formAula.disciplina}
              onChange={e => setFormAula(f => ({ ...f, disciplina: e.target.value }))}
              autoFocus />
          </div>

          <div className="modal-field">
            <div className="modal-label">Observação <span style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>(opcional)</span></div>
            <input className="modal-input"
              placeholder="Qualquer nota extra..."
              value={formAula.obs}
              onChange={e => setFormAula(f => ({ ...f, obs: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && salvarAula()} />
          </div>

          {erro && (
            <div style={{
              background: 'var(--red-bg)', border: '1px solid var(--red-border)',
              borderRadius: 8, padding: '8px 12px',
              color: 'var(--red)', fontSize: '0.82rem', marginBottom: 4,
            }}>
              {erro}
            </div>
          )}

          <div className="modal-footer">
            {editId && (
              <button className="btn-ghost"
                style={{ color: 'var(--red)', marginRight: 'auto' }}
                onClick={excluirAula} disabled={saving}>
                Excluir
              </button>
            )}
            <button className="btn-ghost"
              onClick={() => { setShowAula(false); setErro(''); }}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={salvarAula} disabled={saving}>
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Modal: configurar grade ── */}
      {showConfig && (
        <Modal
          title="⚙️ Configurar horários da grade"
          onClose={() => setShowConfig(false)}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text2)', marginBottom: 12 }}>
            Linhas da grade salvas localmente no navegador.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
            {horarios.map(h => (
              <div key={h} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '8px 14px',
              }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--text)', fontWeight: 700, fontSize: '1rem' }}>
                  {h}
                </span>
                <button onClick={() => removeLinhaGrade(h)}
                  style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '0 4px' }}>
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="time" className="modal-input"
              style={{ flex: 1, marginBottom: 0 }}
              value={novoHorario}
              onChange={e => { setNovoHorario(e.target.value); setConfigErro(''); }}
              onKeyDown={e => e.key === 'Enter' && addLinhaGrade()}
            />
            <button className="btn-primary"
              style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}
              onClick={addLinhaGrade}>
              + Adicionar
            </button>
          </div>

          {configErro && (
            <div style={{ color: 'var(--red)', fontSize: '0.78rem', marginTop: 8 }}>
              {configErro}
            </div>
          )}

          <div className="modal-footer" style={{ marginTop: 16 }}>
            <button className="btn-ghost" onClick={() => setShowConfig(false)}>Fechar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}