// pages/Dashboard.jsx — visão geral com filtro de turma + aderência ao planejamento
import { useState, useEffect, useMemo } from 'react';
import { EmptyState } from '../components/EmptyState.jsx';
import { aulaId } from '../store/storage.js';
import { COURSES } from '../data/courses.js';
import { useOrg } from '../store/OrgContext.jsx';
import { supabase } from '../lib/supabase.js';
import {
  Funnel, CheckCircle, Clock, Warning, BookOpen, ChartBar,
} from '@phosphor-icons/react';

function StatCard({ icon, val, label, cls }) {
  const colors = {
    green:  { bg:'var(--green-bg)',  border:'var(--green-border)',  text:'var(--green)'  },
    amber:  { bg:'var(--amber-bg)',  border:'var(--amber-border)',  text:'var(--amber)'  },
    red:    { bg:'rgba(239,68,68,0.08)', border:'rgba(239,68,68,0.18)', text:'var(--red)' },
    purple: { bg:'rgba(139,92,246,0.08)', border:'rgba(139,92,246,0.18)', text:'var(--accent-light)' },
    teal:   { bg:'rgba(20,184,166,0.08)', border:'rgba(20,184,166,0.18)', text:'var(--teal)' },
  };
  const c = colors[cls] || colors.purple;
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>{icon}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function MiniBar({ pct, cor }) {
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'var(--border)', overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: cor || 'var(--accent)', borderRadius: 99, transition: 'width 0.5s ease' }} />
    </div>
  );
}

export function Dashboard({ state, onNavigate }) {
  const { turmas } = useOrg();
  const [filtroTurma, setFiltroTurma] = useState('todas');
  // Aulas planejadas do banco
  const [planejadas, setPlanejadas] = useState([]);

  useEffect(() => {
    supabase.from('aulas_planejadas').select('*').then(({ data }) => setPlanejadas(data || []));
  }, []);

  // Turmas a mostrar
  const turmasFiltradas = filtroTurma === 'todas'
    ? turmas
    : turmas.filter(t => t.id === filtroTurma);

  // Agrega stats de todas as turmas filtradas
  const statsGerais = useMemo(() => {
    let totalAulas = 0, doneAulas = 0, problems = 0;
    turmasFiltradas.forEach(turma => {
      const discs = (turma.disciplinas || []).filter(d => d.ativa);
      const turmaKey = turma.key || turma.id;
      discs.forEach(disc => {
        (disc.blocos || []).forEach(bloco => {
          (bloco.aulas || []).forEach(aula => {
            if (aula.id === 'NOTA') return;
            totalAulas++;
            const cKey = (Object.values(COURSES).find(c => c.code === disc.code || c.key === disc.key || c.fullname?.toLowerCase() === disc.label?.toLowerCase() || c.label?.toLowerCase() === disc.label?.toLowerCase()))?.key || disc.key;
            const id = aulaId(cKey, turmaKey, aula);
            const st = state[id] || {};
            if (st.done) doneAulas++;
            if ((st.problems || []).length > 0) problems++;
          });
        });
      });
    });
    const pct = totalAulas ? Math.round(doneAulas / totalAulas * 100) : 0;
    return { totalAulas, doneAulas, pendentes: totalAulas - doneAulas, problems, pct };
  }, [turmasFiltradas, state]);

  // Aderência ao planejamento
  const aderencia = useMemo(() => {
    const hoje = new Date().toISOString().slice(0, 10);
    // aulas planejadas com data no passado ou hoje
    const passadas = planejadas.filter(p => p.data_planejada <= hoje);
    if (passadas.length === 0) return null;
    // das planejadas passadas, quantas foram de fato dadas?
    let dadas = 0;
    passadas.forEach(p => {
      // verifica no state se a aula foi marcada como dada
      const turma = turmas.find(t => t.id === p.turma_id);
      if (!turma) return;
      const turmaKey = turma.key || turma.id;
      const disc = (turma.disciplinas || []).find(d => d.id === p.disciplina_id);
      if (!disc) return;
      let aulaObj = null;
      (disc.blocos || []).forEach(b => {
        b.aulas.forEach(a => { if (a.id === p.aula_id || a.titulo === p.aula_titulo) aulaObj = a; });
      });
      if (!aulaObj) return;
      const cKey2 = (Object.values(COURSES).find(c => c.code === disc.code || c.key === disc.key || c.fullname?.toLowerCase() === disc.label?.toLowerCase() || c.label?.toLowerCase() === disc.label?.toLowerCase()))?.key || disc.key;
      const id = aulaId(cKey2, turmaKey, aulaObj);
      if (state[id]?.done) dadas++;
    });
    const pct = Math.round(dadas / passadas.length * 100);
    return { planejadas: passadas.length, dadas, pct };
  }, [planejadas, turmas, state]);

  // Todas as disciplinas de todas as turmas filtradas, com stats
  const todasDiscs = useMemo(() => {
    const result = [];
    turmasFiltradas.forEach(turma => {
      const turmaKey = turma.key || turma.id;
      const discs = (turma.disciplinas || []).filter(d => d.ativa);
      discs.forEach(disc => {
        let total = 0, done = 0, prob = 0;
        (disc.blocos || []).forEach(b => {
          (b.aulas || []).forEach(a => {
            if (a.id === 'NOTA') return;
            total++;
            const cKey3 = (Object.values(COURSES).find(c => c.code === disc.code || c.key === disc.key || c.fullname?.toLowerCase() === disc.label?.toLowerCase() || c.label?.toLowerCase() === disc.label?.toLowerCase()))?.key || disc.key;
            const id = aulaId(cKey3, turmaKey, a);
            const st = state[id] || {};
            if (st.done) done++;
            if ((st.problems || []).length > 0) prob++;
          });
        });
        result.push({ disc, turma, turmaKey, total, done, pct: total ? Math.round(done/total*100) : 0, prob });
      });
    });
    return result;
  }, [turmasFiltradas, state]);

  // Problemas de todas as turmas filtradas
  const allProbs = useMemo(() => {
    const result = [];
    turmasFiltradas.forEach(turma => {
      const turmaKey = turma.key || turma.id;
      const discs = (turma.disciplinas || []).filter(d => d.ativa);
      discs.forEach(disc => {
        (disc.blocos || []).forEach(b => {
          (b.aulas || []).forEach(a => {
            if (a.id === 'NOTA') return;
            const cKey4 = (Object.values(COURSES).find(c => c.code === disc.code || c.key === disc.key || c.fullname?.toLowerCase() === disc.label?.toLowerCase() || c.label?.toLowerCase() === disc.label?.toLowerCase()))?.key || disc.key;
            const id = aulaId(cKey4, turmaKey, a);
            const st = state[id] || {};
            (st.problems || []).forEach(p => result.push({ text: p, aula: a.titulo?.split('\n')[0] || '', course: disc.label, turma: turma.label }));
          });
        });
      });
    });
    return result;
  }, [turmasFiltradas, state]);

  return (
    <div className="anim-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">
            {filtroTurma === 'todas' ? `Todas as turmas — ${turmas.length} turmas, ${todasDiscs.length} disciplinas` : turmas.find(t=>t.id===filtroTurma)?.label}
          </div>
        </div>
        {/* Filtro de turma */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Funnel size={15} color="var(--text3)" />
          <select
            className="modal-input"
            value={filtroTurma}
            onChange={e => setFiltroTurma(e.target.value)}
            style={{ minWidth: 180, fontSize:'0.85rem' }}
          >
            <option value="todas">Quadro geral</option>
            {turmas.map(t => (
              <option key={t.id} value={t.id}>{t.modulo} · {t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
        <StatCard icon={<CheckCircle size={18} weight="fill" />} val={statsGerais.doneAulas}   label="Aulas dadas"    cls="green" />
        <StatCard icon={<Clock size={18} />}                     val={statsGerais.pendentes}    label="Pendentes"      cls="amber" />
        <StatCard icon={<Warning size={18} />}                   val={statsGerais.problems}     label="Com problemas"  cls="red"   />
        <StatCard icon={<BookOpen size={18} />}                  val={statsGerais.totalAulas}   label="Total de aulas" cls="purple" />
        {aderencia && (
          <StatCard
            icon={<ChartBar size={18} />}
            val={`${aderencia.pct}%`}
            label={`Aderência ao planejamento (${aderencia.dadas}/${aderencia.planejadas})`}
            cls="teal"
          />
        )}
      </div>

      {/* Barra progresso geral */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          <div style={{ fontSize:'0.8rem', color:'var(--text3)' }}>Progresso geral</div>
          <div style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--accent-light)' }}>{statsGerais.pct}%</div>
        </div>
        <div className="progress-bar" style={{ marginBottom:0 }}>
          <div className="progress-fill" style={{ width:`${statsGerais.pct}%` }} />
        </div>
      </div>

      {/* Bloco de aderência expandido */}
      {aderencia && (
        <div style={{ background:'rgba(20,184,166,0.06)', border:'1px solid rgba(20,184,166,0.2)', borderRadius:14, padding:'16px 20px', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <ChartBar size={16} color="var(--teal)" weight="fill" />
            <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--teal)' }}>Aderência ao planejamento</span>
          </div>
          <div style={{ fontSize:'0.85rem', color:'var(--text2)', lineHeight:1.6 }}>
            Das <strong style={{color:'var(--text)'}}>{aderencia.planejadas}</strong> aulas planejadas com data já passada,{' '}
            <strong style={{color:'var(--teal)'}}>{aderencia.dadas}</strong> foram de fato ministradas —{' '}
            <strong style={{color:'var(--teal)'}}>{aderencia.pct}% de aderência</strong>.
          </div>
          <MiniBar pct={aderencia.pct} cor="var(--teal)" />
          {aderencia.pct < 60 && (
            <div style={{ fontSize:'0.75rem', color:'var(--amber)', marginTop:8 }}>⚠ Muitas aulas planejadas ainda não foram dadas. Confira o calendário.</div>
          )}
        </div>
      )}

      {/* Cards de disciplinas */}
      <div className="section-label">Disciplinas</div>
      {todasDiscs.length === 0 ? (
        <EmptyState icon="📚" title="Nenhuma disciplina ativa" desc="Configure disciplinas em Configurações." action="Ir para Configurações" onAction={() => onNavigate('disciplinas')} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12, marginBottom:28 }}>
          {todasDiscs.map(({ disc, turma, total, done, pct, prob }) => (
            <div key={disc.id + turma.id} className="course-card" onClick={() => onNavigate(disc.id)}
              style={{ cursor:'pointer', transition:'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}
            >
              <div className="cc-top">
                <div>
                  <div className="cc-code">{disc.code}</div>
                  <div className="cc-name">{disc.label}</div>
                  {filtroTurma === 'todas' && (
                    <div style={{ fontSize:'0.68rem', color:'var(--text3)', marginTop:2 }}>
                      <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:turma.cor, marginRight:4 }} />
                      {turma.modulo} · {turma.label}
                    </div>
                  )}
                </div>
                <div className="cc-pct" style={{ color: disc.cor || 'var(--accent-light)' }}>{pct}%</div>
              </div>
              <div className="mini-bar">
                <div className="mini-fill" style={{ width:`${pct}%`, background: disc.cor || 'var(--accent)' }} />
              </div>
              <div className="cc-meta">
                {done}/{total} aulas
                {prob > 0 && <span className="cc-warn"> · {prob} problema{prob > 1 ? 's' : ''}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Problemas */}
      {allProbs.length > 0 && (
        <>
          <div className="section-label">Problemas registrados</div>
          <div className="prob-list">
            {allProbs.map((p, i) => (
              <div key={i} className="prob-item">
                <div className="prob-dot">⚠</div>
                <div>
                  <div className="prob-text">{p.text}</div>
                  <div className="prob-meta">{p.course} · {p.aula}{filtroTurma === 'todas' ? ` · ${p.turma}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}