// App.jsx — versão Supabase com OrgContext + Onboarding
import { useState, useEffect, useCallback } from 'react';
import { Auth, EstadoAulas } from './store/storage.js';
import { supabase }          from './lib/supabase.js';
import { COURSES }           from './data/courses.js';
import { OrgProvider, useOrg } from './store/OrgContext.jsx';

import { Login }             from './pages/Login.jsx';
import { Onboarding }        from './pages/Onboarding.jsx';
import { Dashboard }         from './pages/Dashboard.jsx';
import { CoursePage }        from './pages/CoursePage.jsx';
import { Profile }           from './pages/Profile.jsx';
import { Grupos }            from './pages/Grupos.jsx';
import { Calendario }        from './pages/Calendario.jsx';
import { Horario }           from './pages/Horario.jsx';

import { Frequencia }        from './pages/Frequencia.jsx';
import { Alunos }            from './pages/Alunos.jsx';
import { Links }             from './pages/Links.jsx';
import { AtividadesProjetos }from './pages/AtividadesProjetos.jsx';
import { Notas }             from './pages/Notas.jsx';
import { GerenciarDiscs }    from './pages/GerenciarDiscs.jsx';
import { Admin }             from './pages/Admin.jsx';
import { Anotacoes }         from './pages/Anotacoes.jsx';
import { initTheme, setTheme, getTheme } from './store/theme.js';
import { Sidebar }           from './components/Sidebar.jsx';

// ── Shell interno (tem acesso ao OrgContext) ──────────────────
function AppShell({ user }) {
  const { turmas, pronto, loading, reload } = useOrg();

  const [state,       setState]       = useState({});
  const [activeTab,   setActiveTab]   = useState('dashboard');
  const [prevTab,     setPrevTab]     = useState('dashboard');
  const [activeTurma, setActiveTurma] = useState(null); // ID do banco
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setThemeState] = useState(() => initTheme());

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next); setThemeState(next);
  };

  // Quando turmas carregam, define turma ativa como a primeira
  useEffect(() => {
    if (turmas.length > 0 && !activeTurma) {
      setActiveTurma(turmas[0].id);
    }
  }, [turmas]);

  // Carrega estado de TODAS as turmas (para Dashboard global) e mescla
  useEffect(() => {
    if (!user || turmas.length === 0) { setState({}); return; }
    EstadoAulas.loadAll().then(s => setState(s));
  }, [user, turmas]);

  const persist = useCallback((updater) => {
    setState(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  // id = chave completa do estado, ex: 'dcu_mod1a_AULA_01'
  // Passamos ela inteira para o banco como state_key — sem split frágil
  const handleToggle = useCallback((id) => {
    persist(prev => {
      const cur  = prev[id] || {};
      const done = !cur.done;
      EstadoAulas.save(activeTurma, id, { done });
      return { ...prev, [id]: { ...cur, done } };
    });
  }, [persist, activeTurma]);

  const handleSave = useCallback((id, form) => {
    persist(prev => {
      EstadoAulas.save(activeTurma, id, form);
      return { ...prev, [id]: { ...(prev[id] || {}), ...form } };
    });
  }, [persist, activeTurma]);

  const handleLogout = async () => { await Auth.signOut(); };

  // Onboarding se não tem org ainda
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0720', color:'#7c3aed' }}>
      Carregando...
    </div>
  );

  if (!pronto) return <Onboarding onDone={() => reload()} />;

  const turmaAtiva   = turmas.find(t => t.id === activeTurma) || turmas[0];
  const turmaKey     = turmaAtiva?.key || turmaAtiva?.id || '';
  const discsAtivas  = (turmaAtiva?.disciplinas || []).filter(d => d.ativa);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':   return <Dashboard state={state} onNavigate={t=>{ setActiveTab(t); setSidebarOpen(false); }} />;
      case 'profile':     return <Profile theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />;
      case 'grupos':      return <Grupos activeTurma={turmaAtiva?.id} turmaKey={turmaKey} />;
      case 'calendario':  return <Calendario />;
      case 'horario':     return <Horario />;
      case 'frequencia':  return <Frequencia activeTurma={turmaAtiva?.id} turmaKey={turmaKey} />;
      case 'alunos':      return <Alunos />;
      case 'links':       return <Links />;
      case 'atividades':  return <AtividadesProjetos />;
      case 'notas':       return <Notas />;

      case 'disciplinas': return <GerenciarDiscs />;
      case 'admin':       return <Admin />;
      case 'anotacoes':   return <Anotacoes onBack={() => setActiveTab(prevTab || 'dashboard')} />;
      default:
        // Disciplina pelo ID ou key
        const disc = discsAtivas.find(d => d.id === activeTab || d.key === activeTab);
        if (disc) {
          // casa pelo código (DE_232 → dcu) ou pelo nome
          const match = Object.values(COURSES).find(c =>
            c.code === disc.code ||
            c.fullname?.toLowerCase() === disc.label?.toLowerCase() ||
            c.label?.toLowerCase() === disc.label?.toLowerCase()
          );
          const courseKey = match?.key || disc.key;
          return (
            <CoursePage
              courseKey={courseKey || disc.key}
              discId={disc.id}
              discBlocos={disc.blocos || []}
              discLabel={disc.label}
              discCode={disc.code}
              activeTurma={turmaKey}
              state={state}
              onToggle={handleToggle}
              onSave={handleSave}
              onReorder={(bi, fi, ti) => {
                if (!courseKey) return;
                const course = COURSES[courseKey];
                const bloco  = course.blocos[bi];
                const orderKey = `${courseKey}_${turmaKey}_order_b${bi}`;
                const cur  = state[orderKey] || bloco.aulas.map((_,i)=>i);
                const next = [...cur];
                const [moved] = next.splice(fi, 1);
                next.splice(ti, 0, moved);
                persist(prev => ({ ...prev, [orderKey]: next }));
              }}
            />
          );
        }
        return <Dashboard state={state} activeTurma={turmaKey} onNavigate={t=>setActiveTab(t)} />;
    }
  };

  return (
    <div className="app-shell">
      <div className="blob-mid" aria-hidden="true" />
      <div className="blob-tr"  aria-hidden="true" />
      <Sidebar
        activeTab={activeTab}
        onTabChange={t => { setPrevTab(activeTab); setActiveTab(t); setSidebarOpen(false); }}
        activeTurmaId={activeTurma}
        onTurmaChange={id => { setActiveTurma(id); setActiveTab('dashboard'); }}
        onLogout={handleLogout}
        state={state}
        theme={theme}
        onToggleTheme={toggleTheme}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />
      <div className="main-content">
        {/* Topbar mobile */}
        <div className="mobile-topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>☰</button>
          <div className="mobile-brand">Teachly</div>
          <div style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--text3)' }}>{turmaAtiva?.label}</div>
        </div>
        {/* Topbar desktop — só aparece em telas grandes */}
        <div className="desktop-topbar">
          <button
            className="topbar-toggle-btn"
            onClick={() => setSidebarCollapsed(c => !c)}
            title={sidebarCollapsed ? 'Mostrar menu' : 'Esconder menu'}
          >
            {sidebarCollapsed ? '▶▶' : '◀◀'}
          </button>
          <div className="desktop-topbar-spacer" />
          {turmaAtiva && (
            <div style={{ fontSize:'0.78rem', color:'var(--text3)', display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:turmaAtiva.cor, display:'inline-block' }} />
              {turmaAtiva.modulo} · {turmaAtiva.label}
            </div>
          )}
        </div>
        <div className="page-wrap">{renderPage()}</div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    Auth.getUser().then(u => setUser(u ?? null));
    const sub = Auth.onAuthChange(u => setUser(u));
    return () => sub.unsubscribe();
  }, []);

  if (user === undefined) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0f0720', color:'#7c3aed' }}>
      Carregando...
    </div>
  );

  if (!user) return <Login />;

  return (
    <OrgProvider user={user}>
        <AppShell user={user} />
      </OrgProvider>
  );
}