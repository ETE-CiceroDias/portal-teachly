// pages/Login.jsx — versão Supabase
import { useState } from 'react';
import { Auth } from '../store/storage.js';

export function Login() {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handle = async () => {
    if (!email.trim() || !pass.trim()) {
      setErr('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      await Auth.signIn(email.trim(), pass);
      // App.jsx detecta o login via onAuthChange automaticamente
    } catch (e) {
      setErr('E-mail ou senha incorretos.');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className={`login-card${shake ? ' anim-shake' : ''}`}>
        <div className="login-logo">
          <div className="login-gem">✦</div>
          <div>
            <div className="login-brand">Teachly</div>
            <div className="login-brand-sub">ETE Cícero Dias · DS</div>
          </div>
        </div>

        <div className="login-title">Bem-vinda de volta 👋</div>
        <div className="login-sub">Painel de gestão de aulas e turmas</div>

        <div className="login-field">
          <label className="login-label">E-mail</label>
          <input
            className="login-input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handle()}
            autoFocus
          />
        </div>

        <div className="login-field">
          <label className="login-label">Senha</label>
          <input
            className="login-input"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={e => { setPass(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && handle()}
          />
          {err && <div className="login-err">{err}</div>}
        </div>

        <button className="login-btn" onClick={handle} disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar no painel'}
        </button>

        <div className="login-hint">
          Primeiro acesso? Cadastre sua conta em{' '}
          <a href="https://supabase.com" target="_blank" rel="noopener" style={{ color: '#a78bfa' }}>
            Supabase → Authentication → Users
          </a>
        </div>
      </div>
    </div>
  );
}
