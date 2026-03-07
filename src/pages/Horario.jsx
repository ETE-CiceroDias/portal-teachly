// pages/Horario.jsx — horários livres, sala editável, múltiplas aulas por slot
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { TURMAS } from '../data/turmas.js';
import { GearSix, Plus } from '@phosphor-icons/react';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

const DEFAULT_HORARIOS = ['18:40', '19:20', '20:00', '20:40'];

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;
}
function fmtRange(inicio, fim) {
  return fim ? `${inicio} – ${fim}` : inicio;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide ? { maxWidth: 520 } : {}} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
  );
}

export function Horario() {
  const [aulas,       setAulas]       = useState([]);   // todas as aulas do banco
  const [horarios,    setHorarios]    = useState(DEFAULT_HORARIOS); // linhas da grade
  const [loading,     setLoading]     = useState(true);

  // Modal de aula
  const [showAula,    setShowAula]    = useState(false);
  const [editId,      setEditId]      = useState(null);
  const [formAula,    setFormAula]    = useState({ dia:'Seg', hora_inicio:'18:40', hora_fim:'19:20', turma:'mod1a', disciplina:'', sala:'', obs:'' });

  // Modal de configurar horários
  const [showConfig,  setShowConfig]  = useState(false);
  const [novoHorario, setNovoHorario] = useState('');

  // ── Load ────────────────────────────────────────────────
  useEffect(() => {
    supabase.from('horario').select('*').order('hora_inicio').then(({ data }) => {
      setAulas(data || []);
      // Reconstrói linhas a partir dos horários salvos
      if (data && data.length > 0) {
        const hSet = new Set(DEFAULT_HORARIOS);
        data.forEach(r => { hSet.add(r.hora_inicio); });
        setHorarios([...hSet].sort((a,b) => timeToMin(a) - timeToMin(b)));
      }
      setLoading(false);
    });
  }, []);

  // Aulas de uma célula (dia × hora_inicio)
  const aulasCell = (dia, hora) =>
    aulas.filter(a => a.dia === dia && a.hora_inicio === hora);

  // ── Abrir modal nova aula numa célula ──────────────────
  const openNew = (dia, hora) => {
    setEditId(null);
    const minI = timeToMin(hora);
    const idx  = horarios.indexOf(hora);
    const fim  = idx < horarios.length - 1 ? horarios[idx+1] : minToTime(minI + 40);
    setFormAula({ dia, hora_inicio: hora, hora_fim: fim, turma:'mod1a', disciplina:'', sala:'', obs:'' });
    setShowAula(true);
  };

  // ── Abrir modal editar aula ───────────────────────────
  const openEdit = (aula, e) => {
    e.stopPropagation();
    setEditId(aula.id);
    setFormAula({
      dia:          aula.dia,
      hora_inicio:  aula.hora_inicio,
      hora_fim:     aula.hora_fim || '',
      turma:        aula.turma_label || 'mod1a',
      disciplina:   aula.disciplina || '',
      sala:         aula.sala || '',
      obs:          aula.obs || '',
    });
    setShowAula(true);
  };

  // ── Salvar aula ───────────────────────────────────────
  const salvarAula = async () => {
    const payload = {
      dia:          formAula.dia,
      hora_inicio:  formAula.hora_inicio,
      hora_fim:     formAula.hora_fim,
      turma_label:  formAula.turma,
      disciplina:   formAula.disciplina,
      sala:         formAula.sala,
      obs:          formAula.obs,
    };

    if (editId) {
      const { data } = await supabase.from('horario').update(payload).eq('id', editId).select().single();
      setAulas(a => a.map(x => x.id === editId ? data : x));
    } else {
      const { data } = await supabase.from('horario').insert(payload).select().single();
      setAulas(a => [...a, data]);
      // Adiciona nova linha se hora não existe
      if (!horarios.includes(formAula.hora_inicio)) {
        setHorarios(h => [...h, formAula.hora_inicio].sort((a,b) => timeToMin(a)-timeToMin(b)));
      }
    }
    setShowAula(false);
  };

  // ── Excluir aula ──────────────────────────────────────
  const excluirAula = async () => {
    if (!editId) return;
    await supabase.from('horario').delete().eq('id', editId);
    setAulas(a => a.filter(x => x.id !== editId));
    setShowAula(false);
  };

  // ── Adicionar linha de horário ────────────────────────
  const addHorario = () => {
    if (!novoHorario || horarios.includes(novoHorario)) return;
    setHorarios(h => [...h, novoHorario].sort((a,b) => timeToMin(a)-timeToMin(b)));
    setNovoHorario('');
  };

  const removeHorario = (h) => {
    if (aulas.some(a => a.hora_inicio === h)) {
      alert('Remova as aulas desse horário antes de excluí-lo.');
      return;
    }
    setHorarios(hs => hs.filter(x => x !== h));
  };

  if (loading) return <div style={{ color:'var(--text3)', padding:32 }}>Carregando horário...</div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Horário Semanal</div>
          <div className="page-subtitle">Clique em qualquer célula para adicionar uma aula</div>
        </div>
        <button className="btn-ghost" onClick={() => setShowConfig(true)} style={{display:'flex',alignItems:'center',gap:6}}><GearSix size={15} /> Horários</button>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'separate', borderSpacing:4, minWidth:520 }}>
          <thead>
            <tr>
              <th style={{ padding:'8px 12px', color:'var(--text3)', fontWeight:700, fontSize:'0.75rem', textAlign:'left', minWidth:90 }}>Hora</th>
              {DIAS.map(d => (
                <th key={d} style={{ padding:'8px 12px', color:'var(--text2)', fontWeight:700, fontSize:'0.85rem', textAlign:'center' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map(hora => (
              <tr key={hora}>
                <td style={{ padding:'8px 10px', fontSize:'0.75rem', color:'var(--text3)', fontWeight:600, whiteSpace:'nowrap', verticalAlign:'top', paddingTop:14 }}>
                  {hora}
                </td>
                {DIAS.map(dia => {
                  const cells = aulasCell(dia, hora);
                  return (
                    <td key={dia} style={{ padding:4, verticalAlign:'top' }}>
                      {/* Aulas já cadastradas */}
                      {cells.map(aula => {
                        const cor = TURMAS[aula.turma_label]?.cor || 'var(--accent)';
                        return (
                          <div
                            key={aula.id}
                            onClick={e => openEdit(aula, e)}
                            style={{
                              background: `${cor}18`, border:`1px solid ${cor}55`,
                              borderRadius:10, padding:'8px 10px', marginBottom:4,
                              cursor:'pointer', transition:'all 0.15s',
                            }}
                          >
                            <div style={{ fontSize:'0.68rem', fontWeight:700, color:cor, textTransform:'uppercase', letterSpacing:1 }}>
                              {TURMAS[aula.turma_label]?.label || aula.turma_label}
                              {aula.hora_fim && <span style={{ fontWeight:400, opacity:0.7 }}> · até {aula.hora_fim}</span>}
                            </div>
                            {aula.disciplina && <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text)', marginTop:2 }}>{aula.disciplina}</div>}
                            {aula.sala       && <div style={{ fontSize:'0.7rem', color:'var(--text3)', marginTop:1 }}>📍 {aula.sala}</div>}
                            {aula.obs        && <div style={{ fontSize:'0.7rem', color:'var(--text3)', marginTop:1 }}>{aula.obs}</div>}
                          </div>
                        );
                      })}
                      {/* Botão adicionar */}
                      <div
                        onClick={() => openNew(dia, hora)}
                        style={{
                          minHeight: cells.length === 0 ? 64 : 28,
                          borderRadius:10, cursor:'pointer',
                          border:'1px dashed var(--border)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          color:'var(--text3)', fontSize:'0.75rem',
                          transition:'all 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
                      >
                        +
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: adicionar/editar aula */}
      {showAula && (
        <Modal title={editId ? 'Editar aula' : 'Nova aula'} onClose={() => setShowAula(false)} wide>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <div className="modal-field">
              <div className="modal-label">Dia</div>
              <select className="modal-input" value={formAula.dia} onChange={e => setFormAula(f=>({...f,dia:e.target.value}))}>
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="modal-field">
              <div className="modal-label">Turma</div>
              <select className="modal-input" value={formAula.turma} onChange={e => setFormAula(f=>({...f,turma:e.target.value}))}>
                {Object.entries(TURMAS).map(([k,t]) => (
                  <option key={k} value={k}>{t.modulo} · {t.label}</option>
                ))}
              </select>
            </div>
            <div className="modal-field">
              <div className="modal-label">Início</div>
              <input type="time" className="modal-input" value={formAula.hora_inicio}
                onChange={e => setFormAula(f=>({...f,hora_inicio:e.target.value}))} />
            </div>
            <div className="modal-field">
              <div className="modal-label">Fim</div>
              <input type="time" className="modal-input" value={formAula.hora_fim}
                onChange={e => setFormAula(f=>({...f,hora_fim:e.target.value}))} />
            </div>
          </div>
          <div className="modal-field">
            <div className="modal-label">Disciplina</div>
            <input className="modal-input" placeholder="ex: DCU, Design Thinking..." value={formAula.disciplina}
              onChange={e => setFormAula(f=>({...f,disciplina:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">Sala (opcional)</div>
            <input className="modal-input" placeholder="ex: Sala 203, Lab de Informática..." value={formAula.sala}
              onChange={e => setFormAula(f=>({...f,sala:e.target.value}))} />
          </div>
          <div className="modal-field">
            <div className="modal-label">Observação (opcional)</div>
            <input className="modal-input" placeholder="Qualquer nota extra..." value={formAula.obs}
              onChange={e => setFormAula(f=>({...f,obs:e.target.value}))} />
          </div>
          <div className="modal-footer">
            {editId && <button className="btn-ghost" style={{ color:'var(--red)' }} onClick={excluirAula}>Excluir</button>}
            <button className="btn-ghost" onClick={() => setShowAula(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvarAula}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal: configurar linhas de horário */}
      {showConfig && (
        <Modal title="⚙️ Configurar horários da grade" onClose={() => setShowConfig(false)}>
          <div style={{ fontSize:'0.8rem', color:'var(--text2)', marginBottom:12 }}>
            Adicione ou remova os horários que aparecem como linhas na grade.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
            {horarios.map(h => (
              <div key={h} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px' }}>
                <span style={{ fontFamily:'monospace', color:'var(--text)', fontWeight:600 }}>{h}</span>
                <button onClick={() => removeHorario(h)} style={{ background:'none', border:'none', color:'var(--red)', cursor:'pointer', fontSize:'1rem' }}>×</button>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input
              type="time"
              className="modal-input"
              style={{ marginBottom:0, flex:1 }}
              value={novoHorario}
              onChange={e => setNovoHorario(e.target.value)}
            />
            <button className="btn-primary" style={{ padding:'10px 18px', whiteSpace:'nowrap' }} onClick={addHorario}>
              + Adicionar
            </button>
          </div>
          <div className="modal-footer" style={{ marginTop:16 }}>
            <button className="btn-ghost" onClick={() => setShowConfig(false)}>Fechar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
