// pages/Login.jsx — Login + Cadastro
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const S = {
  wrap: {
    minHeight: '100vh', background: '#0a0414',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '24px 20px', fontFamily: 'DM Sans, sans-serif',
  },
  card: {
    background: '#120820', border: '1px solid #2a1650',
    borderRadius: 20, padding: '40px 36px',
    width: '100%', maxWidth: 420,
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32,
  },
  gem: {
    width: 40, height: 40, borderRadius: 12,
    background: 'linear-gradient(135deg,#6d28d9,#a855f7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1rem', fontWeight: 900, color: 'white',
    boxShadow: '0 6px 20px rgba(124,58,237,0.4)',
  },
  brand: { fontSize: '1.1rem', fontWeight: 700, color: '#f0eaff', lineHeight: 1.2 },
  sub:   { fontSize: '0.75rem', color: '#6b5a8a' },
  title: { fontSize: '1.3rem', fontWeight: 700, color: '#f0eaff', marginBottom: 6 },
  hint:  { fontSize: '0.8rem', color: '#6b5a8a', marginBottom: 28, lineHeight: 1.5 },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#6b5a8a', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input: {
    width: '100%', background: '#080212', border: '1px solid #2a1650',
    borderRadius: 10, padding: '11px 14px', color: '#f0eaff',
    fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', marginBottom: 14, transition: 'border-color 0.2s',
  },
  btn: {
    width: '100%', padding: '13px', borderRadius: 11, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
    fontSize: '0.95rem', marginTop: 4,
    background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
    color: 'white', boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
    transition: 'opacity 0.2s',
  },
  err: { color: '#f87171', fontSize: '0.8rem', marginTop: -8, marginBottom: 10 },
  toggle: {
    marginTop: 20, textAlign: 'center', fontSize: '0.83rem', color: '#6b5a8a',
  },
  toggleBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#a78bfa', fontWeight: 700, fontFamily: 'inherit', fontSize: '0.83rem',
  },
};

export function Login() {
  const [mode,  setMode]  = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [nome,  setNome]  = useState('');
  const [err,   setErr]   = useState('');
  const [ok,    setOk]    = useState('');
  const [loading, setLoading] = useState(false);

  // Lê ?convite=XXXX da URL para pré-preencher depois do cadastro
  const conviteCode = new URLSearchParams(window.location.search).get('convite') || '';

  const handleLogin = async () => {
    if (!email.trim() || !pass.trim()) { setErr('Preencha e-mail e senha.'); return; }
    setLoading(true); setErr('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass });
      if (error) throw error;
    } catch (e) {
      setErr('E-mail ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!nome.trim()) { setErr('Informe seu nome.'); return; }
    if (!email.trim()) { setErr('Informe seu e-mail.'); return; }
    if (pass.length < 6) { setErr('Senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true); setErr('');
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: { data: { nome: nome.trim() } },
      });
      if (error) throw error;
      // Salva nome no perfil imediatamente se user já confirmado
      if (data.user) {
        await supabase.from('usuarios').upsert({
          id: data.user.id, email: email.trim(), nome: nome.trim(),
        });
      }
      // Se tiver código de convite na URL, guarda no localStorage para o onboarding pegar
      if (conviteCode) localStorage.setItem('teachly_convite', conviteCode);
      setOk('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
      setMode('login');
    } catch (e) {
      setErr(e.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handle = mode === 'login' ? handleLogin : handleSignup;

  return (
    <div style={S.wrap}>
      <div style={{ ...S.card, position:'relative', zIndex:1 }}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.gem}>T</div>
          <div>
            <div style={S.brand}>Teachly</div>
            <div style={S.sub}>Gestão de aulas e turmas</div>
          </div>
        </div>

        {/* Título */}
        <div style={S.title}>
          {mode === 'login' ? 'Bem-vinda de volta 👋' : 'Criar conta'}
        </div>
        <div style={S.hint}>
          {mode === 'login'
            ? 'Acesse seu painel de gestão.'
            : conviteCode
              ? `Você foi convidada para uma organização. Complete o cadastro para entrar.`
              : 'Preencha os dados para começar.'}
        </div>

        {/* Campos */}
        {mode === 'signup' && (
          <div>
            <label style={S.label}>Seu nome</label>
            <input style={S.input} value={nome} onChange={e=>{setNome(e.target.value);setErr('');}}
              placeholder="Ex: Samara Lima" autoFocus />
          </div>
        )}
        <div>
          <label style={S.label}>E-mail</label>
          <input style={S.input} type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&handle()} placeholder="seu@email.com"
            autoFocus={mode==='login'} />
        </div>
        <div>
          <label style={S.label}>Senha</label>
          <input style={S.input} type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&handle()} placeholder="••••••••" />
        </div>

        {err && <div style={S.err}>{err}</div>}
        {ok  && <div style={{ ...S.err, color:'#4ade80' }}>{ok}</div>}

        <button style={{ ...S.btn, opacity: loading ? 0.6 : 1 }} onClick={handle} disabled={loading}>
          {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
        </button>

        <div style={S.toggle}>
          {mode === 'login' ? (
            <>Não tem conta?{' '}
              <button style={S.toggleBtn} onClick={()=>{setMode('signup');setErr('');setOk('');}}>
                Criar conta
              </button>
            </>
          ) : (
            <>Já tem conta?{' '}
              <button style={S.toggleBtn} onClick={()=>{setMode('login');setErr('');setOk('');}}>
                Entrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}