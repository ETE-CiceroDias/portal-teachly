// pages/Disciplinas.jsx — gerenciar quais disciplinas aparecem por turma
import { useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg } from '../store/OrgContext.jsx';

export function Disciplinas({ onNavigate }) {
  
  const { turmas, reload } = useOrg();
  const [saving, setSaving] = useState(null); // id da disc sendo salva
  const [saved,  setSaved]  = useState(false);

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
          <div className="page-subtitle">Ative ou oculte disciplinas por turma. Os dados não são apagados.</div>
        </div>
        {saved && <span style={{ color: 'var(--green)', fontSize: '0.85rem', fontWeight: 600 }}>✓ Salvo!</span>}
      </div>

      {turmas.map(turma => (
        <div key={turma.id} style={{ marginBottom: 28 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
              {turma.disciplinas.map(disc => {
                const oculta   = !disc.ativa;
                const isSaving = saving === disc.id;

                return (
                  <div
                    key={disc.id}
                    onClick={() => !isSaving && toggleAtiva(disc)}
                    style={{
                      background:   oculta ? 'var(--surface)' : `${disc.cor}10`,
                      border:       `1px solid ${oculta ? 'var(--border)' : disc.cor + '40'}`,
                      borderRadius: 12, padding: '14px 16px',
                      cursor: isSaving ? 'wait' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: oculta ? 0.45 : 1,
                      userSelect: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: disc.cor, flexShrink: 0 }} />
                      <div style={{
                        fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
                        borderRadius: 99, border: '1px solid',
                        color:       oculta ? 'var(--text3)' : disc.cor,
                        borderColor: oculta ? 'var(--border)' : disc.cor + '60',
                        background:  oculta ? 'transparent' : disc.cor + '15',
                      }}>
                        {isSaving ? '…' : oculta ? 'Oculta' : 'Ativa'}
                      </div>
                    </div>

                    <div style={{ fontWeight: 700, color: oculta ? 'var(--text3)' : 'var(--text)', fontSize: '0.9rem' }}>
                      {disc.label}
                    </div>

                    {disc.code && (
                      <div style={{
                        fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text3)',
                        background: 'var(--surface2)', borderRadius: 5,
                        padding: '2px 7px', display: 'inline-block', marginTop: 4,
                      }}>
                        {disc.code}
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
        💡 Disciplinas ocultas somem do menu lateral mas os dados ficam preservados no banco. Você pode reativar a qualquer momento.
      </div>
    </div>
  );
}