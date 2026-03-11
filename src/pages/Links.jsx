import { EmptyState } from '../components/EmptyState.jsx';
// pages/Links.jsx
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { ORG_ID } from '../data/ids.js';
import { PencilSimple, Trash, Plus, X } from '@phosphor-icons/react';



/* Categorias e ícones padrão */
const DEFAULT_LINKS = [
  {
    categoria: 'Sala de Aula',
    items: [
      { id: 1, nome: 'Google Classroom – Mod 1 Turma A', url: '', icon: '🎓', cor: '#4ade80' },
      { id: 2, nome: 'Google Classroom – Mod 1 Turma B', url: '', icon: '🎓', cor: '#4ade80' },
      { id: 3, nome: 'Google Classroom – Mod 3', url: '', icon: '🎓', cor: '#4ade80' },
    ],
  },
  {
    categoria: 'Design & Prototipação',
    items: [
      { id: 4, nome: 'Figma – Workspace da Escola', url: '', icon: '🎨', cor: '#f472b6' },
      { id: 5, nome: 'Canva – Templates Educacionais', url: '', icon: '✏️', cor: '#fb923c' },
    ],
  },
  {
    categoria: 'Desenvolvimento',
    items: [
      { id: 6, nome: 'GitHub – Organização da Turma', url: '', icon: '🐙', cor: '#a3a3a3' },
      { id: 7, nome: 'CodePen – Exemplos de Código', url: '', icon: '💻', cor: '#60a5fa' },
    ],
  },
  {
    categoria: 'Gestão',
    items: [
      { id: 8, nome: 'Google Drive – Materiais', url: '', icon: '📁', cor: '#fbbf24' },
      { id: 9, nome: 'Trello – Quadros de Projeto', url: '', icon: '📋', cor: '#60a5fa' },
    ],
  },
];

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {children}
      </div>
    </div>
    , document.body
  );
}

const ICON_OPTIONS = ['🎓','🎨','💻','🐙','📁','📋','🔗','🌐','📝','✏️','🚀','⚡','🛠️','📊','🎬','🖼️','📐','🌈'];
const COR_OPTIONS  = ['#c084fc','#f472b6','#4ade80','#60a5fa','#fbbf24','#fb923c','#a3a3a3','#2dd4bf','#e879f9','#f87171'];

export function Links() {
  const [data, setData] = useState(DEFAULT_LINKS);
  useEffect(() => {
    supabase.from('links').select('*').order('criado_em')
      .then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          // Reagrupa por categoria
          const cats = {};
          rows.forEach(r => {
            if (!cats[r.categoria]) cats[r.categoria] = { categoria: r.categoria, items: [] };
            cats[r.categoria].items.push(r);
          });
          setData(Object.values(cats));
        }
      });
  }, []);
  const [showModal, setShowModal] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [editLink, setEditLink]   = useState(null); // { catIdx, linkIdx }
  const [form, setForm]   = useState({ nome: '', url: '', icon: '🔗', cor: '#c084fc' });
  const [newCat, setNewCat] = useState('');

  const persist = (next) => { setData(next); saveLinks(next); };

  const openEdit = (catIdx, linkIdx) => {
    const link = data[catIdx].items[linkIdx];
    setEditLink({ catIdx, linkIdx });
    setForm({ nome: link.nome, url: link.url, icon: link.icon, cor: link.cor });
    setShowModal(true);
  };

  const openAdd = (catIdx) => {
    setEditLink({ catIdx, linkIdx: -1 });
    setForm({ nome: '', url: '', icon: '🔗', cor: '#c084fc' });
    setShowModal(true);
  };

  const salvar = () => {
    if (!form.nome.trim()) return;
    const { catIdx, linkIdx } = editLink;
    const next = data.map((cat, ci) => {
      if (ci !== catIdx) return cat;
      if (linkIdx === -1) {
        return { ...cat, items: [...cat.items, { ...form, id: Date.now(), url: form.url.trim() }] };
      }
      return { ...cat, items: cat.items.map((l, li) => li === linkIdx ? { ...l, ...form, url: form.url.trim() } : l) };
    });
    persist(next);
    setShowModal(false);
  };

  const excluirLink = (catIdx, linkIdx) => {
    const next = data.map((cat, ci) =>
      ci !== catIdx ? cat : { ...cat, items: cat.items.filter((_, li) => li !== linkIdx) }
    );
    persist(next);
  };

  const excluirCategoria = (catIdx) => {
    if (!confirm(`Excluir a categoria "${data[catIdx].categoria}" e todos os links?`)) return;
    persist(data.filter((_, ci) => ci !== catIdx));
  };

  const adicionarCategoria = () => {
    if (!newCat.trim()) return;
    persist([...data, { categoria: newCat.trim(), items: [] }]);
    setNewCat('');
    setShowAddCat(false);
  };

  const abrirLink = (url) => {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    window.open(href, '_blank', 'noopener');
  };

  return (
    <div className="anim-up">
      <div className="page-header">
        <div>
          <div className="page-title">Links Úteis</div>
          <div className="page-subtitle">Acesso rápido às ferramentas e recursos do dia a dia</div>
        </div>
        <button className="btn-ghost" onClick={() => setShowAddCat(true)}>+ Categoria</button>
      </div>

      {data.length === 0 && (
        <EmptyState icon="🔗" title="Nenhum link cadastrado"
          desc="Organize links úteis por categoria — ferramentas, referências, plataformas da escola."
          action="+ Adicionar categoria" onAction={() => setShowAddCat(true)} />
      )}
      {data.map((cat, ci) => (
        <div key={ci} style={{ marginBottom: 28 }}>
          {/* Categoria header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="section-label" style={{ marginBottom: 0, flex: 1 }}>{cat.categoria}</div>
            <button className="icon-btn-sm" onClick={() => openAdd(ci)} title="Adicionar link nesta categoria"><Plus size={13} weight="bold" /></button>
            <button className="icon-btn-sm danger" onClick={() => excluirCategoria(ci)} title="Excluir categoria"><Trash size={13} /></button>
          </div>

          {/* Cards de links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {cat.items.map((link, li) => (
              <div
                key={link.id || li}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--r-lg)',
                  padding: '16px',
                  cursor: link.url ? 'pointer' : 'default',
                  transition: 'border-color 0.18s, transform 0.18s, box-shadow 0.18s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = link.cor || 'var(--accent)';
                  if (link.url) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.25)`; }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => abrirLink(link.url)}
              >
                {/* Glow dot */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: `radial-gradient(circle, ${link.cor}22 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20,
                    background: `${link.cor}1a`,
                    border: `1px solid ${link.cor}30`,
                    marginBottom: 12,
                  }}>
                    {link.icon}
                  </div>

                  <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                    <button className="icon-btn-sm" onClick={() => openEdit(ci, li)} title="Editar"><PencilSimple size={12} /></button>
                    <button className="icon-btn-sm danger" onClick={() => excluirLink(ci, li)} title="Excluir"><Trash size={12} /></button>
                  </div>
                </div>

                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 4, lineHeight: 1.3 }}>
                  {link.nome}
                </div>

                {link.url ? (
                  <div style={{ fontSize: '0.72rem', color: link.cor, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>↗</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                      {link.url.replace('https://','').replace('http://','').split('/')[0]}
                    </span>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>
                    Clique em ✏️ para adicionar a URL
                  </div>
                )}
              </div>
            ))}

            {/* Add link card */}
            <button
              style={{
                background: 'none', border: '2px dashed var(--border)',
                borderRadius: 'var(--r-lg)', padding: 16,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 6, color: 'var(--text3)', cursor: 'pointer',
                minHeight: 110, fontSize: '0.8125rem', fontWeight: 500,
                transition: 'border-color 0.18s, color 0.18s, background 0.18s',
              }}
              onClick={() => openAdd(ci)}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent-light)'; e.currentTarget.style.background = 'var(--accent-faint)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 22 }}>+</span>
              <span>Adicionar link</span>
            </button>
          </div>
        </div>
      ))}

      {/* Modal editar/adicionar link */}
      {showModal && (
        <Modal
          title={editLink?.linkIdx === -1 ? 'Novo link' : 'Editar link'}
          onClose={() => setShowModal(false)}
        >
          <div className="modal-field">
            <div className="modal-label">Nome *</div>
            <input className="modal-input" placeholder="ex: Google Classroom – Turma A" value={form.nome} onChange={e => setForm(f=>({...f,nome:e.target.value}))} autoFocus />
          </div>
          <div className="modal-field">
            <div className="modal-label">URL</div>
            <input className="modal-input" placeholder="https://..." value={form.url} onChange={e => setForm(f=>({...f,url:e.target.value}))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="modal-field">
              <div className="modal-label">Ícone</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                {ICON_OPTIONS.map(ic => (
                  <button
                    key={ic}
                    onClick={() => setForm(f=>({...f,icon:ic}))}
                    style={{
                      width: 34, height: 34, borderRadius: 8, fontSize: 18,
                      background: form.icon === ic ? 'var(--accent-faint)' : 'var(--surface3)',
                      border: `1.5px solid ${form.icon === ic ? 'var(--accent)' : 'transparent'}`,
                      cursor: 'pointer',
                    }}
                  >{ic}</button>
                ))}
              </div>
            </div>
            <div className="modal-field">
              <div className="modal-label">Cor</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {COR_OPTIONS.map(cor => (
                  <button
                    key={cor}
                    onClick={() => setForm(f=>({...f,cor}))}
                    style={{
                      width: 28, height: 28, borderRadius: '50%', background: cor,
                      border: `2.5px solid ${form.cor === cor ? 'white' : 'transparent'}`,
                      cursor: 'pointer', boxShadow: form.cor === cor ? `0 0 0 2px ${cor}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={salvar}>Salvar</button>
          </div>
        </Modal>
      )}

      {/* Modal nova categoria */}
      {showAddCat && (
        <Modal title="Nova categoria" onClose={() => setShowAddCat(false)}>
          <div className="modal-field">
            <div className="modal-label">Nome da categoria</div>
            <input className="modal-input" placeholder="ex: Ferramentas de IA" value={newCat} onChange={e => setNewCat(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && adicionarCategoria()} />
          </div>
          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setShowAddCat(false)}>Cancelar</button>
            <button className="btn-primary" onClick={adicionarCategoria}>Criar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}