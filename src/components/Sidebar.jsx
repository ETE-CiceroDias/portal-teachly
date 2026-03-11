// components/Sidebar.jsx — Sidebar com modo geral + turma expandível
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';
import { useOrg }   from '../store/OrgContext.jsx';
import { COURSES }  from '../data/courses.js';
import { courseStats } from '../store/storage.js';

import {
  SquaresFour, Users, ClipboardText, CalendarBlank,
  Clock, Link, NotePencil, NoteBlank, Trophy,
  GearSix, SignOut, Sun, Moon, Student,
  CaretDown, CaretRight, Sparkle, Books, UsersThree,
} from '@phosphor-icons/react';

const IC = { size: 17, weight: 'regular' };

// Nav geral — sempre visível
const NAV_GERAL = [
  { tab:'dashboard',  Icon: SquaresFour,  label:'Dashboard'          },
  { tab:'calendario', Icon: CalendarBlank,label:'Calendário'          },
  { tab:'horario',    Icon: Clock,        label:'Horário'             },
  { tab:'alunos',     Icon: Student,      label:'Alunos'              },
  { tab:'atividades', Icon: NotePencil,   label:'Atividades'          },
  { tab:'notas',      Icon: Trophy,       label:'Notas'               },
  { tab:'links',      Icon: Link,         label:'Links Úteis'         },
  { tab:'anotacoes',  Icon: NoteBlank,    label:'Anotações'           },
];

// Nav por turma — aparece dentro da turma expandida
// Frequência removida: registrada no SIEP
const NAV_TURMA = [
  { tab:'grupos', Icon: UsersThree, label:'Grupos' },
];

export function Sidebar({ activeTab, onTabChange, activeTurmaId, onTurmaChange, onLogout, state, theme, onToggleTheme, open, onClose, collapsed, onToggleCollapse }) {
  const { org, turmas } = useOrg();

  const [nome,        setNome]        = useState('');
  const [photo,       setPhoto]       = useState(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  // Qual turma está expandida no sidebar (pode ser diferente da ativa globalmente)
  const [expandedId,  setExpandedId]  = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data:{ user } }) => {
      if (!user) return;
      supabase.from('usuarios').select('nome,avatar_url').eq('id', user.id).maybeSingle()
        .then(({ data }) => {
          if (data?.nome)       setNome(data.nome);
          if (data?.avatar_url) setPhoto(data.avatar_url);
        });
    });
  }, []);

  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Quando muda a turma ativa globalmente, expande ela no sidebar
  useEffect(() => {
    if (activeTurmaId) setExpandedId(activeTurmaId);
  }, [activeTurmaId]);

  const go = (tab) => { onTabChange(tab); setMenuOpen(false); onClose(); };

  const toggleExpand = (turmaId) => {
    if (expandedId === turmaId) {
      setExpandedId(null);
    } else {
      setExpandedId(turmaId);
      onTurmaChange(turmaId);
    }
  };

  // Tab atual pertence a qual turma/seção?
  const turmaTabActive = (turmaId) => {
    const t = turmas.find(x => x.id === turmaId);
    if (!t) return false;
    const discsAtivas = (t.disciplinas || []).filter(d => d.ativa);
    const turmaKey = t.key || t.id;
    return (
      NAV_TURMA.some(n => n.tab === activeTab) && activeTurmaId === turmaId
    ) || discsAtivas.some(d => d.id === activeTab || d.key === activeTab);
  };

  return (
    <>
      <div className={`sidebar-overlay${open?' open':''}`} onClick={onClose} />
      <aside className={`sidebar${open?' open':''}${collapsed?' collapsed':''}`}>

        {/* Botão colapsar (desktop) */}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? '›' : '‹'}
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-gem">
            <Sparkle size={18} weight="fill" color="white" />
          </div>
          <div>
            <div className="sidebar-title">Teachly</div>
            <div className="sidebar-subtitle">{org?.nome || '…'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">

          {/* ── Seção Geral ── */}
          <div className="nav-section-label">Geral</div>
          {NAV_GERAL.map(({ tab, Icon, label }) => (
            <button key={tab} className={`nav-item${activeTab===tab?' active':''}`}
              onClick={() => go(tab)}>
              <span className="nav-icon"><Icon {...IC} /></span>{label}
            </button>
          ))}

          {/* ── Turmas (cada uma expansível) ── */}
          <div className="nav-section-label" style={{ marginTop: 8 }}>Turmas</div>
          {turmas.map(t => {
            const isExpanded  = expandedId === t.id;
            const hasActivity = turmaTabActive(t.id);
            const discsAtivas = (t.disciplinas || []).filter(d => d.ativa);

            return (
              <div key={t.id}>
                {/* Turma header — clicável para expandir */}
                <button
                  className={`nav-item turma-expand-btn${hasActivity ? ' active' : ''}`}
                  onClick={() => toggleExpand(t.id)}
                  style={hasActivity ? { color: t.cor } : {}}
                >
                  <span className="nav-icon">
                    <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: t.cor, flexShrink:0 }} />
                  </span>
                  <span style={{ flex:1, textAlign:'left' }}>{t.modulo} · {t.label}</span>
                  {isExpanded
                    ? <CaretDown size={12} weight="bold" style={{ flexShrink:0, opacity:0.5 }} data-caret />
                    : <CaretRight size={12} weight="bold" style={{ flexShrink:0, opacity:0.35 }} data-caret />
                  }
                </button>

                {/* Sub-nav da turma — só aparece quando expandida */}
                {isExpanded && (
                  <div className="turma-subnav">
                    {/* Nav fixo da turma */}
                    {NAV_TURMA.map(({ tab, Icon, label }) => (
                      <button key={tab}
                        className={`nav-item nav-item-sub${activeTab===tab && activeTurmaId===t.id?' active':''}`}
                        onClick={() => { onTurmaChange(t.id); go(tab); }}>
                        <span className="nav-icon"><Icon size={15} /></span>{label}
                      </button>
                    ))}

                    {/* Disciplinas da turma */}
                    {discsAtivas.length > 0 && (
                      <>
                        <div className="nav-section-label" style={{ fontSize:'0.65rem', paddingLeft:28, marginTop:4 }}>Disciplinas</div>
                        {discsAtivas.map(disc => {
                          const isActive  = (activeTab === disc.id || activeTab === disc.key) && activeTurmaId === t.id;
                          const courseKey = disc.key in COURSES ? disc.key : null;
                          const stats     = courseKey ? courseStats(courseKey, t.key || '', COURSES, state) : null;
                          return (
                            <button key={disc.id}
                              className={`nav-item nav-item-sub${isActive?' active':''}`}
                              onClick={() => { onTurmaChange(t.id); go(disc.id); }}>
                              <span className="nav-icon">
                                <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background:disc.cor }} />
                              </span>
                              {disc.label}
                              {stats?.problems > 0 && <span className="nav-badge">{stats.problems}</span>}
                            </button>
                          );
                        })}
                      </>
                    )}


                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile dropdown */}
        <div className="sidebar-profile-area" ref={menuRef}>
          <button className="sidebar-profile-btn" onClick={() => setMenuOpen(o => !o)}>
            <div className="sidebar-avatar">
              {photo ? <img src={photo} alt="Foto" /> : '👩‍🏫'}
            </div>
            <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
              <div className="sidebar-prof-name">{nome || 'Professora'}</div>
              <div className="sidebar-prof-role">{org?.nome || '…'}</div>
            </div>
            <CaretDown size={12} weight="bold" color="var(--text3)"
              style={{ transition:'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {menuOpen && (
            <div className="profile-dropdown">
              <button className="profile-dropdown-item" onClick={() => go('profile')}>
                <GearSix size={16} weight="regular" /> Configurações & Perfil
              </button>
              <div className="profile-dropdown-divider" />
              <button className="profile-dropdown-item" onClick={() => { onToggleTheme(); setMenuOpen(false); }}>
                {theme === 'dark'
                  ? <Sun size={16} weight="regular" />
                  : <Moon size={16} weight="regular" />}
                {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              </button>
              <div className="profile-dropdown-divider" />
              <button className="profile-dropdown-item danger" onClick={() => { setMenuOpen(false); onLogout(); }}>
                <SignOut size={16} weight="regular" /> Sair
              </button>
            </div>
          )}
        </div>

      </aside>
    </>
  );
}