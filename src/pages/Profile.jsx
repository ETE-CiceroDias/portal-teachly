// pages/Profile.jsx — Perfil + Configurações completas
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg }   from '../store/OrgContext.jsx';
import { GerenciarDiscs } from './GerenciarDiscs.jsx';
import { Admin }    from './Admin.jsx';
import { User, GraduationCap, Wrench, Gear, Sun, Moon, SignOut, Trash, Buildings, InstagramLogo, LinkedinLogo, GithubLogo, EnvelopeSimple } from '@phosphor-icons/react';

const TABS = [
  { id:'perfil', icon:<User size={15} />,          label:'Meu Perfil' },
  { id:'turmas', icon:<GraduationCap size={15} />, label:'Turmas & Disciplinas' },
  { id:'admin',  icon:<Wrench size={15} />,        label:'Painel Admin' },
  { id:'convite',icon:<span style={{fontSize:'0.9em'}}>🔑</span>, label:'Convite' },
  { id:'conta',  icon:<Gear size={15} />,          label:'Conta & App' },
];

const DEFAULT = { nome:'', role:'', bio:'', instagram:'', linkedin:'', github:'', email:'', avatar_url:'' };

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const TIPOS   = [
  { value:'escola',    label:'Escola / Colégio' },
  { value:'instituto', label:'Instituto Técnico' },
  { value:'faculdade', label:'Faculdade / Universidade' },
  { value:'curso',     label:'Curso Livre' },
  { value:'outro',     label:'Outro' },
];

// ── Sub-aba: Link de convite da org ─────────────────────────
function ConviteOrg({ org }) {
  const [copied, setCopied] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [code, setCode] = useState(org?.codigo_convite || '');

  const baseUrl = window.location.origin;
  const link    = `${baseUrl}?convite=${code}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied('code');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const regenerar = async () => {
    if (!org?.id) return;
    setRegenerando(true);
    const newCode = Math.random().toString(36).substring(2,8).toUpperCase();
    const { error } = await supabase.from('organizacoes')
      .update({ codigo_convite: newCode }).eq('id', org.id);
    if (!error) setCode(newCode);
    setRegenerando(false);
  };

  if (!org) return null;

  return (
    <div className="profile-card">
      <div className="profile-card-title">🔑 Convite para a organização</div>
      <div style={{ fontSize:'0.82rem', color:'var(--text3)', marginBottom:16, lineHeight:1.6 }}>
        Compartilhe o link abaixo com outros professores para que eles entrem na organização <strong style={{color:'var(--text)'}}>{org.nome}</strong>.
      </div>

      {/* Link completo */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text3)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Link de convite</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{
            flex:1, background:'var(--surface2)', border:'1px solid var(--border)',
            borderRadius:8, padding:'8px 12px', fontSize:'0.78rem', color:'var(--text3)',
            fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{link}</div>
          <button onClick={copiarLink} style={{
            background: copied === true ? 'var(--green-bg)' : 'var(--surface2)',
            border:'1px solid var(--border)', borderRadius:8, padding:'8px 14px',
            color: copied === true ? 'var(--green)' : 'var(--text2)',
            fontSize:'0.8rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0,
          }}>
            {copied === true ? '✓ Copiado!' : '📋 Copiar link'}
          </button>
        </div>
      </div>

      {/* Código curto */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div>
          <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text3)', letterSpacing:2, textTransform:'uppercase', marginBottom:6 }}>Ou compartilhe só o código</div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{
              background:'var(--surface2)', border:'1px solid var(--border)',
              borderRadius:8, padding:'8px 16px', fontSize:'1.3rem', fontWeight:800,
              color:'var(--accent3)', fontFamily:'monospace', letterSpacing:6,
            }}>{code}</div>
            <button onClick={copiarCodigo} style={{
              background: copied === 'code' ? 'var(--green-bg)' : 'var(--surface2)',
              border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px',
              color: copied === 'code' ? 'var(--green)' : 'var(--text3)',
              fontSize:'0.78rem', cursor:'pointer',
            }}>
              {copied === 'code' ? '✓' : '📋'}
            </button>
            <button onClick={regenerar} disabled={regenerando} title="Gerar novo código (invalida o anterior)" style={{
              background:'none', border:'1px solid var(--border)', borderRadius:8,
              padding:'8px 12px', color:'var(--text3)', fontSize:'0.75rem',
              cursor:'pointer', opacity: regenerando ? 0.5 : 1,
            }}>
              {regenerando ? '...' : '🔄 Novo código'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop:14, fontSize:'0.75rem', color:'var(--text3)', lineHeight:1.5 }}>
        ⚠ Qualquer pessoa com este link pode entrar como professor. Use "Novo código" para invalidar o atual se necessário.
      </div>
    </div>
  );
}

// ── Sub-aba: Editar Organização ──────────────────────────────
function EditarOrg({ org, reload }) {
  const [form,   setForm]   = useState({ nome:'', cidade:'', estado:'PE', tipo:'escola' });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState('');

  useEffect(() => {
    if (org) setForm({ nome: org.nome||'', cidade: org.cidade||'', estado: org.estado||'PE', tipo: org.tipo||'escola' });
  }, [org]);

  const save = async () => {
    if (!form.nome.trim()) { setErr('Nome obrigatório.'); return; }
    setSaving(true); setErr('');
    const { error } = await supabase.from('organizacoes').update({
      nome:   form.nome.trim(),
      cidade: form.cidade.trim(),
      estado: form.estado,
      tipo:   form.tipo,
    }).eq('id', org.id);
    if (error) setErr('Erro: ' + error.message);
    else { await reload(); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    setSaving(false);
  };

  return (
    <div className="profile-card">
      <div className="profile-card-title"><Buildings size={14} style={{marginRight:6}} />Dados da Organização</div>

      <label style={labelStyle}>Nome da instituição *</label>
      <input className="profile-input" value={form.nome}
        onChange={e => setForm(p=>({...p, nome:e.target.value}))}
        placeholder="ETE Cícero Dias" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:10 }}>
        <div>
          <label style={labelStyle}>Cidade</label>
          <input className="profile-input" value={form.cidade}
            onChange={e => setForm(p=>({...p, cidade:e.target.value}))}
            placeholder="Recife" />
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <select className="profile-input" value={form.estado}
            onChange={e => setForm(p=>({...p, estado:e.target.value}))}>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <label style={labelStyle}>Tipo de instituição</label>
      <select className="profile-input" value={form.tipo}
        onChange={e => setForm(p=>({...p, tipo:e.target.value}))}>
        {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {err && <div style={{ color:'var(--red)', fontSize:'0.82rem', marginTop:4 }}>{err}</div>}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:12 }}>
        <button className="save-profile-btn" onClick={save} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar organização'}
        </button>
        {saved && <span className="save-ok anim-fade">✓ Salvo!</span>}
      </div>
    </div>
  );
}

// ── Sub-aba: Apagar Conta ────────────────────────────────────
function ApagarConta({ onLogout }) {
  const [step,   setStep]   = useState(0); // 0 → 1 → 2
  const [input,  setInput]  = useState('');
  const [loading,setLoading]= useState(false);
  const [err,    setErr]    = useState('');

  const CONFIRM_WORD = 'APAGAR';

  const handleApagar = async () => {
    setLoading(true); setErr('');
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      // Remove dados do usuário
      await supabase.from('membros_organizacao').delete().eq('usuario_id', user.id);
      await supabase.from('usuarios').delete().eq('id', user.id);
      // Faz logout (conta auth permanece — Supabase Admin API necessário para deletar auth user)
      await supabase.auth.signOut();
      onLogout();
    } catch (e) {
      setErr('Erro: ' + e.message);
      setLoading(false);
    }
  };

  return (
    <div className="profile-card" style={{ borderColor:'var(--red-border)', background:'var(--red-bg)' }}>
      <div className="profile-card-title" style={{ color:'var(--red)', display:'flex', alignItems:'center', gap:6 }}><Trash size={14} />Apagar conta</div>

      {step === 0 && (
        <>
          <p style={{ fontSize:'0.875rem', color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>
            Esta ação remove seus dados pessoais e vínculo com a organização.<br/>
            <strong style={{ color:'var(--red)' }}>Ela não pode ser desfeita.</strong>
          </p>
          <button onClick={() => setStep(1)} style={{
            padding:'9px 20px', borderRadius:10, border:'1px solid var(--red-border)',
            background:'transparent', color:'var(--red)', cursor:'pointer',
            fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600,
          }}>
            Quero apagar minha conta
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <p style={{ fontSize:'0.875rem', color:'var(--text2)', lineHeight:1.6, marginBottom:16 }}>
            Tem certeza? Seus dados de frequência, grupos e configurações serão removidos.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep(0)} style={{
              padding:'9px 18px', borderRadius:10, border:'1px solid var(--border)',
              background:'var(--surface2)', color:'var(--text2)', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600,
            }}>Cancelar</button>
            <button onClick={() => setStep(2)} style={{
              padding:'9px 18px', borderRadius:10, border:'1px solid var(--red-border)',
              background:'rgba(248,113,113,0.15)', color:'var(--red)', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.875rem', fontWeight:700,
            }}>Sim, quero apagar</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p style={{ fontSize:'0.875rem', color:'var(--red)', fontWeight:600, marginBottom:8 }}>
            Digite <strong>{CONFIRM_WORD}</strong> para confirmar:
          </p>
          <input
            className="profile-input"
            style={{ borderColor:'var(--red-border)', marginBottom:12 }}
            placeholder={CONFIRM_WORD}
            value={input}
            onChange={e => setInput(e.target.value.toUpperCase())}
            autoFocus
          />
          {err && <div style={{ color:'var(--red)', fontSize:'0.82rem', marginBottom:8 }}>{err}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep(0); setInput(''); }} style={{
              padding:'9px 18px', borderRadius:10, border:'1px solid var(--border)',
              background:'var(--surface2)', color:'var(--text2)', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600,
            }}>Cancelar</button>
            <button
              onClick={handleApagar}
              disabled={input !== CONFIRM_WORD || loading}
              style={{
                padding:'9px 18px', borderRadius:10, border:'none',
                background: input === CONFIRM_WORD ? 'var(--red)' : 'var(--surface3)',
                color: input === CONFIRM_WORD ? 'white' : 'var(--text3)',
                cursor: input === CONFIRM_WORD ? 'pointer' : 'not-allowed',
                fontFamily:'inherit', fontSize:'0.875rem', fontWeight:700,
                transition:'all 0.15s',
              }}
            >
              {loading ? 'Apagando...' : '⚠ Apagar definitivamente'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = { fontSize:'0.75rem', fontWeight:700, color:'var(--text3)', letterSpacing:'0.08em', textTransform:'uppercase', display:'block', marginBottom:4, marginTop:12 };

// ── Profile principal ────────────────────────────────────────
export function Profile({ theme, onToggleTheme, onLogout }) {
  const { org, reload } = useOrg();
  const [tab,     setTab]     = useState('perfil');
  const [data,    setData]    = useState(DEFAULT);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => {
      if (!user) { setLoading(false); return; }
      supabase.from('usuarios').select('*').eq('id', user.id).maybeSingle()
        .then(({ data: perfil }) => {
          if (perfil) setData(d => ({ ...d, ...perfil }));
          setLoading(false);
        });
    });
  }, []);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const savePerfil = async () => {
    setSaving(true); setError('');
    try {
      const { data:{ user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const { error: err } = await supabase.from('usuarios').upsert({ id: user.id, ...data });
      if (err) throw err;
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { setError('Erro: ' + e.message); }
    finally { setSaving(false); }
  };

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('avatar_url', ev.target.result);
    reader.readAsDataURL(file);
  };

  if (loading) return <div style={{ color:'var(--text3)', padding:32 }}>Carregando...</div>;

  return (
    <div className="anim-up">
      <div className="page-header">
        <div className="page-title">Configurações</div>
      </div>

      {/* Tab bar */}
      <div style={{
        display:'flex', gap:2, marginBottom:28, flexWrap:'wrap',
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:14, padding:5,
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex:1, minWidth:110, padding:'9px 12px', borderRadius:10, border:'none',
            background: tab===t.id ? 'var(--accent-faint)' : 'transparent',
            color: tab===t.id ? 'var(--accent-light)' : 'var(--text3)',
            fontFamily:'inherit', fontSize:'0.82rem', fontWeight: tab===t.id ? 700 : 500,
            cursor:'pointer', transition:'all 0.15s',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6,
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Aba: Perfil ── */}
      {tab === 'perfil' && (
        <>
          <div className="profile-hero">
            <div className="profile-avatar-lg">
              {data.avatar_url ? <img src={data.avatar_url} alt="Foto" /> : <span>👩‍🏫</span>}
              <label className="upload-label" title="Trocar foto">
                📷<input type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhoto} />
              </label>
            </div>
            <div>
              <div className="profile-name-lg">{data.nome || 'Professora'}</div>
              <div className="profile-role-lg">{data.role}</div>
              {(data.instagram||data.linkedin||data.github||data.email) && (
                <div className="profile-socials">
                  {data.instagram && <a href={`https://instagram.com/${data.instagram.replace('@','')}`} target="_blank" rel="noopener" className="social-chip"><InstagramLogo size={13} /> {data.instagram}</a>}
                  {data.linkedin  && <a href={data.linkedin.startsWith('http')?data.linkedin:`https://${data.linkedin}`} target="_blank" rel="noopener" className="social-chip"><LinkedinLogo size={13} /> LinkedIn</a>}
                  {data.github    && <a href={data.github.startsWith('http')?data.github:`https://${data.github}`} target="_blank" rel="noopener" className="social-chip"><GithubLogo size={13} /> GitHub</a>}
                  {data.email     && <a href={`mailto:${data.email}`} className="social-chip"><EnvelopeSimple size={13} /> {data.email}</a>}
                </div>
              )}
            </div>
          </div>

          <div className="profile-cards">
            <div className="profile-card">
              <div className="profile-card-title" style={{display:'flex',alignItems:'center',gap:6}}><User size={14} />Dados Pessoais</div>
              <input className="profile-input" placeholder="Nome completo" value={data.nome||''} onChange={e=>set('nome',e.target.value)} />
              <input className="profile-input" placeholder="Cargo / Função" value={data.role||''} onChange={e=>set('role',e.target.value)} />
              <textarea className="profile-input" placeholder="Bio / Apresentação..." value={data.bio||''} onChange={e=>set('bio',e.target.value)} rows={4} style={{ resize:'vertical' }} />
            </div>
            <div className="profile-card">
              <div className="profile-card-title" style={{display:'flex',alignItems:'center',gap:6}}><EnvelopeSimple size={14} />Redes Sociais</div>
              {[
                { key:'instagram', icon:<InstagramLogo size={13} />, label:'Instagram', ph:'@seu.perfil' },
                { key:'linkedin',  icon:<LinkedinLogo size={13} />,  label:'LinkedIn',  ph:'linkedin.com/in/...' },
                { key:'github',    icon:<GithubLogo size={13} />,    label:'GitHub',    ph:'github.com/...' },
                { key:'email',     icon:<EnvelopeSimple size={13} />,label:'E-mail',    ph:'seu@email.com' },
              ].map(s => (
                <input key={s.key} className="profile-input"
                  placeholder={`${s.icon} ${s.label} — ${s.ph}`}
                  value={data[s.key]||''} onChange={e=>set(s.key,e.target.value)} />
              ))}
            </div>
          </div>

          <div style={{ marginTop:20, display:'flex', alignItems:'center', gap:12 }}>
            <button className="save-profile-btn" onClick={savePerfil} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar perfil'}
            </button>
            {saved && <span className="save-ok anim-fade">✓ Salvo!</span>}
            {error && <span style={{ color:'var(--red)', fontSize:'0.85rem' }}>{error}</span>}
          </div>
        </>
      )}

      {/* ── Aba: Turmas & Disciplinas ── */}
      {tab === 'turmas' && <GerenciarDiscs />}

      {/* ── Aba: Painel Admin ── */}
      {tab === 'admin' && <Admin />}

      {/* ── Aba: Conta & App ── */}
      {tab === 'conta' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:700, width:'100%' }}>

          {/* Editar Org */}
          {org && <EditarOrg org={org} reload={reload} />}

          {/* Aparência */}
          <div className="profile-card">
            <div className="profile-card-title" style={{display:'flex',alignItems:'center',gap:6}}><Sun size={14} />Aparência</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text)' }}>Tema</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text3)' }}>
                  {theme === 'dark' ? 'Modo escuro ativo' : 'Modo claro ativo'}
                </div>
              </div>
              <button onClick={onToggleTheme} style={{
                padding:'8px 18px', borderRadius:99, border:'1px solid var(--border)',
                background:'var(--surface2)', color:'var(--text2)', cursor:'pointer',
                fontFamily:'inherit', fontSize:'0.85rem', fontWeight:600, transition:'all 0.15s',
              }}>
                {theme === 'dark' ? <><Sun size={15} style={{marginRight:5}} />Modo claro</> : <><Moon size={15} style={{marginRight:5}} />Modo escuro</>}
              </button>
            </div>
          </div>

          {/* Sessão */}
          <div className="profile-card">
            <div className="profile-card-title" style={{display:'flex',alignItems:'center',gap:6}}><SignOut size={14} />Sessão</div>
            <p style={{ fontSize:'0.875rem', color:'var(--text3)', marginBottom:12 }}>
              Encerra sua sessão atual e volta para o login.
            </p>
            <button onClick={onLogout} style={{
              padding:'9px 20px', borderRadius:10, border:'1px solid var(--border)',
              background:'var(--surface2)', color:'var(--text2)', cursor:'pointer',
              fontFamily:'inherit', fontSize:'0.875rem', fontWeight:600,
            }}>
              <SignOut size={15} style={{marginRight:6}} />Sair da conta
            </button>
          </div>

          {/* Apagar conta */}
          <ApagarConta onLogout={onLogout} />

        </div>
      )}
    </div>
  );
}