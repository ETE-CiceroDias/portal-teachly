// pages/Onboarding.jsx — Wizard de primeira vez
// Cria organização → turmas → disciplinas
import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

const CORES = ['#7c3aed','#a855f7','#c084fc','#e879f9','#60a5fa','#4ade80','#fbbf24','#fb923c','#f87171','#2dd4bf'];
const DISC_SUGESTOES = [
  { nome:'Design Centrado no Usuário', codigo:'DE_232', cor:'#7c3aed' },
  { nome:'Design Thinking',            codigo:'DE_233', cor:'#c084fc' },
  { nome:'Projeto Integrador I',       codigo:'DS_PI',  cor:'#e879f9' },
  { nome:'Programação Web',            codigo:'DS_PW',  cor:'#60a5fa' },
  { nome:'Design de Interfaces Mobile',codigo:'DE_242', cor:'#fbbf24' },
  { nome:'Programação Web — Módulo 3', codigo:'PROG3',  cor:'#4ade80' },
];

// ── helpers de UI ─────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#6b5a8a', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      {children}
    </div>
  );
}
function Input({ ...props }) {
  return (
    <input {...props} style={{
      width:'100%', background:'#080212', border:'1px solid #2a1650',
      borderRadius:10, padding:'10px 14px', color:'#f0eaff',
      fontFamily:'inherit', fontSize:'0.9rem', outline:'none',
      transition:'border-color 0.2s', ...props.style,
    }}
    onFocus={e=>e.target.style.borderColor='#7c3aed'}
    onBlur={e=>e.target.style.borderColor='#2a1650'} />
  );
}
function Btn({ children, onClick, variant='primary', disabled, style }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding:'11px 22px', borderRadius:11, border:'none', cursor: disabled?'not-allowed':'pointer',
      fontFamily:'inherit', fontWeight:700, fontSize:'0.9rem', transition:'all 0.2s',
      opacity: disabled ? 0.5 : 1,
      ...(variant==='primary'
        ? { background:'linear-gradient(135deg,#7c3aed,#a855f7)', color:'white', boxShadow:'0 4px 20px rgba(124,58,237,0.35)' }
        : { background:'#1a0f2e', border:'1px solid #2a1650', color:'#b8a8d8' }),
      ...style,
    }}>{children}</button>
  );
}
function CorePicker({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
      {CORES.map(c => (
        <div key={c} onClick={()=>onChange(c)} style={{
          width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer',
          border: value===c ? '3px solid white' : '3px solid transparent',
          boxShadow: value===c ? `0 0 0 2px ${c}` : 'none',
          transition:'all 0.15s',
        }}/>
      ))}
    </div>
  );
}

// ── Step 1: Organização ───────────────────────────────────────
function StepOrg({ onNext }) {
  const [nome,   setNome]   = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('PE');
  const [tipo,   setTipo]   = useState('escola');

  const ok = nome.trim().length >= 3;

  return (
    <div>
      <div style={{ fontSize:'2rem', marginBottom:8 }}>🏫</div>
      <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.5rem', color:'#f0eaff', marginBottom:6 }}>Sua organização</h2>
      <p style={{ color:'#6b5a8a', fontSize:'0.875rem', marginBottom:28 }}>Pode ser uma escola, instituto, curso livre ou qualquer instituição.</p>

      <Field label="Nome da instituição *">
        <Input value={nome} onChange={e=>setNome(e.target.value)} placeholder="ETE Cícero Dias" autoFocus />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 80px', gap:12 }}>
        <Field label="Cidade">
          <Input value={cidade} onChange={e=>setCidade(e.target.value)} placeholder="Recife" />
        </Field>
        <Field label="Estado">
          <Input value={estado} onChange={e=>setEstado(e.target.value)} placeholder="PE" />
        </Field>
      </div>
      <Field label="Tipo">
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {['escola','instituto','curso','universidade','outro'].map(t=>(
            <button key={t} onClick={()=>setTipo(t)} style={{
              padding:'6px 14px', borderRadius:99, border:`1px solid ${tipo===t?'#7c3aed':'#2a1650'}`,
              background: tipo===t?'rgba(124,58,237,0.2)':'transparent',
              color: tipo===t?'#a855f7':'#6b5a8a', cursor:'pointer', fontFamily:'inherit',
              fontSize:'0.82rem', fontWeight:600, textTransform:'capitalize',
            }}>{t}</button>
          ))}
        </div>
      </Field>

      <div style={{ marginTop:32 }}>
        <Btn disabled={!ok} onClick={()=>onNext({ nome:nome.trim(), cidade, estado, tipo })}>Próximo →</Btn>
      </div>
    </div>
  );
}

// ── Step 2: Turmas ────────────────────────────────────────────
function StepTurmas({ onNext, onBack }) {
  const [turmas, setTurmas] = useState([
    { label:'Turma A', modulo:'Módulo 1', cor:'#c084fc', hasDesafio:true },
  ]);

  const add = () => setTurmas(t => [...t, { label:'', modulo:'', cor:'#7c3aed', hasDesafio:false }]);
  const rem = (i) => setTurmas(t => t.filter((_,j)=>j!==i));
  const upd = (i, k, v) => setTurmas(t => t.map((x,j)=>j===i?{...x,[k]:v}:x));

  const ok = turmas.length > 0 && turmas.every(t=>t.label.trim() && t.modulo.trim());

  return (
    <div>
      <div style={{ fontSize:'2rem', marginBottom:8 }}>🎓</div>
      <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.5rem', color:'#f0eaff', marginBottom:6 }}>Turmas</h2>
      <p style={{ color:'#6b5a8a', fontSize:'0.875rem', marginBottom:24 }}>Adicione uma ou mais turmas. Você pode editar depois.</p>

      <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:16 }}>
        {turmas.map((t,i)=>(
          <div key={i} style={{ background:'#1a0f2e', border:'1px solid #2a1650', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ display:'flex', gap:12, marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.72rem', color:'#6b5a8a', fontWeight:700, marginBottom:5 }}>NOME DA TURMA</div>
                <Input value={t.label} onChange={e=>upd(i,'label',e.target.value)} placeholder="Turma A" />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'0.72rem', color:'#6b5a8a', fontWeight:700, marginBottom:5 }}>MÓDULO</div>
                <Input value={t.modulo} onChange={e=>upd(i,'modulo',e.target.value)} placeholder="Módulo 1" />
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:'0.72rem', color:'#6b5a8a', fontWeight:700, marginBottom:6 }}>COR</div>
              <CorePicker value={t.cor} onChange={v=>upd(i,'cor',v)} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.83rem', color:'#b8a8d8' }}>
                <input type="checkbox" checked={t.hasDesafio} onChange={e=>upd(i,'hasDesafio',e.target.checked)}
                  style={{ accentColor:'#7c3aed' }} />
                Tem Desafio UX/UI
              </label>
              {turmas.length>1 && (
                <button onClick={()=>rem(i)} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:'0.8rem' }}>
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <button onClick={add} style={{
        width:'100%', padding:'10px', border:'1px dashed #2a1650', borderRadius:12,
        background:'transparent', color:'#6b5a8a', cursor:'pointer', fontFamily:'inherit',
        fontSize:'0.85rem', marginBottom:28,
      }}>+ Adicionar turma</button>

      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="ghost" onClick={onBack}>← Voltar</Btn>
        <Btn disabled={!ok} onClick={()=>onNext(turmas)}>Próximo →</Btn>
      </div>
    </div>
  );
}

// ── Step 3: Disciplinas ───────────────────────────────────────
function StepDiscs({ turmas, onNext, onBack }) {
  // disciplinas por turma: { turmaIdx: [{nome, codigo, cor}] }
  const [byTurma, setByTurma] = useState(
    Object.fromEntries(turmas.map((_,i)=>[i,[]]))
  );
  const [ativaTurma, setAtivaTurma] = useState(0);

  const discs = byTurma[ativaTurma] || [];
  const upd   = (fn) => setByTurma(b=>({...b,[ativaTurma]:fn(b[ativaTurma]||[])}));
  const addSug = (sug) => {
    if (discs.some(d=>d.codigo===sug.codigo)) return;
    upd(d=>[...d,{...sug}]);
  };
  const addBlank = () => upd(d=>[...d,{nome:'',codigo:'',cor:'#7c3aed'}]);
  const rem   = (i) => upd(d=>d.filter((_,j)=>j!==i));
  const updD  = (i,k,v) => upd(d=>d.map((x,j)=>j===i?{...x,[k]:v}:x));

  const ok = turmas.every((_,i)=>(byTurma[i]||[]).length>0);

  return (
    <div>
      <div style={{ fontSize:'2rem', marginBottom:8 }}>📚</div>
      <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.5rem', color:'#f0eaff', marginBottom:6 }}>Disciplinas</h2>
      <p style={{ color:'#6b5a8a', fontSize:'0.875rem', marginBottom:20 }}>Defina as disciplinas de cada turma.</p>

      {/* Tab de turma */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {turmas.map((t,i)=>(
          <button key={i} onClick={()=>setAtivaTurma(i)} style={{
            padding:'7px 14px', borderRadius:99, border:`1px solid ${ativaTurma===i?t.cor+'88':'#2a1650'}`,
            background: ativaTurma===i?`${t.cor}22`:'transparent',
            color: ativaTurma===i?t.cor:'#6b5a8a', cursor:'pointer', fontFamily:'inherit',
            fontSize:'0.82rem', fontWeight:700,
          }}>{t.modulo} · {t.label}</button>
        ))}
      </div>

      {/* Sugestões rápidas */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:'0.72rem', color:'#6b5a8a', fontWeight:700, letterSpacing:2, marginBottom:8 }}>SUGESTÕES RÁPIDAS</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {DISC_SUGESTOES.map(s=>{
            const ativa = discs.some(d=>d.codigo===s.codigo);
            return (
              <button key={s.codigo} onClick={()=>addSug(s)} style={{
                padding:'5px 12px', borderRadius:99, fontSize:'0.78rem', fontWeight:600,
                cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                border:`1px solid ${ativa?s.cor+'88':'#2a1650'}`,
                background: ativa?`${s.cor}22`:'transparent',
                color: ativa?s.cor:'#6b5a8a',
              }}>
                {ativa?'✓ ':''}{s.nome.split(' ').slice(0,2).join(' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista editável */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
        {discs.map((d,i)=>(
          <div key={i} style={{ display:'flex', gap:8, alignItems:'center', background:'#1a0f2e', border:'1px solid #2a1650', borderRadius:10, padding:'10px 12px' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', background:d.cor, flexShrink:0, cursor:'pointer' }}
              onClick={()=>updD(i,'cor',CORES[(CORES.indexOf(d.cor)+1)%CORES.length])} title="Clique para trocar cor" />
            <Input value={d.nome} onChange={e=>updD(i,'nome',e.target.value)} placeholder="Nome da disciplina" style={{ flex:2 }} />
            <Input value={d.codigo} onChange={e=>updD(i,'codigo',e.target.value)} placeholder="Código" style={{ flex:1, fontFamily:'monospace' }} />
            <button onClick={()=>rem(i)} style={{ background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:'1rem',flexShrink:0 }}>×</button>
          </div>
        ))}
      </div>

      <button onClick={addBlank} style={{
        width:'100%', padding:'9px', border:'1px dashed #2a1650', borderRadius:10,
        background:'transparent', color:'#6b5a8a', cursor:'pointer', fontFamily:'inherit',
        fontSize:'0.83rem', marginBottom:28,
      }}>+ Disciplina personalizada</button>

      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="ghost" onClick={onBack}>← Voltar</Btn>
        <Btn disabled={!ok} onClick={()=>onNext(byTurma)}>Finalizar →</Btn>
      </div>
    </div>
  );
}

// ── Step 4: Saving ────────────────────────────────────────────
function StepSaving({ status }) {
  return (
    <div style={{ textAlign:'center', padding:'40px 0' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:16 }}>{status==='done'?'🎉':'⏳'}</div>
      <h2 style={{ fontFamily:'DM Serif Display, serif', fontSize:'1.4rem', color:'#f0eaff', marginBottom:8 }}>
        {status==='done'?'Pronto! Bem-vinda ao Teachly':status==='error'?'Algo deu errado':'Criando seu espaço...'}
      </h2>
      <p style={{ color:'#6b5a8a', fontSize:'0.875rem' }}>
        {status==='done'
          ? 'Sua organização foi criada com sucesso. Recarregando...'
          : status==='error'
          ? 'Verifique o console do navegador e cole o erro para a gente resolver.'
          : 'Aguarde um momento.'}
      </p>
      {status!=='done' && (
        <div style={{ marginTop:24, display:'flex', justifyContent:'center', gap:6 }}>
          {[0,1,2].map(i=>(
            <div key={i} style={{
              width:8, height:8, borderRadius:'50%', background:'#7c3aed',
              animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`,
            }}/>
          ))}
        </div>
      )}
      <style>{`@keyframes pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1.2}}}`}</style>
    </div>
  );
}

// ── Wizard principal ──────────────────────────────────────────
export function Onboarding({ onDone }) {
  const [step,    setStep]    = useState(0);
  const [orgData, setOrgData] = useState(null);
  const [turmas,  setTurmas]  = useState([]);
  const [status,  setStatus]  = useState('saving');

  const save = async (discsByTurma) => {
    setStep(3);
    try {
      const { data:{ user } } = await supabase.auth.getUser();

      // 1. Cria organização
      const slug = orgData.nome.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
      const { data: org, error: orgErr } = await supabase.from('organizacoes')
        .insert({ nome: orgData.nome, slug, cidade: orgData.cidade, estado: orgData.estado, tipo: orgData.tipo, criado_por: user.id })
        .select().single();

      if (orgErr || !org) {
        console.error('Erro ao criar org:', orgErr);
        throw new Error(orgErr?.message || 'Falha ao criar organização. Verifique as policies RLS no Supabase.');
      }

      // 2. Vincula professor como admin
      await supabase.from('membros_organizacao')
        .insert({ organizacao_id: org.id, usuario_id: user.id, papel: 'admin' });

      // 3. Cria turmas e disciplinas
      for (let i = 0; i < turmas.length; i++) {
        const t = turmas[i];
        const key = `t${i+1}_${Date.now()}`;
        const { data: turma } = await supabase.from('turmas')
          .insert({
            organizacao_id: org.id,
            professor_id:   user.id,
            key,
            label:       t.label,
            modulo:      t.modulo,
            cor:         t.cor,
            has_desafio: t.hasDesafio,
            dot_class:   '',
            periodo:     '',
            ano:         new Date().getFullYear().toString(),
          }).select().single();

        const discs = discsByTurma[i] || [];
        if (discs.length) {
          await supabase.from('disciplinas').insert(
            discs.map((d, di) => ({
              organizacao_id: org.id,
              professor_id:   user.id,
              turma_id:       turma.id,
              key:            `d${di}_${Date.now()}`,
              nome:           d.nome,
              codigo:         d.codigo,
              cor_destaque:   d.cor,
              ativa:          true,
            }))
          );
        }
      }

      // 4. Atualiza perfil do usuario com nome da org
      await supabase.from('usuarios').upsert({
        id:    user.id,
        email: user.email,
        role:  `Professora · ${orgData.nome}`,
      });

      setStatus('done');
      setTimeout(() => onDone(), 1500);
    } catch(e) {
      console.error(e);
      setStatus('error');
    }
  };

  const cardStyle = {
    background:'#120820', border:'1px solid #2a1650',
    borderRadius:20, padding:'36px 32px', maxWidth:560, margin:'0 auto',
  };

  const stepLabels = ['Organização','Turmas','Disciplinas','Criando'];

  return (
    <div style={{
      minHeight:'100vh', background:'#0a0414',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      padding:'24px 20px', fontFamily:'DM Sans, sans-serif',
    }}>
      {/* Logo */}
      <div style={{ marginBottom:32, textAlign:'center' }}>
        <div style={{
          width:48, height:48, background:'linear-gradient(135deg,#6d28d9,#a855f7)',
          borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 8px 28px rgba(124,58,237,0.4)', marginBottom:12, position:'relative',
        }}>
          <span style={{ color:'white', fontSize:'1.3rem', fontWeight:900 }}>T</span>
        </div>
        <div style={{ color:'#f0eaff', fontSize:'1.1rem', fontWeight:700 }}>Teachly</div>
        <div style={{ color:'#6b5a8a', fontSize:'0.8rem' }}>Configuração inicial</div>
      </div>

      {/* Progress steps */}
      {step < 3 && (
        <div style={{ display:'flex', gap:0, marginBottom:28, alignItems:'center' }}>
          {stepLabels.slice(0,3).map((l,i)=>(
            <div key={l} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, fontSize:'0.8rem',
                  background: i<step?'#7c3aed':i===step?'linear-gradient(135deg,#7c3aed,#a855f7)':'#1a0f2e',
                  color: i<=step?'white':'#6b5a8a',
                  border: i===step?'none':'1px solid #2a1650',
                }}>{i<step?'✓':i+1}</div>
                <div style={{ fontSize:'0.68rem', color: i===step?'#a855f7':'#6b5a8a', fontWeight: i===step?700:400 }}>{l}</div>
              </div>
              {i<2 && <div style={{ width:40, height:1, background: i<step?'#7c3aed':'#2a1650', margin:'0 4px', marginBottom:18 }}/>}
            </div>
          ))}
        </div>
      )}

      {/* Card */}
      <div style={cardStyle}>
        {step===0 && <StepOrg onNext={d=>{ setOrgData(d); setStep(1); }} />}
        {step===1 && <StepTurmas onNext={t=>{ setTurmas(t); setStep(2); }} onBack={()=>setStep(0)} />}
        {step===2 && <StepDiscs turmas={turmas} onNext={save} onBack={()=>setStep(1)} />}
        {step===3 && <StepSaving status={status} />}
      </div>
    </div>
  );
}
