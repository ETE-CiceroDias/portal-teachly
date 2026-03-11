// pages/Disciplinas.jsx — progresso + lista de aulas planejadas e dadas
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';

const fmtData = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

export function Disciplinas({ onNavigate }) {
  const { turmas, reload } = useOrg();
  const [saving,      setSaving]      = useState(null);
  const [saved,       setSaved]       = useState(false);
  const [expandedDisc, setExpandedDisc] = useState(null);

  // { disciplina_id: [{...aula_planejada}] }
  const [aulasMap, setAulasMap] = useState({});

  useEffect(() => {
    supabase
      .from('aulas_planejadas')
      .select('*')
      .order('data_planejada')
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(a => {
          if (!map[a.disciplina_id]) map[a.disciplina_id] = [];
          map[a.disciplina_id].push(a);
        });
        setAulasMap(map);
      });
  }, []);

  const toggleAtiva = async (disc) => {
    setSaving(disc.id);
    const { error } = await supabase
      .from('disciplinas')
      .update({ ativa: !disc.ativa })
      .eq('id', disc.id);
    if (!error) {
      await reload();
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setSaving(null);
  };

  const marcarStatus = async (aulaId, novoStatus) => {
    const dataDada = novoStatus === 'dada' ? new Date().toISOString().split('T')[0] : null;
    const { error } = await supabase
      .from('aulas_planejadas')
      .update({ status: novoStatus, data_dada: dataDada })
      .eq('id', aulaId);
    if (!error) {
      setAulasMap(prev => {
        const next = { ...prev };
        for (const key in next) {
          next[key] = next[key].map(a =>
            a.id === aulaId ? { ...a, status: novoStatus, data_dada: dataDada } : a
          );
        }
        return next;
      });
    }
  };

  const allDiscs = turmas.flatMap(t => t.disciplinas);
  if (allDiscs.length === 0) {
    return (
      <div className="anim-up">
        <div className="page-header">
          <div>
            <div className="page-title">Disciplinas</div>
            <div className="page-subtitle">Ative ou oculte disciplinas por turma.</div>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 16 }}>
          Nenhuma disciplina cadastrada ainda. Crie turmas e disciplinas em{' '}
          <button onClick={() => onNavigate?.('gerenciar-discs')} style={{ background: 'none', border: 'none', color: 'var(--accent3)', cursor: 'pointer', fontWeight: 700 }}>
            Disciplinas &amp; Turmas
          </button>.
        </div>
      </div>
    );
  }

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Disciplinas</div>
          <div className="page-subtitle">Progresso de aulas planejadas e dadas por disciplina. Dados nunca são apagados.</div>
        </div>
        {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Salvo!</span>}
      </div>

      {turmas.map(turma => (
        <div key={turma.id} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: turma.cor, flexShrink: 0 }} />
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9375rem' }}>
              {turma.modulo} · {turma.label}
            </div>
            {turma.periodo && <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{turma.periodo}</div>}
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 'auto' }}>
              {turma.disciplinas.filter(d => d.ativa).length}/{turma.disciplinas.length} ativas
            </div>
          </div>

          {turma.disciplinas.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '0.875rem', background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12 }}>
              Nenhuma disciplina nessa turma
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {turma.disciplinas.map(disc => {
                const oculta   = !disc.ativa;
                const isSaving = saving === disc.id;
                const aulas    = aulasMap[disc.id] || [];
                const dadas    = aulas.filter(a => a.status === 'dada');
                const planej   = aulas.filter(a => a.status !== 'dada');
                const total    = aulas.length;
                const pct      = total > 0 ? Math.round((dadas.length / total) * 100) : 0;
                const isOpen   = expandedDisc === disc.id;

                return (
                  <div key={disc.id} style={{
                    background:   oculta ? 'var(--surface)' : `${disc.cor}08`,
                    border:       `1px solid ${oculta ? 'var(--border)' : disc.cor + '35'}`,
                    borderRadius: 12,
                    opacity:      oculta ? 0.5 : 1,
                    transition:   'all 0.2s',
                  }}>
                    {/* Cabeçalho clicável */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: total > 0 ? 'pointer' : 'default' }}
                      onClick={() => total > 0 && setExpandedDisc(isOpen ? null : disc.id)}
                    >
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: disc.cor, flexShrink: 0 }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: oculta ? 'var(--text3)' : 'var(--text)', fontSize: '0.9rem' }}>
                          {disc.label}
                        </div>
                        {disc.code && (
                          <div style={{ fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text3)', background: 'var(--surface2)', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginTop: 3 }}>
                            {disc.code}
                          </div>
                        )}
                      </div>

                      {/* Contadores + barra */}
                      {total > 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                              <span style={{ color: 'var(--green)', fontWeight: 700 }}>{dadas.length}</span> dadas
                              {' · '}
                              <span style={{ color: 'var(--teal)', fontWeight: 700 }}>{planej.length}</span> planejadas
                            </div>
                            <div style={{ height: 4, width: 100, borderRadius: 99, background: 'var(--surface2)', marginTop: 4, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: pct === 100 ? 'var(--green)' : disc.cor, transition: 'width 0.4s' }} />
                            </div>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text3)', minWidth: 28 }}>{pct}%</span>
                          <span style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>{isOpen ? '▲' : '▼'}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text3)', fontStyle: 'italic', flexShrink: 0 }}>
                          Nenhuma aula planejada ainda
                        </span>
                      )}

                      {/* Badge ativa/oculta */}
                      <div
                        onClick={e => { e.stopPropagation(); !isSaving && toggleAtiva(disc); }}
                        style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '3px 10px',
                          borderRadius: 99, border: '1px solid',
                          color:       oculta ? 'var(--text3)' : disc.cor,
                          borderColor: oculta ? 'var(--border)' : disc.cor + '60',
                          background:  oculta ? 'transparent' : disc.cor + '15',
                          cursor: isSaving ? 'wait' : 'pointer',
                          userSelect: 'none', flexShrink: 0,
                        }}
                      >
                        {isSaving ? '…' : oculta ? 'Oculta' : 'Ativa'}
                      </div>
                    </div>

                    {/* Lista expandida */}
                    {isOpen && total > 0 && (
                      <div style={{ borderTop: `1px solid ${disc.cor}20`, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

                        {/* Planejadas */}
                        {planej.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--teal)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ⏳ Planejadas — ainda não dadas ({planej.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {planej.map(a => (
                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.18)', borderRadius: 8, padding: '8px 12px' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {a.aula_titulo}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>
                                      📅 {fmtData(a.data_planejada)}{a.hora ? ` · ${a.hora}` : ''}{a.obs ? ` · ${a.obs}` : ''}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => marcarStatus(a.id, 'dada')}
                                    style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.07)', color: 'var(--green)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                                  >
                                    ✓ Marcar como dada
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Dadas */}
                        {dadas.length > 0 && (
                          <div>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--green)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              ✓ Dadas ({dadas.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {dadas.map(a => (
                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 8, padding: '8px 12px' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.65, textDecoration: 'line-through' }}>
                                      {a.aula_titulo}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text3)', marginTop: 2 }}>
                                      Planejada {fmtData(a.data_planejada)}
                                      {a.data_dada ? ` · Dada em ${fmtData(a.data_dada)}` : ''}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => marcarStatus(a.id, 'planejada')}
                                    style={{ fontSize: '0.7rem', fontWeight: 600, padding: '4px 11px', borderRadius: 6, border: '1px solid rgba(20,184,166,0.3)', background: 'rgba(20,184,166,0.06)', color: 'var(--teal)', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0 }}
                                  >
                                    ↩ Desfazer
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--accent3)', marginTop: 8 }}>
        💡 Clique na disciplina para ver e gerenciar as aulas. Clique no badge <strong>Ativa/Oculta</strong> para esconder do menu. Dados nunca são apagados.
      </div>
    </div>
  );
}