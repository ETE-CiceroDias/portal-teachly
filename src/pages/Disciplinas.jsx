// pages/Disciplinas.jsx — com progresso de aulas dadas por disciplina
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';

export function Disciplinas({ onNavigate }) {
  const { turmas, reload } = useOrg();
  const [saving, setSaving] = useState(null);
  const [saved,  setSaved]  = useState(false);

  // Aulas planejadas e dadas por disciplina
  const [aulasMap, setAulasMap] = useState({}); // { disciplina_id: { total, dadas } }

  useEffect(() => {
    supabase
      .from('aulas_planejadas')
      .select('disciplina_id, status')
      .then(({ data }) => {
        if (!data) return;
        const map = {};
        data.forEach(a => {
          if (!map[a.disciplina_id]) map[a.disciplina_id] = { total: 0, dadas: 0 };
          map[a.disciplina_id].total++;
          if (a.status === 'dada') map[a.disciplina_id].dadas++;
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
        <div style={{
          padding: '40px', textAlign: 'center', color: 'var(--text3)',
          background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 16,
        }}>
          Nenhuma disciplina cadastrada ainda. Crie turmas e disciplinas em{' '}
          <button
            onClick={() => onNavigate?.('gerenciar-discs')}
            style={{ background: 'none', border: 'none', color: 'var(--accent3)', cursor: 'pointer', fontWeight: 700 }}
          >
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
          <div className="page-subtitle">Progresso de aulas dadas por disciplina. Dados nunca são apagados.</div>
        </div>
        {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Salvo!</span>}
      </div>

      {turmas.map(turma => (
        <div key={turma.id} style={{ marginBottom: 32 }}>
          {/* Cabeçalho da turma */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: turma.cor, flexShrink: 0 }} />
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.9375rem' }}>
              {turma.modulo} · {turma.label}
            </div>
            {turma.periodo && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{turma.periodo}</div>
            )}
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 'auto' }}>
              {turma.disciplinas.filter(d => d.ativa).length}/{turma.disciplinas.length} ativas
            </div>
          </div>

          {turma.disciplinas.length === 0 ? (
            <div style={{
              padding: '16px', textAlign: 'center', color: 'var(--text3)', fontSize: '0.875rem',
              background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 12,
            }}>
              Nenhuma disciplina nessa turma
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 10 }}>
              {turma.disciplinas.map(disc => {
                const oculta   = !disc.ativa;
                const isSaving = saving === disc.id;
                const stats    = aulasMap[disc.id] || { total: 0, dadas: 0 };
                const pct      = stats.total > 0 ? Math.round((stats.dadas / stats.total) * 100) : 0;
                const temAulas = stats.total > 0;

                return (
                  <div
                    key={disc.id}
                    style={{
                      background:   oculta ? 'var(--surface)' : `${disc.cor}10`,
                      border:       `1px solid ${oculta ? 'var(--border)' : disc.cor + '40'}`,
                      borderRadius: 12, padding: '14px 16px',
                      transition: 'all 0.2s',
                      opacity: oculta ? 0.45 : 1,
                    }}
                  >
                    {/* Linha superior: bolinha + badge status */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: disc.cor, flexShrink: 0 }} />
                      <div
                        onClick={() => !isSaving && toggleAtiva(disc)}
                        style={{
                          fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                          borderRadius: 99, border: '1px solid',
                          color:       oculta ? 'var(--text3)' : disc.cor,
                          borderColor: oculta ? 'var(--border)' : disc.cor + '60',
                          background:  oculta ? 'transparent' : disc.cor + '15',
                          cursor: isSaving ? 'wait' : 'pointer',
                          userSelect: 'none',
                        }}
                      >
                        {isSaving ? '…' : oculta ? 'Oculta' : 'Ativa'}
                      </div>
                    </div>

                    {/* Nome da disciplina */}
                    <div style={{ fontWeight: 700, color: oculta ? 'var(--text3)' : 'var(--text)', fontSize: '0.9rem', marginBottom: 4 }}>
                      {disc.label}
                    </div>

                    {disc.code && (
                      <div style={{
                        fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text3)',
                        background: 'var(--surface2)', borderRadius: 5,
                        padding: '2px 7px', display: 'inline-block', marginBottom: 10,
                      }}>
                        {disc.code}
                      </div>
                    )}

                    {/* Progresso de aulas */}
                    {temAulas ? (
                      <div style={{ marginTop: 8 }}>
                        {/* Barra de progresso */}
                        <div style={{ height: 5, borderRadius: 99, background: 'var(--surface2)', overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${pct}%`,
                            background: pct === 100
                              ? 'var(--green)'
                              : oculta ? 'var(--text3)' : disc.cor,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        {/* Texto */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{stats.dadas}</span>
                            {' '}dada{stats.dadas !== 1 ? 's' : ''} de{' '}
                            <span style={{ fontWeight: 600 }}>{stats.total}</span> planejada{stats.total !== 1 ? 's' : ''}
                          </div>
                          <div style={{
                            fontSize: '0.68rem', fontWeight: 700,
                            color: pct === 100 ? 'var(--green)' : 'var(--text3)',
                          }}>
                            {pct}%
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                        Nenhuma aula planejada ainda
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <div style={{
        background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)',
        borderRadius: 12, padding: '14px 16px', fontSize: '0.8125rem', color: 'var(--accent3)',
        marginTop: 8,
      }}>
        💡 Clique no badge <strong>Ativa/Oculta</strong> para esconder uma disciplina do menu. Os dados e o progresso de aulas ficam preservados no banco e podem ser recuperados a qualquer momento.
      </div>
    </div>
  );
}